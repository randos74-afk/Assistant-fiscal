// Vérifie le moteur contre tests/cas-de-test.json (générés par tests/reference_calcul.py).
import { describe, expect, it } from "vitest";
import casDeTest from "../../tests/cas-de-test.json";
import { calculerDeclarant } from "./declarant";
import { materielAnnee, partSurface, ratioTemps } from "./teletravail";
import { arrondiEuro } from "./format";
import { chargerParametres } from "./parametres";
import {
  abattement,
  baremeKm,
  comparer,
  distanceAllerMinimale,
  distanceRetenue,
  kmDomicileTravail,
  materiel,
  plafondFraisReelsVehicule,
  repartirJoursParMois,
  repas,
  teletravailForfait,
} from "./calcul";

const p = chargerParametres(Number(casDeTest.millesime.replace("revenus-", "")));
const tolerance = casDeTest.tolerance_euros;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cas = { id: string; titre: string; entrees: any; attendu: any };

/** Calcule, pour un cas, les mêmes grandeurs que celles attendues. */
function calculer(c: Cas): Record<string, unknown> {
  const e = c.entrees;
  const famille = c.id.split("-")[0];
  switch (famille) {
    case "BAR": {
      const r = baremeKm(p, e);
      return { montant: r.montant, arrondi_euro: arrondiEuro(r.montant), cv_retenus: Number(r.ligne) };
    }
    case "ABT":
      return { abattement: abattement(p, e.salaire) };
    case "DIS":
      return { distance_retenue: distanceRetenue(p, e.aller_km, e.motif) };
    case "REP": {
      const r = repas(p, { nb: e.nb, prix: e.prix, partEmployeurTitreRestaurant: e.part_employeur_tr });
      return { montant: r.montant, montant_par_repas: r.parRepas };
    }
    case "TLT": {
      const jours_par_mois = e.jours_par_mois ?? repartirJoursParMois(e.total_jours, e.mois_travailles);
      return {
        jours_par_mois,
        montant: teletravailForfait(p, jours_par_mois).montant,
        montant_si_reparti_sur_12_mois: teletravailForfait(p, repartirJoursParMois(jours_par_mois.reduce((s: number, j: number) => s + j, 0))).montant,
      };
    }
    case "MAT": {
      if (e.annee_revenus) {
        const achat = { libelle: "", prixHT: e.prix_ht, usagePro: e.usage_pro, anneeAchat: e.annee_achat, moisAchat: e.mois_achat };
        return { montant: materielAnnee(p, achat, e.annee_revenus) };
      }
      const m = materiel(p, e.prix_ht, e.usage_pro, e.mois_utilises_annee_achat).montant;
      return { montant: m, montant_annee_1: m };
    }
    case "TLR":
      return {
        montant:
          e.charges *
          partSurface(p, e.surface_bureau ?? 0, e.surface_totale ?? 0, e.studio) *
          ratioTemps(p, e.usage, e.jours_tt, e.jours_travailles),
      };
    case "VHB":
      return { montant_retenu: plafondFraisReelsVehicule(p, e.km, e.frais_justifies).montant };
    case "RES":
      return calculerResume(c);
    case "ADM":
      return calculerAideDomicile(c);
    case "SEU": {
      const km_aller_min = {
        thermique: distanceAllerMinimale(p, e.salaire, e.jours, { cv: e.cv }),
        electrique: distanceAllerMinimale(p, e.salaire, e.jours, { cv: e.cv, electrique: true }),
      };
      return { km_aller_min };
    }
  }
  throw new Error(`Famille de cas inconnue : ${c.id}`);
}

/** Entrée de RES-01, réutilisée pour vérifier le texte de la spécification. */
const declarantRes01 = {
  numero: 1,
  salairePrerempli: 40000,
  vehicules: [{ type: "voiture" as const, energie: "diesel" as const, cv: 5, allerKm: 22, joursSurSite: 180 }],
  repas: [{ nb: 180, prix: 12, justification: "pas de cantine, déjeuner à domicile impossible" }],
  teletravailJoursParMois: repartirJoursParMois(38),
  autresFrais: [{ libelle: "documentation professionnelle", montant: 211 }],
};

function calculerResume(c: Cas): Record<string, unknown> {
  const e = c.entrees;
  if (c.id === "RES-01") {
    const km = kmDomicileTravail(p, e.aller_km, e.jours_sur_site);
    const fraisKm = baremeKm(p, { km, cv: e.cv }).montant;
    const fraisRepas = repas(p, e.repas).montant;
    const tlt = teletravailForfait(p, repartirJoursParMois(e.teletravail_jours)).montant;
    return {
      km,
      frais_km: fraisKm,
      repas: fraisRepas,
      teletravail: tlt,
      total: fraisKm + fraisRepas + tlt + e.documentation,
      montant_1AK: calculerDeclarant(p, declarantRes01).montantCase,
    };
  }
  const r = calculerDeclarant(p, {
    numero: 1,
    salairePrerempli: e.salaire_prerempli,
    vehicules: [
      {
        type: "voiture",
        energie: e.energie,
        cv: e.cv,
        allerKm: e.aller_km,
        motifDistance: e.motif,
        joursSurSite: e.jours_sur_site,
        kmMissions: e.km_missions,
        peagesParking: e.peages_parking,
        interetsCredit: e.interets_credit,
        kmTotauxCompteur: e.km_totaux_compteur,
      },
    ],
    repas: [{ nb: e.repas.nb, prix: e.repas.prix, partEmployeurTitreRestaurant: e.repas.part_employeur_tr }],
    teletravailJoursParMois: e.teletravail_jours_par_mois,
    autresFrais: [{ libelle: "cotisation syndicale", montant: e.cotisation_syndicale }],
    reintegrations: [{ libelle: "titres-restaurant part employeur", montant: e.reintegration_titres_restaurant }],
  });
  return {
    km: e.aller_km * 2 * e.jours_sur_site + e.km_missions,
    lignes: r.lignes.map((l) => l.montant),
    montant_1AK: r.montantCase,
    base_abattement_10: r.comparaison.baseAbattement10,
    base_frais_reels: r.comparaison.baseFraisReels,
    gain_base: r.comparaison.gainBase,
  };
}

function calculerAideDomicile(c: Cas): Record<string, unknown> {
  const e = c.entrees;
  if (e.base) {
    const base = (casDeTest.cas as Cas[]).find((x) => x.id === e.base)!.entrees;
    const km = base.km_par_jour * base.jours;
    const frais = baremeKm(p, { km, cv: base.cv }).montant + repas(p, { nb: e.repas_forfait, prix: null }).montant;
    const reint = base.km_rembourses_par_jour * base.jours * base.taux_ik;
    return { frais_reels: frais, gain_base: comparer(p, base.salaire_prerempli, reint, frais).gainBase };
  }
  if (e.km_par_mois) {
    const km = e.km_par_mois * e.mois;
    return {
      km_annuels: km,
      frais_reels: baremeKm(p, { km, cv: e.cv }).montant,
      reintegration: e.forfaits_transport_par_mois * e.mois,
    };
  }
  const km = e.km_par_jour * e.jours;
  const frais = baremeKm(p, { km, cv: e.cv }).montant;
  const reint = e.km_rembourses_par_jour * e.jours * e.taux_ik;
  const comp = comparer(p, e.salaire_prerempli, reint, frais);
  return {
    km_annuels: km,
    frais_reels: frais,
    reintegration: reint,
    base_abattement_10: comp.baseAbattement10,
    base_frais_reels: comp.baseFraisReels,
    gain_base: comp.gainBase,
  };
}

function verifier(obtenu: unknown, attendu: unknown, chemin: string) {
  if (typeof attendu === "number") {
    expect(typeof obtenu, chemin).toBe("number");
    expect(Math.abs((obtenu as number) - attendu), `${chemin} : obtenu ${obtenu}, attendu ${attendu}`).toBeLessThanOrEqual(
      tolerance + 1e-9,
    );
  } else if (attendu && typeof attendu === "object") {
    for (const [cle, valeur] of Object.entries(attendu)) {
      verifier((obtenu as Record<string, unknown>)?.[cle], valeur, `${chemin}.${cle}`);
    }
  } else {
    expect(obtenu, chemin).toEqual(attendu);
  }
}

describe(`Cas de test ${casDeTest.millesime}`, () => {
  it("contient bien les 42 cas", () => {
    expect(casDeTest.cas.length).toBe(42);
  });
  for (const c of casDeTest.cas as Cas[]) {
    it(`${c.id} — ${c.titre}`, () => verifier(calculer(c), c.attendu, c.id));
  }
});

describe("Détail des formules", () => {
  it("affiche la formule du barème comme l'exemple officiel", () => {
    expect(baremeKm(p, { km: 8000, cv: 4 }).formule).toBe("8 000 × 0,340 + 1 330 = 4 050 €");
  });
  it("signale un prix de repas élevé sans couper le montant", () => {
    const r = repas(p, { nb: 10, prix: 30 });
    expect(r.alertePrixEleve).toBe(true);
    expect(r.montant).toBeCloseTo(10 * (30 - p.repas.valeur_repas_au_foyer), 2);
  });
  it("applique le plafond mensuel du forfait télétravail et le signale", () => {
    const r = teletravailForfait(p, [30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(r.montant).toBeCloseTo(p.teletravail.plafond_mensuel, 2);
    expect(r.moisPlafonnes).toEqual([0]);
    expect(r.formule).toBe("forfait 2,70 € × 30 j, plafonné à 59,40 € sur 1 mois = 59 €");
  });
  it("refuse un forfait télétravail sans le détail des 12 mois", () => {
    expect(() => teletravailForfait(p, [38])).toThrow();
  });
  it("répartit un total annuel en jours entiers sur les mois travaillés", () => {
    const r = repartirJoursParMois(38);
    expect(r.reduce((s, j) => s + j, 0)).toBe(38);
    expect(Math.max(...r) - Math.min(...r)).toBeLessThanOrEqual(1);
  });
});

describe("Résumé 1AK (F8)", () => {
  it("reproduit le texte modèle de la spécification", () => {
    const r = calculerDeclarant(p, declarantRes01);
    expect(r.texte).toBe(
      [
        "Frais réels déclarant 1 : 5 714 € (case 1AK).",
        "Véhicule : voiture diesel 5 CV, 7 920 km dans l'année (domicile-travail 22 km x 2 x 180 j sur site), barème : 7 920 x 0,357 + 1 395 = 4 222 €.",
        "Péages et parking : 0 €. Intérêts crédit auto : 0 €.",
        "Repas : 180 repas x (12,00 - 5,45) = 1 179 €, pas de cantine, déjeuner à domicile impossible.",
        "Télétravail : forfait 2,70 € x 38 j = 102 €.",
        "Autres : documentation professionnelle 211 €.",
        "Salaire 1AJ majoré de 0 € (aucun remboursement employeur). Justificatifs conservés.",
      ].join("\n"),
    );
    expect(r.depasseLongueurCible).toBe(false);
  });
  it("garantit que la somme des lignes égale la case", () => {
    const r = calculerDeclarant(p, declarantRes01);
    expect(r.lignes.reduce((s, l) => s + l.montant, 0)).toBe(r.montantCase);
  });
  it("reprend le motif de distance et les réintégrations", () => {
    const r = calculerDeclarant(p, {
      numero: 2,
      salairePrerempli: 30000,
      vehicules: [{ type: "voiture", energie: "électrique", cv: 11, allerKm: 55, joursSurSite: 100, motifDistance: "emploi du conjoint" }],
      reintegrations: [{ libelle: "prime de transport", montant: 300 }],
    });
    expect(r.caseFraisReels).toBe("1BK");
    expect(r.texte).toContain("voiture électrique 11 CV (barème 7 CV), 11 000 km");
    expect(r.texte).toContain("Motifs : distance de 55 km retenue (emploi du conjoint).");
    expect(r.texte).toContain("Salaire 1AJ majoré de 300 € (prime de transport 300 €).");
  });
  it("ramène la distance à 40 km sans motif et le signale", () => {
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 30000,
      vehicules: [{ type: "voiture", energie: "essence", cv: 5, allerKm: 55, joursSurSite: 100 }],
    });
    expect(r.texte).toContain("8 000 km dans l'année (domicile-travail 40 km x 2 x 100 j sur site)");
    expect(r.alertes[0]).toContain("Distance ramenée de 55 à 40 km");
  });
  it("ne retient pas les intérêts sans kilométrage total, avec une alerte", () => {
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 30000,
      vehicules: [{ type: "voiture", energie: "essence", cv: 5, allerKm: 10, joursSurSite: 100, interetsCredit: 500 }],
    });
    expect(r.texte).toContain("Intérêts crédit auto : 0 €.");
    expect(r.alertes.some((a) => a.includes("Intérêts du crédit auto non retenus"))).toBe(true);
  });
});

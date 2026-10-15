// Vérifie le moteur contre tests/cas-de-test.json (générés par tests/reference_calcul.py).
import { describe, expect, it } from "vitest";
import casDeTest from "../../tests/cas-de-test.json";
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
      const m = materiel(p, e.prix_ht, e.usage_pro, e.mois_utilises_annee_achat).montant;
      return { montant: m, montant_annee_1: m };
    }
    case "VHB":
      return { montant_retenu: plafondFraisReelsVehicule(p, e.km, e.frais_justifies).montant };
    case "RES": {
      const km = kmDomicileTravail(p, e.aller_km, e.jours_sur_site);
      const fraisKm = baremeKm(p, { km, cv: e.cv }).montant;
      const fraisRepas = repas(p, e.repas).montant;
      const tlt = teletravailForfait(p, repartirJoursParMois(e.teletravail_jours)).montant;
      const total = fraisKm + fraisRepas + tlt + e.documentation;
      return { km, frais_km: fraisKm, repas: fraisRepas, teletravail: tlt, total, total_arrondi_1AK: arrondiEuro(total) };
    }
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
  it("contient bien les 35 cas", () => {
    expect(casDeTest.cas.length).toBe(35);
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

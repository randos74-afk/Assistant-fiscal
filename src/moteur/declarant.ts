// F8 — Calcul complet d'un déclarant et résumé pour la case 1AK (ou 1BK à 1DK).
// Chaque ligne est arrondie à l'euro inférieur ; le montant de la case est la somme de ces lignes.
import type { Parametres, TypeVehicule } from "./types";
import {
  baremeKm,
  comparer,
  distanceRetenue,
  kmDomicileTravail,
  kmPlusieursEmployeurs,
  repas,
  teletravailForfait,
  type Comparaison,
} from "./calcul";
import { arrondiEuro, euros, eurosCentimes, nombre } from "./format";
import { teletravailReel, type EntreeTeletravailReel } from "./teletravail";

/** « thermique » : énergie inconnue, valeur prudente (barème non majoré). */
export type Energie = "essence" | "diesel" | "hybride" | "GPL" | "hydrogène" | "électrique" | "thermique";

export interface EntreeVehicule {
  type: TypeVehicule;
  energie: Energie;
  /** Puissance fiscale de la carte grise (ignorée pour un cyclomoteur). */
  cv?: number;
  /** Libellé de la ligne choisie (« 7 CV et plus », « 3 à 5 CV »), repris dans le résumé. */
  libellePuissance?: string;
  allerKm: number;
  joursSurSite: number;
  allersRetoursParJour?: number;
  /** F3.4 — Circonstance particulière : la distance réelle est retenue au-delà de 40 km. */
  motifDistance?: string;
  /** F3.6 — Motif du second aller-retour quotidien. */
  motifDoubleAllerRetour?: string;
  /** F3.7 — Kilomètres de missions non remboursés. */
  kmMissions?: number;
  /** F6.8 — Allers-retours vers le domicile familial (double résidence), même véhicule. */
  kmDoubleResidence?: number;
  /**
   * F13 — Journées types d'intervention : premier et dernier tronçon en domicile-travail
   * (plafonnés sauf motif), tronçons entre personnes aidées en professionnel. Remplace allerKm.
   */
  journeesTypes?: JourneeType[];
  /** F12.6 — Un trajet par employeur ; remplace allerKm et joursSurSite. */
  trajetsEmployeurs?: TrajetEmployeur[];
  /** F3.8 — Kilométrage annuel saisi directement (relevé), remplace le calcul. */
  kmForce?: number;
  /** F3.9 — Péages et parking, part professionnelle. */
  peagesParking?: number;
  /** F3.10 — Intérêts annuels du crédit auto, proratisés par kmPro / kmTotauxCompteur. */
  interetsCredit?: number;
  kmTotauxCompteur?: number;
}

export interface TrajetEmployeur {
  nom: string;
  allerKm: number;
  joursSurSite: number;
}

export interface JourneeType {
  /** Distances des tronçons : maison → personne 1, personne 1 → 2, …, dernière personne → maison. */
  troncons: number[];
  jours: number;
}

/** Kilomètres d'une journée type : domicile-travail (plafonné sauf motif) et professionnels. */
export function kmJournee(p: Parametres, j: JourneeType, motif: boolean): { domicileTravail: number; professionnels: number } {
  const t = j.troncons;
  if (t.length === 0) return { domicileTravail: 0, professionnels: 0 };
  const plafond = (km: number) => distanceRetenue(p, km, motif);
  const domicileTravail = t.length === 1 ? plafond(t[0]) : plafond(t[0]) + plafond(t[t.length - 1]);
  const professionnels = t.slice(1, -1).reduce((s, km) => s + km, 0);
  return { domicileTravail, professionnels };
}

export interface EntreeRepasDeclarant {
  nb: number;
  prix: number | null;
  partEmployeurTitreRestaurant?: number;
  prixSurPlace?: number;
  /** Phrase reprise dans le résumé, par exemple « pas de cantine, déjeuner à domicile impossible ». */
  justification?: string;
}

export interface MontantLibelle {
  libelle: string;
  montant: number;
}

export interface EntreeDeclarant {
  /** 1 à 4 : déclarant 1, déclarant 2, personnes à charge (cases 1AK à 1DK). */
  numero: number;
  salairePrerempli: number;
  vehicules?: EntreeVehicule[];
  repas?: EntreeRepasDeclarant[];
  teletravailJoursParMois?: number[];
  /** F5.10 — Méthode retenue ; « reel » exige le détail des frais. */
  teletravailMethode?: "forfait" | "reel";
  teletravailReel?: EntreeTeletravailReel;
  autresFrais?: MontantLibelle[];
  reintegrations?: MontantLibelle[];
  /** Motifs hors véhicule (double résidence…), repris dans la ligne « Motifs ». */
  motifs?: string[];
}

export interface LigneResume {
  categorie: "vehicule" | "peages" | "interets" | "repas" | "teletravail" | "autre";
  texte: string;
  /** Montant arrondi à l'euro inférieur, celui qui entre dans la case. */
  montant: number;
}

export interface ResultatDeclarant {
  caseFraisReels: string;
  lignes: LigneResume[];
  montantCase: number;
  totalReintegrations: number;
  comparaison: Comparaison;
  texte: string;
  nbCaracteres: number;
  depasseLongueurCible: boolean;
  alertes: string[];
  /** Kilométrage annuel retenu pour chaque véhicule (contrôles de vraisemblance). */
  kmVehicules: number[];
}

const CASES = ["1AK", "1BK", "1CK", "1DK"];

/** Texte brut pour la déclaration en ligne : « x » plutôt que « × ». */
function brut(texte: string): string {
  return texte.replace(/×/g, "x");
}

function libelleVehicule(v: EntreeVehicule, ligneBareme: string): string {
  const nom = { voiture: "voiture", moto: "moto", cyclomoteur: "cyclomoteur" }[v.type];
  if (v.type === "cyclomoteur") return `${nom} ${v.energie}`;
  if (v.libellePuissance) return `${nom} ${v.energie} ${v.libellePuissance}`;
  const cv = v.type === "voiture" && ligneBareme !== String(v.cv) ? `${v.cv} CV (barème ${ligneBareme} CV)` : `${v.cv} CV`;
  return `${nom} ${v.energie} ${cv}`;
}

export function calculerDeclarant(p: Parametres, e: EntreeDeclarant): ResultatDeclarant {
  const lignes: LigneResume[] = [];
  const motifs: string[] = [...(e.motifs ?? [])];
  const alertes: string[] = [];

  // Véhicules : barème sur le kilométrage annuel total de chacun.
  const vehicules = e.vehicules ?? [];
  let peages = 0;
  let interets = 0;
  const kmVehicules: number[] = [];
  for (const v of vehicules) {
    const allersRetours = v.allersRetoursParJour ?? p.deplacements.allers_retours_par_jour_par_defaut;
    const aller = distanceRetenue(p, v.allerKm, Boolean(v.motifDistance));
    const parEmployeur = v.trajetsEmployeurs?.length ? v.trajetsEmployeurs : null;
    let kmTrajets = parEmployeur
      ? kmPlusieursEmployeurs(p, parEmployeur, Boolean(v.motifDistance), allersRetours)
      : kmDomicileTravail(p, aller, v.joursSurSite, allersRetours);
    let kmDT = 0;
    let kmPro = 0;
    if (v.journeesTypes?.length) {
      for (const j of v.journeesTypes) {
        const extremes = [j.troncons[0], j.troncons[j.troncons.length - 1]];
        const plafond = p.deplacements.distance_aller_max_sans_justification_km;
        if (!v.motifDistance && extremes.some((km) => km > plafond)) {
          alertes.push(`Un trajet entre la maison et une personne aidée dépasse ${plafond} km : il est ramené à ${plafond} km sans motif.`);
        }
        const k = kmJournee(p, j, Boolean(v.motifDistance));
        kmDT += k.domicileTravail * j.jours;
        kmPro += k.professionnels * j.jours;
      }
      kmTrajets = kmDT + kmPro;
    }
    const km = v.kmForce ?? kmTrajets + (v.kmMissions ?? 0) + (v.kmDoubleResidence ?? 0);
    const b = baremeKm(p, { km, vehicule: v.type, cv: v.cv, electrique: v.energie === "électrique" });
    kmVehicules.push(km);

    let detail: string;
    if (v.kmForce !== undefined) {
      detail = "total annuel indiqué, relevé ou carnet de bord";
    } else if (v.journeesTypes?.length) {
      const jours = v.journeesTypes.reduce((s, j) => s + j.jours, 0);
      detail = `${nombre(jours)} j d'intervention : domicile-travail ${nombre(kmDT)} km, entre personnes aidées ${nombre(kmPro)} km`;
      if (v.kmMissions) detail += ` + autres trajets professionnels ${nombre(v.kmMissions)} km`;
      if (v.kmDoubleResidence) detail += ` + trajets double résidence ${nombre(v.kmDoubleResidence)} km`;
    } else if (parEmployeur) {
      const fois = allersRetours > 1 ? ` × ${allersRetours} allers-retours` : "";
      detail = parEmployeur
        .map((t) => `${t.nom} ${nombre(distanceRetenue(p, t.allerKm, Boolean(v.motifDistance)))} km × 2${fois} × ${nombre(t.joursSurSite)} j sur site`)
        .join(" + ");
      if (v.kmMissions) detail += ` + missions ${nombre(v.kmMissions)} km`;
      if (v.kmDoubleResidence) detail += ` + trajets double résidence ${nombre(v.kmDoubleResidence)} km`;
    } else {
      detail = `domicile-travail ${nombre(aller)} km × 2` + (allersRetours > 1 ? ` × ${allersRetours} allers-retours` : "");
      detail += ` × ${nombre(v.joursSurSite)} j sur site`;
      if (v.kmMissions) detail += ` + missions ${nombre(v.kmMissions)} km`;
      if (v.kmDoubleResidence) detail += ` + trajets double résidence ${nombre(v.kmDoubleResidence)} km`;
    }
    const plafond = p.deplacements.distance_aller_max_sans_justification_km;
    for (const t of parEmployeur ?? []) {
      if (!v.motifDistance && t.allerKm > plafond) {
        alertes.push(`Trajet vers ${t.nom} ramené de ${nombre(t.allerKm)} à ${nombre(plafond)} km : indiquez un motif pour retenir la distance réelle.`);
      }
    }
    if (!parEmployeur && v.allerKm > aller) {
      alertes.push(
        `Distance ramenée de ${nombre(v.allerKm)} à ${nombre(aller)} km : indiquez un motif pour retenir la distance réelle.`,
      );
    }
    if (v.motifDistance) {
      motifs.push(
        (v.kmForce !== undefined || parEmployeur) && !v.allerKm
          ? `distance réelle au-delà de ${nombre(p.deplacements.distance_aller_max_sans_justification_km)} km retenue (${v.motifDistance})`
          : `distance de ${nombre(v.allerKm)} km retenue (${v.motifDistance})`,
      );
    }
    if (v.motifDoubleAllerRetour) motifs.push(`second aller-retour quotidien (${v.motifDoubleAllerRetour})`);

    lignes.push({
      categorie: "vehicule",
      texte: `Véhicule : ${libelleVehicule(v, b.ligne)}, ${nombre(km)} km dans l'année (${detail}), barème : ${b.formule}.`,
      montant: arrondiEuro(b.montant),
    });

    peages += v.peagesParking ?? 0;
    if (v.interetsCredit) {
      if (v.kmTotauxCompteur && v.kmTotauxCompteur > 0) {
        interets += v.interetsCredit * Math.min(km / v.kmTotauxCompteur, 1);
      } else {
        alertes.push("Intérêts du crédit auto non retenus : indiquez le kilométrage total du véhicule pour la part professionnelle.");
      }
    }
  }
  if (vehicules.length) {
    lignes.push({ categorie: "peages", texte: `Péages et parking : ${euros(peages)}.`, montant: arrondiEuro(peages) });
    lignes.push({ categorie: "interets", texte: `Intérêts crédit auto : ${euros(interets)}.`, montant: arrondiEuro(interets) });
  }

  // Repas : un régime par période (F4.5).
  for (const r of e.repas ?? []) {
    const res = repas(p, r);
    if (res.alertePrixEleve) {
      alertes.push(
        `Prix moyen du repas supérieur à ${eurosCentimes(p.repas.seuil_alerte_prix_repas)} : dépense susceptible d'être jugée excessive, gardez vos justificatifs.`,
      );
    }
    lignes.push({
      categorie: "repas",
      texte: `Repas : ${res.formule}${r.justification ? `, ${r.justification}` : ""}.`,
      montant: arrondiEuro(res.montant),
    });
  }

  // Télétravail : frais réels si choisis, sinon forfait plafonné mois par mois.
  if (e.teletravailMethode === "reel" && e.teletravailReel) {
    const t = teletravailReel(p, e.teletravailReel, p.millesime.revenus);
    if (t.total > 0) lignes.push({ categorie: "teletravail", texte: `Télétravail : ${t.formule}.`, montant: arrondiEuro(t.total) });
  } else if (e.teletravailJoursParMois && e.teletravailJoursParMois.some((j) => j > 0)) {
    const t = teletravailForfait(p, e.teletravailJoursParMois);
    lignes.push({ categorie: "teletravail", texte: `Télétravail : ${t.formule}.`, montant: arrondiEuro(t.montant) });
  }

  // Autres frais (F6), regroupés sur une ligne de texte mais comptés un par un.
  const autres = (e.autresFrais ?? []).filter((a) => a.montant > 0);
  for (const a of autres) {
    lignes.push({ categorie: "autre", texte: `${a.libelle} ${euros(a.montant)}`, montant: arrondiEuro(a.montant) });
  }

  const montantCase = lignes.reduce((s, l) => s + l.montant, 0);
  const reintegrations = (e.reintegrations ?? []).filter((r) => r.montant > 0);
  const totalReintegrations = reintegrations.reduce((s, r) => s + r.montant, 0);
  const caseFraisReels = CASES[e.numero - 1];

  // Assemblage du texte, dans l'ordre exigé.
  const texteLignes: string[] = [`Frais réels déclarant ${e.numero} : ${nombre(montantCase)} € (case ${caseFraisReels}).`];
  const parCategorie = (c: LigneResume["categorie"]) => lignes.filter((l) => l.categorie === c).map((l) => l.texte);
  texteLignes.push(...parCategorie("vehicule"));
  if (vehicules.length) texteLignes.push(`${parCategorie("peages")[0]} ${parCategorie("interets")[0]}`);
  texteLignes.push(...parCategorie("repas"), ...parCategorie("teletravail"));
  if (autres.length) texteLignes.push(`Autres : ${parCategorie("autre").join(", ")}.`);
  if (motifs.length) texteLignes.push(`Motifs : ${motifs.join(" ; ")}.`);
  texteLignes.push(
    reintegrations.length
      ? `Salaire 1AJ majoré de ${euros(totalReintegrations)} (${reintegrations.map((r) => `${r.libelle} ${euros(r.montant)}`).join(", ")}). Justificatifs conservés.`
      : "Salaire 1AJ majoré de 0 € (aucun remboursement employeur). Justificatifs conservés.",
  );
  const texte = brut(texteLignes.join("\n"));

  return {
    caseFraisReels,
    lignes,
    montantCase,
    totalReintegrations,
    comparaison: comparer(p, e.salairePrerempli, totalReintegrations, montantCase),
    texte,
    nbCaracteres: texte.length,
    depasseLongueurCible: texte.length > p.resume_1ak.longueur_cible_caracteres,
    alertes,
    kmVehicules,
  };
}

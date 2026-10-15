// Moteur de calcul FraisFit : fonctions pures, sans effet de bord.
// Chaque fonction reçoit les paramètres du millésime et ne contient aucun chiffre fiscal.
// Référence : tests/reference_calcul.py et docs/01-specifications-fonctionnelles.md (F1 à F7).
import type { BaremeParPuissance, LigneBareme, Parametres, TypeVehicule } from "./types";
import { coefficient, euros, eurosCentimes, nombre } from "./format";

// ---------------------------------------------------------------------------
// F3 — Barème kilométrique
// ---------------------------------------------------------------------------

export interface EntreeBareme {
  /** Kilométrage professionnel ANNUEL TOTAL du véhicule (domicile-travail + missions). */
  km: number;
  vehicule?: TypeVehicule;
  cv?: number;
  electrique?: boolean;
}

export interface ResultatBareme {
  montant: number;
  /** Clé de la ligne du barème retenue (« 7 » pour une voiture de 11 CV, « 5+ » pour une moto de 6 CV). */
  ligne: string;
  tranche: number;
  a: number;
  b: number;
  formule: string;
}

function indiceTranche(km: number, bornes: number[]): number {
  const i = bornes.findIndex((borne) => km <= borne);
  return i === -1 ? bornes.length : i;
}

/**
 * Choisit la ligne du barème selon la puissance.
 * Clés numériques (« 3 » à « 7 ») : puissance ramenée entre la plus petite et la plus grande clé.
 * Clés en intervalle (« 1-2 », « 3-5 », « 5+ ») : première plage qui contient la puissance.
 */
function cleLigne(bareme: BaremeParPuissance, cv: number): string {
  const cles = Object.keys(bareme.lignes);
  if (cles.every((c) => /^\d+$/.test(c))) {
    const valeurs = cles.map(Number);
    return String(Math.min(Math.max(Math.trunc(cv), Math.min(...valeurs)), Math.max(...valeurs)));
  }
  for (const c of cles) {
    const plage = /^(\d+)-(\d+)$/.exec(c);
    if (plage && cv >= Number(plage[1]) && cv <= Number(plage[2])) return c;
    const auDela = /^(\d+)\+$/.exec(c);
    if (auDela && cv > Number(auDela[1])) return c;
  }
  return cles[0];
}

export function baremeKm(p: Parametres, e: EntreeBareme): ResultatBareme {
  const vehicule = e.vehicule ?? "voiture";
  const energie = e.electrique ? "electrique" : "thermique";
  const B = p.bareme_kilometrique;

  let bornes: number[];
  let ligne: string;
  let lignes: LigneBareme[];
  if (vehicule === "cyclomoteur") {
    const t = B[`cyclomoteur_${energie}`];
    bornes = t.tranches_km;
    ligne = "cyclomoteur";
    lignes = t.ligne;
  } else {
    const t = B[`${vehicule}_${energie}`];
    bornes = t.tranches_km;
    ligne = cleLigne(t, e.cv ?? 0);
    lignes = t.lignes[ligne];
  }

  const tranche = indiceTranche(e.km, bornes);
  const { a, b } = lignes[tranche];
  const montant = e.km * a + b;
  const formule =
    `${nombre(e.km)} × ${coefficient(a)}` + (b ? ` + ${nombre(b)}` : "") + ` = ${euros(montant)}`;
  return { montant, ligne, tranche, a, b, formule };
}

/** F3.11 — Frais réels de véhicule plafonnés au barème de la plus forte puissance (voiture). */
export function plafondFraisReelsVehicule(
  p: Parametres,
  km: number,
  fraisJustifiesHorsPeagesParkingInterets: number,
): { montant: number; plafond: number; plafonne: boolean } {
  const plafond = baremeKm(p, { km, vehicule: "voiture", cv: p.deplacements.puissance_max_voiture_cv }).montant;
  const montant = Math.min(fraisJustifiesHorsPeagesParkingInterets, plafond);
  return { montant, plafond, plafonne: montant < fraisJustifiesHorsPeagesParkingInterets };
}

/** F3.3 et F3.4 — Distance aller retenue : plafonnée sauf circonstance particulière. */
export function distanceRetenue(p: Parametres, allerKm: number, motif = false): number {
  return motif ? allerKm : Math.min(allerKm, p.deplacements.distance_aller_max_sans_justification_km);
}

/** F3.3 et F3.6 — Kilomètres domicile-travail de l'année. */
export function kmDomicileTravail(
  p: Parametres,
  allerKm: number,
  joursSurSite: number,
  allersRetoursParJour = p.deplacements.allers_retours_par_jour_par_defaut,
): number {
  return allerKm * 2 * allersRetoursParJour * joursSurSite;
}

/** F12.6 — Trajets de plusieurs employeurs : chacun plafonné sauf motif, additionnés avant le barème. */
export function kmPlusieursEmployeurs(
  p: Parametres,
  trajets: { allerKm: number; joursSurSite: number }[],
  motif: boolean,
  allersRetoursParJour = p.deplacements.allers_retours_par_jour_par_defaut,
): number {
  return trajets.reduce((s, t) => s + kmDomicileTravail(p, distanceRetenue(p, t.allerKm, motif), t.joursSurSite, allersRetoursParJour), 0);
}

// ---------------------------------------------------------------------------
// F4 — Repas
// ---------------------------------------------------------------------------

export interface EntreeRepas {
  nb: number;
  /** Prix moyen payé ; null = forfait sans justificatif détaillé (gamelle). */
  prix: number | null;
  partEmployeurTitreRestaurant?: number;
  /** Repas apporté, distributeurs de dépannage sur place : part (0 à 1) que l'employeur y paie, retirée du forfait. */
  tauxEmployeurCantine?: number;
  /** Même cas, part de l'employeur connue en euros par repas (par jour, ou annuelle divisée par les jours). */
  partEmployeurRepas?: number;
}

export interface ResultatRepas {
  parRepas: number;
  montant: number;
  formule: string;
  /** F4.9 : avertissement seulement, le montant n'est jamais coupé. */
  alertePrixEleve: boolean;
}

export function repas(p: Parametres, e: EntreeRepas): ResultatRepas {
  const r = p.repas;
  const tr = e.partEmployeurTitreRestaurant ?? 0;
  const taux = e.tauxEmployeurCantine ?? 0;
  const partRepas = e.partEmployeurRepas ?? 0;
  const brut = (e.prix === null ? r.forfait_sans_justificatif_detaille : e.prix - r.valeur_repas_au_foyer) * (1 - taux) - partRepas;
  const parRepas = Math.max(brut - tr, 0);
  const montant = parRepas * e.nb;

  let detail =
    e.prix === null
      ? `forfait ${eurosCentimes(r.forfait_sans_justificatif_detaille)}`
      : `(${nombre(e.prix, 2)} - ${nombre(r.valeur_repas_au_foyer, 2)})`;
  if (taux) detail = `${detail} moins ${nombre(taux * 100)} % payés par l'employeur`;
  if (partRepas) detail = `${detail} moins ${eurosCentimes(partRepas)} payés par l'employeur`;
  if (tr) detail = `${detail} - titre-restaurant ${eurosCentimes(tr)}`;
  return {
    parRepas,
    montant,
    formule: `${nombre(e.nb)} repas × ${detail} = ${euros(montant)}`,
    alertePrixEleve: e.prix !== null && e.prix > r.seuil_alerte_prix_repas,
  };
}

// ---------------------------------------------------------------------------
// F5 — Télétravail (méthode forfaitaire)
// ---------------------------------------------------------------------------

export interface MoisTeletravail {
  /** 0 = janvier … 11 = décembre. */
  mois: number;
  jours: number;
  montant: number;
  plafonne: boolean;
}

export interface ResultatTeletravail {
  montant: number;
  jours: number;
  detailMois: MoisTeletravail[];
  /** Mois où le plafond mensuel a réduit le forfait. */
  moisPlafonnes: number[];
  plafondAnnuelAtteint: boolean;
  formule: string;
}

/**
 * F5.1 — Forfait par jour, plafonné chaque mois, puis sur l'année.
 * Le détail des 12 mois est obligatoire : c'est lui qui permet d'appliquer le plafond mensuel.
 */
export function teletravailForfait(p: Parametres, joursParMois: number[]): ResultatTeletravail {
  const t = p.teletravail;
  if (joursParMois.length !== 12) throw new Error("Le forfait télétravail attend le nombre de jours des 12 mois.");

  const detailMois = joursParMois.map((jours, mois) => {
    const brut = jours * t.forfait_par_jour;
    return { mois, jours, montant: Math.min(brut, t.plafond_mensuel), plafonne: brut > t.plafond_mensuel };
  });
  const jours = joursParMois.reduce((s, j) => s + j, 0);
  const totalMois = detailMois.reduce((s, m) => s + m.montant, 0);
  const montant = Math.min(totalMois, t.plafond_annuel);
  const moisPlafonnes = detailMois.filter((m) => m.plafonne).map((m) => m.mois);
  const plafondAnnuelAtteint = totalMois > t.plafond_annuel;

  let formule = `forfait ${eurosCentimes(t.forfait_par_jour)} × ${nombre(jours)} j`;
  if (moisPlafonnes.length) {
    formule += `, plafonné à ${eurosCentimes(t.plafond_mensuel)} sur ${moisPlafonnes.length} mois`;
  }
  if (plafondAnnuelAtteint) formule += `, plafond annuel ${eurosCentimes(t.plafond_annuel)}`;
  formule += ` = ${euros(montant)}`;

  return { montant, jours, detailMois, moisPlafonnes, plafondAnnuelAtteint, formule };
}

/**
 * Pré-remplissage quand seul le total annuel est connu : jours répartis à parts égales
 * (en jours entiers) sur les mois travaillés. C'est une estimation à faire corriger mois par mois.
 */
export function repartirJoursParMois(
  totalJours: number,
  moisTravailles: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
): number[] {
  const resultat = new Array(12).fill(0);
  if (!moisTravailles.length) return resultat;
  const base = Math.floor(totalJours / moisTravailles.length);
  const reste = totalJours - base * moisTravailles.length;
  moisTravailles.forEach((m, i) => {
    resultat[m] = base + (i < reste ? 1 : 0);
  });
  return resultat;
}

// ---------------------------------------------------------------------------
// F6.9 — Matériel
// ---------------------------------------------------------------------------

export function materiel(
  p: Parametres,
  prixHT: number,
  usagePro = 1,
  moisUtilisesAnneeAchat = 12,
): { montant: number; amorti: boolean } {
  const m = p.materiel;
  if (prixHT <= m.seuil_deduction_immediate_HT) return { montant: prixHT * usagePro, amorti: false };
  const annuite = prixHT / m.duree_amortissement_informatique_ans;
  return { montant: ((annuite * moisUtilisesAnneeAchat) / 12) * usagePro, amorti: true };
}

// ---------------------------------------------------------------------------
// F7 — Comparaison avec l'abattement de 10 %
// ---------------------------------------------------------------------------

/** F7.1 — Abattement de 10 %, borné par le minimum, le maximum et le salaire lui-même. */
export function abattement(p: Parametres, salaire: number): number {
  const a = p.abattement_10_pourcent;
  return Math.min(Math.max(salaire * a.taux, a.minimum_par_declarant), a.maximum_par_declarant, salaire);
}

export interface Comparaison {
  abattement: number;
  baseAbattement10: number;
  salaireCorrige: number;
  baseFraisReels: number;
  /** Positif = les frais réels réduisent la base imposable. */
  gainBase: number;
  fraisReelsConseilles: boolean;
  /** F7.3 — Frais réels à dépasser pour que l'option devienne intéressante. */
  seuilBascule: number;
}

/** F7.2 — Comparaison des deux bases imposables (règle d'or n° 4). */
export function comparer(
  p: Parametres,
  salairePrerempli: number,
  reintegrations: number,
  fraisReels: number,
): Comparaison {
  const abat = abattement(p, salairePrerempli);
  const baseAbattement10 = salairePrerempli - abat;
  const salaireCorrige = salairePrerempli + reintegrations;
  const baseFraisReels = salaireCorrige - fraisReels;
  const gainBase = baseAbattement10 - baseFraisReels;
  return {
    abattement: abat,
    baseAbattement10,
    salaireCorrige,
    baseFraisReels,
    gainBase,
    fraisReelsConseilles: gainBase > 0,
    seuilBascule: abat + reintegrations,
  };
}

/** Borne de recherche technique, sans portée fiscale. */
const LIMITE_RECHERCHE_KM = 1000;

/**
 * Distance aller minimale (km entiers) pour que le seul barème kilométrique dépasse l'abattement.
 * Sert aux repères affichés sur l'accueil (« à partir de X km, vérifiez »).
 */
export function distanceAllerMinimale(
  p: Parametres,
  salaire: number,
  jours: number,
  vehicule: Omit<EntreeBareme, "km">,
): number | null {
  const abat = abattement(p, salaire);
  for (let k = 1; k <= LIMITE_RECHERCHE_KM; k++) {
    if (baremeKm(p, { ...vehicule, km: kmDomicileTravail(p, k, jours) }).montant > abat) return k;
  }
  return null;
}

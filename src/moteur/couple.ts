// Ajout n° 1 — Mode foyer : règles de calcul propres aux couples (déclaration commune).
// Les frais réels restent individuels ; seul l'impôt est calculé sur le foyer.
import { baremeKm, comparer, distanceRetenue, type EntreeBareme } from "./calcul";
import { impotFoyer, type Foyer } from "./impot";
import type { Parametres } from "./types";

/** F10 — Motif « emploi du conjoint » proposé si l'un travaille au-delà du plafond et l'autre en deçà. */
export function motifEmploiConjointPropose(p: Parametres, allerMoi: number, allerConjoint: number): boolean {
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  return allerMoi > plafond && allerConjoint <= plafond;
}

export interface ResultatVehiculePartage {
  /** « prorata » : barème sur le total du véhicule, réparti au prorata des km ; « separe » : barème de chacun. */
  methode: "prorata" | "separe";
  montants: [number, number];
  /** Les deux calculs, pour le détail affiché. */
  prorata: [number, number];
  separe: [number, number];
}

/**
 * Véhicule utilisé par les deux conjoints. Aucun texte officiel ne traite ce cas : règle de prudence FraisFit,
 * la méthode qui donne la déduction totale la plus faible est retenue (statut « regle_prudente »).
 */
export function vehiculePartage(p: Parametres, km1: number, km2: number, vehicule: Omit<EntreeBareme, "km">): ResultatVehiculePartage {
  const separe: [number, number] = [baremeKm(p, { ...vehicule, km: km1 }).montant, baremeKm(p, { ...vehicule, km: km2 }).montant];
  const total = km1 + km2 > 0 ? baremeKm(p, { ...vehicule, km: km1 + km2 }).montant : 0;
  const prorata: [number, number] = km1 + km2 > 0 ? [(total * km1) / (km1 + km2), (total * km2) / (km1 + km2)] : [0, 0];
  const auProrata = prorata[0] + prorata[1] <= separe[0] + separe[1];
  return { methode: auProrata ? "prorata" : "separe", montants: auProrata ? prorata : separe, prorata, separe };
}

/** Trajets faits ensemble : les jours où il est passager de son conjoint, le déclarant ne compte aucun km. */
export function kmCovoiturageConjugal(p: Parametres, allerKm: number, jours: number, joursPassager: number, motif = false): number {
  return distanceRetenue(p, allerKm, motif) * 2 * Math.max(0, jours - joursPassager);
}

/**
 * Passager d'un covoiturage hors du foyer (LFR 2022 art. 20, CGI art. 83, 3°) : montant réellement payé.
 * Au-delà du plafond de distance sans motif : prorata du plafond (règle FraisFit, à confirmer par la DGFiP).
 */
export function covoituragePassager(p: Parametres, montantPaye: number, allerKm: number, motif = false): number {
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  if (motif || allerKm <= plafond) return montantPaye;
  return (montantPaye * plafond) / allerKm;
}

/** Conducteur d'un covoiturage : seul ce qui reste à sa charge est déductible. */
export function covoiturageConducteur(fraisVehicule: number, participationsRecues: number): number {
  return Math.max(0, fraisVehicule - participationsRecues);
}

export interface DeclarantDuFoyer {
  salairePrerempli: number;
  reintegrations: number;
  fraisReels: number;
}

export interface Combinaison {
  reels1: boolean;
  reels2: boolean;
  base1: number;
  base2: number;
  impot: number;
}

/**
 * Les 4 combinaisons abattement / frais réels d'un couple et l'impôt du foyer pour chacune.
 * Meilleure : l'impôt le plus bas ; à égalité, la base imposable la plus faible, puis le moins d'options.
 */
export function combinaisonsFoyer(
  p: Parametres,
  d1: DeclarantDuFoyer,
  d2: DeclarantDuFoyer,
  foyer: Omit<Foyer, "couple">,
): { combinaisons: Combinaison[]; meilleure: Combinaison } {
  const c1 = comparer(p, d1.salairePrerempli, d1.reintegrations, d1.fraisReels);
  const c2 = comparer(p, d2.salairePrerempli, d2.reintegrations, d2.fraisReels);
  const combinaisons: Combinaison[] = [];
  for (const reels1 of [false, true]) {
    for (const reels2 of [false, true]) {
      const base1 = reels1 ? c1.baseFraisReels : c1.baseAbattement10;
      const base2 = reels2 ? c2.baseFraisReels : c2.baseAbattement10;
      combinaisons.push({ reels1, reels2, base1, base2, impot: impotFoyer(p, base1 + base2, { ...foyer, couple: true }).impot });
    }
  }
  const cle = (c: Combinaison) => [Math.round(c.impot * 100), c.base1 + c.base2, Number(c.reels1) + Number(c.reels2)];
  const meilleure = combinaisons.reduce((a, b) => {
    const [x, y] = [cle(a), cle(b)];
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? a : b;
    return a;
  });
  return { combinaisons, meilleure };
}

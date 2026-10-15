// Étape 5 : le télétravail (F5). Forfait plafonné mois par mois ou frais réels : le plus favorable par défaut.
import { teletravailForfait } from "../moteur/calcul";
import type { MontantLibelle } from "../moteur/declarant";
import { teletravailReel, type Achat, type EntreeTeletravailReel, type UsageLocal } from "../moteur/teletravail";
import type { Parametres } from "../moteur/types";

export const USAGES: { valeur: UsageLocal | "studio"; libelle: string; detail?: string }[] = [
  { valeur: "dedie", libelle: "Une pièce réservée au travail", detail: "Personne ne l'utilise pour autre chose." },
  { valeur: "mixte", libelle: "Une pièce aussi utilisée en privé", detail: "Salon, chambre, coin bureau." },
  { valeur: "studio", libelle: "J'habite un studio" },
  { valeur: "aucun", libelle: "Pas d'espace particulier" },
];

export interface SaisieTeletravail {
  /** Allocation de télétravail versée par l'employeur dans l'année, à réintégrer. */
  allocation: number;
  allocationPrudente: boolean;
  /** F12 — Plusieurs employeurs : allocation de chacun (la somme fait allocation), reprise dans le résumé. */
  allocationParEmployeur?: { nom: string; montant: number }[];
  /** La personne a voulu comparer avec ses frais réels. */
  comparer: boolean;
  usage: UsageLocal;
  studio: boolean;
  surfaceBureau: number;
  surfaceTotale: number;
  chargesLogement: number;
  /** Détail des charges saisies (loyer, énergie…), pour pouvoir les corriger. */
  detailCharges?: Record<string, number>;
  depensesBureau: number;
  communication: number;
  fournitures: number;
  achats: Achat[];
  /** Méthode choisie ; par défaut la plus favorable. */
  methode: "forfait" | "reel";
}

/** « Je ne sais pas » pour l'allocation : forfait journalier × jours télétravaillés, réintégration la plus forte. */
export function allocationPrudente(p: Parametres, joursTeletravail: number): number {
  return Math.round(p.teletravail.forfait_par_jour * joursTeletravail * 100) / 100;
}

export function entreeReel(s: SaisieTeletravail, joursTeletravail: number, joursTravailles: number): EntreeTeletravailReel {
  return {
    usage: s.usage,
    studio: s.studio,
    surfaceBureau: s.surfaceBureau,
    surfaceTotale: s.surfaceTotale,
    chargesLogement: s.chargesLogement,
    depensesBureau: s.depensesBureau,
    communication: s.communication,
    fournitures: s.fournitures,
    achats: s.achats,
    joursTeletravail,
    joursTravailles,
  };
}

/** F5.10 — Tableau comparatif : montants des deux méthodes et méthode la plus favorable. */
export function comparerMethodes(
  p: Parametres,
  s: SaisieTeletravail,
  joursParMois: number[],
  joursTravailles: number,
): { forfait: number; reel: number; meilleure: "forfait" | "reel" } {
  const joursTeletravail = joursParMois.reduce((t, j) => t + j, 0);
  const forfait = teletravailForfait(p, joursParMois).montant;
  const reel = s.comparer ? teletravailReel(p, entreeReel(s, joursTeletravail, joursTravailles), p.millesime.revenus).total : 0;
  return { forfait, reel, meilleure: reel > forfait ? "reel" : "forfait" };
}

export function reintegrationsTeletravail(s: SaisieTeletravail): MontantLibelle[] {
  if (s.allocationParEmployeur && !s.allocationPrudente) {
    return s.allocationParEmployeur.filter((a) => a.montant > 0).map((a) => ({ libelle: `allocation télétravail ${a.nom}`, montant: a.montant }));
  }
  return s.allocation > 0 ? [{ libelle: "allocation télétravail", montant: s.allocation }] : [];
}

// F14 soignant — Soins à domicile (SSIAD, HAD) : aide au calcul du total annuel de kilomètres,
// pour qui ne le connaît pas. Deux méthodes : les bulletins de paie (comme F13, méthode A) ou le compteur.
import { distanceRetenue } from "../moteur/calcul";
import type { Parametres } from "../moteur/types";

/**
 * Depuis les bulletins : km indemnisés de chaque mois (tournées entre patients), plus les trajets
 * maison → premier patient (ou service) et dernier patient → maison, plafonnés chacun sauf motif.
 */
export function kmDepuisBulletins(
  p: Parametres,
  kmMois: number[],
  allerPremier: number,
  retourDernier: number,
  jours: number,
  motif = false,
): { tournees: number; domicileTravail: number; total: number } {
  const tournees = kmMois.reduce((s, k) => s + (Number.isFinite(k) ? k : 0), 0);
  const domicileTravail = (distanceRetenue(p, allerPremier, motif) + distanceRetenue(p, retourDernier, motif)) * jours;
  return { tournees, domicileTravail, total: tournees + domicileTravail };
}

/** Depuis le compteur : km d'une semaine habituelle × semaines travaillées. */
export function kmDepuisCompteur(kmSemaine: number, semaines: number): number {
  return Math.round(kmSemaine * semaines);
}

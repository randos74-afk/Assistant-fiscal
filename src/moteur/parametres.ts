// Chargement des paramètres fiscaux par millésime.
// Ajouter une année = déposer parametres/revenus-AAAA.json, sans toucher au code.
import type { Parametres } from "./types";

const fichiers = import.meta.glob<Parametres>("../../parametres/revenus-*.json", {
  eager: true,
  import: "default",
});

const parAnnee: Record<number, Parametres> = {};
for (const [chemin, p] of Object.entries(fichiers)) {
  const annee = Number(/revenus-(\d{4})\.json$/.exec(chemin)?.[1]);
  if (annee) parAnnee[annee] = p;
}

/** Années de revenus disponibles, de la plus récente à la plus ancienne. */
export function millesimesDisponibles(): number[] {
  return Object.keys(parAnnee).map(Number).sort((x, y) => y - x);
}

/**
 * Millésime à utiliser à une date donnée : les revenus de l'année écoulée (déclarés cette année) s'ils existent,
 * sinon le plus récent qui les précède. Un fichier provisoire déposé en décembre ne sert donc qu'au 1er janvier.
 */
export function millesimeDuJour(aujourdhui: Date, disponibles: number[] = millesimesDisponibles()): number {
  const attendue = aujourdhui.getFullYear() - 1;
  return disponibles.find((a) => a <= attendue) ?? disponibles[disponibles.length - 1];
}

/** En-têtes de tous les fichiers disponibles (statut, date de vérification), pour le badge de l'accueil. */
export function millesimes(): Parametres["millesime"][] {
  return Object.values(parAnnee).map((p) => p.millesime);
}

export function chargerParametres(anneeRevenus: number): Parametres {
  const p = parAnnee[anneeRevenus];
  if (!p) throw new Error(`Aucun fichier de paramètres pour les revenus ${anneeRevenus}.`);
  return p;
}

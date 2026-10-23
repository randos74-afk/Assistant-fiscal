// Badge de fraîcheur des chiffres (vert, orange, rouge) affiché sur l'accueil.
// Les barèmes d'une année de revenus sont publiés par l'administration fiscale l'année suivante, entre février et avril.
// Vert : le fichier des revenus de l'année à déclarer est vérifié. Rouge : il ne l'est pas encore et l'on est
// avant la date de fin d'attente (contenu/configuration.json). Orange : il ne l'est toujours pas après cette date.
import type { Parametres } from "../moteur/types";

export type CouleurBadge = "vert" | "orange" | "rouge";

export interface BadgeFraicheur {
  couleur: CouleurBadge;
  /** Année de revenus que l'on déclare cette année (année du jour − 1). */
  anneeAttendue: number;
  /** Année de revenus dont les chiffres servent au calcul. */
  anneeUtilisee: number;
  ligne1: string;
  ligne2: string;
  /** Phrase affichée sous le titre de l'accueil quand le badge n'est pas vert. */
  explication?: string;
}

const dateFr = (iso: string) => iso.split("-").reverse().join("/");

/**
 * @param millesimes en-têtes des fichiers parametres/revenus-AAAA.json disponibles
 * @param anneeUtilisee millésime chargé pour le calcul
 * @param finAttente « MM-JJ » : dernier jour du badge rouge
 */
export function badgeFraicheur(
  millesimes: Parametres["millesime"][],
  anneeUtilisee: number,
  aujourdhui: Date,
  finAttente: string,
): BadgeFraicheur {
  const annee = aujourdhui.getFullYear();
  const anneeAttendue = annee - 1;
  const attendu = millesimes.find((m) => m.revenus === anneeAttendue);
  const base = { anneeAttendue, anneeUtilisee, ligne1: `Revenus ${anneeAttendue}` };

  if (attendu?.statut === "vérifié" && attendu.date_verification && anneeUtilisee === anneeAttendue) {
    return { ...base, couleur: "vert", ligne2: `vérifié le ${dateFr(attendu.date_verification)}` };
  }

  const [mois, jour] = finAttente.split("-").map(Number);
  const enAttente = aujourdhui.getTime() < new Date(annee, mois - 1, jour + 1).getTime();
  const chiffres =
    anneeUtilisee === anneeAttendue
      ? `Le calcul utilise des chiffres des revenus ${anneeAttendue} pas encore contrôlés : le résultat est provisoire.`
      : `En attendant, le calcul utilise les chiffres des revenus ${anneeUtilisee} : le résultat est provisoire.`;

  if (enAttente) {
    return {
      ...base,
      couleur: "rouge",
      ligne2: "chiffres en attente",
      explication: `L'administration fiscale publie les chiffres des revenus ${anneeAttendue} entre février et avril ${annee}. ${chiffres} Refaites votre calcul après la mise à jour de l'application.`,
    };
  }
  return {
    ...base,
    couleur: "orange",
    ligne2: "provisoire",
    explication: `${chiffres} Refaites votre calcul après la mise à jour de l'application.`,
  };
}

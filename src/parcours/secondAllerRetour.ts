// F3.6 — Second aller-retour quotidien (rentrer déjeuner chez soi).
// Dépliant DGFiP GP 120 : « Vous ne pouvez déduire qu'un seul aller-retour par jour sauf si vous pouvez faire état de
// circonstances particulières qui justifient un double aller-retour » ; l'impossibilité de se restaurer sur le lieu
// de travail en fait partie (BOI-RSA-BASE-30-50-30-20). La justification doit être très forte : le client l'écrit
// lui-même, avec les éléments sur lesquels il s'appuie, et elle part en annexe du PDF.
import { distanceRetenue } from "../moteur/calcul";
import { nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import type { Reponses } from "./assemblage";
import { totaux } from "./calendrier";
import { estVehicule, type SaisieTrajet } from "./trajet";

export type MotifSecondAllerRetour = "restauration" | "sante" | "horaires" | "proche";

export interface SaisieSecondAllerRetour {
  motif: MotifSecondAllerRetour;
  /** Jours où le second aller-retour a été fait ; null = « Je ne sais pas » : rien n'est déduit (valeur prudente). */
  jours: number | null;
  /** Explication écrite par le client. */
  situation: string;
  /** Éléments et pièces sur lesquels il s'appuie, écrits par le client. */
  preuves: string;
}

export const MOTIFS_SECOND_ALLER_RETOUR: {
  valeur: MotifSecondAllerRetour;
  libelle: string;
  /** Texte repris dans le résumé de la case 1AK et la note explicative. */
  motif: string;
  /** Pièces conseillées, ajoutées à la liste des justificatifs. */
  pieces: string;
}[] = [
  {
    valeur: "restauration",
    libelle: "Je ne peux pas me restaurer sur mon lieu de travail ni à côté",
    motif: "impossibilité de se restaurer sur le lieu de travail",
    pieces: "Attestation de l'employeur (ni cantine, ni salle pour déjeuner, ni titres-restaurant), plan des environs sans commerce de restauration",
  },
  {
    valeur: "sante",
    libelle: "Mon état de santé m'oblige à déjeuner chez moi",
    motif: "raison de santé",
    pieces: "Certificat médical indiquant la nécessité de déjeuner à domicile (sans le diagnostic)",
  },
  {
    valeur: "horaires",
    libelle: "Mes horaires sont coupés par une longue pause au milieu de la journée",
    motif: "horaires de travail atypiques",
    pieces: "Plannings ou attestation de l'employeur montrant la coupure de la mi-journée",
  },
  {
    valeur: "proche",
    libelle: "Je dois m'occuper d'un proche à la mi-journée",
    motif: "proche à assister",
    pieces: "Pièce attestant la dépendance du proche (carte d'invalidité, plan d'aide), sans détail médical",
  },
];

export const motifSecondAllerRetour = (v: MotifSecondAllerRetour) => MOTIFS_SECOND_ALLER_RETOUR.find((m) => m.valeur === v)!;

/** Longueur minimale de chaque texte écrit par le client : une vraie phrase, pas un mot. */
export const LONGUEUR_MINIMALE_JUSTIFICATION = 40;

export function justificationSuffisante(s: Pick<SaisieSecondAllerRetour, "situation" | "preuves">): boolean {
  return s.situation.trim().length >= LONGUEUR_MINIMALE_JUSTIFICATION && s.preuves.trim().length >= LONGUEUR_MINIMALE_JUSTIFICATION;
}

/**
 * La question n'a de sens qu'avec un véhicule et une seule distance domicile-travail : pas de total de km saisi
 * (il inclurait déjà ces trajets), pas de trajets par employeur ou par établissement.
 */
export function secondAllerRetourPossible(t: SaisieTrajet | undefined): boolean {
  return Boolean(t && estVehicule(t.mode) && t.allerKm > 0 && t.kmAnnuel === undefined && !t.employeurs?.length && !t.lieux?.length);
}

/** Jours retenus : au plus les jours sur site ; aucun sans justification complète. */
export function joursRetenus(s: SaisieSecondAllerRetour | undefined, joursSurSite: number): number {
  if (!s || s.jours === null || !justificationSuffisante(s)) return 0;
  return Math.max(0, Math.min(s.jours, joursSurSite));
}

export interface AnnexeSecondAllerRetour {
  titre: string;
  paragraphes: string[];
  situation: string;
  preuves: string;
  pieces: string;
}

/** Annexe du PDF : règle rappelée, kilomètres en jeu, puis la justification du client mot pour mot. */
export function annexeSecondAllerRetour(
  p: Parametres,
  s: SaisieSecondAllerRetour,
  t: SaisieTrajet,
  joursSurSite: number,
): AnnexeSecondAllerRetour | undefined {
  const jours = joursRetenus(s, joursSurSite);
  if (!jours) return undefined;
  const aller = distanceRetenue(p, t.allerKm, Boolean(t.motifDistance));
  const m = motifSecondAllerRetour(s.motif);
  return {
    titre: "Annexe : justification du second aller-retour quotidien",
    paragraphes: [
      `En plus de l'aller-retour quotidien entre mon domicile et mon lieu de travail, je déduis un second aller-retour pour déjeuner à mon domicile, sur ${nombre(jours)} jours de l'année ${p.millesime.revenus} : ${nombre(aller)} km × 2 × ${nombre(jours)} jours, soit ${nombre(aller * 2 * jours)} km ajoutés au kilométrage de mon véhicule.`,
      "Je sais que l'administration fiscale n'admet en principe qu'un seul aller-retour par jour, et un second seulement dans des circonstances particulières. Je fais état de la circonstance suivante : " +
        `${m.motif}.`,
    ],
    situation: s.situation.trim(),
    preuves: s.preuves.trim(),
    pieces: m.pieces,
  };
}

/** Annexe d'un déclarant, d'après ses réponses ; mêmes conditions que l'assemblage pour le moteur. */
export function annexeDuDeclarant(p: Parametres, r: Reponses): AnnexeSecondAllerRetour | undefined {
  const s = r.repas?.acces === "domicile" ? r.repas.secondAllerRetour : undefined;
  if (!s || r.domicile || !r.trajet || !secondAllerRetourPossible(r.trajet)) return undefined;
  return annexeSecondAllerRetour(p, s, r.trajet, totaux(r.jours?.mois ?? []).site);
}

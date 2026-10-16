// Ajout n° 1 — Mode foyer : une simulation, un ou deux profils (« Vous », « Votre conjoint »).
// Les données communes (foyer, filtrage) sont saisies une fois ; chaque profil garde ses propres réponses.
import type { Reponses } from "./assemblage";
import type { SaisieAutresFrais } from "./autresFrais";
import type { SaisieDomicile } from "./domicile";
import type { IdProfil } from "./metiers";
import type { SaisieRepas } from "./repas";
import type { SaisieTeletravail } from "./teletravail";
import type { SaisieTrajet } from "./trajet";
import type { SaisieJours } from "../ui/Jours";
import type { SaisieSalaire } from "../ui/Salaire";

/** « seul » : parcours d'une personne (concubins compris) ; « couple » : marié ou pacsé, déclaration commune. */
export type ModeDeclaration = "seul" | "couple";

export interface Profil {
  /** Prénom facultatif, affiché à la place de « Votre conjoint ». */
  prenom?: string;
  /** Conjoint sans frais à examiner : seul son salaire compte, il garde l'abattement de 10 %. */
  salaireSeulement?: boolean;
  metier?: IdProfil;
  salaire?: SaisieSalaire;
  jours?: SaisieJours;
  trajet?: SaisieTrajet;
  domicile?: SaisieDomicile;
  repas?: SaisieRepas;
  teletravail?: SaisieTeletravail;
  autres?: SaisieAutresFrais;
}

/** Nom affiché du profil : « Vous », puis le prénom ou « Votre conjoint ». */
export function nomProfil(index: number, profil?: Profil): string {
  if (index === 0) return "Vous";
  return profil?.prenom?.trim() || "Votre conjoint";
}

/** Réponses d'un profil pour le moteur : la journée type remplace le trajet dans le parcours aide à domicile. */
export function reponsesDuProfil(profil: Profil): Reponses {
  if (profil.salaireSeulement) return { salaire: profil.salaire };
  const estDomicile = profil.metier === "domicile";
  return {
    salaire: profil.salaire,
    jours: profil.jours,
    trajet: estDomicile ? undefined : profil.trajet,
    domicile: estDomicile ? profil.domicile : undefined,
    repas: profil.repas,
    teletravail: profil.teletravail,
    autres: profil.autres,
  };
}

/** Phrase de la combinaison mise en avant : « Vous aux frais réels, votre conjoint à l'abattement ». */
export function phraseCombinaison(reels1: boolean, reels2: boolean, conjoint?: Profil): string {
  const nom2 = nomProfil(1, conjoint);
  const choix = (reels: boolean) => (reels ? "aux frais réels" : "à l'abattement");
  if (reels1 === reels2) return reels1 ? `Vous et ${minuscule(nom2)} aux frais réels` : "Vous gardez tous les deux l'abattement";
  return `Vous ${choix(reels1)}, ${minuscule(nom2)} ${choix(reels2)}`;
}

/** « Votre conjoint » devient « votre conjoint » en milieu de phrase ; un prénom reste inchangé. */
export function minuscule(nom: string): string {
  return nom === "Votre conjoint" ? "votre conjoint" : nom;
}

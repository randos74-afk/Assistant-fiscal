// Ajout n° 3 — Conditions générales et annexe « Limites d'usage » : adresses lues dans contenu/configuration.json,
// acceptation par version, et cas que l'administration doit trancher.
import configuration from "../../contenu/configuration.json";
import texteCgv from "../../contenu/cgv-v1.0.md?raw";
import type { Parametres } from "../moteur/types";
import type { Vraisemblance } from "../moteur/vraisemblance";
import type { EcranModifiable } from "../ui/Relecture";
import type { Reponses } from "./assemblage";

export interface Configuration {
  liens: { annexe_limites_usage: string; politique_confidentialite: string };
  conditions: { version: string; date: string; changements: string[] };
}

export const CONFIGURATION: Configuration = configuration;

/** Mention légale longue (ajout n° 2), reprise sur l'écran « Avant de commencer » et en tête des conditions. */
export const MENTION_LEGALE =
  "FraisFit est un outil d'aide au calcul, indépendant de l'administration fiscale. Les résultats sont des estimations fondées sur les informations saisies par l'utilisateur et sur les barèmes officiels en vigueur. L'utilisateur reste seul responsable de sa déclaration de revenus et de l'exactitude des informations qu'il y porte.";

/** Adresse publiée, ou null tant que la configuration contient encore la valeur provisoire entre crochets. */
export function adresse(valeur: string): string | null {
  return /^https?:\/\//.test(valeur) ? valeur : null;
}

export function lienAnnexe(c: Configuration = CONFIGURATION): string | null {
  return adresse(c.liens.annexe_limites_usage);
}

/** Texte des conditions avec les adresses de la configuration ; « adresse à venir » si elles ne sont pas publiées. */
export function texteConditions(c: Configuration = CONFIGURATION, brut: string = texteCgv): string {
  const ou = (v: string) => adresse(v) ?? "(adresse à venir)";
  return brut
    .replace(/<!--[\s\S]*?-->\s*/g, "")
    .replace(/\{lien_annexe\}/g, ou(c.liens.annexe_limites_usage))
    .replace(/\{lien_confidentialite\}/g, ou(c.liens.politique_confidentialite))
    .trim();
}

/** « 16 octobre 2026 » à partir de « 2026-10-16 ». */
export function dateEnClair(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j)).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// --- Acceptation, enregistrée sur l'appareil uniquement -------------------------------------------

export interface Acceptation {
  version: string;
  accepteeLe: string;
}

const CLE = "fraisfit.conditions";

export function lireAcceptation(): Acceptation | null {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Acceptation) : null;
  } catch {
    return null;
  }
}

export function enregistrerAcceptation(version: string, maintenant = new Date()): Acceptation {
  const a = { version, accepteeLe: maintenant.toISOString() };
  try {
    localStorage.setItem(CLE, JSON.stringify(a));
  } catch {
    // Stockage indisponible : l'écran reviendra au prochain lancement.
  }
  return a;
}

/** L'écran « Avant de commencer » s'affiche au premier lancement et à chaque nouvelle version des textes. */
export function doitAfficherConditions(acceptation: Acceptation | null, versionCourante: string): boolean {
  return acceptation?.version !== versionCourante;
}

/** « Commencer » n'est actif que si la case est cochée. */
export function peutCommencer(caseCochee: boolean): boolean {
  return caseCochee;
}

// --- Cas que l'administration doit trancher ---------------------------------------------------------

export type IdCasAdministration =
  | "hors_public"
  | "vehicule_partage_conjoints"
  | "covoiturage"
  | "distance_plus_40_km_motivee"
  | "double_residence_ou_demenagement_ou_formation"
  | "alerte_vraisemblance_montant"
  | "electrique_au_reel"
  | "point_a_confirmer";

export interface CasAdministration {
  id: IdCasAdministration;
  phrase: string;
  /** Étape où se trouve la réponse en cause. */
  ecran?: EcranModifiable;
  /** Mode foyer : profil concerné (0 = vous, 1 = conjoint). */
  profil?: number;
}

export const CONSEIL_ADMINISTRATION =
  "Demandez confirmation par la messagerie sécurisée de votre espace impots.gouv.fr avant de déclarer.";

/**
 * Cas rencontrés dans le parcours. Les cas « véhicule partagé », « covoiturage » et « électrique au réel »
 * seront détectés avec le mode foyer (ajout n° 1) ; « hors public » est traité par l'écran d'exclusion.
 */
export function casAdministration(p: Parametres, r: Reponses, v: Vraisemblance): CasAdministration[] {
  const cas: CasAdministration[] = [];
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;

  if (r.trajet?.motifDistance || r.domicile?.motifDistance) {
    cas.push({
      id: "distance_plus_40_km_motivee",
      phrase: `Vous déduisez plus de ${plafond} km de trajet pour un motif personnel. L'administration apprécie ce motif au cas par cas.`,
      ecran: "trajet",
    });
  }

  const ouverts = r.autres?.ouverts ?? [];
  if (ouverts.some((o) => o === "doubleResidence" || o === "demenagement" || o === "formation")) {
    cas.push({
      id: "double_residence_ou_demenagement_ou_formation",
      phrase: "Double résidence, déménagement ou formation : l'administration vérifie que ces frais sont bien liés à votre emploi.",
      ecran: "autres",
    });
  }

  if (v.niveau >= 2) {
    cas.push({
      id: "alerte_vraisemblance_montant",
      phrase: "Vos frais sont élevés par rapport à votre salaire. L'administration peut vous demander des explications.",
    });
  }

  return cas;
}

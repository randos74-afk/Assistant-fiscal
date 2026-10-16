// Écran « Votre métier » (F14) : le profil ne change aucune règle de calcul.
// Il ouvre d'office les postes utiles et oriente vers les questions propres au métier.
import { eurosCentimes } from "../moteur/format";
import type { Parametres } from "../moteur/types";

export type IdProfil = "domicile" | "soignant" | "enseignant" | "grandRouleur" | "autre";

export type IdPoste =
  | "trajets"
  | "peagesParking"
  | "interets"
  | "repas"
  | "teletravail"
  | "tenues"
  | "documentation"
  | "formation"
  | "cotisationOrdre"
  | "cotisationSyndicale"
  | "materiel"
  | "fournitures"
  | "telephone"
  | "bureauDomicile"
  | "demenagement"
  | "doubleResidence";

export interface Profil {
  id: IdProfil;
  libelle: string;
  detail: string;
  /** Postes ouverts d'office ; l'utilisateur peut toujours en ajouter ou en fermer. */
  postesOuverts: IdPoste[];
}

export const PROFILS: Profil[] = [
  {
    id: "domicile",
    libelle: "Intervenant à domicile",
    detail: "Aide à domicile, auxiliaire de vie, aide ménagère, garde d'enfants chez les familles.",
    postesOuverts: ["trajets", "repas", "telephone", "tenues"],
  },
  {
    id: "soignant",
    libelle: "Soignant salarié",
    detail: "Infirmier, aide-soignant, sage-femme ou kiné salarié, à l'hôpital, en clinique ou en maison de retraite.",
    postesOuverts: ["trajets", "repas", "tenues", "cotisationOrdre", "formation", "documentation"],
  },
  {
    id: "enseignant",
    libelle: "Enseignant",
    detail: "École, collège, lycée, public ou privé sous contrat, enseignement agricole.",
    postesOuverts: [
      "trajets",
      "bureauDomicile",
      "materiel",
      "fournitures",
      "documentation",
      "formation",
      "cotisationSyndicale",
      "demenagement",
      "doubleResidence",
    ],
  },
  {
    id: "grandRouleur",
    libelle: "Grand rouleur ou double résidence",
    detail: "Plus de {distanceMax} km entre chez vous et votre travail, ou un second logement pour travailler.",
    postesOuverts: ["trajets", "peagesParking", "interets", "repas", "doubleResidence"],
  },
  {
    id: "autre",
    libelle: "Autre métier",
    detail: "Toutes les questions, une par une. Vous ne perdez rien.",
    postesOuverts: [],
  },
];

/** Détail affiché, avec la distance plafond lue dans les paramètres du millésime. */
export function detailProfil(p: Profil, param: Parametres): string {
  return p.detail.replace("{distanceMax}", String(param.deplacements.distance_aller_max_sans_justification_km));
}

export function profil(id: IdProfil): Profil {
  return PROFILS.find((p) => p.id === id)!;
}

/** F14 — Réponses aux questions propres au métier (soignant pour l'instant). */
export interface QuestionsMetier {
  /** Soignant : l'employeur lave les tenues (l'entretien n'est alors pas déductible). */
  lavageTenues?: boolean;
  /** Soignant : travail de nuit ou en 12 h. */
  nuit12h?: boolean;
  /** Soignant : soins à domicile (SSIAD, HAD) ; trajets saisis par leur total annuel (décision du 16/10/2026). */
  soinsDomicile?: boolean;
  /** Enseignant : remplaçant (TZR, brigade) ou sur plusieurs établissements ; un trajet par établissement. */
  remplacant?: boolean;
  /** Enseignant : muté cette année (déménagement, double résidence). */
  mute?: boolean;
  /** Enseignant : travail à la maison (préparations, corrections) ; ouvre le bureau à domicile. */
  travailMaison?: boolean;
  /** Enseignant : remboursements de frais professionnels (ISSR, forfait mobilités durables…), à ajouter au salaire. */
  remboursementsFrais?: number;
  /** Grand rouleur : second logement pour le travail (double résidence). */
  doubleResidence?: boolean;
}

export type EtapeConseillee = "jours" | "trajet" | "repas" | "teletravail" | "autres";

/** Le métier pose-t-il des questions propres avant le salaire ? */
export function aDesQuestionsMetier(id: IdProfil | undefined): boolean {
  return id === "soignant" || id === "enseignant" || id === "grandRouleur";
}

/** Conseils affichés en tête des étapes, selon le métier et ses réponses. Aucune règle de calcul n'est changée. */
export function conseilsMetier(param: Parametres, id: IdProfil | undefined, q: QuestionsMetier | undefined): Record<EtapeConseillee, string[]> {
  const c: Record<EtapeConseillee, string[]> = { jours: [], trajet: [], repas: [], teletravail: [], autres: [] };
  if (!q) return c;
  const forfait = eurosCentimes(param.repas.forfait_sans_justificatif_detaille);
  const foyer = eurosCentimes(param.repas.valeur_repas_au_foyer);
  const plafond = param.deplacements.distance_aller_max_sans_justification_km;
  if (id === "enseignant") {
    if (q.remplacant) {
      c.trajet.push(
        `Remplaçant : comptez chaque établissement où vous êtes allé, avec ses jours (école de rattachement les jours sans remplacement). Au-delà de ${plafond} km, le motif « emploi précaire ou mobile » convient.`,
      );
    }
    c.repas.push(`Restaurant administratif ou scolaire subventionné : seul ce que vous payez au-delà de ${foyer} par repas compte.`);
    if (q.travailMaison) {
      c.teletravail.push("Votre bureau à la maison se déclare à l'étape suivante, « Vos autres frais ». Ne le comptez pas ici en plus.");
    }
    if (q.mute) c.autres.push("Muté dans l'intérêt du service ou par avancement : vos frais de déménagement sont déductibles. Gardez l'arrêté d'affectation.");
    c.autres.push(
      "Ordinateur aussi utilisé en privé : estimez la part du travail d'après vos heures d'utilisation (l'aide « M'aider à estimer » fait le calcul), jamais un pourcentage forfaitaire.",
    );
    c.autres.push("Justificatifs utiles : calendrier scolaire, emploi du temps, arrêté d'affectation, factures.");
    return c;
  }
  if (id === "grandRouleur") {
    c.trajet.push(
      `Au-delà de ${plafond} km aller, choisissez votre raison : elle est recopiée telle quelle dans le texte à déclarer. Gardez une note qui l'explique.`,
    );
    c.trajet.push("Péages, parking et intérêts du crédit auto s'ajoutent au barème : cochez-les si vous avez les justificatifs.");
    if (q.doubleResidence) {
      c.autres.push(
        "Double résidence : loyer et charges du second logement, et vos trajets vers le domicile familial. Ces kilomètres s'ajoutent à ceux de votre véhicule avant le barème.",
      );
      c.repas.push("Loin de chez vous, seul le surcoût de vos repas par rapport à un repas pris à la maison compte.");
    }
    return c;
  }
  if (id !== "soignant") return c;
  if (q.nuit12h) {
    c.jours.push("En 12 h ou de nuit, comptez vos gardes : chaque garde compte pour un jour de trajet et de repas.");
    c.trajet.push("La nuit ou en horaires décalés, sans transport en commun, la voiture se justifie. Gardez votre planning de gardes.");
    c.repas.push(`La nuit, si aucune restauration n'est ouverte, le forfait de ${forfait} par repas s'applique.`);
  }
  c.repas.push(`Self ou cantine subventionnée : seul ce que vous payez au-delà de ${foyer} par repas compte.`);
  if (q.soinsDomicile) {
    c.trajet.push(
      "Soins à domicile : indiquez le total de vos kilomètres de l'année avec ce véhicule, tournées comprises (carnet de bord ou relevé de votre employeur). Les trajets entre patients ne sont pas plafonnés.",
    );
  }
  c.autres.push(
    q.lavageTenues
      ? "Votre employeur lave vos tenues : ne comptez que leur achat (tenues, chaussures), pas l'entretien."
      : "Vous lavez vous-même vos tenues : l'achat et l'entretien comptent. Gardez une estimation écrite du coût de l'entretien.",
  );
  return c;
}

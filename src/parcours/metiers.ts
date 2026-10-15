// Écran « Votre métier » (F14) : le profil ne change aucune règle de calcul.
// Il ouvre d'office les postes utiles et oriente vers les questions propres au métier.
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

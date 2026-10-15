// Écran de filtrage (docs/02 §1) : cinq questions avant tout calcul.
// Logique pure : les réponses donnent soit « continuer », soit une exclusion expliquée.

export type IdQuestion = "salaireFrance" | "travailEtranger" | "entreprise" | "residentAnnee" | "metierSpecial";

export interface Option {
  valeur: string;
  libelle: string;
}

export interface QuestionFiltrage {
  id: IdQuestion;
  question: string;
  precision?: string;
  options: Option[];
}

const OUI_NON: Option[] = [
  { valeur: "oui", libelle: "Oui" },
  { valeur: "non", libelle: "Non" },
];

export const QUESTIONS_FILTRAGE: QuestionFiltrage[] = [
  {
    id: "salaireFrance",
    question: "Votre salaire est-il versé par un employeur en France ?",
    precision: "Un employeur public ou privé, une agence d'intérim ou un particulier employeur.",
    options: OUI_NON,
  },
  {
    id: "travailEtranger",
    question: "Travaillez-vous à l'étranger ?",
    precision: "Par exemple en Suisse, au Luxembourg, en Allemagne, en Belgique ou à Monaco.",
    options: OUI_NON,
  },
  {
    id: "entreprise",
    question: "Avez-vous une entreprise à votre nom ?",
    precision: "Artisan, commerçant, profession libérale, micro-entrepreneur ou exploitant agricole.",
    options: OUI_NON,
  },
  {
    id: "residentAnnee",
    question: "Avez-vous habité en France toute l'année {annee} ?",
    options: OUI_NON,
  },
  {
    id: "metierSpecial",
    question: "Exercez-vous l'un de ces métiers ?",
    options: [
      { valeur: "aucun", libelle: "Non, aucun de ces métiers" },
      { valeur: "assistantMaternel", libelle: "Assistant maternel ou familial agréé" },
      { valeur: "artiste", libelle: "Artiste du spectacle ou intermittent" },
      { valeur: "journaliste", libelle: "Journaliste" },
      { valeur: "elu", libelle: "Élu local ou parlementaire" },
    ],
  },
];

/** Texte de la question pour l'année de revenus choisie. */
export function libelleQuestion(q: QuestionFiltrage, anneeRevenus: number): string {
  return q.question.replace("{annee}", String(anneeRevenus));
}

export type Reponses = Partial<Record<IdQuestion, string>>;

export interface Exclusion {
  raison: string;
  conseil: string;
  /** Prévu dans une prochaine version : on le dit pour ne pas décourager. */
  prevuPlusTard?: boolean;
}

/** Réponse qui exclut, pour chaque question ; les autres réponses laissent continuer. */
const EXCLUSIONS: Partial<Record<IdQuestion, Record<string, Exclusion>>> = {
  salaireFrance: {
    non: {
      raison:
        "Les frais réels se déduisent d'un salaire versé en France. Une pension de retraite n'a pas d'option frais réels.",
      conseil: "Rien à faire de votre côté : l'abattement automatique s'applique déjà.",
    },
  },
  travailEtranger: {
    oui: {
      raison:
        "Votre salaire dépend d'un accord entre la France et le pays où vous travaillez. Ces règles sont trop particulières pour FraisFit.",
      conseil: "Votre centre des impôts peut vous renseigner sur votre cas.",
    },
  },
  residentAnnee: {
    non: {
      raison:
        "Quand on arrive en France ou qu'on la quitte dans l'année, la déclaration est différente. FraisFit ne la gère pas.",
      conseil: "La notice de la déclaration des non-résidents, sur impots.gouv.fr, explique les règles.",
    },
  },
  metierSpecial: {
    assistantMaternel: {
      raison:
        "Votre métier a son propre calcul, avec un abattement par enfant et par jour. Il est souvent plus avantageux que les frais réels.",
      conseil: "La notice 2041 GP, sur impots.gouv.fr, explique ce calcul pas à pas.",
    },
    artiste: {
      raison: "Votre métier a des déductions forfaitaires qui lui sont propres. FraisFit ne les calcule pas encore.",
      conseil: "Elles sont prévues dans une prochaine version.",
      prevuPlusTard: true,
    },
    journaliste: {
      raison: "Une partie de votre rémunération est exonérée par une règle propre aux journalistes.",
      conseil: "La notice 2041 GP, sur impots.gouv.fr, explique cette règle.",
    },
    elu: {
      raison: "Les indemnités d'élu suivent des règles propres, que FraisFit ne calcule pas.",
      conseil: "La notice 2041 GP, sur impots.gouv.fr, explique ces règles.",
    },
  },
};

export type ResultatFiltrage =
  | { statut: "en-cours"; prochaineQuestion: number }
  | { statut: "exclu"; question: IdQuestion; exclusion: Exclusion }
  | { statut: "accepte"; aussiEntreprise: boolean };

export function evaluerFiltrage(reponses: Reponses): ResultatFiltrage {
  for (let i = 0; i < QUESTIONS_FILTRAGE.length; i++) {
    const id = QUESTIONS_FILTRAGE[i].id;
    const reponse = reponses[id];
    if (reponse === undefined) return { statut: "en-cours", prochaineQuestion: i };
    const exclusion = EXCLUSIONS[id]?.[reponse];
    if (exclusion) return { statut: "exclu", question: id, exclusion };
  }
  return { statut: "accepte", aussiEntreprise: reponses.entreprise === "oui" };
}

/** Message affiché sous la question quand la réponse choisie mérite une précision, sans exclure. */
export function precisionReponse(id: IdQuestion, reponse: string | undefined): string | null {
  if (id === "entreprise" && reponse === "oui") {
    return "Vous pouvez continuer pour votre seul salaire. Les frais de votre entreprise se déclarent à part.";
  }
  return null;
}

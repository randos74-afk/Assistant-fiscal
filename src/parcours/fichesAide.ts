// Fiches « Où trouver ce chiffre ? » (docs/02 §4). Texte seulement ; l'illustration est désignée par son nom.

export type IdIllustration = "bulletin-net-imposable";

export interface FicheAide {
  titre: string;
  illustration: IdIllustration;
  /** Une phrase décrivant l'image pour les lecteurs d'écran. */
  texteAlternatif: string;
  ouRegarder: string;
  motsAChercher: string[];
  siIntrouvable: string;
}

export const FICHES = {
  salaire: {
    titre: "Où trouver ce chiffre ?",
    illustration: "bulletin-net-imposable",
    texteAlternatif:
      "Exemple de bulletin de paie de décembre : la ligne « Net imposable », colonne « Cumul annuel », est entourée en orange. Elle indique 19 560 €.",
    ouRegarder:
      "Sur votre bulletin de paie de décembre, ligne « net imposable », colonne du cumul de l'année. Ce n'est pas le net payé.",
    motsAChercher: ["Net imposable", "Net fiscal", "Cumul imposable", "Montant net imposable"],
    siIntrouvable:
      "Sur impots.gouv.fr, ce montant est déjà écrit dans votre déclaration, case 1AJ (salaires). Sinon, choisissez « Je ne sais pas » : nous additionnerons vos 12 bulletins ensemble.",
  },
} satisfies Record<string, FicheAide>;

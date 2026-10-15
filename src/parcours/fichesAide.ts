// Fiches « Où trouver ce chiffre ? » (docs/02 §4). Texte seulement ; l'illustration est désignée par son nom.

export type IdIllustration =
  | "bulletin-net-imposable"
  | "bulletin-compteurs"
  | "avenant-teletravail"
  | "carte-grise-puissance"
  | "carte-grise-energie"
  | "itineraire";

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
  jours: {
    titre: "Où trouver ces chiffres ?",
    illustration: "bulletin-compteurs",
    texteAlternatif:
      "Exemple de bas de bulletin de paie de décembre : la ligne « Congés payés », colonne « Pris », est entourée en orange. Elle indique 25 jours.",
    ouRegarder:
      "En bas de votre bulletin de décembre, les compteurs de l'année : congés payés pris, RTT pris, absences.",
    motsAChercher: ["Congés payés pris", "CP pris", "RTT pris", "Absence", "Jours non travaillés"],
    siIntrouvable:
      "Demandez le relevé de vos congés au service paie. Ou choisissez « Je ne sais pas » : nous retiendrons {joursPrudents} jours, la valeur la plus prudente. Vous pourrez la corriger plus tard.",
  },
  teletravail: {
    titre: "Où trouver ce chiffre ?",
    illustration: "avenant-teletravail",
    texteAlternatif:
      "Exemple d'avenant au contrat de travail : la ligne « Jours télétravaillés » est entourée en orange. Elle indique 2 jours par semaine.",
    ouRegarder:
      "Dans votre avenant de télétravail, l'accord de votre entreprise ou votre planning habituel.",
    motsAChercher: ["Télétravail", "Travail à distance", "Jours à domicile"],
    siIntrouvable:
      "Indiquez votre habitude : les jours où vous travaillez chez vous, en temps normal. Vous pourrez corriger chaque mois ensuite.",
  },
  distance: {
    titre: "Comment mesurer cette distance ?",
    illustration: "itineraire",
    texteAlternatif:
      "Schéma d'un itinéraire entre la maison et le travail : le trajet le plus court est tracé en bleu et mesure 22 km.",
    ouRegarder:
      "Sur un site ou une application de carte, demandez l'itinéraire de chez vous à votre travail. Retenez le trajet le plus court en kilomètres, pas le plus rapide.",
    motsAChercher: ["Itinéraire le plus court", "Distance", "km"],
    siIntrouvable:
      "Comptez sur le compteur de votre véhicule un jour de trajet normal. Arrondissez toujours vers le bas : c'est le choix prudent.",
  },
  energie: {
    titre: "Où trouver ce renseignement ?",
    illustration: "carte-grise-energie",
    texteAlternatif:
      "Exemple de carte grise : la case P.3, Énergie, est entourée en orange. Elle indique ES, pour essence.",
    ouRegarder: "Sur votre carte grise, case P.3. EL veut dire 100 % électrique.",
    motsAChercher: ["P.3", "Type de carburant ou source d'énergie", "ES (essence)", "GO (diesel)", "EL (électrique)", "EE ou EH (hybride)"],
    siIntrouvable:
      "Choisissez « Je ne sais pas » : nous appliquerons le barème des véhicules thermiques, le plus prudent. Vous pourrez le corriger plus tard.",
  },
  puissance: {
    titre: "Où trouver ce chiffre ?",
    illustration: "carte-grise-puissance",
    texteAlternatif:
      "Exemple de carte grise : la case P.6, Puissance administrative nationale, est entourée en orange. Elle indique 5.",
    ouRegarder: "Sur votre carte grise, case P.6. Le chiffre est le nombre de chevaux.",
    motsAChercher: ["Puissance administrative nationale", "P.6"],
    siIntrouvable:
      "Demandez au vendeur ou au garage, ou choisissez « Je ne sais pas » : nous retiendrons {lignePrudente}, la valeur la plus prudente. Vous pourrez la corriger plus tard.",
  },
} satisfies Record<string, FicheAide>;

/** Remplace les repères {nom} d'un texte de fiche par les valeurs du millésime. */
export function completerFiche(fiche: FicheAide, valeurs: Record<string, string | number>): FicheAide {
  const remplacer = (t: string) => t.replace(/\{(\w+)\}/g, (_, nom: string) => String(valeurs[nom] ?? `{${nom}}`));
  return { ...fiche, ouRegarder: remplacer(fiche.ouRegarder), siIntrouvable: remplacer(fiche.siIntrouvable) };
}

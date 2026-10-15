// Fiches « Où trouver ce chiffre ? » (docs/02 §4). Texte seulement ; l'illustration est désignée par son nom.

export type IdIllustration =
  | "bulletin-net-imposable"
  | "bulletin-compteurs"
  | "avenant-teletravail"
  | "carte-grise-puissance"
  | "carte-grise-energie"
  | "itineraire"
  | "bulletin-titres"
  | "releve-repas"
  | "bulletin-allocation-teletravail"
  | "attestation-syndicat"
  | "bulletin-transport";

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
  prixRepas: {
    titre: "Comment trouver ce prix ?",
    illustration: "releve-repas",
    texteAlternatif:
      "Exemple de relevé de badge de cantine sur trois jours : la ligne « Moyenne », 8,17 €, est entourée en orange.",
    ouRegarder:
      "Vos tickets de caisse, votre relevé de compte ou le relevé de votre badge de cantine. Faites la moyenne sur quelques semaines.",
    motsAChercher: ["Ticket de caisse", "Relevé de badge", "Paiement par carte"],
    siIntrouvable:
      "Choisissez « Je ne sais pas » : nous retiendrons le forfait de {forfait} par repas, la solution la plus prudente. Gardez vos tickets à l'avenir.",
  },
  titres: {
    titre: "Où trouver ces chiffres ?",
    illustration: "bulletin-titres",
    texteAlternatif:
      "Exemple de bulletin de paie : la ligne « Titres-restaurant » est entourée en orange. 20 titres, part employeur 108 €, soit 5,40 € par titre.",
    ouRegarder:
      "Sur votre bulletin de paie, ligne « titres-restaurant » : nombre de titres et part payée par l'employeur. Divisez la part de l'employeur par le nombre de titres.",
    motsAChercher: ["Titres-restaurant", "Tickets restaurant", "Carte repas", "Part patronale"],
    siIntrouvable:
      "Choisissez « Je ne sais pas » pour la part de l'employeur : nous retiendrons {tauxPrudent} de la valeur du titre, le choix le plus prudent.",
  },
  allocationTeletravail: {
    titre: "Où trouver ce chiffre ?",
    illustration: "bulletin-allocation-teletravail",
    texteAlternatif:
      "Exemple de bulletin de paie de décembre : la ligne « Indemnité télétravail », colonne « Cumul annuel », est entourée en orange. Elle indique 220 €.",
    ouRegarder:
      "Sur votre bulletin de décembre, la ligne d'indemnité ou de remboursement de télétravail, colonne du cumul annuel. Elle est souvent parmi les lignes sans cotisations.",
    motsAChercher: ["Indemnité télétravail", "Allocation télétravail", "Forfait télétravail", "Remboursement frais internet"],
    siIntrouvable:
      "Choisissez « Je ne sais pas » : nous ajouterons {forfait} par jour de télétravail à votre salaire, le choix le plus prudent.",
  },
  autresFrais: {
    titre: "Où trouver ces montants ?",
    illustration: "attestation-syndicat",
    texteAlternatif:
      "Exemple d'attestation de cotisation syndicale : la ligne « Cotisations versées », 150 €, est entourée en orange.",
    ouRegarder:
      "Vos factures, tickets, relevés bancaires, attestations de votre syndicat, de votre ordre ou de votre organisme de formation. Additionnez les montants de l'année.",
    motsAChercher: ["Facture", "Attestation", "Reçu", "Montant TTC"],
    siIntrouvable:
      "Sans justificatif, laissez le poste décoché : rien ne sera compté. C'est le choix prudent, et vous pourrez l'ajouter plus tard.",
  },
  transport: {
    titre: "Où trouver ces chiffres ?",
    illustration: "bulletin-transport",
    texteAlternatif:
      "Exemple de bulletin de paie de décembre : la ligne « Remboursement transport », colonne « Cumul annuel », est entourée en orange. Elle indique 450 €.",
    ouRegarder:
      "Le prix de l'abonnement est sur votre attestation annuelle de transport. Ce que rembourse votre employeur est sur le bulletin de décembre, colonne du cumul annuel.",
    motsAChercher: ["Remboursement transport", "Prise en charge abonnement", "Forfait mobilités durables", "Navigo", "Pass"],
    siIntrouvable:
      "Choisissez « Je ne sais pas » pour le remboursement : nous retiendrons la prise en charge habituelle la plus forte, le choix prudent.",
  },
} satisfies Record<string, FicheAide>;

/** Remplace les repères {nom} d'un texte de fiche par les valeurs du millésime. */
export function completerFiche(fiche: FicheAide, valeurs: Record<string, string | number>): FicheAide {
  const remplacer = (t: string) => t.replace(/\{(\w+)\}/g, (_, nom: string) => String(valeurs[nom] ?? `{${nom}}`));
  return { ...fiche, ouRegarder: remplacer(fiche.ouRegarder), siIntrouvable: remplacer(fiche.siIntrouvable) };
}

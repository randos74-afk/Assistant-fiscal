// Étape 6 : vos autres frais (F6) et abonnement de transport (F3.12).
// Chaque poste s'ouvre par une question oui/non ; le métier en ouvre certains d'office.
import type { MontantLibelle } from "../moteur/declarant";
import type { Achat, EntreeLocalProfessionnel } from "../moteur/teletravail";
import { materielAnnee } from "../moteur/teletravail";
import type { Parametres } from "../moteur/types";
import type { IdPoste } from "./metiers";

export type IdAutreFrais =
  | "tenues"
  | "documentation"
  | "formation"
  | "diplome"
  | "rechercheEmploi"
  | "cotisationSyndicale"
  | "cotisationOrdre"
  | "fournitures"
  | "telephone"
  | "materiel"
  | "bureauDomicile"
  | "demenagement"
  | "grandsDeplacements"
  | "invitations"
  | "proces"
  | "empruntCapital"
  | "doubleResidence"
  | "autre";

export type Groupe = "metier" | "emploi" | "situations";

export interface Poste {
  id: IdAutreFrais;
  groupe: Groupe;
  /** Question oui/non qui ouvre le poste. */
  question: string;
  detail?: string;
  /** Libellé repris dans le résumé 1AK. */
  libelleResume: string;
}

export const POSTES: Poste[] = [
  { id: "tenues", groupe: "metier", question: "J'achète et j'entretiens des vêtements de travail", detail: "Bleus, blouses, chaussures de sécurité. Pas les vêtements de ville. Si votre employeur lave vos tenues, ne comptez que l'achat.", libelleResume: "vêtements de travail et entretien" },
  { id: "documentation", groupe: "metier", question: "J'achète des livres ou des revues pour mon métier", libelleResume: "documentation professionnelle" },
  { id: "fournitures", groupe: "metier", question: "J'achète des fournitures pour mon travail", detail: "Hors télétravail, déjà compté à l'étape précédente.", libelleResume: "fournitures" },
  { id: "telephone", groupe: "metier", question: "J'utilise mon téléphone portable pour le travail", detail: "Seulement si votre employeur ne le paie pas.", libelleResume: "téléphone portable, part professionnelle" },
  { id: "materiel", groupe: "metier", question: "J'achète du matériel ou des outils pour mon travail", detail: "Outillage, instruments, ordinateur hors télétravail.", libelleResume: "matériel et outillage" },
  { id: "bureauDomicile", groupe: "metier", question: "Je travaille chez moi, sans bureau fourni par mon employeur", detail: "Préparations, corrections. Hors télétravail, déjà compté à l'étape précédente.", libelleResume: "bureau à domicile" },
  { id: "cotisationOrdre", groupe: "metier", question: "Je paie une cotisation professionnelle obligatoire", detail: "Ordre professionnel, par exemple ordre des infirmiers.", libelleResume: "cotisation professionnelle obligatoire" },
  { id: "cotisationSyndicale", groupe: "metier", question: "Je paie une cotisation syndicale", libelleResume: "cotisation syndicale" },
  { id: "formation", groupe: "emploi", question: "J'ai payé une formation pour mon travail", detail: "Non remboursée : frais d'inscription, déplacements, repas de formation.", libelleResume: "formation professionnelle" },
  { id: "diplome", groupe: "emploi", question: "J'ai préparé un diplôme ou un concours", detail: "Pour améliorer ma situation ou changer de métier.", libelleResume: "préparation d'un diplôme ou d'un concours" },
  { id: "rechercheEmploi", groupe: "emploi", question: "J'ai cherché un emploi en étant inscrit comme demandeur d'emploi", detail: "Déplacements, envois, documentation.", libelleResume: "recherche d'emploi" },
  { id: "demenagement", groupe: "situations", question: "J'ai déménagé pour obtenir ou garder mon emploi", detail: "Frais non remboursés par l'employeur.", libelleResume: "déménagement professionnel" },
  { id: "doubleResidence", groupe: "situations", question: "J'ai un second logement pour mon travail", detail: "Votre famille vit ailleurs, pour une raison qui ne relève pas de la convenance personnelle.", libelleResume: "double résidence" },
  { id: "grandsDeplacements", groupe: "situations", question: "J'ai fait des voyages pour mon travail, non remboursés", detail: "Transport, hôtel, surcoût des repas.", libelleResume: "voyages et grands déplacements" },
  { id: "invitations", groupe: "situations", question: "Mon poste m'oblige à inviter des clients ou partenaires", detail: "Non remboursé. Gardez le nom des invités et l'objet.", libelleResume: "invitations et réceptions" },
  { id: "proces", groupe: "situations", question: "J'ai payé un avocat pour un litige sur mon salaire", detail: "Procédure pour des salaires ou indemnités imposables.", libelleResume: "frais de procédure liés à l'emploi" },
  { id: "empruntCapital", groupe: "situations", question: "J'ai emprunté pour acheter des parts de mon entreprise", detail: "Intérêts de l'année seulement.", libelleResume: "intérêts d'emprunt pour entrer au capital de l'employeur" },
  { id: "autre", groupe: "situations", question: "J'ai d'autres frais justifiés", libelleResume: "autres frais" },
];

export const GROUPES: { id: Groupe; titre: string }[] = [
  { id: "metier", titre: "Pour votre métier" },
  { id: "emploi", titre: "Formation et emploi" },
  { id: "situations", titre: "Situations particulières" },
];

/** Postes ouverts d'office par le profil métier (F14). */
const DEPUIS_PROFIL: Partial<Record<IdPoste, IdAutreFrais>> = {
  tenues: "tenues",
  documentation: "documentation",
  formation: "formation",
  cotisationOrdre: "cotisationOrdre",
  cotisationSyndicale: "cotisationSyndicale",
  materiel: "materiel",
  bureauDomicile: "bureauDomicile",
  fournitures: "fournitures",
  telephone: "telephone",
  demenagement: "demenagement",
  doubleResidence: "doubleResidence",
};

export function postesDuProfil(postes: IdPoste[]): IdAutreFrais[] {
  return postes.map((p) => DEPUIS_PROFIL[p]).filter((x): x is IdAutreFrais => x !== undefined);
}

export interface DoubleResidence {
  motif: string;
  /** Loyer et charges du second logement. */
  logement: number;
  /** Trajets vers le domicile familial : billets, ou km ajoutés au véhicule. */
  billets: number;
  kmVehicule: number;
}

export interface Transport {
  abonnement: number;
  priseEnCharge: number;
  priseEnChargePrudente: boolean;
  /** F12 — Plusieurs employeurs : remboursement de chacun (la somme fait priseEnCharge). */
  priseEnChargeParEmployeur?: number[];
}

export interface SaisieAutresFrais {
  ouverts: IdAutreFrais[];
  montants: Partial<Record<IdAutreFrais, number>>;
  /** Téléphone : abonnement annuel × part professionnelle. */
  telephonePartPro: number;
  achats: Achat[];
  libelleAutre: string;
  doubleResidence: DoubleResidence | null;
  transport: Transport | null;
  /** F6.11 — Bureau à domicile hors télétravail ; salle de travail disponible sur place = point à faire confirmer. */
  bureau?: (EntreeLocalProfessionnel & { salleDisponible: boolean }) | null;
}

/** « Je ne sais pas » : prise en charge prudente de l'abonnement (paramètres), la plus forte. */
export function priseEnChargePrudente(p: Parametres, abonnement: number, agentPublic: boolean): number {
  const v = p.valeurs_prudentes_je_ne_sais_pas;
  const taux = Number(agentPublic ? v.prise_en_charge_abonnement_public : v.prise_en_charge_abonnement_prive);
  return Math.round(abonnement * taux * 100) / 100;
}

export interface ResultatAutresFrais {
  autresFrais: MontantLibelle[];
  motifs: string[];
  /** Km de double résidence à ajouter au véhicule déclaré (barème sur le total annuel). */
  kmVehiculeEnPlus: number;
  /** F6.11 — Bureau à domicile, calculé par le moteur. */
  localProfessionnel?: EntreeLocalProfessionnel;
}

/** Traduit les réponses en lignes du résumé 1AK. */
export function autresFraisPourMoteur(p: Parametres, s: SaisieAutresFrais): ResultatAutresFrais {
  const lignes: MontantLibelle[] = [];
  const motifs: string[] = [];
  let kmVehiculeEnPlus = 0;

  if (s.transport) {
    const net = Math.max(s.transport.abonnement - s.transport.priseEnCharge, 0);
    if (net > 0) lignes.push({ libelle: "abonnement de transport, part non prise en charge par l'employeur", montant: net });
  }

  for (const poste of POSTES) {
    if (!s.ouverts.includes(poste.id) || poste.id === "bureauDomicile") continue;
    let montant = s.montants[poste.id] ?? 0;
    if (poste.id === "telephone") montant = montant * Math.min(Math.max(s.telephonePartPro, 0), 1);
    if (poste.id === "materiel") montant = s.achats.reduce((t, a) => t + materielAnnee(p, a, p.millesime.revenus), 0);
    if (poste.id === "doubleResidence" && s.doubleResidence) {
      montant = s.doubleResidence.logement + s.doubleResidence.billets;
      kmVehiculeEnPlus += s.doubleResidence.kmVehicule;
      if (s.doubleResidence.motif) motifs.push(`double résidence (${s.doubleResidence.motif})`);
    }
    const libelle = poste.id === "autre" && s.libelleAutre.trim() ? s.libelleAutre.trim() : poste.libelleResume;
    if (montant > 0) lignes.push({ libelle, montant });
  }
  const bureau = s.ouverts.includes("bureauDomicile") && s.bureau ? s.bureau : undefined;
  return {
    autresFrais: lignes,
    motifs,
    kmVehiculeEnPlus,
    localProfessionnel: bureau
      ? {
          usage: bureau.usage,
          charges: bureau.charges,
          surfaceBureau: bureau.surfaceBureau,
          surfaceTotale: bureau.surfaceTotale,
          studio: bureau.studio,
          heuresParSemaine: bureau.heuresParSemaine,
          semaines: bureau.semaines,
        }
      : undefined,
  };
}

/** F6.6 — Crédit d'impôt auquel on renonce en déduisant ses cotisations syndicales. */
export function creditImpotSyndicalPerdu(p: Parametres, cotisation: number): number {
  return Math.round(cotisation * p.cotisations_syndicales.taux_credit_impot * 100) / 100;
}

/** F14 grand rouleur — Km des allers-retours vers le domicile familial : distance × 2 × allers-retours par semaine × semaines. */
export function kmVersDomicileFamilial(distanceAller: number, allersRetoursParSemaine: number, semaines: number): number {
  return Math.max(0, distanceAller) * 2 * Math.max(0, allersRetoursParSemaine) * Math.max(0, semaines);
}

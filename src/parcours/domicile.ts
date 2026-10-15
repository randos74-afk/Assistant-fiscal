// F13 — Parcours « intervenants à domicile » : employeurs, indemnités reçues, journées types, contrôle de cohérence.
import type { Energie, EntreeVehicule, JourneeType, MontantLibelle } from "../moteur/declarant";
import { kmJournee } from "../moteur/declarant";
import type { Parametres, TypeVehicule } from "../moteur/types";
import { cvDeLigne, libelleLigne, optionsPuissance } from "./trajet";

export type TypeEmployeur = "association" | "entreprise" | "mandataire" | "particulier" | "public";

export const EMPLOYEURS: { valeur: TypeEmployeur; libelle: string; detail: string }[] = [
  { valeur: "association", libelle: "Une association", detail: "ADMR, UNA, ADEDOM ou une autre structure à but non lucratif." },
  { valeur: "entreprise", libelle: "Une entreprise de services à la personne", detail: "Elle vous emploie et vous envoie chez les personnes." },
  { valeur: "mandataire", libelle: "Une société ou association mandataire", detail: "Une fiche de paie par personne aidée et par mois." },
  { valeur: "particulier", libelle: "Les personnes aidées directement", detail: "Chèque emploi service (CESU) ou Pajemploi." },
  { valeur: "public", libelle: "Une mairie, un centre communal d'action sociale ou un département" , detail: "Vous êtes agent public." },
];

export interface JourneeSaisie extends JourneeType {
  /** Pour chaque tronçon entre deux personnes aidées : remboursé par l'employeur ? */
  rembourses: boolean[];
}

export interface SaisieDomicile {
  employeurs: TypeEmployeur[];
  /** Indemnités kilométriques reçues dans l'année (bulletins), à réintégrer. */
  indemnites: number;
  /** Forfaits ou participations aux frais de transport de l'année, à réintégrer. */
  forfaitsTransport: number;
  forfaitsPrudents: boolean;
  journees: JourneeSaisie[];
  motifDistance?: string;
  /** Kilomètres professionnels ajoutés après le contrôle de cohérence. */
  kmComplementaires: number;
  vehicule: TypeVehicule;
  energie: Energie;
  energiePrudente: boolean;
  ligne?: string;
  puissancePrudente: boolean;
}

/** Libellés des tronçons d'une journée à n tronçons (n - 1 personnes aidées). */
export function libellesTroncons(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const depart = i === 0 ? "Maison" : `Personne ${i}`;
    const arrivee = i === n - 1 ? "Maison" : `Personne ${i + 1}`;
    return `${depart} → ${arrivee}`;
  });
}

/** « Je ne sais pas » pour les forfaits d'un mandataire : une fiche × 12 mois × nombre de personnes aidées. */
export function forfaitsPrudents(montantUneFiche: number, personnesAidees: number): number {
  return Math.round(montantUneFiche * 12 * personnesAidees * 100) / 100;
}

/** Taux d'indemnité de référence selon l'employeur (paramètres) ; null si aucun taux ne peut être supposé. */
export function tauxReference(p: Parametres, employeurs: TypeEmployeur[], vehicule: TypeVehicule): number | null {
  const a = p.aide_a_domicile;
  if (employeurs.length !== 1) return null;
  if (employeurs[0] === "association") {
    return vehicule === "voiture" ? a.indemnite_km_branche_associative_voiture : a.indemnite_km_branche_associative_deux_roues;
  }
  if (employeurs[0] === "entreprise" && vehicule === "voiture") return a.minimum_conventionnel_services_a_la_personne;
  return null;
}

export interface BilanJournees {
  domicileTravail: number;
  professionnels: number;
  professionnelsRembourses: number;
  jours: number;
}

export function bilanJournees(p: Parametres, s: Pick<SaisieDomicile, "journees" | "motifDistance">): BilanJournees {
  const b = { domicileTravail: 0, professionnels: 0, professionnelsRembourses: 0, jours: 0 };
  for (const j of s.journees) {
    const k = kmJournee(p, j, Boolean(s.motifDistance));
    b.domicileTravail += k.domicileTravail * j.jours;
    b.professionnels += k.professionnels * j.jours;
    b.professionnelsRembourses += j.troncons.slice(1, -1).reduce((t, km, i) => t + (j.rembourses[i] ? km : 0), 0) * j.jours;
    b.jours += j.jours;
  }
  return b;
}

/**
 * F13 écran 6 — Les km professionnels déclarés doivent couvrir au moins les km indemnisés
 * (indemnités ÷ taux de référence). Renvoie l'écart à ajouter, ou 0.
 */
export function ecartCoherence(p: Parametres, s: SaisieDomicile): { kmIndemnises: number | null; ecart: number } {
  const taux = tauxReference(p, s.employeurs, s.vehicule);
  if (!taux || s.indemnites <= 0) return { kmIndemnises: null, ecart: 0 };
  const kmIndemnises = Math.round(s.indemnites / taux);
  const pro = bilanJournees(p, s).professionnels + s.kmComplementaires;
  return { kmIndemnises, ecart: Math.max(kmIndemnises - pro, 0) };
}

export function domicilePourMoteur(p: Parametres, s: SaisieDomicile): { vehicule: EntreeVehicule; reintegrations: MontantLibelle[] } {
  const lignes = s.vehicule === "cyclomoteur" ? [] : optionsPuissance(p, s.vehicule).map((o) => o.valeur);
  const reintegrations: MontantLibelle[] = [];
  if (s.indemnites > 0) reintegrations.push({ libelle: "indemnités kilométriques", montant: s.indemnites });
  if (s.forfaitsTransport > 0) reintegrations.push({ libelle: "forfaits de transport", montant: s.forfaitsTransport });
  return {
    vehicule: {
      type: s.vehicule,
      energie: s.energie,
      cv: s.ligne ? cvDeLigne(s.ligne) : undefined,
      libellePuissance: s.ligne ? libelleLigne(s.ligne, lignes) : undefined,
      allerKm: 0,
      joursSurSite: 0,
      journeesTypes: s.journees,
      motifDistance: s.motifDistance,
      kmMissions: s.kmComplementaires || undefined,
    },
    reintegrations,
  };
}

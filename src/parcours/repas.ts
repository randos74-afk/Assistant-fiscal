// Étape 4 : vos repas (F4). Surcoût seulement ; nombre de repas = jours sur site (jamais le télétravail).
import type { EntreeRepasDeclarant, MontantLibelle } from "../moteur/declarant";
import type { Parametres } from "../moteur/types";

export type AccesRepas = "domicile" | "impossible";
export type LieuRepas = "restaurant" | "cantine" | "gamelle";

export const ACCES: { valeur: AccesRepas; libelle: string; detail?: string }[] = [
  { valeur: "impossible", libelle: "Non, je ne peux pas", detail: "C'est trop loin, ou ma pause est trop courte." },
  { valeur: "domicile", libelle: "Oui, je rentre déjeuner chez moi" },
];

export const LIEUX: { valeur: LieuRepas; libelle: string; detail?: string }[] = [
  { valeur: "restaurant", libelle: "Au restaurant, en boulangerie, en snack" },
  { valeur: "cantine", libelle: "À la cantine ou au restaurant d'entreprise" },
  { valeur: "gamelle", libelle: "J'apporte mon repas" },
];

export interface TitresRestaurant {
  /** Valeur d'un titre. */
  valeur: number;
  /** Part payée par l'employeur, par titre. */
  partEmployeur: number;
  partPrudente: boolean;
  /** Part saisie en pourcentage de la valeur du titre (pour réafficher la saisie). */
  partPourcent?: number;
  /** Titres reçus dans l'année (pour la réintégration). */
  nombre: number;
}

export interface SaisieRepas {
  acces: AccesRepas;
  lieu?: LieuRepas;
  /** Repas apporté : une cantine existe-t-elle sur place ou à proximité ? */
  cantineProche?: boolean;
  /** Repas apporté près d'une cantine : part (0 à 1) que l'employeur paie sur les repas de cette cantine. */
  priseEnChargeCantine?: number;
  /** « Je ne sais pas » pour cette part : rien n'est déduit, valeur prudente. */
  priseEnChargeCantinePrudente?: boolean;
  /** Prix moyen payé ; null = « Je ne sais pas », forfait sans surcoût calculé. */
  prix: number | null;
  titres: TitresRestaurant | null;
  /** Prime de panier de l'année, à réintégrer (F4.7). */
  primePanier: number;
  /** Saisie par jour : montant et jours, dont le produit donne primePanier. */
  primePanierParJour?: { montant: number; jours: number };
}

/** Prime de panier de l'année à partir du montant par jour. */
export function primePanierAnnuelle(montantParJour: number, jours: number): number {
  return Math.round(montantParJour * jours * 100) / 100;
}

/** Part de l'employeur en euros à partir d'un pourcentage de la valeur du titre. */
export function partDepuisPourcent(valeurTitre: number, pourcent: number): number {
  return Math.round(valeurTitre * pourcent) / 100;
}

/** « Je ne sais pas » : part de l'employeur prudente, en proportion de la valeur du titre (paramètres). */
export function partEmployeurPrudente(p: Parametres, valeurTitre: number): number {
  const taux = Number(p.valeurs_prudentes_je_ne_sais_pas.part_employeur_titre_restaurant);
  return Math.round(valeurTitre * taux * 100) / 100;
}

/** Les repas ouvrent-ils droit à déduction ? Raison en clair sinon. */
export function repasDeductibles(s: SaisieRepas): { ok: true } | { ok: false; raison: string } {
  if (s.acces === "domicile") {
    return { ok: false, raison: "Les repas pris chez vous ne se déduisent pas. Rien à compter ici." };
  }
  // Repas apporté près d'une cantine : forfait réduit de la part de l'employeur (décision du 15/10/2026).
  // Part inconnue ou totale : rien à déduire, par prudence.
  const tauxCantine = s.priseEnChargeCantinePrudente ? 1 : (s.priseEnChargeCantine ?? 1);
  if (s.lieu === "gamelle" && s.cantineProche && tauxCantine >= 1) {
    return {
      ok: false,
      raison:
        "Avec une cantine sur place ou à côté, un repas apporté ne coûte pas plus cher qu'à la maison. Rien à déduire, par prudence.",
    };
  }
  return { ok: true };
}

const JUSTIFICATIONS: Record<LieuRepas, string> = {
  restaurant: "restaurant, déjeuner à domicile impossible",
  cantine: "cantine, déjeuner à domicile impossible",
  gamelle: "repas apporté, pas de cantine à proximité, déjeuner à domicile impossible",
};

/** Traduit les réponses pour le moteur : un régime de repas et les réintégrations liées. */
export function repasPourMoteur(
  s: SaisieRepas,
  joursSurSite: number,
): { repas: EntreeRepasDeclarant | null; reintegrations: MontantLibelle[] } {
  const reintegrations: MontantLibelle[] = [];
  if (s.titres && s.titres.nombre > 0) {
    reintegrations.push({ libelle: "titres-restaurant part employeur", montant: s.titres.partEmployeur * s.titres.nombre });
  }
  if (s.primePanier > 0) reintegrations.push({ libelle: "prime de panier", montant: s.primePanier });

  const deductible = repasDeductibles(s);
  if (!deductible.ok || !s.lieu || joursSurSite <= 0) return { repas: null, reintegrations };
  const avecCantine = s.lieu === "gamelle" && s.cantineProche === true;
  return {
    repas: {
      nb: joursSurSite,
      // Repas apporté : toujours le forfait. Restaurant ou cantine : prix moyen, ou forfait si inconnu.
      prix: s.lieu === "gamelle" ? null : s.prix,
      partEmployeurTitreRestaurant: s.titres?.partEmployeur,
      tauxEmployeurCantine: avecCantine ? s.priseEnChargeCantine : undefined,
      justification: avecCantine
        ? `repas apporté, cantine sur place payée à ${Math.round(s.priseEnChargeCantine! * 100)} % par l'employeur et non utilisée, déjeuner à domicile impossible`
        : JUSTIFICATIONS[s.lieu],
    },
    reintegrations,
  };
}

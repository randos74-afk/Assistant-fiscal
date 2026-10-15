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

export type RestaurationSurPlace = "aucune" | "cantine" | "distributeurs";

export const SUR_PLACE: { valeur: RestaurationSurPlace; libelle: string; detail?: string }[] = [
  { valeur: "aucune", libelle: "Non, rien sur place ni à côté" },
  { valeur: "cantine", libelle: "Oui, une cantine ou un restaurant d'entreprise" },
  {
    valeur: "distributeurs",
    libelle: "Seulement des distributeurs de plats",
    detail: "Un dépannage qui ne peut pas servir tout le monde : ce n'est pas une cantine.",
  },
];

/** Part de l'employeur sur les distributeurs : en %, en euros par jour, ou en euros sur l'année (fiche de paie). */
export interface PartDistributeurs {
  mode: "pourcent" | "jour" | "annee";
  valeur: number;
}

export interface SaisieRepas {
  acces: AccesRepas;
  lieu?: LieuRepas;
  /** Repas apporté : restauration sur place ou à proximité. */
  surPlace?: RestaurationSurPlace;
  /** Ancienne saisie (avant le 15/10/2026) : true = cantine, false = rien. */
  cantineProche?: boolean;
  /** Distributeurs de dépannage : part que l'employeur y paie, sous la forme connue de la personne. */
  partDistributeurs?: PartDistributeurs;
  /** « Je ne sais pas » pour cette part : rien n'est déduit, valeur prudente. */
  partDistributeursPrudente?: boolean;
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

/** Restauration sur place, y compris pour une ancienne saisie. */
export function restaurationSurPlace(s: SaisieRepas): RestaurationSurPlace | undefined {
  if (s.surPlace) return s.surPlace;
  if (s.cantineProche === undefined) return undefined;
  return s.cantineProche ? "cantine" : "aucune";
}

/**
 * Distributeurs de dépannage : part de l'employeur à retirer du forfait, en taux ou en euros par repas.
 * Règle propre à FraisFit (décision du 15/10/2026, F4.3 bis) : aucun texte officiel ne la prévoit.
 * null = part inconnue (valeur prudente : rien n'est déduit).
 */
export function partEmployeurDistributeurs(s: SaisieRepas, joursSurSite: number): { taux?: number; euros?: number } | null {
  if (s.partDistributeursPrudente || !s.partDistributeurs) return null;
  const { mode, valeur } = s.partDistributeurs;
  if (mode === "pourcent") return { taux: Math.min(Math.max(valeur, 0), 100) / 100 };
  if (mode === "jour") return { euros: Math.max(valeur, 0) };
  return joursSurSite > 0 ? { euros: Math.round((Math.max(valeur, 0) / joursSurSite) * 100) / 100 } : null;
}

/** Les repas ouvrent-ils droit à déduction ? Raison en clair sinon. */
export function repasDeductibles(s: SaisieRepas, p: Parametres, joursSurSite: number): { ok: true } | { ok: false; raison: string } {
  if (s.acces === "domicile") {
    return { ok: false, raison: "Les repas pris chez vous ne se déduisent pas. Rien à compter ici." };
  }
  if (s.lieu !== "gamelle") return { ok: true };
  const surPlace = restaurationSurPlace(s);
  if (surPlace === "cantine") {
    return {
      ok: false,
      raison: "Avec une cantine sur place ou à côté, un repas apporté ne coûte pas plus cher qu'à la maison. Rien à déduire, par prudence.",
    };
  }
  if (surPlace === "distributeurs") {
    const part = partEmployeurDistributeurs(s, joursSurSite);
    const forfait = p.repas.forfait_sans_justificatif_detaille;
    if (!part || (part.taux ?? 0) >= 1 || (part.euros ?? 0) >= forfait) {
      return {
        ok: false,
        raison: part
          ? "La part payée par votre employeur couvre tout le forfait : rien à déduire."
          : "Sans la part payée par votre employeur sur les distributeurs, nous ne déduisons rien. C'est le choix le plus prudent.",
      };
    }
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
  p: Parametres,
): { repas: EntreeRepasDeclarant | null; reintegrations: MontantLibelle[] } {
  const reintegrations: MontantLibelle[] = [];
  if (s.titres && s.titres.nombre > 0) {
    reintegrations.push({ libelle: "titres-restaurant part employeur", montant: s.titres.partEmployeur * s.titres.nombre });
  }
  if (s.primePanier > 0) reintegrations.push({ libelle: "prime de panier", montant: s.primePanier });

  const deductible = repasDeductibles(s, p, joursSurSite);
  if (!deductible.ok || !s.lieu || joursSurSite <= 0) return { repas: null, reintegrations };
  const distributeurs = s.lieu === "gamelle" && restaurationSurPlace(s) === "distributeurs";
  const part = distributeurs ? partEmployeurDistributeurs(s, joursSurSite) : null;
  return {
    repas: {
      nb: joursSurSite,
      // Repas apporté : toujours le forfait. Restaurant ou cantine : prix moyen, ou forfait si inconnu.
      prix: s.lieu === "gamelle" ? null : s.prix,
      partEmployeurTitreRestaurant: s.titres?.partEmployeur,
      tauxEmployeurCantine: part?.taux,
      partEmployeurRepas: part?.euros,
      justification: distributeurs
        ? "repas apporté, pas de cantine, seulement des distributeurs de dépannage non utilisés, part de l'employeur déduite, déjeuner à domicile impossible"
        : JUSTIFICATIONS[s.lieu],
    },
    reintegrations,
  };
}

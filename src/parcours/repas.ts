// Étape 4 : vos repas (F4). Surcoût seulement ; nombre de repas = jours sur site (jamais le télétravail).
import type { EntreeRepasDeclarant, MontantLibelle } from "../moteur/declarant";
import { nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import type { SaisieSecondAllerRetour } from "./secondAllerRetour";

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
  { valeur: "distributeurs", libelle: "Des distributeurs de plats", detail: "Payés en partie par l'employeur, ou non." },
];

/** Part de l'employeur sur les repas pris sur place : en %, en euros par jour, ou en euros sur l'année (fiche de paie). */
export interface PartEmployeurSurPlace {
  mode: "pourcent" | "jour" | "annee";
  valeur: number;
}

export interface SaisieRepas {
  acces: AccesRepas;
  lieu?: LieuRepas;
  /** Restaurant ou repas apporté : restauration collective sur place ou à proximité. */
  surPlace?: RestaurationSurPlace;
  /** Ancienne saisie (avant le 15/10/2026) : true = cantine, false = rien. */
  cantineProche?: boolean;
  /** Restaurant alors qu'une restauration collective existe : prix d'un repas sur place, part de l'employeur éventuelle. */
  prixSurPlace?: { prix: number; part?: PartEmployeurSurPlace };
  /** « Je ne sais pas » pour ce prix : rien n'est déduit, valeur prudente. */
  prixSurPlacePrudent?: boolean;
  /** Prix moyen payé ; null = « Je ne sais pas », forfait sans surcoût calculé. */
  prix: number | null;
  titres: TitresRestaurant | null;
  /** Prime de panier de l'année, à réintégrer (F4.7). */
  primePanier: number;
  /** Saisie par jour : montant et jours, dont le produit donne primePanier. */
  primePanierParJour?: { montant: number; jours: number };
  /** F3.6 — Déjeuner à la maison : second aller-retour déclaré sur circonstance particulière, justification du client. */
  secondAllerRetour?: SaisieSecondAllerRetour;
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

/** Cantine, restaurant d'entreprise ou distributeurs : une restauration collective existe sur place. */
export function restaurationCollective(s: SaisieRepas): boolean {
  const sp = restaurationSurPlace(s);
  return sp === "cantine" || sp === "distributeurs";
}

/** Prix d'un repas sur place payé par le salarié, part de l'employeur déduite ; null si inconnu. */
export function prixSurPlaceNet(s: SaisieRepas, joursSurSite: number): number | null {
  if (s.prixSurPlacePrudent || !s.prixSurPlace) return null;
  const { prix, part } = s.prixSurPlace;
  if (!part) return prix;
  const retrait =
    part.mode === "pourcent"
      ? (prix * Math.min(Math.max(part.valeur, 0), 100)) / 100
      : part.mode === "jour"
        ? part.valeur
        : joursSurSite > 0
          ? part.valeur / joursSurSite
          : 0;
  return Math.max(Math.round((prix - retrait) * 100) / 100, 0);
}

/**
 * Les repas ouvrent-ils droit à déduction ? Raison en clair sinon.
 * Restauration collective sur place (impots.gouv.fr, « obligé de prendre mes repas à l'extérieur ») :
 * repas apporté sans justificatif = rien ; restaurant par choix = plafonné au prix d'un repas sur place.
 */
export function repasDeductibles(s: SaisieRepas, p: Parametres, joursSurSite: number): { ok: true } | { ok: false; raison: string } {
  if (s.acces === "domicile") {
    return { ok: false, raison: "Les repas pris chez vous ne se déduisent pas. Rien à compter ici." };
  }
  if (!restaurationCollective(s) || s.lieu === "cantine") return { ok: true };
  if (s.lieu === "gamelle") {
    return {
      ok: false,
      raison:
        "Une cantine ou des distributeurs existent sur place : un repas apporté ne se déduit pas sans justificatif, selon l'administration fiscale.",
    };
  }
  if (s.prix === null) {
    return { ok: false, raison: "Avec une restauration sur place, il faut le prix réel de vos repas : sans justificatif, rien à déduire." };
  }
  const net = prixSurPlaceNet(s, joursSurSite);
  if (net === null) {
    return { ok: false, raison: "Sans le prix d'un repas sur place, nous ne déduisons rien. C'est le choix le plus prudent." };
  }
  if (net <= p.repas.valeur_repas_au_foyer) {
    return {
      ok: false,
      raison: `Un repas sur place vous coûterait ${nombre(net, 2)} €, pas plus qu'à la maison : rien à déduire, selon l'administration fiscale.`,
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
  p: Parametres,
): { repas: EntreeRepasDeclarant | null; reintegrations: MontantLibelle[] } {
  const reintegrations: MontantLibelle[] = [];
  if (s.titres && s.titres.nombre > 0) {
    reintegrations.push({ libelle: "titres-restaurant part employeur", montant: s.titres.partEmployeur * s.titres.nombre });
  }
  if (s.primePanier > 0) reintegrations.push({ libelle: "prime de panier", montant: s.primePanier });

  const deductible = repasDeductibles(s, p, joursSurSite);
  if (!deductible.ok || !s.lieu || joursSurSite <= 0) return { repas: null, reintegrations };
  const plafond = s.lieu === "restaurant" && restaurationCollective(s) ? prixSurPlaceNet(s, joursSurSite) : null;
  return {
    repas: {
      nb: joursSurSite,
      // Repas apporté : toujours le forfait. Restaurant ou cantine : prix moyen, ou forfait si inconnu.
      prix: s.lieu === "gamelle" ? null : s.prix,
      partEmployeurTitreRestaurant: s.titres?.partEmployeur,
      prixSurPlace: plafond ?? undefined,
      justification:
        plafond !== null && s.prix !== null && plafond < s.prix
          ? `restaurant à ${nombre(s.prix, 2)} €, prix retenu plafonné à celui d'un repas sur place (part employeur déduite), déjeuner à domicile impossible`
          : JUSTIFICATIONS[s.lieu],
    },
    reintegrations,
  };
}

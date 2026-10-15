// Étape 3 : votre trajet (F3). Choix proposés lus dans le barème du millésime, jamais dans le code.
import type { Energie, EntreeVehicule } from "../moteur/declarant";
import type { Parametres, TypeVehicule } from "../moteur/types";

export type ModeTrajet = TypeVehicule | "transports" | "doux";

export const MODES: { valeur: ModeTrajet; libelle: string; detail?: string }[] = [
  { valeur: "voiture", libelle: "En voiture" },
  { valeur: "moto", libelle: "En moto ou en scooter", detail: "Plus de 50 cm³." },
  { valeur: "cyclomoteur", libelle: "En cyclomoteur", detail: "50 cm³ ou moins, 45 km/h au plus." },
  { valeur: "transports", libelle: "En transports en commun" },
  { valeur: "doux", libelle: "À vélo ou à pied" },
];

/** F3.4 — Circonstances qui permettent de retenir la distance réelle au-delà du plafond. */
export const MOTIFS_DISTANCE: { valeur: string; libelle: string }[] = [
  { valeur: "emploi du conjoint", libelle: "Mon conjoint ou partenaire travaille loin de mon travail" },
  { valeur: "emploi précaire ou mobile", libelle: "Mon emploi est précaire ou change souvent de lieu" },
  { valeur: "mutation", libelle: "J'ai été muté par mon employeur" },
  { valeur: "embauche éloignée après un licenciement", libelle: "J'ai retrouvé un emploi loin après un licenciement" },
  { valeur: "raison de santé", libelle: "Pour une raison de santé (moi ou un proche)" },
  { valeur: "scolarité des enfants", libelle: "Pour la scolarité de mes enfants" },
  { valeur: "mandat électif local", libelle: "J'ai un mandat d'élu local" },
  { valeur: "coût du logement près du travail hors de proportion", libelle: "Se loger près du travail coûte beaucoup trop cher" },
];

export const ENERGIES: { valeur: Energie; libelle: string }[] = [
  { valeur: "essence", libelle: "Essence" },
  { valeur: "diesel", libelle: "Diesel" },
  { valeur: "hybride", libelle: "Hybride (essence ou diesel et électrique)" },
  { valeur: "GPL", libelle: "GPL ou bioéthanol" },
  { valeur: "hydrogène", libelle: "Hydrogène" },
  { valeur: "électrique", libelle: "100 % électrique" },
];

function lignesDuBareme(p: Parametres, type: TypeVehicule): string[] {
  if (type === "cyclomoteur") return [];
  return Object.keys(p.bareme_kilometrique[`${type}_thermique`].lignes);
}

/** Libellé d'une ligne du barème : « 3 CV et moins », « 5 CV », « 7 CV et plus », « 3 à 5 CV », « Plus de 5 CV ». */
export function libelleLigne(ligne: string, toutesLesLignes: string[]): string {
  const plage = /^(\d+)-(\d+)$/.exec(ligne);
  if (plage) return Number(plage[2]) - Number(plage[1]) === 1 ? `${plage[1]} ou ${plage[2]} CV` : `${plage[1]} à ${plage[2]} CV`;
  const auDela = /^(\d+)\+$/.exec(ligne);
  if (auDela) return `Plus de ${auDela[1]} CV`;
  const valeurs = toutesLesLignes.map(Number);
  if (Number(ligne) === Math.min(...valeurs)) return `${ligne} CV et moins`;
  if (Number(ligne) === Math.max(...valeurs)) return `${ligne} CV et plus`;
  return `${ligne} CV`;
}

export function optionsPuissance(p: Parametres, type: TypeVehicule): { valeur: string; libelle: string }[] {
  const lignes = lignesDuBareme(p, type);
  return lignes.map((l) => ({ valeur: l, libelle: libelleLigne(l, lignes) }));
}

/** « Je ne sais pas » : la ligne la plus basse du barème (3 CV pour une voiture, valeur des paramètres). */
export function lignePrudente(p: Parametres, type: TypeVehicule): string {
  if (type === "voiture") return String(p.valeurs_prudentes_je_ne_sais_pas.puissance_cv);
  return lignesDuBareme(p, type)[0];
}

/** Puissance représentative d'une ligne, pour choisir la ligne du barème dans le moteur. */
export function cvDeLigne(ligne: string): number {
  const plage = /^(\d+)-(\d+)$/.exec(ligne);
  if (plage) return Number(plage[2]);
  const auDela = /^(\d+)\+$/.exec(ligne);
  if (auDela) return Number(auDela[1]) + 1;
  return Number(ligne);
}

export interface SaisieTrajet {
  mode: ModeTrajet;
  allerKm: number;
  /** Motif choisi au-delà du plafond ; absent = distance plafonnée. */
  motifDistance?: string;
  energie: Energie | "thermique";
  energiePrudente: boolean;
  /** Clé de la ligne du barème (« 5 », « 3-5 »…), absente pour un cyclomoteur. */
  ligne?: string;
  puissancePrudente: boolean;
  kmMissions: number;
  peagesParking: number;
  interetsCredit: number;
  kmTotauxCompteur?: number;
}

export function estVehicule(mode: ModeTrajet): mode is TypeVehicule {
  return mode === "voiture" || mode === "moto" || mode === "cyclomoteur";
}

/** Traduit les réponses en entrée du moteur de calcul (un véhicule). */
export function vehiculePourMoteur(p: Parametres, t: SaisieTrajet, joursSurSite: number): EntreeVehicule | null {
  if (!estVehicule(t.mode)) return null;
  const lignes = lignesDuBareme(p, t.mode);
  return {
    type: t.mode,
    energie: t.energie,
    cv: t.ligne ? cvDeLigne(t.ligne) : undefined,
    libellePuissance: t.ligne ? libelleLigne(t.ligne, lignes) : undefined,
    allerKm: t.allerKm,
    joursSurSite,
    motifDistance: t.motifDistance,
    kmMissions: t.kmMissions || undefined,
    peagesParking: t.peagesParking || undefined,
    interetsCredit: t.interetsCredit || undefined,
    kmTotauxCompteur: t.kmTotauxCompteur,
  };
}

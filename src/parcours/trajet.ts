// Étape 3 : votre trajet (F3). Choix proposés lus dans le barème du millésime, jamais dans le code.
import { distanceRetenue } from "../moteur/calcul";
import type { Energie, EntreeVehicule } from "../moteur/declarant";
import { nombre } from "../moteur/format";
import type { Parametres, TypeVehicule } from "../moteur/types";
import { nomEmployeur, type Employeur } from "./employeurs";

export type ModeTrajet = TypeVehicule | "covoiturage" | "transports" | "doux";

export const MODES: { valeur: ModeTrajet; libelle: string; detail?: string }[] = [
  { valeur: "voiture", libelle: "En voiture" },
  { valeur: "moto", libelle: "En moto ou en scooter", detail: "Plus de 50 cm³." },
  { valeur: "cyclomoteur", libelle: "En cyclomoteur", detail: "50 cm³ ou moins, 45 km/h au plus." },
  { valeur: "covoiturage", libelle: "En covoiturage, comme passager", detail: "Vous payez un conducteur, par une plateforme ou entre collègues." },
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

/** F10.4 et F10.5 — Sans conjoint (personne seule ou veuve), le motif « emploi du conjoint » n'est pas proposé. */
export function motifsDistance(couple?: boolean): { valeur: string; libelle: string }[] {
  return couple === false ? MOTIFS_DISTANCE.filter((m) => m.valeur !== "emploi du conjoint") : MOTIFS_DISTANCE;
}

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
  /** F12 — Plusieurs employeurs : distance aller et jours sur site de chacun, dans l'ordre des fiches du salaire. */
  employeurs?: { allerKm: number; joursSurSite: number }[];
  /** F3.8 — Total des kilomètres professionnels de l'année déjà calculé par la personne ; remplace distance × jours. */
  kmAnnuel?: number;
  /** Ajout n° 1 — Passager d'un covoiturage : somme payée au conducteur dans l'année ; null = « Je ne sais pas » (rien déduit). */
  montantPaye?: number | null;
  /**
   * Ajout n° 1 — Conducteur d'un covoiturage : participations reçues (null = « Je ne sais pas » : les jours de covoiturage
   * ne sont pas déduits) et jours de covoiturage par semaine (null = « Je ne sais pas » : tous les jours).
   */
  covoiturage?: { participations: number | null; joursParSemaine: number | null };
  /** F14 enseignant remplaçant — Un trajet par établissement (nom, distance aller, jours), additionnés avant le barème. */
  lieux?: { nom: string; allerKm: number; joursSurSite: number }[];
  /** F14 soignant (soins à domicile) — Indemnités kilométriques reçues dans l'année, à ajouter au salaire. */
  indemnitesKmRecues?: number;
}

export function estVehicule(mode: ModeTrajet): mode is TypeVehicule {
  return mode === "voiture" || mode === "moto" || mode === "cyclomoteur";
}

/** Traduit les réponses en entrée du moteur de calcul (un véhicule). */
export function vehiculePourMoteur(p: Parametres, t: SaisieTrajet, joursSurSite: number, employeurs?: Employeur[]): EntreeVehicule | null {
  if (!estVehicule(t.mode)) return null;
  const parEmployeur =
    employeurs && employeurs.length > 1 && t.employeurs?.length === employeurs.length && t.kmAnnuel === undefined
      ? t.employeurs.map((e, i) => ({ nom: nomEmployeur(employeurs[i], i), allerKm: e.allerKm, joursSurSite: e.joursSurSite }))
      : t.lieux?.length && t.kmAnnuel === undefined
        ? t.lieux.map((l, i) => ({ nom: l.nom.trim() || `établissement ${i + 1}`, allerKm: l.allerKm, joursSurSite: l.joursSurSite }))
        : undefined;
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
    kmForce: t.kmAnnuel,
    trajetsEmployeurs: parEmployeur,
  };
}

/**
 * Retire des jours du trajet d'un véhicule (jours en passager, jours de covoiturage non déduits) :
 * km, péages et parking de ces jours. Renvoie une alerte si le total de km a été saisi sans distance.
 */
export function retirerJoursDuTrajet(p: Parametres, v: EntreeVehicule, n: number): string | null {
  if (n <= 0) return null;
  if (v.kmForce !== undefined) {
    if (v.allerKm > 0) {
      v.kmForce = Math.max(0, v.kmForce - distanceRetenue(p, v.allerKm, Boolean(v.motifDistance)) * 2 * n);
      return null;
    }
    return `Vous avez indiqué un total de km : retirez-en vous-même les km de ces ${nombre(n)} jours.`;
  }
  const site = v.trajetsEmployeurs?.length ? v.trajetsEmployeurs.reduce((s, t) => s + t.joursSurSite, 0) : v.joursSurSite;
  const ratio = site > 0 ? Math.max(0, site - n) / site : 0;
  if (v.trajetsEmployeurs?.length) {
    v.trajetsEmployeurs = v.trajetsEmployeurs.map((t) => ({ ...t, joursSurSite: Math.round(t.joursSurSite * ratio) }));
  } else {
    v.joursSurSite = Math.max(0, v.joursSurSite - n);
  }
  if (v.peagesParking) v.peagesParking = Math.round(v.peagesParking * ratio * 100) / 100;
  return null;
}

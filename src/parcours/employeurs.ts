// F12 — Plusieurs employeurs dans l'année : l'application fait les additions et les montre.
import { euros } from "../moteur/format";
import { repartirAuProrata } from "./calendrier";

export const NOMS_MOIS_LONGS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export interface Employeur {
  /** Nom libre ; vide = « Employeur 1, 2… ». */
  nom: string;
  /** Mois de début et de fin, 0 = janvier … 11 = décembre. */
  debut: number;
  fin: number;
  /** Net imposable cumulé lu sur le dernier bulletin ; null si inconnu (raccourci F12.4). */
  salaire: number | null;
}

export function nomEmployeur(e: Employeur, i: number): string {
  return e.nom.trim() || `Employeur ${i + 1}`;
}

export function periode(e: Employeur): string {
  return e.debut === e.fin ? NOMS_MOIS_LONGS[e.debut] : `${NOMS_MOIS_LONGS[e.debut]} à ${NOMS_MOIS_LONGS[e.fin]}`;
}

export function actifLeMois(e: Employeur, mois: number): boolean {
  return mois >= e.debut && mois <= e.fin;
}

/** F12.3 — Addition des salaires connus. */
export function totalSalaires(employeurs: Employeur[]): number {
  return Math.round(employeurs.reduce((s, e) => s + (e.salaire ?? 0), 0) * 100) / 100;
}

/**
 * F12.5 — Jours sur site de chaque employeur, à partir des jours sur site de chaque mois.
 * Un mois partagé (deux temps partiels) est réparti à parts égales ; un mois sans employeur ne compte pas.
 */
export function joursSurSiteParEmployeur(employeurs: Employeur[], siteParMois: number[]): number[] {
  const jours = employeurs.map(() => 0);
  siteParMois.forEach((site, mois) => {
    const actifs = employeurs.map((e, i) => (actifLeMois(e, mois) ? i : -1)).filter((i) => i >= 0);
    const parts = repartirAuProrata(site, actifs.map(() => 1));
    actifs.forEach((i, k) => (jours[i] += parts[k]));
  });
  return jours;
}

/** F12.8 — Une ligne par employeur, reprise dans les motifs du résumé 1AK. */
export function resumeEmployeurs(employeurs: Employeur[], distances?: number[]): string {
  const lignes = employeurs.map((e, i) => {
    const details = [periode(e)];
    if (e.salaire !== null) details.push(`salaire ${euros(e.salaire)}`);
    if (distances?.[i]) details.push(`${distances[i]} km aller`);
    return `${nomEmployeur(e, i)} (${details.join(", ")})`;
  });
  return `${employeurs.length} employeurs dans l'année : ${lignes.join(", ")}`;
}

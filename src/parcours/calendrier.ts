// F2 — Calendrier de présence : jours travaillés de l'année, puis répartition mois par mois
// entre jours sur site, télétravail et déplacement. Calendrier réel (fériés compris), aucun chiffre fiscal.

import type { Parametres } from "../moteur/types";

/**
 * « Je ne sais pas » : valeur prudente des paramètres pour un temps plein, au prorata
 * (arrondi inférieur) pour un temps partiel, afin de toujours retenir le moins de jours.
 */
export function joursPrudents(p: Parametres, joursParSemaine: number): number {
  const tempsPlein = Number(p.valeurs_prudentes_je_ne_sais_pas.jours_travailles_temps_plein);
  return joursParSemaine >= 5 ? tempsPlein : Math.floor((tempsPlein * joursParSemaine) / 5);
}

/** Dimanche de Pâques (algorithme de Meeus, calendrier grégorien). */
export function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour));
}

function decaler(date: Date, jours: number): Date {
  return new Date(date.getTime() + jours * 86400000);
}

/** Jours fériés légaux ; Alsace-Moselle : Vendredi saint et 26 décembre en plus. */
export function joursFeries(annee: number, alsaceMoselle = false): Date[] {
  const p = paques(annee);
  const fixe = (mois: number, jour: number) => new Date(Date.UTC(annee, mois - 1, jour));
  const feries = [
    fixe(1, 1),
    decaler(p, 1), // lundi de Pâques
    fixe(5, 1),
    fixe(5, 8),
    decaler(p, 39), // Ascension
    decaler(p, 50), // lundi de Pentecôte
    fixe(7, 14),
    fixe(8, 15),
    fixe(11, 1),
    fixe(11, 11),
    fixe(12, 25),
  ];
  if (alsaceMoselle) feries.push(decaler(p, -2), fixe(12, 26));
  return feries;
}

/** Jours de la semaine travaillés : 5 = du lundi au vendredi, 6 = du lundi au samedi, 3 = lundi à mercredi. */
function estJourTravaille(date: Date, joursParSemaine: number): boolean {
  const rang = (date.getUTCDay() + 6) % 7; // 0 = lundi … 6 = dimanche
  return rang < joursParSemaine;
}

export interface CalendrierMois {
  /** Jours de semaine travaillés du mois, fériés non retirés. */
  ouvres: number;
  /** Fériés tombant un jour travaillé. */
  feries: number;
}

export function calendrierParMois(annee: number, joursParSemaine: number, alsaceMoselle = false): CalendrierMois[] {
  const feries = new Set(joursFeries(annee, alsaceMoselle).map((d) => d.getTime()));
  const mois: CalendrierMois[] = Array.from({ length: 12 }, () => ({ ouvres: 0, feries: 0 }));
  for (let d = new Date(Date.UTC(annee, 0, 1)); d.getUTCFullYear() === annee; d = decaler(d, 1)) {
    if (!estJourTravaille(d, joursParSemaine)) continue;
    const m = mois[d.getUTCMonth()];
    m.ouvres++;
    if (feries.has(d.getTime())) m.feries++;
  }
  return mois;
}

export interface EntreeJours {
  annee: number;
  joursParSemaine: number;
  semainesConges: number;
  rtt: number;
  /** Arrêts maladie, maternité, chômage partiel, congés sans solde (F2.4). */
  absences: number;
  alsaceMoselle?: boolean;
}

export interface JoursTravailles {
  ouvres: number;
  feries: number;
  conges: number;
  rtt: number;
  absences: number;
  total: number;
  /** Jours travaillés de chaque mois, retraits répartis au prorata (à corriger par la personne). */
  parMois: number[];
}

/**
 * Répartit un total entier au prorata de poids, en entiers, sans perte (méthode du plus fort reste).
 */
export function repartirAuProrata(total: number, poids: number[]): number[] {
  const somme = poids.reduce((s, p) => s + p, 0);
  if (somme === 0 || total <= 0) return poids.map(() => 0);
  const exacts = poids.map((p) => (total * p) / somme);
  const entiers = exacts.map(Math.floor);
  let reste = total - entiers.reduce((s, x) => s + x, 0);
  const ordre = exacts.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (const { i } of ordre) {
    if (reste <= 0) break;
    entiers[i]++;
    reste--;
  }
  return entiers;
}

export function joursTravailles(e: EntreeJours): JoursTravailles {
  const cal = calendrierParMois(e.annee, e.joursParSemaine, e.alsaceMoselle);
  const disponibles = cal.map((m) => m.ouvres - m.feries);
  const ouvres = cal.reduce((s, m) => s + m.ouvres, 0);
  const feries = cal.reduce((s, m) => s + m.feries, 0);
  const conges = e.semainesConges * e.joursParSemaine;
  const retraits = Math.min(conges + e.rtt + e.absences, ouvres - feries);
  const retraitParMois = repartirAuProrata(retraits, disponibles);
  const parMois = disponibles.map((d, i) => d - retraitParMois[i]);
  return {
    ouvres,
    feries,
    conges,
    rtt: e.rtt,
    absences: e.absences,
    total: parMois.reduce((s, x) => s + x, 0),
    parMois,
  };
}

export interface JoursDuMois {
  site: number;
  teletravail: number;
  deplacement: number;
}

/**
 * Mode simple : télétravail habituel par semaine et jours de déplacement de l'année,
 * répartis au prorata des jours travaillés de chaque mois.
 */
export function repartitionSimple(
  joursParMois: number[],
  joursParSemaine: number,
  teletravailParSemaine: number,
  deplacementsAnnee: number,
): JoursDuMois[] {
  const total = joursParMois.reduce((s, x) => s + x, 0);
  const tt = repartirAuProrata(Math.round((total * teletravailParSemaine) / joursParSemaine), joursParMois);
  const dep = repartirAuProrata(Math.min(deplacementsAnnee, total), joursParMois);
  return joursParMois.map((j, i) => {
    const teletravail = Math.min(tt[i], j);
    const deplacement = Math.min(dep[i], j - teletravail);
    return { site: j - teletravail - deplacement, teletravail, deplacement };
  });
}

export function totaux(mois: JoursDuMois[]): JoursDuMois & { travailles: number } {
  const t = mois.reduce(
    (s, m) => ({ site: s.site + m.site, teletravail: s.teletravail + m.teletravail, deplacement: s.deplacement + m.deplacement }),
    { site: 0, teletravail: 0, deplacement: 0 },
  );
  return { ...t, travailles: t.site + t.teletravail + t.deplacement };
}

/** Jours calendaires d'un mois : limite physique d'une saisie mensuelle (F2.6). */
export function joursDansLeMois(annee: number, mois: number): number {
  return new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
}

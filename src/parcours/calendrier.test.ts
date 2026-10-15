import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import {
  calendrierParMois,
  joursDansLeMois,
  joursFeries,
  joursPrudents,
  joursTravailles,
  paques,
  repartirAuProrata,
  repartitionSimple,
  totaux,
} from "./calendrier";

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("Calendrier réel (F2)", () => {
  it("calcule Pâques", () => {
    expect(iso(paques(2025))).toBe("2025-04-20");
    expect(iso(paques(2026))).toBe("2026-04-05");
    expect(iso(paques(2024))).toBe("2024-03-31");
  });

  it("liste les 11 fériés de 2025, dont Ascension et Pentecôte", () => {
    const f = joursFeries(2025).map(iso);
    expect(f).toHaveLength(11);
    expect(f).toContain("2025-04-21");
    expect(f).toContain("2025-05-29");
    expect(f).toContain("2025-06-09");
  });

  it("ajoute Vendredi saint et 26 décembre en Alsace-Moselle", () => {
    const f = joursFeries(2025, true).map(iso);
    expect(f).toContain("2025-04-18");
    expect(f).toContain("2025-12-26");
  });

  it("compte 261 jours du lundi au vendredi en 2025, dont 10 fériés", () => {
    const cal = calendrierParMois(2025, 5);
    expect(cal.reduce((s, m) => s + m.ouvres, 0)).toBe(261);
    // Seul le 1er novembre (samedi) tombe un week-end.
    expect(cal.reduce((s, m) => s + m.feries, 0)).toBe(10);
  });

  it("temps plein 2025 : 261 - 10 fériés - 25 jours de congés = 226 jours", () => {
    const j = joursTravailles({ annee: 2025, joursParSemaine: 5, semainesConges: 5, rtt: 0, absences: 0 });
    expect(j.total).toBe(226);
    expect(j.parMois.reduce((s, x) => s + x, 0)).toBe(226);
  });

  it("retire RTT et absences", () => {
    const j = joursTravailles({ annee: 2025, joursParSemaine: 5, semainesConges: 5, rtt: 8, absences: 10 });
    expect(j.total).toBe(208);
  });

  it("temps partiel 3 jours : congés comptés en semaines de 3 jours", () => {
    const j = joursTravailles({ annee: 2025, joursParSemaine: 3, semainesConges: 5, rtt: 0, absences: 0 });
    expect(j.conges).toBe(15);
    expect(j.total).toBe(j.ouvres - j.feries - 15);
  });

  it("ne descend jamais sous zéro", () => {
    const j = joursTravailles({ annee: 2025, joursParSemaine: 5, semainesConges: 5, rtt: 0, absences: 400 });
    expect(j.total).toBe(0);
    expect(j.parMois.every((x) => x >= 0)).toBe(true);
  });
});

describe("Répartition mois par mois", () => {
  it("répartit un total entier sans perte", () => {
    const r = repartirAuProrata(38, [20, 20, 22, 20, 18, 21, 22, 10, 22, 22, 19, 20]);
    expect(r.reduce((s, x) => s + x, 0)).toBe(38);
  });

  it("2 jours de télétravail sur 5 : 40 % des jours de chaque mois", () => {
    const j = joursTravailles({ annee: 2025, joursParSemaine: 5, semainesConges: 5, rtt: 0, absences: 0 });
    const r = repartitionSimple(j.parMois, 5, 2, 0);
    const t = totaux(r);
    expect(t.travailles).toBe(226);
    expect(t.teletravail).toBe(Math.round((226 * 2) / 5));
    expect(r.every((m, i) => m.site + m.teletravail + m.deplacement === j.parMois[i])).toBe(true);
  });

  it("place les jours de déplacement sans dépasser les jours du mois", () => {
    const r = repartitionSimple([10, 0, 5], 5, 0, 12);
    expect(totaux(r).deplacement).toBe(12);
    expect(r[1]).toEqual({ site: 0, teletravail: 0, deplacement: 0 });
  });

  it("connaît la longueur des mois", () => {
    expect(joursDansLeMois(2025, 1)).toBe(28);
    expect(joursDansLeMois(2024, 1)).toBe(29);
  });
});

describe("Valeur prudente des jours", () => {
  const p = chargerParametres(2025);
  it("retient 218 jours pour un temps plein (paramètres)", () => {
    expect(joursPrudents(p, 5)).toBe(218);
    expect(joursPrudents(p, 6)).toBe(218);
  });
  it("proratise vers le bas pour un temps partiel", () => {
    expect(joursPrudents(p, 3)).toBe(130);
  });

  it("total de télétravail de l'année connu : réparti au prorata des mois travaillés (F5.1)", () => {
    const mois = repartitionSimple([20, 20, 0, 20, 20, 20, 20, 20, 20, 20, 20, 20], 5, 0, 0, 55);
    expect(mois.reduce((s, m) => s + m.teletravail, 0)).toBe(55);
    expect(mois[2].teletravail).toBe(0);
  });
});

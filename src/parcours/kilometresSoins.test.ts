import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { calculerParcours } from "./assemblage";
import { kmDepuisBulletins, kmDepuisCompteur } from "./kilometresSoins";

const p = chargerParametres(2025);

describe("F14 soignant — aide au calcul des km de soins à domicile", () => {
  it("bulletins : 12 mois de km indemnisés + trajets maison plafonnés", () => {
    const r = kmDepuisBulletins(p, Array(12).fill(180), 8, 10, 200);
    expect(r).toEqual({ tournees: 2160, domicileTravail: 3600, total: 5760 });
  });

  it("bulletins : un trajet maison au-delà du plafond est ramené au plafond sans motif", () => {
    expect(kmDepuisBulletins(p, [], 55, 10, 100).domicileTravail).toBe((40 + 10) * 100);
    expect(kmDepuisBulletins(p, [], 55, 10, 100, true).domicileTravail).toBe((55 + 10) * 100);
  });

  it("compteur : semaine habituelle × semaines travaillées", () => {
    expect(kmDepuisCompteur(312, 45)).toBe(14040);
  });

  it("indemnités kilométriques reçues : ajoutées au salaire (réintégration)", () => {
    const r = calculerParcours(p, {
      salaire: { montant: 24000, source: "bulletin-decembre" },
      trajet: { mode: "voiture", allerKm: 0, kmAnnuel: 5800, energie: "diesel", energiePrudente: false, ligne: "4", puissancePrudente: false, kmMissions: 0, peagesParking: 0, interetsCredit: 0, indemnitesKmRecues: 836 },
    });
    expect(r.totalReintegrations).toBe(836);
    expect(r.comparaison.salaireCorrige).toBe(24836);
  });
});

import { describe, expect, it } from "vitest";
import { calculerDeclarant } from "../moteur/declarant";
import { chargerParametres } from "../moteur/parametres";
import { allocationPrudente, comparerMethodes, entreeReel, reintegrationsTeletravail, type SaisieTeletravail } from "./teletravail";

const p = chargerParametres(2025);
const huitParMois = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0];

const base: SaisieTeletravail = {
  allocation: 0,
  allocationPrudente: false,
  comparer: true,
  usage: "dedie",
  studio: false,
  surfaceBureau: 10,
  surfaceTotale: 100,
  chargesLogement: 10000,
  depensesBureau: 0,
  communication: 0,
  fournitures: 0,
  achats: [],
  methode: "forfait",
};

describe("Le télétravail (F5)", () => {
  it("compare forfait et frais réels et désigne le plus favorable", () => {
    const c = comparerMethodes(p, base, huitParMois, 218);
    expect(c.forfait).toBeCloseTo(237.6, 2);
    expect(c.reel).toBe(Math.floor((10000 * 0.1 * 88) / 218)); // 403,67 → 403
    expect(c.meilleure).toBe("reel");
  });

  it("garde le forfait quand on ne compare pas", () => {
    const c = comparerMethodes(p, { ...base, comparer: false }, huitParMois, 218);
    expect(c.reel).toBe(0);
    expect(c.meilleure).toBe("forfait");
  });

  it("ajoute le matériel amorti et les fournitures aux frais réels", () => {
    const s: SaisieTeletravail = {
      ...base,
      usage: "aucun",
      fournitures: 50,
      achats: [{ libelle: "ordinateur", prixHT: 1200, usagePro: 0.5, anneeAchat: 2025, moisAchat: 7 }],
    };
    expect(comparerMethodes(p, s, huitParMois, 218).reel).toBe(150); // 50 + 1 200 / 3 × 6/12 × 50 %
  });

  it("donne un total égal à la somme des parties affichées", () => {
    const s: SaisieTeletravail = {
      ...base,
      surfaceTotale: 70,
      chargesLogement: 9600,
      communication: 480,
      fournitures: 60,
      achats: [{ libelle: "ordinateur", prixHT: 900, usagePro: 0.8, anneeAchat: 2025, moisAchat: 3 }],
    };
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 30000,
      teletravailMethode: "reel",
      teletravailReel: entreeReel(s, 91, 226),
    });
    expect(r.texte).toContain("552 €, internet et téléphone 59 €, fournitures 60 €, matériel 200 € = 871 €.");
    expect(r.montantCase).toBe(871);
  });

  it("écrit la méthode retenue dans le résumé 1AK", () => {
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 30000,
      teletravailJoursParMois: huitParMois,
      teletravailMethode: "reel",
      teletravailReel: entreeReel(base, 88, 218),
    });
    expect(r.texte).toContain("Télétravail : frais réels : local réservé au travail (10/100 m², 88/218 j) 403 € = 403 €.");
  });

  it("réintègre l'allocation de l'employeur, prudente = forfait journalier × jours", () => {
    expect(reintegrationsTeletravail({ ...base, allocation: 300 })).toEqual([{ libelle: "allocation télétravail", montant: 300 }]);
    expect(allocationPrudente(p, 88)).toBeCloseTo(237.6, 2);
  });
});

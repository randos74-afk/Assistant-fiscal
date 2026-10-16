import { describe, expect, it } from "vitest";
import { afficherMontant, erreurEntier, erreurMontant, lireEntier, lireMontant, partUsagePro } from "./saisie";

describe("Lecture des montants", () => {
  it.each([
    ["23456", 23456],
    ["23 456,78", 23456.78],
    ["23 456,78 €", 23456.78],
    ["23456.5", 23456.5],
    ["  1 200 ", 1200],
  ])("lit « %s »", (texte, attendu) => {
    expect(lireMontant(texte)).toBe(attendu);
  });

  it("renvoie null pour une saisie vide", () => {
    expect(lireMontant("  ")).toBeNull();
    expect(erreurMontant("")).toBeNull();
  });

  it.each(["abc", "12,3,4", "-500", "12,345"])("refuse « %s » avec un message clair", (texte) => {
    expect(Number.isNaN(lireMontant(texte))).toBe(true);
    expect(erreurMontant(texte)).toContain("chiffres");
  });

  it("affiche à la française", () => {
    expect(afficherMontant(23456.78)).toBe("23 456,78");
    expect(afficherMontant(1200)).toBe("1 200");
  });
});

describe("Lecture des nombres de jours", () => {
  it("lit les entiers et refuse les décimales", () => {
    expect(lireEntier(" 12 ")).toBe(12);
    expect(lireEntier("")).toBeNull();
    expect(Number.isNaN(lireEntier("2,5"))).toBe(true);
    expect(erreurEntier("abc")).toContain("entier");
  });
});

describe("Part d'usage professionnel d'un appareil", () => {
  it("heures de travail sur heures au total, arrondi vers le bas", () => {
    expect(partUsagePro(6, 8)).toBe(42);
    expect(partUsagePro(10, 0)).toBe(100);
    expect(partUsagePro(0, 0)).toBeNull();
  });
});

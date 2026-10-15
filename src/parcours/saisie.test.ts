import { describe, expect, it } from "vitest";
import { afficherMontant, erreurMontant, lireMontant } from "./saisie";

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

import { describe, expect, it } from "vitest";
import { lireDossier } from "./sauvegarde";

describe("Lecture d'un dossier sauvegardé (F9.3)", () => {
  it("accepte un dossier FraisFit valide", () => {
    const d = lireDossier(JSON.stringify({ application: "FraisFit", version: 1, millesime: 2025, ecran: "repas", enregistreLe: "x" }));
    expect(d?.ecran).toBe("repas");
    expect(d?.reponsesFiltrage).toEqual({});
  });

  it.each([
    ["texte quelconque", "bonjour"],
    ["autre application", JSON.stringify({ application: "Autre", version: 1, millesime: 2025, ecran: "x" })],
    ["version future", JSON.stringify({ application: "FraisFit", version: 99, millesime: 2025, ecran: "x" })],
  ])("refuse un fichier non reconnu : %s", (_, texte) => {
    expect(lireDossier(texte)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { avertirTrajetsCommuns, normaliserEmployeur } from "./couple";

describe("Ajout n° 1, test 9 — même lieu de travail", () => {
  it("noms d'employeurs comparés sans majuscules, accents ni forme juridique", () => {
    expect(normaliserEmployeur("Dupont Industrie SAS")).toBe("dupont industrie");
    expect(normaliserEmployeur("DUPONT INDUSTRIE")).toBe("dupont industrie");
    expect(normaliserEmployeur("Hôpital d'Annecy")).toBe("hopital d annecy");
  });

  it("« Dupont Industrie SAS » et « DUPONT INDUSTRIE », deux voitures → avertissement", () => {
    expect(avertirTrajetsCommuns([{ employeur: "Dupont Industrie SAS" }], [{ employeur: "DUPONT INDUSTRIE" }], true)).toBe(true);
  });

  it("employeurs différents mais même code postal → avertissement", () => {
    expect(avertirTrajetsCommuns([{ employeur: "Alpha", codePostal: "74000" }], [{ employeur: "Bêta", codePostal: "74000" }], true)).toBe(true);
  });

  it("employeurs et communes différents, question directe « non » → aucun avertissement", () => {
    const a = [{ employeur: "Alpha", commune: "Annecy", codePostal: "74000" }];
    const b = [{ employeur: "Bêta", commune: "Cluses", codePostal: "74300" }];
    expect(avertirTrajetsCommuns(a, b, true, false)).toBe(false);
  });

  it("une seule voiture → pas d'avertissement sur les deux trajets", () => {
    expect(avertirTrajetsCommuns([{ employeur: "Alpha" }], [{ employeur: "Alpha" }], false)).toBe(false);
  });
});

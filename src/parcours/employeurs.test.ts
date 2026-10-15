import { describe, expect, it } from "vitest";
import { joursSurSiteParEmployeur, nomEmployeur, resumeEmployeurs, totalSalaires, type Employeur } from "./employeurs";

const a: Employeur = { nom: "Garage Dupuis", debut: 0, fin: 5, salaire: 12000 };
const b: Employeur = { nom: "", debut: 6, fin: 11, salaire: 13500.5 };

describe("Plusieurs employeurs (F12)", () => {
  it("additionne les salaires à la place du client", () => {
    expect(totalSalaires([a, b])).toBe(25500.5);
    expect(totalSalaires([a, { ...b, salaire: null }])).toBe(12000);
  });

  it("donne un nom par défaut", () => {
    expect(nomEmployeur(b, 1)).toBe("Employeur 2");
  });

  it("attribue les jours sur site de chaque mois à l'employeur de ce mois", () => {
    const site = Array(12).fill(18);
    expect(joursSurSiteParEmployeur([a, b], site)).toEqual([108, 108]);
  });

  it("partage un mois commun à parts égales, et ignore les mois sans employeur", () => {
    const site = Array(12).fill(20);
    const c: Employeur = { nom: "", debut: 3, fin: 4, salaire: 1000 };
    const d: Employeur = { nom: "", debut: 4, fin: 4, salaire: 500 };
    // Avril : 20 pour c ; mai : 10 et 10 ; les autres mois n'ont pas d'employeur.
    expect(joursSurSiteParEmployeur([c, d], site)).toEqual([30, 10]);
  });

  it("résume une ligne par employeur pour la case 1AK", () => {
    expect(resumeEmployeurs([a, b], [22, 15])).toBe(
      "2 employeurs dans l'année : Garage Dupuis (janvier à juin, salaire 12 000 €, 22 km aller), Employeur 2 (juillet à décembre, salaire 13 500 €, 15 km aller)",
    );
  });
});

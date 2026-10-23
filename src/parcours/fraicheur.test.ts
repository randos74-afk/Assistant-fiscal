import { describe, expect, it } from "vitest";
import type { Parametres } from "../moteur/types";
import { badgeFraicheur } from "./fraicheur";

type Millesime = Parametres["millesime"];
const verifie2025: Millesime = { revenus: 2025, declaration: 2026, statut: "vérifié", date_gel: "2026-10-13", date_verification: "2026-10-13" };
const provisoire2026: Millesime = { revenus: 2026, declaration: 2027, statut: "provisoire", date_gel: "2027-01-05" };
const verifie2026: Millesime = { ...provisoire2026, statut: "vérifié", date_verification: "2027-03-12" };

describe("badge de fraîcheur des chiffres", () => {
  it("vert à l'automne quand le fichier de l'année déclarée est vérifié", () => {
    const b = badgeFraicheur([verifie2025], 2025, new Date(2026, 9, 23), "03-30");
    expect(b.couleur).toBe("vert");
    expect(`${b.ligne1} · ${b.ligne2}`).toBe("Revenus 2025 · vérifié le 13/10/2026");
    expect(b.explication).toBeUndefined();
  });

  it("rouge le 1er janvier : les chiffres des revenus de l'année écoulée n'existent pas encore", () => {
    const b = badgeFraicheur([verifie2025], 2025, new Date(2027, 0, 1), "03-30");
    expect(b.couleur).toBe("rouge");
    expect(b.ligne1).toBe("Revenus 2026");
    expect(b.explication).toContain("les chiffres des revenus 2025");
  });

  it("rouge jusqu'au 30 mars inclus, orange dès le 31 mars sans fichier vérifié", () => {
    expect(badgeFraicheur([verifie2025], 2025, new Date(2027, 2, 30, 23, 59), "03-30").couleur).toBe("rouge");
    expect(badgeFraicheur([verifie2025], 2025, new Date(2027, 2, 31), "03-30").couleur).toBe("orange");
  });

  it("un fichier provisoire de l'année reste rouge puis orange", () => {
    const b = badgeFraicheur([verifie2025, provisoire2026], 2026, new Date(2027, 1, 10), "03-30");
    expect(b.couleur).toBe("rouge");
    expect(b.explication).toContain("pas encore contrôlés");
    expect(badgeFraicheur([verifie2025, provisoire2026], 2026, new Date(2027, 4, 2), "03-30").couleur).toBe("orange");
  });

  it("vert dès la vérification, même avant la fin mars", () => {
    const b = badgeFraicheur([verifie2025, verifie2026], 2026, new Date(2027, 2, 12), "03-30");
    expect(b.couleur).toBe("vert");
    expect(b.ligne2).toBe("vérifié le 12/03/2027");
  });
});

describe("fichiers parametres/revenus-AAAA.json", () => {
  it("chaque fichier « vérifié » porte sa date de vérification", async () => {
    const { millesimes } = await import("../moteur/parametres");
    for (const m of millesimes()) {
      expect(["provisoire", "vérifié"]).toContain(m.statut);
      if (m.statut === "vérifié") expect(m.date_verification).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

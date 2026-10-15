import { describe, expect, it } from "vitest";
import { justificatifs } from "./justificatifs";
import type { Reponses } from "./assemblage";

const mois = Array.from({ length: 12 }, () => ({ site: 15, teletravail: 3, deplacement: 0 }));

describe("Justificatifs à conserver (F9.2)", () => {
  it("demande seulement ce qui correspond aux postes ouverts", () => {
    const r: Reponses = {
      salaire: { montant: 30000, source: "bulletin-decembre" },
      jours: { prudent: false, mois },
      trajet: {
        mode: "voiture",
        allerKm: 55,
        motifDistance: "mutation",
        energie: "diesel",
        energiePrudente: false,
        ligne: "5",
        puissancePrudente: false,
        kmMissions: 0,
        peagesParking: 200,
        interetsCredit: 0,
      },
    };
    const liste = justificatifs(r);
    expect(liste).toContain("Carte grise du véhicule (puissance et énergie)");
    expect(liste).toContain("Pièce justifiant la distance au-delà du plafond (mutation)");
    expect(liste).toContain("Relevés de télépéage et tickets de parking");
    expect(liste).toContain("Attestation de télétravail de l'employeur (jours télétravaillés)");
    expect(liste.some((j) => j.includes("amortissement"))).toBe(false);
  });

  it("ajoute une ligne par autre frais coché", () => {
    const liste = justificatifs({
      autres: {
        ouverts: ["documentation", "cotisationSyndicale"],
        montants: {},
        telephonePartPro: 0,
        achats: [],
        libelleAutre: "",
        doubleResidence: null,
        transport: null,
      },
    });
    expect(liste).toContain("Factures ou attestations : documentation professionnelle");
    expect(liste).toContain("Attestation de cotisation syndicale");
  });
});

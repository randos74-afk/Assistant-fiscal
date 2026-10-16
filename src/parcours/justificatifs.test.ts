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

describe("Justificatifs des nouveautés (ajout n° 1, F14)", () => {
  const voiture = { mode: "voiture" as const, allerKm: 20, energie: "diesel" as const, energiePrudente: false, ligne: "5", puissancePrudente: false, kmMissions: 0, peagesParking: 0, interetsCredit: 0 };
  it("covoiturage, indemnités kilométriques, établissements, remboursements, bureau", () => {
    const liste = justificatifs({
      trajet: { ...voiture, lieux: [{ nom: "A", allerKm: 10, joursSurSite: 50 }], indemnitesKmRecues: 300, covoiturage: { participations: 400, joursParSemaine: null } },
      reintegrationsMetier: [{ libelle: "ISSR", montant: 1800 }],
      autres: { ouverts: ["bureauDomicile"], montants: {}, telephonePartPro: 0, achats: [], libelleAutre: "", doubleResidence: null, transport: null },
    }).join(" | ");
    expect(liste).toContain("ordres de mission");
    expect(liste).toContain("participations reçues");
    expect(liste).toContain("indemnités kilométriques remboursées");
    expect(liste).toContain("ENSAP");
    expect(liste).toContain("surface de la pièce de travail");
  });
  it("passager d'un covoiturage : historique des paiements", () => {
    expect(justificatifs({ trajet: { ...voiture, mode: "covoiturage", montantPaye: 1200 } }).join(" ")).toContain("paiements au conducteur");
  });
});

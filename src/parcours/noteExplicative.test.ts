import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { calculerParcours, type Reponses } from "./assemblage";
import { repartirAuProrata } from "./calendrier";
import { justificationDistance, noteExplicative } from "./noteExplicative";

const p = chargerParametres(2025);
const site = repartirAuProrata(180, Array(12).fill(1));
const tele = repartirAuProrata(38, Array(12).fill(1));
const reponses: Reponses = {
  salaire: { montant: 32000, source: "bulletin-decembre" },
  jours: { prudent: false, mois: site.map((s, i) => ({ site: s, teletravail: tele[i], deplacement: 0 })) },
  trajet: {
    mode: "voiture",
    allerKm: 22,
    energie: "diesel",
    energiePrudente: false,
    ligne: "5",
    puissancePrudente: false,
    kmMissions: 0,
    peagesParking: 0,
    interetsCredit: 0,
  },
  repas: {
    acces: "impossible",
    lieu: "restaurant",
    prix: 12,
    titres: { valeur: 9, partEmployeur: 4.5, partPrudente: false, nombre: 180 },
    primePanier: 0,
  },
  autres: {
    ouverts: ["documentation"],
    montants: { documentation: 211 },
    telephonePartPro: 0,
    achats: [],
    libelleAutre: "",
    doubleResidence: null,
    transport: null,
  },
};

describe("Note explicative", () => {
  const r = calculerParcours(p, reponses);
  const n = noteExplicative(r, 2025, 1, ["puissance du véhicule"], ["Carte grise du véhicule"]);

  it("détaille chaque poste et retrouve exactement la case 1AK", () => {
    expect(n.sections.map((s) => s.titre)).toEqual(["Frais de déplacement", "Frais de repas", "Frais de télétravail", "Autres frais professionnels"]);
    expect(n.sections.reduce((s, x) => s + x.sousTotal, 0)).toBe(r.montantCase);
    expect(n.total).toBe(r.montantCase);
    expect(n.sections[0].lignes[0].texte).toMatch(/^Voiture diesel 5 CV, 7 920 km dans l'année/);
  });

  it("rappelle que les frais ne se soustraient pas du salaire, remboursements compris", () => {
    expect(n.introduction[1]).toBe(
      `Le total de mes frais réels, ${r.montantCase.toLocaleString("fr-FR").replace(/ /g, " ")} €, est porté case 1AK (déclarant 1). Il n'est pas soustrait du salaire déclaré case 1AJ, qui s'élève à 32 810 €, remboursements de mon employeur compris.`,
    );
    expect(n.reintegrations).toEqual([{ libelle: "titres-restaurant part employeur", montant: 810 }]);
  });

  it("signale honnêtement les valeurs prudentes et la conservation des pièces", () => {
    expect(n.introduction[3]).toBe("Faute de chiffre exact, j'ai retenu la valeur la plus basse pour : puissance du véhicule.");
    expect(n.conclusion).toContain("pendant trois ans");
  });
});

describe("Justification de la distance au-delà du plafond (remarque du 22/10/2026)", () => {
  it("reprend la phrase pré-remplie du motif, une seule fois, avec des lignes à compléter", () => {
    const j = justificationDistance(["distance de 45 km retenue (emploi du conjoint)", "distance de 45 km retenue (emploi du conjoint)"], 40);
    expect(j?.[0]).toContain("dépasse 40 km");
    expect(j?.filter((t) => t.includes("conjoint"))).toHaveLength(1);
    expect(j?.some((t) => t.startsWith("Précisions"))).toBe(true);
  });
  it("est absente sans motif de distance", () => {
    expect(justificationDistance(["second aller-retour quotidien (santé)"], 40)).toBeUndefined();
  });
});

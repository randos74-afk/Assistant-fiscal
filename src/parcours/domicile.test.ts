import { describe, expect, it } from "vitest";
import { calculerDeclarant } from "../moteur/declarant";
import { chargerParametres } from "../moteur/parametres";
import { bilanJournees, domicilePourMoteur, ecartCoherence, forfaitsPrudents, libellesTroncons, type SaisieDomicile } from "./domicile";

const p = chargerParametres(2025);

// Exemple de référence de la spécification F13 (ADM-01) : journée de 40 km, 200 jours, 4 CV.
const admr: SaisieDomicile = {
  employeurs: ["association"],
  indemnites: 1140,
  forfaitsTransport: 0,
  forfaitsPrudents: false,
  journees: [{ troncons: [8, 6, 5, 7, 4, 10], rembourses: [true, true, false, true], jours: 200 }],
  kmComplementaires: 0,
  vehicule: "voiture",
  energie: "essence",
  energiePrudente: false,
  ligne: "4",
  puissancePrudente: false,
};

describe("Parcours aide à domicile (F13)", () => {
  it("classe les tronçons : 18 km domicile-travail, 22 km professionnels, dont 15 remboursés", () => {
    const b = bilanJournees(p, admr);
    expect(b.domicileTravail).toBe(18 * 200);
    expect(b.professionnels).toBe(22 * 200);
    expect(b.professionnelsRembourses).toBe(15 * 200);
  });

  it("retrouve ADM-01 : 8 000 km, 4 050 €, 1 140 € réintégrés, gain 1 110 €", () => {
    const { vehicule, reintegrations } = domicilePourMoteur(p, admr);
    const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 18000, vehicules: [vehicule], reintegrations });
    expect(r.lignes[0].montant).toBe(4050);
    expect(r.totalReintegrations).toBe(1140);
    expect(r.comparaison.gainBase).toBe(1110);
    expect(r.texte).toContain("8 000 km dans l'année (200 j d'intervention : domicile-travail 3 600 km, entre personnes aidées 4 400 km)");
    expect(r.texte).toContain("Salaire 1AJ majoré de 1 140 € (indemnités kilométriques 1 140 €)");
  });

  it("plafonne un trajet maison → personne aidée au-delà de 40 km, sauf motif", () => {
    const loin = { ...admr, journees: [{ troncons: [55, 6, 10], rembourses: [true], jours: 100 }] };
    expect(bilanJournees(p, loin).domicileTravail).toBe((40 + 10) * 100);
    expect(bilanJournees(p, { ...loin, motifDistance: "emploi du conjoint" }).domicileTravail).toBe((55 + 10) * 100);
  });

  it("contrôle de cohérence : les km professionnels couvrent les km indemnisés (indemnités ÷ taux)", () => {
    expect(ecartCoherence(p, admr)).toEqual({ kmIndemnises: 3000, ecart: 0 });
    const court = { ...admr, journees: [{ troncons: [8, 2, 10], rembourses: [true], jours: 200 }] };
    expect(ecartCoherence(p, court)).toEqual({ kmIndemnises: 3000, ecart: 2600 });
    expect(ecartCoherence(p, { ...court, kmComplementaires: 2600 }).ecart).toBe(0);
  });

  it("ne suppose aucun taux pour plusieurs employeurs ou des particuliers", () => {
    expect(ecartCoherence(p, { ...admr, employeurs: ["particulier"] }).kmIndemnises).toBeNull();
    expect(ecartCoherence(p, { ...admr, employeurs: ["association", "particulier"] }).kmIndemnises).toBeNull();
  });

  it("forfaits d'un mandataire inconnus : une fiche × 12 × personnes aidées (témoignage : 156,75 € par mois)", () => {
    expect(forfaitsPrudents(3.5, 5)).toBe(210);
  });

  it("nomme les tronçons « Maison → Personne 1 … Personne n → Maison »", () => {
    expect(libellesTroncons(3)).toEqual(["Maison → Personne 1", "Personne 1 → Personne 2", "Personne 2 → Maison"]);
  });
});

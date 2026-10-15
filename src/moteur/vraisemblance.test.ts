import { describe, expect, it } from "vitest";
import { calculerDeclarant } from "./declarant";
import { chargerParametres } from "./parametres";
import { evaluerVraisemblance, type Contexte } from "./vraisemblance";

const p = chargerParametres(2025);
const contexte: Contexte = { joursSurSite: 200, joursParSemaine: 5, doubleResidence: false, motifEmploiConjoint: false };
const avecFrais = (salaire: number, frais: number[]) =>
  calculerDeclarant(p, { numero: 1, salairePrerempli: salaire, autresFrais: frais.map((montant, i) => ({ libelle: `poste ${i}`, montant })) });

describe("Vraisemblance (F11)", () => {
  it("niveau 0 sous deux fois l'abattement", () => {
    expect(evaluerVraisemblance(p, avecFrais(30000, [5000]), contexte).niveau).toBe(0);
  });

  it("niveau 1 au-delà de deux fois l'abattement : simple rappel", () => {
    const v = evaluerVraisemblance(p, avecFrais(30000, [7000]), contexte);
    expect(v.niveau).toBe(1);
    expect(v.message).toContain("C'est normal si vous faites beaucoup de route");
    expect(v.postesAVerifier).toEqual([]);
  });

  it("l'exemple d'un ouvrier qui roule beaucoup reste au niveau 1 (spécification)", () => {
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 17000,
      vehicules: [{ type: "voiture", energie: "diesel", cv: 5, allerKm: 40, joursSurSite: 218 }],
    });
    expect(r.montantCase).toBe(7621);
    expect(evaluerVraisemblance(p, r, contexte).niveau).toBe(1);
  });

  it("niveau 2 au-delà de la moitié du salaire : relire les postes les plus lourds", () => {
    const v = evaluerVraisemblance(p, avecFrais(20000, [6000, 4000, 500, 100]), contexte);
    expect(v.niveau).toBe(2);
    expect(v.postesAVerifier.map((l) => l.montant)).toEqual([6000, 4000]);
  });

  it("niveau 3 au-delà du salaire : confirmer chaque poste", () => {
    const v = evaluerVraisemblance(p, avecFrais(8000, [6000, 3000, 200]), contexte);
    expect(v.niveau).toBe(3);
    expect(v.postesAVerifier).toHaveLength(3);
    expect(v.message).toContain("service des impôts");
  });

  it("compte les réintégrations dans le salaire déclaré", () => {
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 10000,
      autresFrais: [{ libelle: "x", montant: 5500 }],
      reintegrations: [{ libelle: "titres", montant: 2000 }],
    });
    expect(evaluerVraisemblance(p, r, contexte).niveau).toBe(1); // 5 500 < 50 % de 12 000
  });

  it("contrôles ciblés : kilométrage, jours, cohérence familiale", () => {
    const r = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 60000,
      vehicules: [{ type: "voiture", energie: "diesel", cv: 5, allerKm: 80, joursSurSite: 220, motifDistance: "mutation" }],
    });
    const v = evaluerVraisemblance(p, r, { joursSurSite: 240, joursParSemaine: 5, couple: false, doubleResidence: true, motifEmploiConjoint: true });
    expect(v.alertes.some((a) => a.startsWith("35 200 km dans l'année"))).toBe(true);
    expect(v.alertes.some((a) => a.startsWith("240 jours sur site"))).toBe(true);
    expect(v.alertes.some((a) => a.includes("double résidence"))).toBe(true);
    expect(v.alertes.some((a) => a.includes("emploi du conjoint"))).toBe(true);
  });

  it("pas d'alerte familiale tant que la situation n'est pas connue", () => {
    const v = evaluerVraisemblance(p, avecFrais(30000, [100]), { ...contexte, doubleResidence: true, motifEmploiConjoint: true });
    expect(v.alertes).toEqual([]);
  });
});

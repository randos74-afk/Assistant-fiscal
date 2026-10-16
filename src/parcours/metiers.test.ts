import { describe, expect, it } from "vitest";
import { libelleEtape } from "./etapes";
import { chargerParametres } from "../moteur/parametres";
import { aDesQuestionsMetier, conseilsMetier, detailProfil, PROFILS, profil } from "./metiers";

describe("Votre métier (F14)", () => {
  it("propose les cinq profils, « Autre métier » en dernier", () => {
    expect(PROFILS.map((p) => p.id)).toEqual(["domicile", "soignant", "enseignant", "grandRouleur", "autre"]);
  });

  it("ouvre les trajets d'office pour chaque métier ciblé, rien pour « Autre métier »", () => {
    for (const p of PROFILS.filter((x) => x.id !== "autre")) expect(p.postesOuverts).toContain("trajets");
    expect(profil("autre").postesOuverts).toEqual([]);
  });

  it("ouvre la double résidence pour les enseignants et les grands rouleurs", () => {
    expect(profil("enseignant").postesOuverts).toContain("doubleResidence");
    expect(profil("grandRouleur").postesOuverts).toContain("doubleResidence");
  });

  it("lit la distance plafond dans les paramètres, jamais dans le code", () => {
    expect(JSON.stringify(PROFILS)).not.toMatch(/\d/);
    expect(detailProfil(profil("grandRouleur"), chargerParametres(2025))).toContain("Plus de 40 km");
  });

  it("n'utilise aucun sigle non expliqué", () => {
    expect(JSON.stringify(PROFILS)).not.toMatch(/\b(SSIAD|HAD|TZR|CESU|ADMR|UNA|PAS|TR|RFR)\b/);
  });
});

describe("Étapes du parcours", () => {
  it("nomme l'étape comme la maquette", () => {
    expect(libelleEtape("votre trajet").libelle).toBe("Étape 4 sur 8 : votre trajet");
  });
});

describe("F14 — soignant : questions et conseils", () => {
  const param = chargerParametres(2025);

  it("seul le soignant a des questions propres pour l'instant", () => {
    expect(aDesQuestionsMetier("soignant")).toBe(true);
    expect(aDesQuestionsMetier("autre")).toBe(false);
    expect(aDesQuestionsMetier(undefined)).toBe(false);
  });

  it("nuit ou 12 h : conseils sur les gardes, la voiture et le forfait repas lu dans les paramètres", () => {
    const c = conseilsMetier(param, "soignant", { lavageTenues: true, nuit12h: true, soinsDomicile: false });
    expect(c.jours[0]).toContain("comptez vos gardes");
    expect(c.repas[0]).toContain("5,45 €");
    expect(c.autres[0]).toContain("ne comptez que leur achat");
    expect(c.trajet).toHaveLength(1);
  });

  it("soins à domicile : total des km de l'année ; tenues lavées soi-même : l'entretien compte", () => {
    const c = conseilsMetier(param, "soignant", { lavageTenues: false, nuit12h: false, soinsDomicile: true });
    expect(c.trajet[0]).toContain("total de vos kilomètres");
    expect(c.autres[0]).toContain("l'achat et l'entretien comptent");
    expect(c.jours).toEqual([]);
  });

  it("autre métier : aucun conseil", () => {
    expect(conseilsMetier(param, "autre", {})).toEqual({ jours: [], trajet: [], repas: [], autres: [] });
  });
});

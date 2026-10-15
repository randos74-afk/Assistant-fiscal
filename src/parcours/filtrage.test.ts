import { describe, expect, it } from "vitest";
import { evaluerFiltrage, libelleQuestion, precisionReponse, QUESTIONS_FILTRAGE } from "./filtrage";

const accepte = {
  salaireFrance: "oui",
  travailEtranger: "non",
  entreprise: "non",
  residentAnnee: "oui",
  metierSpecial: "aucun",
};

describe("Filtrage (docs/02 §1)", () => {
  it("pose les cinq questions dans l'ordre de la spécification", () => {
    expect(QUESTIONS_FILTRAGE.map((q) => q.id)).toEqual([
      "salaireFrance",
      "travailEtranger",
      "entreprise",
      "residentAnnee",
      "metierSpecial",
    ]);
  });

  it("adapte l'année de la question de résidence au millésime", () => {
    const q = QUESTIONS_FILTRAGE.find((x) => x.id === "residentAnnee")!;
    expect(libelleQuestion(q, 2026)).toBe("Avez-vous habité en France toute l'année 2026 ?");
  });

  it("indique la prochaine question tant que tout n'est pas répondu", () => {
    expect(evaluerFiltrage({})).toEqual({ statut: "en-cours", prochaineQuestion: 0 });
    expect(evaluerFiltrage({ salaireFrance: "oui", travailEtranger: "non" })).toEqual({
      statut: "en-cours",
      prochaineQuestion: 2,
    });
  });

  it("accepte un salarié en France", () => {
    expect(evaluerFiltrage(accepte)).toEqual({ statut: "accepte", aussiEntreprise: false });
  });

  it("laisse continuer un salarié qui a aussi une entreprise, pour son seul salaire", () => {
    expect(evaluerFiltrage({ ...accepte, entreprise: "oui" })).toEqual({ statut: "accepte", aussiEntreprise: true });
    expect(precisionReponse("entreprise", "oui")).toContain("pour votre seul salaire");
  });

  it.each([
    ["salaireFrance", "non"],
    ["travailEtranger", "oui"],
    ["residentAnnee", "non"],
    ["metierSpecial", "assistantMaternel"],
    ["metierSpecial", "artiste"],
    ["metierSpecial", "journaliste"],
    ["metierSpecial", "elu"],
  ])("exclut %s = %s avec une explication", (id, valeur) => {
    const r = evaluerFiltrage({ ...accepte, [id]: valeur });
    expect(r.statut).toBe("exclu");
    if (r.statut === "exclu") {
      expect(r.question).toBe(id);
      expect(r.exclusion.raison.length).toBeGreaterThan(0);
    }
  });

  it("s'arrête à la première réponse qui exclut, sans attendre la fin", () => {
    expect(evaluerFiltrage({ salaireFrance: "non" }).statut).toBe("exclu");
  });

  it("n'écrit aucun sigle brut interdit dans les messages", () => {
    const textes = JSON.stringify(QUESTIONS_FILTRAGE) + JSON.stringify(evaluerFiltrage({ salaireFrance: "non" }));
    expect(textes).not.toMatch(/\b(PAS|TR|RFR|BIC|BNC|BA)\b/);
  });
});

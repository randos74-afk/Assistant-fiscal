import { describe, expect, it } from "vitest";
import { lireDossier } from "./sauvegarde";

describe("Lecture d'un dossier sauvegardé (F9.3)", () => {
  it("accepte un dossier FraisFit valide", () => {
    const d = lireDossier(JSON.stringify({ application: "FraisFit", version: 1, millesime: 2025, ecran: "repas", enregistreLe: "x" }));
    expect(d?.ecran).toBe("repas");
    expect(d?.reponsesFiltrage).toEqual({});
  });

  it.each([
    ["texte quelconque", "bonjour"],
    ["autre application", JSON.stringify({ application: "Autre", version: 1, millesime: 2025, ecran: "x" })],
    ["version future", JSON.stringify({ application: "FraisFit", version: 99, millesime: 2025, ecran: "x" })],
  ])("refuse un fichier non reconnu : %s", (_, texte) => {
    expect(lireDossier(texte)).toBeNull();
  });
});

describe("Sauvegarde version 2 : mode foyer (ajout n° 1)", () => {
  const v1 = {
    application: "FraisFit",
    version: 1,
    millesime: 2025,
    ecran: "relecture",
    enregistreLe: "x",
    metier: "autre",
    salaire: { montant: 30000, source: "bulletin-decembre" },
    foyer: { couple: true, enfants: 1, parentIsole: false, salaireConjoint: 25000, autresRevenus: 0 },
  };

  it("un ancien dossier en couple devient deux profils, le conjoint par son seul salaire", () => {
    const d = lireDossier(JSON.stringify(v1))!;
    expect(d.mode).toBe("couple");
    expect(d.profils).toHaveLength(2);
    expect(d.profils[0].salaire?.montant).toBe(30000);
    expect(d.profils[1]).toMatchObject({ salaireSeulement: true, salaire: { montant: 25000 } });
    expect(d.foyer?.salaireConjoint).toBe(0);
  });

  it("un ancien dossier d'une personne seule garde un seul profil", () => {
    const d = lireDossier(JSON.stringify({ ...v1, foyer: { ...v1.foyer, couple: false, salaireConjoint: 0 } }))!;
    expect(d.mode).toBe("seul");
    expect(d.profils).toHaveLength(1);
  });

  it("un dossier version 2 est relu tel quel", () => {
    const d = lireDossier(JSON.stringify({ application: "FraisFit", version: 2, millesime: 2025, ecran: "jours", enregistreLe: "x", mode: "couple", profils: [{}, { prenom: "Léa" }], profilActif: 1 }))!;
    expect(d.profils[1].prenom).toBe("Léa");
    expect(d.profilActif).toBe(1);
  });
});

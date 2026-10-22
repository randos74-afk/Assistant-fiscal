import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { calculerParcours } from "../parcours/assemblage";
import { htmlPdf, htmlPdfFoyer, type ContenuPdf } from "./pdf";

const p = chargerParametres(2025);
const contenu = (montant: number, numero: number, nom: string): ContenuPdf => {
  const r = calculerParcours(p, { salaire: { montant, source: "bulletin-decembre" } });
  return { parametres: p, resultat: { ...r, caseFraisReels: numero === 1 ? "1AK" : "1BK" }, prudentes: [], nonVerifiees: [], justificatifs: [], date: new Date(2026, 9, 16), numeroDeclarant: numero, nom };
};

describe("PDF du foyer (ajout n° 1)", () => {
  const html = htmlPdfFoyer(
    [contenu(30000, 1, "Vous"), contenu(25000, 2, "Léa")],
    {
      verdict: "La meilleure combinaison : vous aux frais réels, Léa à l'abattement.",
      combinaisons: [{ choix: "Vous aux frais réels, Léa à l'abattement", base1: 25000, base2: 22500, impot: 2399.53, meilleure: true }],
      noms: ["Vous", "Léa"],
      choix: ["frais réels, 5 000 € en case 1AK", "abattement de 10 %, rien à changer"],
    },
    "logo.png",
  );

  it("un seul document : synthèse puis une partie par personne, avec sa note explicative", () => {
    expect(html.match(/<body>/g)).toHaveLength(1);
    expect(html.match(/<\/body>/g)).toHaveLength(1);
    expect(html).toContain("Votre foyer : frais réels ou abattement");
    expect(html).toContain("(retenu)");
    expect(html).toContain("Léa : abattement de 10 %, rien à changer");
    expect(html).toContain("Léa (case 1BK)");
    expect(html.match(/break-before: page/g)!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("PDF quand l'abattement l'emporte (remarque du 22/10/2026)", () => {
  it("s'arrête à la première page : ni texte à recopier, ni note explicative", () => {
    const html = htmlPdf(contenu(30000, 1, "Vous"), "logo.png");
    expect(html).toContain("rien à reporter case 1AK");
    expect(html).not.toContain("Note explicative");
    expect(html).not.toContain("Informations complémentaires");
  });
});

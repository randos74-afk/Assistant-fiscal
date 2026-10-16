import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { kmVersDomicileFamilial } from "./autresFrais";
import { donneesDeclarants } from "./declarants";
import { aDesQuestionsMetier, conseilsMetier } from "./metiers";
import type { Profil } from "./profils";

const p = chargerParametres(2025);

describe("F14 — grand rouleur", () => {
  it("MET-04 : 400 km, un aller-retour par semaine, 34 semaines → 27 200 km", () => {
    expect(kmVersDomicileFamilial(400, 1, 34)).toBe(27200);
  });

  it("questions et conseils : motif recopié tel quel, péages, double résidence", () => {
    expect(aDesQuestionsMetier("grandRouleur")).toBe(true);
    const c = conseilsMetier(p, "grandRouleur", { doubleResidence: true });
    expect(c.trajet[0]).toContain("recopiée telle quelle");
    expect(c.autres[0]).toContain("Double résidence");
    expect(conseilsMetier(p, "grandRouleur", { doubleResidence: false }).autres).toEqual([]);
  });

  it("alerte de niveau 1 présentée comme normale", () => {
    const profil: Profil = {
      metier: "grandRouleur",
      questionsMetier: { doubleResidence: false },
      salaire: { montant: 40000, source: "bulletin-decembre" },
      trajet: { mode: "voiture", allerKm: 0, kmAnnuel: 25000, motifDistance: "mutation", energie: "diesel", energiePrudente: false, ligne: "6", puissancePrudente: false, kmMissions: 0, peagesParking: 0, interetsCredit: 0 },
    };
    const [d] = donneesDeclarants(p, "seul", [profil]);
    expect(d.vraisemblance.niveau).toBe(1);
    expect(d.vraisemblance.message).toContain("normal pour vos trajets");
  });
});

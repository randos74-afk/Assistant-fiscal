import { describe, expect, it } from "vitest";
import { calculerDeclarant } from "../moteur/declarant";
import { chargerParametres } from "../moteur/parametres";
import { cvDeLigne, lignePrudente, optionsPuissance, vehiculePourMoteur, type SaisieTrajet } from "./trajet";

const p = chargerParametres(2025);

const base: SaisieTrajet = {
  mode: "voiture",
  allerKm: 22,
  energie: "diesel",
  energiePrudente: false,
  ligne: "5",
  puissancePrudente: false,
  kmMissions: 0,
  peagesParking: 0,
  interetsCredit: 0,
};

describe("Votre trajet (F3)", () => {
  it("lit les puissances proposées dans le barème", () => {
    expect(optionsPuissance(p, "voiture").map((o) => o.libelle)).toEqual([
      "3 CV et moins",
      "4 CV",
      "5 CV",
      "6 CV",
      "7 CV et plus",
    ]);
    expect(optionsPuissance(p, "moto").map((o) => o.libelle)).toEqual(["1 ou 2 CV", "3 à 5 CV", "Plus de 5 CV"]);
    expect(optionsPuissance(p, "cyclomoteur")).toEqual([]);
  });

  it("retient la ligne la plus basse quand on ne sait pas", () => {
    expect(lignePrudente(p, "voiture")).toBe("3");
    expect(lignePrudente(p, "moto")).toBe("1-2");
  });

  it("choisit la bonne ligne du barème moto", () => {
    expect(cvDeLigne("5+")).toBe(6);
    expect(cvDeLigne("3-5")).toBe(5);
  });

  it("retrouve l'exemple de la spécification : 22 km, 180 jours, 5 CV = 4 222 €", () => {
    const v = vehiculePourMoteur(p, base, 180)!;
    const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 30000, vehicules: [v] });
    expect(r.lignes[0].montant).toBe(4222);
    expect(r.lignes[0].texte).toContain("voiture diesel 5 CV, 7 920 km");
  });

  it("plafonne à 40 km sans motif, garde la distance avec motif", () => {
    const sans = calculerDeclarant(p, { numero: 1, salairePrerempli: 30000, vehicules: [vehiculePourMoteur(p, { ...base, allerKm: 55 }, 100)!] });
    expect(sans.texte).toContain("8 000 km");
    const avec = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 30000,
      vehicules: [vehiculePourMoteur(p, { ...base, allerKm: 55, motifDistance: "mutation" }, 100)!],
    });
    expect(avec.texte).toContain("11 000 km");
    expect(avec.texte).toContain("Motifs : distance de 55 km retenue (mutation).");
  });

  it("énergie inconnue : barème thermique, signalé dans le résumé", () => {
    const v = vehiculePourMoteur(p, { ...base, energie: "thermique", energiePrudente: true, ligne: "3", puissancePrudente: true }, 100)!;
    const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 30000, vehicules: [v] });
    expect(r.texte).toContain("voiture thermique 3 CV et moins");
  });

  it("ajoute les kilomètres de missions au même véhicule", () => {
    const v = vehiculePourMoteur(p, { ...base, kmMissions: 1000 }, 180)!;
    const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 30000, vehicules: [v] });
    expect(r.texte).toContain("8 920 km");
  });

  it("n'envoie rien au barème pour les transports en commun", () => {
    expect(vehiculePourMoteur(p, { ...base, mode: "transports" }, 180)).toBeNull();
  });
});

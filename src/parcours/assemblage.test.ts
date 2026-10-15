import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { calculerParcours, valeursPrudentes, type Reponses } from "./assemblage";
import { repartirAuProrata } from "./calendrier";

const p = chargerParametres(2025);

// Exemple de la spécification §10 : 180 jours sur site, 38 jours de télétravail.
const site = repartirAuProrata(180, Array(12).fill(1));
const tele = repartirAuProrata(38, Array(12).fill(1));
const exemple: Reponses = {
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
  repas: { acces: "impossible", lieu: "restaurant", prix: 12, titres: null, primePanier: 0 },
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

describe("Parcours complet", () => {
  it("retrouve la case 1AK de la spécification : 5 714 €", () => {
    const r = calculerParcours(p, exemple);
    expect(r.montantCase).toBe(5714);
    expect(r.texte.split("\n")[0]).toBe("Frais réels déclarant 1 : 5 714 € (case 1AK).");
  });

  it("compare les bases imposables : 32 000 - 3 200 contre 32 000 - 5 714", () => {
    const c = calculerParcours(p, exemple).comparaison;
    expect(c.baseAbattement10).toBe(28800);
    expect(c.baseFraisReels).toBe(26286);
    expect(c.gainBase).toBe(2514);
    expect(c.fraisReelsConseilles).toBe(true);
  });

  it("intègre les réintégrations au salaire corrigé", () => {
    const r = calculerParcours(p, {
      ...exemple,
      repas: { ...exemple.repas!, titres: { valeur: 9, partEmployeur: 4.5, partPrudente: true, nombre: 180 } },
    });
    expect(r.comparaison.salaireCorrige).toBe(32810);
    expect(valeursPrudentes({ ...exemple, repas: { ...exemple.repas!, titres: { valeur: 9, partEmployeur: 5.4, partPrudente: true, nombre: 1 } } })).toEqual([
      "part de l'employeur sur les titres-restaurant",
    ]);
  });

  it("conseille l'abattement quand les frais réels sont faibles", () => {
    const r = calculerParcours(p, { salaire: exemple.salaire, jours: exemple.jours });
    expect(r.comparaison.fraisReelsConseilles).toBe(false);
  });
});

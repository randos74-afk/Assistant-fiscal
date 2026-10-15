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

  it("parcours aide à domicile, ADM-02 : journée type + repas apporté = 2 200 € de revenu imposable en moins", () => {
    const r = calculerParcours(p, {
      salaire: { montant: 18000, source: "bulletin-decembre" },
      jours: { prudent: false, mois: repartirAuProrata(200, Array(12).fill(1)).map((s) => ({ site: s, teletravail: 0, deplacement: 0 })) },
      domicile: {
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
      },
      repas: { acces: "impossible", lieu: "gamelle", cantineProche: false, prix: null, titres: null, primePanier: 0 },
    });
    expect(r.montantCase).toBe(5140);
    expect(r.comparaison.gainBase).toBe(2200);
  });

  it("conseille l'abattement quand les frais réels sont faibles", () => {
    const r = calculerParcours(p, { salaire: exemple.salaire, jours: exemple.jours });
    expect(r.comparaison.fraisReelsConseilles).toBe(false);
  });

  it("deux employeurs : kilomètres additionnés avant le barème, une ligne par employeur (F12, EMP-01)", () => {
    const r = calculerParcours(p, {
      ...exemple,
      salaire: {
        montant: 25500,
        source: "employeurs",
        employeurs: [
          { nom: "Garage Dupuis", debut: 0, fin: 5, salaire: 12000 },
          { nom: "", debut: 6, fin: 11, salaire: 13500 },
        ],
      },
      trajet: { ...exemple.trajet!, allerKm: 0, employeurs: [{ allerKm: 22, joursSurSite: 100 }, { allerKm: 50, joursSurSite: 110 }] },
    });
    expect(r.kmVehicules).toEqual([13200]);
    expect(r.texte).toContain("13 200 km dans l'année (Garage Dupuis 22 km x 2 x 100 j sur site + Employeur 2 40 km x 2 x 110 j sur site)");
    expect(r.texte).toContain(
      "2 employeurs dans l'année : Garage Dupuis (janvier à juin, salaire 12 000 €, 22 km aller), Employeur 2 (juillet à décembre, salaire 13 500 €, 50 km aller)",
    );
    expect(r.alertes.some((a) => a.includes("Trajet vers Employeur 2 ramené de 50 à 40 km"))).toBe(true);
  });

  it("allocations chômage : comparées avec les salaires, sans changer la case 1AK (F12.7, CHO-01)", () => {
    const sans = calculerParcours(p, exemple);
    const avec = calculerParcours(p, { ...exemple, salaire: { ...exemple.salaire!, chomage: 8000 } });
    expect(avec.montantCase).toBe(sans.montantCase);
    expect(avec.comparaison.abattement).toBe(4000); // 10 % de 40 000 €
    expect(avec.comparaison.gainBase).toBe(sans.comparaison.gainBase - 800);
    expect(avec.allocationsChomage).toBe(8000);
  });
});

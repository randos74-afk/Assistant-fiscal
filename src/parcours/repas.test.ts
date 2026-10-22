import { describe, expect, it } from "vitest";
import { calculerDeclarant } from "../moteur/declarant";
import { chargerParametres } from "../moteur/parametres";
import { dejeunerDomicileExclu, partDepuisPourcent, partEmployeurPrudente, primePanierAnnuelle, repasDeductibles, repasPourMoteur, type SaisieRepas } from "./repas";

const p = chargerParametres(2025);
const restaurant: SaisieRepas = { acces: "impossible", lieu: "restaurant", prix: 12, titres: null, primePanier: 0 };

function calcul(s: SaisieRepas, jours: number) {
  const r = repasPourMoteur(s, jours, p);
  return calculerDeclarant(p, {
    numero: 1,
    salairePrerempli: 30000,
    repas: r.repas ? [r.repas] : [],
    reintegrations: r.reintegrations,
  });
}

describe("Vos repas (F4)", () => {
  it("retrouve l'exemple de la spécification : 180 repas à 12 € = 1 179 €", () => {
    const r = calcul(restaurant, 180);
    expect(r.montantCase).toBe(1179);
    expect(r.texte).toContain("Repas : 180 repas x (12,00 - 5,45) = 1 179 €, restaurant, déjeuner à domicile impossible.");
  });

  it("retire la part employeur du titre et la réintègre au salaire (exemple officiel 2,05 €)", () => {
    const s: SaisieRepas = { ...restaurant, titres: { valeur: 9, partEmployeur: 4.5, partPrudente: false, nombre: 218 } };
    const r = calcul(s, 218);
    expect(r.montantCase).toBe(446); // 218 × 2,05 = 446,90 arrondi à l'euro inférieur
    expect(r.totalReintegrations).toBeCloseTo(981, 2);
    expect(r.texte).toContain("Salaire 1AJ majoré de 981 € (titres-restaurant part employeur 981 €)");
  });

  it("repas apporté sans cantine proche : forfait, même si un prix a été saisi", () => {
    const s: SaisieRepas = { acces: "impossible", lieu: "gamelle", cantineProche: false, prix: 3, titres: null, primePanier: 0 };
    expect(calcul(s, 200).montantCase).toBe(1090);
  });

  it("repas apporté avec titre-restaurant de 4 € : 1,45 € par repas (exemple officiel)", () => {
    const s: SaisieRepas = {
      acces: "impossible",
      lieu: "gamelle",
      cantineProche: false,
      prix: null,
      titres: { valeur: 8, partEmployeur: 4, partPrudente: false, nombre: 100 },
      primePanier: 0,
    };
    expect(repasPourMoteur(s, 100, p).repas!.partEmployeurTitreRestaurant).toBe(4);
    expect(calcul(s, 100).montantCase).toBe(145);
  });

  it("ferme le module si l'on déjeune chez soi, ou avec un repas apporté près d'une cantine", () => {
    expect(repasDeductibles({ ...restaurant, acces: "domicile" }, p, 200).ok).toBe(false);
    expect(repasDeductibles({ acces: "impossible", lieu: "gamelle", cantineProche: true, prix: null, titres: null, primePanier: 0 }, p, 200).ok).toBe(false);
    expect(repasPourMoteur({ ...restaurant, acces: "domicile" }, 180, p).repas).toBeNull();
  });

  it("réintègre quand même les titres et la prime de panier si les repas ne sont pas déductibles", () => {
    const r = repasPourMoteur(
      { ...restaurant, acces: "domicile", titres: { valeur: 9, partEmployeur: 5.4, partPrudente: false, nombre: 100 }, primePanier: 300 },
      180,
      p,
    );
    expect(r.reintegrations.map((x) => x.montant)).toEqual([540, 300]);
  });

  it("« Je ne sais pas » pour la part employeur : 60 % de la valeur du titre (paramètres)", () => {
    expect(partEmployeurPrudente(p, 9)).toBe(5.4);
  });

  it("prix inconnu : forfait, sans surcoût calculé", () => {
    expect(calcul({ ...restaurant, prix: null }, 100).montantCase).toBe(545);
  });

  it("prix au-delà du seuil : alerte, montant conservé", () => {
    const r = calcul({ ...restaurant, prix: 25 }, 10);
    expect(r.montantCase).toBe(195); // 10 × 19,55
    expect(r.alertes.some((a) => a.includes("supérieur à 21,10 €") && a.includes("susceptible d'être jugée excessive"))).toBe(true);
  });

  const gamelle: SaisieRepas = { acces: "impossible", lieu: "gamelle", prix: null, titres: null, primePanier: 0 };

  it("restaurant alors qu'une cantine à 6 € existe : plafonné au prix de la cantine (exemple officiel, REP-05)", () => {
    const r = calcul({ ...restaurant, surPlace: "cantine", prixSurPlace: { prix: 6 } }, 200);
    expect(r.montantCase).toBe(110); // 200 × 0,55
    expect(r.texte).toContain("200 repas x (prix sur place 6,00 - 5,45) = 110 €, restaurant à 12,00 €, prix retenu plafonné");
  });

  it("distributeurs : prix plein et part de l'employeur en %, par jour ou sur l'année (REP-06)", () => {
    const base: SaisieRepas = { ...restaurant, surPlace: "distributeurs" };
    expect(calcul({ ...base, prixSurPlace: { prix: 14, part: { mode: "pourcent", valeur: 50 } } }, 200).montantCase).toBe(310);
    expect(calcul({ ...base, prixSurPlace: { prix: 14, part: { mode: "jour", valeur: 7 } } }, 200).montantCase).toBe(310);
    expect(calcul({ ...base, prixSurPlace: { prix: 14, part: { mode: "annee", valeur: 1400 } } }, 200).montantCase).toBe(310);
  });

  it("restauration sur place : repas apporté, prix inconnu ou repas sur place bon marché = rien à déduire", () => {
    expect(repasDeductibles({ ...gamelle, surPlace: "cantine" }, p, 200).ok).toBe(false);
    expect(repasDeductibles({ ...gamelle, surPlace: "distributeurs" }, p, 200).ok).toBe(false);
    expect(repasDeductibles({ ...restaurant, surPlace: "cantine", prixSurPlacePrudent: true }, p, 200).ok).toBe(false);
    expect(repasDeductibles({ ...restaurant, surPlace: "cantine", prix: null, prixSurPlace: { prix: 8 } }, p, 200).ok).toBe(false);
    expect(repasDeductibles({ ...restaurant, surPlace: "distributeurs", prixSurPlace: { prix: 8, part: { mode: "pourcent", valeur: 50 } } }, p, 200).ok).toBe(false);
    expect(repasDeductibles({ ...gamelle, surPlace: "aucune" }, p, 200).ok).toBe(true);
    expect(repasDeductibles({ ...gamelle, cantineProche: true }, p, 200).ok).toBe(false); // ancienne saisie
  });

  it("restaurant moins cher que la cantine : prix réel gardé", () => {
    expect(calcul({ ...restaurant, prix: 9, surPlace: "cantine", prixSurPlace: { prix: 10 } }, 100).montantCase).toBe(355);
  });

  it("part employeur en pourcentage et prime de panier par jour", () => {
    expect(partDepuisPourcent(9, 60)).toBe(5.4);
    expect(primePanierAnnuelle(6.5, 180)).toBe(1170);
  });
});

describe("Déjeuner à la maison au-delà de 40 km (décision du 22/10/2026)", () => {
  it("est exclu quand tous les lieux de travail dépassent le plafond", () => {
    expect(dejeunerDomicileExclu(p, [45])).toBe(true);
    expect(dejeunerDomicileExclu(p, [45, 60])).toBe(true);
  });
  it("reste possible si un lieu est à 40 km ou moins, ou si la distance est inconnue", () => {
    expect(dejeunerDomicileExclu(p, [40])).toBe(false);
    expect(dejeunerDomicileExclu(p, [45, 12])).toBe(false);
    expect(dejeunerDomicileExclu(p, [])).toBe(false);
  });
});

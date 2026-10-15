import { describe, expect, it } from "vitest";
import { calculerDeclarant } from "../moteur/declarant";
import { chargerParametres } from "../moteur/parametres";
import {
  autresFraisPourMoteur,
  creditImpotSyndicalPerdu,
  postesDuProfil,
  priseEnChargePrudente,
  type SaisieAutresFrais,
} from "./autresFrais";
import { profil } from "./metiers";

const p = chargerParametres(2025);
const vide: SaisieAutresFrais = {
  ouverts: [],
  montants: {},
  telephonePartPro: 0,
  achats: [],
  libelleAutre: "",
  doubleResidence: null,
  transport: null,
};

describe("Vos autres frais (F6)", () => {
  it("retrouve la ligne de la spécification : documentation professionnelle 211 €", () => {
    const r = autresFraisPourMoteur(p, { ...vide, ouverts: ["documentation"], montants: { documentation: 211 } });
    const d = calculerDeclarant(p, { numero: 1, salairePrerempli: 30000, autresFrais: r.autresFrais });
    expect(d.texte).toContain("Autres : documentation professionnelle 211 €.");
  });

  it("ignore un montant saisi puis décoché", () => {
    expect(autresFraisPourMoteur(p, { ...vide, montants: { formation: 500 } }).autresFrais).toEqual([]);
  });

  it("téléphone : abonnement × part professionnelle", () => {
    const r = autresFraisPourMoteur(p, { ...vide, ouverts: ["telephone"], montants: { telephone: 360 }, telephonePartPro: 0.3 });
    expect(r.autresFrais[0].montant).toBeCloseTo(108, 2);
  });

  it("matériel : même règle de déduction ou d'amortissement que le télétravail", () => {
    const r = autresFraisPourMoteur(p, {
      ...vide,
      ouverts: ["materiel"],
      achats: [{ libelle: "perceuse", prixHT: 450, usagePro: 0.6, anneeAchat: 2025, moisAchat: 4 }],
    });
    expect(r.autresFrais[0].montant).toBeCloseTo(270, 2); // MAT-01
  });

  it("transport en commun : abonnement moins prise en charge, prudente à 50 % ou 75 %", () => {
    expect(priseEnChargePrudente(p, 900, false)).toBe(450);
    expect(priseEnChargePrudente(p, 900, true)).toBe(675);
    const r = autresFraisPourMoteur(p, { ...vide, transport: { abonnement: 900, priseEnCharge: 450, priseEnChargePrudente: true } });
    expect(r.autresFrais[0].montant).toBe(450);
  });

  it("double résidence : motif dans le résumé et km ajoutés au véhicule", () => {
    const r = autresFraisPourMoteur(p, {
      ...vide,
      ouverts: ["doubleResidence"],
      doubleResidence: { motif: "emploi du conjoint", logement: 4800, billets: 0, kmVehicule: 9000 },
    });
    expect(r.kmVehiculeEnPlus).toBe(9000);
    const d = calculerDeclarant(p, {
      numero: 1,
      salairePrerempli: 40000,
      vehicules: [{ type: "voiture", energie: "diesel", cv: 5, allerKm: 10, joursSurSite: 200, kmDoubleResidence: r.kmVehiculeEnPlus }],
      autresFrais: r.autresFrais,
      motifs: r.motifs,
    });
    expect(d.texte).toContain("13 000 km dans l'année (domicile-travail 10 km x 2 x 200 j sur site + trajets double résidence 9 000 km)");
    expect(d.texte).toContain("Autres : double résidence 4 800 €.");
    expect(d.texte).toContain("Motifs : double résidence (emploi du conjoint).");
  });

  it("libellé libre pour « autres frais »", () => {
    const r = autresFraisPourMoteur(p, { ...vide, ouverts: ["autre"], montants: { autre: 80 }, libelleAutre: "carte professionnelle" });
    expect(r.autresFrais[0].libelle).toBe("carte professionnelle");
  });

  it("ouvre d'office les postes du métier", () => {
    expect(postesDuProfil(profil("soignant").postesOuverts)).toEqual(["tenues", "cotisationOrdre", "formation", "documentation"]);
  });

  it("chiffre le crédit d'impôt syndical perdu (taux des paramètres)", () => {
    expect(creditImpotSyndicalPerdu(p, 150)).toBe(99);
  });
});

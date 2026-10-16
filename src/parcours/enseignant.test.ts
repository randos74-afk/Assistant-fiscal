import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { calculerParcours } from "./assemblage";
import type { SaisieAutresFrais } from "./autresFrais";
import { casAdministration } from "./conditions";
import { conseilsMetier } from "./metiers";
import { reponsesDuProfil, type Profil } from "./profils";

const p = chargerParametres(2025);
const calme = { niveau: 0, message: "", postesAVerifier: [], alertes: [] } as never;
const autres = (s: Partial<SaisieAutresFrais>): SaisieAutresFrais => ({
  ouverts: [],
  montants: {},
  telephonePartPro: 0,
  achats: [],
  libelleAutre: "",
  doubleResidence: null,
  transport: null,
  ...s,
});

const remplacant: Profil = {
  metier: "enseignant",
  questionsMetier: { remplacant: true, mute: false, travailMaison: false, remboursementsFrais: 1800 },
  salaire: { montant: 28000, source: "bulletin-decembre" },
  trajet: {
    mode: "voiture",
    allerKm: 0,
    motifDistance: "emploi précaire ou mobile",
    energie: "essence",
    energiePrudente: false,
    ligne: "5",
    puissancePrudente: false,
    kmMissions: 0,
    peagesParking: 0,
    interetsCredit: 0,
    lieux: [
      { nom: "École A", allerKm: 12, joursSurSite: 60 },
      { nom: "", allerKm: 25, joursSurSite: 50 },
      { nom: "École C", allerKm: 45, joursSurSite: 70 },
    ],
  },
  autres: autres({ ouverts: ["documentation", "cotisationSyndicale"], montants: { documentation: 120, cotisationSyndicale: 150 } }),
};

describe("F14 — enseignant", () => {
  it("MET-03 depuis les réponses : trois établissements, ISSR ajoutée au salaire → 5 320 € et 720 € de base en moins", () => {
    const r = calculerParcours(p, reponsesDuProfil(remplacant));
    expect(r.kmVehicules[0]).toBe(10240);
    expect(r.montantCase).toBe(5320);
    expect(r.totalReintegrations).toBe(1800);
    expect(r.comparaison.gainBase).toBe(720);
    expect(r.texte).toContain("École A 12 km");
    expect(r.texte).toContain("établissement 2 25 km");
  });

  it("LOC-01 depuis les réponses : bureau réservé au travail, 10 m² sur 100, 10 000 € de charges → 1 000 €", () => {
    const bureau = { usage: "dedie" as const, charges: 10000, surfaceBureau: 10, surfaceTotale: 100, salleDisponible: false };
    const r = calculerParcours(p, { salaire: { montant: 30000, source: "bulletin-decembre" }, autres: autres({ ouverts: ["bureauDomicile"], bureau }) });
    const ligne = r.lignes.find((l) => l.texte.startsWith("bureau à domicile"))!;
    expect(ligne.montant).toBe(1000);
    expect(r.texte).toContain("Autres : bureau à domicile, aucun bureau fourni par l'employeur (pièce réservée au travail");
  });

  it("salle de travail disponible dans l'établissement → point à faire confirmer", () => {
    const bureau = { usage: "dedie" as const, charges: 10000, surfaceBureau: 10, surfaceTotale: 100, salleDisponible: true };
    const r = { salaire: { montant: 30000, source: "bulletin-decembre" as const }, autres: autres({ ouverts: ["bureauDomicile"], bureau }) };
    expect(casAdministration(p, r, calme).map((c) => c.id)).toEqual(["point_a_confirmer"]);
  });

  it("conseils : remplaçant, restaurant scolaire, matériel à usage mixte, mutation", () => {
    const c = conseilsMetier(p, "enseignant", { remplacant: true, mute: true, travailMaison: true });
    expect(c.trajet[0]).toContain("emploi précaire ou mobile");
    expect(c.repas[0]).toContain("Restaurant administratif ou scolaire");
    expect(c.teletravail[0]).toContain("Vos autres frais");
    expect(c.autres.join(" ")).toContain("déménagement sont déductibles");
    expect(c.autres.join(" ")).toContain("jamais un pourcentage forfaitaire");
    expect(c.autres.join(" ")).toContain("heures d'utilisation");
  });
});

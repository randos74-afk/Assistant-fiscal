import { describe, expect, it } from "vitest";
import { baremeKm } from "../moteur/calcul";
import { chargerParametres } from "../moteur/parametres";
import { htmlPdf } from "../ui/pdf";
import { calculerParcours, valeursPrudentes, type Reponses } from "./assemblage";
import { repartirAuProrata } from "./calendrier";
import { justificatifs } from "./justificatifs";
import { annexeDuDeclarant, joursRetenus, secondAllerRetourPossible, type SaisieSecondAllerRetour } from "./secondAllerRetour";

const p = chargerParametres(2025);
const site = repartirAuProrata(200, Array(12).fill(1));

const situation = "Mon entreprise n'a ni cantine ni salle de pause, et aucun commerce n'est ouvert à moins de 3 km.\nJe n'ai qu'une heure de pause.";
const preuves = "Attestation de mon employeur du 5 janvier, plan des environs <sans restaurant>, plannings de l'année.";
const justifie: SaisieSecondAllerRetour = { motif: "restauration", jours: 150, situation, preuves };

const reponses = (secondAllerRetour?: SaisieSecondAllerRetour, allerKm = 20): Reponses => ({
  salaire: { montant: 30000, source: "bulletin-decembre" },
  jours: { prudent: false, mois: site.map((s) => ({ site: s, teletravail: 0, deplacement: 0 })) },
  trajet: {
    mode: "voiture",
    allerKm,
    energie: "essence",
    energiePrudente: false,
    ligne: "5",
    puissancePrudente: false,
    kmMissions: 0,
    peagesParking: 0,
    interetsCredit: 0,
  },
  repas: { acces: "domicile", prix: null, titres: null, primePanier: 0, secondAllerRetour },
});

describe("Second aller-retour quotidien (F3.6)", () => {
  it("sans circonstance particulière : un seul aller-retour par jour", () => {
    expect(calculerParcours(p, reponses()).kmVehicules[0]).toBe(20 * 2 * 200);
  });

  it("justifié : les km du midi s'ajoutent au même véhicule, comme DAR-01", () => {
    const r = calculerParcours(p, reponses(justifie));
    expect(r.kmVehicules[0]).toBe(14000);
    expect(r.montantCase).toBe(Math.floor(baremeKm(p, { km: 14000, vehicule: "voiture", cv: 5 }).montant));
    expect(r.texte).toContain("second aller-retour quotidien sur 150 jours (impossibilité de se restaurer sur le lieu de travail)");
    expect(r.lignes[0].texte).toContain("second aller-retour 20 km × 2 × 150 j");
    expect(r.texte).toContain("second aller-retour 20 km x 2 x 150 j");
  });

  it("sans justification écrite suffisante, rien n'est ajouté", () => {
    const court = { ...justifie, situation: "Pas de cantine." };
    expect(joursRetenus(court, 200)).toBe(0);
    expect(calculerParcours(p, reponses(court)).kmVehicules[0]).toBe(8000);
  });

  it("« Je ne sais pas » pour les jours : rien n'est déduit, valeur prudente signalée", () => {
    const r = reponses({ ...justifie, jours: null });
    expect(calculerParcours(p, r).kmVehicules[0]).toBe(8000);
    expect(valeursPrudentes(r)).toContain("jours du second aller-retour (aucun retenu)");
  });

  it("jamais plus de jours que les jours sur site", () => {
    expect(joursRetenus({ ...justifie, jours: 400 }, 200)).toBe(200);
  });

  it("au-delà de 40 km sans motif de distance, le second aller-retour est aussi ramené à 40 km", () => {
    expect(calculerParcours(p, reponses({ ...justifie, jours: 200 }, 55)).kmVehicules[0]).toBe(40 * 2 * 200 * 2);
  });

  it("n'est proposé qu'avec un véhicule et une seule distance", () => {
    const t = reponses().trajet!;
    expect(secondAllerRetourPossible(t)).toBe(true);
    expect(secondAllerRetourPossible({ ...t, mode: "transports" })).toBe(false);
    expect(secondAllerRetourPossible({ ...t, kmAnnuel: 9000 })).toBe(false);
    expect(secondAllerRetourPossible(undefined)).toBe(false);
  });

  it("ajoute les pièces du motif et la justification signée aux justificatifs", () => {
    const liste = justificatifs(reponses(justifie));
    expect(liste.some((j) => j.startsWith("Attestation de l'employeur (ni cantine"))).toBe(true);
    expect(liste).toContain("Votre justification écrite du second aller-retour (annexe du PDF), datée et signée");
  });

  it("annexe du PDF : règle, km en jeu, puis les mots du client échappés et par paragraphe", () => {
    const r = reponses(justifie);
    const annexe = annexeDuDeclarant(p, r)!;
    expect(annexe.paragraphes[0]).toContain("20 km × 2 × 150 jours, soit 6 000 km");
    const resultat = calculerParcours(p, r);
    const html = htmlPdf(
      { parametres: p, resultat, prudentes: [], nonVerifiees: [], justificatifs: [], date: new Date(2026, 9, 23), annexeSecondAllerRetour: annexe },
      "logo.png",
    );
    expect(html).toContain("Annexe : justification du second aller-retour quotidien");
    expect(html).toContain("<p>Je n'ai qu'une heure de pause.</p>");
    expect(html).toContain("&lt;sans restaurant&gt;");
    expect(html).toContain("Le second aller-retour quotidien est justifié en annexe.");
    expect(annexeDuDeclarant(p, reponses())).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { calculerParcours, type Reponses } from "./assemblage";
import { repartirAuProrata } from "./calendrier";
import { casAdministration } from "./conditions";
import type { SaisieTrajet } from "./trajet";
import { valeursNonVerifiees } from "./valeursNonVerifiees";

const p = chargerParametres(2025);
const jours = (site: number) => ({ prudent: false, joursParSemaine: 5, mois: repartirAuProrata(site, Array(12).fill(1)).map((s) => ({ site: s, teletravail: 0, deplacement: 0 })) });
const base = (trajet: SaisieTrajet, site = 200): Reponses => ({ salaire: { montant: 30000, source: "bulletin-decembre" }, jours: jours(site), trajet });
const voiture = (allerKm: number, autre: Partial<SaisieTrajet> = {}): SaisieTrajet => ({
  mode: "voiture",
  allerKm,
  energie: "diesel",
  energiePrudente: false,
  ligne: "5",
  puissancePrudente: false,
  kmMissions: 0,
  peagesParking: 0,
  interetsCredit: 0,
  ...autre,
});
const passager = (allerKm: number, montantPaye: number | null): SaisieTrajet => ({ ...voiture(allerKm), mode: "covoiturage", montantPaye });
const ligneTrajet = (r: Reponses) => calculerParcours(p, r).lignes.find((l) => l.categorie === "vehicule");
const calme = { niveau: 0, message: "", postesAVerifier: [], alertes: [] } as never;

describe("Ajout n° 1 — covoiturage avec une personne extérieure au foyer", () => {
  it("test 7 : passager, 1 200 € payés au conducteur, 25 km → 1 200 €", () => {
    const l = ligneTrajet(base(passager(25, 1200)))!;
    expect(l.montant).toBe(1200);
    expect(l.texte).toBe("Covoiturage comme passager : 1 200 € versés au conducteur dans l'année.");
  });

  it("passager à 60 km sans motif → 800 € (prorata de 40 km), avec alerte", () => {
    const r = calculerParcours(p, base(passager(60, 1200)));
    expect(r.lignes.find((l) => l.categorie === "vehicule")!.montant).toBe(800);
    expect(r.alertes.some((a) => a.includes("retenue pour 40 km"))).toBe(true);
  });

  it("passager à 60 km avec motif → 1 200 €", () => {
    expect(ligneTrajet(base({ ...passager(60, 1200), motifDistance: "mutation" }))!.montant).toBe(1200);
  });

  it("passager « Je ne sais pas » → rien déduit, valeur non vérifiée, carte administration", () => {
    const r = base(passager(25, null));
    expect(ligneTrajet(r)).toBeUndefined();
    expect(valeursNonVerifiees(p, r).map((v) => v.champ)).toEqual(["montantPaye"]);
    expect(casAdministration(p, r, calme).map((c) => c.id)).toEqual(["covoiturage"]);
  });

  it("test 8 : conducteur, barème 4 965 € (10 000 km, 5 CV), 900 € de participations → 4 065 €", () => {
    const l = ligneTrajet(base(voiture(25, { covoiturage: { participations: 900, joursParSemaine: null } })))!;
    expect(l.montant).toBe(4065);
    expect(l.texte).toContain("moins 900 € de participations reçues des passagers");
  });

  it("conducteur, participations inconnues, 1 jour par semaine sur 210 jours → 42 jours non déduits", () => {
    const r = base(voiture(25, { covoiturage: { participations: null, joursParSemaine: 1 } }), 210);
    const res = calculerParcours(p, r);
    expect(res.kmVehicules[0]).toBe(8400);
    expect(res.texte).toContain("42 jours de covoiturage non déduits");
    expect(valeursNonVerifiees(p, r).map((v) => v.champ)).toEqual(["participationsCovoiturage"]);
  });

  it("conducteur, participations et jours inconnus → tous les jours retirés, deux valeurs prudentes", () => {
    const r = base(voiture(25, { covoiturage: { participations: null, joursParSemaine: null } }));
    expect(calculerParcours(p, r).kmVehicules[0]).toBe(0);
    expect(valeursNonVerifiees(p, r).map((v) => v.champ)).toEqual(["participationsCovoiturage", "joursCovoiturage"]);
  });
});

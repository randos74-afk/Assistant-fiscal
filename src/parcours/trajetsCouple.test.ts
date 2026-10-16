import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { repartirAuProrata } from "./calendrier";
import { donneesDeclarants } from "./declarants";
import type { Profil } from "./profils";
import type { SaisieTrajet } from "./trajet";
import { joursPassager, motifConjointAProposer, trajetsCoupleApplicable } from "./trajetsCouple";

const p = chargerParametres(2025);
const jours210 = { prudent: false, joursParSemaine: 5, mois: repartirAuProrata(210, Array(12).fill(1)).map((s) => ({ site: s, teletravail: 0, deplacement: 0 })) };
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profil = (trajet: SaisieTrajet, montant = 30000): Profil => ({ metier: "autre", salaire: { montant, source: "bulletin-decembre" }, jours: jours210 as any, trajet });
const vehicule = (d: ReturnType<typeof donneesDeclarants>[number]) => d.resultat.lignes.find((l) => l.categorie === "vehicule")!;

describe("Ajout n° 1 — trajets d'un couple", () => {
  it("test 6 : même lieu à 25 km, ensemble 1 jour sur 5, conducteur = vous → 10 500 km et 8 400 km", () => {
    const profils = [profil(voiture(25)), profil(voiture(25))];
    const s = { memeLieu: true, organisation: "ensemble" as const, joursEnsembleParSemaine: 1, conducteur: "vous" as const };
    expect(joursPassager(p, profils, s)).toEqual([0, 42]);
    const [d1, d2] = donneesDeclarants(p, "couple", profils, true, s);
    expect(vehicule(d1).montant).toBe(5143);
    expect(vehicule(d2).montant).toBe(4393);
    expect(d2.resultat.kmVehicules[0]).toBe(8400);
    expect(d1.resultat.texte).toContain("conducteur : moi ; km de ces jours comptés une seule fois");
    expect(d2.resultat.texte).toContain("42 jours retirés de mes trajets");
    expect(d1.casAdministration.map((c) => c.id)).toContain("covoiturage");
  });

  it("« Je ne sais pas » : 1 jour par semaine, conducteur = le plus long trajet, signalés non vérifiés", () => {
    const profils = [profil(voiture(20)), profil(voiture(30))];
    const s = { memeLieu: true, organisation: "ensemble" as const, joursEnsemblePrudent: true, conducteurPrudent: true };
    expect(joursPassager(p, profils, s)).toEqual([42, 0]);
    const [d1] = donneesDeclarants(p, "couple", profils, true, s);
    expect(d1.nonVerifiees.map((n) => n.valeur.champ)).toEqual(expect.arrayContaining(["foyer-joursEnsemble", "foyer-conducteur"]));
  });

  it("toujours chacun sa voiture : rien n'est retiré, mention dans le résumé", () => {
    const profils = [profil(voiture(25)), profil(voiture(25))];
    const [d1, d2] = donneesDeclarants(p, "couple", profils, true, { memeLieu: true, organisation: "separes" });
    expect(d2.resultat.kmVehicules[0]).toBe(10500);
    expect(d1.resultat.texte).toContain("deux véhicules, trajets séparés confirmés");
  });

  it("test 5 et ajout n° 2 test 3 : voiture partagée 6 000 + 4 000 km → 2 979 € et 1 986 €, règle prudente signalée", () => {
    const profils = [profil(voiture(0, { kmAnnuel: 6000 })), profil(voiture(0, { kmAnnuel: 4000 }))];
    const [d1, d2] = donneesDeclarants(p, "couple", profils, true, { memeVoiture: true, memeLieu: false });
    expect(vehicule(d1).montant).toBe(2979);
    expect(vehicule(d2).montant).toBe(1986);
    expect(vehicule(d1).texte).toContain("véhicule partagé avec mon conjoint");
    expect(d1.nonVerifiees.find((n) => n.valeur.champ === "foyer-vehiculePartage")?.valeur.statut).toBe("regle_prudente");
    expect(d1.casAdministration.map((c) => c.id)).toContain("vehicule_partage_conjoints");
  });

  it("test 1 : vous à 45 km, conjoint à 10 km → motif « emploi du conjoint » proposé pour vous", () => {
    expect(motifConjointAProposer(p, [profil(voiture(45)), profil(voiture(10))])).toBe(0);
    expect(motifConjointAProposer(p, [profil(voiture(55)), profil(voiture(48))])).toBeNull();
    expect(motifConjointAProposer(p, [profil(voiture(45, { motifDistance: "mutation" })), profil(voiture(10))])).toBeNull();
  });

  it("question pas encore posée : point d'attention « covoiturage »", () => {
    const profils = [profil(voiture(25)), profil(voiture(25))];
    expect(trajetsCoupleApplicable(profils)).toBe(true);
    const [d1] = donneesDeclarants(p, "couple", profils, true, undefined);
    expect(d1.casAdministration.map((c) => c.id)).toContain("covoiturage");
  });

  it("conjoint « juste son salaire » : pas d'écran des trajets à deux", () => {
    expect(trajetsCoupleApplicable([profil(voiture(25)), { salaireSeulement: true }])).toBe(false);
  });
});

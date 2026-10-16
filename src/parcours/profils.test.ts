import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { donneesDeclarants } from "./declarants";
import { nomProfil, phraseCombinaison, placesDeclarants, reponsesDuProfil, type Profil } from "./profils";

const p = chargerParametres(2025);

const vous: Profil = {
  metier: "autre",
  salaire: { montant: 30000, source: "bulletin-decembre" },
  trajet: { mode: "voiture", allerKm: 30, energie: "diesel", energiePrudente: false, ligne: "5", puissancePrudente: true, kmMissions: 0, peagesParking: 0, interetsCredit: 0 },
};
const conjoint: Profil = { prenom: "Léa", salaireSeulement: true, salaire: { montant: 25000, source: "bulletin-decembre" } };

describe("Ajout n° 1 — profils du mode foyer", () => {
  it("noms affichés", () => {
    expect(nomProfil(0)).toBe("Vous");
    expect(nomProfil(1, {})).toBe("Votre conjoint");
    expect(nomProfil(1, { prenom: " Léa " })).toBe("Léa");
  });

  it("conjoint « juste son salaire » : seul le salaire compte", () => {
    expect(reponsesDuProfil({ ...conjoint, trajet: vous.trajet })).toEqual({ salaire: conjoint.salaire });
  });

  it("phrase de la combinaison mise en avant", () => {
    expect(phraseCombinaison(true, false)).toBe("Vous aux frais réels, votre conjoint à l'abattement");
    expect(phraseCombinaison(false, true, { prenom: "Léa" })).toBe("Vous à l'abattement, Léa aux frais réels");
    expect(phraseCombinaison(false, false)).toBe("Vous gardez tous les deux l'abattement");
  });

  it("deux déclarants : cases 1AK et 1BK, points non vérifiés au nom de chacun", () => {
    const [d1, d2] = donneesDeclarants(p, "couple", [vous, conjoint]);
    expect(d1.resultat.caseFraisReels).toBe("1AK");
    expect(d2.resultat.caseFraisReels).toBe("1BK");
    expect(d2.resultat.caseSalaire).toBe("1BJ");
    expect(d1.nonVerifiees[0].valeur).toMatchObject({ libelle: "Vous : puissance du véhicule", profil: 0, champ: "0-puissance" });
    expect(d2.resultat.montantCase).toBe(0);
  });

  it("personne seule : un déclarant, libellés sans nom", () => {
    const ds = donneesDeclarants(p, "seul", [vous, conjoint]);
    expect(ds).toHaveLength(1);
    expect(ds[0].nonVerifiees[0].valeur.libelle).toBe("Puissance du véhicule");
  });
});

describe("Ajout n° 1 — personnes à charge salariées (1CK, 1DK)", () => {
  const charge: Profil = { prenom: "Tom", salaireSeulement: true, salaire: { montant: 9000, source: "bulletin-decembre" } };

  it("places : vous, le conjoint en couple, puis les personnes à charge", () => {
    expect(placesDeclarants("seul", [vous])).toEqual([0]);
    expect(placesDeclarants("seul", [vous, {}, charge])).toEqual([0, 2]);
    expect(placesDeclarants("couple", [vous, conjoint, charge, charge])).toEqual([0, 1, 2, 3]);
  });

  it("noms par défaut", () => {
    expect(nomProfil(2, {})).toBe("Personne à charge 1");
    expect(nomProfil(3, { prenom: "Tom" })).toBe("Tom");
  });

  it("personne seule avec une personne à charge : cases 1AK et 1CK", () => {
    const ds = donneesDeclarants(p, "seul", [vous, {}, charge]);
    expect(ds.map((d) => d.resultat.caseFraisReels)).toEqual(["1AK", "1CK"]);
    expect(ds[1].resultat.caseSalaire).toBe("1CJ");
    expect(ds[1].nom).toBe("Tom");
  });

  it("couple avec deux personnes à charge : 1AK, 1BK, 1CK, 1DK", () => {
    const ds = donneesDeclarants(p, "couple", [vous, conjoint, charge, { ...charge, prenom: undefined }]);
    expect(ds.map((d) => d.resultat.caseFraisReels)).toEqual(["1AK", "1BK", "1CK", "1DK"]);
    expect(ds[3].nom).toBe("Personne à charge 2");
  });
});

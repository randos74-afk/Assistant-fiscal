import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import { donneesDeclarants } from "./declarants";
import { nomProfil, phraseCombinaison, reponsesDuProfil, type Profil } from "./profils";

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

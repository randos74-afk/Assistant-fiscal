import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import type { Reponses } from "./assemblage";
import { repartirAuProrata } from "./calendrier";
import { effetPossible, nValeurs, titreNonVerifiees, valeursNonVerifiees } from "./valeursNonVerifiees";

const p = chargerParametres(2025);
const site = repartirAuProrata(200, Array(12).fill(1));

const toutSaisi: Reponses = {
  salaire: { montant: 30000, source: "bulletin-decembre" },
  jours: { prudent: false, mois: site.map((s) => ({ site: s, teletravail: 0, deplacement: 0 })) },
  trajet: {
    mode: "voiture",
    allerKm: 30,
    energie: "diesel",
    energiePrudente: false,
    ligne: "5",
    puissancePrudente: false,
    kmMissions: 0,
    peagesParking: 0,
    interetsCredit: 0,
  },
};

describe("Ajout n° 2 — valeurs non vérifiées", () => {
  it("test 1 : puissance inconnue → 3 CV retenus, statut prudent, une seule valeur", () => {
    const r: Reponses = { ...toutSaisi, trajet: { ...toutSaisi.trajet!, ligne: "3", puissancePrudente: true } };
    const liste = valeursNonVerifiees(p, r);
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ champ: "puissance", statut: "prudent", valeurRetenue: "3 CV et moins", ecran: "trajet" });
    expect(titreNonVerifiees(liste.length)).toBe("1 valeur n'a pas été vérifiée");
  });

  it("test 2 : toutes les valeurs saisies → aucune valeur non vérifiée", () => {
    expect(valeursNonVerifiees(p, toutSaisi)).toEqual([]);
  });

  it("puissance la plus forte : la vraie valeur peut augmenter le gain", () => {
    const r: Reponses = { ...toutSaisi, trajet: { ...toutSaisi.trajet!, ligne: "3", puissancePrudente: true } };
    expect(effetPossible(p, r, valeursNonVerifiees(p, r)[0])).toBe("gain-plus-eleve");
  });

  it("verdict à l'abattement : la vraie puissance peut faire basculer vers les frais réels", () => {
    // 20 km aller sur 200 jours = 8 000 km : 3 593 € en 3 CV, moins que 3 700 € d'abattement ; 4 667 € en 7 CV.
    const r: Reponses = { ...toutSaisi, salaire: { montant: 37000, source: "bulletin-decembre" }, trajet: { ...toutSaisi.trajet!, allerKm: 20, ligne: "3", puissancePrudente: true } };
    expect(effetPossible(p, r, valeursNonVerifiees(p, r)[0])).toBe("verdict-peut-changer");
  });

  it("libellés au singulier et au pluriel", () => {
    expect(nValeurs(1)).toBe("1 valeur non vérifiée");
    expect(nValeurs(2)).toBe("2 valeurs non vérifiées");
    expect(titreNonVerifiees(2)).toBe("2 valeurs n'ont pas été vérifiées");
  });
});

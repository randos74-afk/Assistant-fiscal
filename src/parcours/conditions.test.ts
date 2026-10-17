import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chargerParametres } from "../moteur/parametres";
import type { Vraisemblance } from "../moteur/vraisemblance";
import type { Reponses } from "./assemblage";
import {
  CONFIGURATION,
  casAdministration,
  dateEnClair,
  doitAfficherConditions,
  lienAnnexe,
  peutCommencer,
  texteConditions,
  type Configuration,
} from "./conditions";

const p = chargerParametres(2025);
const calme: Vraisemblance = { niveau: 0, message: "", postesAVerifier: [], alertes: [] } as unknown as Vraisemblance;

const avecAdresse = (url: string): Configuration => ({ ...CONFIGURATION, liens: { ...CONFIGURATION.liens, annexe_limites_usage: url } });

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((f) => {
    const chemin = join(dossier, f);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

describe("Ajout n° 3 — conditions générales", () => {
  it("le lien de l'annexe vient de la configuration, jamais du code", () => {
    expect(lienAnnexe(avecAdresse("https://sites.google.com/view/fraisfit/limites"))).toBe("https://sites.google.com/view/fraisfit/limites");
    expect(lienAnnexe(avecAdresse("[URL Google Site]"))).toBeNull();
    const enDur = fichiers("src").filter((f) => /sites\.google|google\.com\/site/.test(readFileSync(f, "utf8")) && !f.endsWith(".test.ts"));
    expect(enDur).toEqual([]);
  });

  it("le texte des conditions reprend l'adresse de la configuration", () => {
    const t = texteConditions(avecAdresse("https://exemple.fr/annexe"));
    expect(t).toContain("consultable à l'adresse https://exemple.fr/annexe");
    expect(t).not.toContain("{lien_annexe}");
    expect(texteConditions(avecAdresse("[URL Google Site]"))).toContain("(adresse à venir)");
  });

  it("le nom de l'éditeur et l'email de contact viennent de la configuration", () => {
    const t = texteConditions();
    expect(t).toContain("éditée par Marc Chevallay");
    expect(t).toContain("contact : fraisfit@gmail.com");
    expect(t).toContain("s'adresse d'abord à fraisfit@gmail.com");
    expect(t).not.toMatch(/\{editeur_nom\}|\{email_contact\}/);
  });

  it("case non cochée → « Commencer » inactif", () => {
    expect(peutCommencer(false)).toBe(false);
    expect(peutCommencer(true)).toBe(true);
  });

  it("premier lancement, puis version 1.0 acceptée et textes en 1.1 → écran affiché de nouveau", () => {
    expect(doitAfficherConditions(null, "1.0")).toBe(true);
    const acceptee = { version: "1.0", accepteeLe: "2026-10-16T08:00:00.000Z" };
    expect(doitAfficherConditions(acceptee, "1.0")).toBe(false);
    expect(doitAfficherConditions(acceptee, "1.1")).toBe(true);
  });

  it("date en clair", () => {
    expect(dateEnClair("2026-10-16")).toBe("16 octobre 2026");
  });
});

describe("Ajout n° 3 — cas à trancher par l'administration", () => {
  const base: Reponses = {
    salaire: { montant: 30000, source: "bulletin-decembre" },
    trajet: {
      mode: "voiture",
      allerKm: 55,
      energie: "diesel",
      energiePrudente: false,
      ligne: "5",
      puissancePrudente: false,
      kmMissions: 0,
      peagesParking: 0,
      interetsCredit: 0,
    },
  };

  it("aucun cas dans un parcours simple", () => {
    expect(casAdministration(p, base, calme)).toEqual([]);
  });

  it("plus de 40 km avec un motif → carte affichée, plafond lu dans les paramètres", () => {
    const cas = casAdministration(p, { ...base, trajet: { ...base.trajet!, motifDistance: "mutation" } }, calme);
    expect(cas.map((c) => c.id)).toEqual(["distance_plus_40_km_motivee"]);
    expect(cas[0].phrase).toContain(`${p.deplacements.distance_aller_max_sans_justification_km} km`);
  });

  it("formation ou alerte de vraisemblance → cartes affichées", () => {
    const r: Reponses = { ...base, autres: { ouverts: ["formation"], montants: {}, telephonePartPro: 0, achats: [], libelleAutre: "", doubleResidence: null, transport: null } };
    const cas = casAdministration(p, r, { ...calme, niveau: 2 } as Vraisemblance);
    expect(cas.map((c) => c.id)).toEqual(["double_residence_ou_demenagement_ou_formation", "alerte_vraisemblance_montant"]);
  });
});

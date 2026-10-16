// Ajout n° 2 — Valeurs non vérifiées : chaque « Je ne sais pas » (statut « prudent ») et chaque règle de
// prudence imposée faute de texte officiel (statut « regle_prudente »), avec la valeur retenue et l'étape où la corriger.
import { euros } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import type { EcranModifiable } from "../ui/Relecture";
import { calculerParcours, type Reponses } from "./assemblage";
import { totaux } from "./calendrier";
import { libelleLigne, optionsPuissance } from "./trajet";

export type StatutValeur = "saisi" | "prudent" | "regle_prudente";

export interface ValeurNonVerifiee {
  champ: string;
  libelle: string;
  statut: Exclude<StatutValeur, "saisi">;
  /** Valeur retenue, en clair. */
  valeurRetenue: string;
  /** Étape où l'on corrige la valeur. */
  ecran: EcranModifiable;
  /** Mode foyer : profil concerné (0 = vous, 1 = conjoint). */
  profil?: number;
  /** Réponses avec la valeur la plus favorable, pour savoir si la vraie valeur peut changer le verdict. */
  variante?: Reponses;
}

/** Effet possible de la vraie valeur sur le verdict, mesuré avec la variante la plus favorable. */
export type EffetPossible = "aucun" | "gain-plus-eleve" | "verdict-peut-changer";

function lignePlusHaute(p: Parametres, type: "voiture" | "moto"): string {
  const options = optionsPuissance(p, type);
  return options[options.length - 1]?.valeur ?? "";
}

export function valeursNonVerifiees(p: Parametres, r: Reponses): ValeurNonVerifiee[] {
  const liste: ValeurNonVerifiee[] = [];
  const prudentes = p.valeurs_prudentes_je_ne_sais_pas;

  if (r.jours?.prudent) {
    liste.push({
      champ: "jours",
      libelle: "Nombre de jours travaillés",
      statut: "prudent",
      valeurRetenue: `${totaux(r.jours.mois).travailles} jours`,
      ecran: "jours",
    });
  }

  // Véhicule : trajet classique ou journée type d'aide à domicile.
  const vehicule = r.trajet ?? r.domicile;
  const type = r.trajet ? r.trajet.mode : r.domicile?.vehicule;
  if (vehicule && (type === "voiture" || type === "moto")) {
    if (vehicule.puissancePrudente && vehicule.ligne) {
      const lignes = optionsPuissance(p, type).map((o) => o.valeur);
      const plusHaute = lignePlusHaute(p, type);
      liste.push({
        champ: "puissance",
        libelle: "Puissance du véhicule",
        statut: "prudent",
        valeurRetenue: libelleLigne(vehicule.ligne, lignes),
        ecran: "trajet",
        variante: r.trajet ? { ...r, trajet: { ...r.trajet, ligne: plusHaute } } : { ...r, domicile: { ...r.domicile!, ligne: plusHaute } },
      });
    }
    if (vehicule.energiePrudente) {
      liste.push({
        champ: "energie",
        libelle: "Énergie du véhicule",
        statut: "prudent",
        valeurRetenue: "barème des véhicules thermiques",
        ecran: "trajet",
        variante: r.trajet
          ? { ...r, trajet: { ...r.trajet, energie: "électrique" } }
          : { ...r, domicile: { ...r.domicile!, energie: "électrique" } },
      });
    }
  }

  if (r.domicile?.forfaitsPrudents) {
    liste.push({
      champ: "forfaitsTransport",
      libelle: "Forfaits de transport reçus",
      statut: "prudent",
      valeurRetenue: euros(r.domicile.forfaitsTransport),
      ecran: "trajet",
      variante: { ...r, domicile: { ...r.domicile, forfaitsTransport: 0 } },
    });
  }

  if (r.repas && r.repas.prix === null && r.repas.lieu && r.repas.lieu !== "gamelle") {
    liste.push({
      champ: "prixRepas",
      libelle: "Prix de vos repas",
      statut: "prudent",
      valeurRetenue: String(prudentes.prix_repas),
      ecran: "repas",
    });
  }
  if (r.repas?.titres?.partPrudente) {
    liste.push({
      champ: "partTitres",
      libelle: "Part de l'employeur sur les titres-restaurant",
      statut: "prudent",
      valeurRetenue: `${euros(r.repas.titres.partEmployeur)} par titre`,
      ecran: "repas",
    });
  }
  if (r.repas?.lieu === "restaurant" && r.repas.prixSurPlacePrudent) {
    liste.push({
      champ: "prixSurPlace",
      libelle: "Prix d'un repas sur place",
      statut: "prudent",
      valeurRetenue: "aucun surcoût déduit",
      ecran: "repas",
    });
  }

  if (r.teletravail?.allocationPrudente) {
    liste.push({
      champ: "allocationTeletravail",
      libelle: "Indemnité de télétravail versée par l'employeur",
      statut: "prudent",
      valeurRetenue: euros(r.teletravail.allocation),
      ecran: "teletravail",
      variante: { ...r, teletravail: { ...r.teletravail, allocation: 0, allocationParEmployeur: undefined } },
    });
  }

  const transport = r.autres?.transport;
  if (transport?.priseEnChargePrudente) {
    liste.push({
      champ: "remboursementTransport",
      libelle: "Remboursement de l'abonnement de transport",
      statut: "prudent",
      valeurRetenue: euros(transport.priseEnCharge),
      ecran: "autres",
    });
  }

  return liste;
}

/** La vraie valeur peut-elle augmenter le gain, ou faire basculer le verdict vers les frais réels ? */
export function effetPossible(p: Parametres, r: Reponses, v: ValeurNonVerifiee): EffetPossible {
  if (!v.variante) return "aucun";
  const actuel = calculerParcours(p, r).comparaison;
  const favorable = calculerParcours(p, v.variante).comparaison;
  if (!actuel.fraisReelsConseilles && favorable.fraisReelsConseilles) return "verdict-peut-changer";
  if (actuel.fraisReelsConseilles && favorable.gainBase > actuel.gainBase) return "gain-plus-eleve";
  return "aucun";
}

/** Phrase de l'écran « Avant de recopier » quand la vraie valeur peut changer le résultat. */
export function phraseEffet(v: ValeurNonVerifiee, effet: EffetPossible): string | null {
  const nom = v.libelle.charAt(0).toLowerCase() + v.libelle.slice(1);
  if (effet === "gain-plus-eleve") return `Avec la vraie valeur (${nom}), vous pourriez gagner davantage.`;
  if (effet === "verdict-peut-changer") return `Avec la vraie valeur (${nom}), les frais réels pourraient devenir plus avantageux.`;
  return null;
}

/** « 1 valeur n'a pas été vérifiée », « 2 valeurs n'ont pas été vérifiées ». */
export function titreNonVerifiees(n: number): string {
  return n > 1 ? `${n} valeurs n'ont pas été vérifiées` : "1 valeur n'a pas été vérifiée";
}

/** Titre quand l'écran contient aussi des cas à faire trancher par l'administration. */
export function pointsAttention(n: number): string {
  return n > 1 ? `${n} points sont à vérifier` : "1 point est à vérifier";
}

export function nValeurs(n: number): string {
  return n > 1 ? `${n} valeurs non vérifiées` : "1 valeur non vérifiée";
}

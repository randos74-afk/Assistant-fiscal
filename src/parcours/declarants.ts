// Ajout n° 1 — Calcul de chaque déclarant du foyer (1AK pour « Vous », 1BK pour le conjoint),
// avec ses valeurs non vérifiées, ses cas à trancher et ses contrôles de vraisemblance.
import { calculerDeclarant, type ResultatDeclarant } from "../moteur/declarant";
import type { Parametres } from "../moteur/types";
import type { Vraisemblance } from "../moteur/vraisemblance";
import { entreeDeclarant, vraisemblance, type Reponses } from "./assemblage";
import { casAdministration, type CasAdministration } from "./conditions";
import { minuscule, nomProfil, reponsesDuProfil, type ModeDeclaration, type Profil } from "./profils";
import { appliquerTrajetsCouple, organisationRetenue, trajetsCoupleApplicable, type SaisieTrajetsCouple } from "./trajetsCouple";
import { effetPossible, valeursNonVerifiees, type EffetPossible, type ValeurNonVerifiee } from "./valeursNonVerifiees";

export interface DonneesDeclarant {
  index: number;
  nom: string;
  profil: Profil;
  reponses: Reponses;
  resultat: ResultatDeclarant;
  nonVerifiees: { valeur: ValeurNonVerifiee; effet: EffetPossible }[];
  casAdministration: CasAdministration[];
  vraisemblance: Vraisemblance;
}

/** Points du foyer liés aux trajets à deux : règle de prudence, valeurs prudentes, cas à faire confirmer. */
function pointsTrajetsCouple(p: Parametres, profils: Profil[], s: SaisieTrajetsCouple | undefined) {
  const nonVerifiees: ValeurNonVerifiee[] = [];
  const cas: CasAdministration[] = [];
  if (!trajetsCoupleApplicable(profils)) return { nonVerifiees, cas };
  if (s?.memeVoiture) {
    nonVerifiees.push({
      champ: "foyer-vehiculePartage",
      libelle: "Voiture partagée avec votre conjoint",
      statut: "regle_prudente",
      valeurRetenue: "barème réparti selon la méthode la plus faible",
      ecran: "trajetsCouple",
      profil: 0,
    });
    cas.push({
      id: "vehicule_partage_conjoints",
      phrase: "Vous utilisez tous les deux la même voiture. Les textes officiels ne précisent pas ce cas : nous appliquons la règle la plus prudente.",
      ecran: "trajetsCouple",
      profil: 0,
    });
  }
  if (s?.memeLieu && s.organisation === "ensemble") {
    const retenu = organisationRetenue(p, profils, s);
    if (s.joursEnsemblePrudent) {
      nonVerifiees.push({
        champ: "foyer-joursEnsemble",
        libelle: "Jours de route ensemble",
        statut: "prudent",
        valeurRetenue: `${retenu.joursParSemaine} jour par semaine`,
        ecran: "trajetsCouple",
        profil: 0,
      });
    }
    if (s.conducteurPrudent) {
      nonVerifiees.push({
        champ: "foyer-conducteur",
        libelle: "Conducteur les jours ensemble",
        statut: "prudent",
        valeurRetenue: retenu.conducteur === "vous" ? "vous (le plus long trajet)" : `${minuscule(nomProfil(1, profils[1]))} (le plus long trajet)`,
        ecran: "trajetsCouple",
        profil: 0,
      });
    }
    cas.push({
      id: "covoiturage",
      phrase: "Les jours où vous faites la route ensemble, seul le conducteur déduit son trajet. Cette règle de prudence reste à confirmer par l'administration.",
      ecran: "trajetsCouple",
      profil: 0,
    });
  } else if (s?.memeLieu === undefined || (s.memeLieu && !s.organisation)) {
    cas.push({
      id: "covoiturage",
      phrase: "Vous ne nous avez pas encore dit comment vous allez au travail tous les deux. Les jours faits ensemble ne peuvent être déduits qu'une fois.",
      ecran: "trajetsCouple",
      profil: 0,
    });
  }
  return { nonVerifiees, cas };
}

export function donneesDeclarants(
  p: Parametres,
  mode: ModeDeclaration | undefined,
  profils: Profil[],
  couple?: boolean,
  trajetsCouple?: SaisieTrajetsCouple,
): DonneesDeclarant[] {
  const enCouple = mode === "couple";
  const liste = enCouple ? profils.slice(0, 2) : profils.slice(0, 1);
  const reponses = liste.map(reponsesDuProfil);
  const brutes = reponses.map((r, i) => entreeDeclarant(p, r, i + 1));
  const { entrees, alertes } = enCouple ? appliquerTrajetsCouple(p, liste, trajetsCouple, brutes) : { entrees: brutes, alertes: [] };
  const foyer = enCouple ? pointsTrajetsCouple(p, liste, trajetsCouple) : { nonVerifiees: [], cas: [] };

  return liste.map((profil, index) => {
    const calcul = calculerDeclarant(p, entrees[index]);
    const resultat = { ...calcul, alertes: [...calcul.alertes, ...(alertes[index] ?? [])] };
    const v = vraisemblance(p, reponses[index], resultat, couple ?? enCouple);
    const nom = nomProfil(index, profil);
    // En couple, chaque point porte le nom du déclarant et l'index de son profil pour y revenir.
    const prefixe = (libelle: string) => (enCouple ? `${nom} : ${libelle.charAt(0).toLowerCase()}${libelle.slice(1)}` : libelle);
    return {
      index,
      nom,
      profil,
      reponses: reponses[index],
      resultat,
      nonVerifiees: [
        ...valeursNonVerifiees(p, reponses[index]).map((valeur) => ({
          valeur: { ...valeur, champ: `${index}-${valeur.champ}`, libelle: prefixe(valeur.libelle), profil: index },
          effet: effetPossible(p, reponses[index], valeur),
        })),
        // Points du foyer, rattachés une seule fois au premier déclarant.
        ...(index === 0 ? foyer.nonVerifiees.map((valeur) => ({ valeur, effet: "aucun" as const })) : []),
      ],
      casAdministration: [
        ...casAdministration(p, reponses[index], v).map((c) => ({ ...c, phrase: enCouple ? `${nom} : ${c.phrase}` : c.phrase, profil: index })),
        ...(index === 0 ? foyer.cas : []),
      ],
      vraisemblance: v,
    };
  });
}

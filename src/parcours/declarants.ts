// Ajout n° 1 — Calcul de chaque déclarant du foyer (1AK pour « Vous », 1BK pour le conjoint),
// avec ses valeurs non vérifiées, ses cas à trancher et ses contrôles de vraisemblance.
import { calculerDeclarant, type ResultatDeclarant } from "../moteur/declarant";
import type { Parametres } from "../moteur/types";
import type { Vraisemblance } from "../moteur/vraisemblance";
import { entreeDeclarant, vraisemblance, type Reponses } from "./assemblage";
import { casAdministration, type CasAdministration } from "./conditions";
import { nomProfil, reponsesDuProfil, type ModeDeclaration, type Profil } from "./profils";
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

export function donneesDeclarants(p: Parametres, mode: ModeDeclaration | undefined, profils: Profil[], couple?: boolean): DonneesDeclarant[] {
  const enCouple = mode === "couple";
  const liste = enCouple ? profils.slice(0, 2) : profils.slice(0, 1);
  return liste.map((profil, index) => {
    const reponses = reponsesDuProfil(profil);
    const resultat = calculerDeclarant(p, entreeDeclarant(p, reponses, index + 1));
    const v = vraisemblance(p, reponses, resultat, couple ?? enCouple);
    const nom = nomProfil(index, profil);
    // En couple, chaque point porte le nom du déclarant et l'index de son profil pour y revenir.
    const prefixe = (libelle: string) => (enCouple ? `${nom} : ${libelle.charAt(0).toLowerCase()}${libelle.slice(1)}` : libelle);
    return {
      index,
      nom,
      profil,
      reponses,
      resultat,
      nonVerifiees: valeursNonVerifiees(p, reponses).map((valeur) => ({
        valeur: { ...valeur, champ: `${index}-${valeur.champ}`, libelle: prefixe(valeur.libelle), profil: index },
        effet: effetPossible(p, reponses, valeur),
      })),
      casAdministration: casAdministration(p, reponses, v).map((c) => ({ ...c, phrase: enCouple ? `${nom} : ${c.phrase}` : c.phrase, profil: index })),
      vraisemblance: v,
    };
  });
}

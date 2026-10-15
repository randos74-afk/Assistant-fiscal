// Assemble les réponses des sept étapes en une entrée unique du moteur, puis liste les valeurs prudentes.
import { calculerDeclarant, type EntreeDeclarant, type ResultatDeclarant } from "../moteur/declarant";
import type { Parametres } from "../moteur/types";
import { evaluerVraisemblance, type Vraisemblance } from "../moteur/vraisemblance";
import { autresFraisPourMoteur, type SaisieAutresFrais } from "./autresFrais";
import { totaux, type JoursDuMois } from "./calendrier";
import { repasPourMoteur, type SaisieRepas } from "./repas";
import { entreeReel, reintegrationsTeletravail, type SaisieTeletravail } from "./teletravail";
import { vehiculePourMoteur, type SaisieTrajet } from "./trajet";
import { domicilePourMoteur, type SaisieDomicile } from "./domicile";
import { resumeEmployeurs, type Employeur } from "./employeurs";

export interface Reponses {
  salaire?: { montant: number; source: string; employeurs?: Employeur[] };
  jours?: { prudent: boolean; mois: JoursDuMois[]; joursParSemaine?: number };
  trajet?: SaisieTrajet;
  /** Parcours aide à domicile : remplace le trajet. */
  domicile?: SaisieDomicile;
  repas?: SaisieRepas;
  teletravail?: SaisieTeletravail;
  autres?: SaisieAutresFrais;
}

export function entreeDeclarant(p: Parametres, r: Reponses, numero = 1): EntreeDeclarant {
  const mois = r.jours?.mois ?? [];
  const t = totaux(mois);
  const autres = r.autres ? autresFraisPourMoteur(p, r.autres) : { autresFrais: [], motifs: [], kmVehiculeEnPlus: 0 };

  const domicile = r.domicile ? domicilePourMoteur(p, r.domicile) : null;
  const employeurs = r.salaire?.employeurs && r.salaire.employeurs.length > 1 ? r.salaire.employeurs : undefined;
  const vehicule = domicile ? domicile.vehicule : r.trajet ? vehiculePourMoteur(p, r.trajet, t.site, employeurs) : null;
  if (vehicule && autres.kmVehiculeEnPlus > 0) vehicule.kmDoubleResidence = autres.kmVehiculeEnPlus;

  const repas = r.repas ? repasPourMoteur(r.repas, t.site, p) : { repas: null, reintegrations: [] };
  const teletravailParMois = mois.map((m) => m.teletravail);

  return {
    numero,
    salairePrerempli: r.salaire?.montant ?? 0,
    vehicules: vehicule ? [vehicule] : [],
    repas: repas.repas ? [repas.repas] : [],
    teletravailJoursParMois: teletravailParMois,
    teletravailMethode: r.teletravail?.methode ?? "forfait",
    teletravailReel: r.teletravail ? entreeReel(r.teletravail, t.teletravail, t.travailles) : undefined,
    autresFrais: autres.autresFrais,
    reintegrations: [
      ...(domicile?.reintegrations ?? []),
      ...repas.reintegrations,
      ...(r.teletravail ? reintegrationsTeletravail(r.teletravail) : []),
    ],
    // F12.8 — Une ligne par employeur (période, salaire, distance) dans le résumé.
    motifs: [
      ...(employeurs ? [resumeEmployeurs(employeurs, vehicule?.trajetsEmployeurs ? r.trajet?.employeurs?.map((e) => e.allerKm) : undefined)] : []),
      ...autres.motifs,
    ],
  };
}

export function calculerParcours(p: Parametres, r: Reponses): ResultatDeclarant {
  return calculerDeclarant(p, entreeDeclarant(p, r));
}

/** Valeurs prudentes retenues après « Je ne sais pas », à signaler dans le récapitulatif (règle d'or n° 5). */
export function valeursPrudentes(r: Reponses): string[] {
  const liste: string[] = [];
  if (r.jours?.prudent) liste.push("nombre de jours travaillés");
  if (r.trajet?.puissancePrudente) liste.push("puissance du véhicule");
  if (r.trajet?.energiePrudente || r.domicile?.energiePrudente) liste.push("énergie du véhicule");
  if (r.domicile?.puissancePrudente) liste.push("puissance du véhicule");
  if (r.domicile?.forfaitsPrudents) liste.push("forfaits de transport");
  if (r.repas && r.repas.prix === null && r.repas.lieu && r.repas.lieu !== "gamelle") liste.push("prix des repas");
  if (r.repas?.titres?.partPrudente) liste.push("part de l'employeur sur les titres-restaurant");
  if (r.repas?.lieu === "restaurant" && r.repas.prixSurPlacePrudent) liste.push("prix d'un repas sur place");
  if (r.teletravail?.allocationPrudente) liste.push("indemnité de télétravail");
  if (r.autres?.transport?.priseEnChargePrudente) liste.push("remboursement de l'abonnement de transport");
  return liste;
}

/** F11 — Contexte des contrôles ciblés ; la situation familiale n'est connue que si elle a été renseignée. */
export function vraisemblance(p: Parametres, r: Reponses, resultat: ResultatDeclarant, couple?: boolean): Vraisemblance {
  return evaluerVraisemblance(p, resultat, {
    joursSurSite: totaux(r.jours?.mois ?? []).site,
    joursParSemaine: r.jours?.joursParSemaine ?? 5,
    couple,
    doubleResidence: Boolean(r.autres?.ouverts.includes("doubleResidence")),
    motifEmploiConjoint: (r.domicile?.motifDistance ?? r.trajet?.motifDistance) === "emploi du conjoint",
  });
}

// Structure de parametres/revenus-AAAA.json (seuls les champs utilisés par le moteur sont typés).

export interface LigneBareme {
  a: number;
  b: number;
}

export interface BaremeParPuissance {
  tranches_km: number[];
  lignes: Record<string, LigneBareme[]>;
}

export interface BaremeUnique {
  tranches_km: number[];
  ligne: LigneBareme[];
}

export interface Parametres {
  millesime: { revenus: number; declaration: number; statut: string };
  abattement_10_pourcent: {
    taux: number;
    minimum_par_declarant: number;
    maximum_par_declarant: number;
  };
  repas: {
    valeur_repas_au_foyer: number;
    forfait_sans_justificatif_detaille: number;
    seuil_alerte_prix_repas: number;
  };
  teletravail: {
    forfait_par_jour: number;
    plafond_mensuel: number;
    plafond_annuel: number;
    heures_par_journee_teletravail_local_mixte: number;
    heures_par_an: number;
    studio_part_professionnelle: number;
  };
  materiel: {
    seuil_deduction_immediate_HT: number;
    duree_amortissement_informatique_ans: number;
  };
  deplacements: {
    distance_aller_max_sans_justification_km: number;
    allers_retours_par_jour_par_defaut: number;
    puissance_max_voiture_cv: number;
  };
  bareme_kilometrique: {
    voiture_thermique: BaremeParPuissance;
    voiture_electrique: BaremeParPuissance;
    cyclomoteur_thermique: BaremeUnique;
    cyclomoteur_electrique: BaremeUnique;
    moto_thermique: BaremeParPuissance;
    moto_electrique: BaremeParPuissance;
  };
  resume_1ak: { longueur_cible_caracteres: number };
  cotisations_syndicales: { taux_credit_impot: number };
  grand_deplacement_reperes: {
    logement_petit_dejeuner_paris_petite_couronne_par_jour: number;
    logement_petit_dejeuner_autres_departements_par_jour: number;
  };
  alertes_vraisemblance: Record<string, number>;
  valeurs_prudentes_je_ne_sais_pas: Record<string, number | string>;
  [cle: string]: unknown;
}

export type TypeVehicule = "voiture" | "moto" | "cyclomoteur";

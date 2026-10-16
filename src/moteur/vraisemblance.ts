// F11 — Contrôles de vraisemblance : alerte globale à trois niveaux et contrôles ciblés.
// Seuils lus dans les paramètres ; aucune alerte n'empêche de déclarer, elles font vérifier.
import type { LigneResume, ResultatDeclarant } from "./declarant";
import { euros, nombre } from "./format";
import type { Parametres } from "./types";

export type Niveau = 0 | 1 | 2 | 3;

export interface Contexte {
  joursSurSite: number;
  joursParSemaine: number;
  /** Connu seulement si la situation familiale a été renseignée. */
  couple?: boolean;
  doubleResidence: boolean;
  motifEmploiConjoint: boolean;
}

export interface Vraisemblance {
  niveau: Niveau;
  message: string | null;
  /** Postes à relire (niveau 2) ou à confirmer un par un (niveau 3) avant le résumé. */
  postesAVerifier: LigneResume[];
  alertes: string[];
}

export function evaluerVraisemblance(p: Parametres, r: ResultatDeclarant, c: Contexte): Vraisemblance {
  const a = p.alertes_vraisemblance;
  const frais = r.montantCase;
  const salaire = r.comparaison.salaireCorrige;
  const lignes = [...r.lignes].filter((l) => l.montant > 0).sort((x, y) => y.montant - x.montant);

  let niveau: Niveau = 0;
  if (salaire > 0 && frais > salaire * a.niveau_3_blocage_part_du_salaire) niveau = 3;
  else if (salaire > 0 && frais > salaire * a.niveau_2_verification_part_du_salaire) niveau = 2;
  else if (frais > r.comparaison.abattement * a.niveau_1_rappel_multiple_abattement) niveau = 1;

  const messages: Record<Niveau, string | null> = {
    0: null,
    1: "Vos frais sont élevés. C'est normal si vous faites beaucoup de route ; gardez bien vos justificatifs.",
    2: `Vos frais dépassent la moitié de votre salaire. Relisez vos postes les plus lourds avant de copier le texte.`,
    3: `Vos frais (${euros(frais)}) dépassent votre salaire (${euros(salaire)}). Confirmez chaque poste ; en cas de doute, rapprochez-vous de votre service des impôts.`,
  };

  // Niveau 2 : les postes qui pèsent le plus (jusqu'à trois, chacun au moins un dixième du total).
  const postesAVerifier =
    niveau === 3 ? lignes : niveau === 2 ? lignes.filter((l) => l.montant >= frais / 10).slice(0, 3) : [];

  const alertes: string[] = [];
  for (const km of r.kmVehicules) {
    if (km > a.km_annuels_alerte) {
      alertes.push(`${nombre(km)} km dans l'année : vérifiez votre kilométrage et gardez un carnet de bord.`);
    }
  }
  if (c.joursParSemaine >= 5 && c.joursSurSite > a.jours_sur_site_max_temps_plein) {
    alertes.push(`${nombre(c.joursSurSite)} jours sur site : avez-vous bien retiré congés, RTT et jours fériés ?`);
  }
  if (c.couple === false && c.doubleResidence) {
    alertes.push("La double résidence est réservée en principe aux couples dont les lieux de travail sont éloignés. Vérifiez votre situation.");
  }
  if (c.couple === false && c.motifEmploiConjoint) {
    alertes.push("Le motif « emploi du conjoint » suppose un conjoint ou partenaire : choisissez un autre motif ou ramenez la distance au plafond.");
  }

  // F7.7 — Frais supérieurs à la rémunération : l'excédent est un déficit imputé sur le revenu global
  // (BOI-RSA-BASE-10 § 20, CGI art. 156 I).
  const excedent = -r.comparaison.baseFraisReels;
  if (excedent > 0) {
    alertes.push(
      `Vos frais dépassent votre rémunération de ${euros(excedent)}. Cet excédent se déduit de vos autres revenus et de ceux de votre foyer ; s'il en reste, il se reporte sur les six années suivantes. Déclarez le montant total de vos frais : le site des impôts fait ce calcul. L'administration vérifie que des frais aussi élevés sont justifiés.`,
    );
  }

  return { niveau, message: messages[niveau], postesAVerifier, alertes };
}

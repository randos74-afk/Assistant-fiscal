// F9.2 — Justificatifs à conserver, selon les postes réellement ouverts.
import type { Reponses } from "./assemblage";
import { POSTES } from "./autresFrais";
import { totaux } from "./calendrier";
import { estVehicule, motifDistance } from "./trajet";
import { joursRetenus, motifSecondAllerRetour, secondAllerRetourPossible } from "./secondAllerRetour";

/** Pièce à garder pour le motif de distance au-delà du plafond. */
function pieceDistance(valeur: string): string {
  const piece = motifDistance(valeur)?.piece;
  return piece ? `${piece} (distance réelle retenue : ${valeur})` : `Pièce justifiant la distance au-delà du plafond (${valeur})`;
}

export function justificatifs(r: Reponses): string[] {
  const liste = ["Bulletin de paie de décembre (salaire de l'année)"];
  const t = totaux(r.jours?.mois ?? []);

  if (r.jours?.mois.some((m) => m.site + m.teletravail + m.deplacement > 0)) {
    liste.push("Planning, compteurs de congés ou attestation de l'employeur (jours travaillés)");
  }

  const trajet = r.trajet;
  if (trajet && estVehicule(trajet.mode)) {
    liste.push("Carte grise du véhicule (puissance et énergie)");
    liste.push("Itinéraire le plus court entre domicile et travail");
    if (trajet.motifDistance) liste.push(pieceDistance(trajet.motifDistance));
    if (trajet.kmMissions > 0) liste.push("Carnet de bord ou relevés des trajets professionnels");
    if (trajet.kmAnnuel) liste.push("Relevé de compteur ou carnet de bord justifiant le total de kilomètres");
    if (trajet.peagesParking > 0) liste.push("Relevés de télépéage et tickets de parking");
    if (trajet.interetsCredit > 0) liste.push("Tableau d'amortissement du crédit auto");
    if (trajet.lieux?.length) liste.push("Arrêtés d'affectation ou ordres de mission pour chaque établissement");
    if (trajet.covoiturage?.participations) liste.push("Historique des participations reçues des passagers (plateforme de covoiturage, virements)");
    if (trajet.indemnitesKmRecues) liste.push("Bulletins de paie et notes de frais : indemnités kilométriques remboursées");
  }
  if (trajet?.mode === "covoiturage" && trajet.montantPaye) {
    liste.push("Historique des paiements au conducteur (plateforme de covoiturage, virements)");
    liste.push("Itinéraire le plus court entre domicile et travail");
    if (trajet.motifDistance) liste.push(pieceDistance(trajet.motifDistance));
  }
  if (r.reintegrationsMetier?.length) {
    liste.push("Déclaration fiscale des traitements et salaires (ENSAP) ou bulletin de décembre : remboursements de frais");
  }

  if (r.domicile) {
    liste.push("Carte grise du véhicule (puissance et énergie)");
    liste.push("Plannings et historique de pointage chez les personnes aidées");
    liste.push("Itinéraires entre la maison et chaque personne aidée");
    if (r.domicile.indemnites > 0 || r.domicile.forfaitsTransport > 0) {
      liste.push("Bulletins ou récapitulatif annuel : indemnités kilométriques et forfaits de transport");
    }
  }

  const repas = r.repas;
  if (repas?.acces === "impossible" && t.site > 0) {
    if (repas.lieu === "gamelle") liste.push("Preuve de l'absence de cantine proche (attestation de l'employeur)");
    else liste.push("Tickets de caisse, relevés bancaires ou relevé de badge de cantine");
  }
  const second = repas?.acces === "domicile" ? repas.secondAllerRetour : undefined;
  if (second && !r.domicile && secondAllerRetourPossible(trajet) && joursRetenus(second, t.site) > 0) {
    liste.push(`${motifSecondAllerRetour(second.motif).pieces} (second aller-retour quotidien)`);
    liste.push("Votre justification écrite du second aller-retour (annexe du PDF), datée et signée");
  }
  if (repas?.titres) liste.push("Bulletins de paie : ligne des titres-restaurant");
  if (repas && repas.primePanier > 0) liste.push("Bulletins de paie : ligne de la prime de panier");

  const tt = r.teletravail;
  if (t.teletravail > 0) {
    liste.push("Attestation de télétravail de l'employeur (jours télétravaillés)");
    if (tt?.allocation) liste.push("Bulletins de paie : ligne de l'indemnité de télétravail");
    if (tt?.methode === "reel") {
      if (tt.usage !== "aucun") liste.push("Bail ou avis de taxe foncière, factures d'énergie et d'eau, avis d'assurance habitation, plan du logement");
      if (tt.communication > 0) liste.push("Factures internet et téléphone");
      if (tt.achats.length > 0 || tt.fournitures > 0) liste.push("Factures du matériel et des fournitures");
    }
  }

  const autres = r.autres;
  if (autres?.transport) liste.push("Attestation annuelle d'abonnement de transport et bulletin de décembre");
  for (const poste of POSTES) {
    if (!autres?.ouverts.includes(poste.id)) continue;
    if (poste.id === "bureauDomicile") {
      liste.push("Bail ou avis de taxe foncière, factures d'énergie et d'eau, assurance habitation, plan du logement avec la surface de la pièce de travail");
      liste.push("Attestation de l'employeur : aucun bureau fourni sur place");
    } else if (poste.id === "doubleResidence") {
      liste.push("Bail et quittances du second logement, justificatif du lieu de vie de la famille");
    } else if (poste.id === "cotisationSyndicale") {
      liste.push("Attestation de cotisation syndicale");
    } else {
      const libelle = poste.id === "autre" && autres.libelleAutre ? autres.libelleAutre : poste.libelleResume;
      liste.push(`Factures ou attestations : ${libelle}`);
    }
  }
  return liste;
}

// Ajout n° 1 — Trajets d'un couple : même voiture (règle de prudence), même lieu de travail,
// jours faits ensemble (seul le conducteur déduit), motif « emploi du conjoint » proposé automatiquement.
import { distanceRetenue } from "../moteur/calcul";
import { motifEmploiConjointPropose } from "../moteur/couple";
import { calculerDeclarant, type EntreeDeclarant, type EntreeVehicule } from "../moteur/declarant";
import { nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import { totaux } from "./calendrier";
import { memeLieuDeTravail, type LieuDeTravail } from "./couple";
import type { Profil } from "./profils";
import { estVehicule } from "./trajet";

export type Conducteur = "vous" | "conjoint" | "alternance";

export interface SaisieTrajetsCouple {
  /** Une seule voiture pour vous deux. */
  memeVoiture?: boolean;
  /** Réponse à « Travaillez-vous au même endroit que votre conjoint, ou tout près ? ». */
  memeLieu?: boolean;
  /** « separes » : toujours chacun sa voiture ; « ensemble » : parfois la route ensemble. */
  organisation?: "separes" | "ensemble";
  joursEnsembleParSemaine?: number;
  joursEnsemblePrudent?: boolean;
  conducteur?: Conducteur;
  conducteurPrudent?: boolean;
}

/** L'écran « Vos trajets à deux » concerne un couple dont les deux déclarants vont travailler avec un véhicule. */
export function trajetsCoupleApplicable(profils: Profil[]): boolean {
  if (profils.length < 2) return false;
  return profils.slice(0, 2).every((pr) => !pr.salaireSeulement && pr.metier !== "domicile" && pr.trajet && estVehicule(pr.trajet.mode));
}

/** Même lieu pressenti d'après les noms d'employeurs déjà saisis (plusieurs employeurs dans l'année). */
export function memeLieuPressenti(profils: Profil[]): boolean {
  const lieux = (pr: Profil): LieuDeTravail[] => (pr.salaire?.employeurs ?? []).map((e) => ({ employeur: e.nom }));
  return memeLieuDeTravail(lieux(profils[0]), lieux(profils[1]));
}

/** Profil à qui proposer le motif « emploi du conjoint » (au-delà du plafond, conjoint en deçà), ou null. */
export function motifConjointAProposer(p: Parametres, profils: Profil[]): number | null {
  const [a, b] = profils.map((pr) => pr.trajet);
  if (!a || !b || a.kmAnnuel !== undefined || b.kmAnnuel !== undefined) return null;
  if (!a.motifDistance && motifEmploiConjointPropose(p, a.allerKm, b.allerKm) && b.allerKm > 0) return 0;
  if (!b.motifDistance && motifEmploiConjointPropose(p, b.allerKm, a.allerKm) && a.allerKm > 0) return 1;
  return null;
}

/** Les deux trajets dépassent le plafond sans motif : chacun est ramené au plafond. */
export function deuxAuDelaDuPlafond(p: Parametres, profils: Profil[]): boolean {
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  return profils.slice(0, 2).every((pr) => pr.trajet && pr.trajet.allerKm > plafond && !pr.trajet.motifDistance);
}

/** Valeurs retenues : jours ensemble par semaine et conducteur (valeurs prudentes après « Je ne sais pas »). */
export function organisationRetenue(p: Parametres, profils: Profil[], s: SaisieTrajetsCouple): { joursParSemaine: number; conducteur: Conducteur } {
  const joursParSemaine = s.joursEnsemblePrudent || s.joursEnsembleParSemaine === undefined
    ? Number(p.valeurs_prudentes_je_ne_sais_pas.covoiturage_conjoints_jours_par_semaine)
    : s.joursEnsembleParSemaine;
  let conducteur = s.conducteur;
  if (s.conducteurPrudent || !conducteur) {
    // Prudence : le conjoint au plus long trajet conduit, l'autre perd ses km de ces jours-là.
    const [a, b] = profils.map((pr) => pr.trajet?.allerKm ?? 0);
    conducteur = a >= b ? "vous" : "conjoint";
  }
  return { joursParSemaine, conducteur };
}

/** Jours où chacun est passager de l'autre (aucun km, péage ni parking déduit ces jours-là). */
export function joursPassager(p: Parametres, profils: Profil[], s: SaisieTrajetsCouple): [number, number] {
  if (!s.memeLieu || s.organisation !== "ensemble") return [0, 0];
  const { joursParSemaine, conducteur } = organisationRetenue(p, profils, s);
  const ensemble = profils.slice(0, 2).map((pr) => {
    const site = totaux(pr.jours?.mois ?? []).site;
    const parSemaine = pr.jours?.joursParSemaine ?? 5;
    return Math.min(site, Math.round((site * joursParSemaine) / parSemaine));
  });
  if (conducteur === "vous") return [0, ensemble[1]];
  if (conducteur === "conjoint") return [ensemble[0], 0];
  // À tour de rôle : chacun passager la moitié des jours, arrondie vers le haut (prudence).
  return [Math.ceil(ensemble[0] / 2), Math.ceil(ensemble[1] / 2)];
}

const pluriel = (n: number, mot: string) => `${nombre(n)} ${mot}${n > 1 ? "s" : ""}`;

/** Retire les jours en passager du trajet d'un déclarant ; renvoie une alerte si le total de km a été saisi directement. */
function retirerJours(p: Parametres, v: EntreeVehicule, n: number): string | null {
  if (n <= 0) return null;
  if (v.kmForce !== undefined) {
    if (v.allerKm > 0) {
      v.kmForce = Math.max(0, v.kmForce - distanceRetenue(p, v.allerKm, Boolean(v.motifDistance)) * 2 * n);
      return null;
    }
    return `Vous avez indiqué un total de km : retirez-en vous-même les ${pluriel(n, "jour")} où vous êtes passager.`;
  }
  const site = v.trajetsEmployeurs?.length ? v.trajetsEmployeurs.reduce((s, t) => s + t.joursSurSite, 0) : v.joursSurSite;
  const ratio = site > 0 ? Math.max(0, site - n) / site : 0;
  if (v.trajetsEmployeurs?.length) {
    v.trajetsEmployeurs = v.trajetsEmployeurs.map((t) => ({ ...t, joursSurSite: Math.round(t.joursSurSite * ratio) }));
  } else {
    v.joursSurSite = Math.max(0, v.joursSurSite - n);
  }
  if (v.peagesParking) v.peagesParking = Math.round(v.peagesParking * ratio * 100) / 100;
  return null;
}

/**
 * Applique les réponses « Vos trajets à deux » aux entrées des deux déclarants : jours en passager retirés,
 * mêmes caractéristiques pour la voiture commune, km du conjoint pour la règle du véhicule partagé, phrases du résumé.
 */
export function appliquerTrajetsCouple(
  p: Parametres,
  profils: Profil[],
  s: SaisieTrajetsCouple | undefined,
  entrees: EntreeDeclarant[],
): { entrees: EntreeDeclarant[]; alertes: string[][] } {
  const alertes: string[][] = [[], []];
  if (!s || entrees.length < 2 || !trajetsCoupleApplicable(profils)) return { entrees, alertes };
  const [e0, e1] = entrees.map((e) => ({ ...e, vehicules: e.vehicules?.map((v) => ({ ...v })), motifs: [...(e.motifs ?? [])] }));
  const v0 = e0.vehicules?.[0];
  const v1 = e1.vehicules?.[0];
  if (!v0 || !v1) return { entrees, alertes };

  // Jours faits ensemble : seul le conducteur déduit.
  const passager = joursPassager(p, profils, s);
  if (passager[0] + passager[1] > 0) {
    const { joursParSemaine, conducteur } = organisationRetenue(p, profils, s);
    const frequence = `${pluriel(joursParSemaine, "jour")} par semaine en covoiturage avec mon conjoint`;
    [e0, e1].forEach((e, i) => {
      const v = i === 0 ? v0 : v1;
      const alerte = retirerJours(p, v, passager[i]);
      if (alerte) alertes[i].push(alerte);
      const moiConducteur = conducteur === "alternance" ? null : (conducteur === "vous") === (i === 0);
      e.motifs.push(
        conducteur === "alternance"
          ? `${frequence}, conduite à tour de rôle ; ${pluriel(passager[i], "jour")} où je suis passager retirés de mes trajets (km comptés une seule fois)`
          : moiConducteur
            ? `${frequence}, conducteur : moi ; km de ces jours comptés une seule fois`
            : `${frequence}, conducteur : mon conjoint ; ${pluriel(passager[i], "jour")} retirés de mes trajets (km comptés une seule fois)`,
      );
    });
  } else if (s.memeLieu && s.organisation === "separes" && !s.memeVoiture) {
    for (const e of [e0, e1]) e.motifs.push("même lieu de travail que mon conjoint : deux véhicules, trajets séparés confirmés");
  }

  // Voiture commune : mêmes caractéristiques, barème réparti selon la règle de prudence.
  if (s.memeVoiture) {
    Object.assign(v1, { type: v0.type, energie: v0.energie, cv: v0.cv, libellePuissance: v0.libellePuissance });
    const km = (e: EntreeDeclarant) => calculerDeclarant(p, e).kmVehicules[0] ?? 0;
    const [km0, km1] = [km(e0), km(e1)];
    if (km0 > 0 && km1 > 0) {
      v0.partageKmConjoint = km1;
      v1.partageKmConjoint = km0;
    }
  }
  return { entrees: [e0, e1, ...entrees.slice(2)], alertes };
}

/** Résumé de la relecture. */
export function resumeTrajetsCouple(p: Parametres, profils: Profil[], s: SaisieTrajetsCouple | undefined): string {
  if (!s || s.memeVoiture === undefined) return "À compléter";
  const morceaux = [s.memeVoiture ? "une seule voiture pour vous deux" : "chacun sa voiture"];
  if (!s.memeLieu) morceaux.push("lieux de travail différents");
  else if (s.organisation === "separes") morceaux.push("même lieu de travail, trajets séparés");
  else if (s.organisation === "ensemble") {
    const r = organisationRetenue(p, profils, s);
    const qui = r.conducteur === "alternance" ? "à tour de rôle" : r.conducteur === "vous" ? "vous conduisez" : "votre conjoint conduit";
    morceaux.push(`route ensemble ${pluriel(r.joursParSemaine, "jour")} par semaine, ${qui}`);
  } else morceaux.push("organisation à préciser");
  return morceaux.join(", ");
}

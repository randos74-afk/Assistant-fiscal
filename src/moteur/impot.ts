// F7.4 et F10 — Estimation de l'impôt du foyer (CGI art. 197) : barème par part, plafonnement
// du quotient familial, décote, seuil de mise en recouvrement. Hors réductions et crédits d'impôt.
import type { Parametres } from "./types";

export interface Foyer {
  couple: boolean;
  enfants: number;
  /** Case T : personne seule qui élève seule ses enfants. */
  parentIsole: boolean;
}

/** Parts de base (1 ou 2) et parts totales du foyer. */
export function partsFoyer(f: Foyer): { base: number; parts: number } {
  const base = f.couple ? 2 : 1;
  let demiParts = 0;
  for (let i = 0; i < f.enfants; i++) demiParts += i < 2 ? 1 : 2;
  if (f.parentIsole && !f.couple && f.enfants > 0) demiParts += 1;
  return { base, parts: base + demiParts / 2 };
}

function impotParPart(p: Parametres, quotient: number): number {
  let impot = 0;
  let bas = 0;
  for (const t of p.impot_revenu.tranches) {
    const haut = t.jusqua ?? Infinity;
    if (quotient > bas) impot += (Math.min(quotient, haut) - bas) * t.taux;
    bas = haut;
  }
  return impot;
}

export interface ResultatImpot {
  parts: number;
  impotBrut: number;
  plafonnement: boolean;
  decote: number;
  impot: number;
}

export function impotFoyer(p: Parametres, revenuImposable: number, f: Foyer): ResultatImpot {
  const ir = p.impot_revenu;
  const { base, parts } = partsFoyer(f);
  const revenu = Math.max(revenuImposable, 0);
  let impot = parts * impotParPart(p, revenu / parts);

  // Plafonnement : l'avantage des demi-parts supplémentaires ne peut dépasser le plafond légal.
  const demiParts = Math.round((parts - base) * 2);
  let plafonnement = false;
  if (demiParts > 0) {
    const sansDemiParts = base * impotParPart(p, revenu / base);
    const plafond =
      f.parentIsole && !f.couple
        ? ir.plafond_deux_premieres_demi_parts_parent_isole + ir.plafond_par_demi_part * Math.max(demiParts - 2, 0)
        : ir.plafond_par_demi_part * demiParts;
    if (sansDemiParts - plafond > impot) {
      impot = sansDemiParts - plafond;
      plafonnement = true;
    }
  }
  const impotBrut = impot;

  const decoteTheorique = (f.couple ? ir.decote_couple : ir.decote_personne_seule) - ir.decote_taux * impot;
  const decote = decoteTheorique > 0 ? Math.min(decoteTheorique, impot) : 0;
  impot -= decote;
  if (impot < ir.seuil_mise_en_recouvrement) impot = 0;

  return { parts, impotBrut, plafonnement, decote, impot };
}

export interface ComparaisonImpot {
  avecAbattement: ResultatImpot;
  avecFraisReels: ResultatImpot;
  /** Impôt en moins avec les frais réels (négatif s'ils coûtent plus cher). */
  gain: number;
}

/**
 * Compare l'impôt du foyer dans les deux hypothèses ; seuls les revenus du déclarant changent,
 * les autres revenus imposables du foyer s'ajoutent tels quels.
 */
export function comparerImpot(
  p: Parametres,
  baseAbattement: number,
  baseFraisReels: number,
  autresRevenusFoyer: number,
  f: Foyer,
): ComparaisonImpot {
  const avecAbattement = impotFoyer(p, baseAbattement + autresRevenusFoyer, f);
  const avecFraisReels = impotFoyer(p, baseFraisReels + autresRevenusFoyer, f);
  return { avecAbattement, avecFraisReels, gain: avecAbattement.impot - avecFraisReels.impot };
}

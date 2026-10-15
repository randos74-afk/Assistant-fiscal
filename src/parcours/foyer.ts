// F10 — Situation familiale, pour estimer l'impôt en euros (F7.4). Ne change jamais le montant déductible.
import { abattement } from "../moteur/calcul";
import type { Foyer } from "../moteur/impot";
import type { Parametres } from "../moteur/types";

export interface SaisieFoyer extends Foyer {
  /** Salaire net imposable du conjoint : l'abattement de 10 % lui est appliqué. */
  salaireConjoint: number;
  /** Autres revenus imposables du foyer, déjà nets (pensions après abattement, revenus fonciers…). */
  autresRevenus: number;
}

/** Revenus imposables du foyer hors déclarant : conjoint après abattement, plus les autres revenus. */
export function autresRevenusFoyer(p: Parametres, f: SaisieFoyer): number {
  const conjoint = f.couple && f.salaireConjoint > 0 ? f.salaireConjoint - abattement(p, f.salaireConjoint) : 0;
  return conjoint + f.autresRevenus;
}

// F5 — Télétravail aux frais réels (notice 2041 GP) et matériel amorti (F6.9).
// Fonctions pures ; tous les chiffres viennent des paramètres du millésime.
import type { Parametres } from "./types";
import { arrondiEuro, euros, nombre } from "./format";

export type UsageLocal = "dedie" | "mixte" | "aucun";

/** Part de la surface : bureau / logement, ou forfait studio des paramètres. */
export function partSurface(p: Parametres, surfaceBureau: number, surfaceTotale: number, studio = false): number {
  if (studio) return p.teletravail.studio_part_professionnelle;
  return surfaceTotale > 0 ? Math.min(surfaceBureau / surfaceTotale, 1) : 0;
}

/**
 * Part du temps : pièce réservée au travail = jours télétravaillés / jours travaillés ;
 * pièce aussi utilisée en privé = jours télétravaillés × heures retenues / heures de l'année.
 */
export function ratioTemps(p: Parametres, usage: UsageLocal, joursTeletravail: number, joursTravailles: number): number {
  if (usage === "aucun" || joursTeletravail <= 0) return 0;
  if (usage === "dedie") return joursTravailles > 0 ? Math.min(joursTeletravail / joursTravailles, 1) : 0;
  const t = p.teletravail;
  return Math.min((joursTeletravail * t.heures_par_journee_teletravail_local_mixte) / t.heures_par_an, 1);
}

export interface Achat {
  libelle: string;
  prixHT: number;
  /** Part d'usage professionnel, de 0 à 1 (jamais forfaitisée). */
  usagePro: number;
  anneeAchat: number;
  /** 1 = janvier … 12 = décembre. */
  moisAchat: number;
}

/**
 * Montant d'un achat pour une année de revenus : déduction l'année d'achat jusqu'au seuil,
 * sinon amortissement linéaire prorata temporis (mois), avec reliquat la dernière année.
 */
export function materielAnnee(p: Parametres, a: Achat, anneeRevenus: number): number {
  const m = p.materiel;
  if (a.prixHT <= m.seuil_deduction_immediate_HT) return anneeRevenus === a.anneeAchat ? a.prixHT * a.usagePro : 0;
  const duree = m.duree_amortissement_informatique_ans;
  const annuite = a.prixHT / duree;
  const moisAnnee1 = 12 - a.moisAchat + 1;
  const rang = anneeRevenus - a.anneeAchat;
  let part = 0;
  if (rang === 0) part = (annuite * moisAnnee1) / 12;
  else if (rang > 0 && rang < duree) part = annuite;
  else if (rang === duree) part = (annuite * (12 - moisAnnee1)) / 12;
  return part * a.usagePro;
}

export interface EntreeTeletravailReel {
  usage: UsageLocal;
  studio?: boolean;
  surfaceBureau: number;
  surfaceTotale: number;
  /** Charges annuelles du logement (loyer ou intérêts, énergie, eau, assurance, impôts locaux…). */
  chargesLogement: number;
  /** Dépenses propres au bureau (mise en conformité, diagnostic) : sans prorata de surface. */
  depensesBureau: number;
  /** Internet, ligne fixe, téléphone portable requis : usage mixte. */
  communication: number;
  fournitures: number;
  achats: Achat[];
  joursTeletravail: number;
  joursTravailles: number;
}

export interface ResultatTeletravailReel {
  local: number;
  communication: number;
  fournitures: number;
  materiel: number;
  total: number;
  formule: string;
}

export function teletravailReel(p: Parametres, e: EntreeTeletravailReel, anneeRevenus: number): ResultatTeletravailReel {
  const surface = e.usage === "aucun" ? 0 : partSurface(p, e.surfaceBureau, e.surfaceTotale, e.studio);
  const temps = ratioTemps(p, e.usage, e.joursTeletravail, e.joursTravailles);
  const local = e.chargesLogement * surface * temps + (e.usage === "aucun" ? 0 : e.depensesBureau * temps);
  // Internet et téléphone servent aussi à la vie privée : même règle que la pièce à usage mixte.
  const communication = e.communication * ratioTemps(p, "mixte", e.joursTeletravail, e.joursTravailles);
  const materiel = e.achats.reduce((s, a) => s + materielAnnee(p, a, anneeRevenus), 0);
  // Chaque partie est arrondie à l'euro inférieur et le total est leur somme :
  // le détail affiché tombe toujours juste (règle d'or n° 6).
  const total = [local, communication, e.fournitures, materiel].reduce((s, x) => s + arrondiEuro(x), 0);

  const morceaux: string[] = [];
  if (local > 0) {
    const s = e.studio ? "studio 50 %" : `${nombre(e.surfaceBureau)}/${nombre(e.surfaceTotale)} m²`;
    const t =
      e.usage === "dedie"
        ? `${nombre(e.joursTeletravail)}/${nombre(e.joursTravailles)} j`
        : `${nombre(e.joursTeletravail)} j x ${p.teletravail.heures_par_journee_teletravail_local_mixte} h/${nombre(p.teletravail.heures_par_an)} h`;
    morceaux.push(`local ${e.usage === "dedie" ? "réservé au travail" : "à usage mixte"} (${s}, ${t}) ${euros(local)}`);
  }
  if (communication > 0) morceaux.push(`internet et téléphone ${euros(communication)}`);
  if (e.fournitures > 0) morceaux.push(`fournitures ${euros(e.fournitures)}`);
  if (materiel > 0) morceaux.push(`matériel ${euros(materiel)}`);

  return {
    local,
    communication,
    fournitures: e.fournitures,
    materiel,
    total,
    formule: `frais réels : ${morceaux.join(", ")} = ${euros(total)}`,
  };
}

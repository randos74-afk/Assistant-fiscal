// Lecture des montants saisis : virgule ou point, espaces, symbole €.

/** « 23 456,78 € » → 23456.78 ; vide → null ; texte impossible → NaN. */
export function lireMontant(texte: string): number | null {
  const propre = texte.replace(/[\s\u00a0\u202f€]/g, "").replace(",", ".");
  if (propre === "") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(propre)) return NaN;
  return Number(propre);
}

/** Message d'erreur pour une saisie impossible, ou null si la saisie est utilisable ou vide. */
export function erreurMontant(texte: string): string | null {
  const m = lireMontant(texte);
  if (m === null) return null;
  if (Number.isNaN(m)) return "Écrivez seulement des chiffres, par exemple 23 456,78.";
  return null;
}

/** Affichage d'un montant saisi, à la française : 23456.78 → « 23 456,78 ». */
export function afficherMontant(x: number): string {
  return x
    .toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })
    .replace(/[\u202f\u00a0]/g, " ");
}

/** Nombre entier de jours : « 12 » → 12 ; vide → null ; autre → NaN. */
export function lireEntier(texte: string): number | null {
  const propre = texte.replace(/[\s\u00a0\u202f]/g, "");
  if (propre === "") return null;
  if (!/^\d+$/.test(propre)) return NaN;
  return Number(propre);
}

export function erreurEntier(texte: string): string | null {
  return Number.isNaN(lireEntier(texte)) ? "Écrivez un nombre entier, par exemple 12." : null;
}

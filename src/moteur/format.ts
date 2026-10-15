// Mise en forme des nombres à la française pour les formules affichées.
// Espace normale comme séparateur de milliers (texte brut copiable dans la déclaration).

export function nombre(x: number, decimales = 0): string {
  return x
    .toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    .replace(/[  ]/g, " ");
}

/** Coefficient du barème : 3 décimales, comme dans le dépliant DGFiP. */
export function coefficient(x: number): string {
  return nombre(x, 3);
}

/**
 * Arrondi à l'euro INFÉRIEUR (décision du 15/10/2026), comme les exemples du dépliant GP 120 :
 * 2 049,10 → 2 049 ; 2 460,50 → 2 460. La marge absorbe les imprécisions de calcul (560,4999…).
 */
export function arrondiEuro(x: number): number {
  return Math.floor(x + 1e-6);
}

export function euros(x: number): string {
  return `${nombre(arrondiEuro(x))} €`;
}

export function eurosCentimes(x: number): string {
  return `${nombre(x, 2)} €`;
}

/** Arrondi au centime, sans l'erreur classique 1,005 → 1,00. */
export function arrondiCentime(x: number): number {
  return Math.round((x + 1e-9) * 100) / 100;
}

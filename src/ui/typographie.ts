// Typographie française : espace insécable avant « ; : ! ? » et à l'intérieur des guillemets,
// pour qu'aucune ligne ne commence par un signe isolé.

const INSECABLE = "\u00a0";

export function typographie(texte: string): string {
  return texte
    .replace(/« /g, `«${INSECABLE}`)
    .replace(/ »/g, `${INSECABLE}»`)
    .replace(/ ([;:!?])/g, `${INSECABLE}$1`);
}

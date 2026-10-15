// Typographie française : espace insécable avant « ; : ! ? » et à l'intérieur des guillemets,
// pour qu'aucune ligne ne commence par un signe isolé, et nombres liés à leur unité.

const INSECABLE = "\u00a0";

export function typographie(texte: string): string {
  return texte
    .replace(/« /g, `«${INSECABLE}`)
    .replace(/ »/g, `${INSECABLE}»`)
    .replace(/ ([;:!?])/g, `${INSECABLE}$1`)
    // Nombres : « 8 967 » et « 3 CV » ne se coupent jamais en fin de ligne.
    .replace(/(\d) (?=\d{3}\b)/g, `$1${INSECABLE}`)
    .replace(/(\d) (?=(€|CV|km|j|jours|semaines|%)(?![\p{L}]))/gu, `$1${INSECABLE}`);
}

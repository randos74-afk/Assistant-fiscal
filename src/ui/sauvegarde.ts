// Sauvegarde locale de la simulation (F9) : uniquement sur l'appareil, jamais envoyée.
// Le stockage peut être indisponible (navigation privée) : chaque accès est protégé.

const CLE = "fraisfit.simulation";

export function existeSauvegarde(): boolean {
  try {
    return localStorage.getItem(CLE) !== null;
  } catch {
    return false;
  }
}

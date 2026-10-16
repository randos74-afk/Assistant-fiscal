// Ajout n° 1 — Mode foyer : détection d'un même lieu de travail pour les deux conjoints,
// qui déclenche l'avertissement sur les trajets faits ensemble.

/** Formes juridiques ignorées dans la comparaison des noms d'employeurs. */
const FORMES_JURIDIQUES = ["sas", "sasu", "sa", "sarl", "eurl", "snc", "scop", "sci", "selarl", "gie", "ei"];

/** « Dupont Industrie SAS » et « DUPONT INDUSTRIE » donnent « dupont industrie ». */
export function normaliserEmployeur(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((mot) => mot && !FORMES_JURIDIQUES.includes(mot))
    .join(" ");
}

export interface LieuDeTravail {
  employeur?: string;
  commune?: string;
  codePostal?: string;
}

const pareil = (a?: string, b?: string) => Boolean(a && b && normaliserEmployeur(a) && normaliserEmployeur(a) === normaliserEmployeur(b));

/** Même employeur, même commune ou même code postal, ou « oui » à la question directe. */
export function memeLieuDeTravail(a: LieuDeTravail[], b: LieuDeTravail[], reponseDirecte?: boolean): boolean {
  if (reponseDirecte) return true;
  return a.some((x) =>
    b.some((y) => pareil(x.employeur, y.employeur) || pareil(x.commune, y.commune) || Boolean(x.codePostal && x.codePostal.trim() === y.codePostal?.trim())),
  );
}

/** L'avertissement s'affiche si le couple travaille au même endroit et déclare deux voitures. */
export function avertirTrajetsCommuns(a: LieuDeTravail[], b: LieuDeTravail[], deuxVoitures: boolean, reponseDirecte?: boolean): boolean {
  return deuxVoitures && memeLieuDeTravail(a, b, reponseDirecte);
}

// Sauvegarde locale de la simulation (F9.3) : uniquement sur l'appareil, jamais envoyée.
// Un dossier par année de revenus. Le stockage peut être indisponible (navigation privée) :
// chaque accès est protégé et l'application fonctionne sans.
import type { SaisieAutresFrais } from "../parcours/autresFrais";
import type { SaisieFoyer } from "../parcours/foyer";
import type { Reponses as ReponsesFiltrage } from "../parcours/filtrage";
import type { IdProfil } from "../parcours/metiers";
import type { SaisieRepas } from "../parcours/repas";
import type { SaisieTeletravail } from "../parcours/teletravail";
import type { SaisieTrajet } from "../parcours/trajet";
import type { SaisieJours } from "./Jours";
import type { SaisieSalaire } from "./Salaire";

const VERSION = 1;
const PREFIXE = "fraisfit.simulation.";

export interface Dossier {
  application: "FraisFit";
  version: number;
  millesime: number;
  enregistreLe: string;
  ecran: string;
  reponsesFiltrage: ReponsesFiltrage;
  metier?: IdProfil;
  salaire?: SaisieSalaire;
  jours?: SaisieJours;
  trajet?: SaisieTrajet;
  repas?: SaisieRepas;
  teletravail?: SaisieTeletravail;
  autres?: SaisieAutresFrais;
  foyer?: SaisieFoyer;
}

export type ContenuDossier = Omit<Dossier, "application" | "version" | "enregistreLe">;

export function existeSauvegarde(millesime: number): boolean {
  try {
    return localStorage.getItem(PREFIXE + millesime) !== null;
  } catch {
    return false;
  }
}

export function enregistrer(contenu: ContenuDossier): void {
  const dossier: Dossier = { application: "FraisFit", version: VERSION, enregistreLe: new Date().toISOString(), ...contenu };
  try {
    localStorage.setItem(PREFIXE + contenu.millesime, JSON.stringify(dossier));
  } catch {
    // Stockage plein ou interdit : la simulation continue sans sauvegarde.
  }
}

export function charger(millesime: number): Dossier | null {
  try {
    const brut = localStorage.getItem(PREFIXE + millesime);
    return brut ? lireDossier(brut) : null;
  } catch {
    return null;
  }
}

export function effacer(millesime: number): void {
  try {
    localStorage.removeItem(PREFIXE + millesime);
  } catch {
    // Rien à effacer.
  }
}

/** Lit un dossier (stockage ou fichier importé) ; null s'il n'est pas reconnu. */
export function lireDossier(texte: string): Dossier | null {
  try {
    const d = JSON.parse(texte);
    if (d?.application !== "FraisFit" || typeof d.version !== "number" || d.version > VERSION) return null;
    if (typeof d.millesime !== "number" || typeof d.ecran !== "string") return null;
    return { reponsesFiltrage: {}, ...d } as Dossier;
  } catch {
    return null;
  }
}

/** F9.3 — Export en fichier JSON, enregistré par la personne sur son appareil. */
export function telechargerDossier(contenu: ContenuDossier): void {
  const dossier: Dossier = { application: "FraisFit", version: VERSION, enregistreLe: new Date().toISOString(), ...contenu };
  const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = `fraisfit-revenus-${contenu.millesime}.json`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
}

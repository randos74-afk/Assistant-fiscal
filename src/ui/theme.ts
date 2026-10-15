// Thème de l'interface : les couleurs viennent uniquement de design/tokens.json,
// appliquées en variables CSS (--marine, --primaire…). Clair par défaut, sombre au choix.
import tokens from "../../design/tokens.json";

export type Theme = "clair" | "sombre";

export function appliquerTheme(theme: Theme = "clair"): void {
  const racine = document.documentElement;
  for (const [nom, valeur] of Object.entries(tokens.couleurs[theme])) {
    racine.style.setProperty(`--${nom}`, valeur);
  }
  racine.style.setProperty("--rayon", `${tokens.formes.rayon}px`);
  racine.style.setProperty("--zone-tactile", `${tokens.formes["zone-tactile-min"]}px`);
  racine.style.setProperty("--hauteur-bouton", `${tokens.formes["hauteur-bouton-principal"]}px`);
  racine.style.setProperty("--hauteur-logo", `${tokens.formes["hauteur-logo-entete"]}px`);
  racine.style.setProperty("--taille-texte", `${tokens.tailles.texte}px`);
  racine.style.setProperty("--taille-texte-min", `${tokens.tailles["texte-min"]}px`);
  racine.style.setProperty("--taille-titre-ecran", `${tokens.tailles["titre-ecran"]}px`);
  racine.dataset.theme = theme;
}

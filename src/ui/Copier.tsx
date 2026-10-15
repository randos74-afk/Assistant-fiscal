// Bloc à copier (F8.8) : encadré bleu très clair, bouton « Copier », confirmation « Copié ».
import { useState } from "react";
import { typographie } from "./typographie";

async function copierTexte(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    // Repli pour les navigateurs sans presse-papiers asynchrone.
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    zone.style.position = "absolute";
    zone.style.left = "-9999px";
    document.body.appendChild(zone);
    zone.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(zone);
    return ok;
  }
}

export function BlocACopier({
  titre,
  texte,
  grand = false,
  pied,
}: {
  titre: string;
  texte: string;
  /** Montant affiché en grand (case 1AK) plutôt qu'un texte. */
  grand?: boolean;
  pied?: string;
}) {
  const [etat, setEtat] = useState<"attente" | "copie" | "echec">("attente");

  async function copier() {
    setEtat((await copierTexte(texte)) ? "copie" : "echec");
    setTimeout(() => setEtat("attente"), 2500);
  }

  return (
    <section className="bloc-copier">
      <div className="bloc-copier-entete">
        <h2>{titre}</h2>
        <button type="button" className="bouton-copier" onClick={copier}>
          {etat === "copie" ? "Copié" : "Copier"}
        </button>
      </div>
      {/* Affichage avec espaces insécables ; le texte copié garde des espaces ordinaires (texte brut). */}
      {grand ? (
        <p className="bloc-copier-montant montant">{typographie(texte)}</p>
      ) : (
        <pre className="bloc-copier-texte">{typographie(texte)}</pre>
      )}
      {pied && <p className="champ-detail">{pied}</p>}
      <p className="visuellement-cache" aria-live="polite">
        {etat === "copie" ? "Copié dans le presse-papiers" : etat === "echec" ? "La copie n'a pas fonctionné : sélectionnez le texte à la main." : ""}
      </p>
      {etat === "echec" && <p className="champ-erreur">La copie n'a pas fonctionné : sélectionnez le texte à la main.</p>}
    </section>
  );
}

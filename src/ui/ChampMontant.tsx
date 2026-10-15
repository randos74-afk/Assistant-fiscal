// Champ de montant : clavier numérique, virgule acceptée, symbole € dans le champ (docs/02 §7).
import { useId } from "react";
import { erreurMontant } from "../parcours/saisie";

interface Props {
  libelle: string;
  /** Libellé visible (sinon réservé aux lecteurs d'écran). */
  libelleVisible?: boolean;
  valeur: string;
  onChange: (texte: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
}

export function ChampMontant({ libelle, libelleVisible = false, valeur, onChange, autoFocus, compact }: Props) {
  const id = useId();
  const erreur = erreurMontant(valeur);

  return (
    <div className={compact ? "champ champ-compact" : "champ"}>
      <label htmlFor={id} className={libelleVisible ? "champ-libelle" : "visuellement-cache"}>
        {libelle}
      </label>
      <div className={erreur ? "champ-saisie champ-saisie-erreur" : "champ-saisie"}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valeur}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${id}-erreur` : undefined}
        />
        <span className="champ-unite" aria-hidden="true">
          €
        </span>
      </div>
      {erreur && (
        <p id={`${id}-erreur`} className="champ-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}

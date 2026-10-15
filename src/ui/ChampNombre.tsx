// Champ numérique : clavier numérique, virgule acceptée, unité dans le champ (docs/02 §7).
import { useId } from "react";
import { erreurEntier, erreurMontant } from "../parcours/saisie";

interface Props {
  libelle: string;
  /** Libellé visible (sinon réservé aux lecteurs d'écran). */
  libelleVisible?: boolean;
  valeur: string;
  onChange: (texte: string) => void;
  /** « € » pour un montant (centimes acceptés), sinon nombre entier (« jours »). */
  unite?: string;
  detail?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export function ChampNombre({ libelle, libelleVisible = false, valeur, onChange, unite = "€", detail, autoFocus, compact }: Props) {
  const id = useId();
  const estMontant = unite === "€";
  const erreur = estMontant ? erreurMontant(valeur) : erreurEntier(valeur);
  const decrit = [detail && `${id}-detail`, erreur && `${id}-erreur`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={compact ? "champ champ-compact" : "champ"}>
      <label htmlFor={id} className={libelleVisible ? "champ-libelle" : "visuellement-cache"}>
        {libelle}
      </label>
      {detail && (
        <p id={`${id}-detail`} className="champ-detail">
          {detail}
        </p>
      )}
      <div className={erreur ? "champ-saisie champ-saisie-erreur" : "champ-saisie"}>
        <input
          id={id}
          type="text"
          inputMode={estMontant ? "decimal" : "numeric"}
          autoComplete="off"
          value={valeur}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit}
        />
        <span className="champ-unite" aria-hidden="true">
          {unite}
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

/** Montant en euros. */
export function ChampMontant(props: Omit<Props, "unite">) {
  return <ChampNombre {...props} unite="€" />;
}

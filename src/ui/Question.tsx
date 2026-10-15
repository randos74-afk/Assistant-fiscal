// Briques communes aux écrans de question (maquette design/maquettes/02-question-puissance.html).
import type { ReactNode } from "react";

export function EnTeteEtape({
  libelle,
  etape,
  total,
  onRetour,
}: {
  libelle: string;
  etape: number;
  total: number;
  onRetour: () => void;
}) {
  return (
    <header className="entete-etape">
      <div className="entete-etape-ligne">
        <button type="button" className="bouton-retour" aria-label="Retour" onClick={onRetour}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="entete-etape-libelle">{libelle}</div>
        <div style={{ width: 34 }} />
      </div>
      <div
        className="barre-progression"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={etape}
        aria-label={libelle}
      >
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={i < etape ? "segment segment-fait" : "segment"} />
        ))}
      </div>
    </header>
  );
}

export function ChoixUnique({
  nom,
  legende,
  options,
  valeur,
  onChoix,
}: {
  nom: string;
  legende: string;
  options: { valeur: string; libelle: string }[];
  valeur: string | undefined;
  onChoix: (valeur: string) => void;
}) {
  return (
    <fieldset className="choix">
      <legend className="visuellement-cache">{legende}</legend>
      {options.map((o) => (
        <label key={o.valeur} className={o.valeur === valeur ? "choix-option choix-option-coche" : "choix-option"}>
          <input type="radio" name={nom} value={o.valeur} checked={o.valeur === valeur} onChange={() => onChoix(o.valeur)} />
          {o.libelle}
        </label>
      ))}
    </fieldset>
  );
}

/** Encadré d'information (gris) ou d'attention douce (orange). */
export function Encadre({ ton = "info", children }: { ton?: "info" | "attention"; children: ReactNode }) {
  return (
    <div className={`encadre encadre-${ton}`} role={ton === "attention" ? "status" : undefined}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export function BandeauConfidentialite() {
  return (
    <div className="bandeau-confidentialite">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      Vos chiffres restent sur votre téléphone
    </div>
  );
}

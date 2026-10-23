// En-tête et pied de page communs à tous les écrans.
import type { ReactNode } from "react";
import logo from "../../design/logo/logo-symbole-entrelace.png";
import type { BadgeFraicheur } from "../parcours/fraicheur";

export function EnTete({ badge }: { badge: BadgeFraicheur }) {
  return (
    <header className="entete">
      <div className="entete-logo">
        <img src={logo} alt="" />
        <div>
          <div className="entete-nom">FRAISFIT</div>
          <div className="entete-sous-titre">frais professionnels</div>
        </div>
      </div>
      <div className={`pastille pastille-fraicheur pastille-${badge.couleur}`}>
        <span>{badge.ligne1}</span>
        <small>{badge.ligne2}</small>
      </div>
    </header>
  );
}

/** Bas d'écran : actions, bouton « Précédent » éventuel, puis mention d'indépendance (règle d'or n° 8). */
export function PiedDePage({ children, onPrecedent }: { children?: ReactNode; onPrecedent?: () => void }) {
  return (
    <footer className="pied">
      {children}
      {onPrecedent && (
        <button type="button" className="bouton bouton-secondaire" onClick={onPrecedent}>
          ‹ Précédent
        </button>
      )}
      <p className="mention-independance">
        Application indépendante, non affiliée à l'administration fiscale.{" "}
        <a className="lien" href="#conditions">
          Conditions et limites d'usage
        </a>
      </p>
    </footer>
  );
}

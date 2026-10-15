// En-tête et pied de page communs à tous les écrans.
import type { ReactNode } from "react";
import logo from "../../design/logo/logo-symbole-entrelace.png";

export function EnTete({ millesime }: { millesime: number }) {
  return (
    <header className="entete">
      <div className="entete-logo">
        <img src={logo} alt="" />
        <div>
          <div className="entete-nom">FRAISFIT</div>
          <div className="entete-sous-titre">frais professionnels</div>
        </div>
      </div>
      <div className="pastille">Revenus {millesime}</div>
    </header>
  );
}

/** Bas d'écran : actions puis mention d'indépendance, toujours présente (règle d'or n° 8). */
export function PiedDePage({ children }: { children?: ReactNode }) {
  return (
    <footer className="pied">
      {children}
      <p className="mention-independance">Application indépendante, non affiliée à l'administration fiscale.</p>
    </footer>
  );
}

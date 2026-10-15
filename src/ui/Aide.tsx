// Règle des trois niveaux (docs/02 §4) : astérisque ambre, fiche « Où trouver ce chiffre ? », « Je ne sais pas ».
import { useEffect, useRef } from "react";
import type { FicheAide as Fiche, IdIllustration } from "../parcours/fichesAide";
import { CarteGriseEnergie, CarteGrisePuissance, Itineraire } from "./illustrations/CarteGrise";
import {
  AvenantTeletravail,
  BulletinAllocationTeletravail,
  BulletinCompteurs,
  BulletinNetImposable,
  BulletinTitres,
  ReleveRepas,
} from "./illustrations/DocumentExemple";
import { typographie } from "./typographie";

const ILLUSTRATIONS: Record<IdIllustration, (props: { texteAlternatif: string }) => JSX.Element> = {
  "bulletin-net-imposable": BulletinNetImposable,
  "bulletin-compteurs": BulletinCompteurs,
  "avenant-teletravail": AvenantTeletravail,
  "carte-grise-puissance": CarteGrisePuissance,
  "carte-grise-energie": CarteGriseEnergie,
  itineraire: Itineraire,
  "bulletin-titres": BulletinTitres,
  "releve-repas": ReleveRepas,
  "bulletin-allocation-teletravail": BulletinAllocationTeletravail,
};

export function BoutonAsterisque({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="bouton-asterisque" aria-label="Aide : où trouver ce chiffre" onClick={onClick}>
      *
    </button>
  );
}

/** Volet bas sur téléphone, fenêtre centrée sur grand écran. */
export function FicheAide({ fiche, ouverte, onFermer }: { fiche: Fiche; ouverte: boolean; onFermer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);

  const Illustration = ILLUSTRATIONS[fiche.illustration];

  return (
    <dialog
      ref={ref}
      className="fiche-aide"
      aria-labelledby="fiche-aide-titre"
      onClose={onFermer}
      onClick={(e) => e.target === ref.current && onFermer()}
    >
      <div className="fiche-aide-contenu">
        <div className="fiche-aide-poignee" aria-hidden="true" />
        <div className="fiche-aide-entete">
          <div className="fiche-aide-titre">
            <span className="asterisque asterisque-grand" aria-hidden="true">
              *
            </span>
            <h2 id="fiche-aide-titre">{fiche.titre}</h2>
          </div>
          <button type="button" className="bouton-fermer" aria-label="Fermer" onClick={onFermer}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <Illustration texteAlternatif={fiche.texteAlternatif} />

        <div className="fiche-aide-rubriques">
          <div>
            <h3>Où regarder</h3>
            <p>{typographie(fiche.ouRegarder)}</p>
          </div>
          <div>
            <h3>Mots à chercher</h3>
            <p>{typographie(fiche.motsAChercher.map((m) => `« ${m} »`).join(", "))}</p>
          </div>
          <div>
            <h3>Si vous ne trouvez pas</h3>
            <p>{typographie(fiche.siIntrouvable)}</p>
          </div>
        </div>

        <button type="button" className="bouton bouton-principal" onClick={onFermer}>
          J'ai trouvé
        </button>
      </div>
    </dialog>
  );
}

export function LienJeNeSaisPas({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="lien-je-ne-sais-pas" onClick={onClick}>
      Je ne sais pas
    </button>
  );
}

// Écran d'accueil (docs/02 §3, maquette design/maquettes/01-accueil.html).
import { useState } from "react";
import { EnTete, PiedDePage } from "./Cadre";
import { lireDossier, type Dossier } from "./sauvegarde";

const traitIcone = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const documents = [
  {
    titre: "Bulletin de paie de décembre",
    usage: "pour votre salaire de l'année",
    icone: (
      <svg {...traitIcone}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    titre: "Carte grise",
    usage: "pour les chevaux de votre véhicule",
    icone: (
      <svg {...traitIcone}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 10h5M7 14h3" />
        <circle cx="16" cy="12" r="2" />
      </svg>
    ),
  },
  {
    titre: "Dernier avis d'imposition",
    usage: "facultatif, pour estimer l'impôt",
    icone: (
      <svg {...traitIcone}>
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
    ),
  },
];

const iconeGarantie = { ...traitIcone, width: 20, height: 20, strokeWidth: 2 };

const garanties = [
  {
    texte: "Vos chiffres restent sur votre téléphone",
    icone: (
      <span className="garantie-icone">
        <svg {...iconeGarantie}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
    ),
  },
  {
    texte: "Une aide en image à chaque question",
    icone: (
      <span className="asterisque" aria-hidden="true">
        *
      </span>
    ),
  },
  {
    texte: "Un texte prêt à coller pour la case 1AK",
    icone: (
      <span className="garantie-icone">
        <svg {...iconeGarantie}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    ),
  },
];

interface Props {
  millesime: number;
  millesimesDisponibles: number[];
  sauvegardeDisponible: boolean;
  onCommencer: () => void;
  onReprendre: () => void;
  onOuvrirDossier: (d: Dossier) => void;
}

export function Accueil({ millesime, millesimesDisponibles, sauvegardeDisponible, onCommencer, onReprendre, onOuvrirDossier }: Props) {
  const [erreurFichier, setErreurFichier] = useState<string | null>(null);

  async function ouvrirFichier(fichier: File | undefined) {
    if (!fichier) return;
    const d = lireDossier(await fichier.text());
    if (!d) return setErreurFichier("Ce fichier n'est pas une simulation FraisFit.");
    if (!millesimesDisponibles.includes(d.millesime)) {
      return setErreurFichier(`Cette simulation concerne les revenus ${d.millesime}, que cette version ne connaît pas.`);
    }
    setErreurFichier(null);
    onOuvrirDossier(d);
  }

  return (
    <div className="ecran">
      <EnTete millesime={millesime} />

      <main className="ecran-contenu">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1 className="titre-ecran">Frais réels ou abattement de 10&nbsp;%&nbsp;?</h1>
          <p className="texte-secondaire">
            En 15 minutes, sachez si vous pouvez payer moins d'impôt. On vous guide à chaque question.
          </p>
        </div>

        <section className="carte" aria-labelledby="titre-documents">
          <h2 id="titre-documents">Préparez ces 3 documents</h2>
          <ul className="liste-simple">
            {documents.map((d) => (
              <li key={d.titre} className="document">
                <span className="document-icone">{d.icone}</span>
                <span>
                  <strong>{d.titre}</strong>
                  <small>{d.usage}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <ul className="liste-simple" style={{ gap: 10 }}>
          {garanties.map((g) => (
            <li key={g.texte} className="garantie">
              {g.icone}
              <span>{g.texte}</span>
            </li>
          ))}
        </ul>
      </main>

      <PiedDePage>
        <button type="button" className="bouton bouton-principal" onClick={onCommencer}>
          Commencer
        </button>
        {sauvegardeDisponible && (
          <button type="button" className="bouton bouton-secondaire" onClick={onReprendre}>
            Reprendre ma simulation
          </button>
        )}
        <label className="lien-je-ne-sais-pas lien-fichier">
          Ouvrir une simulation enregistrée
          <input
            type="file"
            accept="application/json,.json"
            className="visuellement-cache"
            onChange={(e) => ouvrirFichier(e.target.files?.[0])}
          />
        </label>
        {erreurFichier && <p className="champ-erreur">{erreurFichier}</p>}
      </PiedDePage>
    </div>
  );
}

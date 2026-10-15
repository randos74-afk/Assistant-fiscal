// Étape 1 : votre salaire (F1.4, docs/02 §3 et §4).
// Seule donnée sans valeur par défaut : « Je ne sais pas » propose d'additionner les 12 bulletins.
import { useState } from "react";
import { libelleEtape } from "../parcours/etapes";
import { FICHES } from "../parcours/fichesAide";
import { afficherMontant, lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant } from "./ChampMontant";
import { typographie } from "./typographie";
import { BandeauConfidentialite, Encadre, EnTeteEtape } from "./Question";

export interface SaisieSalaire {
  montant: number;
  source: "bulletin-decembre" | "addition-bulletins";
  /** Détail des 12 mois quand la personne les a additionnés. */
  mois?: string[];
}

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface Props {
  millesime: number;
  valeurInitiale?: SaisieSalaire;
  onValider: (salaire: SaisieSalaire) => void;
  onRetour: () => void;
}

export function Salaire({ millesime, valeurInitiale, onValider, onRetour }: Props) {
  const [texte, setTexte] = useState(
    valeurInitiale?.source === "bulletin-decembre" ? afficherMontant(valeurInitiale.montant) : "",
  );
  const [modeAddition, setModeAddition] = useState(valeurInitiale?.source === "addition-bulletins");
  const [mois, setMois] = useState<string[]>(valeurInitiale?.mois ?? Array(12).fill(""));
  const [aideOuverte, setAideOuverte] = useState(false);

  const etape = libelleEtape("votre salaire");
  const titre = typographie(`Combien avez-vous gagné en ${millesime} ?`);

  const valeursMois = mois.map(lireMontant);
  const totalMois = valeursMois.reduce<number>((s, m) => s + (m && !Number.isNaN(m) ? m : 0), 0);
  const moisInvalides = valeursMois.some((m) => m !== null && Number.isNaN(m));

  const montant = modeAddition ? totalMois : lireMontant(texte);
  const valide = montant !== null && !Number.isNaN(montant) && montant > 0 && !(modeAddition && moisInvalides);

  function valider() {
    if (!valide || montant === null) return;
    onValider(
      modeAddition ? { montant, source: "addition-bulletins", mois } : { montant, source: "bulletin-decembre" },
    );
  }

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <div className="question-titre">
          <h1 className="titre-question">{titre}</h1>
          <BoutonAsterisque onClick={() => setAideOuverte(true)} />
        </div>
        <p className="texte-secondaire sous-question">
          {typographie("Le chiffre est sur votre bulletin de paie de décembre : le net imposable, cumulé sur l'année.")}
        </p>

        {!modeAddition ? (
          <>
            <ChampMontant libelle={titre} valeur={texte} onChange={setTexte} />
            <LienJeNeSaisPas onClick={() => setModeAddition(true)} />
          </>
        ) : (
          <section className="carte" aria-labelledby="titre-addition">
            <h2 id="titre-addition">Additionnons vos 12 bulletins</h2>
            <p style={{ margin: 0, fontSize: "var(--taille-texte-min)" }}>
              Recopiez le net imposable de chaque mois. Laissez vide un mois sans salaire.
            </p>
            <div className="grille-mois">
              {MOIS.map((nom, i) => (
                <ChampMontant
                  key={nom}
                  compact
                  libelleVisible
                  libelle={nom}
                  valeur={mois[i]}
                  onChange={(t) => setMois(mois.map((m, j) => (j === i ? t : m)))}
                />
              ))}
            </div>
            <p className="total-addition">
              Total de l'année : <strong className="montant">{afficherMontant(totalMois)} €</strong>
            </p>
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => setModeAddition(false)}>
              J'ai finalement le montant de l'année
            </button>
          </section>
        )}

        <details className="depliant">
          <summary>Vous êtes apprenti ou étudiant ?</summary>
          <p>
            Une partie de votre salaire peut être exonérée d'impôt. Indiquez seulement la part imposable, celle de votre
            bulletin. Les frais réels ne vous aideront que si cette part reste importante.
          </p>
        </details>

        {montant !== null && !Number.isNaN(montant) && montant === 0 && (
          <Encadre ton="attention">Sans salaire imposable, les frais réels ne peuvent rien déduire.</Encadre>
        )}
      </main>

      <PiedDePage>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" disabled={!valide} onClick={valider}>
          Continuer
        </button>
      </PiedDePage>

      <FicheAide fiche={FICHES.salaire} ouverte={aideOuverte} onFermer={() => setAideOuverte(false)} />
    </div>
  );
}

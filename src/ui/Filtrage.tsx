// Écran de filtrage : cinq questions, une par écran, puis accès au parcours ou message d'exclusion.
import { useState } from "react";
import {
  evaluerFiltrage,
  libelleQuestion,
  precisionReponse,
  QUESTIONS_FILTRAGE,
  type Exclusion,
  type Reponses,
} from "../parcours/filtrage";
import { PiedDePage } from "./Cadre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";

interface Props {
  millesime: number;
  reponsesInitiales?: Reponses;
  indiceInitial?: number;
  onAccepte: (aussiEntreprise: boolean, reponses: Reponses) => void;
  onAccueil: () => void;
}

export function Filtrage({ millesime, reponsesInitiales = {}, indiceInitial = 0, onAccepte, onAccueil }: Props) {
  const [indice, setIndice] = useState(indiceInitial);
  const [reponses, setReponses] = useState<Reponses>(reponsesInitiales);
  const [exclusion, setExclusion] = useState<Exclusion | null>(null);

  const total = QUESTIONS_FILTRAGE.length;
  const q = QUESTIONS_FILTRAGE[indice];
  const reponse = reponses[q.id];
  const precision = precisionReponse(q.id, reponse);

  function continuer() {
    // On ne juge que les réponses jusqu'à la question affichée, puis on avance d'une question,
    // même si la suite a déjà été répondue (retour en arrière pour corriger).
    const jusquIci: Reponses = {};
    for (const x of QUESTIONS_FILTRAGE.slice(0, indice + 1)) jusquIci[x.id] = reponses[x.id];
    const partiel = evaluerFiltrage(jusquIci);
    if (partiel.statut === "exclu") return setExclusion(partiel.exclusion);
    if (indice < total - 1) return setIndice(indice + 1);
    const resultat = evaluerFiltrage(reponses);
    if (resultat.statut === "accepte") onAccepte(resultat.aussiEntreprise, reponses);
  }

  function retour() {
    if (indice === 0) onAccueil();
    else setIndice(indice - 1);
  }

  if (exclusion) {
    return <EcranExclusion exclusion={exclusion} onModifier={() => setExclusion(null)} onAccueil={onAccueil} />;
  }

  return (
    <div className="ecran">
      <EnTeteEtape libelle={`Vérification : question ${indice + 1} sur ${total}`} etape={indice + 1} total={total} onRetour={retour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">{libelleQuestion(q, millesime)}</h1>
        {q.precision && <p className="texte-secondaire sous-question">{q.precision}</p>}

        <ChoixUnique
          key={q.id}
          nom={q.id}
          legende={libelleQuestion(q, millesime)}
          options={q.options}
          valeur={reponse}
          onChoix={(v) => setReponses({ ...reponses, [q.id]: v })}
        />

        {precision && <Encadre>{precision}</Encadre>}
      </main>

      <PiedDePage>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" disabled={reponse === undefined} onClick={continuer}>
          Continuer
        </button>
      </PiedDePage>
    </div>
  );
}

export function EcranExclusion({
  exclusion,
  onModifier,
  onAccueil,
}: {
  exclusion: Exclusion;
  onModifier: () => void;
  onAccueil: () => void;
}) {
  return (
    <div className="ecran">
      <EnTeteEtape libelle="Vérification terminée" etape={1} total={1} onRetour={onModifier} />

      <main className="ecran-contenu">
        <h1 className="titre-question">FraisFit ne convient pas à votre situation</h1>
        <p style={{ margin: 0 }}>{exclusion.raison}</p>
        <Encadre>{exclusion.conseil}</Encadre>
        <p className="texte-secondaire">
          Si vous venez d'acheter FraisFit, vous pouvez demander son remboursement sur Google Play.
        </p>
      </main>

      <PiedDePage>
        <button type="button" className="bouton bouton-principal" onClick={onModifier}>
          Modifier ma réponse
        </button>
        <button type="button" className="bouton bouton-secondaire" onClick={onAccueil}>
          Revenir à l'accueil
        </button>
      </PiedDePage>
    </div>
  );
}

// F14 — Questions propres au métier (soignant), posées juste après le choix du métier.
// Elles ne changent aucune règle de calcul : elles orientent les étapes et affichent des conseils.
import { useState } from "react";
import { ETAPES } from "../parcours/etapes";
import type { QuestionsMetier as Reponses } from "../parcours/metiers";
import { PiedDePage } from "./Cadre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

const OUI_NON = [
  { valeur: "non", libelle: "Non" },
  { valeur: "oui", libelle: "Oui" },
];
const lire = (v: boolean | undefined) => (v === undefined ? undefined : v ? "oui" : "non");

export function QuestionsSoignant({ valeurInitiale: v, onValider, onRetour }: { valeurInitiale?: Reponses; onValider: (q: Reponses) => void; onRetour: () => void }) {
  const [lavage, setLavage] = useState(v?.lavageTenues);
  const [nuit, setNuit] = useState(v?.nuit12h);
  const [domicile, setDomicile] = useState(v?.soinsDomicile);
  const complet = lavage !== undefined && nuit !== undefined && domicile !== undefined;

  const question = (titre: string, nom: string, valeur: boolean | undefined, choix: (b: boolean) => void, detail?: string) => (
    <section className="carte" aria-labelledby={`q-${nom}`}>
      <h2 id={`q-${nom}`}>{typographie(titre)}</h2>
      {detail && <p className="detail-calcul">{typographie(detail)}</p>}
      <ChoixUnique nom={nom} legende={titre} options={OUI_NON} valeur={lire(valeur)} onChoix={(x) => choix(x === "oui")} />
    </section>
  );

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Avant de commencer : votre métier" etape={0} total={ETAPES.length} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">Trois questions sur votre poste</h1>
        <p className="texte-secondaire sous-question">{typographie("Elles adaptent les questions suivantes. Les règles de calcul restent les mêmes pour tous.")}</p>

        {question("Votre employeur lave-t-il vos tenues ?", "lavage", lavage, setLavage, "Si oui, seul leur achat compte, pas l'entretien.")}
        {question("Travaillez-vous de nuit ou en 12 h ?", "nuit", nuit, setNuit)}
        {question(
          "Faites-vous des soins à domicile (SSIAD, HAD) ?",
          "domicile",
          domicile,
          setDomicile,
          "Si oui, vous indiquerez le total de vos kilomètres de l'année, tournées comprises.",
        )}

        <Encadre>
          {typographie(
            "Infirmier libéral ? Vos frais se déduisent de vos recettes, pas en case 1AK. FraisFit ne concerne que votre activité salariée.",
          )}
        </Encadre>
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={!complet}
          onClick={() => onValider({ lavageTenues: lavage, nuit12h: nuit, soinsDomicile: domicile })}
        >
          Continuer
        </button>
      </PiedDePage>
    </div>
  );
}

/** Conseils du métier, en tête de la première question d'une étape. */
export function ConseilsMetier({ conseils }: { conseils?: string[] }) {
  if (!conseils?.length) return null;
  return (
    <>
      {conseils.map((c) => (
        <Encadre key={c}>{typographie(c)}</Encadre>
      ))}
    </>
  );
}

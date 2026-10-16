// F14 — Questions propres au métier (soignant), posées juste après le choix du métier.
// Elles ne changent aucune règle de calcul : elles orientent les étapes et affichent des conseils.
import { useState } from "react";
import { lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide } from "./Aide";
import { ChampMontant } from "./ChampNombre";
import { FICHES } from "../parcours/fichesAide";
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

/** F14 — Enseignant : remplaçant, remboursements de frais (montant obligatoire), mutation, travail à la maison. */
export function QuestionsEnseignant({ valeurInitiale: v, onValider, onRetour }: { valeurInitiale?: Reponses; onValider: (q: Reponses) => void; onRetour: () => void }) {
  const [remplacant, setRemplacant] = useState(v?.remplacant);
  const [rembourse, setRembourse] = useState<boolean | undefined>(v?.remboursementsFrais !== undefined ? v.remboursementsFrais > 0 : undefined);
  const [montant, setMontant] = useState(v?.remboursementsFrais ? String(v.remboursementsFrais) : "");
  const [mute, setMute] = useState(v?.mute);
  const [maison, setMaison] = useState(v?.travailMaison);
  const [aide, setAide] = useState(false);
  const m = lireMontant(montant);
  const montantValide = rembourse === false || (rembourse === true && m !== null && !Number.isNaN(m) && m > 0);
  const complet = remplacant !== undefined && mute !== undefined && maison !== undefined && montantValide;

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
        <h1 className="titre-question">Quelques questions sur votre poste</h1>
        <p className="texte-secondaire sous-question">{typographie("Elles adaptent les questions suivantes. Les règles de calcul restent les mêmes pour tous.")}</p>

        {question(
          "Êtes-vous remplaçant (TZR, brigade) ou sur plusieurs établissements ?",
          "remplacant",
          remplacant,
          setRemplacant,
          "Si oui, vous indiquerez chaque établissement avec sa distance et ses jours.",
        )}

        <section className="carte" aria-labelledby="q-remboursements">
          <div className="question-titre" style={{ alignItems: "center" }}>
            <h2 id="q-remboursements" style={{ flex: 1 }}>
              {typographie("Avez-vous reçu des remboursements de frais (ISSR, forfait mobilités durables…) ?")}
            </h2>
            <BoutonAsterisque onClick={() => setAide(true)} />
          </div>
          <p className="detail-calcul">{typographie("Avec les frais réels, ils s'ajoutent à votre salaire. Ils figurent sur votre déclaration fiscale de l'ENSAP.")}</p>
          <ChoixUnique nom="remboursements" legende="Remboursements de frais" options={OUI_NON} valeur={lire(rembourse)} onChoix={(x) => setRembourse(x === "oui")} />
          {rembourse && <ChampMontant compact libelleVisible libelle="Montant de l'année" valeur={montant} onChange={setMontant} />}
        </section>

        {question("Avez-vous été muté cette année ?", "mute", mute, setMute, "Dans l'intérêt du service ou par avancement : déménagement et double résidence.")}
        {question("Travaillez-vous chez vous (préparations, corrections) ?", "maison", maison, setMaison)}
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={!complet}
          onClick={() =>
            onValider({ remplacant, mute, travailMaison: maison, remboursementsFrais: rembourse && m !== null && !Number.isNaN(m) ? m : 0 })
          }
        >
          Continuer
        </button>
      </PiedDePage>
      {aide && <FicheAide fiche={FICHES.remboursementsEnseignant} ouverte onFermer={() => setAide(false)} />}
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

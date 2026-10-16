// Ajout n° 1 — Mode foyer : question d'entrée « seul ou en couple », passage au profil du conjoint,
// et sélecteur de profil affiché en haut des écrans.
import { useId, useState } from "react";
import { ETAPES } from "../parcours/etapes";
import { nomProfil, type ModeDeclaration, type Profil } from "../parcours/profils";
import { PiedDePage } from "./Cadre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

export function ChoixDeclaration({
  valeurInitiale,
  onChoix,
  onRetour,
}: {
  valeurInitiale?: ModeDeclaration;
  onChoix: (mode: ModeDeclaration) => void;
  onRetour: () => void;
}) {
  const [choix, setChoix] = useState<ModeDeclaration | undefined>(valeurInitiale);
  const titre = "Vous déclarez seul ou en couple ?";

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Avant de commencer : votre déclaration" etape={0} total={ETAPES.length} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">{titre}</h1>
        <p className="texte-secondaire sous-question">
          {typographie("En couple, chacun choisit seul entre l'abattement de 10 % et les frais réels. Nous cherchons la meilleure combinaison pour votre foyer.")}
        </p>

        <ChoixUnique
          nom="declaration"
          legende={titre}
          options={[
            { valeur: "seul", libelle: "Seul", detail: "Célibataire, divorcé, séparé, veuf, ou en concubinage." },
            { valeur: "couple", libelle: "En couple, marié ou pacsé", detail: "Une seule déclaration pour vous deux." },
          ]}
          valeur={choix}
          onChoix={(v) => setChoix(v as ModeDeclaration)}
        />

        {choix === "seul" && (
          <Encadre>
            {typographie("Vous vivez en couple sans être mariés ni pacsés ? Chacun fait sa propre déclaration : faites une simulation chacun.")}
          </Encadre>
        )}
        {choix === "couple" && (
          <Encadre>
            {typographie("Vous répondrez d'abord pour vous, puis pour votre conjoint. Tout reste sur ce téléphone.")}
          </Encadre>
        )}
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" disabled={!choix} onClick={() => choix && onChoix(choix)}>
          Continuer
        </button>
      </PiedDePage>
    </div>
  );
}

type Examen = "complet" | "salaire";

/** Passage au profil du conjoint : prénom facultatif, puis parcours complet ou salaire seul. */
export function PassageConjoint({
  valeurInitiale,
  onValider,
  onRetour,
}: {
  valeurInitiale?: Profil;
  onValider: (prenom: string, salaireSeulement: boolean) => void;
  onRetour: () => void;
}) {
  const id = useId();
  const [prenom, setPrenom] = useState(valeurInitiale?.prenom ?? "");
  const [examen, setExamen] = useState<Examen | undefined>(
    valeurInitiale?.salaireSeulement ? "salaire" : valeurInitiale?.salaire ? "complet" : undefined,
  );
  const titre = "À votre conjoint maintenant";

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Votre conjoint" etape={0} total={ETAPES.length} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">{titre}</h1>
        <p className="texte-secondaire sous-question">{typographie("Vos réponses sont enregistrées. Les mêmes questions vont être posées pour votre conjoint.")}</p>

        <div className="champ champ-compact">
          <label htmlFor={id} className="champ-libelle">
            Son prénom (facultatif)
          </label>
          <p className="champ-detail">{typographie("Seulement pour l'affichage. Il reste sur ce téléphone.")}</p>
          <div className="champ-saisie">
            <input id={id} type="text" autoComplete="off" maxLength={30} value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          </div>
        </div>

        <ChoixUnique
          nom="examen-conjoint"
          legende="Que faut-il examiner pour votre conjoint ?"
          options={[
            { valeur: "complet", libelle: "Ses frais aussi", detail: "Trajet, repas, télétravail… Toutes les questions lui sont posées." },
            { valeur: "salaire", libelle: "Juste son salaire", detail: "Il n'a pas de frais à déduire : il garde l'abattement de 10 %." },
          ]}
          valeur={examen}
          onChoix={(v) => setExamen(v as Examen)}
        />
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <button type="button" className="bouton bouton-principal" disabled={!examen} onClick={() => examen && onValider(prenom.trim(), examen === "salaire")}>
          Continuer
        </button>
      </PiedDePage>
    </div>
  );
}

/** Sélecteur de profil en haut d'écran : rappelle pour qui l'on répond et permet de changer. */
export function SelecteurProfil({ profils, actif, onChoix }: { profils: Profil[]; actif: number; onChoix: (index: number) => void }) {
  return (
    <nav className="selecteur-profil" aria-label="Pour qui répondez-vous ?">
      {profils.map((p, i) => (
        <button
          key={i}
          type="button"
          className={i === actif ? "selecteur-profil-option selecteur-profil-actif" : "selecteur-profil-option"}
          aria-current={i === actif ? "true" : undefined}
          onClick={() => onChoix(i)}
        >
          {nomProfil(i, p)}
        </button>
      ))}
    </nav>
  );
}

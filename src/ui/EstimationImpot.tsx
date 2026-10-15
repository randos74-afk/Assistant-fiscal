// Formulaire du foyer (F10) : étape « votre foyer » du parcours, et carte de modification sur l'écran de résultat.
import { useState } from "react";
import { partsFoyer } from "../moteur/impot";
import { libelleEtape } from "../parcours/etapes";
import { FICHES } from "../parcours/fichesAide";
import type { SaisieFoyer } from "../parcours/foyer";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

const valeur = (n: number | null) => (n === null || Number.isNaN(n) ? 0 : n);

type Situation = "seul" | "couple" | "veuf";

interface Props {
  valeurInitiale?: SaisieFoyer;
  onValider: (f: SaisieFoyer) => void;
  /** Présent : affiché comme une étape du parcours, avec en-tête et bouton « Précédent ». */
  onRetour?: () => void;
}

export function EstimationImpot({ valeurInitiale: v, onValider, onRetour }: Props) {
  const [situation, setSituation] = useState<Situation | undefined>(v ? (v.couple ? "couple" : v.veuf ? "veuf" : "seul") : undefined);
  const [enfants, setEnfants] = useState(String(v?.enfants ?? 0));
  const [parentIsole, setParentIsole] = useState(v?.parentIsole ?? false);
  const [salaireConjoint, setSalaireConjoint] = useState(v?.salaireConjoint ? afficherMontant(v.salaireConjoint) : "");
  const [autres, setAutres] = useState(v?.autresRevenus ? afficherMontant(v.autresRevenus) : "");
  const [aide, setAide] = useState(false);

  const couple = situation === "couple";
  const nbEnfants = valeur(lireEntier(enfants));
  const champsValides =
    [lireMontant(salaireConjoint), lireMontant(autres)].every((n) => n === null || !Number.isNaN(n)) && !Number.isNaN(lireEntier(enfants));
  const foyer: SaisieFoyer = {
    couple,
    enfants: nbEnfants,
    // Veuf avec enfants : le régime du veuf (parts d'un couple) remplace la case T.
    parentIsole: situation === "seul" && nbEnfants > 0 && parentIsole,
    ...(situation === "veuf" ? { veuf: true } : {}),
    salaireConjoint: couple ? valeur(lireMontant(salaireConjoint)) : 0,
    autresRevenus: valeur(lireMontant(autres)),
  };
  const parts = partsFoyer(foyer).parts;
  const peutValider = situation !== undefined && champsValides;

  const champs = (
    <>
      <ChoixUnique
        nom="situation"
        legende="Vous déclarez"
        options={[
          { valeur: "seul", libelle: "Seul", detail: "Célibataire, divorcé ou séparé." },
          { valeur: "couple", libelle: "En couple", detail: "Marié ou pacsé, déclaration commune." },
          { valeur: "veuf", libelle: "Veuf ou veuve" },
        ]}
        valeur={situation}
        onChoix={(x) => setSituation(x as Situation)}
      />
      <ChampNombre compact libelleVisible libelle="Enfants à charge" unite="enfants" valeur={enfants} onChange={setEnfants} />
      {situation === "seul" && nbEnfants > 0 && (
        <label className="case-a-cocher">
          <input type="checkbox" checked={parentIsole} onChange={(e) => setParentIsole(e.target.checked)} />
          {typographie("J'élève seul mes enfants (case T de la déclaration)")}
        </label>
      )}
      {situation === "veuf" && nbEnfants > 0 && (
        <Encadre>{typographie("Avec des enfants à charge, une personne veuve garde autant de parts qu'un couple.")}</Encadre>
      )}
      {couple && (
        <ChampMontant
          compact
          libelleVisible
          libelle="Salaire net imposable de votre conjoint"
          detail="Nous lui appliquons l'abattement automatique."
          valeur={salaireConjoint}
          onChange={setSalaireConjoint}
        />
      )}
      <ChampMontant
        compact
        libelleVisible
        libelle="Autres revenus imposables du foyer"
        detail="Pensions après abattement, revenus fonciers… Laissez vide s'il n'y en a pas."
        valeur={autres}
        onChange={setAutres}
      />
      {situation && <Encadre>{typographie(`Cela fait ${afficherMontant(parts)} parts. Vérifiez sur votre dernier avis d'impôt.`)}</Encadre>}
    </>
  );

  if (onRetour) {
    const etape = libelleEtape("votre foyer");
    return (
      <div className="ecran">
        <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />
        <main className="ecran-contenu" style={{ gap: 16 }}>
          <div className="question-titre">
            <h1 className="titre-question">Qui compose votre foyer ?</h1>
            <BoutonAsterisque onClick={() => setAide(true)} />
          </div>
          <p className="texte-secondaire sous-question">
            {typographie("Pour estimer votre impôt en euros et vous proposer les bons motifs. Cela ne change pas vos frais.")}
          </p>
          {champs}
        </main>
        <PiedDePage onPrecedent={onRetour}>
          <BandeauConfidentialite />
          <button type="button" className="bouton bouton-principal" disabled={!peutValider} onClick={() => onValider(foyer)}>
            Continuer
          </button>
        </PiedDePage>
        {aide && <FicheAide fiche={FICHES.foyer} ouverte onFermer={() => setAide(false)} />}
      </div>
    );
  }

  return (
    <section className="carte" aria-labelledby="titre-impot">
      <div className="question-titre" style={{ alignItems: "center" }}>
        <h2 id="titre-impot" style={{ flex: 1 }}>
          Combien d'impôt en moins ?
        </h2>
        <BoutonAsterisque onClick={() => setAide(true)} />
      </div>
      <p style={{ fontSize: "var(--taille-texte-min)" }}>
        {typographie("Quelques renseignements sur votre foyer pour estimer l'impôt en euros. Ils ne changent pas vos frais.")}
      </p>
      {champs}
      <button type="button" className="bouton bouton-principal" disabled={!peutValider} onClick={() => onValider(foyer)}>
        Estimer mon impôt
      </button>
      {aide && <FicheAide fiche={FICHES.foyer} ouverte onFermer={() => setAide(false)} />}
    </section>
  );
}

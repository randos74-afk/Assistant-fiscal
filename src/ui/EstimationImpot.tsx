// Formulaire du foyer (F10) pour estimer l'impôt en euros sur l'écran de résultat.
import { useState } from "react";
import { partsFoyer } from "../moteur/impot";
import { FICHES } from "../parcours/fichesAide";
import type { SaisieFoyer } from "../parcours/foyer";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide } from "./Aide";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { ChoixUnique, Encadre } from "./Question";
import { typographie } from "./typographie";

const valeur = (n: number | null) => (n === null || Number.isNaN(n) ? 0 : n);

export function EstimationImpot({ valeurInitiale: v, onValider }: { valeurInitiale?: SaisieFoyer; onValider: (f: SaisieFoyer) => void }) {
  const [situation, setSituation] = useState<string | undefined>(v ? (v.couple ? "couple" : "seul") : undefined);
  const [enfants, setEnfants] = useState(String(v?.enfants ?? 0));
  const [parentIsole, setParentIsole] = useState(v?.parentIsole ?? false);
  const [salaireConjoint, setSalaireConjoint] = useState(v?.salaireConjoint ? afficherMontant(v.salaireConjoint) : "");
  const [autres, setAutres] = useState(v?.autresRevenus ? afficherMontant(v.autresRevenus) : "");
  const [aide, setAide] = useState(false);

  const couple = situation === "couple";
  const nbEnfants = valeur(lireEntier(enfants));
  const champsValides = [lireMontant(salaireConjoint), lireMontant(autres)].every((n) => n === null || !Number.isNaN(n)) && !Number.isNaN(lireEntier(enfants));
  const foyer: SaisieFoyer = {
    couple,
    enfants: nbEnfants,
    parentIsole: !couple && nbEnfants > 0 && parentIsole,
    salaireConjoint: couple ? valeur(lireMontant(salaireConjoint)) : 0,
    autresRevenus: valeur(lireMontant(autres)),
  };
  const parts = partsFoyer(foyer).parts;

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
      <ChoixUnique
        nom="situation"
        legende="Vous déclarez"
        options={[
          { valeur: "seul", libelle: "Seul", detail: "Célibataire, divorcé, séparé ou veuf." },
          { valeur: "couple", libelle: "En couple", detail: "Marié ou pacsé, déclaration commune." },
        ]}
        valeur={situation}
        onChoix={setSituation}
      />
      <ChampNombre compact libelleVisible libelle="Enfants à charge" unite="enfants" valeur={enfants} onChange={setEnfants} />
      {situation === "seul" && nbEnfants > 0 && (
        <label className="case-a-cocher">
          <input type="checkbox" checked={parentIsole} onChange={(e) => setParentIsole(e.target.checked)} />
          {typographie("J'élève seul mes enfants (case T de la déclaration)")}
        </label>
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
      {situation && (
        <Encadre>{typographie(`Cela fait ${afficherMontant(parts)} parts. Vérifiez sur votre dernier avis d'impôt.`)}</Encadre>
      )}
      <button type="button" className="bouton bouton-principal" disabled={!situation || !champsValides} onClick={() => onValider(foyer)}>
        Estimer mon impôt
      </button>
      {aide && <FicheAide fiche={FICHES.foyer} ouverte onFermer={() => setAide(false)} />}
    </section>
  );
}

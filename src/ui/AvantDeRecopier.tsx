// Ajout n° 2 — Écran « Avant de recopier », entre le résultat et le texte à copier, affiché seulement
// s'il reste des valeurs non vérifiées (« Je ne sais pas » ou règle de prudence).
import { useState } from "react";
import type { CasAdministration } from "../parcours/conditions";
import type { EffetPossible, ValeurNonVerifiee } from "../parcours/valeursNonVerifiees";
import { CarteAdministration } from "./Conditions";
import { phraseEffet, pointsAttention, titreNonVerifiees } from "../parcours/valeursNonVerifiees";
import type { EcranModifiable } from "./Relecture";
import { PiedDePage } from "./Cadre";
import { EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

export const TEXTE_RESPONSABILITE =
  "FraisFit vous donne une estimation à partir de vos réponses. Votre déclaration reste sous votre responsabilité : vérifiez ces valeurs avec vos documents avant de déclarer, et gardez vos justificatifs 3 ans. FraisFit n'est pas un conseil fiscal et ne remplace pas impots.gouv.fr.";

interface Props {
  valeurs: { valeur: ValeurNonVerifiee; effet: EffetPossible }[];
  /** Ajout n° 3 — Cas à faire trancher par l'administration, comptés comme points d'attention. */
  cas: CasAdministration[];
  /** Étape à corriger, et profil concerné en mode foyer. */
  onVerifier: (ecran: EcranModifiable, profil?: number) => void;
  onVerifierTout: () => void;
  onContinuer: () => void;
  onRetour: () => void;
}

export function AvantDeRecopier({ valeurs, cas, onVerifier, onVerifierTout, onContinuer, onRetour }: Props) {
  const [compris, setCompris] = useState(false);

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Avant de recopier" etape={1} total={1} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question titre-attention">
          {typographie(`Attention : ${cas.length === 0 ? titreNonVerifiees(valeurs.length) : pointsAttention(valeurs.length + cas.length)}`)}
        </h1>

        {valeurs.map(({ valeur: v, effet }) => {
          const phrase = phraseEffet(v, effet);
          return (
            <section key={v.champ} className="carte" aria-labelledby={`non-verifiee-${v.champ}`}>
              <h2 id={`non-verifiee-${v.champ}`}>
                {typographie(v.libelle)} <span className="etiquette-non-verifiee">non vérifiée</span>
              </h2>
              <p className="detail-calcul">{typographie(`Valeur retenue : ${v.valeurRetenue}.`)}</p>
              <p className="detail-calcul">
                {typographie(
                  v.statut === "regle_prudente"
                    ? "Les textes officiels ne précisent pas ce cas : nous avons appliqué la règle la plus prudente."
                    : "Nous avons pris la valeur la plus prudente.",
                )}
              </p>
              {phrase && <p className="detail-calcul texte-attention">{typographie(phrase)}</p>}
              <button type="button" className="bouton bouton-secondaire" onClick={() => onVerifier(v.ecran, v.profil)}>
                Vérifier maintenant
              </button>
            </section>
          );
        })}

        {cas.map((c) => (
          <CarteAdministration key={c.id} cas={c} onVoir={c.ecran ? () => onVerifier(c.ecran!, c.profil) : undefined} />
        ))}

        <p>{typographie(TEXTE_RESPONSABILITE)}</p>

        <label className="case-a-cocher">
          <input type="checkbox" checked={compris} onChange={(e) => setCompris(e.target.checked)} />
          <span>
            {typographie(
              valeurs.length > 0
                ? "J'ai compris que ces valeurs ne sont pas vérifiées et que ma déclaration reste sous ma responsabilité."
                : "J'ai compris que ces points doivent être confirmés et que ma déclaration reste sous ma responsabilité.",
            )}
          </span>
        </label>
      </main>

      <PiedDePage>
        <button type="button" className="bouton bouton-principal" onClick={onVerifierTout}>
          Vérifier mes valeurs
        </button>
        <button type="button" className="bouton bouton-secondaire" onClick={onContinuer} disabled={!compris}>
          Continuer quand même
        </button>
      </PiedDePage>
    </div>
  );
}

// Résultat (F7, F8, docs/02 §7) : verdict sur les bases imposables, détail, blocs à copier, pas-à-pas.
import { useState } from "react";
import type { ResultatDeclarant } from "../moteur/declarant";
import { euros, nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import { comparerImpot } from "../moteur/impot";
import type { Vraisemblance } from "../moteur/vraisemblance";
import { autresRevenusFoyer, type SaisieFoyer } from "../parcours/foyer";
import { PiedDePage } from "./Cadre";
import { EstimationImpot } from "./EstimationImpot";
import { BlocACopier } from "./Copier";
import { Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

interface Props {
  parametres: Parametres;
  resultat: ResultatDeclarant;
  prudentes: string[];
  foyer?: SaisieFoyer;
  vraisemblance: Vraisemblance;
  onFoyer: (f: SaisieFoyer) => void;
  /** Renvoie false si le navigateur a bloqué la fenêtre. */
  onPdf: () => boolean;
  onEnregistrerFichier: () => void;
  onModifier: () => void;
  onRecommencer: () => void;
}

export function Resultat({ parametres: p, resultat: r, prudentes, foyer, vraisemblance: v, onFoyer, onPdf, onEnregistrerFichier, onModifier, onRecommencer }: Props) {
  const [pdfBloque, setPdfBloque] = useState(false);
  const [verifies, setVerifies] = useState<string[]>([]);
  const resteAVerifier = v.postesAVerifier.filter((l) => !verifies.includes(l.texte));
  const c = r.comparaison;
  const taux = `${Math.round(p.abattement_10_pourcent.taux * 100)} %`;
  const impot = foyer ? comparerImpot(p, c.baseAbattement10, c.baseFraisReels, autresRevenusFoyer(p, foyer), foyer) : null;
  const conseille = c.fraisReelsConseilles;
  const cible = p.resume_1ak.longueur_cible_caracteres;

  // F11 niveaux 2 et 3 : le texte à copier n'apparaît qu'après vérification des postes listés.
  const verification = v.postesAVerifier.length > 0 && (
    <section className="carte" aria-labelledby="titre-verification">
      <h2 id="titre-verification">{v.niveau === 3 ? "Confirmez chaque poste" : "Relisez vos postes les plus lourds"}</h2>
      {v.postesAVerifier.map((l) => (
        <label key={l.texte} className="case-a-cocher">
          <input
            type="checkbox"
            checked={verifies.includes(l.texte)}
            onChange={(e) => setVerifies(e.target.checked ? [...verifies, l.texte] : verifies.filter((x) => x !== l.texte))}
          />
          <span>
            {typographie(`J'ai vérifié : ${l.texte}`)}
            <small className="choix-detail">{typographie("Montant juste et justificatifs gardés.")}</small>
          </span>
        </label>
      ))}
      {resteAVerifier.length > 0 && (
        <p className="champ-detail">{typographie("Le texte à copier s'affichera quand tout sera coché. Pour corriger, touchez « Modifier mes réponses ».")}</p>
      )}
    </section>
  );

  const blocs =
    resteAVerifier.length > 0 ? (
      verification
    ) : (
    <>
      {verification}
      <BlocACopier titre={`Case ${r.caseFraisReels} : frais réels`} texte={nombre(r.montantCase)} grand />
      {r.totalReintegrations > 0 && (
        <BlocACopier
          titre="Case 1AJ : salaire à déclarer"
          texte={nombre(Math.ceil(c.salaireCorrige))}
          grand
          pied={typographie(`Votre salaire prérempli plus ${euros(r.totalReintegrations)} de remboursements de l'employeur.`)}
        />
      )}
      <BlocACopier
        titre="Informations complémentaires"
        texte={r.texte}
        pied={`${nombre(r.nbCaracteres)} caractères${r.depasseLongueurCible ? ` : plus long que la cible de ${nombre(cible)}, à raccourcir si le site le refuse` : ""}.`}
      />
      <section className="carte" aria-labelledby="titre-procedure">
        <h2 id="titre-procedure">Recopier dans votre déclaration</h2>
        <ol className="procedure">
          <li>{typographie("Sur impots.gouv.fr, ouvrez votre déclaration en ligne, rubrique « Traitements et salaires ».")}</li>
          <li>{typographie(`Cochez « Option frais réels » et ajoutez la case ${r.caseFraisReels} si elle n'apparaît pas.`)}</li>
          <li>{typographie(`Collez le montant dans la case ${r.caseFraisReels}.`)}</li>
          {r.totalReintegrations > 0 && <li>{typographie("Remplacez le salaire de la case 1AJ par le montant ci-dessus.")}</li>}
          <li>{typographie("Collez le texte dans « Informations complémentaires », puis validez.")}</li>
        </ol>
      </section>
    </>
    );

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Votre résultat" etape={1} total={1} onRetour={onModifier} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <section className={conseille ? "verdict verdict-reel" : "verdict verdict-abattement"} aria-live="polite">
          {!conseille ? (
            <p className="verdict-phrase">
              {typographie(`Ne changez rien : l'abattement automatique de ${taux} est plus avantageux pour vous.`)}
            </p>
          ) : impot && impot.gain > 0 ? (
            <>
              <p className="verdict-phrase">{typographie("Bonne nouvelle : avec vos frais réels, vous payez environ")}</p>
              <p className="verdict-montant montant">{euros(impot.gain)}</p>
              <p className="detail-calcul">
                {typographie(
                  `d'impôt en moins. Impôt estimé : ${euros(impot.avecAbattement.impot)} avec l'abattement, ${euros(impot.avecFraisReels.impot)} avec les frais réels.`,
                )}
              </p>
            </>
          ) : (
            <>
              <p className="verdict-phrase">{typographie("Bonne nouvelle : avec vos frais réels, votre revenu imposable baisse de")}</p>
              <p className="verdict-montant montant">{euros(c.gainBase)}</p>
              <p className="detail-calcul">
                {typographie(
                  impot
                    ? `Votre impôt estimé ne change pas (${euros(impot.avecAbattement.impot)}), mais votre revenu fiscal de référence baisse : cela peut compter pour certaines aides.`
                    : "par rapport à l'abattement automatique.",
                )}
              </p>
            </>
          )}
        </section>

        {foyer ? (
          <details className="depliant">
            <summary>Modifier les renseignements sur mon foyer</summary>
            <div style={{ marginTop: 12 }}>
              <EstimationImpot valeurInitiale={foyer} onValider={onFoyer} />
            </div>
          </details>
        ) : (
          conseille && <EstimationImpot onValider={onFoyer} />
        )}

        <div className="colonnes-comparaison">
          <section className={conseille ? "colonne" : "colonne colonne-gagnante"}>
            <h2>{`Abattement ${taux}`}</h2>
            <p className="detail-calcul">Salaire {euros(r.comparaison.salaireCorrige - r.totalReintegrations)}</p>
            <p className="detail-calcul">− abattement {euros(c.abattement)}</p>
            <p className="colonne-base montant">{euros(c.baseAbattement10)}</p>
            <p className="detail-calcul">revenu imposable</p>
          </section>
          <section className={conseille ? "colonne colonne-gagnante" : "colonne"}>
            <h2>Frais réels</h2>
            <p className="detail-calcul">Salaire {euros(c.salaireCorrige)}</p>
            <p className="detail-calcul">− frais {euros(r.montantCase)}</p>
            <p className="colonne-base montant">{euros(c.baseFraisReels)}</p>
            <p className="detail-calcul">revenu imposable</p>
          </section>
        </div>

        {v.message && <Encadre ton={v.niveau >= 2 ? "attention" : "info"}>{typographie(v.message)}</Encadre>}
        {v.alertes.map((a) => (
          <Encadre key={a} ton="attention">
            {typographie(a)}
          </Encadre>
        ))}

        {!conseille && (
          <Encadre>
            {typographie(`Les frais réels deviendraient intéressants au-delà de ${euros(c.seuilBascule)} de frais. Vous en avez ${euros(r.montantCase)}.`)}
          </Encadre>
        )}
        {r.alertes.map((a) => (
          <Encadre key={a} ton="attention">
            {typographie(a)}
          </Encadre>
        ))}
        {prudentes.length > 0 && (
          <Encadre>{typographie(`Valeur prudente retenue pour : ${prudentes.join(", ")}. Votre gain réel peut être plus élevé.`)}</Encadre>
        )}

        <details className="depliant">
          <summary>Voir le détail de vos frais</summary>
          {r.lignes.map((l) => (
            <p key={l.texte} className="detail-calcul" style={{ marginTop: 8 }}>
              {typographie(l.texte)}
            </p>
          ))}
        </details>

        {conseille ? (
          blocs
        ) : (
          <details className="depliant">
            <summary>Voir quand même le texte des frais réels</summary>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>{blocs}</div>
          </details>
        )}

        <section className="carte" aria-labelledby="titre-garder">
          <h2 id="titre-garder">Garder une trace</h2>
          <button type="button" className="bouton bouton-secondaire" onClick={() => setPdfBloque(!onPdf())}>
            Imprimer ou enregistrer en PDF
          </button>
          {pdfBloque && (
            <p className="champ-erreur">{typographie("Votre navigateur a bloqué la fenêtre : autorisez les fenêtres pour ce site, puis réessayez.")}</p>
          )}
          <button type="button" className="bouton bouton-secondaire" onClick={onEnregistrerFichier}>
            Enregistrer ma simulation dans un fichier
          </button>
          <p className="champ-detail">
            {typographie(
              `Le fichier reste chez vous. L'an prochain, ouvrez-le pour repartir de vos réponses. Calcul fait avec les paramètres des revenus ${p.millesime.revenus}.`,
            )}
          </p>
        </section>

        <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
          {typographie(
            "C'est une estimation. Votre déclaration sur impots.gouv.fr reste la référence. Gardez vos justificatifs 3 ans, au cas où les impôts vous les demandent.",
          )}
        </p>
      </main>

      <PiedDePage>
        <button type="button" className="bouton bouton-secondaire" onClick={onModifier}>
          Modifier mes réponses
        </button>
        <button type="button" className="bouton bouton-secondaire" onClick={onRecommencer}>
          Recommencer
        </button>
      </PiedDePage>
    </div>
  );
}

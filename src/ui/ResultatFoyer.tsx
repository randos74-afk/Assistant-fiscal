// Ajout n° 1 — Résultat du foyer : les 4 combinaisons abattement / frais réels, l'impôt estimé de chacune,
// la moins chère mise en avant, puis un résumé à copier (1AK, 1BK) pour chaque déclarant qui gagne à opter.
import { useState } from "react";
import { combinaisonsFoyer } from "../moteur/couple";
import { euros, nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import type { DonneesDeclarant } from "../parcours/declarants";
import type { SaisieFoyer } from "../parcours/foyer";
import { minuscule, phraseCombinaison } from "../parcours/profils";
import { nValeurs } from "../parcours/valeursNonVerifiees";
import { AvantDeRecopier } from "./AvantDeRecopier";
import { PiedDePage } from "./Cadre";
import { BlocACopier } from "./Copier";
import { EstimationImpot } from "./EstimationImpot";
import { Encadre, EnTeteEtape } from "./Question";
import type { EcranModifiable } from "./Relecture";
import { typographie } from "./typographie";

interface Props {
  parametres: Parametres;
  /** Les deux déclarants : « Vous » (1AK) et le conjoint (1BK). */
  declarants: DonneesDeclarant[];
  foyer?: SaisieFoyer;
  onFoyer: (f: SaisieFoyer) => void;
  onVerifier: (ecran: EcranModifiable, profil: number) => void;
  /** PDF d'un déclarant ; renvoie false si le navigateur a bloqué la fenêtre. */
  onPdf: (index: number) => boolean;
  onEnregistrerFichier: () => void;
  onModifier: () => void;
  onRecommencer: () => void;
}

export function ResultatFoyer({ parametres: p, declarants, foyer, onFoyer, onVerifier, onPdf, onEnregistrerFichier, onModifier, onRecommencer }: Props) {
  const [avantDeRecopier, setAvantDeRecopier] = useState(false);
  const [risqueAccepte, setRisqueAccepte] = useState(false);
  const [verifies, setVerifies] = useState<string[]>([]);
  const [pdfBloque, setPdfBloque] = useState(false);

  const [d1, d2] = declarants;
  const declarantDuFoyer = (d: DonneesDeclarant) => ({
    salairePrerempli: d.resultat.comparaison.salaireCorrige - d.resultat.totalReintegrations,
    reintegrations: d.resultat.totalReintegrations,
    fraisReels: d.resultat.montantCase,
  });
  const { combinaisons, meilleure } = combinaisonsFoyer(
    p,
    declarantDuFoyer(d1),
    declarantDuFoyer(d2),
    { enfants: foyer?.enfants ?? 0, parentIsole: false },
    foyer?.autresRevenus ?? 0,
  );
  const sansOption = combinaisons.find((c) => !c.reels1 && !c.reels2)!;
  const gain = sansOption.impot - meilleure.impot;
  const optants = declarants.filter((d) => (d.index === 0 ? meilleure.reels1 : meilleure.reels2));
  const taux = `${Math.round(p.abattement_10_pourcent.taux * 100)} %`;

  const nonVerifiees = declarants.flatMap((d) => d.nonVerifiees);
  const cas = declarants.flatMap((d) => d.casAdministration);
  const nbPoints = nonVerifiees.length + cas.length;
  // F11 — Postes à confirmer, pour les seuls déclarants qui optent.
  const postes = optants.flatMap((d) => d.vraisemblance.postesAVerifier.map((l) => ({ cle: `${d.index}-${l.texte}`, texte: `${d.nom} : ${l.texte}` })));
  const resteAVerifier = postes.filter((l) => !verifies.includes(l.cle));

  if (avantDeRecopier) {
    return (
      <AvantDeRecopier
        valeurs={nonVerifiees}
        cas={cas}
        onVerifier={(ecran, profil) => onVerifier(ecran, profil ?? 0)}
        onVerifierTout={onModifier}
        onContinuer={() => (setRisqueAccepte(true), setAvantDeRecopier(false))}
        onRetour={() => setAvantDeRecopier(false)}
      />
    );
  }

  const libelleCombinaison = (reels1: boolean, reels2: boolean) => phraseCombinaison(reels1, reels2, d2.profil);

  const verification = postes.length > 0 && (
    <section className="carte" aria-labelledby="titre-verification">
      <h2 id="titre-verification">Relisez vos postes les plus lourds</h2>
      {postes.map((l) => (
        <label key={l.cle} className="case-a-cocher">
          <input
            type="checkbox"
            checked={verifies.includes(l.cle)}
            onChange={(e) => setVerifies(e.target.checked ? [...verifies, l.cle] : verifies.filter((x) => x !== l.cle))}
          />
          <span>
            {typographie(`J'ai vérifié : ${l.texte}`)}
            <small className="choix-detail">{typographie("Montant juste et justificatifs gardés.")}</small>
          </span>
        </label>
      ))}
    </section>
  );

  const blocsDeclarant = (d: DonneesDeclarant) => {
    const r = d.resultat;
    const c = r.comparaison;
    return (
      <section key={d.index} className="carte" aria-labelledby={`resume-${d.index}`} style={{ gap: 12 }}>
        <h2 id={`resume-${d.index}`}>{typographie(`${d.nom} : case ${r.caseFraisReels}`)}</h2>
        <BlocACopier titre={`Case ${r.caseFraisReels} : frais réels`} texte={nombre(r.montantCase)} grand />
        {r.totalReintegrations > 0 && (
          <BlocACopier
            titre={`Case ${r.caseSalaire} : salaire à déclarer`}
            texte={nombre(Math.ceil(c.salaireCorrige - r.allocationsChomage))}
            grand
            pied={typographie(`Salaire prérempli plus ${euros(r.totalReintegrations)} de remboursements de l'employeur.`)}
          />
        )}
        <BlocACopier titre="Informations complémentaires" texte={r.texte} pied={`${nombre(r.nbCaracteres)} caractères.`} />
        <p className="detail-calcul">
          {typographie(`Sur impots.gouv.fr, cliquez sur « Option frais réels » du déclarant ${d.index + 1}, puis collez le montant dans la case ${r.caseFraisReels}.`)}
        </p>
      </section>
    );
  };

  const blocs =
    resteAVerifier.length > 0 ? (
      <>
        {verification}
        <p className="champ-detail">{typographie("Le texte à copier s'affichera quand tout sera coché.")}</p>
      </>
    ) : nbPoints > 0 && !risqueAccepte ? (
      <>
        {verification}
        <section className="carte" aria-labelledby="titre-avant-recopier">
          <h2 id="titre-avant-recopier">Avant de recopier</h2>
          <p className="detail-calcul">
            {typographie(
              nonVerifiees.length > 0
                ? `Votre estimation contient ${nValeurs(nonVerifiees.length)}. Relisez-les avant de voir les montants à recopier.`
                : "Un point de votre situation doit être confirmé par l'administration. Lisez-le avant de voir les montants à recopier.",
            )}
          </p>
          <button type="button" className="bouton bouton-principal" onClick={() => setAvantDeRecopier(true)}>
            Voir les points à vérifier
          </button>
        </section>
      </>
    ) : (
      <>
        {verification}
        {nonVerifiees.length > 0 && (
          <Encadre ton="attention">
            {typographie(`Ces textes contiennent ${nValeurs(nonVerifiees.length)}. Corrigez-les avant de les recopier dans votre déclaration.`)}
          </Encadre>
        )}
        {optants.map(blocsDeclarant)}
      </>
    );

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Votre résultat" etape={1} total={1} onRetour={onModifier} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        {nonVerifiees.length > 0 && <p className="bandeau-non-verifiees">{typographie(`Estimation avec ${nValeurs(nonVerifiees.length)}`)}</p>}

        <section className={optants.length > 0 ? "verdict verdict-reel" : "verdict verdict-abattement"} aria-live="polite">
          {optants.length === 0 ? (
            <p className="verdict-phrase">{typographie(`Ne changez rien : l'abattement automatique de ${taux} est plus avantageux pour vous deux.`)}</p>
          ) : (
            <>
              <p className="verdict-phrase">{typographie(`La meilleure combinaison : ${minuscule(libelleCombinaison(meilleure.reels1, meilleure.reels2))}.`)}</p>
              {gain > 0 ? (
                <>
                  <p className="verdict-montant montant">{euros(gain)}</p>
                  <p className="detail-calcul">{typographie("d'impôt en moins pour votre foyer, par rapport à l'abattement pour vous deux.")}</p>
                </>
              ) : (
                <p className="detail-calcul">
                  {typographie("Votre impôt estimé ne change pas, mais votre revenu fiscal de référence baisse : cela peut compter pour certaines aides.")}
                </p>
              )}
            </>
          )}
        </section>

        <section className="carte" aria-labelledby="titre-combinaisons">
          <h2 id="titre-combinaisons">Les quatre possibilités</h2>
          <table className="tableau-combinaisons">
            <thead>
              <tr>
                <th scope="col">Choix</th>
                <th scope="col">{d1.nom}</th>
                <th scope="col">{d2.nom}</th>
                <th scope="col">Impôt du foyer</th>
              </tr>
            </thead>
            <tbody>
              {combinaisons.map((c) => (
                <tr key={`${c.reels1}-${c.reels2}`} className={c === meilleure ? "combinaison-meilleure" : undefined}>
                  <td>{typographie(libelleCombinaison(c.reels1, c.reels2))}</td>
                  <td className="montant">{euros(c.base1)}</td>
                  <td className="montant">{euros(c.base2)}</td>
                  <td className="montant">{euros(c.impot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="detail-calcul">{typographie("Montants par déclarant : revenu imposable après abattement ou frais réels.")}</p>
        </section>

        <details className="depliant">
          <summary>Modifier les renseignements sur mon foyer</summary>
          <div style={{ marginTop: 12 }}>
            <EstimationImpot mode="couple" valeurInitiale={foyer} onValider={onFoyer} />
          </div>
        </details>

        {declarants.map((d) =>
          [...d.resultat.alertes, ...d.vraisemblance.alertes].map((a) => (
            <Encadre key={`${d.index}-${a}`} ton="attention">
              {typographie(`${d.nom} : ${a}`)}
            </Encadre>
          )),
        )}

        {declarants.map((d) => (
          <details key={d.index} className="depliant">
            <summary>{typographie(`Voir le détail des frais : ${minuscule(d.nom)}`)}</summary>
            {d.resultat.lignes.length === 0 ? (
              <p className="detail-calcul" style={{ marginTop: 8 }}>
                Aucun frais réel.
              </p>
            ) : (
              d.resultat.lignes.map((l) => (
                <p key={l.texte} className="detail-calcul" style={{ marginTop: 8 }}>
                  {typographie(l.texte)}
                </p>
              ))
            )}
          </details>
        ))}

        {optants.length > 0 && blocs}

        <section className="carte" aria-labelledby="titre-garder">
          <h2 id="titre-garder">Garder une trace</h2>
          {optants.map((d) => (
            <button key={d.index} type="button" className="bouton bouton-secondaire" onClick={() => setPdfBloque(!onPdf(d.index))}>
              {typographie(`PDF et note explicative : ${minuscule(d.nom)}`)}
            </button>
          ))}
          {pdfBloque && (
            <p className="champ-erreur">{typographie("Votre navigateur a bloqué la fenêtre : autorisez les fenêtres pour ce site, puis réessayez.")}</p>
          )}
          <button type="button" className="bouton bouton-secondaire" onClick={onEnregistrerFichier}>
            Enregistrer notre simulation dans un fichier
          </button>
        </section>

        <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
          {typographie("C'est une estimation. Votre déclaration sur impots.gouv.fr reste la référence. Gardez vos justificatifs 3 ans.")}
        </p>
      </main>

      <PiedDePage>
        <button type="button" className="bouton bouton-secondaire" onClick={onModifier}>
          Modifier nos réponses
        </button>
        <button type="button" className="bouton bouton-secondaire" onClick={onRecommencer}>
          Recommencer
        </button>
      </PiedDePage>
    </div>
  );
}

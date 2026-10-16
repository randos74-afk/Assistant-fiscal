// Ajout n° 3 — Écran « Avant de commencer », lecture des conditions générales, lien vers l'annexe
// « Limites d'usage » (site externe) et carte « Ce cas doit être tranché par l'administration ».
import { Fragment, useState, type ReactNode } from "react";
import {
  CONFIGURATION,
  CONSEIL_ADMINISTRATION,
  dateEnClair,
  lienAnnexe,
  MENTION_LEGALE,
  peutCommencer,
  texteConditions,
  type CasAdministration,
} from "../parcours/conditions";
import { PiedDePage } from "./Cadre";
import { EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

const RESUME = [
  "FraisFit calcule sur votre téléphone si les frais réels vous font payer moins d'impôt que l'abattement automatique.",
  "Le résultat est une estimation, fondée sur vos réponses et sur les barèmes officiels.",
  "Vous remplissez vous-même votre déclaration sur impots.gouv.fr : elle reste sous votre responsabilité.",
  "Certains cas doivent être confirmés par l'administration : ils sont listés dans les limites d'usage.",
];

/** Lien vers l'annexe sur le site externe, ou mention « bientôt en ligne » tant que l'adresse n'est pas réglée. */
export function LienAnnexe({ children = "Lire les limites d'usage" }: { children?: ReactNode }) {
  const url = lienAnnexe();
  if (!url) return <span className="texte-secondaire">{typographie("Limites d'usage : bientôt en ligne.")}</span>;
  return (
    <a className="lien" href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function AvantDeCommencer({ versionPrecedente, onAccepter }: { versionPrecedente: boolean; onAccepter: () => void }) {
  const [coche, setCoche] = useState(false);
  const c = CONFIGURATION.conditions;

  return (
    <div className="ecran">
      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">Avant de commencer</h1>
        {versionPrecedente && (
          <p className="bandeau-non-verifiees">
            {typographie(`Nos conditions ont changé le ${dateEnClair(c.date)}.`)}{" "}
            <a className="lien" href="#conditions">
              Voir les changements
            </a>
          </p>
        )}
        <ul className="liste-resume">
          {RESUME.map((p) => (
            <li key={p}>{typographie(p)}</li>
          ))}
        </ul>
        <p className="texte-secondaire">{typographie(MENTION_LEGALE)}</p>
        <p style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0 }}>
          <a className="lien" href="#conditions">
            Lire les conditions générales
          </a>
          <LienAnnexe />
        </p>
        <label className="case-a-cocher">
          <input type="checkbox" checked={coche} onChange={(e) => setCoche(e.target.checked)} />
          <span>{typographie("J'ai lu et j'accepte les conditions générales et leur annexe.")}</span>
        </label>
      </main>

      <PiedDePage>
        <button type="button" className="bouton bouton-principal" onClick={onAccepter} disabled={!peutCommencer(coche)}>
          Commencer
        </button>
      </PiedDePage>
    </div>
  );
}

/** Texte en gras entre ** **, seul balisage utilisé dans le fichier des conditions. */
function enGras(ligne: string): ReactNode[] {
  return ligne.split(/\*\*(.+?)\*\*/g).map((morceau, i) => (i % 2 ? <strong key={i}>{typographie(morceau)}</strong> : <Fragment key={i}>{typographie(morceau)}</Fragment>));
}

export function LectureConditions({ onFermer }: { onFermer: () => void }) {
  const c = CONFIGURATION.conditions;
  const blocs = texteConditions().split(/\n\s*\n/);

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Conditions et limites d'usage" etape={1} total={1} onRetour={onFermer} />
      <main className="ecran-contenu" style={{ gap: 12 }}>
        <p className="texte-secondaire">{typographie(`Version ${c.version} du ${dateEnClair(c.date)}.`)}</p>
        {c.changements.length > 0 && (
          <section className="carte" aria-labelledby="titre-changements">
            <h2 id="titre-changements">Ce qui a changé</h2>
            <ul>
              {c.changements.map((ch) => (
                <li key={ch}>{typographie(ch)}</li>
              ))}
            </ul>
          </section>
        )}
        <p>{typographie(MENTION_LEGALE)}</p>
        {blocs.map((b, i) =>
          b.startsWith("# ") ? (
            <h1 key={i} className="titre-question">
              {typographie(b.slice(2))}
            </h1>
          ) : (
            <p key={i} style={{ margin: 0 }}>
              {enGras(b)}
            </p>
          ),
        )}
        <section className="carte" aria-labelledby="titre-annexe">
          <h2 id="titre-annexe">Annexe : limites d'usage et bonnes pratiques</h2>
          <p className="detail-calcul">{typographie("L'annexe est tenue à jour sur notre site.")}</p>
          <LienAnnexe>Ouvrir l'annexe</LienAnnexe>
        </section>
      </main>
      <PiedDePage>
        <button type="button" className="bouton bouton-principal" onClick={onFermer}>
          Fermer
        </button>
      </PiedDePage>
    </div>
  );
}

export function CarteAdministration({ cas, onVoir }: { cas: CasAdministration; onVoir?: () => void }) {
  return (
    <section className="carte carte-administration" aria-labelledby={`cas-${cas.id}`}>
      <h2 id={`cas-${cas.id}`}>Ce cas doit être tranché par l'administration</h2>
      <p className="detail-calcul">{typographie(cas.phrase)}</p>
      <p className="detail-calcul">{typographie(CONSEIL_ADMINISTRATION)}</p>
      <LienAnnexe>En savoir plus dans les limites d'usage</LienAnnexe>
      {onVoir && (
        <button type="button" className="bouton bouton-secondaire" onClick={onVoir}>
          Revoir ma réponse
        </button>
      )}
    </section>
  );
}

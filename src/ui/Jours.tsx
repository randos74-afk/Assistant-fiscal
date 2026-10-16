// Étape 2 : vos jours (F2). Deux questions : combien de jours travaillés, puis où.
// Le calendrier réel de l'année pré-remplit tout ; la personne corrige, mois par mois si besoin.
import { ConseilsMetier } from "./QuestionsMetier";
import { useMemo, useState } from "react";
import type { Parametres } from "../moteur/types";
import {
  calendrierParMois,
  joursDansLeMois,
  joursPrudents,
  joursTravailles,
  repartirAuProrata,
  repartitionSimple,
  totaux,
  type JoursDuMois,
} from "../parcours/calendrier";
import { libelleEtape } from "../parcours/etapes";
import { completerFiche, FICHES } from "../parcours/fichesAide";
import { lireEntier } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, Encadre, EnTeteEtape, Pastilles } from "./Question";
import { typographie } from "./typographie";

export interface SaisieJours {
  joursParSemaine: number;
  semainesConges: number;
  rtt: number;
  absences: number;
  alsaceMoselle: boolean;
  /** « Je ne sais pas » : valeur prudente retenue, signalée dans le récapitulatif. */
  prudent: boolean;
  /** Nombre de jours travaillés saisi directement (fiche de paie) ; remplace le calcul par les congés. */
  joursSaisis?: number;
  teletravailParSemaine: number;
  /** Total des jours de télétravail de l'année, quand la personne le connaît ; remplace le rythme par semaine. */
  teletravailAnnee?: number;
  deplacementsAnnee: number;
  /** Jours de chaque mois, après corrections éventuelles. */
  mois: JoursDuMois[];
  corrigeMoisParMois: boolean;
}

const NOMS_MOIS = ["Janv.", "Févr.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

interface Props {
  millesime: number;
  parametres: Parametres;
  valeurInitiale?: SaisieJours;
  onValider: (jours: SaisieJours) => void;
  onRetour: () => void;
  /** F14 — Conseils du métier, en tête de la première question. */
  conseils?: string[];
}

const entier = (t: string) => {
  const n = lireEntier(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};
const entierValide = (t: string) => !Number.isNaN(lireEntier(t));

export function Jours({ millesime, parametres, valeurInitiale: v, onValider, onRetour, conseils }: Props) {
  const [question, setQuestion] = useState<1 | 2>(v ? 2 : 1);
  const [joursParSemaine, setJoursParSemaine] = useState(v?.joursParSemaine ?? 5);
  const [conges, setConges] = useState(String(v?.semainesConges ?? 5));
  const [rtt, setRtt] = useState(String(v?.rtt ?? 0));
  const [absences, setAbsences] = useState(String(v?.absences ?? 0));
  const [alsaceMoselle, setAlsaceMoselle] = useState(v?.alsaceMoselle ?? false);
  const [prudent, setPrudent] = useState(v?.prudent ?? false);
  const [parTotal, setParTotal] = useState(v?.joursSaisis !== undefined);
  const [totalSaisi, setTotalSaisi] = useState(v?.joursSaisis !== undefined ? String(v.joursSaisis) : "");
  const [teletravail, setTeletravail] = useState(v?.teletravailParSemaine ?? 0);
  const [parTotalTeletravail, setParTotalTeletravail] = useState(v?.teletravailAnnee !== undefined);
  const [totalTeletravail, setTotalTeletravail] = useState(v?.teletravailAnnee !== undefined ? String(v.teletravailAnnee) : "");
  const [deplacements, setDeplacements] = useState(String(v?.deplacementsAnnee ?? 0));
  const [moisCorriges, setMoisCorriges] = useState<string[][] | null>(
    v?.corrigeMoisParMois ? v.mois.map((m) => [String(m.site), String(m.teletravail), String(m.deplacement)]) : null,
  );
  const [aide, setAide] = useState<"jours" | "teletravail" | null>(null);

  const etape = libelleEtape("vos jours");
  const nbPrudent = joursPrudents(parametres, joursParSemaine);

  // Jours travaillés de chaque mois : calendrier réel, ou valeur prudente répartie sur le calendrier.
  const calcul = useMemo(
    () =>
      joursTravailles({
        annee: millesime,
        joursParSemaine,
        semainesConges: entier(conges),
        rtt: entier(rtt),
        absences: entier(absences),
        alsaceMoselle,
      }),
    [millesime, joursParSemaine, conges, rtt, absences, alsaceMoselle],
  );
  const disponibles = useMemo(
    () => calendrierParMois(millesime, joursParSemaine, alsaceMoselle).map((m) => m.ouvres - m.feries),
    [millesime, joursParSemaine, alsaceMoselle],
  );
  const maxJours = disponibles.reduce((s, x) => s + x, 0);
  // Jours saisis directement : répartis sur le calendrier, à corriger mois par mois si besoin.
  const parMois = useMemo(() => {
    if (prudent) return repartirAuProrata(nbPrudent, disponibles);
    if (parTotal) return repartirAuProrata(Math.min(entier(totalSaisi), maxJours), disponibles);
    return calcul.parMois;
  }, [prudent, parTotal, totalSaisi, calcul, disponibles, maxJours, nbPrudent]);
  const totalSaisiNb = lireEntier(totalSaisi);
  const totalSaisiValide = totalSaisiNb !== null && !Number.isNaN(totalSaisiNb) && totalSaisiNb > 0 && totalSaisiNb <= maxJours;

  const automatique = repartitionSimple(
    parMois,
    joursParSemaine,
    parTotalTeletravail ? 0 : teletravail,
    entier(deplacements),
    parTotalTeletravail ? entier(totalTeletravail) : undefined,
  );
  const mois: JoursDuMois[] = moisCorriges
    ? moisCorriges.map(([s, t, d]) => ({ site: entier(s), teletravail: entier(t), deplacement: entier(d) }))
    : automatique;
  const t = totaux(mois);

  const moisImpossibles = mois
    .map((m, i) => (m.site + m.teletravail + m.deplacement > joursDansLeMois(millesime, i) ? i : -1))
    .filter((i) => i >= 0);
  const saisiesQ1Valides = prudent || (parTotal ? totalSaisiValide : [conges, rtt, absences].every(entierValide));
  const saisiesQ2Valides =
    entierValide(deplacements) &&
    (!parTotalTeletravail || entierValide(totalTeletravail)) &&
    (moisCorriges ?? []).every((l) => l.every(entierValide));
  const seuilSite = parametres.alertes_vraisemblance.jours_sur_site_max_temps_plein;

  function corrigerCellule(i: number, j: number, texte: string) {
    const base = moisCorriges ?? automatique.map((m) => [String(m.site), String(m.teletravail), String(m.deplacement)]);
    setMoisCorriges(base.map((ligne, k) => (k === i ? ligne.map((c, l) => (l === j ? texte : c)) : ligne)));
  }

  function copierJanvier() {
    const base = moisCorriges ?? automatique.map((m) => [String(m.site), String(m.teletravail), String(m.deplacement)]);
    setMoisCorriges(base.map(() => [...base[0]]));
  }

  function valider() {
    onValider({
      joursParSemaine,
      semainesConges: entier(conges),
      rtt: entier(rtt),
      absences: entier(absences),
      alsaceMoselle,
      prudent,
      ...(parTotal && !prudent ? { joursSaisis: entier(totalSaisi) } : {}),
      teletravailParSemaine: parTotalTeletravail ? 0 : teletravail,
      ...(parTotalTeletravail ? { teletravailAnnee: entier(totalTeletravail) } : {}),
      deplacementsAnnee: entier(deplacements),
      mois,
      corrigeMoisParMois: moisCorriges !== null,
    });
  }

  const fiche =
    aide === "jours"
      ? completerFiche(FICHES.jours, { joursPrudents: nbPrudent })
      : FICHES.teletravail;

  if (question === 1) {
    const titre = typographie(`Combien de jours avez-vous travaillé en ${millesime} ?`);
    return (
      <div className="ecran">
        <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />

        <main className="ecran-contenu" style={{ gap: 16 }}>
          <div className="question-titre">
            <h1 className="titre-question">{titre}</h1>
            <BoutonAsterisque onClick={() => setAide("jours")} />
          </div>
          <ConseilsMetier conseils={conseils} />
          <p className="texte-secondaire sous-question">
            {typographie(`Nous partons du calendrier ${millesime}, jours fériés compris. Corrigez seulement ce qui ne va pas.`)}
          </p>

          <Pastilles
            legende="Jours travaillés par semaine"
            options={[1, 2, 3, 4, 5, 6]}
            valeur={joursParSemaine}
            onChoix={(n) => {
              setJoursParSemaine(n);
              setTeletravail(Math.min(teletravail, n));
              setMoisCorriges(null);
            }}
          />

          {!prudent && parTotal ? (
            <>
              <ChampNombre
                libelleVisible
                libelle="Jours travaillés dans l'année"
                detail="Souvent indiqué sur votre fiche de paie de décembre, ou sur l'attestation de votre employeur."
                unite="jours"
                valeur={totalSaisi}
                onChange={(x) => (setTotalSaisi(x), setMoisCorriges(null))}
              />
              {totalSaisiNb !== null && !Number.isNaN(totalSaisiNb) && totalSaisiNb > maxJours && (
                <p className="champ-erreur">
                  {typographie(`C'est plus que les ${maxJours} jours possibles en ${millesime} à ce rythme. Pouvez-vous vérifier ?`)}
                </p>
              )}
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setParTotal(false), setMoisCorriges(null))}>
                Calculer plutôt avec mes congés
              </button>
            </>
          ) : !prudent ? (
            <>
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setParTotal(true), setMoisCorriges(null))}>
                Je connais mon nombre de jours travaillés (fiche de paie)
              </button>
              <ChampNombre compact libelleVisible libelle="Semaines de congés payés" unite="semaines" valeur={conges} onChange={(x) => (setConges(x), setMoisCorriges(null))} />
              <ChampNombre compact libelleVisible libelle="Jours de RTT pris" unite="jours" valeur={rtt} onChange={(x) => (setRtt(x), setMoisCorriges(null))} />
              <ChampNombre
                compact
                libelleVisible
                libelle="Jours d'absence"
                detail="Arrêt maladie, maternité, chômage partiel, congé sans solde."
                unite="jours"
                valeur={absences}
                onChange={(x) => (setAbsences(x), setMoisCorriges(null))}
              />
              <label className="case-a-cocher">
                <input type="checkbox" checked={alsaceMoselle} onChange={(e) => (setAlsaceMoselle(e.target.checked), setMoisCorriges(null))} />
                Je travaille en Alsace ou en Moselle (deux jours fériés de plus)
              </label>

              <section className="carte" aria-live="polite">
                <p className="resultat-jours">
                  <strong className="montant">{calcul.total}</strong> jours travaillés
                </p>
                <p className="detail-calcul">
                  {calcul.ouvres} jours de semaine − {calcul.feries} fériés − {calcul.conges} jours de congés
                  {calcul.rtt > 0 && ` − ${calcul.rtt} RTT`}
                  {calcul.absences > 0 && ` − ${calcul.absences} jours d'absence`}
                </p>
              </section>
              <LienJeNeSaisPas onClick={() => (setPrudent(true), setMoisCorriges(null))} />
            </>
          ) : (
            <>
              <section className="carte">
                <p className="resultat-jours">
                  <strong className="montant">{nbPrudent}</strong> jours travaillés
                </p>
                <p className="detail-calcul">Valeur prudente retenue</p>
              </section>
              <Encadre>
                {typographie(
                  `Nous retenons ${nbPrudent} jours, la valeur la plus prudente. Elle sera signalée dans votre récapitulatif, et vous pourrez la corriger.`,
                )}
              </Encadre>
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setPrudent(false), setParTotal(false))}>
                Finalement, je peux compter mes jours
              </button>
            </>
          )}
        </main>

        <PiedDePage onPrecedent={onRetour}>
          <BandeauConfidentialite />
          <button type="button" className="bouton bouton-principal" disabled={!saisiesQ1Valides} onClick={() => setQuestion(2)}>
            Continuer
          </button>
        </PiedDePage>

        <FicheAide fiche={fiche} ouverte={aide !== null} onFermer={() => setAide(null)} />
      </div>
    );
  }

  const titre = typographie("Où avez-vous travaillé ces jours-là ?");
  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={() => setQuestion(1)} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">{titre}</h1>

        {parTotalTeletravail ? (
          <>
            <ChampNombre
              compact
              libelleVisible
              libelle="Jours de télétravail dans l'année"
              detail="Nous les répartissons sur vos mois travaillés. Corrigez mois par mois si certains mois étaient plus chargés."
              unite="jours"
              valeur={totalTeletravail}
              onChange={(x) => (setTotalTeletravail(x), setMoisCorriges(null))}
            />
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setParTotalTeletravail(false), setMoisCorriges(null))}>
              Indiquer plutôt mes jours par semaine
            </button>
          </>
        ) : (
          <>
            <Pastilles
              legende="Jours de télétravail par semaine"
              aide={<BoutonAsterisque onClick={() => setAide("teletravail")} />}
              options={Array.from({ length: joursParSemaine + 1 }, (_, i) => i)}
              valeur={teletravail}
              onChoix={(n) => (setTeletravail(n), setMoisCorriges(null))}
            />
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setParTotalTeletravail(true), setMoisCorriges(null))}>
              Je connais mon total de jours de télétravail de l'année
            </button>
          </>
        )}

        <ChampNombre
          compact
          libelleVisible
          libelle="Jours en déplacement dans l'année"
          detail="Missions, formations ou chantiers loin de votre lieu de travail habituel."
          unite="jours"
          valeur={deplacements}
          onChange={(x) => (setDeplacements(x), setMoisCorriges(null))}
        />

        <section className="carte" aria-live="polite">
          <p className="resultat-jours">
            <strong className="montant">{t.travailles}</strong> jours travaillés
          </p>
          <p className="detail-calcul">
            {t.site} sur site · {t.teletravail} en télétravail · {t.deplacement} en déplacement
          </p>
        </section>

        {t.teletravail > 0 && <Encadre>Les jours de télétravail ne comptent pas pour les repas.</Encadre>}
        {t.site > seuilSite && (
          <Encadre ton="attention">
            {typographie(`Plus de ${seuilSite} jours sur site, c'est rare pour un temps plein. Pouvez-vous vérifier vos congés ?`)}
          </Encadre>
        )}

        <details className="depliant" open={moisCorriges !== null}>
          <summary>Corriger mois par mois</summary>
          <p>
            {typographie(
              "Indiquez vos vrais jours, par exemple 0 sur site en août si vous étiez en congés. Le forfait télétravail est plafonné chaque mois : ce détail compte.",
            )}
          </p>
          <table className="tableau-mois">
            <thead>
              <tr>
                <th scope="col">Mois</th>
                <th scope="col">Sur site</th>
                <th scope="col">Télé&shy;travail</th>
                <th scope="col">Dépla&shy;cement</th>
              </tr>
            </thead>
            <tbody>
              {mois.map((m, i) => {
                const textes = moisCorriges?.[i] ?? [String(m.site), String(m.teletravail), String(m.deplacement)];
                const impossible = moisImpossibles.includes(i);
                return (
                  <tr key={i} className={impossible ? "ligne-erreur" : undefined}>
                    <th scope="row">{NOMS_MOIS[i]}</th>
                    {textes.map((texte, j) => (
                      <td key={j}>
                        <input
                          className="cellule"
                          type="text"
                          inputMode="numeric"
                          aria-label={`${NOMS_MOIS[i]}, ${["sur site", "télétravail", "déplacement"][j]}`}
                          aria-invalid={impossible || !entierValide(texte) ? true : undefined}
                          value={texte}
                          onChange={(e) => corrigerCellule(i, j, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {moisImpossibles.length > 0 && (
            <p className="champ-erreur">
              {typographie(
                `Ce nombre de jours dépasse la longueur du mois (${moisImpossibles.map((i) => NOMS_MOIS[i]).join(", ")}). Pouvez-vous vérifier ?`,
              )}
            </p>
          )}
          <div className="actions-tableau">
            <button type="button" className="bouton bouton-secondaire" onClick={copierJanvier}>
              Copier janvier sur tous les mois
            </button>
            {moisCorriges && (
              <button type="button" className="bouton bouton-secondaire" onClick={() => setMoisCorriges(null)}>
                Revenir au calcul automatique
              </button>
            )}
          </div>
        </details>
      </main>

      <PiedDePage onPrecedent={() => setQuestion(1)}>
        <BandeauConfidentialite />
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={!saisiesQ2Valides || moisImpossibles.length > 0 || t.travailles === 0}
          onClick={valider}
        >
          Continuer
        </button>
      </PiedDePage>

      <FicheAide fiche={fiche} ouverte={aide !== null} onFermer={() => setAide(null)} />
    </div>
  );
}

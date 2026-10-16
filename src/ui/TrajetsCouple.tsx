// Ajout n° 1 — Écran « Vos trajets à deux » : motif « emploi du conjoint » proposé, voiture commune,
// même lieu de travail, et jours faits ensemble (seul le conducteur déduit).
import { useState } from "react";
import type { Parametres } from "../moteur/types";
import { ETAPES } from "../parcours/etapes";
import { completerFiche, FICHES } from "../parcours/fichesAide";
import { minuscule, nomProfil, type Profil } from "../parcours/profils";
import { lireEntier } from "../parcours/saisie";
import {
  deuxAuDelaDuPlafond,
  memeLieuPressenti,
  motifConjointAProposer,
  type Conducteur,
  type SaisieTrajetsCouple,
} from "../parcours/trajetsCouple";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

interface Props {
  parametres: Parametres;
  profils: Profil[];
  valeurInitiale?: SaisieTrajetsCouple;
  /** Retient le motif « emploi du conjoint » sur le trajet du profil indiqué. */
  onMotifConjoint: (index: number) => void;
  onValider: (s: SaisieTrajetsCouple) => void;
  onRetour: () => void;
}

const ouiNon = (v: boolean | undefined) => (v === undefined ? undefined : v ? "oui" : "non");

export function TrajetsCouple({ parametres: p, profils, valeurInitiale: v, onMotifConjoint, onValider, onRetour }: Props) {
  const [memeVoiture, setMemeVoiture] = useState(v?.memeVoiture);
  const [memeLieu, setMemeLieu] = useState(v?.memeLieu ?? (memeLieuPressenti(profils) ? true : undefined));
  const [organisation, setOrganisation] = useState(v?.organisation);
  const [jours, setJours] = useState(v?.joursEnsembleParSemaine !== undefined ? String(v.joursEnsembleParSemaine) : "");
  const [joursPrudent, setJoursPrudent] = useState(v?.joursEnsemblePrudent ?? false);
  const [conducteur, setConducteur] = useState<Conducteur | undefined>(v?.conducteur);
  const [conducteurPrudent, setConducteurPrudent] = useState(v?.conducteurPrudent ?? false);
  const [motifRefuse, setMotifRefuse] = useState(false);
  const [motifRetenu, setMotifRetenu] = useState<number | null>(null);
  const [aide, setAide] = useState(false);

  const conjoint = nomProfil(1, profils[1]);
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  const joursPrudents = Number(p.valeurs_prudentes_je_ne_sais_pas.covoiturage_conjoints_jours_par_semaine);
  const motif = motifRefuse ? null : motifConjointAProposer(p, profils);
  const nbJours = lireEntier(jours);
  const joursValides = joursPrudent || (nbJours !== null && !Number.isNaN(nbJours) && nbJours >= 1 && nbJours <= 7);

  const ensemble = memeLieu && organisation === "ensemble";
  const peutValider =
    memeVoiture !== undefined &&
    memeLieu !== undefined &&
    (!memeLieu || organisation !== undefined) &&
    (!ensemble || (joursValides && (conducteur !== undefined || conducteurPrudent)));

  function valider() {
    onValider({
      memeVoiture,
      memeLieu,
      organisation: memeLieu ? organisation : undefined,
      ...(ensemble
        ? {
            joursEnsembleParSemaine: joursPrudent ? undefined : (nbJours ?? undefined),
            joursEnsemblePrudent: joursPrudent || undefined,
            conducteur: conducteurPrudent ? undefined : conducteur,
            conducteurPrudent: conducteurPrudent || undefined,
          }
        : {}),
    });
  }

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Vos trajets à deux" etape={ETAPES.length - 1} total={ETAPES.length} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">Vos trajets à deux</h1>
        <p className="texte-secondaire sous-question">
          {typographie(`Quelques questions sur la façon dont vous et ${minuscule(conjoint)} allez travailler, pour que chaque kilomètre ne soit compté qu'une fois.`)}
        </p>

        {motif !== null && (
          <section className="carte" aria-labelledby="titre-motif-conjoint">
            <h2 id="titre-motif-conjoint">{typographie("Un motif possible pour la distance réelle")}</h2>
            <p className="detail-calcul">
              {typographie(
                `${motif === 0 ? "Votre trajet dépasse" : `Le trajet de ${minuscule(conjoint)} dépasse`} ${plafond} km, et ${motif === 0 ? minuscule(conjoint) : "vous"} travaille${motif === 0 ? "" : "z"} à ${profils[1 - motif].trajet?.allerKm} km. Le motif « emploi du conjoint » permet de retenir toute la distance.`,
              )}
            </p>
            <button type="button" className="bouton bouton-principal" onClick={() => (onMotifConjoint(motif), setMotifRetenu(motif))}>
              Retenir ce motif
            </button>
            <button type="button" className="bouton bouton-secondaire" onClick={() => setMotifRefuse(true)}>
              Non merci
            </button>
          </section>
        )}
        {motifRetenu !== null && (
          <Encadre>
            {typographie(
              `Motif « emploi du conjoint » retenu : la distance réelle ${motifRetenu === 0 ? "de votre trajet" : `du trajet de ${minuscule(conjoint)}`} est comptée. Il figurera dans le texte à recopier.`,
            )}
          </Encadre>
        )}
        {deuxAuDelaDuPlafond(p, profils) && (
          <Encadre>{typographie(`Vos deux trajets dépassent ${plafond} km : chacun est ramené à ${plafond} km, sauf autre motif à indiquer à l'étape du trajet.`)}</Encadre>
        )}

        <h2 className="titre-question" style={{ fontSize: "var(--taille-titre)" }}>
          Utilisez-vous la même voiture tous les deux ?
        </h2>
        <ChoixUnique
          nom="meme-voiture"
          legende="Utilisez-vous la même voiture tous les deux ?"
          options={[
            { valeur: "non", libelle: "Non, chacun la sienne" },
            { valeur: "oui", libelle: "Oui, une seule voiture pour nous deux" },
          ]}
          valeur={ouiNon(memeVoiture)}
          onChoix={(x) => setMemeVoiture(x === "oui")}
        />
        {memeVoiture && (
          <Encadre>{typographie("Vous utilisez tous les deux la même voiture. Les textes officiels ne précisent pas ce cas : nous appliquons la règle la plus prudente.")}</Encadre>
        )}

        <h2 className="titre-question" style={{ fontSize: "var(--taille-titre)" }}>
          {typographie(`Travaillez-vous au même endroit que ${minuscule(conjoint)}, ou tout près ?`)}
        </h2>
        <ChoixUnique
          nom="meme-lieu"
          legende="Travaillez-vous au même endroit, ou tout près ?"
          options={[
            { valeur: "non", libelle: "Non" },
            { valeur: "oui", libelle: "Oui" },
          ]}
          valeur={ouiNon(memeLieu)}
          onChoix={(x) => setMemeLieu(x === "oui")}
        />

        {memeLieu && (
          <section className="carte" aria-labelledby="titre-point-ensemble">
            <h2 id="titre-point-ensemble">Un point à vérifier ensemble</h2>
            {memeVoiture === false ? (
              <>
                <p>
                  {typographie(
                    "Vous travaillez tous les deux au même endroit et vous déclarez chacun votre voiture. C'est tout à fait possible si vous partez chacun de votre côté, avec vos propres horaires.",
                  )}
                </p>
                <p>
                  {typographie(
                    "En revanche, les jours où vous faites la route ensemble, une seule voiture roule : un seul trajet peut être déduit, celui du conducteur. Compter les deux trajets ces jours-là reviendrait à déclarer deux fois le même déplacement, et l'administration fiscale peut le corriger, avec des intérêts de retard.",
                  )}
                </p>
                <p>{typographie("Pour que votre déclaration soit juste et sans risque, dites-nous simplement comment vous vous organisez.")}</p>
              </>
            ) : (
              <p>
                {typographie(
                  "Les jours où vous faites la route ensemble, un seul trajet peut être déduit, celui du conducteur. Dites-nous comment vous vous organisez.",
                )}
              </p>
            )}
            <ChoixUnique
              nom="organisation"
              legende="Comment vous organisez-vous ?"
              options={[
                {
                  valeur: "separes",
                  libelle: memeVoiture ? "Nous ne faisons jamais la route ensemble" : "Nous partons toujours chacun avec notre voiture",
                },
                { valeur: "ensemble", libelle: "Nous faisons parfois la route ensemble" },
              ]}
              valeur={organisation}
              onChoix={(x) => setOrganisation(x as "separes" | "ensemble")}
            />
            {organisation === "separes" && (
              <p className="detail-calcul">
                {typographie("Gardez de quoi le montrer : carnets de bord, tickets ou relevés de péage de chaque badge.")}
              </p>
            )}
          </section>
        )}

        {ensemble && (
          <>
            <div className="question-titre">
              <h2 className="titre-question" style={{ fontSize: "var(--taille-titre)" }}>
                Combien de jours par semaine faites-vous la route ensemble, en moyenne ?
              </h2>
              <BoutonAsterisque onClick={() => setAide(true)} />
            </div>
            {joursPrudent ? (
              <Encadre>
                {typographie(`Nous retenons ${joursPrudents} jour par semaine, la valeur la plus prudente. Elle sera signalée dans votre récapitulatif.`)}
              </Encadre>
            ) : (
              <ChampNombre compact libelle="Jours par semaine ensemble" unite="jours" valeur={jours} onChange={setJours} />
            )}
            {!joursPrudent && <LienJeNeSaisPas onClick={() => setJoursPrudent(true)} />}

            <h2 className="titre-question" style={{ fontSize: "var(--taille-titre)" }}>
              Qui conduit ces jours-là ?
            </h2>
            {conducteurPrudent ? (
              <Encadre>{typographie("Nous retenons celui qui a le plus long trajet comme conducteur : l'autre ne déduit rien ces jours-là. C'est le choix le plus prudent.")}</Encadre>
            ) : (
              <ChoixUnique
                nom="conducteur"
                legende="Qui conduit ces jours-là ?"
                options={[
                  { valeur: "vous", libelle: "Moi" },
                  { valeur: "conjoint", libelle: conjoint === "Votre conjoint" ? "Mon conjoint" : conjoint },
                  { valeur: "alternance", libelle: "Chacun à tour de rôle", detail: "La moitié des jours chacun." },
                ]}
                valeur={conducteur}
                onChoix={(x) => setConducteur(x as Conducteur)}
              />
            )}
            {!conducteurPrudent && <LienJeNeSaisPas onClick={() => setConducteurPrudent(true)} />}
            <Encadre>{typographie("Les jours faits ensemble, le passager ne déduit ni kilomètres, ni péage, ni parking. Le conducteur déduit son trajet comme d'habitude.")}</Encadre>
          </>
        )}
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" disabled={!peutValider} onClick={valider}>
          Continuer
        </button>
      </PiedDePage>
      {aide && <FicheAide fiche={completerFiche(FICHES.covoiturageConjoint, { joursPrudents })} ouverte onFermer={() => setAide(false)} />}
    </div>
  );
}

// Étape 3 : votre trajet (F3). Une question par écran ; le moteur calcule le bilan à la fin.
import { ConseilsMetier } from "./QuestionsMetier";
import { AideKilometresSoins, ReglesSoinsDomicile } from "./AideKilometres";
import { useState } from "react";
import { calculerDeclarant } from "../moteur/declarant";
import type { Parametres } from "../moteur/types";
import { libelleEtape } from "../parcours/etapes";
import { joursSurSiteParEmployeur, nomEmployeur, periode, type Employeur } from "../parcours/employeurs";
import { completerFiche, FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import { lireEntier, lireMontant } from "../parcours/saisie";
import {
  ENERGIES,
  estVehicule,
  libelleLigne,
  lignePrudente,
  MODES,
  motifsDistance,
  optionsPuissance,
  vehiculePourMoteur,
  type ModeTrajet,
  type SaisieTrajet,
} from "../parcours/trajet";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

type Question = "mode" | "distance" | "paiement" | "energie" | "puissance" | "frais" | "bilan";

interface Props {
  parametres: Parametres;
  joursSurSite: number;
  /** Foyer connu : sans conjoint, le motif « emploi du conjoint » n'est pas proposé. */
  couple?: boolean;
  /** F12 — Employeurs de l'année (deux ou plus) et jours sur site de chaque mois, pour un trajet par employeur. */
  employeurs?: Employeur[];
  siteParMois?: number[];
  valeurInitiale?: SaisieTrajet;
  onValider: (trajet: SaisieTrajet) => void;
  onRetour: () => void;
  /** F14 — Conseils du métier, en tête des deux premières questions. */
  conseils?: string[];
  /** F14 — Soins à domicile (SSIAD, HAD) : trajets saisis par leur total annuel. */
  totalAnnuelConseille?: boolean;
}

const nombreOuZero = (n: number | null) => (n === null || Number.isNaN(n) ? 0 : n);
const valide = (n: number | null) => n === null || !Number.isNaN(n);

export function Trajet({ parametres: p, joursSurSite, couple, employeurs, siteParMois, valeurInitiale: v, onValider, onRetour, conseils, totalAnnuelConseille }: Props) {
  // Employeurs changés depuis la dernière saisie : on repasse par les distances.
  const employeursAJour = !employeurs || employeurs.length < 2 || v?.kmAnnuel !== undefined || v?.employeurs?.length === employeurs.length;
  const [question, setQuestion] = useState<Question>(v ? (employeursAJour ? "bilan" : "distance") : "mode");
  const [mode, setMode] = useState<ModeTrajet | undefined>(v?.mode);
  const [distance, setDistance] = useState(v?.allerKm ? String(v.allerKm) : "");
  const [parTotal, setParTotal] = useState(v ? v.kmAnnuel !== undefined : Boolean(totalAnnuelConseille));
  // F12 : une distance et des jours sur site par employeur, jours pré-remplis d'après les mois de chacun.
  const listeEmployeurs = employeurs && employeurs.length > 1 ? employeurs : null;
  const memesEmployeurs = listeEmployeurs !== null && v?.employeurs?.length === listeEmployeurs.length;
  const [distancesEmp, setDistancesEmp] = useState<string[]>(
    listeEmployeurs ? listeEmployeurs.map((_, i) => (memesEmployeurs ? String(v!.employeurs![i].allerKm || "") : "")) : [],
  );
  const [joursEmp, setJoursEmp] = useState<string[]>(
    listeEmployeurs
      ? memesEmployeurs
        ? v!.employeurs!.map((e) => String(e.joursSurSite))
        : joursSurSiteParEmployeur(listeEmployeurs, siteParMois ?? []).map(String)
      : [],
  );
  const [total, setTotal] = useState(v?.kmAnnuel ? String(v.kmAnnuel) : "");
  const [guideDistance, setGuideDistance] = useState(false);
  const [motif, setMotif] = useState<string | undefined>(v ? (v.motifDistance ?? "aucun") : undefined);
  const [energie, setEnergie] = useState<SaisieTrajet["energie"] | undefined>(v?.energie);
  const [energiePrudente, setEnergiePrudente] = useState(v?.energiePrudente ?? false);
  const [ligne, setLigne] = useState<string | undefined>(v?.ligne);
  const [puissancePrudente, setPuissancePrudente] = useState(v?.puissancePrudente ?? false);
  const [avecMissions, setAvecMissions] = useState(Boolean(v?.kmMissions));
  const [missions, setMissions] = useState(v?.kmMissions ? String(v.kmMissions) : "");
  const [avecPeages, setAvecPeages] = useState(Boolean(v?.peagesParking));
  const [peages, setPeages] = useState(v?.peagesParking ? String(v.peagesParking) : "");
  const [avecCredit, setAvecCredit] = useState(Boolean(v?.interetsCredit));
  const [interets, setInterets] = useState(v?.interetsCredit ? String(v.interetsCredit) : "");
  const [kmCompteur, setKmCompteur] = useState(v?.kmTotauxCompteur ? String(v.kmTotauxCompteur) : "");
  // Ajout n° 1 — Covoiturage hors du foyer : passager (somme payée) ou conducteur (participations reçues).
  const [montantPaye, setMontantPaye] = useState(v?.montantPaye ? String(v.montantPaye) : "");
  const [montantPayePrudent, setMontantPayePrudent] = useState(v?.mode === "covoiturage" && v.montantPaye === null);
  const [avecCovoit, setAvecCovoit] = useState(Boolean(v?.covoiturage));
  const [participations, setParticipations] = useState(v?.covoiturage?.participations ? String(v.covoiturage.participations) : "");
  const [participationsPrudentes, setParticipationsPrudentes] = useState(v?.covoiturage?.participations === null);
  const [joursCovoit, setJoursCovoit] = useState(v?.covoiturage?.joursParSemaine ? String(v.covoiturage.joursParSemaine) : "");
  const [joursCovoitPrudent, setJoursCovoitPrudent] = useState(v?.covoiturage?.participations === null && v.covoiturage.joursParSemaine === null);
  // F14 soignant — Soins à domicile : aide au calcul du total, indemnités kilométriques reçues (montant obligatoire).
  const [aideKm, setAideKm] = useState(false);
  const [ikRecues, setIkRecues] = useState<boolean | undefined>(v?.indemnitesKmRecues !== undefined ? v.indemnitesKmRecues > 0 : undefined);
  const [ik, setIk] = useState(v?.indemnitesKmRecues ? String(v.indemnitesKmRecues) : "");
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("votre trajet");
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  const allerKm = lireEntier(distance);
  const plusieurs = listeEmployeurs !== null && !parTotal && mode !== "covoiturage";
  const distancesEmpNb = distancesEmp.map(lireEntier);
  const joursEmpNb = joursEmp.map(lireEntier);
  const auDelaDuPlafond = plusieurs
    ? distancesEmpNb.some((d) => d !== null && !Number.isNaN(d) && d > plafond)
    : allerKm !== null && !Number.isNaN(allerKm) && allerKm > plafond;
  const kmTotal = lireEntier(total);

  function saisie(): SaisieTrajet {
    return {
      mode: mode!,
      allerKm: parTotal || plusieurs ? 0 : nombreOuZero(allerKm),
      ...(plusieurs
        ? { employeurs: distancesEmpNb.map((d, i) => ({ allerKm: nombreOuZero(d), joursSurSite: nombreOuZero(joursEmpNb[i]) })) }
        : {}),
      motifDistance: (parTotal || auDelaDuPlafond) && motif && motif !== "aucun" ? motif : undefined,
      ...(parTotal ? { kmAnnuel: nombreOuZero(kmTotal) } : {}),
      energie: energie ?? "thermique",
      energiePrudente,
      ligne: mode === "cyclomoteur" ? undefined : ligne,
      puissancePrudente,
      kmMissions: avecMissions && !parTotal ? nombreOuZero(lireEntier(missions)) : 0,
      peagesParking: avecPeages ? nombreOuZero(lireMontant(peages)) : 0,
      interetsCredit: avecCredit ? nombreOuZero(lireMontant(interets)) : 0,
      kmTotauxCompteur: avecCredit ? nombreOuZero(lireEntier(kmCompteur)) || undefined : undefined,
      ...(totalAnnuelConseille && mode && estVehicule(mode) ? { indemnitesKmRecues: ikRecues ? nombreOuZero(lireMontant(ik)) : 0 } : {}),
      ...(mode === "covoiturage" ? { montantPaye: montantPayePrudent ? null : nombreOuZero(lireMontant(montantPaye)) } : {}),
      ...(mode && estVehicule(mode) && avecCovoit
        ? {
            covoiturage: {
              participations: participationsPrudentes ? null : nombreOuZero(lireMontant(participations)),
              joursParSemaine: participationsPrudentes && !joursCovoitPrudent ? nombreOuZero(lireEntier(joursCovoit)) : null,
            },
          }
        : {}),
    };
  }

  // Ordre des questions selon le mode de transport.
  const suite: Question[] =
    mode === "voiture" || mode === "moto"
      ? ["mode", "distance", "energie", "puissance", "frais", "bilan"]
      : mode === "cyclomoteur"
        ? ["mode", "distance", "energie", "frais", "bilan"]
        : mode === "covoiturage"
          ? ["mode", "distance", "paiement", "bilan"]
          : ["mode", "bilan"];
  const rang = suite.indexOf(question);
  const avancer = () => setQuestion(suite[rang + 1]);
  const reculer = () => (rang <= 0 ? onRetour() : setQuestion(suite[rang - 1]));

  const ficheConducteur = completerFiche(FICHES.covoituragePaiements, {
    siIntrouvable: "Choisissez « Je ne sais pas » : les jours de covoiturage ne seront pas déduits. C'est le choix le plus prudent.",
  });

  let titre = "";
  let contenu: JSX.Element;
  let peutContinuer = true;
  let libelleBouton = "Continuer";

  switch (question) {
    case "mode":
      titre = "Comment allez-vous à votre travail ?";
      peutContinuer = mode !== undefined;
      contenu = (
        <>
          <p className="texte-secondaire sous-question">Le moyen que vous utilisez le plus souvent.</p>
          <ChoixUnique
            nom="mode"
            legende={titre}
            options={MODES}
            valeur={mode}
            onChoix={(x) => {
              if (x !== mode) {
                // Autre véhicule : énergie et puissance sont à redemander.
                setEnergie(undefined);
                setEnergiePrudente(false);
                setLigne(undefined);
                setPuissancePrudente(false);
              }
              setMode(x as ModeTrajet);
            }}
          />
        </>
      );
      break;

    case "distance":
      if (parTotal) {
        titre = "Combien de kilomètres avez-vous faits pour le travail dans l'année ?";
        peutContinuer = kmTotal !== null && !Number.isNaN(kmTotal) && kmTotal > 0 && motif !== undefined;
        contenu = (
          <>
            <ChampNombre
              libelle={titre}
              unite="km"
              valeur={total}
              onChange={setTotal}
              detail="Avec ce véhicule : trajets maison-travail et déplacements pour le travail non remboursés."
            />
            <Encadre>
              {typographie(
                `Nous appliquons le barème officiel à ce total. Sans raison particulière, chaque trajet maison-travail compte au plus ${plafond} km aller.`,
              )}
            </Encadre>
            {totalAnnuelConseille && (
              <>
                <ReglesSoinsDomicile parametres={p} />
                {aideKm ? (
                  <AideKilometresSoins parametres={p} joursSurSite={joursSurSite} onUtiliser={(km) => (setTotal(String(km)), setAideKm(false))} />
                ) : (
                  <button type="button" className="lien-je-ne-sais-pas" onClick={() => setAideKm(true)}>
                    Je ne connais pas mon total : m'aider à le calculer
                  </button>
                )}
              </>
            )}
            <ChoixUnique
              nom="motif"
              legende="Raison de la distance"
              options={[
                {
                  valeur: "aucun",
                  libelle: `Mon trajet fait ${plafond} km ou moins, ou j'ai déjà limité à ${plafond} km`,
                },
                ...motifsDistance(couple),
              ]}
              valeur={motif}
              onChoix={setMotif}
            />
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => setParTotal(false)}>
              Calculer plutôt avec ma distance
            </button>
          </>
        );
        break;
      }
      titre = plusieurs
        ? "Combien de kilomètres entre chez vous et chacun de vos travails, aller simple ?"
        : "Combien de kilomètres entre chez vous et votre travail, aller simple ?";
      peutContinuer = plusieurs
        ? distancesEmpNb.every((d) => d !== null && !Number.isNaN(d) && d >= 0) &&
          distancesEmpNb.some((d) => (d ?? 0) > 0) &&
          joursEmpNb.every((j) => j !== null && !Number.isNaN(j)) &&
          (!auDelaDuPlafond || motif !== undefined)
        : allerKm !== null && !Number.isNaN(allerKm) && allerKm > 0 && (!auDelaDuPlafond || motif !== undefined);
      contenu = (
        <>
          {plusieurs ? (
            <>
              {listeEmployeurs!.map((e, i) => (
                <section key={i} className="carte" aria-labelledby={`trajet-employeur-${i}`}>
                  <h2 id={`trajet-employeur-${i}`}>
                    {nomEmployeur(e, i)} <small className="choix-detail">{periode(e)}</small>
                  </h2>
                  <ChampNombre
                    compact
                    libelleVisible
                    libelle="Distance aller simple"
                    detail="0 si vous n'y alliez pas avec ce véhicule."
                    unite="km"
                    valeur={distancesEmp[i]}
                    onChange={(t) => setDistancesEmp(distancesEmp.map((x, k) => (k === i ? t : x)))}
                  />
                  <ChampNombre
                    compact
                    libelleVisible
                    libelle="Jours sur site chez cet employeur"
                    detail="Pré-rempli d'après vos jours et la période de cet employeur. Corrigez si besoin."
                    unite="jours"
                    valeur={joursEmp[i]}
                    onChange={(t) => setJoursEmp(joursEmp.map((x, k) => (k === i ? t : x)))}
                  />
                </section>
              ))}
              <Encadre>
                {typographie(
                  "Nous additionnons les kilomètres de tous vos employeurs avant d'appliquer le barème. Un trajet direct d'un employeur à l'autre dans la même journée se compte dans « trajets pour mon travail », à la question suivante.",
                )}
              </Encadre>
            </>
          ) : (
            <ChampNombre libelle={titre} unite="km" valeur={distance} onChange={setDistance} />
          )}
          {mode !== "covoiturage" && (
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setParTotal(true), setMotif(undefined))}>
              J'ai déjà calculé mes kilomètres de l'année
            </button>
          )}
          {!guideDistance ? (
            <LienJeNeSaisPas onClick={() => setGuideDistance(true)} />
          ) : (
            <Encadre>{typographie(FICHES.distance.ouRegarder + " " + FICHES.distance.siIntrouvable)}</Encadre>
          )}
          {auDelaDuPlafond && (
            <>
              <Encadre ton="attention">
                {typographie(`Au-delà de ${plafond} km, il faut une raison. Choisissez la vôtre, on l'écrira pour vous.`)}
              </Encadre>
              <ChoixUnique
                nom="motif"
                legende="Raison de la distance"
                options={[
                  ...motifsDistance(couple),
                  {
                    valeur: "aucun",
                    libelle: `Aucune de ces raisons : compter ${plafond} km`,
                  },
                ]}
                valeur={motif}
                onChoix={setMotif}
              />
            </>
          )}
        </>
      );
      break;

    case "paiement": {
      titre = "Combien avez-vous payé au conducteur dans l'année ?";
      const m = lireMontant(montantPaye);
      peutContinuer = montantPayePrudent || (m !== null && !Number.isNaN(m) && m > 0);
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Le total de vos participations pour aller au travail et en revenir. Gardez l'historique des paiements.")}
          </p>
          {montantPayePrudent ? (
            <Encadre>{typographie("Rien ne sera déduit pour le covoiturage, le choix le plus prudent. Vous pourrez l'ajouter plus tard.")}</Encadre>
          ) : (
            <ChampMontant libelle={titre} valeur={montantPaye} onChange={setMontantPaye} />
          )}
          {montantPayePrudent ? (
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => setMontantPayePrudent(false)}>
              Finalement, je connais le montant
            </button>
          ) : (
            <LienJeNeSaisPas onClick={() => setMontantPayePrudent(true)} />
          )}
          <Encadre>
            {typographie(
              `Depuis 2022, le passager d'un covoiturage peut déduire ce qu'il paie au conducteur. Au-delà de ${plafond} km sans raison particulière, nous retenons la somme au prorata de ${plafond} km.`,
            )}
          </Encadre>
        </>
      );
      break;
    }

    case "energie": {
      titre = mode === "voiture" ? "Quelle énergie utilise votre voiture ?" : "Quelle énergie utilise votre deux-roues ?";
      const options = mode === "voiture" ? ENERGIES : ENERGIES.filter((e) => e.valeur === "essence" || e.valeur === "électrique");
      peutContinuer = energie !== undefined;
      contenu = (
        <>
          {energiePrudente ? (
            <Encadre>
              {typographie(
                "Nous appliquons le barème des véhicules thermiques, le plus prudent. Il sera signalé dans votre récapitulatif.",
              )}
            </Encadre>
          ) : (
            <ChoixUnique
              nom="energie"
              legende={titre}
              options={options}
              valeur={energie}
              onChoix={(x) => setEnergie(x as SaisieTrajet["energie"])}
            />
          )}
          {energiePrudente ? (
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setEnergiePrudente(false), setEnergie(undefined))}>
              Finalement, je connais l'énergie
            </button>
          ) : (
            <LienJeNeSaisPas onClick={() => (setEnergiePrudente(true), setEnergie("thermique"))} />
          )}
          {energie === "électrique" && (
            <Encadre>
              {typographie("La recharge et la location de batterie sont déjà comprises dans le barème : ne les comptez pas en plus.")}
            </Encadre>
          )}
        </>
      );
      break;
    }

    case "puissance": {
      const type = mode as "voiture" | "moto";
      const options = optionsPuissance(p, type);
      const prudente = lignePrudente(p, type);
      titre = type === "voiture" ? "Combien de chevaux fait votre voiture ?" : "Combien de chevaux fait votre moto ?";
      peutContinuer = ligne !== undefined;
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("C'est la puissance fiscale, en CV. Elle est écrite sur votre carte grise.")}
          </p>
          <ChoixUnique
            nom="puissance"
            legende="Puissance fiscale"
            options={options}
            valeur={ligne}
            onChoix={(x) => (setLigne(x), setPuissancePrudente(false))}
          />
          {puissancePrudente ? (
            <Encadre>
              {typographie(
                `Nous retenons ${libelleLigne(
                  prudente,
                  options.map((o) => o.valeur),
                )}, la valeur la plus prudente. Elle sera signalée dans votre récapitulatif.`,
              )}
            </Encadre>
          ) : (
            <LienJeNeSaisPas onClick={() => (setLigne(prudente), setPuissancePrudente(true))} />
          )}
          {type === "voiture" && (
            <Encadre>
              {typographie(
                `Au-delà de ${p.deplacements.puissance_max_voiture_cv} CV, les impôts comptent ${p.deplacements.puissance_max_voiture_cv} CV. Vous n'avez rien à corriger.`,
              )}
            </Encadre>
          )}
        </>
      );
      break;
    }

    case "frais": {
      titre = "D'autres frais pour ce véhicule ?";
      const champs = [lireEntier(missions), lireMontant(peages), lireMontant(interets), lireEntier(kmCompteur), lireMontant(participations), lireEntier(joursCovoit)];
      const nbJoursCovoit = lireEntier(joursCovoit);
      const ikNb = lireMontant(ik);
      peutContinuer =
        (!totalAnnuelConseille || ikRecues === false || (ikRecues === true && ikNb !== null && !Number.isNaN(ikNb) && ikNb > 0)) &&
        champs.every(valide) &&
        (!avecCovoit ||
          (participationsPrudentes
            ? joursCovoitPrudent || (nbJoursCovoit !== null && nbJoursCovoit >= 1 && nbJoursCovoit <= 7)
            : lireMontant(participations) !== null));
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Cochez seulement ce qui vous concerne. Sans justificatif, laissez décoché : rien ne sera compté.")}
          </p>

          {totalAnnuelConseille && (
            <section className="carte" aria-labelledby="titre-ik">
              <div className="question-titre" style={{ alignItems: "center" }}>
                <h2 id="titre-ik" style={{ flex: 1 }}>
                  {typographie("Votre employeur vous a-t-il remboursé des kilomètres cette année ?")}
                </h2>
                <BoutonAsterisque
                  onClick={() =>
                    setAide({
                      ...FICHES.indemnitesKm,
                      ouRegarder:
                        "Sur votre bulletin de décembre, ligne « indemnités kilométriques » ou « frais de déplacement », colonne du cumul de l'année. Sans cumul, additionnez les montants de vos 12 bulletins.",
                      siIntrouvable:
                        "Demandez le cumul de l'année au service paie : ce montant est indispensable, car vos kilomètres remboursés sont comptés dans votre total.",
                    })
                  }
                />
              </div>
              <ChoixUnique
                nom="ik"
                legende="Indemnités kilométriques reçues"
                options={[
                  { valeur: "non", libelle: "Non" },
                  { valeur: "oui", libelle: "Oui", detail: "Ligne « indemnités kilométriques » ou « frais de déplacement » de vos bulletins." },
                ]}
                valeur={ikRecues === undefined ? undefined : ikRecues ? "oui" : "non"}
                onChoix={(x) => setIkRecues(x === "oui")}
              />
              {ikRecues && (
                <ChampMontant
                  compact
                  libelleVisible
                  libelle="Montant reçu dans l'année"
                  detail="Cumul de l'année sur votre bulletin de décembre. Il sera ajouté à votre salaire, puisque vos kilomètres sont tous comptés."
                  valeur={ik}
                  onChange={setIk}
                />
              )}
            </section>
          )}

          {!parTotal && (
            <label className="case-a-cocher">
              <input type="checkbox" checked={avecMissions} onChange={(e) => setAvecMissions(e.target.checked)} />
              Je fais aussi des trajets pour mon travail, non remboursés
            </label>
          )}
          {avecMissions && !parTotal && (
            <ChampNombre
              compact
              libelleVisible
              libelle="Kilomètres de ces trajets dans l'année"
              detail="Rendez-vous, chantiers, formations, avec ce véhicule."
              unite="km"
              valeur={missions}
              onChange={setMissions}
            />
          )}

          <label className="case-a-cocher">
            <input type="checkbox" checked={avecPeages} onChange={(e) => setAvecPeages(e.target.checked)} />
            Je paie des péages ou un parking pour aller travailler
          </label>
          {avecPeages && (
            <ChampMontant
              compact
              libelleVisible
              libelle="Total de l'année"
              detail="Seulement la part liée au travail."
              valeur={peages}
              onChange={setPeages}
            />
          )}

          <label className="case-a-cocher">
            <input type="checkbox" checked={avecCovoit} onChange={(e) => setAvecCovoit(e.target.checked)} />
            Je transporte des passagers qui participent aux frais
          </label>
          {avecCovoit && (
            <>
              <div className="question-titre" style={{ alignItems: "center" }}>
                <p style={{ flex: 1, margin: 0 }}>{typographie("Participations reçues dans l'année")}</p>
                <BoutonAsterisque onClick={() => setAide(ficheConducteur)} />
              </div>
              {participationsPrudentes ? (
                <>
                  <Encadre>
                    {typographie("Les jours de covoiturage ne seront pas déduits, le choix le plus prudent. Combien de jours par semaine transportez-vous des passagers ?")}
                  </Encadre>
                  {joursCovoitPrudent ? (
                    <Encadre>{typographie("Nous retirons tous vos jours de travail sur site : aucun trajet n'est déduit pour ce véhicule.")}</Encadre>
                  ) : (
                    <ChampNombre compact libelleVisible libelle="Jours de covoiturage par semaine" unite="jours" valeur={joursCovoit} onChange={setJoursCovoit} />
                  )}
                  {!joursCovoitPrudent && <LienJeNeSaisPas onClick={() => setJoursCovoitPrudent(true)} />}
                  <button
                    type="button"
                    className="lien-je-ne-sais-pas"
                    onClick={() => (setParticipationsPrudentes(false), setJoursCovoitPrudent(false))}
                  >
                    Finalement, je connais le montant
                  </button>
                </>
              ) : (
                <>
                  <ChampMontant
                    compact
                    libelle="Participations reçues dans l'année"
                    detail="Elles sont retirées de vos frais : seul ce qui reste à votre charge est déductible."
                    valeur={participations}
                    onChange={setParticipations}
                  />
                  <LienJeNeSaisPas onClick={() => setParticipationsPrudentes(true)} />
                </>
              )}
            </>
          )}

          <label className="case-a-cocher">
            <input type="checkbox" checked={avecCredit} onChange={(e) => setAvecCredit(e.target.checked)} />
            J'ai un crédit pour ce véhicule
          </label>
          {avecCredit && (
            <>
              <ChampMontant
                compact
                libelleVisible
                libelle="Intérêts payés dans l'année"
                detail="Colonne « intérêts » du tableau d'amortissement, pas les mensualités."
                valeur={interets}
                onChange={setInterets}
              />
              <ChampNombre
                compact
                libelleVisible
                libelle="Kilomètres parcourus dans l'année, au total"
                detail="Travail et vie privée : pour calculer la part liée au travail."
                unite="km"
                valeur={kmCompteur}
                onChange={setKmCompteur}
              />
            </>
          )}
        </>
      );
      break;
    }

    case "bilan": {
      libelleBouton = "Valider mon trajet";
      if (mode === "covoiturage") {
        const s = saisie();
        const r = calculerDeclarant(p, {
          numero: 1,
          salairePrerempli: 0,
          covoituragePassager: s.montantPaye ? { montantPaye: s.montantPaye, allerKm: s.allerKm, motifDistance: s.motifDistance } : undefined,
        });
        const ligne = r.lignes.find((l) => l.categorie === "vehicule");
        titre = "Vos frais de trajet";
        contenu = ligne ? (
          <>
            <section className="carte" aria-live="polite">
              <p className="resultat-jours">
                <strong className="montant">{ligne.montant.toLocaleString("fr-FR")} €</strong>
              </p>
              <p className="detail-calcul">{typographie(ligne.texte)}</p>
            </section>
            {r.alertes.map((a) => (
              <Encadre key={a} ton="attention">
                {typographie(a)}
              </Encadre>
            ))}
          </>
        ) : (
          <Encadre>{typographie("Rien n'est déduit pour le covoiturage tant que le montant payé n'est pas connu. Vos repas et vos autres frais comptent déjà.")}</Encadre>
        );
        break;
      }
      if (!mode || !estVehicule(mode)) {
        titre = "Votre trajet";
        contenu = (
          <Encadre>
            {typographie(
              mode === "transports"
                ? "Pas de frais de véhicule. Votre abonnement de transport se calcule à l'étape « Vos autres frais »."
                : "Pas de frais de véhicule à compter. Continuez : vos repas et vos autres frais comptent déjà.",
            )}
          </Encadre>
        );
        break;
      }
      const s = saisie();
      const vehicule = vehiculePourMoteur(p, s, joursSurSite)!;
      if (s.covoiturage?.participations) vehicule.participationsCovoiturage = s.covoiturage.participations;
      const resultat = calculerDeclarant(p, {
        numero: 1,
        salairePrerempli: 0,
        vehicules: [vehicule],
      });
      const lignes = resultat.lignes.filter((l) => l.montant > 0 || l.categorie === "vehicule");
      const prudences = [s.puissancePrudente && "puissance", s.energiePrudente && "énergie"].filter(Boolean);
      titre = "Vos frais de trajet";
      contenu = (
        <>
          <section className="carte" aria-live="polite">
            <p className="resultat-jours">
              <strong className="montant">{lignes.reduce((t, l) => t + l.montant, 0).toLocaleString("fr-FR")} €</strong>
            </p>
            {lignes.map((l) => (
              <p key={l.texte} className="detail-calcul">
                {typographie(l.texte)}
              </p>
            ))}
          </section>
          {resultat.alertes
            .filter((a) => !a.startsWith("Vos frais réels dépassent"))
            .map((a) => (
              <Encadre key={a} ton="attention">
                {typographie(a)}
              </Encadre>
            ))}
          {s.indemnitesKmRecues ? (
            <Encadre>{typographie(`Indemnités kilométriques à ajouter à votre salaire : ${s.indemnitesKmRecues.toLocaleString("fr-FR")} €.`)}</Encadre>
          ) : null}
          {s.covoiturage?.participations === null && (
            <Encadre>{typographie("Les jours de covoiturage seront retirés de ce calcul dans votre résultat.")}</Encadre>
          )}
          {prudences.length > 0 && (
            <Encadre>{typographie(`Valeur prudente retenue pour : ${prudences.join(" et ")}. Vous pourrez la corriger.`)}</Encadre>
          )}
          <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
            {typographie(
              parTotal
                ? "Calculé sur le total de kilomètres que vous avez indiqué. Gardez votre relevé ou votre carnet de bord."
                : `Calculé sur vos ${joursSurSite} jours sur site. Le barème s'applique au total des kilomètres de l'année.`,
            )}
          </p>
        </>
      );
      break;
    }
  }

  const fichePourQuestion: Partial<Record<Question, Fiche>> = {
    distance: FICHES.distance,
    paiement: completerFiche(FICHES.covoituragePaiements, {
      siIntrouvable: "Choisissez « Je ne sais pas » : rien ne sera déduit pour le covoiturage. C'est le choix le plus prudent, et vous pourrez l'ajouter plus tard.",
    }),
    energie: FICHES.energie,
    puissance:
      mode === "voiture" || mode === "moto"
        ? completerFiche(FICHES.puissance, {
            lignePrudente: libelleLigne(
              lignePrudente(p, mode),
              optionsPuissance(p, mode).map((o) => o.valeur),
            ),
          })
        : undefined,
  };
  const fiche = fichePourQuestion[question];

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={reculer} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <div className="question-titre">
          <h1 className="titre-question">{typographie(titre)}</h1>
          {fiche && <BoutonAsterisque onClick={() => setAide(fiche)} />}
        </div>
        {(question === "mode" || question === "distance") && <ConseilsMetier conseils={conseils} />}
        {contenu}
      </main>

      <PiedDePage onPrecedent={reculer}>
        <BandeauConfidentialite />
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={!peutContinuer}
          onClick={() => (question === "bilan" ? onValider(saisie()) : avancer())}
        >
          {libelleBouton}
        </button>
      </PiedDePage>

      {aide && <FicheAide fiche={aide} ouverte onFermer={() => setAide(null)} />}
    </div>
  );
}

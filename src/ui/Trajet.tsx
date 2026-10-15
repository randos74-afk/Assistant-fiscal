// Étape 3 : votre trajet (F3). Une question par écran ; le moteur calcule le bilan à la fin.
import { useState } from "react";
import { calculerDeclarant } from "../moteur/declarant";
import type { Parametres } from "../moteur/types";
import { libelleEtape } from "../parcours/etapes";
import { completerFiche, FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import { lireEntier, lireMontant } from "../parcours/saisie";
import {
  ENERGIES,
  estVehicule,
  libelleLigne,
  lignePrudente,
  MODES,
  MOTIFS_DISTANCE,
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

type Question = "mode" | "distance" | "energie" | "puissance" | "frais" | "bilan";

interface Props {
  parametres: Parametres;
  joursSurSite: number;
  valeurInitiale?: SaisieTrajet;
  onValider: (trajet: SaisieTrajet) => void;
  onRetour: () => void;
}

const nombreOuZero = (n: number | null) => (n === null || Number.isNaN(n) ? 0 : n);
const valide = (n: number | null) => n === null || !Number.isNaN(n);

export function Trajet({ parametres: p, joursSurSite, valeurInitiale: v, onValider, onRetour }: Props) {
  const [question, setQuestion] = useState<Question>("mode");
  const [mode, setMode] = useState<ModeTrajet | undefined>(v?.mode);
  const [distance, setDistance] = useState(v ? String(v.allerKm) : "");
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
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("votre trajet");
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  const allerKm = lireEntier(distance);
  const auDelaDuPlafond = allerKm !== null && !Number.isNaN(allerKm) && allerKm > plafond;

  function saisie(): SaisieTrajet {
    return {
      mode: mode!,
      allerKm: nombreOuZero(allerKm),
      motifDistance: auDelaDuPlafond && motif && motif !== "aucun" ? motif : undefined,
      energie: energie ?? "thermique",
      energiePrudente,
      ligne: mode === "cyclomoteur" ? undefined : ligne,
      puissancePrudente,
      kmMissions: avecMissions ? nombreOuZero(lireEntier(missions)) : 0,
      peagesParking: avecPeages ? nombreOuZero(lireMontant(peages)) : 0,
      interetsCredit: avecCredit ? nombreOuZero(lireMontant(interets)) : 0,
      kmTotauxCompteur: avecCredit ? nombreOuZero(lireEntier(kmCompteur)) || undefined : undefined,
    };
  }

  // Ordre des questions selon le mode de transport.
  const suite: Question[] =
    mode === "voiture" || mode === "moto"
      ? ["mode", "distance", "energie", "puissance", "frais", "bilan"]
      : mode === "cyclomoteur"
        ? ["mode", "distance", "energie", "frais", "bilan"]
        : ["mode", "bilan"];
  const rang = suite.indexOf(question);
  const avancer = () => setQuestion(suite[rang + 1]);
  const reculer = () => (rang <= 0 ? onRetour() : setQuestion(suite[rang - 1]));

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
      titre = "Combien de kilomètres entre chez vous et votre travail, aller simple ?";
      peutContinuer = allerKm !== null && !Number.isNaN(allerKm) && allerKm > 0 && (!auDelaDuPlafond || motif !== undefined);
      contenu = (
        <>
          <ChampNombre libelle={titre} unite="km" valeur={distance} onChange={setDistance} />
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
                options={[...MOTIFS_DISTANCE, { valeur: "aucun", libelle: `Aucune de ces raisons : compter ${plafond} km` }]}
                valeur={motif}
                onChoix={setMotif}
              />
            </>
          )}
        </>
      );
      break;

    case "energie": {
      titre = mode === "voiture" ? "Quelle énergie utilise votre voiture ?" : "Quelle énergie utilise votre deux-roues ?";
      const options = mode === "voiture" ? ENERGIES : ENERGIES.filter((e) => e.valeur === "essence" || e.valeur === "électrique");
      peutContinuer = energie !== undefined;
      contenu = (
        <>
          {energiePrudente ? (
            <Encadre>
              {typographie("Nous appliquons le barème des véhicules thermiques, le plus prudent. Il sera signalé dans votre récapitulatif.")}
            </Encadre>
          ) : (
            <ChoixUnique nom="energie" legende={titre} options={options} valeur={energie} onChoix={(x) => setEnergie(x as SaisieTrajet["energie"])} />
          )}
          {energiePrudente ? (
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => (setEnergiePrudente(false), setEnergie(undefined))}>
              Finalement, je connais l'énergie
            </button>
          ) : (
            <LienJeNeSaisPas onClick={() => (setEnergiePrudente(true), setEnergie("thermique"))} />
          )}
          {energie === "électrique" && (
            <Encadre>{typographie("La recharge et la location de batterie sont déjà comprises dans le barème : ne les comptez pas en plus.")}</Encadre>
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
          <ChoixUnique nom="puissance" legende="Puissance fiscale" options={options} valeur={ligne} onChoix={(x) => (setLigne(x), setPuissancePrudente(false))} />
          {puissancePrudente ? (
            <Encadre>
              {typographie(`Nous retenons ${libelleLigne(prudente, options.map((o) => o.valeur))}, la valeur la plus prudente. Elle sera signalée dans votre récapitulatif.`)}
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
      const champs = [lireEntier(missions), lireMontant(peages), lireMontant(interets), lireEntier(kmCompteur)];
      peutContinuer = champs.every(valide);
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Cochez seulement ce qui vous concerne. Sans justificatif, laissez décoché : rien ne sera compté.")}
          </p>

          <label className="case-a-cocher">
            <input type="checkbox" checked={avecMissions} onChange={(e) => setAvecMissions(e.target.checked)} />
            Je fais aussi des trajets pour mon travail, non remboursés
          </label>
          {avecMissions && (
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
            <ChampMontant compact libelleVisible libelle="Total de l'année" detail="Seulement la part liée au travail." valeur={peages} onChange={setPeages} />
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
      if (!mode || !estVehicule(mode)) {
        titre = "Votre trajet";
        contenu = (
          <Encadre>
            {typographie(
              mode === "transports"
                ? "Le calcul de l'abonnement de transport arrive bientôt. Continuez : vos repas et vos autres frais comptent déjà."
                : "Pas de frais de véhicule à compter. Continuez : vos repas et vos autres frais comptent déjà.",
            )}
          </Encadre>
        );
        break;
      }
      const s = saisie();
      const resultat = calculerDeclarant(p, { numero: 1, salairePrerempli: 0, vehicules: [vehiculePourMoteur(p, s, joursSurSite)!] });
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
          {prudences.length > 0 && (
            <Encadre>{typographie(`Valeur prudente retenue pour : ${prudences.join(" et ")}. Vous pourrez la corriger.`)}</Encadre>
          )}
          <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
            {typographie(`Calculé sur vos ${joursSurSite} jours sur site. Le barème s'applique au total des kilomètres de l'année.`)}
          </p>
        </>
      );
      break;
    }
  }

  const fichePourQuestion: Partial<Record<Question, Fiche>> = {
    distance: FICHES.distance,
    energie: FICHES.energie,
    puissance:
      mode === "voiture" || mode === "moto"
        ? completerFiche(FICHES.puissance, { lignePrudente: libelleLigne(lignePrudente(p, mode), optionsPuissance(p, mode).map((o) => o.valeur)) })
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
        {contenu}
      </main>

      <PiedDePage>
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

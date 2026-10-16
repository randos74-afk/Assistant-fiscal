// Parcours FraisFit : accueil, filtrage, seul ou en couple, métier, sept étapes par profil, relecture et résultat.
import { useEffect, useState, type ReactNode } from "react";
import { chargerParametres, millesimesDisponibles } from "./moteur/parametres";
import { calculerParcours, valeursPrudentes } from "./parcours/assemblage";
import { postesDuProfil } from "./parcours/autresFrais";
import { totaux } from "./parcours/calendrier";
import { QUESTIONS_FILTRAGE, type Reponses as ReponsesFiltrage } from "./parcours/filtrage";
import { profil as profilMetier } from "./parcours/metiers";
import { estVehicule } from "./parcours/trajet";
import { Accueil } from "./ui/Accueil";
import { AutresFrais } from "./ui/AutresFrais";
import { Filtrage } from "./ui/Filtrage";
import { Jours } from "./ui/Jours";
import { Metier } from "./ui/Metier";
import { Relecture, type EcranModifiable } from "./ui/Relecture";
import { Repas } from "./ui/Repas";
import { Resultat } from "./ui/Resultat";
import { ResultatFoyer } from "./ui/ResultatFoyer";
import { Salaire } from "./ui/Salaire";
import { charger, effacer, enregistrer, existeSauvegarde, telechargerDossier, type ContenuDossier, type Dossier } from "./ui/sauvegarde";
import { justificatifs } from "./parcours/justificatifs";
import { autresRevenusFoyer, type SaisieFoyer } from "./parcours/foyer";
import { comparerImpot } from "./moteur/impot";
import { ouvrirPdf } from "./ui/pdf";
import { Teletravail } from "./ui/Teletravail";
import { Trajet } from "./ui/Trajet";
import { Domicile } from "./ui/Domicile";
import { EstimationImpot } from "./ui/EstimationImpot";
import { CONFIGURATION, doitAfficherConditions, enregistrerAcceptation, lireAcceptation } from "./parcours/conditions";
import { AvantDeCommencer, LectureConditions } from "./ui/Conditions";
import { donneesDeclarants, type DonneesDeclarant } from "./parcours/declarants";
import { PLACES_A_CHARGE, placesDeclarants, reponsesDuProfil, type ModeDeclaration, type Profil } from "./parcours/profils";
import { ChoixDeclaration, PassageConjoint, PersonnesACharge, SelecteurProfil } from "./ui/ModeFoyer";
import { resumeTrajetsCouple, trajetsCoupleApplicable, type SaisieTrajetsCouple } from "./parcours/trajetsCouple";
import { TrajetsCouple } from "./ui/TrajetsCouple";

type Ecran =
  | "accueil"
  | "filtrage"
  | "declaration"
  | "metier"
  | "conjoint"
  | "passageCharge"
  | "personnesACharge"
  | EcranModifiable
  | "relecture"
  | "resultat";

/** Écrans propres à un profil : le sélecteur « Vous / Votre conjoint » y est affiché en mode foyer. */
const ECRANS_DU_PROFIL: Ecran[] = ["metier", "salaire", "jours", "trajet", "repas", "teletravail", "autres"];

export default function App() {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [depuisRelecture, setDepuisRelecture] = useState(false);
  const [reponsesFiltrage, setReponsesFiltrage] = useState<ReponsesFiltrage>({});
  const [, setAussiEntreprise] = useState(false);
  // Ajout n° 1 — Seul ou en couple, un profil par déclarant, profil en cours de saisie.
  const [mode, setMode] = useState<ModeDeclaration | undefined>();
  const [profils, setProfils] = useState<Profil[]>([{}]);
  const [actif, setActif] = useState(0);
  const [foyer, setFoyer] = useState<SaisieFoyer | undefined>();
  const [trajetsCouple, setTrajetsCouple] = useState<SaisieTrajetsCouple | undefined>();
  // Ajout n° 3 — Acceptation des conditions (sur l'appareil) et lecture des conditions par l'adresse « #conditions ».
  const [acceptation, setAcceptation] = useState(lireAcceptation);
  const [conditionsOuvertes, setConditionsOuvertes] = useState(() => window.location.hash === "#conditions");
  useEffect(() => {
    const suivre = () => setConditionsOuvertes(window.location.hash === "#conditions");
    window.addEventListener("hashchange", suivre);
    return () => window.removeEventListener("hashchange", suivre);
  }, []);

  const millesime = millesimesDisponibles()[0];
  const parametres = chargerParametres(millesime);
  const enCouple = mode === "couple";
  const profilActif = profils[actif] ?? {};
  const { metier, salaire, jours, trajet, domicile, repas, teletravail, autres } = profilActif;
  const joursSurSite = jours ? totaux(jours.mois).site : 0;
  // Parcours aide à domicile : la journée type remplace le trajet.
  const estDomicile = metier === "domicile";

  /** Met à jour une réponse du profil en cours. */
  const maj =
    <K extends keyof Profil>(champ: K) =>
    (valeur: Profil[K]) =>
      setProfils((ps) => ps.map((pr, i) => (i === actif ? { ...pr, [champ]: valeur } : pr)));

  const contenu: ContenuDossier = { millesime, ecran, reponsesFiltrage, mode, profils, profilActif: actif, foyer, trajetsCouple };
  const ecranTrajetsCouple = enCouple && trajetsCoupleApplicable(profils);
  // Personnes à charge salariées : proposées s'il y a des enfants à charge dans le foyer.
  const places = placesDeclarants(mode, profils);
  const placesACharge = places.filter((i) => i >= 2);
  const etapeCharges = (foyer?.enfants ?? 0) > 0 || placesACharge.length > 0;
  const dernierAdulte = enCouple ? 1 : 0;

  // F9.3 — Sauvegarde automatique sur l'appareil dès que le parcours a commencé.
  useEffect(() => {
    if (mode !== undefined) enregistrer(contenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecran, mode, profils, actif, foyer, trajetsCouple]);

  function reprendre(d: Dossier) {
    setReponsesFiltrage(d.reponsesFiltrage ?? {});
    setMode(d.mode);
    setProfils(d.profils.length ? d.profils : [{}]);
    setActif(d.profilActif ?? 0);
    setFoyer(d.foyer);
    setTrajetsCouple(d.trajetsCouple);
    setDepuisRelecture(false);
    setEcran(d.mode ? (d.ecran as Ecran) : "filtrage");
  }

  const declarants = (): DonneesDeclarant[] => donneesDeclarants(parametres, mode, profils, foyer?.couple, trajetsCouple);

  function estimationImpot() {
    if (!foyer) return null;
    const c = calculerParcours(parametres, reponsesDuProfil(profils[0])).comparaison;
    const i = comparerImpot(parametres, c.baseAbattement10, c.baseFraisReels, autresRevenusFoyer(parametres, foyer), foyer);
    return { avecAbattement: i.avecAbattement.impot, avecFraisReels: i.avecFraisReels.impot, gain: i.gain };
  }

  function pdf(d: DonneesDeclarant): boolean {
    return ouvrirPdf({
      parametres,
      resultat: d.resultat,
      prudentes: valeursPrudentes(d.reponses),
      nonVerifiees: d.nonVerifiees.map((n) => n.valeur),
      justificatifs: justificatifs(d.reponses),
      date: new Date(),
      impot: enCouple ? null : estimationImpot(),
      numeroDeclarant: d.index + 1,
    });
  }

  /** Étape suivante, ou retour direct à la relecture si l'on corrigeait une réponse. */
  const suivant = (prochain: Ecran) => setEcran(depuisRelecture ? "relecture" : prochain);
  const precedent = (ecranPrecedent: Ecran) => () => setEcran(depuisRelecture ? "relecture" : ecranPrecedent);

  /** Aller à un écran pour un profil donné (relecture, « Vérifier maintenant »). */
  function corriger(e: EcranModifiable, profil: number) {
    setActif(profil);
    setDepuisRelecture(true);
    setEcran(e === "foyer" || e === "trajetsCouple" ? e : profils[profil]?.salaireSeulement ? "salaire" : e);
  }

  /** Après les adultes : trajets à deux, puis personnes à charge, puis relecture. */
  const apresAdultes = (): Ecran => (ecranTrajetsCouple ? "trajetsCouple" : etapeCharges ? "personnesACharge" : "relecture");

  /** Fin du parcours d'un profil : conjoint après vous en couple, puis étapes du foyer, sinon relecture. */
  function finDuProfil() {
    if (depuisRelecture) setEcran("relecture");
    else if (enCouple && actif === 0) {
      setActif(1);
      setEcran("conjoint");
    } else setEcran(actif >= 2 ? "personnesACharge" : apresAdultes());
  }

  /** Retour vers la fin du dernier adulte (ses autres frais, ou son salaire s'il n'a que cela). */
  function retourDernierAdulte() {
    setActif(dernierAdulte);
    setEcran(profils[dernierAdulte]?.salaireSeulement ? "salaire" : "autres");
  }

  function ajouterPersonneACharge() {
    const place = PLACES_A_CHARGE.find((i) => !placesACharge.includes(i))!;
    // La place 1 (conjoint) reste réservée, même vide pour une personne seule.
    setProfils((ps) => {
      const suite = [ps[0] ?? {}, ps[1] ?? {}, ...ps.slice(2)];
      suite[place] = {};
      return suite;
    });
    setActif(place);
    setEcran("passageCharge");
  }

  function retirerPersonneACharge(place: number) {
    // La personne suivante prend la place libérée (1CK puis 1DK).
    setProfils((ps) => [...ps.slice(0, place), ...ps.slice(place + 1)]);
    setActif(0);
  }

  function choisirMode(m: ModeDeclaration) {
    setMode(m);
    setProfils((ps) => [ps[0] ?? {}, ps[1] ?? {}, ...ps.slice(2)]);
    // La situation familiale suit la question d'entrée.
    setFoyer((f) => (f ? { ...f, couple: m === "couple", ...(m === "couple" ? { veuf: undefined, parentIsole: false } : {}) } : f));
    setActif(0);
    setEcran("metier");
  }

  /** Sélecteur de profil : un profil pas encore commencé passe par l'écran d'accueil de son profil. */
  function changerDeProfil(i: number) {
    const cible = profils[i] ?? {};
    setActif(i);
    if (i >= 1 && !cible.salaire && !cible.metier) setEcran(i === 1 ? "conjoint" : "passageCharge");
    else if (cible.salaireSeulement) setEcran("salaire");
    else if (!cible.metier) setEcran("metier");
  }

  function recommencer() {
    effacer(millesime);
    setReponsesFiltrage({});
    setMode(undefined);
    setProfils([{}]);
    setActif(0);
    setFoyer(undefined);
    setTrajetsCouple(undefined);
    setDepuisRelecture(false);
    setEcran("accueil");
  }

  if (conditionsOuvertes) {
    return (
      <LectureConditions
        onFermer={() => {
          history.replaceState(null, "", window.location.pathname + window.location.search);
          setConditionsOuvertes(false);
        }}
      />
    );
  }

  if (doitAfficherConditions(acceptation, CONFIGURATION.conditions.version)) {
    return (
      <AvantDeCommencer
        versionPrecedente={acceptation !== null}
        onAccepter={() => setAcceptation(enregistrerAcceptation(CONFIGURATION.conditions.version))}
      />
    );
  }

  /** En mode foyer, les écrans d'un profil portent le sélecteur ; la clé recharge l'écran au changement de profil. */
  const avecProfil = (contenuEcran: ReactNode) =>
    places.length > 1 && ECRANS_DU_PROFIL.includes(ecran) ? (
      <div className="avec-selecteur" key={actif}>
        <SelecteurProfil profils={profils} places={places} actif={actif} onChoix={changerDeProfil} />
        {contenuEcran}
      </div>
    ) : (
      contenuEcran
    );

  switch (ecran) {
    case "filtrage": {
      const dejaRepondu = Object.keys(reponsesFiltrage).length === QUESTIONS_FILTRAGE.length;
      return (
        <Filtrage
          millesime={millesime}
          reponsesInitiales={reponsesFiltrage}
          indiceInitial={dejaRepondu ? QUESTIONS_FILTRAGE.length - 1 : 0}
          onAccueil={() => setEcran("accueil")}
          onAccepte={(entreprise, r) => {
            setAussiEntreprise(entreprise);
            setReponsesFiltrage(r);
            setEcran("declaration");
          }}
        />
      );
    }

    case "declaration":
      return <ChoixDeclaration valeurInitiale={mode} onRetour={() => setEcran("filtrage")} onChoix={choisirMode} />;

    case "conjoint":
      return (
        <PassageConjoint
          valeurInitiale={profils[1]}
          onRetour={() => (setActif(0), setEcran("autres"))}
          onValider={(prenom, salaireSeulement) => {
            setProfils((ps) => ps.map((pr, i) => (i === 1 ? { ...pr, prenom: prenom || undefined, salaireSeulement } : pr)));
            setActif(1);
            setEcran(salaireSeulement ? "salaire" : "metier");
          }}
        />
      );

    case "passageCharge":
      return (
        <PassageConjoint
          key={actif}
          place={actif}
          valeurInitiale={profils[actif]}
          onRetour={() => setEcran("personnesACharge")}
          onValider={(prenom, salaireSeulement) => {
            setProfils((ps) => ps.map((pr, i) => (i === actif ? { ...pr, prenom: prenom || undefined, salaireSeulement } : pr)));
            setEcran(salaireSeulement ? "salaire" : "metier");
          }}
        />
      );

    case "personnesACharge":
      return (
        <PersonnesACharge
          profils={profils}
          places={placesACharge}
          onAjouter={ajouterPersonneACharge}
          onModifier={(i) => (setActif(i), setDepuisRelecture(false), setEcran("passageCharge"))}
          onRetirer={retirerPersonneACharge}
          onRetour={() => (ecranTrajetsCouple ? setEcran("trajetsCouple") : retourDernierAdulte())}
          onContinuer={() => (setDepuisRelecture(false), setEcran("relecture"))}
        />
      );

    case "metier":
      return avecProfil(
        <Metier
          parametres={parametres}
          valeurInitiale={metier}
          onRetour={() => setEcran(actif === 0 ? "declaration" : actif === 1 ? "conjoint" : "passageCharge")}
          onChoix={(choix) => {
            maj("metier")(choix);
            setEcran("salaire");
          }}
        />,
      );

    case "salaire":
      return avecProfil(
        <Salaire
          millesime={millesime}
          valeurInitiale={salaire}
          onRetour={precedent(actif >= 1 && profilActif.salaireSeulement ? (actif === 1 ? "conjoint" : "passageCharge") : "metier")}
          onValider={(s) => {
            maj("salaire")(s);
            if (actif === 0) suivant("foyer");
            else if (depuisRelecture) setEcran("relecture");
            else if (profilActif.salaireSeulement) setEcran(actif === 1 ? apresAdultes() : "personnesACharge");
            else setEcran("jours");
          }}
        />,
      );

    case "foyer":
      return (
        <EstimationImpot
          mode={enCouple ? "couple" : "seul"}
          valeurInitiale={foyer}
          onRetour={precedent("salaire")}
          onValider={(f) => (setFoyer(f), suivant("jours"))}
        />
      );

    case "jours":
      return avecProfil(
        <Jours
          millesime={millesime}
          parametres={parametres}
          valeurInitiale={jours}
          onRetour={precedent(actif === 0 ? "foyer" : "salaire")}
          onValider={(j) => (maj("jours")(j), suivant("trajet"))}
        />,
      );

    case "trajet":
      if (estDomicile) {
        return avecProfil(
          <Domicile
            parametres={parametres}
            joursSurSite={joursSurSite}
            couple={enCouple || foyer?.couple}
            valeurInitiale={domicile}
            onRetour={precedent("jours")}
            onValider={(d) => (maj("domicile")(d), suivant("repas"))}
          />,
        );
      }
      return avecProfil(
        <Trajet
          parametres={parametres}
          joursSurSite={joursSurSite}
          couple={enCouple || foyer?.couple}
          employeurs={salaire?.employeurs}
          siteParMois={jours?.mois.map((m) => m.site)}
          valeurInitiale={trajet}
          onRetour={precedent("jours")}
          onValider={(t) => (maj("trajet")(t), suivant("repas"))}
        />,
      );

    case "repas":
      return avecProfil(
        <Repas
          parametres={parametres}
          joursSurSite={joursSurSite}
          valeurInitiale={repas}
          onRetour={precedent("trajet")}
          onValider={(r) => (maj("repas")(r), suivant("teletravail"))}
        />,
      );

    case "teletravail":
      return avecProfil(
        <Teletravail
          parametres={parametres}
          joursParMois={jours ? jours.mois.map((m) => m.teletravail) : Array(12).fill(0)}
          joursTravailles={jours ? totaux(jours.mois).travailles : 0}
          employeurs={salaire?.employeurs}
          valeurInitiale={teletravail}
          onRetour={precedent("repas")}
          onValider={(t) => (maj("teletravail")(t), suivant("autres"))}
        />,
      );

    case "autres":
      return avecProfil(
        <AutresFrais
          parametres={parametres}
          enTransports={!estDomicile && trajet?.mode === "transports"}
          aVehicule={estDomicile ? domicile !== undefined : trajet ? estVehicule(trajet.mode) : false}
          postesOuvertsDOffice={[
            ...(metier ? postesDuProfil(profilMetier(metier).postesOuverts) : []),
            // F12.7 — Allocations chômage : les frais de recherche d'emploi sont proposés d'office.
            ...(salaire?.chomage ? (["rechercheEmploi"] as const) : []),
          ]}
          employeurs={salaire?.employeurs}
          valeurInitiale={autres}
          onRetour={precedent("teletravail")}
          onValider={(a) => (maj("autres")(a), finDuProfil())}
        />,
      );

    case "trajetsCouple":
      return (
        <TrajetsCouple
          parametres={parametres}
          profils={profils}
          valeurInitiale={trajetsCouple}
          onMotifConjoint={(i) =>
            setProfils((ps) => ps.map((pr, j) => (j === i && pr.trajet ? { ...pr, trajet: { ...pr.trajet, motifDistance: "emploi du conjoint" } } : pr)))
          }
          onRetour={() => (depuisRelecture ? setEcran("relecture") : (setActif(1), setEcran("autres")))}
          onValider={(s) => {
            setTrajetsCouple(s);
            setEcran(!depuisRelecture && etapeCharges ? "personnesACharge" : "relecture");
            setDepuisRelecture(false);
          }}
        />
      );

    case "relecture": {
      return (
        <Relecture
          declarants={declarants()}
          foyer={foyer}
          resumeTrajetsCouple={ecranTrajetsCouple ? resumeTrajetsCouple(parametres, profils, trajetsCouple) : undefined}
          onRetour={() =>
            etapeCharges ? setEcran("personnesACharge") : ecranTrajetsCouple ? setEcran("trajetsCouple") : retourDernierAdulte()
          }
          onModifier={corriger}
          onValider={() => {
            setDepuisRelecture(false);
            setEcran("resultat");
          }}
        />
      );
    }

    case "resultat": {
      const ds = declarants();
      if (ds.length > 1) {
        return (
          <ResultatFoyer
            parametres={parametres}
            declarants={ds}
            foyer={foyer}
            onFoyer={setFoyer}
            onVerifier={corriger}
            onPdf={(i) => pdf(ds[i])}
            onEnregistrerFichier={() => telechargerDossier(contenu)}
            onModifier={() => setEcran("relecture")}
            onRecommencer={recommencer}
          />
        );
      }
      const d = ds[0];
      return (
        <Resultat
          parametres={parametres}
          resultat={d.resultat}
          nonVerifiees={d.nonVerifiees}
          casAdministration={d.casAdministration}
          foyer={foyer}
          vraisemblance={d.vraisemblance}
          onFoyer={setFoyer}
          onPdf={() => pdf(d)}
          onEnregistrerFichier={() => telechargerDossier(contenu)}
          onModifier={() => setEcran("relecture")}
          onVerifier={(e) => corriger(e, 0)}
          onRecommencer={recommencer}
        />
      );
    }

    default:
      return (
        <Accueil
          millesime={millesime}
          sauvegardeDisponible={existeSauvegarde(millesime)}
          millesimesDisponibles={millesimesDisponibles()}
          onCommencer={() => setEcran("filtrage")}
          onReprendre={() => {
            const d = charger(millesime);
            if (d) reprendre(d);
          }}
          onOuvrirDossier={reprendre}
        />
      );
  }
}

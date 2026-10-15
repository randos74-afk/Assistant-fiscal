// Parcours FraisFit : accueil, filtrage, métier, sept étapes, relecture et résultat.
import { useEffect, useState } from "react";
import { chargerParametres, millesimesDisponibles } from "./moteur/parametres";
import { calculerParcours, valeursPrudentes, vraisemblance } from "./parcours/assemblage";
import { postesDuProfil, type SaisieAutresFrais } from "./parcours/autresFrais";
import { totaux } from "./parcours/calendrier";
import { QUESTIONS_FILTRAGE, type Reponses as ReponsesFiltrage } from "./parcours/filtrage";
import { profil, type IdProfil } from "./parcours/metiers";
import type { SaisieRepas } from "./parcours/repas";
import type { SaisieTeletravail } from "./parcours/teletravail";
import { estVehicule, type SaisieTrajet } from "./parcours/trajet";
import { Accueil } from "./ui/Accueil";
import { AutresFrais } from "./ui/AutresFrais";
import { Filtrage } from "./ui/Filtrage";
import { Jours, type SaisieJours } from "./ui/Jours";
import { Metier } from "./ui/Metier";
import { Relecture, type EcranModifiable } from "./ui/Relecture";
import { Repas } from "./ui/Repas";
import { Resultat } from "./ui/Resultat";
import { Salaire, type SaisieSalaire } from "./ui/Salaire";
import { charger, effacer, enregistrer, existeSauvegarde, telechargerDossier, type ContenuDossier, type Dossier } from "./ui/sauvegarde";
import { justificatifs } from "./parcours/justificatifs";
import { autresRevenusFoyer, type SaisieFoyer } from "./parcours/foyer";
import { comparerImpot } from "./moteur/impot";
import { ouvrirPdf } from "./ui/pdf";
import { Teletravail } from "./ui/Teletravail";
import { Trajet } from "./ui/Trajet";

type Ecran = "accueil" | "filtrage" | "metier" | EcranModifiable | "relecture" | "resultat";

export default function App() {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [depuisRelecture, setDepuisRelecture] = useState(false);
  const [reponsesFiltrage, setReponsesFiltrage] = useState<ReponsesFiltrage>({});
  const [, setAussiEntreprise] = useState(false);
  const [metier, setMetier] = useState<IdProfil | undefined>();
  const [salaire, setSalaire] = useState<SaisieSalaire | undefined>();
  const [jours, setJours] = useState<SaisieJours | undefined>();
  const [trajet, setTrajet] = useState<SaisieTrajet | undefined>();
  const [repas, setRepas] = useState<SaisieRepas | undefined>();
  const [teletravail, setTeletravail] = useState<SaisieTeletravail | undefined>();
  const [autres, setAutres] = useState<SaisieAutresFrais | undefined>();
  const [foyer, setFoyer] = useState<SaisieFoyer | undefined>();

  const millesime = millesimesDisponibles()[0];
  const parametres = chargerParametres(millesime);
  const joursSurSite = jours ? totaux(jours.mois).site : 0;
  const reponses = { salaire, jours, trajet, repas, teletravail, autres };

  const contenu: ContenuDossier = { millesime, ecran, reponsesFiltrage, metier, salaire, jours, trajet, repas, teletravail, autres, foyer };

  // F9.3 — Sauvegarde automatique sur l'appareil dès que le parcours a commencé.
  useEffect(() => {
    if (metier !== undefined) enregistrer(contenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecran, metier, salaire, jours, trajet, repas, teletravail, autres, foyer]);

  function reprendre(d: Dossier) {
    setReponsesFiltrage(d.reponsesFiltrage ?? {});
    setMetier(d.metier);
    setSalaire(d.salaire);
    setJours(d.jours);
    setTrajet(d.trajet);
    setRepas(d.repas);
    setTeletravail(d.teletravail);
    setAutres(d.autres);
    setFoyer(d.foyer);
    setDepuisRelecture(false);
    setEcran(d.metier ? (d.ecran as Ecran) : "filtrage");
  }

  function estimationImpot() {
    if (!foyer) return null;
    const c = calculerParcours(parametres, reponses).comparaison;
    const i = comparerImpot(parametres, c.baseAbattement10, c.baseFraisReels, autresRevenusFoyer(parametres, foyer), foyer);
    return { avecAbattement: i.avecAbattement.impot, avecFraisReels: i.avecFraisReels.impot, gain: i.gain };
  }

  /** Étape suivante, ou retour direct à la relecture si l'on corrigeait une réponse. */
  const suivant = (prochain: Ecran) => setEcran(depuisRelecture ? "relecture" : prochain);
  const precedent = (ecranPrecedent: Ecran) => () => setEcran(depuisRelecture ? "relecture" : ecranPrecedent);

  function recommencer() {
    effacer(millesime);
    setReponsesFiltrage({});
    setMetier(undefined);
    setSalaire(undefined);
    setJours(undefined);
    setTrajet(undefined);
    setRepas(undefined);
    setTeletravail(undefined);
    setAutres(undefined);
    setFoyer(undefined);
    setDepuisRelecture(false);
    setEcran("accueil");
  }

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
            setEcran("metier");
          }}
        />
      );
    }

    case "metier":
      return (
        <Metier
          parametres={parametres}
          valeurInitiale={metier}
          onRetour={() => setEcran("filtrage")}
          onChoix={(choix) => {
            setMetier(choix);
            setEcran("salaire");
          }}
        />
      );

    case "salaire":
      return (
        <Salaire
          millesime={millesime}
          valeurInitiale={salaire}
          onRetour={precedent("metier")}
          onValider={(s) => (setSalaire(s), suivant("jours"))}
        />
      );

    case "jours":
      return (
        <Jours
          millesime={millesime}
          parametres={parametres}
          valeurInitiale={jours}
          onRetour={precedent("salaire")}
          onValider={(j) => (setJours(j), suivant("trajet"))}
        />
      );

    case "trajet":
      return (
        <Trajet
          parametres={parametres}
          joursSurSite={joursSurSite}
          valeurInitiale={trajet}
          onRetour={precedent("jours")}
          onValider={(t) => (setTrajet(t), suivant("repas"))}
        />
      );

    case "repas":
      return (
        <Repas
          parametres={parametres}
          joursSurSite={joursSurSite}
          valeurInitiale={repas}
          onRetour={precedent("trajet")}
          onValider={(r) => (setRepas(r), suivant("teletravail"))}
        />
      );

    case "teletravail":
      return (
        <Teletravail
          parametres={parametres}
          joursParMois={jours ? jours.mois.map((m) => m.teletravail) : Array(12).fill(0)}
          joursTravailles={jours ? totaux(jours.mois).travailles : 0}
          valeurInitiale={teletravail}
          onRetour={precedent("repas")}
          onValider={(t) => (setTeletravail(t), suivant("autres"))}
        />
      );

    case "autres":
      return (
        <AutresFrais
          parametres={parametres}
          enTransports={trajet?.mode === "transports"}
          aVehicule={trajet ? estVehicule(trajet.mode) : false}
          postesOuvertsDOffice={metier ? postesDuProfil(profil(metier).postesOuverts) : []}
          valeurInitiale={autres}
          onRetour={precedent("teletravail")}
          onValider={(a) => (setAutres(a), setEcran("relecture"))}
        />
      );

    case "relecture":
      return (
        <Relecture
          reponses={reponses}
          resultat={calculerParcours(parametres, reponses)}
          vraisemblance={vraisemblance(parametres, reponses, calculerParcours(parametres, reponses), foyer?.couple)}
          onRetour={() => setEcran("autres")}
          onModifier={(e) => {
            setDepuisRelecture(true);
            setEcran(e);
          }}
          onValider={() => {
            setDepuisRelecture(false);
            setEcran("resultat");
          }}
        />
      );

    case "resultat":
      return (
        <Resultat
          parametres={parametres}
          resultat={calculerParcours(parametres, reponses)}
          prudentes={valeursPrudentes(reponses)}
          foyer={foyer}
          vraisemblance={vraisemblance(parametres, reponses, calculerParcours(parametres, reponses), foyer?.couple)}
          onFoyer={setFoyer}
          onPdf={() =>
            ouvrirPdf({
              parametres,
              resultat: calculerParcours(parametres, reponses),
              prudentes: valeursPrudentes(reponses),
              justificatifs: justificatifs(reponses),
              date: new Date(),
              impot: estimationImpot(),
            })
          }
          onEnregistrerFichier={() => telechargerDossier(contenu)}
          onModifier={() => setEcran("relecture")}
          onRecommencer={recommencer}
        />
      );

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

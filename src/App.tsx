// Parcours FraisFit. Les écrans du nouveau parcours remplacent l'ancien simulateur au fur et à mesure.
import { useState } from "react";
import { chargerParametres, millesimesDisponibles } from "./moteur/parametres";
import { QUESTIONS_FILTRAGE, type Reponses } from "./parcours/filtrage";
import type { IdProfil } from "./parcours/metiers";
import { Accueil } from "./ui/Accueil";
import { Filtrage } from "./ui/Filtrage";
import { Metier } from "./ui/Metier";
import { Jours, type SaisieJours } from "./ui/Jours";
import { Salaire, type SaisieSalaire } from "./ui/Salaire";
import { Trajet } from "./ui/Trajet";
import { Repas } from "./ui/Repas";
import { Teletravail } from "./ui/Teletravail";
import type { SaisieTeletravail } from "./parcours/teletravail";
import type { SaisieRepas } from "./parcours/repas";
import { totaux } from "./parcours/calendrier";
import type { SaisieTrajet } from "./parcours/trajet";
import { existeSauvegarde } from "./ui/sauvegarde";
import AncienSimulateur from "./ancien/AncienSimulateur.jsx";

type Ecran = "accueil" | "filtrage" | "metier" | "salaire" | "jours" | "trajet" | "repas" | "teletravail" | "ancien-simulateur";

export default function App() {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [reponsesFiltrage, setReponsesFiltrage] = useState<Reponses>({});
  const [aussiEntreprise, setAussiEntreprise] = useState(false);
  const [metier, setMetier] = useState<IdProfil | undefined>();
  const [salaire, setSalaire] = useState<SaisieSalaire | undefined>();
  const [jours, setJours] = useState<SaisieJours | undefined>();
  const [trajet, setTrajet] = useState<SaisieTrajet | undefined>();
  const [repas, setRepas] = useState<SaisieRepas | undefined>();
  const [teletravail, setTeletravail] = useState<SaisieTeletravail | undefined>();
  const joursSurSite = jours ? totaux(jours.mois).site : 0;
  const millesime = millesimesDisponibles()[0];
  const parametres = chargerParametres(millesime);

  switch (ecran) {
    case "ancien-simulateur":
      return <AncienSimulateur />;

    case "filtrage": {
      const dejaRepondu = Object.keys(reponsesFiltrage).length === QUESTIONS_FILTRAGE.length;
      return (
        <Filtrage
          millesime={millesime}
          reponsesInitiales={reponsesFiltrage}
          indiceInitial={dejaRepondu ? QUESTIONS_FILTRAGE.length - 1 : 0}
          onAccueil={() => setEcran("accueil")}
          onAccepte={(entreprise, reponses) => {
            setAussiEntreprise(entreprise);
            setReponsesFiltrage(reponses);
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
          onRetour={() => setEcran("metier")}
          onValider={(s) => {
            setSalaire(s);
            setEcran("jours");
          }}
        />
      );

    case "jours":
      return (
        <Jours
          millesime={millesime}
          parametres={parametres}
          valeurInitiale={jours}
          onRetour={() => setEcran("salaire")}
          onValider={(j) => {
            setJours(j);
            setEcran("trajet");
          }}
        />
      );

    case "trajet":
      return (
        <Trajet
          parametres={parametres}
          joursSurSite={joursSurSite}
          valeurInitiale={trajet}
          onRetour={() => setEcran("jours")}
          onValider={(t) => {
            setTrajet(t);
            setEcran("repas");
          }}
        />
      );

    case "repas":
      return (
        <Repas
          parametres={parametres}
          joursSurSite={joursSurSite}
          valeurInitiale={repas}
          onRetour={() => setEcran("trajet")}
          onValider={(r) => {
            setRepas(r);
            setEcran("teletravail");
          }}
        />
      );

    case "teletravail":
      return (
        <Teletravail
          parametres={parametres}
          joursParMois={jours ? jours.mois.map((m) => m.teletravail) : Array(12).fill(0)}
          joursTravailles={jours ? totaux(jours.mois).travailles : 0}
          valeurInitiale={teletravail}
          onRetour={() => setEcran("repas")}
          onValider={(t) => {
            setTeletravail(t);
            // Provisoire : « Vos autres frais » n'existe pas encore.
            setEcran("ancien-simulateur");
          }}
        />
      );

    default:
      return (
        <Accueil
          millesime={millesime}
          sauvegardeDisponible={existeSauvegarde()}
          onCommencer={() => setEcran("filtrage")}
          // Provisoire : la sauvegarde (F9) n'existe pas encore.
          onReprendre={() => setEcran("ancien-simulateur")}
        />
      );
  }
}

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
import { existeSauvegarde } from "./ui/sauvegarde";
import AncienSimulateur from "./ancien/AncienSimulateur.jsx";

type Ecran = "accueil" | "filtrage" | "metier" | "salaire" | "jours" | "ancien-simulateur";

export default function App() {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [reponsesFiltrage, setReponsesFiltrage] = useState<Reponses>({});
  const [aussiEntreprise, setAussiEntreprise] = useState(false);
  const [metier, setMetier] = useState<IdProfil | undefined>();
  const [salaire, setSalaire] = useState<SaisieSalaire | undefined>();
  const [jours, setJours] = useState<SaisieJours | undefined>();
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
            // Provisoire : « Votre trajet » n'existe pas encore.
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

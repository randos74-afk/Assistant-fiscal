// Parcours FraisFit. Les écrans du nouveau parcours remplacent l'ancien simulateur au fur et à mesure.
import { useState } from "react";
import { millesimesDisponibles } from "./moteur/parametres";
import { Accueil } from "./ui/Accueil";
import { Filtrage } from "./ui/Filtrage";
import { existeSauvegarde } from "./ui/sauvegarde";
import AncienSimulateur from "./ancien/AncienSimulateur.jsx";

type Ecran = "accueil" | "filtrage" | "ancien-simulateur";

export default function App() {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [aussiEntreprise, setAussiEntreprise] = useState(false);
  const millesime = millesimesDisponibles()[0];

  if (ecran === "ancien-simulateur") return <AncienSimulateur />;

  if (ecran === "filtrage") {
    return (
      <Filtrage
        millesime={millesime}
        onAccueil={() => setEcran("accueil")}
        onAccepte={(entreprise) => {
          setAussiEntreprise(entreprise);
          // Provisoire : « Votre métier » n'existe pas encore.
          setEcran("ancien-simulateur");
        }}
      />
    );
  }

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

// Parcours FraisFit. Les écrans du nouveau parcours remplacent l'ancien simulateur au fur et à mesure.
import { useState } from "react";
import { millesimesDisponibles } from "./moteur/parametres";
import { Accueil } from "./ui/Accueil";
import { existeSauvegarde } from "./ui/sauvegarde";
import AncienSimulateur from "./ancien/AncienSimulateur.jsx";

type Ecran = "accueil" | "ancien-simulateur";

export default function App() {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const millesime = millesimesDisponibles()[0];

  if (ecran === "ancien-simulateur") return <AncienSimulateur />;

  return (
    <Accueil
      millesime={millesime}
      sauvegardeDisponible={existeSauvegarde()}
      // Provisoire : l'ancien simulateur sert de suite tant que les nouveaux écrans ne sont pas prêts.
      onCommencer={() => setEcran("ancien-simulateur")}
      onReprendre={() => setEcran("ancien-simulateur")}
    />
  );
}

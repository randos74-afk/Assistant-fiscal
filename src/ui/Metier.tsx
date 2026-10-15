// Écran « Votre métier » (F14) : cinq profils, « Autre métier » donne le parcours général.
import { useState } from "react";
import { ETAPES } from "../parcours/etapes";
import type { Parametres } from "../moteur/types";
import { detailProfil, PROFILS, type IdProfil } from "../parcours/metiers";
import { PiedDePage } from "./Cadre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

interface Props {
  parametres: Parametres;
  valeurInitiale?: IdProfil;
  onChoix: (profil: IdProfil) => void;
  onRetour: () => void;
}

export function Metier({ parametres, valeurInitiale, onChoix, onRetour }: Props) {
  const [choix, setChoix] = useState<IdProfil | undefined>(valeurInitiale);
  const titre = typographie("Quel est votre métier ?");

  return (
    <div className="ecran">
      <EnTeteEtape libelle="Avant de commencer : votre métier" etape={0} total={ETAPES.length} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">{titre}</h1>
        <p className="texte-secondaire sous-question">On adapte les questions à votre métier. Les règles de calcul restent les mêmes pour tous.</p>

        <ChoixUnique
          nom="metier"
          legende={titre}
          options={PROFILS.map((p) => ({ valeur: p.id, libelle: p.libelle, detail: detailProfil(p, parametres) }))}
          valeur={choix}
          onChoix={(v) => setChoix(v as IdProfil)}
        />

        {choix === "autre" && <Encadre>{typographie("Votre métier n'est pas dans la liste ? Aucun souci : toutes les questions vous seront posées.")}</Encadre>}
      </main>

      <PiedDePage>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" disabled={!choix} onClick={() => choix && onChoix(choix)}>
          Continuer
        </button>
      </PiedDePage>
    </div>
  );
}

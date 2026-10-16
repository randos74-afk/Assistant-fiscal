// F14 soignant — Soins à domicile : rappel des règles et aide au calcul du total annuel de kilomètres.
import { useState } from "react";
import { nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import { kmDepuisBulletins, kmDepuisCompteur } from "../parcours/kilometresSoins";
import { lireEntier } from "../parcours/saisie";
import { ChampNombre } from "./ChampNombre";
import { ChoixUnique, Encadre } from "./Question";
import { typographie } from "./typographie";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const nb = (t: string) => {
  const n = lireEntier(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};

/** Règles des tournées de soins à domicile, rappelées avant la saisie du total. */
export function ReglesSoinsDomicile({ parametres: p }: { parametres: Parametres }) {
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  return (
    <section className="carte" aria-labelledby="titre-regles-soins">
      <h2 id="titre-regles-soins">Ce qui compte dans votre total</h2>
      <ul className="liste-resume">
        <li>{typographie(`Maison → premier patient (ou le service) et dernier patient → maison : trajets maison-travail, ${plafond} km au plus chacun, sauf raison particulière.`)}</li>
        <li>{typographie("Trajets entre deux patients, et passages au service dans la journée : trajets professionnels, comptés en entier.")}</li>
        <li>{typographie("Tournées faites avec une voiture du service : rien à compter, sauf vos trajets maison ↔ service avec votre voiture.")}</li>
        <li>{typographie("Kilomètres remboursés par votre employeur : comptez-les quand même, et indiquez plus loin les indemnités reçues. Elles seront ajoutées à votre salaire.")}</li>
      </ul>
    </section>
  );
}

type Methode = "bulletins" | "compteur";

/** Calcul guidé du total annuel, puis « Utiliser ce total ». */
export function AideKilometresSoins({ parametres: p, joursSurSite, onUtiliser }: { parametres: Parametres; joursSurSite: number; onUtiliser: (km: number) => void }) {
  const [methode, setMethode] = useState<Methode | undefined>();
  const [kmMois, setKmMois] = useState<string[]>(Array(12).fill(""));
  const [aller, setAller] = useState("");
  const [retour, setRetour] = useState("");
  const [jours, setJours] = useState(joursSurSite ? String(joursSurSite) : "");
  const [kmSemaine, setKmSemaine] = useState("");
  const [semaines, setSemaines] = useState("");

  const bulletins = kmDepuisBulletins(p, kmMois.map(nb), nb(aller), nb(retour), nb(jours));
  const compteur = kmDepuisCompteur(nb(kmSemaine), nb(semaines));
  const total = methode === "bulletins" ? bulletins.total : methode === "compteur" ? compteur : 0;

  return (
    <section className="carte" aria-labelledby="titre-aide-km">
      <h2 id="titre-aide-km">Calculer votre total</h2>
      <ChoixUnique
        nom="methode-km"
        legende="Comment voulez-vous calculer ?"
        options={[
          { valeur: "bulletins", libelle: "Avec mes bulletins de paie", detail: "Les km remboursés de chaque mois sont sur la ligne « indemnités kilométriques ». Le plus fiable." },
          { valeur: "compteur", libelle: "Avec le compteur de ma voiture", detail: "Relevez le compteur pendant une semaine habituelle, au départ et au retour." },
        ]}
        valeur={methode}
        onChoix={(x) => setMethode(x as Methode)}
      />

      {methode === "bulletins" && (
        <>
          <p className="detail-calcul">{typographie("Recopiez le nombre de km de chaque bulletin (pas le montant en euros). Laissez vide un mois sans tournée.")}</p>
          <div className="grille-mois">
            {MOIS.map((m, i) => (
              <ChampNombre
                key={m}
                compact
                libelleVisible
                libelle={m}
                unite="km"
                valeur={kmMois[i]}
                onChange={(t) => setKmMois(kmMois.map((x, k) => (k === i ? t : x)))}
              />
            ))}
          </div>
          <p className="detail-calcul">{typographie("Ces km ne comprennent pas vos trajets depuis et vers la maison. Ajoutons-les :")}</p>
          <ChampNombre compact libelleVisible libelle="Maison → premier patient ou service, en moyenne" unite="km" valeur={aller} onChange={setAller} />
          <ChampNombre compact libelleVisible libelle="Dernier patient → maison, en moyenne" unite="km" valeur={retour} onChange={setRetour} />
          <ChampNombre compact libelleVisible libelle="Jours de tournée dans l'année" detail="Pré-rempli d'après vos jours sur site." unite="jours" valeur={jours} onChange={setJours} />
          <Encadre>
            {typographie(
              `Tournées : ${nombre(bulletins.tournees)} km. Trajets maison : ${nombre(bulletins.domicileTravail)} km. Total : ${nombre(bulletins.total)} km.`,
            )}
          </Encadre>
        </>
      )}

      {methode === "compteur" && (
        <>
          <ChampNombre compact libelleVisible libelle="Km d'une semaine habituelle" detail="Compteur au retour du dernier jour moins compteur au départ du premier jour, sans les trajets privés." unite="km" valeur={kmSemaine} onChange={setKmSemaine} />
          <ChampNombre compact libelleVisible libelle="Semaines travaillées dans l'année" detail="52 moins vos semaines de congés et d'absence." unite="semaines" valeur={semaines} onChange={setSemaines} />
          <Encadre>
            {typographie(
              `Total : ${nombre(compteur)} km. Si un trajet maison → premier patient ou dernier patient → maison dépasse ${p.deplacements.distance_aller_max_sans_justification_km} km, retirez l'excédent ou indiquez une raison.`,
            )}
          </Encadre>
        </>
      )}

      {total > 0 && (
        <button type="button" className="bouton bouton-principal" onClick={() => onUtiliser(total)}>
          {typographie(`Utiliser ce total : ${nombre(total)} km`)}
        </button>
      )}
    </section>
  );
}

// Liste d'achats de matériel (F6.9) : déduits l'année d'achat ou amortis. Partagée par le télétravail et les autres frais.
import { useId } from "react";
import { euros } from "../moteur/format";
import type { Achat } from "../moteur/teletravail";
import type { Parametres } from "../moteur/types";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { typographie } from "./typographie";

export interface LigneAchat {
  libelle: string;
  prix: string;
  mois: string;
  annee: string;
  usage: string;
}

const nombre = (t: string, lire: (t: string) => number | null) => {
  const n = lire(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};

export function versLignes(achats: Achat[]): LigneAchat[] {
  return achats.map((a) => ({
    libelle: a.libelle,
    prix: afficherMontant(a.prixHT),
    mois: String(a.moisAchat),
    annee: String(a.anneeAchat),
    usage: String(Math.round(a.usagePro * 100)),
  }));
}

export function versAchats(lignes: LigneAchat[], anneeParDefaut: number, libelleParDefaut: string): Achat[] {
  return lignes
    .filter((a) => nombre(a.prix, lireMontant) > 0)
    .map((a) => ({
      libelle: a.libelle.trim() || libelleParDefaut,
      prixHT: nombre(a.prix, lireMontant),
      usagePro: Math.min(nombre(a.usage, lireEntier), 100) / 100,
      anneeAchat: nombre(a.annee, lireEntier) || anneeParDefaut,
      moisAchat: Math.min(Math.max(nombre(a.mois, lireEntier), 1), 12),
    }));
}

export function lignesValides(lignes: LigneAchat[]): boolean {
  return lignes.every((a) => !Number.isNaN(lireMontant(a.prix)) && [a.mois, a.annee, a.usage].every((t) => !Number.isNaN(lireEntier(t))));
}

interface Props {
  parametres: Parametres;
  titre: string;
  exemples: string;
  lignes: LigneAchat[];
  onChange: (lignes: LigneAchat[]) => void;
}

export function ListeAchats({ parametres: p, titre, exemples, lignes, onChange }: Props) {
  const id = useId();
  return (
    <section className="carte" aria-labelledby={`${id}-titre`}>
      <h2 id={`${id}-titre`}>{titre}</h2>
      <p style={{ margin: 0, fontSize: "var(--taille-texte-min)" }}>
        {typographie(
          `${exemples} Jusqu'à ${euros(p.materiel.seuil_deduction_immediate_HT)} hors taxes, déduit l'année d'achat ; au-delà, réparti sur ${p.materiel.duree_amortissement_informatique_ans} ans. Les achats des années passées comptent encore.`,
        )}
      </p>
      {lignes.map((a, i) => {
        const maj = (champ: keyof LigneAchat, x: string) => onChange(lignes.map((b, j) => (j === i ? { ...b, [champ]: x } : b)));
        return (
          <fieldset key={i} className="achat">
            <legend className="champ-libelle">Achat {i + 1}</legend>
            <label className="champ-libelle" htmlFor={`${id}-${i}`}>
              Quoi ?
            </label>
            <input id={`${id}-${i}`} className="champ-texte" value={a.libelle} onChange={(e) => maj("libelle", e.target.value)} />
            <ChampMontant compact libelleVisible libelle="Prix hors taxes (HT)" valeur={a.prix} onChange={(x) => maj("prix", x)} />
            <div className="grille-mois">
              <ChampNombre compact libelleVisible libelle="Mois d'achat" unite="" valeur={a.mois} onChange={(x) => maj("mois", x)} />
              <ChampNombre compact libelleVisible libelle="Année d'achat" unite="" valeur={a.annee} onChange={(x) => maj("annee", x)} />
            </div>
            <ChampNombre
              compact
              libelleVisible
              libelle="Part d'usage pour le travail"
              detail="Comptez honnêtement l'usage privé : il est retiré."
              unite="%"
              valeur={a.usage}
              onChange={(x) => maj("usage", x)}
            />
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => onChange(lignes.filter((_, j) => j !== i))}>
              Retirer cet achat
            </button>
          </fieldset>
        );
      })}
      <button
        type="button"
        className="bouton bouton-secondaire"
        onClick={() => onChange([...lignes, { libelle: "", prix: "", mois: "1", annee: String(p.millesime.revenus), usage: "100" }])}
      >
        Ajouter un achat
      </button>
    </section>
  );
}

// Étape 5 : le télétravail (F5). Forfait déjà calculé mois par mois ; comparaison facultative avec les frais réels.
import { useState } from "react";
import { teletravailForfait } from "../moteur/calcul";
import { calculerDeclarant } from "../moteur/declarant";
import { euros, eurosCentimes } from "../moteur/format";
import type { Achat, UsageLocal } from "../moteur/teletravail";
import type { Parametres } from "../moteur/types";
import { libelleEtape } from "../parcours/etapes";
import { completerFiche, FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import {
  allocationPrudente,
  comparerMethodes,
  entreeReel,
  USAGES,
  type SaisieTeletravail,
} from "../parcours/teletravail";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

type Question = "allocation" | "comparer" | "local" | "equipement" | "bilan";

interface Props {
  parametres: Parametres;
  joursParMois: number[];
  joursTravailles: number;
  valeurInitiale?: SaisieTeletravail;
  onValider: (t: SaisieTeletravail) => void;
  onRetour: () => void;
}

const montant = (t: string) => {
  const n = lireMontant(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};
const entier = (t: string) => {
  const n = lireEntier(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};
const texte = (n: number | undefined) => (n ? afficherMontant(n) : "");

const CHARGES = [
  { cle: "loyer", libelle: "Loyer, ou intérêts d'emprunt du logement" },
  { cle: "energie", libelle: "Électricité et chauffage" },
  { cle: "eau", libelle: "Eau" },
  { cle: "assurance", libelle: "Assurance habitation" },
  { cle: "impots", libelle: "Taxe foncière ou impôts locaux de l'année" },
] as const;

interface LigneAchat {
  libelle: string;
  prix: string;
  mois: string;
  annee: string;
  usage: string;
}

export function Teletravail({ parametres: p, joursParMois, joursTravailles, valeurInitiale: v, onValider, onRetour }: Props) {
  const annee = p.millesime.revenus;
  const joursTeletravail = joursParMois.reduce((s, j) => s + j, 0);

  const [question, setQuestion] = useState<Question>("allocation");
  const [aAllocation, setAAllocation] = useState<string | undefined>(v ? (v.allocation > 0 ? "oui" : "non") : undefined);
  const [allocation, setAllocation] = useState(v && !v.allocationPrudente ? texte(v.allocation) : "");
  const [allocPrudente, setAllocPrudente] = useState(v?.allocationPrudente ?? false);
  const [comparer, setComparer] = useState<string | undefined>(v ? (v.comparer ? "oui" : "non") : undefined);
  const [usage, setUsage] = useState<UsageLocal | "studio" | undefined>(v ? (v.studio ? "studio" : v.usage) : undefined);
  const [surfaceBureau, setSurfaceBureau] = useState(v?.surfaceBureau ? String(v.surfaceBureau) : "");
  const [surfaceTotale, setSurfaceTotale] = useState(v?.surfaceTotale ? String(v.surfaceTotale) : "");
  const [charges, setCharges] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(v?.detailCharges ?? {}).map(([cle, n]) => [cle, texte(n)])),
  );
  const [depensesBureau, setDepensesBureau] = useState(texte(v?.depensesBureau));
  const [communication, setCommunication] = useState(texte(v?.communication));
  const [fournitures, setFournitures] = useState(texte(v?.fournitures));
  const [achats, setAchats] = useState<LigneAchat[]>(
    (v?.achats ?? []).map((a) => ({
      libelle: a.libelle,
      prix: afficherMontant(a.prixHT),
      mois: String(a.moisAchat),
      annee: String(a.anneeAchat),
      usage: String(Math.round(a.usagePro * 100)),
    })),
  );
  const [methode, setMethode] = useState<"forfait" | "reel" | undefined>(v?.methode);
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("le télétravail");
  const forfait = teletravailForfait(p, joursParMois);
  const prudente = allocationPrudente(p, joursTeletravail);

  function achatsSaisis(): Achat[] {
    return achats
      .filter((a) => montant(a.prix) > 0)
      .map((a) => ({
        libelle: a.libelle.trim() || "matériel",
        prixHT: montant(a.prix),
        usagePro: Math.min(entier(a.usage), 100) / 100,
        anneeAchat: entier(a.annee) || annee,
        moisAchat: Math.min(Math.max(entier(a.mois), 1), 12),
      }));
  }

  function saisie(m: "forfait" | "reel" = methode ?? "forfait"): SaisieTeletravail {
    const u = usage ?? "aucun";
    return {
      allocation: aAllocation === "oui" ? (allocPrudente ? prudente : montant(allocation)) : 0,
      allocationPrudente: aAllocation === "oui" && allocPrudente,
      comparer: comparer === "oui",
      usage: u === "studio" ? "mixte" : u,
      studio: u === "studio",
      surfaceBureau: entier(surfaceBureau),
      surfaceTotale: entier(surfaceTotale),
      chargesLogement: Object.values(charges).reduce((s, c) => s + montant(c), 0),
      detailCharges: Object.fromEntries(Object.entries(charges).map(([cle, c]) => [cle, montant(c)])),
      depensesBureau: montant(depensesBureau),
      communication: montant(communication),
      fournitures: montant(fournitures),
      achats: achatsSaisis(),
      methode: m,
    };
  }

  const suite: Question[] = comparer === "oui" ? ["allocation", "comparer", "local", "equipement", "bilan"] : ["allocation", "comparer", "bilan"];
  const rang = suite.indexOf(question);
  const avancer = () => setQuestion(suite[rang + 1]);
  const reculer = () => (rang <= 0 ? onRetour() : setQuestion(suite[rang - 1]));

  // Aucun jour de télétravail : rien à demander.
  if (joursTeletravail === 0) {
    return (
      <div className="ecran">
        <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />
        <main className="ecran-contenu">
          <h1 className="titre-question">Le télétravail</h1>
          <Encadre>{typographie("Vous n'avez indiqué aucun jour de télétravail à l'étape « Vos jours ». Rien à compter ici.")}</Encadre>
        </main>
        <PiedDePage>
          <BandeauConfidentialite />
          <button type="button" className="bouton bouton-principal" onClick={() => onValider(saisie("forfait"))}>
            Continuer
          </button>
        </PiedDePage>
      </div>
    );
  }

  let titre = "";
  let contenu: JSX.Element;
  let peutContinuer = true;
  let fiche: Fiche | undefined;

  switch (question) {
    case "allocation":
      titre = "Votre employeur vous verse-t-il une indemnité de télétravail ?";
      fiche = completerFiche(FICHES.allocationTeletravail, { forfait: eurosCentimes(p.teletravail.forfait_par_jour) });
      peutContinuer = aAllocation === "non" || (aAllocation === "oui" && (allocPrudente || montant(allocation) > 0));
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Avec les frais réels, elle s'ajoute à votre salaire déclaré. Nous en tenons compte.")}
          </p>
          <ChoixUnique
            nom="allocation"
            legende={titre}
            options={[
              { valeur: "non", libelle: "Non" },
              { valeur: "oui", libelle: "Oui" },
            ]}
            valeur={aAllocation}
            onChoix={setAAllocation}
          />
          {aAllocation === "oui" &&
            (allocPrudente ? (
              <>
                <Encadre>
                  {typographie(
                    `Nous ajoutons ${eurosCentimes(p.teletravail.forfait_par_jour)} par jour de télétravail, soit ${eurosCentimes(prudente)}. C'est le choix le plus prudent.`,
                  )}
                </Encadre>
                <button type="button" className="lien-je-ne-sais-pas" onClick={() => setAllocPrudente(false)}>
                  Finalement, je connais le montant
                </button>
              </>
            ) : (
              <>
                <ChampMontant compact libelleVisible libelle="Total reçu dans l'année" valeur={allocation} onChange={setAllocation} />
                <LienJeNeSaisPas onClick={() => setAllocPrudente(true)} />
              </>
            ))}
        </>
      );
      break;

    case "comparer":
      titre = "Avez-vous des frais de télétravail plus élevés ?";
      peutContinuer = comparer !== undefined;
      contenu = (
        <>
          <section className="carte">
            <p className="resultat-jours">
              <strong className="montant">{euros(forfait.montant)}</strong> au forfait
            </p>
            <p className="detail-calcul">{typographie(forfait.formule)}</p>
          </section>
          <ChoixUnique
            nom="comparer"
            legende={titre}
            options={[
              { valeur: "non", libelle: "Non, je garde le forfait" },
              {
                valeur: "oui",
                libelle: "Oui, comparer avec mes frais réels",
                detail: "Pièce de travail, ordinateur, écran, internet, fournitures.",
              },
            ]}
            valeur={comparer}
            onChoix={setComparer}
          />
          <Encadre>
            {typographie(
              "C'est l'un ou l'autre : le forfait couvre déjà votre matériel et votre internet. Nous retiendrons le plus favorable.",
            )}
          </Encadre>
        </>
      );
      break;

    case "local": {
      titre = "Où travaillez-vous chez vous ?";
      const avecSurfaces = usage === "dedie" || usage === "mixte";
      const champs = [surfaceBureau, surfaceTotale].map(lireEntier);
      peutContinuer =
        usage !== undefined &&
        (!avecSurfaces || (entier(surfaceBureau) > 0 && entier(surfaceTotale) >= entier(surfaceBureau))) &&
        champs.every((n) => n === null || !Number.isNaN(n));
      contenu = (
        <>
          <ChoixUnique nom="usage" legende={titre} options={USAGES} valeur={usage} onChoix={(x) => setUsage(x as UsageLocal | "studio")} />
          {avecSurfaces && (
            <>
              <ChampNombre compact libelleVisible libelle="Surface de la pièce de travail" unite="m²" valeur={surfaceBureau} onChange={setSurfaceBureau} />
              <ChampNombre compact libelleVisible libelle="Surface totale du logement" unite="m²" valeur={surfaceTotale} onChange={setSurfaceTotale} />
            </>
          )}
          {usage === "studio" && <Encadre>{typographie("Pour un studio, la moitié de la surface compte pour le travail.")}</Encadre>}
          {usage && usage !== "aucun" && (
            <section className="carte" aria-labelledby="titre-charges">
              <h2 id="titre-charges">Charges du logement sur l'année</h2>
              {CHARGES.map((c) => (
                <ChampMontant
                  key={c.cle}
                  compact
                  libelleVisible
                  libelle={c.libelle}
                  valeur={charges[c.cle] ?? ""}
                  onChange={(x) => setCharges({ ...charges, [c.cle]: x })}
                />
              ))}
              <ChampMontant
                compact
                libelleVisible
                libelle="Dépenses pour la pièce de travail"
                detail="Mise aux normes électriques, diagnostic."
                valeur={depensesBureau}
                onChange={setDepensesBureau}
              />
            </section>
          )}
        </>
      );
      break;
    }

    case "equipement":
      titre = "Votre équipement et vos abonnements";
      peutContinuer = [communication, fournitures, ...achats.map((a) => a.prix)].every((t) => !Number.isNaN(lireMontant(t)));
      contenu = (
        <>
          <ChampMontant
            compact
            libelleVisible
            libelle="Internet, téléphone fixe et portable (abonnements de l'année)"
            detail="Le portable seulement si votre employeur l'exige pour le télétravail."
            valeur={communication}
            onChange={setCommunication}
          />
          <ChampMontant compact libelleVisible libelle="Fournitures" detail="Encre, papier, petites fournitures." valeur={fournitures} onChange={setFournitures} />

          <section className="carte" aria-labelledby="titre-achats">
            <h2 id="titre-achats">Matériel et mobilier achetés</h2>
            <p style={{ margin: 0, fontSize: "var(--taille-texte-min)" }}>
              {typographie(
                `Ordinateur, écran, bureau, siège. Jusqu'à ${euros(p.materiel.seuil_deduction_immediate_HT)} hors taxes, déduit l'année d'achat ; au-delà, réparti sur ${p.materiel.duree_amortissement_informatique_ans} ans. Les achats des années passées comptent encore.`,
              )}
            </p>
            {achats.map((a, i) => {
              const maj = (champ: keyof LigneAchat, x: string) => setAchats(achats.map((b, j) => (j === i ? { ...b, [champ]: x } : b)));
              return (
                <fieldset key={i} className="achat">
                  <legend className="champ-libelle">Achat {i + 1}</legend>
                  <label className="champ-libelle" htmlFor={`achat-${i}`}>
                    Quoi ?
                  </label>
                  <input id={`achat-${i}`} className="champ-texte" value={a.libelle} onChange={(e) => maj("libelle", e.target.value)} />
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
                  <button type="button" className="lien-je-ne-sais-pas" onClick={() => setAchats(achats.filter((_, j) => j !== i))}>
                    Retirer cet achat
                  </button>
                </fieldset>
              );
            })}
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setAchats([...achats, { libelle: "", prix: "", mois: "1", annee: String(annee), usage: "100" }])}
            >
              Ajouter un achat
            </button>
          </section>
        </>
      );
      break;

    case "bilan": {
      titre = "Votre télétravail";
      const s = saisie();
      const c = comparerMethodes(p, s, joursParMois, joursTravailles);
      const choisie = comparer === "oui" ? (methode ?? c.meilleure) : "forfait";
      const r = calculerDeclarant(p, {
        numero: 1,
        salairePrerempli: 0,
        teletravailJoursParMois: joursParMois,
        teletravailMethode: choisie,
        teletravailReel: entreeReel(s, joursTeletravail, joursTravailles),
        reintegrations: s.allocation > 0 ? [{ libelle: "allocation télétravail", montant: s.allocation }] : [],
      });
      contenu = (
        <>
          {comparer === "oui" ? (
            <ChoixUnique
              nom="methode"
              legende="Méthode retenue"
              options={[
                { valeur: "forfait", libelle: `Forfait : ${euros(c.forfait)}`, detail: c.meilleure === "forfait" ? "Le plus favorable pour vous." : undefined },
                { valeur: "reel", libelle: `Frais réels : ${euros(c.reel)}`, detail: c.meilleure === "reel" ? "Le plus favorable pour vous." : undefined },
              ]}
              valeur={choisie}
              onChoix={(x) => setMethode(x as "forfait" | "reel")}
            />
          ) : null}
          <section className="carte" aria-live="polite">
            {r.lignes.map((l) => (
              <p key={l.texte} className="detail-calcul">
                {typographie(l.texte)}
              </p>
            ))}
          </section>
          {s.allocation > 0 && (
            <Encadre>
              {typographie(
                `Votre salaire déclaré sera augmenté de ${euros(s.allocation)} (allocation télétravail)${s.allocationPrudente ? ", valeur prudente" : ""}.`,
              )}
            </Encadre>
          )}
          {choisie === "reel" && (
            <Encadre>
              {typographie("Gardez les factures et l'attestation de télétravail de votre employeur : elles justifient ces frais.")}
            </Encadre>
          )}
          <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
            {typographie("Les repas des jours de télétravail et les frais de garde d'enfants ne se déduisent jamais.")}
          </p>
        </>
      );
      break;
    }
  }

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={reculer} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <div className="question-titre">
          <h1 className="titre-question">{typographie(titre)}</h1>
          {fiche && <BoutonAsterisque onClick={() => setAide(fiche!)} />}
        </div>
        {contenu}
      </main>

      <PiedDePage>
        <BandeauConfidentialite />
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={!peutContinuer}
          onClick={() => {
            if (question !== "bilan") return avancer();
            const s = saisie();
            const meilleure = comparerMethodes(p, s, joursParMois, joursTravailles).meilleure;
            onValider({ ...s, methode: comparer === "oui" ? (methode ?? meilleure) : "forfait" });
          }}
        >
          {question === "bilan" ? "Valider le télétravail" : "Continuer"}
        </button>
      </PiedDePage>

      {aide && <FicheAide fiche={aide} ouverte onFermer={() => setAide(null)} />}
    </div>
  );
}

// Étape 4 : vos repas (F4). Une question par écran ; le moteur calcule le bilan.
import { useState } from "react";
import { calculerDeclarant } from "../moteur/declarant";
import { eurosCentimes } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import { libelleEtape } from "../parcours/etapes";
import { completerFiche, FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import {
  ACCES,
  LIEUX,
  partEmployeurPrudente,
  repasDeductibles,
  repasPourMoteur,
  type AccesRepas,
  type LieuRepas,
  type SaisieRepas,
} from "../parcours/repas";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

type Question = "acces" | "lieu" | "cantine" | "prix" | "employeur" | "bilan";

interface Props {
  parametres: Parametres;
  joursSurSite: number;
  valeurInitiale?: SaisieRepas;
  onValider: (repas: SaisieRepas) => void;
  onRetour: () => void;
}

const positif = (n: number | null): n is number => n !== null && !Number.isNaN(n) && n > 0;
const valide = (n: number | null) => n === null || !Number.isNaN(n);

export function Repas({ parametres: p, joursSurSite, valeurInitiale: v, onValider, onRetour }: Props) {
  const [question, setQuestion] = useState<Question>("acces");
  const [acces, setAcces] = useState<AccesRepas | undefined>(v?.acces);
  const [lieu, setLieu] = useState<LieuRepas | undefined>(v?.lieu);
  const [cantineProche, setCantineProche] = useState<string | undefined>(
    v?.cantineProche === undefined ? undefined : v.cantineProche ? "oui" : "non",
  );
  const [prix, setPrix] = useState(v?.prix ? afficherMontant(v.prix) : "");
  const [prixPrudent, setPrixPrudent] = useState(v ? v.prix === null : false);
  const [avecTitres, setAvecTitres] = useState(Boolean(v?.titres));
  const [valeurTitre, setValeurTitre] = useState(v?.titres ? afficherMontant(v.titres.valeur) : "");
  const [partEmployeur, setPartEmployeur] = useState(v?.titres && !v.titres.partPrudente ? afficherMontant(v.titres.partEmployeur) : "");
  const [partPrudente, setPartPrudente] = useState(v?.titres?.partPrudente ?? false);
  const [nombreTitres, setNombreTitres] = useState(String(v?.titres?.nombre ?? joursSurSite));
  const [avecPanier, setAvecPanier] = useState(Boolean(v?.primePanier));
  const [panier, setPanier] = useState(v?.primePanier ? afficherMontant(v.primePanier) : "");
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("vos repas");
  const forfait = p.repas.forfait_sans_justificatif_detaille;
  const seuil = p.repas.seuil_alerte_prix_repas;
  const tauxPrudent = Number(p.valeurs_prudentes_je_ne_sais_pas.part_employeur_titre_restaurant);

  const valeurTitreNb = lireMontant(valeurTitre);
  const partNb = partPrudente && positif(valeurTitreNb) ? partEmployeurPrudente(p, valeurTitreNb) : lireMontant(partEmployeur);
  const prixNb = lireMontant(prix);

  function saisie(): SaisieRepas {
    return {
      acces: acces!,
      lieu: acces === "impossible" ? lieu : undefined,
      cantineProche: lieu === "gamelle" ? cantineProche === "oui" : undefined,
      prix: prixPrudent || !positif(prixNb) ? null : prixNb,
      titres:
        avecTitres && positif(valeurTitreNb)
          ? {
              valeur: valeurTitreNb,
              partEmployeur: positif(partNb) ? partNb : 0,
              partPrudente,
              nombre: lireEntier(nombreTitres) || 0,
            }
          : null,
      primePanier: avecPanier && positif(lireMontant(panier)) ? lireMontant(panier)! : 0,
    };
  }

  // Ordre des questions selon les réponses.
  const suite: Question[] = ["acces"];
  if (acces === "impossible") {
    suite.push("lieu");
    if (lieu === "gamelle") suite.push("cantine");
    if (lieu === "restaurant" || lieu === "cantine") suite.push("prix");
  }
  suite.push("employeur", "bilan");
  const rang = suite.indexOf(question);
  const avancer = () => setQuestion(suite[rang + 1]);
  const reculer = () => (rang <= 0 ? onRetour() : setQuestion(suite[rang - 1]));

  let titre = "";
  let contenu: JSX.Element;
  let peutContinuer = true;
  let fiche: Fiche | undefined;

  switch (question) {
    case "acces":
      titre = "Pouvez-vous déjeuner chez vous les jours de travail ?";
      peutContinuer = acces !== undefined;
      contenu = <ChoixUnique nom="acces" legende={titre} options={ACCES} valeur={acces} onChoix={(x) => setAcces(x as AccesRepas)} />;
      break;

    case "lieu":
      titre = "Où déjeunez-vous le plus souvent ?";
      peutContinuer = lieu !== undefined;
      contenu = <ChoixUnique nom="lieu" legende={titre} options={LIEUX} valeur={lieu} onChoix={(x) => setLieu(x as LieuRepas)} />;
      break;

    case "cantine":
      titre = "Y a-t-il une cantine sur place ou à côté de votre travail ?";
      peutContinuer = cantineProche !== undefined;
      contenu = (
        <>
          <ChoixUnique
            nom="cantine"
            legende={titre}
            options={[
              { valeur: "non", libelle: "Non" },
              { valeur: "oui", libelle: "Oui" },
            ]}
            valeur={cantineProche}
            onChoix={setCantineProche}
          />
          <Encadre>
            {typographie(`Sans cantine proche, chaque repas apporté compte pour un forfait de ${eurosCentimes(forfait)}.`)}
          </Encadre>
        </>
      );
      break;

    case "prix":
      titre = "Combien payez-vous en moyenne par repas ?";
      fiche = completerFiche(FICHES.prixRepas, { forfait: eurosCentimes(forfait) });
      peutContinuer = prixPrudent || positif(prixNb);
      contenu = prixPrudent ? (
        <>
          <Encadre>
            {typographie(`Nous retenons le forfait de ${eurosCentimes(forfait)} par repas, le plus prudent. Il sera signalé dans votre récapitulatif.`)}
          </Encadre>
          <button type="button" className="lien-je-ne-sais-pas" onClick={() => setPrixPrudent(false)}>
            Finalement, je connais le prix
          </button>
        </>
      ) : (
        <>
          <ChampMontant libelle={titre} valeur={prix} onChange={setPrix} />
          <LienJeNeSaisPas onClick={() => setPrixPrudent(true)} />
          {positif(prixNb) && prixNb > seuil && (
            <Encadre ton="attention">
              {typographie(
                `Au-delà de ${eurosCentimes(seuil)}, la dépense peut être jugée excessive. Nous gardons votre montant : conservez bien vos tickets.`,
              )}
            </Encadre>
          )}
          {positif(prixNb) && prixNb <= p.repas.valeur_repas_au_foyer && (
            <Encadre>
              {typographie(
                `Un repas qui coûte ${eurosCentimes(p.repas.valeur_repas_au_foyer)} ou moins ne coûte pas plus cher qu'à la maison : rien à déduire.`,
              )}
            </Encadre>
          )}
        </>
      );
      break;

    case "employeur":
      titre = "Votre employeur participe-t-il à vos repas ?";
      fiche = completerFiche(FICHES.titres, { tauxPrudent: `${Math.round(tauxPrudent * 100)} %` });
      peutContinuer =
        (!avecTitres || (positif(valeurTitreNb) && (partPrudente || positif(partNb)) && positif(lireEntier(nombreTitres)))) &&
        [lireMontant(partEmployeur), lireMontant(panier), lireEntier(nombreTitres)].every(valide);
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Ce que paie votre employeur s'ajoute à votre salaire déclaré si vous choisissez les frais réels.")}
          </p>

          <label className="case-a-cocher">
            <input type="checkbox" checked={avecTitres} onChange={(e) => setAvecTitres(e.target.checked)} />
            Je reçois des titres-restaurant (tickets ou carte)
          </label>
          {avecTitres && (
            <>
              <ChampMontant compact libelleVisible libelle="Valeur d'un titre" valeur={valeurTitre} onChange={setValeurTitre} />
              {partPrudente ? (
                <Encadre>
                  {typographie(
                    `Part de l'employeur retenue : ${Math.round(tauxPrudent * 100)} % de la valeur du titre${
                      positif(partNb) ? `, soit ${eurosCentimes(partNb)}` : ""
                    }. C'est le choix le plus prudent.`,
                  )}
                </Encadre>
              ) : (
                <ChampMontant
                  compact
                  libelleVisible
                  libelle="Part payée par votre employeur, par titre"
                  valeur={partEmployeur}
                  onChange={setPartEmployeur}
                />
              )}
              {partPrudente ? (
                <button type="button" className="lien-je-ne-sais-pas" onClick={() => setPartPrudente(false)}>
                  Finalement, je connais la part de l'employeur
                </button>
              ) : (
                <LienJeNeSaisPas onClick={() => setPartPrudente(true)} />
              )}
              <ChampNombre
                compact
                libelleVisible
                libelle="Titres reçus dans l'année"
                detail="Pré-rempli avec vos jours sur site. Corrigez avec vos bulletins si besoin."
                unite="titres"
                valeur={nombreTitres}
                onChange={setNombreTitres}
              />
            </>
          )}

          <label className="case-a-cocher">
            <input type="checkbox" checked={avecPanier} onChange={(e) => setAvecPanier(e.target.checked)} />
            Je reçois une prime de panier
          </label>
          {avecPanier && <ChampMontant compact libelleVisible libelle="Total de la prime de panier dans l'année" valeur={panier} onChange={setPanier} />}
        </>
      );
      break;

    case "bilan": {
      titre = "Vos frais de repas";
      const s = saisie();
      const { repas, reintegrations } = repasPourMoteur(s, joursSurSite);
      const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 0, repas: repas ? [repas] : [], reintegrations });
      const ferme = repasDeductibles(s);
      contenu = (
        <>
          <section className="carte" aria-live="polite">
            <p className="resultat-jours">
              <strong className="montant">{r.montantCase.toLocaleString("fr-FR")} €</strong>
            </p>
            {r.lignes.map((l) => (
              <p key={l.texte} className="detail-calcul">
                {typographie(l.texte)}
              </p>
            ))}
            {!ferme.ok && <p className="detail-calcul">{typographie(ferme.raison)}</p>}
          </section>
          {r.totalReintegrations > 0 && (
            <Encadre>
              {typographie(
                `Votre salaire déclaré sera augmenté de ${Math.floor(r.totalReintegrations).toLocaleString("fr-FR")} € (${reintegrations
                  .map((x) => x.libelle)
                  .join(", ")}). Nous en tenons compte dans la comparaison.`,
              )}
            </Encadre>
          )}
          {r.alertes
            .filter((a) => !a.startsWith("Vos frais réels dépassent"))
            .map((a) => (
              <Encadre key={a} ton="attention">
                {typographie(a)}
              </Encadre>
            ))}
          {s.prix === null && s.lieu !== "gamelle" && ferme.ok && <Encadre>Valeur prudente retenue pour le prix des repas.</Encadre>}
          {s.titres?.partPrudente && <Encadre>Valeur prudente retenue pour la part de l'employeur.</Encadre>}
          <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
            {typographie(`Calculé sur vos ${joursSurSite} jours sur site. Les jours de télétravail ne comptent pas.`)}
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
          onClick={() => (question === "bilan" ? onValider(saisie()) : avancer())}
        >
          {question === "bilan" ? "Valider mes repas" : "Continuer"}
        </button>
      </PiedDePage>

      {aide && <FicheAide fiche={aide} ouverte onFermer={() => setAide(null)} />}
    </div>
  );
}

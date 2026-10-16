// Étape 4 : vos repas (F4). Une question par écran ; le moteur calcule le bilan.
import { ConseilsMetier } from "./QuestionsMetier";
import { useState } from "react";
import { calculerDeclarant } from "../moteur/declarant";
import { eurosCentimes } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import { libelleEtape } from "../parcours/etapes";
import { completerFiche, FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import {
  ACCES,
  LIEUX,
  partDepuisPourcent,
  prixSurPlaceNet,
  restaurationCollective,
  restaurationSurPlace,
  SUR_PLACE,
  type PartEmployeurSurPlace,
  type RestaurationSurPlace,
  partEmployeurPrudente,
  primePanierAnnuelle,
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

type Question = "acces" | "lieu" | "cantine" | "subvention" | "prix" | "employeur" | "bilan";

interface Props {
  parametres: Parametres;
  joursSurSite: number;
  valeurInitiale?: SaisieRepas;
  onValider: (repas: SaisieRepas) => void;
  onRetour: () => void;
  /** F14 — Conseils du métier, en tête de la première question. */
  conseils?: string[];
}

const positif = (n: number | null): n is number => n !== null && !Number.isNaN(n) && n > 0;
const valide = (n: number | null) => n === null || !Number.isNaN(n);

export function Repas({ parametres: p, joursSurSite, valeurInitiale: v, onValider, onRetour, conseils }: Props) {
  const [question, setQuestion] = useState<Question>(v ? "bilan" : "acces");
  const [acces, setAcces] = useState<AccesRepas | undefined>(v?.acces);
  const [lieu, setLieu] = useState<LieuRepas | undefined>(v?.lieu);
  const [surPlace, setSurPlace] = useState<RestaurationSurPlace | undefined>(v ? restaurationSurPlace(v) : undefined);
  const [prixSP, setPrixSP] = useState(v?.prixSurPlace ? afficherMontant(v.prixSurPlace.prix) : "");
  const [avecPartSP, setAvecPartSP] = useState(Boolean(v?.prixSurPlace?.part));
  const [modePart, setModePart] = useState<PartEmployeurSurPlace["mode"]>(v?.prixSurPlace?.part?.mode ?? "pourcent");
  const [partSP, setPartSP] = useState(v?.prixSurPlace?.part ? afficherMontant(v.prixSurPlace.part.valeur) : "");
  const [prixSPPrudent, setPrixSPPrudent] = useState(v?.prixSurPlacePrudent ?? false);
  const [prix, setPrix] = useState(v?.prix ? afficherMontant(v.prix) : "");
  const [prixPrudent, setPrixPrudent] = useState(v ? v.prix === null : false);
  const [avecTitres, setAvecTitres] = useState(Boolean(v?.titres));
  const [valeurTitre, setValeurTitre] = useState(v?.titres ? afficherMontant(v.titres.valeur) : "");
  const [partEmployeur, setPartEmployeur] = useState(v?.titres && !v.titres.partPrudente ? afficherMontant(v.titres.partEmployeur) : "");
  const [partEnPourcent, setPartEnPourcent] = useState(v?.titres?.partPourcent !== undefined);
  const [partPourcent, setPartPourcent] = useState(v?.titres?.partPourcent !== undefined ? afficherMontant(v.titres.partPourcent) : "");
  const [partPrudente, setPartPrudente] = useState(v?.titres?.partPrudente ?? false);
  const [nombreTitres, setNombreTitres] = useState(String(v?.titres?.nombre ?? joursSurSite));
  const [avecPanier, setAvecPanier] = useState(Boolean(v?.primePanier));
  // Prime de panier saisie par jour ; une ancienne saisie annuelle est ramenée au jour.
  const [panier, setPanier] = useState(
    v?.primePanierParJour
      ? afficherMontant(v.primePanierParJour.montant)
      : v?.primePanier && joursSurSite > 0
        ? afficherMontant(Math.round((v.primePanier / joursSurSite) * 100) / 100)
        : "",
  );
  const [joursPanier, setJoursPanier] = useState(String(v?.primePanierParJour?.jours ?? joursSurSite));
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("vos repas");
  const forfait = p.repas.forfait_sans_justificatif_detaille;
  const seuil = p.repas.seuil_alerte_prix_repas;
  const tauxPrudent = Number(p.valeurs_prudentes_je_ne_sais_pas.part_employeur_titre_restaurant);

  const valeurTitreNb = lireMontant(valeurTitre);
  const partPourcentNb = lireMontant(partPourcent);
  const partNb =
    partPrudente && positif(valeurTitreNb)
      ? partEmployeurPrudente(p, valeurTitreNb)
      : partEnPourcent
        ? positif(valeurTitreNb) && positif(partPourcentNb)
          ? partDepuisPourcent(valeurTitreNb, partPourcentNb)
          : null
        : lireMontant(partEmployeur);
  const prixSPNb = lireMontant(prixSP);
  const partSPNb = lireMontant(partSP);
  const panierNb = lireMontant(panier);
  const joursPanierNb = lireEntier(joursPanier);
  const panierAnnuel = positif(panierNb) && positif(joursPanierNb) ? primePanierAnnuelle(panierNb, joursPanierNb) : 0;
  const prixNb = lireMontant(prix);

  function saisie(): SaisieRepas {
    return {
      acces: acces!,
      lieu: acces === "impossible" ? lieu : undefined,
      surPlace: lieu === "gamelle" || lieu === "restaurant" ? surPlace : undefined,
      ...(lieu === "restaurant" && (surPlace === "cantine" || surPlace === "distributeurs")
        ? prixSPPrudent
          ? { prixSurPlacePrudent: true }
          : positif(prixSPNb)
            ? {
                prixSurPlace: {
                  prix: prixSPNb,
                  ...(avecPartSP && positif(partSPNb) ? { part: { mode: modePart, valeur: partSPNb } } : {}),
                },
              }
            : {}
        : {}),
      prix: prixPrudent || !positif(prixNb) ? null : prixNb,
      titres:
        avecTitres && positif(valeurTitreNb)
          ? {
              valeur: valeurTitreNb,
              partEmployeur: positif(partNb) ? partNb : 0,
              partPrudente,
              ...(partEnPourcent && !partPrudente && positif(partPourcentNb) ? { partPourcent: partPourcentNb } : {}),
              nombre: lireEntier(nombreTitres) || 0,
            }
          : null,
      primePanier: avecPanier ? panierAnnuel : 0,
      ...(avecPanier && panierAnnuel > 0 ? { primePanierParJour: { montant: panierNb!, jours: joursPanierNb! } } : {}),
    };
  }

  // Ordre des questions selon les réponses.
  const suite: Question[] = ["acces"];
  if (acces === "impossible") {
    suite.push("lieu");
    if (lieu === "gamelle" || lieu === "restaurant") suite.push("cantine");
    if (lieu === "restaurant" || lieu === "cantine") suite.push("prix");
    if (lieu === "restaurant" && (surPlace === "cantine" || surPlace === "distributeurs")) suite.push("subvention");
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
      titre = "Y a-t-il de quoi se restaurer sur place ou à côté de votre travail ?";
      peutContinuer = surPlace !== undefined;
      contenu = (
        <>
          <ChoixUnique nom="surplace" legende={titre} options={SUR_PLACE} valeur={surPlace} onChoix={(x) => setSurPlace(x as RestaurationSurPlace)} />
          <Encadre>
            {typographie(
              surPlace === "cantine" || surPlace === "distributeurs"
                ? lieu === "gamelle"
                  ? "Avec une restauration sur place, l'administration n'admet pas de déduction pour un repas apporté sans justificatif."
                  : "Avec une restauration sur place, l'administration plafonne votre déduction au prix d'un repas sur place."
                : `Sans restauration sur place, chaque repas apporté compte pour un forfait de ${eurosCentimes(forfait)}.`,
            )}
          </Encadre>
        </>
      );
      break;

    case "subvention": {
      titre = "Combien coûte un repas sur place ?";
      const net = positif(prixSPNb) ? prixSurPlaceNet(saisie(), joursSurSite) : null;
      peutContinuer = prixSPPrudent || (positif(prixSPNb) && (!avecPartSP || positif(partSPNb)));
      contenu = prixSPPrudent ? (
        <>
          <Encadre>{typographie("Sans ce prix, nous ne déduisons rien pour vos repas. C'est le choix le plus prudent.")}</Encadre>
          <button type="button" className="lien-je-ne-sais-pas" onClick={() => setPrixSPPrudent(false)}>
            Finalement, je connais ce prix
          </button>
        </>
      ) : (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Vous déjeunez ailleurs par choix : l'administration retient au plus le prix d'un repas sur place.")}
          </p>
          <ChoixUnique
            nom="forme-prix"
            legende="Ce que vous connaissez"
            options={[
              { valeur: "net", libelle: "Le prix que je paierais" },
              { valeur: "plein", libelle: "Le prix plein et la part de l'employeur" },
            ]}
            valeur={avecPartSP ? "plein" : "net"}
            onChoix={(x) => setAvecPartSP(x === "plein")}
          />
          <ChampMontant
            compact
            libelleVisible
            libelle={avecPartSP ? "Prix plein d'un repas sur place" : "Prix d'un repas sur place, pour vous"}
            valeur={prixSP}
            onChange={setPrixSP}
          />
          {avecPartSP && (
            <>
              <ChoixUnique
                nom="mode-part"
                legende="Part de l'employeur"
                options={[
                  { valeur: "pourcent", libelle: "En pourcentage du repas" },
                  { valeur: "jour", libelle: "En euros par jour" },
                  { valeur: "annee", libelle: "En euros sur l'année", detail: "Total lu sur votre fiche de paie." },
                ]}
                valeur={modePart}
                onChoix={(x) => setModePart(x as PartEmployeurSurPlace["mode"])}
              />
              <ChampNombre
                compact
                libelleVisible
                libelle={modePart === "pourcent" ? "Part de l'employeur" : modePart === "jour" ? "Part de l'employeur par jour" : "Part de l'employeur sur l'année"}
                unite={modePart === "pourcent" ? "%" : "€"}
                valeur={partSP}
                onChange={setPartSP}
              />
            </>
          )}
          <LienJeNeSaisPas onClick={() => setPrixSPPrudent(true)} />
          {net !== null && (
            <Encadre>
              {typographie(
                net <= p.repas.valeur_repas_au_foyer
                  ? `Un repas sur place vous coûterait ${eurosCentimes(net)}, pas plus qu'à la maison : rien à déduire.`
                  : `Prix retenu au plus : ${eurosCentimes(net)}, soit ${eurosCentimes(net - p.repas.valeur_repas_au_foyer)} par jour sur site au maximum.`,
              )}
            </Encadre>
          )}
        </>
      );
      break;
    }

    case "prix":
      titre = "Combien payez-vous en moyenne par repas ?";
      fiche = completerFiche(FICHES.prixRepas, { forfait: eurosCentimes(forfait) });
      peutContinuer = prixPrudent || positif(prixNb);
      contenu = prixPrudent ? (
        <>
          <Encadre>
            {typographie(
              lieu === "restaurant" && (surPlace === "cantine" || surPlace === "distributeurs")
                ? "Avec une restauration sur place, l'administration exige le prix réel : sans lui, rien n'est déduit."
                : `Nous retenons le forfait de ${eurosCentimes(forfait)} par repas, le plus prudent. Il sera signalé dans votre récapitulatif.`,
            )}
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
        (!avecPanier || panierAnnuel > 0) &&
        [lireMontant(partEmployeur), partPourcentNb, panierNb, joursPanierNb, lireEntier(nombreTitres)].every(valide);
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
                <>
                  <ChoixUnique
                    nom="unite-part"
                    legende="Comment connaissez-vous la part de l'employeur ?"
                    options={[
                      { valeur: "euros", libelle: "En euros par titre" },
                      { valeur: "pourcent", libelle: "En pourcentage du titre" },
                    ]}
                    valeur={partEnPourcent ? "pourcent" : "euros"}
                    onChoix={(x) => setPartEnPourcent(x === "pourcent")}
                  />
                  {partEnPourcent ? (
                    <ChampNombre
                      compact
                      libelleVisible
                      libelle="Part payée par votre employeur"
                      unite="%"
                      detail={positif(partNb) ? `Soit ${eurosCentimes(partNb)} par titre.` : "Souvent entre 50 et 60 %."}
                      valeur={partPourcent}
                      onChange={setPartPourcent}
                    />
                  ) : (
                    <ChampMontant
                      compact
                      libelleVisible
                      libelle="Part payée par votre employeur, par titre"
                      valeur={partEmployeur}
                      onChange={setPartEmployeur}
                    />
                  )}
                </>
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
          {avecPanier && (
            <>
              <ChampMontant compact libelleVisible libelle="Prime de panier par jour" valeur={panier} onChange={setPanier} />
              <ChampNombre
                compact
                libelleVisible
                libelle="Jours où vous l'avez reçue"
                detail={
                  panierAnnuel > 0
                    ? `Soit ${eurosCentimes(panierAnnuel)} dans l'année. Pré-rempli avec vos jours sur site.`
                    : "Pré-rempli avec vos jours sur site. Corrigez avec vos bulletins si besoin."
                }
                unite="jours"
                valeur={joursPanier}
                onChange={setJoursPanier}
              />
            </>
          )}
        </>
      );
      break;

    case "bilan": {
      titre = "Vos frais de repas";
      const s = saisie();
      const { repas, reintegrations } = repasPourMoteur(s, joursSurSite, p);
      const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 0, repas: repas ? [repas] : [], reintegrations });
      const ferme = repasDeductibles(s, p, joursSurSite);
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
          {s.prix === null && s.lieu !== "gamelle" && ferme.ok && !restaurationCollective(s) && <Encadre>Valeur prudente retenue pour le prix des repas.</Encadre>}
          {s.titres?.partPrudente && <Encadre>Valeur prudente retenue pour la part de l'employeur.</Encadre>}
          {s.prixSurPlacePrudent && <Encadre>Valeur prudente retenue pour le prix d'un repas sur place.</Encadre>}
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
        {question === "acces" && <ConseilsMetier conseils={conseils} />}
        {contenu}
      </main>

      <PiedDePage onPrecedent={reculer}>
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

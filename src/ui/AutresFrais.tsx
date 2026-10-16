// Étape 6 : vos autres frais (F6) et abonnement de transport (F3.12).
import { ConseilsMetier } from "./QuestionsMetier";
import { useState } from "react";
import { calculerDeclarant } from "../moteur/declarant";
import { euros, eurosCentimes, nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import {
  autresFraisPourMoteur,
  creditImpotSyndicalPerdu,
  GROUPES,
  POSTES,
  priseEnChargePrudente,
  type IdAutreFrais,
  type SaisieAutresFrais,
} from "../parcours/autresFrais";
import { libelleEtape } from "../parcours/etapes";
import { FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { MontantsParEmployeur, totalParEmployeur } from "./MontantsParEmployeur";
import type { Employeur } from "../parcours/employeurs";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { ListeAchats, lignesValides, versAchats, versLignes, type LigneAchat } from "./ListeAchats";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

type Question = "transport" | "postes" | "bilan";

interface Props {
  parametres: Parametres;
  /** Transports en commun choisis à l'étape 3. */
  enTransports: boolean;
  /** Un véhicule déclaré à l'étape 3 reçoit les km de double résidence. */
  aVehicule: boolean;
  /** Postes ouverts d'office par le métier. */
  postesOuvertsDOffice: IdAutreFrais[];
  /** F12 — Deux employeurs ou plus : un remboursement de transport par employeur. */
  employeurs?: Employeur[];
  valeurInitiale?: SaisieAutresFrais;
  onValider: (s: SaisieAutresFrais) => void;
  onRetour: () => void;
  /** F14 — Conseils du métier, en tête de la liste des postes. */
  conseils?: string[];
}

const montant = (t: string) => {
  const n = lireMontant(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};
const texte = (n: number | undefined) => (n ? afficherMontant(n) : "");

export function AutresFrais({ parametres: p, enTransports, aVehicule, postesOuvertsDOffice, employeurs, valeurInitiale: v, onValider, onRetour, conseils }: Props) {
  const [question, setQuestion] = useState<Question>(v ? "bilan" : enTransports ? "transport" : "postes");
  const [ouverts, setOuverts] = useState<IdAutreFrais[]>(v?.ouverts ?? postesOuvertsDOffice);
  const [montants, setMontants] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(v?.montants ?? {}).map(([k, n]) => [k, texte(n)])),
  );
  const [partTelephone, setPartTelephone] = useState(v?.telephonePartPro ? String(Math.round(v.telephonePartPro * 100)) : "");
  const [achats, setAchats] = useState<LigneAchat[]>(versLignes(v?.achats ?? []));
  const [libelleAutre, setLibelleAutre] = useState(v?.libelleAutre ?? "");
  const [motifDR, setMotifDR] = useState(v?.doubleResidence?.motif ?? "");
  const [logementDR, setLogementDR] = useState(texte(v?.doubleResidence?.logement));
  const [billetsDR, setBilletsDR] = useState(texte(v?.doubleResidence?.billets));
  const [kmDR, setKmDR] = useState(v?.doubleResidence?.kmVehicule ? String(v.doubleResidence.kmVehicule) : "");
  // F6.11 — Bureau à domicile hors télétravail.
  const b = v?.bureau;
  const [bureauUsage, setBureauUsage] = useState<"dedie" | "mixte" | undefined>(b?.usage);
  const [bureauStudio, setBureauStudio] = useState(b?.studio ?? false);
  const [bureauSurface, setBureauSurface] = useState(b?.surfaceBureau ? String(b.surfaceBureau) : "");
  const [logementSurface, setLogementSurface] = useState(b?.surfaceTotale ? String(b.surfaceTotale) : "");
  const [bureauCharges, setBureauCharges] = useState(texte(b?.charges));
  const [bureauHeures, setBureauHeures] = useState(b?.heuresParSemaine ? String(b.heuresParSemaine) : "");
  const [bureauSemaines, setBureauSemaines] = useState(b?.semaines ? String(b.semaines) : "");
  const [salleDisponible, setSalleDisponible] = useState<boolean | undefined>(b?.salleDisponible);
  const [abonnement, setAbonnement] = useState(texte(v?.transport?.abonnement));
  const [priseEnCharge, setPriseEnCharge] = useState(v?.transport && !v.transport.priseEnChargePrudente ? texte(v.transport.priseEnCharge) : "");
  const [pecPrudente, setPecPrudente] = useState(v?.transport?.priseEnChargePrudente ?? false);
  const plusieurs = employeurs && employeurs.length > 1 ? employeurs : null;
  const [pecParEmp, setPecParEmp] = useState<string[]>(plusieurs ? plusieurs.map((_, i) => texte(v?.transport?.priseEnChargeParEmployeur?.[i])) : []);
  const totalPecEmp = plusieurs ? totalParEmployeur(pecParEmp) : null;
  const [agentPublic, setAgentPublic] = useState(false);
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("vos autres frais");
  const pecRetenue = pecPrudente
    ? priseEnChargePrudente(p, montant(abonnement), agentPublic)
    : plusieurs
      ? (totalPecEmp ?? 0)
      : montant(priseEnCharge);

  const entier = (t: string) => {
    const n = lireEntier(t);
    return n === null || Number.isNaN(n) ? 0 : n;
  };
  const bureauValide =
    !ouverts.includes("bureauDomicile") ||
    (bureauUsage !== undefined &&
      salleDisponible !== undefined &&
      montant(bureauCharges) > 0 &&
      (bureauStudio || (entier(bureauSurface) > 0 && entier(logementSurface) >= entier(bureauSurface))) &&
      (bureauUsage === "dedie" || (entier(bureauHeures) > 0 && entier(bureauSemaines) > 0 && entier(bureauSemaines) <= 52)));

  function saisie(): SaisieAutresFrais {
    const km = lireEntier(kmDR);
    return {
      ouverts,
      montants: Object.fromEntries(Object.entries(montants).map(([k, t]) => [k, montant(t)])),
      telephonePartPro: Math.min(montant(partTelephone), 100) / 100,
      achats: versAchats(achats, p.millesime.revenus, "matériel"),
      libelleAutre,
      doubleResidence: ouverts.includes("doubleResidence")
        ? { motif: motifDR.trim(), logement: montant(logementDR), billets: montant(billetsDR), kmVehicule: km && !Number.isNaN(km) ? km : 0 }
        : null,
      bureau:
        ouverts.includes("bureauDomicile") && bureauUsage
          ? {
              usage: bureauUsage,
              studio: bureauStudio || undefined,
              surfaceBureau: entier(bureauSurface),
              surfaceTotale: entier(logementSurface),
              charges: montant(bureauCharges),
              heuresParSemaine: bureauUsage === "mixte" ? entier(bureauHeures) : undefined,
              semaines: bureauUsage === "mixte" ? entier(bureauSemaines) : undefined,
              salleDisponible: Boolean(salleDisponible),
            }
          : null,
      transport:
        enTransports && montant(abonnement) > 0
          ? {
              abonnement: montant(abonnement),
              priseEnCharge: pecRetenue,
              priseEnChargePrudente: pecPrudente,
              ...(plusieurs && !pecPrudente ? { priseEnChargeParEmployeur: pecParEmp.map(montant) } : {}),
            }
          : null,
    };
  }

  const suite: Question[] = enTransports ? ["transport", "postes", "bilan"] : ["postes", "bilan"];
  const rang = suite.indexOf(question);
  const avancer = () => setQuestion(suite[rang + 1]);
  const reculer = () => (rang <= 0 ? onRetour() : setQuestion(suite[rang - 1]));

  const basculer = (id: IdAutreFrais, coche: boolean) => setOuverts(coche ? [...ouverts, id] : ouverts.filter((x) => x !== id));
  const champMontant = (id: IdAutreFrais, libelle = "Total de l'année") => (
    <ChampMontant compact libelleVisible libelle={libelle} valeur={montants[id] ?? ""} onChange={(x) => setMontants({ ...montants, [id]: x })} />
  );

  function champsDuPoste(id: IdAutreFrais): JSX.Element {
    switch (id) {
      case "telephone":
        return (
          <>
            {champMontant(id, "Abonnement de l'année")}
            <ChampNombre compact libelleVisible libelle="Part d'usage pour le travail" unite="%" valeur={partTelephone} onChange={setPartTelephone} />
          </>
        );
      case "materiel":
        return <ListeAchats parametres={p} titre="Matériel et outillage" exemples="Outils, instruments, appareils." lignes={achats} onChange={setAchats} />;
      case "cotisationSyndicale": {
        const c = montant(montants[id] ?? "");
        return (
          <>
            {champMontant(id)}
            {c > 0 && (
              <Encadre ton="attention">
                {typographie(
                  `En frais réels, vous perdez le crédit d'impôt de ${Math.round(p.cotisations_syndicales.taux_credit_impot * 100)} % sur cette cotisation, soit ${eurosCentimes(creditImpotSyndicalPerdu(p, c))}. Ne la cochez que si vous la déduisez vraiment.`,
                )}
              </Encadre>
            )}
          </>
        );
      }
      case "grandsDeplacements": {
        const g = p.grand_deplacement_reperes;
        return (
          <>
            {champMontant(id)}
            <p className="champ-detail">
              {typographie(
                `Repères pour une nuit avec petit-déjeuner : ${eurosCentimes(g.logement_petit_dejeuner_paris_petite_couronne_par_jour)} à Paris et en petite couronne, ${eurosCentimes(g.logement_petit_dejeuner_autres_departements_par_jour)} ailleurs. Pour les repas, seul le surcoût compte.`,
              )}
            </p>
          </>
        );
      }
      case "bureauDomicile":
        return (
          <>
            <ChoixUnique
              nom="bureau-usage"
              legende="La pièce où vous travaillez"
              options={[
                { valeur: "dedie", libelle: "Une pièce réservée au travail", detail: "Bureau fermé, utilisé seulement pour le travail." },
                { valeur: "mixte", libelle: "Une pièce aussi utilisée en famille", detail: "Salon, chambre, coin bureau." },
              ]}
              valeur={bureauUsage}
              onChoix={(x) => setBureauUsage(x as "dedie" | "mixte")}
            />
            <label className="case-a-cocher">
              <input type="checkbox" checked={bureauStudio} onChange={(e) => setBureauStudio(e.target.checked)} />
              {typographie(`J'habite un studio (nous retenons ${Math.round(p.teletravail.studio_part_professionnelle * 100)} % de la surface)`)}
            </label>
            {!bureauStudio && (
              <>
                <ChampNombre compact libelleVisible libelle="Surface de la pièce de travail" unite="m²" valeur={bureauSurface} onChange={setBureauSurface} />
                <ChampNombre compact libelleVisible libelle="Surface totale du logement" unite="m²" valeur={logementSurface} onChange={setLogementSurface} />
              </>
            )}
            <ChampMontant
              compact
              libelleVisible
              libelle="Charges du logement sur l'année"
              detail="Loyer ou intérêts d'emprunt, électricité, chauffage, eau, assurance habitation, taxe foncière."
              valeur={bureauCharges}
              onChange={setBureauCharges}
            />
            {bureauUsage === "mixte" && (
              <>
                <ChampNombre compact libelleVisible libelle="Heures de travail à la maison par semaine" unite="h" valeur={bureauHeures} onChange={setBureauHeures} />
                <ChampNombre compact libelleVisible libelle="Semaines concernées dans l'année" detail="Semaines de classe, en général." unite="semaines" valeur={bureauSemaines} onChange={setBureauSemaines} />
              </>
            )}
            <ChoixUnique
              nom="salle-disponible"
              legende="Salle de travail disponible"
              options={[
                { valeur: "non", libelle: "Mon établissement ne me fournit aucun bureau" },
                { valeur: "oui", libelle: "Une salle de travail existe sur place", detail: "Salle des professeurs comprise." },
              ]}
              valeur={salleDisponible === undefined ? undefined : salleDisponible ? "oui" : "non"}
              onChoix={(x) => setSalleDisponible(x === "oui")}
            />
            {salleDisponible && (
              <Encadre ton="attention">
                {typographie(
                  "L'administration peut considérer qu'un bureau vous est fourni et refuser cette déduction. Demandez confirmation par la messagerie sécurisée de votre espace impots.gouv.fr avant de déclarer.",
                )}
              </Encadre>
            )}
          </>
        );
      case "doubleResidence":
        return (
          <>
            <label className="champ-libelle" htmlFor="motif-dr">
              Pourquoi votre famille vit-elle ailleurs ?
            </label>
            <input
              id="motif-dr"
              className="champ-texte"
              placeholder="Par exemple : emploi du conjoint"
              value={motifDR}
              onChange={(e) => setMotifDR(e.target.value)}
            />
            <ChampMontant compact libelleVisible libelle="Loyer et charges du second logement" valeur={logementDR} onChange={setLogementDR} />
            {aVehicule ? (
              <ChampNombre
                compact
                libelleVisible
                libelle="Kilomètres des allers-retours vers votre famille, avec votre véhicule"
                detail="Ils s'ajoutent aux kilomètres de votre véhicule pour le barème."
                unite="km"
                valeur={kmDR}
                onChange={setKmDR}
              />
            ) : null}
            <ChampMontant compact libelleVisible libelle="Billets de train ou de car pour ces trajets" valeur={billetsDR} onChange={setBilletsDR} />
          </>
        );
      case "autre":
        return (
          <>
            <label className="champ-libelle" htmlFor="libelle-autre">
              De quoi s'agit-il ?
            </label>
            <input id="libelle-autre" className="champ-texte" value={libelleAutre} onChange={(e) => setLibelleAutre(e.target.value)} />
            {champMontant(id)}
          </>
        );
      default:
        return champMontant(id);
    }
  }

  let titre = "";
  let contenu: JSX.Element;
  let peutContinuer = true;
  let fiche: Fiche | undefined;

  switch (question) {
    case "transport":
      titre = "Votre abonnement de transport";
      fiche = FICHES.transport;
      peutContinuer =
        montant(abonnement) > 0 &&
        (pecPrudente || (plusieurs ? totalPecEmp !== null : lireMontant(priseEnCharge) !== null)) &&
        [abonnement, priseEnCharge].every((t) => !Number.isNaN(lireMontant(t)));
      contenu = (
        <>
          <ChampMontant compact libelleVisible libelle="Prix de l'abonnement sur l'année" valeur={abonnement} onChange={setAbonnement} />
          {pecPrudente ? (
            <>
              <label className="case-a-cocher">
                <input type="checkbox" checked={agentPublic} onChange={(e) => setAgentPublic(e.target.checked)} />
                Je suis agent public (fonction publique, hôpital public)
              </label>
              <Encadre>{typographie(`Nous retenons un remboursement de ${eurosCentimes(pecRetenue)}, le choix le plus prudent.`)}</Encadre>
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => setPecPrudente(false)}>
                Finalement, je connais le remboursement
              </button>
            </>
          ) : (
            <>
              {plusieurs ? (
                <MontantsParEmployeur
                  employeurs={plusieurs}
                  libelle="Remboursé sur l'année, par employeur"
                  detail="Laissez vide pour un employeur qui n'a rien remboursé."
                  valeurs={pecParEmp}
                  onChange={setPecParEmp}
                />
              ) : (
                <ChampMontant
                  compact
                  libelleVisible
                  libelle="Remboursé par votre employeur sur l'année"
                  detail="Écrivez 0 si rien n'est remboursé."
                  valeur={priseEnCharge}
                  onChange={setPriseEnCharge}
                />
              )}
              <LienJeNeSaisPas onClick={() => setPecPrudente(true)} />
            </>
          )}
          <Encadre>{typographie("Seule la part restée à votre charge se déduit. Les billets de taxi ou de VTC ne comptent que dans des cas rares.")}</Encadre>
        </>
      );
      break;

    case "postes":
      titre = "Avez-vous d'autres frais pour votre travail ?";
      fiche = FICHES.autresFrais;
      peutContinuer =
        Object.values(montants).every((t) => !Number.isNaN(lireMontant(t))) &&
        lignesValides(achats) &&
        (!ouverts.includes("doubleResidence") || motifDR.trim().length > 0) &&
        bureauValide &&
        (!ouverts.includes("autre") || libelleAutre.trim().length > 0);
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Cochez ce qui vous concerne. Ce qui correspond à votre métier est déjà coché : décochez si besoin.")}
          </p>
          {GROUPES.map((g) => (
            <section key={g.id} className="groupe-postes" aria-labelledby={`groupe-${g.id}`}>
              <h2 id={`groupe-${g.id}`} className="groupe-titre">
                {g.titre}
              </h2>
              {POSTES.filter((x) => x.groupe === g.id).map((poste) => (
                <div key={poste.id} className="poste">
                  <label className="case-a-cocher">
                    <input type="checkbox" checked={ouverts.includes(poste.id)} onChange={(e) => basculer(poste.id, e.target.checked)} />
                    <span>
                      {poste.question}
                      {poste.detail && <small className="choix-detail">{typographie(poste.detail)}</small>}
                    </span>
                  </label>
                  {ouverts.includes(poste.id) && <div className="poste-champs">{champsDuPoste(poste.id)}</div>}
                </div>
              ))}
            </section>
          ))}
        </>
      );
      break;

    case "bilan": {
      titre = "Vos autres frais";
      const r = autresFraisPourMoteur(p, saisie());
      const d = calculerDeclarant(p, { numero: 1, salairePrerempli: 0, autresFrais: r.autresFrais, motifs: r.motifs });
      contenu = (
        <>
          <section className="carte" aria-live="polite">
            <p className="resultat-jours">
              <strong className="montant">{euros(d.montantCase)}</strong>
            </p>
            {r.autresFrais.length === 0 && <p className="detail-calcul">Aucun autre frais à compter.</p>}
            {r.autresFrais.map((l) => (
              <p key={l.libelle} className="detail-calcul">
                {typographie(`${l.libelle.charAt(0).toUpperCase()}${l.libelle.slice(1)} : ${euros(l.montant)}`)}
              </p>
            ))}
          </section>
          {r.kmVehiculeEnPlus > 0 && (
            <Encadre>
              {typographie(`${nombre(r.kmVehiculeEnPlus)} km de double résidence seront ajoutés à votre véhicule : le barème s'applique au total.`)}
            </Encadre>
          )}
          {r.motifs.length > 0 && <Encadre>{typographie(`Motif repris dans votre déclaration : ${r.motifs.join(" ; ")}.`)}</Encadre>}
          <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
            {typographie("Gardez vos factures et attestations 3 ans, au cas où les impôts vous les demandent.")}
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
        {question === "postes" && <ConseilsMetier conseils={conseils} />}
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
          {question === "bilan" ? "Valider mes autres frais" : "Continuer"}
        </button>
      </PiedDePage>

      {aide && <FicheAide fiche={aide} ouverte onFermer={() => setAide(null)} />}
    </div>
  );
}

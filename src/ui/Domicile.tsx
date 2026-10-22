// Étape 3 du parcours « intervenants à domicile » (F13, maquette 04) : remplace « Votre trajet ».
import { useState } from "react";
import { calculerDeclarant, type Energie } from "../moteur/declarant";
import { euros, eurosCentimes, nombre } from "../moteur/format";
import type { Parametres, TypeVehicule } from "../moteur/types";
import {
  bilanJournees,
  domicilePourMoteur,
  ecartCoherence,
  EMPLOYEURS,
  forfaitsPrudents,
  libellesTroncons,
  type JourneeSaisie,
  type SaisieDomicile,
  type TypeEmployeur,
} from "../parcours/domicile";
import { libelleEtape } from "../parcours/etapes";
import { completerFiche, FICHES, type FicheAide as Fiche } from "../parcours/fichesAide";
import { afficherMontant, lireEntier, lireMontant } from "../parcours/saisie";
import { ENERGIES, libelleLigne, lignePrudente, messageMotif, motifsDistance, optionsPuissance } from "../parcours/trajet";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant, ChampNombre } from "./ChampNombre";
import { BandeauConfidentialite, ChoixUnique, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

type Question = "employeurs" | "indemnites" | "journees" | "vehicule" | "bilan";

interface Props {
  parametres: Parametres;
  joursSurSite: number;
  /** Foyer connu : sans conjoint, le motif « emploi du conjoint » n'est pas proposé. */
  couple?: boolean;
  valeurInitiale?: SaisieDomicile;
  onValider: (s: SaisieDomicile) => void;
  onRetour: () => void;
}

interface JourneeTexte {
  troncons: string[];
  rembourses: boolean[];
  jours: string;
}

const nb = (t: string, lire: (t: string) => number | null) => {
  const n = lire(t);
  return n === null || Number.isNaN(n) ? 0 : n;
};

const journeeVide = (jours: number): JourneeTexte => ({ troncons: ["", "", ""], rembourses: [true], jours: String(jours) });

export function Domicile({ parametres: p, joursSurSite, couple, valeurInitiale: v, onValider, onRetour }: Props) {
  const [question, setQuestion] = useState<Question>(v ? "bilan" : "employeurs");
  const [employeurs, setEmployeurs] = useState<TypeEmployeur[]>(v?.employeurs ?? []);
  const [indemnites, setIndemnites] = useState(v?.indemnites ? afficherMontant(v.indemnites) : "");
  const [forfaits, setForfaits] = useState(v?.forfaitsTransport && !v.forfaitsPrudents ? afficherMontant(v.forfaitsTransport) : "");
  const [forfaitPrudent, setForfaitPrudent] = useState(v?.forfaitsPrudents ?? false);
  const [montantFiche, setMontantFiche] = useState("");
  const [personnes, setPersonnes] = useState("");
  const [journees, setJournees] = useState<JourneeTexte[]>(
    v?.journees.map((j) => ({ troncons: j.troncons.map(String), rembourses: j.rembourses, jours: String(j.jours) })) ?? [journeeVide(joursSurSite)],
  );
  const [active, setActive] = useState(0);
  const [motif, setMotif] = useState<string | undefined>(v?.motifDistance);
  const [kmComplementaires, setKmComplementaires] = useState(v?.kmComplementaires ?? 0);
  const [vehicule, setVehicule] = useState<TypeVehicule | undefined>(v?.vehicule);
  const [energie, setEnergie] = useState<Energie | undefined>(v?.energie);
  const [energiePrudente, setEnergiePrudente] = useState(v?.energiePrudente ?? false);
  const [ligne, setLigne] = useState<string | undefined>(v?.ligne);
  const [puissancePrudente, setPuissancePrudente] = useState(v?.puissancePrudente ?? false);
  const [aide, setAide] = useState<Fiche | null>(null);

  const etape = libelleEtape("votre trajet");
  const plafond = p.deplacements.distance_aller_max_sans_justification_km;
  const forfaitCalcule = forfaitsPrudents(nb(montantFiche, lireMontant), nb(personnes, lireEntier));

  function saisie(): SaisieDomicile {
    const js: JourneeSaisie[] = journees.map((j) => ({
      troncons: j.troncons.map((t) => nb(t, lireMontant)),
      rembourses: j.rembourses,
      jours: nb(j.jours, lireEntier),
    }));
    const auDela = js.some((j) => j.troncons[0] > plafond || j.troncons[j.troncons.length - 1] > plafond);
    return {
      employeurs,
      indemnites: nb(indemnites, lireMontant),
      forfaitsTransport: forfaitPrudent ? forfaitCalcule : nb(forfaits, lireMontant),
      forfaitsPrudents: forfaitPrudent,
      journees: js,
      motifDistance: auDela && motif && motif !== "aucun" ? motif : undefined,
      kmComplementaires,
      vehicule: vehicule ?? "voiture",
      energie: energie ?? "thermique",
      energiePrudente,
      ligne: vehicule === "cyclomoteur" ? undefined : ligne,
      puissancePrudente,
    };
  }

  const suite: Question[] = ["employeurs", "indemnites", "journees", "vehicule", "bilan"];
  const rang = suite.indexOf(question);
  const avancer = () => setQuestion(suite[rang + 1]);
  const reculer = () => (rang <= 0 ? onRetour() : setQuestion(suite[rang - 1]));

  let titre = "";
  let contenu: JSX.Element;
  let peutContinuer = true;
  let fiche: Fiche | undefined;

  switch (question) {
    case "employeurs":
      titre = "Qui édite vos fiches de paie ?";
      contenu = (
        <>
          <p className="texte-secondaire sous-question">{typographie("Plusieurs réponses possibles.")}</p>
          {EMPLOYEURS.map((e) => (
            <label key={e.valeur} className="case-a-cocher">
              <input
                type="checkbox"
                checked={employeurs.includes(e.valeur)}
                onChange={(x) => setEmployeurs(x.target.checked ? [...employeurs, e.valeur] : employeurs.filter((y) => y !== e.valeur))}
              />
              <span>
                {e.libelle}
                <small className="choix-detail">{typographie(e.detail)}</small>
              </span>
            </label>
          ))}
          {employeurs.length === 0 && (
            <Encadre>{typographie("Vous ne savez pas ? Continuez : nous appliquerons les règles générales, sans supposer de taux de remboursement.")}</Encadre>
          )}
          {(employeurs.includes("mandataire") || employeurs.includes("particulier")) && (
            <Encadre>
              {typographie(
                "Pour votre salaire, le plus simple est de recopier le montant déjà écrit dans votre déclaration en ligne, case 1AJ : inutile d'additionner toutes vos fiches.",
              )}
            </Encadre>
          )}
        </>
      );
      break;

    case "indemnites":
      titre = "Ce que vous avez reçu pour vos trajets";
      fiche = FICHES.indemnitesKm;
      peutContinuer = [indemnites, forfaits, montantFiche].every((t) => !Number.isNaN(lireMontant(t))) && !Number.isNaN(lireEntier(personnes));
      contenu = (
        <>
          <p className="texte-secondaire sous-question">
            {typographie("Ces sommes s'ajoutent à votre salaire déclaré. En échange, tous vos kilomètres comptent au barème.")}
          </p>
          <ChampMontant compact libelleVisible libelle="Indemnités kilométriques de l'année" detail="Écrivez 0 si vous n'en recevez pas." valeur={indemnites} onChange={setIndemnites} />
          {forfaitPrudent ? (
            <>
              <ChampMontant compact libelleVisible libelle="Montant du forfait transport sur une fiche" valeur={montantFiche} onChange={setMontantFiche} />
              <ChampNombre compact libelleVisible libelle="Nombre de personnes aidées" unite="personnes" valeur={personnes} onChange={setPersonnes} />
              <Encadre>{typographie(`Nous retenons ${eurosCentimes(forfaitCalcule)} sur l'année (12 fiches par personne aidée), le choix le plus prudent.`)}</Encadre>
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => setForfaitPrudent(false)}>
                Finalement, je connais le total
              </button>
            </>
          ) : (
            <>
              <ChampMontant
                compact
                libelleVisible
                libelle="Forfaits ou participations aux frais de transport de l'année"
                detail="Souvent quelques euros sur chaque fiche d'un mandataire."
                valeur={forfaits}
                onChange={setForfaits}
              />
              <LienJeNeSaisPas onClick={() => setForfaitPrudent(true)} />
            </>
          )}
        </>
      );
      break;

    case "journees": {
      titre = "Dessinons une journée type";
      fiche = FICHES.distance;
      const j = journees[active];
      const maj = (nouvelle: JourneeTexte) => setJournees(journees.map((x, i) => (i === active ? nouvelle : x)));
      const s = saisie();
      const b = bilanJournees(p, { journees: [s.journees[active]], motifDistance: s.motifDistance });
      const parJour = (km: number) => (s.journees[active].jours > 0 ? km / s.journees[active].jours : 0);
      const totalJour = parJour(b.domicileTravail + b.professionnels);
      const auDela = s.journees.some((x) => x.troncons[0] > plafond || x.troncons[x.troncons.length - 1] > plafond);
      const totalJours = s.journees.reduce((t, x) => t + x.jours, 0);
      const libelles = libellesTroncons(j.troncons.length);
      peutContinuer =
        s.journees.every((x) => x.troncons.every((km) => km >= 0) && x.jours > 0 && x.troncons[0] > 0) &&
        journees.every((x) => x.troncons.every((t) => !Number.isNaN(lireMontant(t))) && !Number.isNaN(lireEntier(x.jours))) &&
        (!auDela || motif !== undefined);
      contenu = (
        <>
          <p className="texte-secondaire sous-question">{typographie("Indiquez la distance de chaque trajet. On classe tout pour vous.")}</p>
          {journees.length > 1 && (
            <div className="pastilles-liste" role="tablist" aria-label="Journées types">
              {journees.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  className={i === active ? "pastille-choix pastille-choix-coche" : "pastille-choix"}
                  onClick={() => setActive(i)}
                >
                  Journée {i + 1}
                </button>
              ))}
            </div>
          )}
          <section className="journee" aria-label="Trajets de la journée">
            {j.troncons.map((t, i) => {
              const extreme = i === 0 || i === j.troncons.length - 1;
              return (
                <div key={i} className={extreme ? "troncon troncon-domicile" : "troncon troncon-pro"}>
                  <div className="troncon-texte">
                    <div className="troncon-libelle">{libelles[i]}</div>
                    <div className="troncon-type">
                      {extreme ? "Domicile-travail" : j.rembourses[i - 1] ? "Professionnel · remboursé" : "Professionnel · non remboursé"}
                    </div>
                    {!extreme && (
                      <label className="troncon-rembourse">
                        <input
                          type="checkbox"
                          checked={j.rembourses[i - 1]}
                          onChange={(e) => maj({ ...j, rembourses: j.rembourses.map((r, k) => (k === i - 1 ? e.target.checked : r)) })}
                        />
                        Remboursé par l'employeur
                      </label>
                    )}
                  </div>
                  <label className="troncon-km">
                    <input
                      className="cellule"
                      type="text"
                      inputMode="decimal"
                      aria-label={`${libelles[i]}, kilomètres`}
                      value={t}
                      onChange={(e) => maj({ ...j, troncons: j.troncons.map((x, k) => (k === i ? e.target.value : x)) })}
                    />
                    km
                  </label>
                </div>
              );
            })}
          </section>
          <div className="actions-tableau">
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => maj({ ...j, troncons: [...j.troncons.slice(0, -1), "", j.troncons[j.troncons.length - 1]], rembourses: [...j.rembourses, true] })}
            >
              + Ajouter une personne
            </button>
            {j.troncons.length > 2 && (
              <button
                type="button"
                className="bouton bouton-secondaire"
                onClick={() => maj({ ...j, troncons: [...j.troncons.slice(0, -2), j.troncons[j.troncons.length - 1]], rembourses: j.rembourses.slice(0, -1) })}
              >
                Retirer la dernière personne
              </button>
            )}
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => {
                setJournees([...journees, journeeVide(0)]);
                setActive(journees.length);
              }}
            >
              Autre journée type
            </button>
          </div>
          <ChampNombre
            compact
            libelleVisible
            libelle="Nombre de jours comme celle-ci dans l'année"
            detail={`Vous avez ${joursSurSite} jours de travail sur le terrain au total.`}
            unite="jours"
            valeur={j.jours}
            onChange={(x) => maj({ ...j, jours: x })}
          />
          <section className="carte" aria-live="polite">
            <p className="resultat-jours">
              <strong className="montant">{nombre(totalJour)} km</strong> cette journée
            </p>
            <div className="barre-journee" aria-hidden="true">
              <div style={{ flex: parJour(b.domicileTravail) || 0.0001 }} className="barre-domicile" />
              <div style={{ flex: parJour(b.professionnels) || 0.0001 }} className="barre-pro" />
            </div>
            <p className="detail-calcul">
              {nombre(parJour(b.domicileTravail))} km domicile-travail · {nombre(parJour(b.professionnels))} km professionnels
            </p>
            {b.professionnelsRembourses > 0 && (
              <p className="detail-calcul">
                {typographie(
                  `Votre employeur en rembourse ${nombre(parJour(b.professionnelsRembourses))} : son indemnité s'ajoute à votre salaire, et les ${nombre(totalJour)} km comptent dans vos frais réels.`,
                )}
              </p>
            )}
          </section>
          {totalJours > joursSurSite && (
            <Encadre ton="attention">
              {typographie(`Vos journées types font ${totalJours} jours, plus que vos ${joursSurSite} jours de travail. Pouvez-vous vérifier ?`)}
            </Encadre>
          )}
          {auDela && (
            <>
              <Encadre ton="attention">
                {typographie(`Au-delà de ${plafond} km entre la maison et une personne aidée, il faut une raison. Choisissez la vôtre, on l'écrira pour vous.`)}
              </Encadre>
              <ChoixUnique
                nom="motif-domicile"
                legende="Raison de la distance"
                options={[...motifsDistance(couple), { valeur: "aucun", libelle: `Aucune de ces raisons : compter ${plafond} km` }]}
                valeur={motif}
                onChoix={setMotif}
              />
              {messageMotif(motif, plafond) && <Encadre>{typographie(messageMotif(motif, plafond)!)}</Encadre>}
            </>
          )}
        </>
      );
      break;
    }

    case "vehicule": {
      titre = "Avec quel véhicule ?";
      fiche = vehicule && vehicule !== "cyclomoteur" ? completerFiche(FICHES.puissance, { lignePrudente: libelleLigne(lignePrudente(p, vehicule), optionsPuissance(p, vehicule).map((o) => o.valeur)) }) : undefined;
      const options = vehicule && vehicule !== "cyclomoteur" ? optionsPuissance(p, vehicule) : [];
      peutContinuer = vehicule !== undefined && energie !== undefined && (vehicule === "cyclomoteur" || ligne !== undefined);
      contenu = (
        <>
          <ChoixUnique
            nom="vehicule-domicile"
            legende="Type de véhicule"
            options={[
              { valeur: "voiture", libelle: "Voiture" },
              { valeur: "moto", libelle: "Moto ou scooter" },
              { valeur: "cyclomoteur", libelle: "Cyclomoteur" },
            ]}
            valeur={vehicule}
            onChoix={(x) => {
              setVehicule(x as TypeVehicule);
              setLigne(undefined);
              setPuissancePrudente(false);
            }}
          />
          {vehicule && (
            <>
              <p className="champ-libelle">Énergie</p>
              <ChoixUnique
                nom="energie-domicile"
                legende="Énergie"
                options={vehicule === "voiture" ? ENERGIES : ENERGIES.filter((e) => e.valeur === "essence" || e.valeur === "électrique")}
                valeur={energiePrudente ? undefined : energie}
                onChoix={(x) => (setEnergie(x as Energie), setEnergiePrudente(false))}
              />
              {energiePrudente ? (
                <Encadre>{typographie("Barème des véhicules thermiques retenu, le plus prudent.")}</Encadre>
              ) : (
                <LienJeNeSaisPas onClick={() => (setEnergie("thermique"), setEnergiePrudente(true))} />
              )}
            </>
          )}
          {options.length > 0 && (
            <>
              <p className="champ-libelle">Chevaux (puissance fiscale, carte grise case P.6)</p>
              <ChoixUnique nom="puissance-domicile" legende="Puissance fiscale" options={options} valeur={ligne} onChoix={(x) => (setLigne(x), setPuissancePrudente(false))} />
              {puissancePrudente ? (
                <Encadre>{typographie("Puissance la plus basse retenue, le choix prudent.")}</Encadre>
              ) : (
                <LienJeNeSaisPas onClick={() => (setLigne(lignePrudente(p, vehicule as "voiture" | "moto")), setPuissancePrudente(true))} />
              )}
            </>
          )}
          <Encadre>
            {typographie(
              "La surprime d'assurance pour usage professionnel est déjà comprise dans le barème : ne la comptez pas en plus. Votre employeur peut parfois la rembourser.",
            )}
          </Encadre>
        </>
      );
      break;
    }

    case "bilan": {
      titre = "Vos frais de trajets";
      const s = saisie();
      const { vehicule: entree, reintegrations } = domicilePourMoteur(p, s);
      const r = calculerDeclarant(p, { numero: 1, salairePrerempli: 0, vehicules: [entree], reintegrations });
      const coherence = ecartCoherence(p, s);
      const lignes = r.lignes.filter((l) => l.categorie === "vehicule");
      contenu = (
        <>
          <section className="carte" aria-live="polite">
            <p className="resultat-jours">
              <strong className="montant">{euros(lignes.reduce((t, l) => t + l.montant, 0))}</strong>
            </p>
            {lignes.map((l) => (
              <p key={l.texte} className="detail-calcul">
                {typographie(l.texte)}
              </p>
            ))}
          </section>
          {r.totalReintegrations > 0 && (
            <Encadre>
              {typographie(
                `Votre salaire déclaré sera augmenté de ${euros(r.totalReintegrations)} (${reintegrations.map((x) => x.libelle).join(", ")}). Nous en tenons compte dans la comparaison.`,
              )}
            </Encadre>
          )}
          {coherence.ecart > 0 && (
            <>
              <Encadre ton="attention">
                {typographie(
                  `Vos indemnités correspondent à environ ${nombre(coherence.kmIndemnises ?? 0)} km remboursés, mais vos journées types ne comptent que ${nombre(bilanJournees(p, s).professionnels + kmComplementaires)} km entre personnes aidées.`,
                )}
              </Encadre>
              <button type="button" className="bouton bouton-secondaire" onClick={() => setKmComplementaires(kmComplementaires + coherence.ecart)}>
                Ajouter {nombre(coherence.ecart)} km professionnels
              </button>
            </>
          )}
          {r.alertes.map((a) => (
            <Encadre key={a} ton="attention">
              {typographie(a)}
            </Encadre>
          ))}
          <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)" }}>
            {typographie("Gardez vos plannings, l'historique de pointage et vos bulletins : ils justifient ces kilomètres.")}
          </p>
        </>
      );
      break;
    }
  }

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle.replace("votre trajet", "vos trajets")} etape={etape.numero} total={etape.total} onRetour={reculer} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <div className="question-titre">
          <h1 className="titre-question">{typographie(titre)}</h1>
          {fiche && <BoutonAsterisque onClick={() => setAide(fiche!)} />}
        </div>
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
          {question === "bilan" ? "Valider mes trajets" : "Continuer"}
        </button>
      </PiedDePage>

      {aide && <FicheAide fiche={aide} ouverte onFermer={() => setAide(null)} />}
    </div>
  );
}

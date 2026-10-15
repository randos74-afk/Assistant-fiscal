// Étape 1 : votre salaire (F1.4, docs/02 §3 et §4).
// Seule donnée sans valeur par défaut : « Je ne sais pas » propose d'additionner les 12 bulletins.
// F12 : plusieurs employeurs, une fiche chacun ; l'application additionne et compare au prérempli.
import { useState } from "react";
import { libelleEtape } from "../parcours/etapes";
import { FICHES } from "../parcours/fichesAide";
import { NOMS_MOIS_LONGS, nomEmployeur, totalSalaires, type Employeur } from "../parcours/employeurs";
import { afficherMontant, lireMontant } from "../parcours/saisie";
import { BoutonAsterisque, FicheAide, LienJeNeSaisPas } from "./Aide";
import { PiedDePage } from "./Cadre";
import { ChampMontant } from "./ChampNombre";
import { typographie } from "./typographie";
import { BandeauConfidentialite, Encadre, EnTeteEtape, Pastilles } from "./Question";

export interface SaisieSalaire {
  montant: number;
  source: "bulletin-decembre" | "addition-bulletins" | "employeurs";
  /** Détail des 12 mois quand la personne les a additionnés. */
  mois?: string[];
  /** F12 — Deux employeurs ou plus dans l'année. */
  employeurs?: Employeur[];
  /** F12.3 et F12.4 — Montant prérempli case 1AJ ; il fait foi s'il est indiqué. */
  preRempli?: number;
  /** F12.7 — Allocations chômage de l'année (déclarées à part) : la déduction de 10 % porte aussi sur elles. */
  chomage?: number;
}

interface FicheTexte {
  nom: string;
  debut: number;
  fin: number;
  salaire: string;
}

const ficheVide = (i: number): FicheTexte => ({ nom: "", debut: i === 0 ? 0 : 11, fin: 11, salaire: "" });

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface Props {
  millesime: number;
  valeurInitiale?: SaisieSalaire;
  onValider: (salaire: SaisieSalaire) => void;
  onRetour: () => void;
}

export function Salaire({ millesime, valeurInitiale, onValider, onRetour }: Props) {
  const [texte, setTexte] = useState(valeurInitiale?.source === "bulletin-decembre" ? afficherMontant(valeurInitiale.montant) : "");
  const [modeAddition, setModeAddition] = useState(valeurInitiale?.source === "addition-bulletins");
  const [mois, setMois] = useState<string[]>(valeurInitiale?.mois ?? Array(12).fill(""));
  const [aideOuverte, setAideOuverte] = useState(false);
  const [fiches, setFiches] = useState<FicheTexte[]>(
    valeurInitiale?.employeurs?.map((e) => ({
      nom: e.nom,
      debut: e.debut,
      fin: e.fin,
      salaire: e.salaire === null ? "" : afficherMontant(e.salaire),
    })) ?? [ficheVide(0)],
  );
  const [preRempli, setPreRempli] = useState(valeurInitiale?.preRempli ? afficherMontant(valeurInitiale.preRempli) : "");
  const [sansBulletins, setSansBulletins] = useState(
    Boolean(valeurInitiale?.employeurs && valeurInitiale.employeurs.some((e) => e.salaire === null)),
  );
  const plusieurs = fiches.length > 1;
  const [avecChomage, setAvecChomage] = useState(Boolean(valeurInitiale?.chomage));
  const [chomage, setChomage] = useState(valeurInitiale?.chomage ? afficherMontant(valeurInitiale.chomage) : "");
  const chomageNb = lireMontant(chomage);
  const chomageValide = !avecChomage || (chomageNb !== null && !Number.isNaN(chomageNb) && chomageNb > 0);
  const avecLeChomage = <T extends SaisieSalaire>(s: T): T => (avecChomage && chomageNb ? { ...s, chomage: chomageNb } : s);

  function nombreEmployeurs(n: number) {
    setFiches(Array.from({ length: n }, (_, i) => fiches[i] ?? ficheVide(i)));
  }
  function modifierFiche(i: number, champ: Partial<FicheTexte>) {
    setFiches(fiches.map((f, k) => (k === i ? { ...f, ...champ } : f)));
  }

  const etape = libelleEtape("votre salaire");
  const titre = typographie(`Combien avez-vous gagné en ${millesime} ?`);

  const valeursMois = mois.map(lireMontant);
  const totalMois = valeursMois.reduce<number>((s, m) => s + (m && !Number.isNaN(m) ? m : 0), 0);
  const moisInvalides = valeursMois.some((m) => m !== null && Number.isNaN(m));

  // F12 : fiches par employeur, addition, montant prérempli qui fait foi.
  const employeurs: Employeur[] = fiches.map((f) => {
    const n = lireMontant(f.salaire);
    return { nom: f.nom, debut: f.debut, fin: f.fin, salaire: sansBulletins || n === null || Number.isNaN(n) ? null : n };
  });
  const totalEmployeurs = totalSalaires(employeurs);
  const preRempliNb = lireMontant(preRempli);
  const preRempliConnu = preRempliNb !== null && !Number.isNaN(preRempliNb) && preRempliNb > 0;
  const fichesValides =
    fiches.every((f) => f.debut <= f.fin) &&
    (sansBulletins
      ? preRempliConnu
      : fiches.every((f) => {
          const n = lireMontant(f.salaire);
          return n !== null && !Number.isNaN(n) && n > 0;
        })) &&
    (preRempli.trim() === "" || preRempliConnu);
  const ecart = preRempliConnu && !sansBulletins && Math.abs(preRempliNb - totalEmployeurs) >= 1;

  const montant = plusieurs ? (preRempliConnu ? preRempliNb : totalEmployeurs) : modeAddition ? totalMois : lireMontant(texte);
  const valide =
    montant !== null && !Number.isNaN(montant) && montant > 0 && (plusieurs ? fichesValides : !(modeAddition && moisInvalides));

  function valider() {
    if (!valide || !chomageValide || montant === null) return;
    if (plusieurs) {
      onValider(avecLeChomage({ montant, source: "employeurs", employeurs, ...(preRempliConnu && preRempliNb !== null ? { preRempli: preRempliNb } : {}) }));
      return;
    }
    onValider(avecLeChomage(modeAddition ? { montant, source: "addition-bulletins", mois } : { montant, source: "bulletin-decembre" }));
  }

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <div className="question-titre">
          <h1 className="titre-question">{titre}</h1>
          <BoutonAsterisque onClick={() => setAideOuverte(true)} />
        </div>
        <Pastilles
          legende={`Combien d'employeurs avez-vous eus en ${millesime} ?`}
          options={[1, 2, 3, 4]}
          libelle={(n) => (n === 4 ? "4 ou +" : String(n))}
          valeur={Math.min(fiches.length, 4)}
          onChoix={nombreEmployeurs}
        />
        <p className="texte-secondaire" style={{ fontSize: "var(--taille-texte-min)", margin: 0 }}>
          {typographie("Comptez aussi l'intérim, les particuliers employeurs et les missions courtes.")}
        </p>

        {plusieurs ? (
          <>
            <p className="texte-secondaire sous-question">
              {typographie(
                sansBulletins
                  ? "Indiquez la période de chaque employeur. Le salaire vient du montant prérempli, qui les contient tous."
                  : "Pour chaque employeur : sa période, et le net imposable cumulé lu sur son dernier bulletin. Nous faisons l'addition.",
              )}
            </p>
            {fiches.map((f, i) => (
              <section key={i} className="carte" aria-labelledby={`employeur-${i}`}>
                <h2 id={`employeur-${i}`}>{nomEmployeur(employeurs[i], i)}</h2>
                <label className="champ-libelle" htmlFor={`nom-employeur-${i}`}>
                  Nom (facultatif)
                </label>
                <input
                  id={`nom-employeur-${i}`}
                  className="champ-texte"
                  placeholder={`Employeur ${i + 1}`}
                  value={f.nom}
                  onChange={(e) => modifierFiche(i, { nom: e.target.value })}
                />
                <div style={{ display: "flex", gap: 12 }}>
                  {(["debut", "fin"] as const).map((champ) => (
                    <label key={champ} className="champ-libelle" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      {champ === "debut" ? "De" : "À"}
                      <select
                        className="champ-texte"
                        value={f[champ]}
                        onChange={(e) => modifierFiche(i, { [champ]: Number(e.target.value) })}
                      >
                        {NOMS_MOIS_LONGS.map((m, k) => (
                          <option key={m} value={k}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                {f.debut > f.fin && <p className="champ-erreur">Le mois de fin doit venir après le mois de début.</p>}
                {!sansBulletins && (
                  <ChampMontant
                    compact
                    libelleVisible
                    libelle="Net imposable cumulé"
                    detail="Sur le dernier bulletin de cet employeur."
                    valeur={f.salaire}
                    onChange={(t) => modifierFiche(i, { salaire: t })}
                  />
                )}
              </section>
            ))}
            {fiches.length >= 4 && (
              <button type="button" className="bouton bouton-secondaire" onClick={() => setFiches([...fiches, ficheVide(fiches.length)])}>
                Ajouter un employeur
              </button>
            )}
            {!sansBulletins && (
              <section className="carte" aria-live="polite">
                {employeurs.map((e, i) => (
                  <p key={i} className="detail-calcul">
                    {nomEmployeur(e, i)} : {afficherMontant(e.salaire ?? 0)} €
                  </p>
                ))}
                <p className="resultat-jours">
                  Total : <strong className="montant">{afficherMontant(totalEmployeurs)} €</strong>
                </p>
              </section>
            )}
            <ChampMontant
              compact
              libelleVisible
              libelle={sansBulletins ? "Montant prérempli de votre déclaration" : "Montant prérempli de votre déclaration (facultatif)"}
              detail="Case 1AJ, salaires : il regroupe déjà tous vos employeurs."
              valeur={preRempli}
              onChange={setPreRempli}
            />
            {ecart && preRempliNb !== null && (
              <Encadre ton="attention">
                {typographie(
                  `Le montant prérempli (${afficherMontant(preRempliNb)} €) diffère de votre addition (${afficherMontant(totalEmployeurs)} €). Le montant prérempli fait foi : nous l'utilisons. Videz ce champ pour garder votre addition.`,
                )}
              </Encadre>
            )}
            {sansBulletins ? (
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => setSansBulletins(false)}>
                Finalement, j'ai tous mes bulletins
              </button>
            ) : (
              <button type="button" className="lien-je-ne-sais-pas" onClick={() => setSansBulletins(true)}>
                Je ne retrouve pas tous mes bulletins
              </button>
            )}
          </>
        ) : (
          <>
            <p className="texte-secondaire sous-question">
              {typographie("Le chiffre est sur votre bulletin de paie de décembre : le net imposable, cumulé sur l'année.")}
            </p>

            {!modeAddition ? (
              <>
                <ChampMontant libelle={titre} valeur={texte} onChange={setTexte} />
                <LienJeNeSaisPas onClick={() => setModeAddition(true)} />
              </>
            ) : (
              <section className="carte" aria-labelledby="titre-addition">
                <h2 id="titre-addition">Additionnons vos 12 bulletins</h2>
                <p style={{ margin: 0, fontSize: "var(--taille-texte-min)" }}>
                  Recopiez le net imposable de chaque mois. Laissez vide un mois sans salaire.
                </p>
                <div className="grille-mois">
                  {MOIS.map((nom, i) => (
                    <ChampMontant
                      key={nom}
                      compact
                      libelleVisible
                      libelle={nom}
                      valeur={mois[i]}
                      onChange={(t) => setMois(mois.map((m, j) => (j === i ? t : m)))}
                    />
                  ))}
                </div>
                <p className="total-addition">
                  Total de l'année : <strong className="montant">{afficherMontant(totalMois)} €</strong>
                </p>
                <button type="button" className="lien-je-ne-sais-pas" onClick={() => setModeAddition(false)}>
                  J'ai finalement le montant de l'année
                </button>
              </section>
            )}
          </>
        )}

        <label className="case-a-cocher">
          <input type="checkbox" checked={avecChomage} onChange={(e) => setAvecChomage(e.target.checked)} />
          {typographie(`J'ai aussi touché des allocations chômage en ${millesime}`)}
        </label>
        {avecChomage && (
          <>
            <ChampMontant
              compact
              libelleVisible
              libelle="Allocations chômage de l'année"
              detail="Sur l'attestation de France Travail, ou préremplies sur votre déclaration (case 1AP)."
              valeur={chomage}
              onChange={setChomage}
            />
            <Encadre>
              {typographie(
                "L'abattement de 10 % porte aussi sur ces allocations : nous en tenons compte dans la comparaison. Vos frais de recherche d'emploi seront proposés plus loin.",
              )}
            </Encadre>
          </>
        )}

        <details className="depliant">
          <summary>Vous êtes apprenti ou étudiant ?</summary>
          <p>
            Une partie de votre salaire peut être exonérée d'impôt. Indiquez seulement la part imposable, celle de votre bulletin. Les frais
            réels ne vous aideront que si cette part reste importante.
          </p>
        </details>

        {montant !== null && !Number.isNaN(montant) && montant === 0 && (
          <Encadre ton="attention">Sans salaire imposable, les frais réels ne peuvent rien déduire.</Encadre>
        )}
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" disabled={!valide || !chomageValide} onClick={valider}>
          Continuer
        </button>
      </PiedDePage>

      <FicheAide fiche={FICHES.salaire} ouverte={aideOuverte} onFermer={() => setAideOuverte(false)} />
    </div>
  );
}

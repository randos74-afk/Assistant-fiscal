// Étape 7 : relecture. Récapitulatif modifiable étape par étape, valeurs prudentes signalées ; un bloc par déclarant en mode foyer.
import { euros, nombre } from "../moteur/format";
import { totaux } from "../parcours/calendrier";
import { libelleEtape } from "../parcours/etapes";
import type { DonneesDeclarant } from "../parcours/declarants";
import { CarteAdministration } from "./Conditions";
import { partsFoyer } from "../moteur/impot";
import type { SaisieFoyer } from "../parcours/foyer";
import { PiedDePage } from "./Cadre";
import { BandeauConfidentialite, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

export type EcranModifiable = "salaire" | "foyer" | "jours" | "trajet" | "repas" | "teletravail" | "autres";

interface Props {
  /** Un déclarant, ou deux en mode foyer (ajout n° 1). */
  declarants: DonneesDeclarant[];
  foyer?: SaisieFoyer;
  /** Écran à corriger, et profil concerné en mode foyer. */
  onModifier: (ecran: EcranModifiable, profil: number) => void;
  onValider: () => void;
  onRetour: () => void;
}

type Section = { ecran: EcranModifiable; titre: string; resume: string; montant?: number };

function sectionsDuDeclarant(d: DonneesDeclarant): Section[] {
  const r = d.reponses;
  const resultat = d.resultat;
  const vous = d.index === 0;
  const t = totaux(r.jours?.mois ?? []);
  const lignes = (categories: string[]) => resultat.lignes.filter((l) => categories.includes(l.categorie));
  const somme = (categories: string[]) => lignes(categories).reduce((s, l) => s + l.montant, 0);
  const salaire: Section = {
    ecran: "salaire",
    titre: vous ? "Votre salaire" : "Son salaire",
    resume: r.salaire
      ? `${euros(r.salaire.montant)} de net imposable${
          r.salaire.source === "addition-bulletins"
            ? ", addition des bulletins"
            : r.salaire.employeurs && r.salaire.employeurs.length > 1
              ? `, ${r.salaire.employeurs.length} employeurs`
              : ""
        }${r.salaire.chomage ? `, plus ${euros(r.salaire.chomage)} d'allocations chômage` : ""}`
      : "À compléter",
  };
  if (d.profil.salaireSeulement) return [{ ...salaire, resume: `${salaire.resume}. Pas de frais à examiner : abattement de 10 %.` }];
  return [
    salaire,
    {
      ecran: "jours",
      titre: vous ? "Vos jours" : "Ses jours",
      resume: `${nombre(t.travailles)} jours travaillés : ${nombre(t.site)} sur site, ${nombre(t.teletravail)} en télétravail, ${nombre(t.deplacement)} en déplacement`,
    },
    {
      ecran: "trajet",
      titre: vous ? "Votre trajet" : "Son trajet",
      resume: lignes(["vehicule"])[0]?.texte.replace(/^Véhicule : /, "") ?? "Pas de véhicule",
      montant: somme(["vehicule", "peages", "interets"]),
    },
    { ecran: "repas", titre: vous ? "Vos repas" : "Ses repas", resume: lignes(["repas"])[0]?.texte.replace(/^Repas : /, "") ?? "Rien à déduire", montant: somme(["repas"]) },
    {
      ecran: "teletravail",
      titre: "Le télétravail",
      resume: lignes(["teletravail"])[0]?.texte.replace(/^Télétravail : /, "") ?? "Pas de télétravail",
      montant: somme(["teletravail"]),
    },
    {
      ecran: "autres",
      titre: vous ? "Vos autres frais" : "Ses autres frais",
      resume: lignes(["autre"]).map((l) => l.texte).join(", ") || "Aucun",
      montant: somme(["autre"]),
    },
  ];
}

export function Relecture({ declarants, foyer, onModifier, onValider, onRetour }: Props) {
  const etape = libelleEtape("relecture");
  const enCouple = declarants.length > 1;
  const sectionFoyer: Section = {
    ecran: "foyer",
    titre: "Votre foyer",
    resume: foyer
      ? `${foyer.couple ? "En couple" : foyer.veuf ? "Veuf ou veuve" : "Seul"}, ${nombre(foyer.enfants)} enfant${foyer.enfants > 1 ? "s" : ""} à charge, ${String(partsFoyer(foyer).parts).replace(".", ",")} parts`
      : "À compléter",
  };
  const pret = declarants.every((d) => d.reponses.salaire);

  const carteSection = (s: Section, d: DonneesDeclarant) => (
    <section key={`${d.index}-${s.ecran}`} className="relecture-section" aria-labelledby={`relecture-${d.index}-${s.ecran}`}>
      <div className="relecture-entete">
        <h2 id={`relecture-${d.index}-${s.ecran}`}>{s.titre}</h2>
        {s.montant !== undefined && <span className="montant relecture-montant">{euros(s.montant)}</span>}
      </div>
      <p className="detail-calcul">{typographie(s.resume)}</p>
      {d.nonVerifiees
        .map((n) => n.valeur)
        .filter((n) => n.ecran === s.ecran)
        .map((n) => (
          <p key={n.champ} className="detail-calcul">
            {typographie(`${n.libelle} : ${n.valeurRetenue}`)} <span className="etiquette-non-verifiee">non vérifiée</span>
          </p>
        ))}
      <button type="button" className="lien-je-ne-sais-pas" onClick={() => onModifier(s.ecran, d.index)} aria-label={`Modifier : ${s.titre}`}>
        Modifier
      </button>
    </section>
  );

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">Relisez vos réponses</h1>
        <p className="texte-secondaire sous-question">{typographie("Touchez « Modifier » pour corriger une étape. Tout reste sur votre téléphone.")}</p>

        {carteSection(sectionFoyer, declarants[0])}

        {declarants.map((d) => {
          const v = d.vraisemblance;
          return (
            <div key={d.index} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {enCouple && <h2 className="titre-question">{typographie(d.nom)}</h2>}
              {sectionsDuDeclarant(d).map((s) => carteSection(s, d))}

              <section className="carte">
                <p className="resultat-jours">
                  <strong className="montant">{euros(d.resultat.montantCase)}</strong> de frais réels
                </p>
                {d.resultat.totalReintegrations > 0 && (
                  <p className="detail-calcul">
                    {typographie(`Salaire déclaré augmenté de ${euros(d.resultat.totalReintegrations)} (remboursements de l'employeur).`)}
                  </p>
                )}
              </section>

              {d.nonVerifiees.length > 0 && (
                <Encadre>{typographie("Les valeurs « non vérifiées » sont des valeurs prudentes. Corrigez-les si vous retrouvez le chiffre.")}</Encadre>
              )}
              {d.casAdministration.map((c) => (
                <CarteAdministration key={c.id} cas={c} onVoir={c.ecran ? () => onModifier(c.ecran!, d.index) : undefined} />
              ))}
              {v.message && <Encadre ton={v.niveau >= 2 ? "attention" : "info"}>{typographie(v.message)}</Encadre>}
              {[...d.resultat.alertes, ...v.alertes].map((a) => (
                <Encadre key={a} ton="attention">
                  {typographie(a)}
                </Encadre>
              ))}
            </div>
          );
        })}
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" onClick={onValider} disabled={!pret}>
          Voir {enCouple ? "notre" : "mon"} résultat
        </button>
      </PiedDePage>
    </div>
  );
}

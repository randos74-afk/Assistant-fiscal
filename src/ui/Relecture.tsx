// Étape 7 : relecture. Récapitulatif modifiable étape par étape, valeurs prudentes signalées.
import type { ResultatDeclarant } from "../moteur/declarant";
import type { Vraisemblance } from "../moteur/vraisemblance";
import { euros, nombre } from "../moteur/format";
import { totaux } from "../parcours/calendrier";
import { libelleEtape } from "../parcours/etapes";
import type { Reponses } from "../parcours/assemblage";
import type { ValeurNonVerifiee } from "../parcours/valeursNonVerifiees";
import type { CasAdministration } from "../parcours/conditions";
import { CarteAdministration } from "./Conditions";
import { partsFoyer } from "../moteur/impot";
import type { SaisieFoyer } from "../parcours/foyer";
import { PiedDePage } from "./Cadre";
import { BandeauConfidentialite, Encadre, EnTeteEtape } from "./Question";
import { typographie } from "./typographie";

export type EcranModifiable = "salaire" | "foyer" | "jours" | "trajet" | "repas" | "teletravail" | "autres";

interface Props {
  reponses: Reponses;
  foyer?: SaisieFoyer;
  resultat: ResultatDeclarant;
  /** Ajout n° 2 — Valeurs prudentes, étiquetées « non vérifiée » dans leur étape. */
  nonVerifiees: ValeurNonVerifiee[];
  /** Ajout n° 3 — Cas à faire trancher par l'administration. */
  casAdministration: CasAdministration[];
  vraisemblance: Vraisemblance;
  onModifier: (ecran: EcranModifiable) => void;
  onValider: () => void;
  onRetour: () => void;
}

export function Relecture({ reponses: r, foyer, resultat, nonVerifiees, casAdministration, vraisemblance: v, onModifier, onValider, onRetour }: Props) {
  const etape = libelleEtape("relecture");
  const t = totaux(r.jours?.mois ?? []);
  const lignes = (categories: string[]) => resultat.lignes.filter((l) => categories.includes(l.categorie));
  const somme = (categories: string[]) => lignes(categories).reduce((s, l) => s + l.montant, 0);

  const sections: { ecran: EcranModifiable; titre: string; resume: string; montant?: number }[] = [
    {
      ecran: "salaire",
      titre: "Votre salaire",
      resume: r.salaire
        ? `${euros(r.salaire.montant)} de net imposable${
            r.salaire.source === "addition-bulletins"
              ? ", addition de vos bulletins"
              : r.salaire.employeurs && r.salaire.employeurs.length > 1
                ? `, ${r.salaire.employeurs.length} employeurs`
                : ""
          }${r.salaire.chomage ? `, plus ${euros(r.salaire.chomage)} d'allocations chômage` : ""}`
        : "À compléter",
    },
    {
      ecran: "foyer",
      titre: "Votre foyer",
      resume: foyer
        ? `${foyer.couple ? "En couple" : foyer.veuf ? "Veuf ou veuve" : "Seul"}, ${nombre(foyer.enfants)} enfant${foyer.enfants > 1 ? "s" : ""} à charge, ${String(partsFoyer(foyer).parts).replace(".", ",")} parts`
        : "À compléter",
    },
    {
      ecran: "jours",
      titre: "Vos jours",
      resume: `${nombre(t.travailles)} jours travaillés : ${nombre(t.site)} sur site, ${nombre(t.teletravail)} en télétravail, ${nombre(t.deplacement)} en déplacement`,
    },
    {
      ecran: "trajet",
      titre: "Votre trajet",
      resume: lignes(["vehicule"])[0]?.texte.replace(/^Véhicule : /, "") ?? "Pas de véhicule",
      montant: somme(["vehicule", "peages", "interets"]),
    },
    { ecran: "repas", titre: "Vos repas", resume: lignes(["repas"])[0]?.texte.replace(/^Repas : /, "") ?? "Rien à déduire", montant: somme(["repas"]) },
    {
      ecran: "teletravail",
      titre: "Le télétravail",
      resume: lignes(["teletravail"])[0]?.texte.replace(/^Télétravail : /, "") ?? "Pas de télétravail",
      montant: somme(["teletravail"]),
    },
    {
      ecran: "autres",
      titre: "Vos autres frais",
      resume: lignes(["autre"]).map((l) => l.texte).join(", ") || "Aucun",
      montant: somme(["autre"]),
    },
  ];

  return (
    <div className="ecran">
      <EnTeteEtape libelle={etape.libelle} etape={etape.numero} total={etape.total} onRetour={onRetour} />

      <main className="ecran-contenu" style={{ gap: 16 }}>
        <h1 className="titre-question">Relisez vos réponses</h1>
        <p className="texte-secondaire sous-question">{typographie("Touchez « Modifier » pour corriger une étape. Tout reste sur votre téléphone.")}</p>

        {sections.map((s) => (
          <section key={s.ecran} className="relecture-section" aria-labelledby={`relecture-${s.ecran}`}>
            <div className="relecture-entete">
              <h2 id={`relecture-${s.ecran}`}>{s.titre}</h2>
              {s.montant !== undefined && <span className="montant relecture-montant">{euros(s.montant)}</span>}
            </div>
            <p className="detail-calcul">{typographie(s.resume)}</p>
            {nonVerifiees
              .filter((n) => n.ecran === s.ecran)
              .map((n) => (
                <p key={n.champ} className="detail-calcul">
                  {typographie(`${n.libelle} : ${n.valeurRetenue}`)} <span className="etiquette-non-verifiee">non vérifiée</span>
                </p>
              ))}
            <button type="button" className="lien-je-ne-sais-pas" onClick={() => onModifier(s.ecran)} aria-label={`Modifier : ${s.titre}`}>
              Modifier
            </button>
          </section>
        ))}

        <section className="carte">
          <p className="resultat-jours">
            <strong className="montant">{euros(resultat.montantCase)}</strong> de frais réels
          </p>
          {resultat.totalReintegrations > 0 && (
            <p className="detail-calcul">
              {typographie(`Salaire déclaré augmenté de ${euros(resultat.totalReintegrations)} (remboursements de l'employeur).`)}
            </p>
          )}
        </section>

        {nonVerifiees.length > 0 && (
          <Encadre>{typographie("Les valeurs « non vérifiées » sont des valeurs prudentes. Corrigez-les si vous retrouvez le chiffre.")}</Encadre>
        )}
        {casAdministration.map((c) => (
          <CarteAdministration key={c.id} cas={c} onVoir={c.ecran ? () => onModifier(c.ecran!) : undefined} />
        ))}
        {v.message && <Encadre ton={v.niveau >= 2 ? "attention" : "info"}>{typographie(v.message)}</Encadre>}
        {[...resultat.alertes, ...v.alertes].map((a) => (
          <Encadre key={a} ton="attention">
            {typographie(a)}
          </Encadre>
        ))}
      </main>

      <PiedDePage onPrecedent={onRetour}>
        <BandeauConfidentialite />
        <button type="button" className="bouton bouton-principal" onClick={onValider} disabled={!r.salaire}>
          Voir mon résultat
        </button>
      </PiedDePage>
    </div>
  );
}

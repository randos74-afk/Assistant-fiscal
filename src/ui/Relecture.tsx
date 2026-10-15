// Étape 7 : relecture. Récapitulatif modifiable étape par étape, valeurs prudentes signalées.
import type { ResultatDeclarant } from "../moteur/declarant";
import type { Vraisemblance } from "../moteur/vraisemblance";
import { euros, nombre } from "../moteur/format";
import { totaux } from "../parcours/calendrier";
import { libelleEtape } from "../parcours/etapes";
import { valeursPrudentes, type Reponses } from "../parcours/assemblage";
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
  vraisemblance: Vraisemblance;
  onModifier: (ecran: EcranModifiable) => void;
  onValider: () => void;
  onRetour: () => void;
}

export function Relecture({ reponses: r, foyer, resultat, vraisemblance: v, onModifier, onValider, onRetour }: Props) {
  const etape = libelleEtape("relecture");
  const t = totaux(r.jours?.mois ?? []);
  const lignes = (categories: string[]) => resultat.lignes.filter((l) => categories.includes(l.categorie));
  const somme = (categories: string[]) => lignes(categories).reduce((s, l) => s + l.montant, 0);
  const prudentes = valeursPrudentes(r);

  const sections: { ecran: EcranModifiable; titre: string; resume: string; montant?: number }[] = [
    {
      ecran: "salaire",
      titre: "Votre salaire",
      resume: r.salaire
        ? `${euros(r.salaire.montant)} de net imposable${r.salaire.source === "addition-bulletins" ? ", addition de vos bulletins" : ""}`
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

        {prudentes.length > 0 && (
          <Encadre>{typographie(`Valeur prudente retenue pour : ${prudentes.join(", ")}. Corrigez-la si vous retrouvez le chiffre.`)}</Encadre>
        )}
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

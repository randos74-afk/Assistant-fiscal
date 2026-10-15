// F12 — Un montant par employeur ; l'application fait l'addition et la montre (le client n'additionne rien).
import { nomEmployeur, type Employeur } from "../parcours/employeurs";
import { afficherMontant, lireMontant } from "../parcours/saisie";
import { ChampMontant } from "./ChampNombre";

/** Total des montants saisis (champs vides = 0) ; null si un champ est invalide. */
export function totalParEmployeur(valeurs: string[]): number | null {
  let total = 0;
  for (const v of valeurs) {
    const n = lireMontant(v);
    if (n !== null && Number.isNaN(n)) return null;
    total += n ?? 0;
  }
  return Math.round(total * 100) / 100;
}

export function MontantsParEmployeur({
  employeurs,
  libelle,
  detail,
  valeurs,
  onChange,
}: {
  employeurs: Employeur[];
  libelle: string;
  detail?: string;
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
}) {
  const total = totalParEmployeur(valeurs);
  return (
    <section className="carte" aria-label={libelle}>
      <p className="champ-libelle" style={{ margin: 0 }}>
        {libelle}
      </p>
      {detail && <p className="champ-detail">{detail}</p>}
      {employeurs.map((e, i) => (
        <ChampMontant
          key={i}
          compact
          libelleVisible
          libelle={nomEmployeur(e, i)}
          valeur={valeurs[i] ?? ""}
          onChange={(t) => onChange(employeurs.map((_, k) => (k === i ? t : (valeurs[k] ?? ""))))}
        />
      ))}
      {total !== null && (
        <p className="total-addition">
          Total : <strong className="montant">{afficherMontant(total)} €</strong>
        </p>
      )}
    </section>
  );
}

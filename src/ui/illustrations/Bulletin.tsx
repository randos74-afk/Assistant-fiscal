// Bulletin de paie fictif et redessiné (docs/02 §5) : « Entreprise Exemple », chiffres ronds,
// aucun vrai nom ni numéro. La ligne à lire est entourée en ambre et numérotée.

const lignes = [
  { libelle: "Salaire de base", mois: "2 000,00", cumul: "24 000,00" },
  { libelle: "Cotisations salariales", mois: "- 440,00", cumul: "- 5 280,00" },
  { libelle: "Net à payer avant impôt", mois: "1 560,00", cumul: "18 720,00" },
  { libelle: "Net imposable", mois: "1 630,00", cumul: "19 560,00", aLire: true },
  { libelle: "Impôt sur le revenu prélevé", mois: "- 30,00", cumul: "- 360,00" },
];

export function BulletinNetImposable({ texteAlternatif }: { texteAlternatif: string }) {
  return (
    <figure className="illustration" role="img" aria-label={texteAlternatif}>
      <div className="illustration-filigrane" aria-hidden="true">
        EXEMPLE
      </div>
      <div className="illustration-entete" aria-hidden="true">
        BULLETIN DE PAIE · DÉCEMBRE · ILLUSTRATION
      </div>
      <div className="bulletin" aria-hidden="true">
        <div className="bulletin-societe">
          <span>Entreprise Exemple</span>
          <span>Salarié Exemple</span>
        </div>
        <div className="bulletin-ligne bulletin-titres">
          <span />
          <span>Mois</span>
          <span>Cumul annuel</span>
        </div>
        {lignes.map((l) => (
          <div key={l.libelle} className={l.aLire ? "bulletin-ligne bulletin-a-lire" : "bulletin-ligne"}>
            <span>
              {l.aLire && <span className="repere-numero">1</span>}
              {l.libelle}
            </span>
            <span className="montant">{l.mois}</span>
            <span className="montant">{l.cumul}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

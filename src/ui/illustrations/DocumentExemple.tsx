// Documents fictifs et redessinés (docs/02 §5) : « Entreprise Exemple », chiffres ronds,
// aucun vrai nom ni numéro. La ligne à lire est entourée en ambre et numérotée.

interface Ligne {
  libelle: string;
  valeurs: string[];
  aLire?: boolean;
}

interface Modele {
  entete: string;
  colonnes: string[];
  lignes: Ligne[];
}

function DocumentExemple({ modele, texteAlternatif }: { modele: Modele; texteAlternatif: string }) {
  const colonnes = `minmax(0, 1.6fr) ${modele.colonnes.map(() => "minmax(0, 1fr)").join(" ")}`;
  return (
    <figure className="illustration" role="img" aria-label={texteAlternatif}>
      <div className="illustration-filigrane" aria-hidden="true">
        EXEMPLE
      </div>
      <div className="illustration-entete" aria-hidden="true">
        {modele.entete} · ILLUSTRATION
      </div>
      <div className="bulletin" aria-hidden="true">
        <div className="bulletin-societe">
          <span>Entreprise Exemple</span>
          <span>Salarié Exemple</span>
        </div>
        <div className="bulletin-ligne bulletin-titres" style={{ gridTemplateColumns: colonnes }}>
          <span />
          {modele.colonnes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {modele.lignes.map((l) => (
          <div key={l.libelle} className={l.aLire ? "bulletin-ligne bulletin-a-lire" : "bulletin-ligne"} style={{ gridTemplateColumns: colonnes }}>
            <span>
              {l.aLire && <span className="repere-numero">1</span>}
              {l.libelle}
            </span>
            {l.valeurs.map((v, i) => (
              <span key={i} className="montant">
                {v}
              </span>
            ))}
          </div>
        ))}
      </div>
    </figure>
  );
}

const NET_IMPOSABLE: Modele = {
  entete: "BULLETIN DE PAIE · DÉCEMBRE",
  colonnes: ["Mois", "Cumul annuel"],
  lignes: [
    { libelle: "Salaire de base", valeurs: ["2 000,00", "24 000,00"] },
    { libelle: "Cotisations salariales", valeurs: ["- 440,00", "- 5 280,00"] },
    { libelle: "Net à payer avant impôt", valeurs: ["1 560,00", "18 720,00"] },
    { libelle: "Net imposable", valeurs: ["1 630,00", "19 560,00"], aLire: true },
    { libelle: "Impôt sur le revenu prélevé", valeurs: ["- 30,00", "- 360,00"] },
  ],
};

const COMPTEURS_CONGES: Modele = {
  entete: "BULLETIN DE PAIE · DÉCEMBRE · BAS DE PAGE",
  colonnes: ["Acquis", "Pris", "Solde"],
  lignes: [
    { libelle: "Congés payés", valeurs: ["25", "25", "0"], aLire: true },
    { libelle: "RTT", valeurs: ["10", "8", "2"] },
    { libelle: "Absence maladie", valeurs: ["", "3", ""] },
  ],
};

const ATTESTATION_TELETRAVAIL: Modele = {
  entete: "AVENANT AU CONTRAT · TÉLÉTRAVAIL",
  colonnes: ["Jours par semaine"],
  lignes: [
    { libelle: "Date de début", valeurs: ["01/01/2025"] },
    { libelle: "Jours télétravaillés", valeurs: ["2 (lundi, jeudi)"], aLire: true },
    { libelle: "Lieu", valeurs: ["Domicile"] },
  ],
};

const BULLETIN_TITRES: Modele = {
  entete: "BULLETIN DE PAIE · DÉCEMBRE",
  colonnes: ["Nombre", "Part salarié", "Part employeur"],
  lignes: [
    { libelle: "Salaire de base", valeurs: ["", "", ""] },
    { libelle: "Titres-restaurant", valeurs: ["20", "- 72,00", "108,00"], aLire: true },
    { libelle: "Net à payer avant impôt", valeurs: ["", "1 488,00", ""] },
  ],
};

const RELEVE_REPAS: Modele = {
  entete: "RELEVÉ DE BADGE · CANTINE",
  colonnes: ["Montant"],
  lignes: [
    { libelle: "Lundi 3 mars", valeurs: ["8,20"] },
    { libelle: "Mardi 4 mars", valeurs: ["7,90"] },
    { libelle: "Jeudi 6 mars", valeurs: ["8,40"] },
    { libelle: "Moyenne", valeurs: ["8,17"], aLire: true },
  ],
};

const BULLETIN_ALLOCATION_TELETRAVAIL: Modele = {
  entete: "BULLETIN DE PAIE · DÉCEMBRE",
  colonnes: ["Mois", "Cumul annuel"],
  lignes: [
    { libelle: "Salaire de base", valeurs: ["2 000,00", "24 000,00"] },
    { libelle: "Indemnité télétravail", valeurs: ["20,00", "220,00"], aLire: true },
    { libelle: "Net imposable", valeurs: ["1 630,00", "19 560,00"] },
  ],
};

export const BulletinAllocationTeletravail = (p: { texteAlternatif: string }) => (
  <DocumentExemple modele={BULLETIN_ALLOCATION_TELETRAVAIL} {...p} />
);
export const BulletinTitres = (p: { texteAlternatif: string }) => <DocumentExemple modele={BULLETIN_TITRES} {...p} />;
export const ReleveRepas = (p: { texteAlternatif: string }) => <DocumentExemple modele={RELEVE_REPAS} {...p} />;

export const BulletinNetImposable = (p: { texteAlternatif: string }) => <DocumentExemple modele={NET_IMPOSABLE} {...p} />;
export const BulletinCompteurs = (p: { texteAlternatif: string }) => <DocumentExemple modele={COMPTEURS_CONGES} {...p} />;
export const AvenantTeletravail = (p: { texteAlternatif: string }) => <DocumentExemple modele={ATTESTATION_TELETRAVAIL} {...p} />;

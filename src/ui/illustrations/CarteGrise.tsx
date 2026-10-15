// Carte grise fictive (maquette 03, docs/02 §5) : fac-similé barré EXEMPLE, sans immatriculation.

const CASES = [
  { code: "J.1", libelle: "Genre", valeur: "VP" },
  { code: "P.1", libelle: "Cylindrée", valeur: "1498" },
  { code: "P.2", libelle: "Puissance kW", valeur: "85" },
  { code: "P.3", libelle: "Énergie", valeur: "ES" },
  { code: "P.6", libelle: "Puissance", valeur: "5" },
  { code: "V.7", libelle: "CO2", valeur: "120" },
];

function CarteGrise({ aLire, texteAlternatif }: { aLire: string; texteAlternatif: string }) {
  return (
    <figure className="illustration illustration-carte-grise" role="img" aria-label={texteAlternatif}>
      <div className="illustration-filigrane" aria-hidden="true">
        EXEMPLE
      </div>
      <div className="illustration-entete" aria-hidden="true">
        CERTIFICAT D'IMMATRICULATION · ILLUSTRATION
      </div>
      <div className="carte-grise-cases" aria-hidden="true">
        {CASES.map((c) => (
          <div key={c.code} className={c.code === aLire ? "carte-grise-case bulletin-a-lire" : "carte-grise-case"}>
            {c.code === aLire && <span className="repere-numero">1</span>}
            <span className="carte-grise-code">{c.code}</span> {c.libelle} : {c.valeur}
          </div>
        ))}
      </div>
    </figure>
  );
}

export const CarteGrisePuissance = (p: { texteAlternatif: string }) => <CarteGrise aLire="P.6" {...p} />;
export const CarteGriseEnergie = (p: { texteAlternatif: string }) => <CarteGrise aLire="P.3" {...p} />;

/** Itinéraire schématique : maison → travail, trajet le plus court. */
export function Itineraire({ texteAlternatif }: { texteAlternatif: string }) {
  return (
    <figure className="illustration" role="img" aria-label={texteAlternatif}>
      <div className="illustration-entete" aria-hidden="true">
        CARTE · ILLUSTRATION
      </div>
      <svg viewBox="0 0 320 140" width="100%" aria-hidden="true">
        <path d="M40 100 C 90 20, 150 130, 200 60 S 270 40, 280 40" fill="none" stroke="var(--bordure)" strokeWidth="10" strokeLinecap="round" />
        <path d="M40 100 C 110 100, 200 60, 280 40" fill="none" stroke="var(--primaire)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="40" cy="100" r="11" fill="var(--fond)" stroke="var(--primaire)" strokeWidth="3" />
        <circle cx="280" cy="40" r="11" fill="var(--fond)" stroke="var(--primaire)" strokeWidth="3" />
        <text x="40" y="130" textAnchor="middle" fontSize="13" fill="var(--texte)">Maison</text>
        <text x="280" y="72" textAnchor="middle" fontSize="13" fill="var(--texte)">Travail</text>
        <rect x="118" y="58" width="96" height="30" rx="8" fill="var(--fond)" stroke="var(--ambre-aide)" strokeWidth="3" />
        <text x="166" y="78" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--texte)">22 km</text>
      </svg>
    </figure>
  );
}

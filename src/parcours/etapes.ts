// Étapes nommées du parcours général (docs/02 §3), pour la barre de progression.

export const ETAPES = [
  "votre salaire",
  "votre foyer",
  "vos jours",
  "votre trajet",
  "vos repas",
  "le télétravail",
  "vos autres frais",
  "relecture",
] as const;

export type Etape = (typeof ETAPES)[number];

/** « Étape 3 sur 7 : votre trajet ». */
export function libelleEtape(etape: Etape): { libelle: string; numero: number; total: number } {
  const numero = ETAPES.indexOf(etape) + 1;
  return { libelle: `Étape ${numero} sur ${ETAPES.length} : ${etape}`, numero, total: ETAPES.length };
}

// Note explicative des frais réels : le détail que l'administration demande de joindre ou de tenir à disposition
// (« Vous devrez indiquer le détail de vos frais dans une note explicative, et conserver les pièces justificatives
// pendant 3 ans »). Construite uniquement à partir du résultat du moteur : la somme des sections égale la case 1AK.
import type { LigneResume, MontantLibelle, ResultatDeclarant } from "../moteur/declarant";
import { euros, nombre } from "../moteur/format";

export interface SectionNote {
  titre: string;
  lignes: { texte: string; montant: number }[];
  sousTotal: number;
}

export interface NoteExplicative {
  titre: string;
  introduction: string[];
  sections: SectionNote[];
  motifs: string[];
  reintegrations: MontantLibelle[];
  /** Salaire à porter case 1AJ (remboursements compris, chômage exclu). */
  salaireDeclare: number;
  total: number;
  prudentes: string[];
  justificatifs: string[];
  conclusion: string;
}

const SECTIONS: { titre: string; categories: LigneResume["categorie"][]; prefixe?: RegExp }[] = [
  { titre: "Frais de déplacement", categories: ["vehicule", "peages", "interets"], prefixe: /^Véhicule : / },
  { titre: "Frais de repas", categories: ["repas"], prefixe: /^Repas : / },
  { titre: "Frais de télétravail", categories: ["teletravail"], prefixe: /^Télétravail : / },
  { titre: "Autres frais professionnels", categories: ["autre"] },
];

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const phrase = (t: string) => majuscule(t.replace(/\.$/, "")) + ".";

export function noteExplicative(
  r: ResultatDeclarant,
  annee: number,
  numeroDeclarant: number,
  prudentes: string[],
  justificatifs: string[],
): NoteExplicative {
  const sections = SECTIONS.map(({ titre, categories, prefixe }) => {
    const lignes = r.lignes
      .filter((l) => categories.includes(l.categorie) && (l.montant > 0 || l.categorie === "vehicule"))
      .map((l) => ({ texte: phrase(prefixe ? l.texte.replace(prefixe, "") : l.texte), montant: l.montant }));
    return { titre, lignes, sousTotal: lignes.reduce((s, l) => s + l.montant, 0) };
  }).filter((s) => s.lignes.length > 0);

  const salaireDeclare = Math.ceil(r.comparaison.salaireCorrige - r.allocationsChomage);
  const introduction = [
    `J'opte pour la déduction de mes frais professionnels pour leur montant réel et justifié, à la place de la déduction forfaitaire de 10 % (article 83, 3° du code général des impôts), pour mes revenus de ${annee}.`,
    `Le total de mes frais réels, ${nombre(r.montantCase)} €, est porté case ${r.caseFraisReels} (déclarant ${numeroDeclarant}). Il n'est pas soustrait du salaire déclaré case ${r.caseSalaire}, qui s'élève à ${nombre(salaireDeclare)} €${
      r.totalReintegrations > 0 ? ", remboursements de mon employeur compris" : ""
    }.`,
    "Chaque montant ci-dessous est arrondi à l'euro inférieur ; le total est la somme de ces montants.",
  ];
  if (prudentes.length) {
    introduction.push(`Faute de chiffre exact, j'ai retenu la valeur la plus basse pour : ${prudentes.join(", ")}.`);
  }

  return {
    titre: `Note explicative des frais professionnels réels, revenus ${annee}`,
    introduction,
    sections,
    motifs: r.motifs.map(phrase),
    reintegrations: r.reintegrations,
    salaireDeclare,
    total: r.montantCase,
    prudentes,
    justificatifs,
    conclusion:
      "Je conserve l'ensemble des pièces justificatives pendant trois ans et les tiens à la disposition de l'administration fiscale.",
  };
}

/** Phrase de rappel des sommes ajoutées au salaire. */
export function texteReintegrations(n: NoteExplicative, caseSalaire: string): string {
  const total = n.reintegrations.reduce((s, x) => s + x.montant, 0);
  return `Ces sommes, soit ${euros(total)}, sont comprises dans le salaire déclaré case ${caseSalaire} (${nombre(n.salaireDeclare)} €).`;
}

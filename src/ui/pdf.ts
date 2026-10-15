// F9.1 — Export PDF : fenêtre autonome sur fond blanc puis impression
// (un window.print() de l'écran sombre donnerait une page blanche).
import type { ResultatDeclarant } from "../moteur/declarant";
import { euros, nombre } from "../moteur/format";
import type { Parametres } from "../moteur/types";
import logoComplet from "../../design/logo/logo-complet.png";

const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface ContenuPdf {
  parametres: Parametres;
  resultat: ResultatDeclarant;
  prudentes: string[];
  justificatifs: string[];
  date: Date;
  /** Estimation de l'impôt si le foyer a été renseigné. */
  impot?: { avecAbattement: number; avecFraisReels: number; gain: number } | null;
}

export function htmlPdf({ parametres: p, resultat: r, prudentes, justificatifs, date, impot }: ContenuPdf, urlLogo: string): string {
  const c = r.comparaison;
  const taux = `${Math.round(p.abattement_10_pourcent.taux * 100)} %`;
  const verdict = c.fraisReelsConseilles
    ? `Avec vos frais réels, votre revenu imposable baisse de ${euros(c.gainBase)} par rapport à l'abattement automatique de ${taux}.` +
      (impot ? ` Impôt estimé : ${euros(impot.avecAbattement)} avec l'abattement, ${euros(impot.avecFraisReels)} avec les frais réels, soit ${euros(impot.gain)} de moins.` : "")
    : `L'abattement automatique de ${taux} est plus avantageux pour vous : ne changez rien.`;
  const lignes = r.lignes
    .map((l) => `<tr><td>${echapper(l.texte.charAt(0).toUpperCase() + l.texte.slice(1))}</td><td class="m">${euros(l.montant)}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>FraisFit, revenus ${p.millesime.revenus}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #111; font: 11pt/1.45 Georgia, "Times New Roman", serif; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
  header img { height: 48px; }
  header p { margin: 0; font-size: 9pt; text-align: right; }
  h1 { font-size: 14pt; margin: 0 0 6px; }
  h2 { font-size: 11pt; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 1px; }
  .verdict { border: 2px solid #111; padding: 10px 12px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 5px 4px; border-bottom: 1px solid #bbb; vertical-align: top; text-align: left; }
  .m { text-align: right; white-space: nowrap; font-weight: bold; }
  tfoot td { border-top: 2px solid #111; border-bottom: 0; font-weight: bold; }
  pre { white-space: pre-wrap; font: 10pt/1.5 "Courier New", monospace; border: 1px solid #111; padding: 8px 10px; margin: 0; }
  ul.cases { list-style: none; padding: 0; margin: 0; }
  ul.cases li { padding: 3px 0; break-inside: avoid; }
  ul.cases li::before { content: "\\2610\\00a0\\00a0"; }
  footer { margin-top: 20px; border-top: 1px solid #111; padding-top: 6px; font-size: 8.5pt; }
  section { break-inside: avoid; }
</style></head>
<body>
<header>
  <img src="${echapper(urlLogo)}" alt="FraisFit">
  <p>Simulation du ${date.toLocaleDateString("fr-FR")}<br>Paramètres valables pour les revenus ${p.millesime.revenus} (version du ${new Date(p.millesime.date_gel).toLocaleDateString("fr-FR")})</p>
</header>

<h1>Frais réels ou abattement de ${taux} : revenus ${p.millesime.revenus}</h1>
<p class="verdict">${echapper(verdict)}</p>

<section>
<h2>Comparaison des revenus imposables</h2>
<table>
  <tr><th></th><th class="m">Abattement ${taux}</th><th class="m">Frais réels</th></tr>
  <tr><td>${r.allocationsChomage > 0 ? "Salaire et chômage déclarés" : "Salaire déclaré"}</td><td class="m">${euros(c.salaireCorrige - r.totalReintegrations)}</td><td class="m">${euros(c.salaireCorrige)}</td></tr>
  <tr><td>Déduction</td><td class="m">- ${euros(c.abattement)}</td><td class="m">- ${euros(r.montantCase)}</td></tr>
  <tfoot><tr><td>Revenu imposable</td><td class="m">${euros(c.baseAbattement10)}</td><td class="m">${euros(c.baseFraisReels)}</td></tr></tfoot>
</table>
</section>

<section>
<h2>Détail des frais réels</h2>
<table>${lignes || `<tr><td>Aucun frais réel saisi.</td><td></td></tr>`}
  <tfoot><tr><td>Case ${r.caseFraisReels}</td><td class="m">${nombre(r.montantCase)} €</td></tr></tfoot>
</table>
${r.totalReintegrations > 0 ? `<p>Salaire de la case 1AJ à porter à ${nombre(Math.ceil(c.salaireCorrige - r.allocationsChomage))} € (remboursements de l'employeur : ${euros(r.totalReintegrations)}).</p>` : ""}
${prudentes.length ? `<p><strong>Valeur prudente retenue pour :</strong> ${echapper(prudentes.join(", "))}.</p>` : ""}
${r.alertes.length ? `<p><strong>Points d'attention :</strong> ${echapper(r.alertes.join(" "))}</p>` : ""}
</section>

<section>
<h2>Texte « Informations complémentaires »</h2>
<pre>${echapper(r.texte)}</pre>
</section>

<section>
<h2>Justificatifs à conserver 3 ans</h2>
<ul class="cases">${justificatifs.map((j) => `<li>${echapper(j)}</li>`).join("")}</ul>
</section>

<footer>
  C'est une estimation indicative, pas un conseil fiscal. Seuls impots.gouv.fr et votre avis d'imposition font foi.<br>
  Application indépendante, non affiliée à l'administration fiscale.
</footer>
</body></html>`;
}

/** Ouvre la fenêtre d'impression ; renvoie false si le navigateur l'a bloquée. */
export function ouvrirPdf(contenu: ContenuPdf): boolean {
  const fenetre = window.open("", "_blank");
  if (!fenetre) return false;
  fenetre.document.open();
  fenetre.document.write(htmlPdf(contenu, new URL(logoComplet, window.location.href).href));
  fenetre.document.close();
  const imprimer = () => {
    fenetre.focus();
    fenetre.print();
  };
  // Attendre le logo avant d'imprimer.
  const image = fenetre.document.images[0];
  if (image && !image.complete) image.addEventListener("load", imprimer, { once: true });
  else setTimeout(imprimer, 200);
  return true;
}

# FraisFit — instructions pour Claude Code

FraisFit aide les salariés français à savoir si l'option **frais réels** (case 1AK de la déclaration 2042) leur fait payer moins d'impôt que l'**abattement automatique de 10 %**, puis leur donne le montant et le texte à coller dans leur déclaration. Application payante, publiée sur Google Play début janvier 2027, plus une version web.

Langue : toute l'interface, les messages, les commentaires métier et les commits sont **en français**.

## Documents de référence (à lire avant de coder)

| Fichier | Contenu | Priorité |
| --- | --- | --- |
| `docs/01-specifications-fonctionnelles.md` | 14 modules F1 à F14 figés : règles de calcul, réintégrations, alertes, parcours métier | Fait foi pour le calcul |
| `docs/02-specifications-cosmetiques-accompagnement.md` | Public, exclusions, couleurs, polices, logo, parcours, aide « astérisque », ton | Fait foi pour l'interface |
| `parametres/revenus-2025.json` | Tous les chiffres fiscaux (barèmes, plafonds, forfaits, seuils d'alerte, valeurs prudentes) | Seule source des chiffres |
| `tests/cas-de-test.json` | 54 cas avec résultats attendus, vérifiés contre les exemples officiels DGFiP | Doivent tous passer |
| `tests/reference_calcul.py` | Calcul de référence en Python qui génère les cas | Pour comprendre une formule |
| `design/tokens.json` | Jetons de couleurs, polices, tailles | Thème de l'interface |
| `design/maquettes/*.html` | Maquettes validées (accueil, question, fiche d'aide, journée type, logo) | Référence visuelle |
| `design/logo/` | Logo, icône Play Store (SVG + PNG 512) | Ressources graphiques |
| `docs/*.pdf` et `docs/conventions-aide-a-domicile.md` | Dépliant DGFiP GP 120 (`bareme-officiel-dgfip.pdf`), notice 2041 GP, formulaire 2042, convention et avenant aide à domicile, témoignage d'une auxiliaire de vie | En cas de doute |
| `docs/references-web.md` | Liens officiels et privés consultés | Pour vérifier une source |

En cas de contradiction : `parametres/revenus-2025.json` > `docs/01` > `docs/02` > maquettes. Signaler toute contradiction au lieu de trancher seul.

## Règles d'or (non négociables)

1. **Aucun chiffre fiscal dans le code.** Tout vient de `parametres/revenus-AAAA.json`, chargé selon le millésime choisi. Changer d'année = ajouter un fichier, jamais modifier le code.
2. **Un seul moteur de calcul, pur et testé.** Fonctions sans effet de bord (entrées → montants + détail des formules). Il doit retrouver **tous** les résultats de `tests/cas-de-test.json` à 0,01 € près, sur le web et sur Android.
3. **Barème kilométrique appliqué au kilométrage annuel total de chaque véhicule** (domicile-travail + missions, tous employeurs confondus), jamais trajet par trajet. Puissance plafonnée à 7 CV pour les voitures (ligne « 7 CV et plus ») ; pour les motos, la dernière ligne « plus de 5 CV » s'applique à toutes les puissances au-delà de 5 CV. Barèmes électriques lus tels quels dans le JSON, jamais recalculés en ×1,20.
4. **Comparaison juste.** Le gain se calcule sur les bases imposables : `(salaire prérempli − abattement)` contre `(salaire prérempli + réintégrations − frais réels)`. L'option frais réels oblige à réintégrer titres-restaurant (part employeur), remboursements transport, allocations télétravail, indemnités kilométriques, primes de panier, avantages en nature.
5. **Règle des trois niveaux sur chaque question chiffrée** : question simple, astérisque ambre ouvrant une fiche « Où trouver ce chiffre ? » avec image, et « Je ne sais pas » qui applique la **valeur prudente** (déduction la plus faible, jamais l'inverse), signalée dans le récapitulatif.
6. **Résumé 1AK systématique** à la fin de chaque calcul : montant de la case 1AK + texte « Informations complémentaires » en texte brut. Ordre : véhicule (type, énergie, CV, km totaux, formule, montant), puis repas, télétravail, autres frais, motifs (plus de 40 km, double résidence…), réintégrations. La somme des lignes doit égaler le montant 1AK.
7. **Confidentialité.** Calcul 100 % local, hors connexion, aucun compte, aucun traceur, aucune donnée envoyée (seul l'appel facultatif à OpenFisca pour l'impôt, avec accord explicite). Aucun nom de personne aidée : « Personne aidée 1, 2… ».
8. **Jamais d'apparence officielle.** Ni Marianne, ni bleu France #000091, ni bandeau tricolore, ni police Marianne, ni composants DSFR. Pied de page permanent : « Application indépendante, non affiliée à l'administration fiscale. »
9. **Alertes, pas de blocages abusifs** : seuils de `alertes_vraisemblance` ; le prix de repas au-delà de 21,10 € déclenche un avertissement, jamais une coupe automatique.
10. **Ton** : vouvoiement, phrases courtes, aucun sigle non expliqué (pas de « PAS », « TR », « RFR » bruts). Voir le tableau « Ton et micro-textes » de `docs/02`.

## Plateformes

- **Web** : React + Vite, dépôt GitHub `randos74-afk/Assistant-fiscal`, déploiement automatique Vercel à chaque commit sur la branche principale. Export PDF par fenêtre autonome sur fond blanc (un `window.print()` sur fond sombre donne une page blanche). Vercel exige un `package.json` à la racine.
- **Android** : Kotlin + Jetpack Compose, architecture MVVM, local uniquement. Utiliser le skill Android disponible (`anthropic-skills:android-dev`, ou `dpconde/claude-android-skill` / `Drjacky/claude-android-ninja` s'ils sont installés). Icône adaptative à partir de `design/logo/icone-playstore.svg`. Politique de confidentialité RGPD déjà publiée sur GitHub Pages.
- Le moteur de calcul existe en deux langages (TypeScript pour le web, Kotlin pour Android) ; les deux passent `tests/cas-de-test.json`.

## Ordre de travail conseillé

1. Moteur de calcul TypeScript + chargement du JSON de paramètres + tests sur `cas-de-test.json` (F1 à F8). Rien d'autre tant que les tests ne passent pas.
2. Écrans du parcours général (accueil, filtrage, salaire, jours, trajet, repas, télétravail, autres frais, relecture, résultat, résumé 1AK) d'après les maquettes et `design/tokens.json`.
3. Fiches d'aide « astérisque » et valeurs prudentes (docs/02 §4).
4. Alertes de vraisemblance (F11), plusieurs employeurs (F12), situation familiale (F10).
5. Parcours aide à domicile (F13, maquette `04-aide-domicile-journee-type.html`) puis parcours métier (F14).
6. Export PDF, sauvegarde locale, partage (F9).
7. Portage Android du moteur et des écrans.

## Méthode

- Avant toute fonctionnalité, relire la section correspondante des spécifications et dire en une phrase quelle règle on applique.
- Ajouter un cas dans `tests/reference_calcul.py` (puis régénérer `cas-de-test.json`) pour toute nouvelle règle de calcul.
- Ne jamais inventer un chiffre fiscal : s'il manque, l'ajouter au JSON avec sa source et le signaler.
- Petits commits en français, un sujet par commit.
- Marc consacre environ 3 heures par semaine au projet : livrer des étapes courtes, testables, et résumer en fin de session ce qui marche et ce qui reste.

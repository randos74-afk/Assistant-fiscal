# FraisFit — Ajout n° 2 : valeurs non vérifiées et responsabilité — 16 octobre 2026

Cet ajout complète `01-specifications-fonctionnelles.md` (F8, F11) et `02-specifications-cosmetiques-accompagnement.md` (§ 4 règle des trois niveaux). Il s'applique immédiatement.

## Principe

Chaque fois que le client répond « Je ne sais pas », l'application retient une valeur prudente (voir `valeurs_prudentes_je_ne_sais_pas` dans `parametres/revenus-2025.json`). Ces valeurs protègent le client, mais elles ne sont pas des faits vérifiés : le client doit en être clairement informé avant de recopier quoi que ce soit dans sa déclaration.

## Ce que l'application enregistre

Chaque champ porte un statut : `saisi` (le client a tapé une valeur), `prudent` (valeur par défaut après « Je ne sais pas ») ou `regle_prudente` (choix de prudence imposé par l'application faute de texte officiel, par exemple le véhicule partagé de l'ajout n° 1). Le moteur renvoie la liste des champs `prudent` et `regle_prudente` avec, pour chacun, la valeur retenue et l'écart possible.

## Écran « Avant de recopier » (nouvel écran, entre le résultat et le résumé 1AK)

Affiché seulement s'il existe au moins un champ `prudent` ou `regle_prudente`.

1. Titre en orange « attention » : « Attention : 2 valeurs n'ont pas été vérifiées » (nombre réel).
2. Une carte par valeur : le nom du champ, la valeur retenue, la phrase « Nous avons pris la valeur la plus prudente », et un bouton « Vérifier maintenant » qui ramène à la question, avec sa fiche d'aide ouverte.
3. Si une valeur prudente change le verdict, ou peut le changer, une phrase le dit : « Avec votre vraie puissance, vous pourriez gagner davantage ».
4. Texte de responsabilité, affiché en entier :
   « FraisFit vous donne une estimation à partir de vos réponses. Votre déclaration reste sous votre responsabilité : vérifiez ces valeurs avec vos documents avant de déclarer, et gardez vos justificatifs 3 ans. FraisFit n'est pas un conseil fiscal et ne remplace pas impots.gouv.fr. »
5. Case à cocher obligatoire : « J'ai compris que ces valeurs ne sont pas vérifiées et que ma déclaration reste sous ma responsabilité. »
6. Deux boutons : « Vérifier mes valeurs » (principal, bleu) et « Continuer quand même » (secondaire, actif seulement si la case est cochée).

## Rappels ailleurs

1. Récapitulatif : chaque valeur prudente porte l'étiquette ambre « non vérifiée ».
2. Écran résultat : bandeau « Estimation avec 2 valeurs non vérifiées » tant qu'il en reste.
3. Résumé 1AK : le texte à coller ne contient que des faits ; s'il reste des valeurs non vérifiées, un message s'affiche au-dessus du bouton « Copier » : « Ce texte contient 2 valeurs non vérifiées. Corrigez-les avant de le recopier dans votre déclaration. »
4. Export PDF : encadré « Valeurs non vérifiées » listant les champs concernés.
5. Une fois toutes les valeurs vérifiées, l'écran « Avant de recopier » n'apparaît plus et le bandeau disparaît.

## Mentions légales (pied de page, conditions générales, fiche Play Store)

« FraisFit est un outil d'aide au calcul, indépendant de l'administration fiscale. Les résultats sont des estimations fondées sur les informations saisies par l'utilisateur et sur les barèmes officiels en vigueur. L'utilisateur reste seul responsable de sa déclaration de revenus et de l'exactitude des informations qu'il y porte. »

À faire relire par un juriste avant la publication : en droit de la consommation, une clause qui supprime toute responsabilité du vendeur envers un consommateur peut être jugée abusive. La formulation retenue rappelle donc la responsabilité du déclarant, sans exclure en bloc toute responsabilité de FraisFit.

## Tests à ajouter

1. Puissance inconnue → 3 CV retenus, statut `prudent`, écran « Avant de recopier » affiché avec 1 valeur.
2. Toutes les valeurs saisies → aucun écran « Avant de recopier », aucun bandeau.
3. Véhicule partagé entre conjoints → statut `regle_prudente`, listé dans l'écran.
4. Case non cochée → bouton « Continuer quand même » inactif.

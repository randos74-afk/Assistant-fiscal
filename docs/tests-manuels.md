# FraisFit — Points à tester à la main avant la publication

Liste tenue à jour à chaque livraison qui n'a pas pu être essayée à l'écran. Cocher (`[x]`) au test final, sur le web (`npm run dev` ou le site Vercel) puis sur Android.

## Conditions générales (ajout n° 3) — livré le 16/10/2026

- [ ] Premier lancement : l'écran « Avant de commencer » s'affiche avec le résumé en quatre phrases et la mention légale.
- [ ] Le bouton « Commencer » reste inactif tant que la case « J'ai lu et j'accepte… » n'est pas cochée.
- [ ] Après acceptation, l'écran ne revient plus au lancement suivant.
- [ ] En passant `conditions.version` à « 1.1 » dans `contenu/configuration.json`, l'écran revient avec « Nos conditions ont changé le… ».
- [ ] « Lire les conditions générales » ouvre le texte complet ; « Fermer » ramène à l'écran d'où l'on venait.
- [ ] Tant que l'adresse de l'annexe vaut `[URL Google Site]`, « Limites d'usage : bientôt en ligne » s'affiche (pas de lien cassé).
- [ ] Une fois la vraie adresse mise dans la configuration, le lien ouvre le site Google dans un nouvel onglet.
- [ ] Pied de page : le lien « Conditions et limites d'usage » est présent sur tous les écrans.
- [ ] Écran d'exclusion du filtrage (par exemple travail à l'étranger) : le lien vers les limites d'usage est présent.
- [ ] Carte « Ce cas doit être tranché par l'administration » : trajet de plus de 40 km avec un motif, puis formation ou déménagement ouvert dans « Autres frais » → la carte apparaît dans la relecture et dans « Avant de recopier ».
- [ ] PDF : la dernière page reprend la mention de responsabilité, l'adresse de l'annexe et la version des conditions.

## Valeurs non vérifiées (ajout n° 2) — livré le 16/10/2026

- [ ] Répondre « Je ne sais pas » à la puissance : étiquette ambre « non vérifiée » dans la relecture, bandeau « Estimation avec 1 valeur non vérifiée » sur le résultat.
- [ ] Le montant et le texte à copier ne s'affichent pas directement : bouton « Voir les points à vérifier » → écran « Avant de recopier ».
- [ ] Titre orange avec le bon nombre de valeurs, une carte par valeur avec la valeur retenue.
- [ ] Phrase « vous pourriez gagner davantage » (ou « les frais réels pourraient devenir plus avantageux ») quand la vraie puissance peut changer le résultat.
- [ ] « Continuer quand même » inactif tant que la case n'est pas cochée.
- [ ] « Vérifier maintenant » ramène à l'étape concernée ; après correction, retour à la relecture.
- [ ] Après « Continuer quand même », le message « Ce texte contient 1 valeur non vérifiée… » s'affiche au-dessus des blocs à copier.
- [ ] Toutes les valeurs saisies : ni écran « Avant de recopier », ni bandeau.
- [ ] PDF : encadré « Valeurs non vérifiées » listant les champs.
- [ ] Mode sombre : étiquette ambre, titre orange et bandeau lisibles.

## Mode foyer, partie 1 (ajout n° 1) — livré le 16/10/2026

- [ ] Parcours **seul** complet : identique à avant (aucune régression), étape « Votre foyer » avec « Célibataire, divorcé ou séparé » / « Veuf ou veuve ».
- [ ] Question d'entrée : « Seul » affiche le message pour les concubins ; « En couple » annonce les deux parcours.
- [ ] Parcours **en couple, « Juste son salaire »** : après vos « Autres frais », écran « À votre conjoint maintenant », salaire du conjoint, puis relecture.
- [ ] Parcours **en couple, « Ses frais aussi »** : toutes les étapes pour le conjoint, sans repasser par « Votre foyer ».
- [ ] Prénom saisi : il remplace « Votre conjoint » dans le sélecteur, la relecture et le résultat.
- [ ] Sélecteur « Vous / Votre conjoint » en haut des écrans : le changement de profil recharge bien les réponses du profil choisi.
- [ ] Relecture : le foyer une fois, puis un bloc par personne ; « Modifier » ramène au bon profil et revient à la relecture.
- [ ] Résultat : phrase de la meilleure combinaison, impôt économisé, tableau des quatre possibilités avec la meilleure surlignée.
- [ ] Bloc à copier case 1AK pour vous, case 1BK pour le conjoint, seulement pour celui qui gagne à opter.
- [ ] « Avant de recopier » regroupe les points des deux personnes ; « Vérifier maintenant » ramène au bon profil.
- [ ] Un PDF par personne qui opte, avec « déclarant 2 » et la case 1BK pour le conjoint.
- [ ] « Enregistrer notre simulation dans un fichier », puis réouverture : les deux profils sont retrouvés.
- [ ] Une ancienne sauvegarde (avant le 16/10/2026) en couple se rouvre avec le conjoint en « juste son salaire ».
- [ ] Affichage sur téléphone (360 px) : le tableau des quatre possibilités tient dans la largeur.

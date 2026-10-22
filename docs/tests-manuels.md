# FraisFit — Points à tester à la main avant la publication

Liste tenue à jour à chaque livraison qui n'a pas pu être essayée à l'écran. Cocher (`[x]`) au test final, sur le web (`npm run dev` ou le site Vercel) puis sur Android.

## Conditions générales (ajout n° 3) — livré le 16/10/2026

- [ ] Premier lancement : l'écran « Avant de commencer » s'affiche avec le résumé en quatre phrases et la mention légale.
- [ ] Le bouton « Commencer » reste inactif tant que la case « J'ai lu et j'accepte… » n'est pas cochée.
- [ ] Après acceptation, l'écran ne revient plus au lancement suivant.
- [ ] En passant `conditions.version` à « 1.1 » dans `contenu/configuration.json`, l'écran revient avec « Nos conditions ont changé le… ».
- [ ] « Lire les conditions générales » ouvre le texte complet ; « Fermer » ramène à l'écran d'où l'on venait.
- [ ] Tant que l'adresse de l'annexe vaut `[URL Google Site]`, « Limites d'usage : bientôt en ligne » s'affiche (pas de lien cassé).
- [ ] Le lien « Lire les limites d'usage » ouvre https://sites.google.com/view/fraisfit-cgv dans un nouvel onglet (adresse réglée le 16/10/2026).
- [ ] La page Google affiche bien le texte de l'annexe (vue depuis un téléphone non connecté au compte Google).
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
- [x] ~~Un PDF par personne qui opte~~ remplacé le 16/10/2026 par un PDF commun du foyer (voir plus bas).
- [ ] Quitter puis « Reprendre ma simulation » à l'accueil : les deux profils sont retrouvés (sauvegarde automatique sur l'appareil).
- [ ] Une ancienne sauvegarde (avant le 16/10/2026) en couple se rouvre avec le conjoint en « juste son salaire ».
- [ ] Affichage sur téléphone (360 px) : le tableau des quatre possibilités tient dans la largeur.

## Mode foyer, partie 2 : trajets à deux (ajout n° 1) — livré le 16/10/2026

- [ ] Couple où les deux vont travailler en voiture : après les « Autres frais » du conjoint, l'écran « Vos trajets à deux » s'affiche avant la relecture.
- [ ] Conjoint « juste son salaire », ou l'un des deux en transports en commun : l'écran ne s'affiche pas.
- [ ] Vous à 45 km, conjoint à 10 km : la carte « Un motif possible pour la distance réelle » apparaît ; « Retenir ce motif » affiche la confirmation, et la relecture montre 45 km retenus.
- [ ] Les deux à plus de 40 km sans motif : message « chacun est ramené à 40 km ».
- [ ] « Une seule voiture pour nous deux » : message de prudence ; au résultat, la ligne véhicule de chacun indique « véhicule partagé avec mon conjoint » et la part au prorata.
- [ ] Voiture commune : « Avant de recopier » montre « Voiture partagée avec votre conjoint » (règle de prudence) et la carte « tranché par l'administration ».
- [ ] « Même endroit » + deux voitures : le texte « Un point à vérifier ensemble » s'affiche en entier, avec les deux choix.
- [ ] « Toujours chacun avec notre voiture » : le résumé à copier contient « deux véhicules, trajets séparés confirmés ».
- [ ] « Parfois ensemble », 1 jour par semaine, conducteur = moi : le conjoint perd les km de ces jours (environ 1 jour sur 5), le résumé de chacun l'explique.
- [ ] « Je ne sais pas » pour les jours et pour le conducteur : valeurs prudentes, signalées « non vérifiées ».
- [ ] Astérisque des jours ensemble : la fiche « Comment compter ces jours ? » s'ouvre.
- [ ] Relecture : section « Vos trajets à deux » avec son résumé et « Modifier » qui rouvre l'écran puis revient à la relecture.
- [ ] Quitter puis « Reprendre ma simulation » : les réponses des trajets à deux sont retrouvées.

## Covoiturage avec une personne extérieure au foyer (ajout n° 1) — livré le 16/10/2026

- [ ] Étape du trajet : le choix « En covoiturage, comme passager » apparaît ; il demande la distance puis la somme payée au conducteur.
- [ ] Passager, 1 200 € à 25 km : 1 200 € dans le bilan du trajet et dans la case.
- [ ] Passager à 60 km sans motif : la somme est ramenée au prorata de 40 km, avec un message.
- [ ] Passager « Je ne sais pas » : rien n'est déduit, la valeur est signalée « non vérifiée ».
- [ ] Astérisque de la somme payée : la fiche « Où retrouver ces montants ? » s'ouvre (historique de la plateforme, relevés bancaires).
- [ ] Conducteur : case « Je transporte des passagers qui participent aux frais » dans « D'autres frais pour ce véhicule ? », montant retiré de la ligne véhicule.
- [ ] Conducteur « Je ne sais pas » sur les participations : question des jours de covoiturage par semaine, jours retirés au résultat, valeurs signalées.
- [ ] Carte « Ce cas doit être tranché par l'administration » pour le covoiturage (passager ou conducteur).

## Personnes à charge salariées, cases 1CK et 1DK (ajout n° 1) — livré le 16/10/2026

- [ ] Foyer avec au moins un enfant à charge : après le dernier adulte (et les trajets à deux), l'écran « Une personne à charge a-t-elle un salaire ? » s'affiche ; « Non, continuer » mène à la relecture.
- [ ] Foyer sans enfant à charge : l'écran ne s'affiche pas.
- [ ] « Oui, ajouter » : prénom facultatif, « Ses frais aussi » ou « Juste son salaire », puis ses questions ; retour à la liste à la fin.
- [ ] Deux personnes au plus ; « Retirer » la première fait passer la seconde en case 1CK.
- [ ] Le sélecteur en haut des écrans montre aussi les personnes à charge, y compris pour une personne seule.
- [ ] Relecture : un bloc par personne à charge.
- [ ] Résultat : la phrase de la meilleure combinaison cite chaque personne à charge ; bloc à copier case 1CK (ou 1DK) seulement si elle gagne à opter.
- [ ] Personne seule avec une personne à charge : résultat du foyer sans tableau des quatre possibilités, impôt calculé sur le foyer.
- [ ] PDF d'une personne à charge : « déclarant 3 » et case 1CK.

## Parcours métier : soignant (F14) — livré le 16/10/2026

- [ ] Métier « Soignant salarié » : l'écran « Trois questions sur votre poste » s'affiche avant le salaire ; « Continuer » reste inactif tant que les trois réponses manquent.
- [ ] Le message sur les infirmiers libéraux (pas de case 1AK) est visible.
- [ ] « Nuit ou 12 h » : conseil « comptez vos gardes » à l'étape des jours, conseil sur la voiture au trajet, forfait repas de nuit à l'étape des repas.
- [ ] « Soins à domicile » : l'étape du trajet propose directement le total de kilomètres de l'année, avec le conseil sur les tournées.
- [ ] Encadré « Ce qui compte dans votre total » : trajets maison plafonnés, trajets entre patients en entier, voiture du service, km remboursés.
- [ ] « Je ne connais pas mon total » → méthode « bulletins » : 12 mois de km + trajets maison × jours (jours pré-remplis) ; le détail tournées / trajets maison / total s'affiche.
- [ ] Méthode « compteur » : km d'une semaine × semaines travaillées.
- [ ] « Utiliser ce total » remplit le champ du total.
- [ ] Étape « D'autres frais » : question obligatoire « Votre employeur vous a-t-il remboursé des kilomètres ? » ; si oui, montant obligatoire, ajouté au salaire dans le bilan et au résultat (case 1AJ corrigée).
- [ ] Astérisque de cette question : fiche adaptée (cumul du bulletin de décembre, service paie).
- [ ] « Employeur qui lave les tenues » : conseil « ne comptez que leur achat » dans les autres frais ; sinon « l'achat et l'entretien comptent ».
- [ ] « Précédent » depuis le salaire ramène aux trois questions ; la relecture et le résultat sont inchangés.
- [ ] Autre métier : aucun de ces écrans ni conseils.

## Indemnités kilométriques pour tous (règle d'or n° 4) — livré le 16/10/2026

- [ ] Voiture, moto ou cyclomoteur : à l'étape « D'autres frais pour ce véhicule ? », la question « Votre employeur vous a-t-il remboursé des kilomètres ? » est obligatoire.
- [ ] Oui : montant obligatoire (bulletins + notes de frais remboursées à part), ajouté au salaire dans le bilan et au résultat.
- [ ] La question des déplacements pour le travail dit « remboursés ou non » et renvoie au remboursement.
- [ ] Fiche d'aide : bulletin de décembre, notes de frais, différence avec les avantages en nature.
- [ ] Simulation sauvegardée sur l'appareil avant ce changement : reprise, le trajet reste valide (indemnités à 0).

## Parcours métier : enseignant (F14) — livré le 16/10/2026

- [ ] Métier « Enseignant » : écran « Quelques questions sur votre poste » (remplaçant, remboursements de frais, mutation, travail à la maison) ; « Continuer » inactif tant qu'une réponse manque.
- [ ] Remboursements « Oui » : montant obligatoire ; astérisque → fiche ENSAP « Déclaration fiscale des traitements et salaires ».
- [ ] Remplaçant : à la distance, une carte par établissement (nom facultatif, distance, jours), « Ajouter » / « Retirer » ; le total des jours est comparé aux jours sur site.
- [ ] Un établissement au-delà de 40 km : choix du motif ; conseil « emploi précaire ou mobile » en tête de l'étape.
- [ ] Résultat : texte à copier avec un trajet par établissement ; remboursements ajoutés au salaire (case 1AJ corrigée).
- [ ] Pas muté : déménagement et double résidence ne sont plus cochés d'office. Muté : ils le sont, avec le conseil sur l'arrêté d'affectation.
- [ ] Travail à la maison : poste « Je travaille chez moi, sans bureau fourni » coché d'office ; pièce réservée ou mixte, surfaces (ou studio), charges, heures et semaines si mixte.
- [ ] « Une salle de travail existe sur place » : message d'attention, puis carte « Ce cas doit être tranché par l'administration ».
- [ ] Étape télétravail : conseil « votre bureau se déclare dans Vos autres frais ».
- [ ] Conseils restaurant scolaire, ordinateur à usage mixte, justificatifs (calendrier scolaire, arrêté d'affectation).
- [ ] Achat de matériel (télétravail ou autres frais) : lien « M'aider à estimer cette part » ; heures pour le travail et pour la vie privée → pourcentage arrondi vers le bas ; « Utiliser X % » remplit le champ.

## Parcours métier : grand rouleur (F14) — livré le 16/10/2026

- [ ] Métier « Grand rouleur ou double résidence » : question « Avez-vous un second logement pour votre travail ? » avant le salaire.
- [ ] Étape du trajet : conseils sur le motif recopié tel quel et sur les péages, le parking et les intérêts.
- [ ] Double résidence « Non » : le poste n'est plus coché d'office ; « Oui » : il l'est, avec le conseil sur le loyer et les trajets familiaux.
- [ ] Poste double résidence : « Calculer avec mes allers-retours » (distance, allers-retours par semaine, semaines) → « Utiliser X km » ; message si plus d'un aller-retour par semaine.
- [ ] Frais élevés (niveau 1) : message « Montant élevé, normal pour vos trajets », sans ton d'alerte.

## PDF du foyer (retour de test de Marc, 16/10/2026)

- [ ] Résultat du foyer : un seul bouton « Imprimer ou enregistrer en PDF », présent même si personne ne gagne aux frais réels.
- [ ] Le PDF commence par la synthèse du foyer (meilleure combinaison, tableau des quatre possibilités, choix de chacun), puis une partie par personne avec son nom, sa case (1AK, 1BK…) et sa note explicative.
- [ ] Dans la fenêtre d'impression, « Enregistrer au format PDF » produit bien un fichier PDF.
- [ ] Plus aucun fichier de reprise (.json) nulle part : ni bouton sur les résultats (seul ou foyer), ni « Ouvrir une simulation enregistrée » à l'accueil (décision de Marc du 16/10/2026).
- [ ] La sauvegarde automatique sur l'appareil fonctionne toujours : « Reprendre ma simulation » à l'accueil.

## Corrections après les tests du 22/10/2026 (à retester)

- [ ] Point 5 : conditions générales, articles 4 (liste non exhaustive), 5 (un achat = un appareil), 7 (erreur signalée par courriel), 11 (droit d'usage d'un an), 13 (phrase courte sur le médiateur).
- [ ] Point 35 : sur téléphone (360 px), le tableau des quatre possibilités s'affiche en blocs empilés, sans débordement ; sur ordinateur, il reste un tableau.
- [ ] Point 11 : trajet à 45 km, étape des repas : « Je rentre déjeuner chez moi » n'est plus proposé, un encadré explique pourquoi. À 30 km, les deux choix restent.
- [ ] Point 38 : à plus de 40 km, la liste des raisons contient aussi « Je n'ai pas trouvé d'emploi plus près de chez moi » et « Une contrainte familiale ou sociale particulière » ; le motif du conjoint dit « travaille près de notre domicile ».
- [ ] Point 38 : une raison choisie → encadré « La distance réelle sera comptée… » avec la pièce à garder ; PDF, partie 3 de la note : « Raisons de l'éloignement du domicile », phrase pré-remplie et lignes « Précisions » à compléter.
- [ ] Point 39 : « Aucune de ces raisons » → encadré « Sans raison, seuls les 40 premiers kilomètres… ».
- [ ] Point 102 : simulation où l'abattement l'emporte → le PDF tient sur une page, sans texte à recopier ni note explicative.
- [ ] Point 102 : à l'ouverture du PDF, bandeau « Ce document s'est ouvert dans un nouvel onglet… » visible à l'écran, absent du PDF enregistré. Essayer aussi sur téléphone Android (Chrome).
- [ ] Point 16 (scénario précis) : salaire 30 000 €, voiture diesel, 30 km aller, 200 jours sur site, puissance « Je ne sais pas » (cas vérifié par les tests automatiques) → dans « Avant de recopier », la phrase « vous pourriez gagner davantage » apparaît sous la carte de la puissance.

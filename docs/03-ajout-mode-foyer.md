# FraisFit — Ajout n° 1 : mode foyer (couples) — 16 octobre 2026

Cet ajout complète `01-specifications-fonctionnelles.md` (modules F1, F7, F8, F10) sans les remplacer. En cas de contradiction sur les couples, cet ajout fait foi.

## Règle fiscale

Un couple marié ou pacsé fait une déclaration commune (déclarations séparées possibles seulement l'année du mariage ou du PACS). Les concubins déclarent chacun de leur côté.

Les frais réels restent **individuels**, même dans une déclaration commune : déclarant 1 → 1AJ / 1AK, déclarant 2 → 1BJ / 1BK, personnes à charge → 1CJ-1CK, 1DJ-1DK. On n'additionne jamais les frais de deux déclarants. Chacun choisit seul entre l'abattement de 10 % (calculé personne par personne, minimum et maximum par personne) et les frais réels.

## Décision : mode foyer sur un seul téléphone (v1.0)

1. **Question d'entrée** après le filtrage : « Vous déclarez seul ou en couple (marié ou pacsé) ? ». « Seul » = parcours actuel inchangé. Les concubins choisissent « seul » ; un message les invite à faire une simulation chacun.
2. **Une seule simulation, deux profils** (« Vous » et « Votre conjoint », prénoms facultatifs), sélecteur de profil en haut d'écran. Jusqu'à 2 profils de personnes à charge salariées en option (1CK, 1DK).
3. **Données communes saisies une fois** : adresse du domicile, nombre de parts, enfants, véhicules du foyer. Chaque véhicule indique qui l'utilise.
4. **Données propres à chaque profil** : salaire, employeurs, jours, trajets, repas, télétravail, autres frais, réintégrations, métier (parcours F13/F14).
5. **Liens automatiques entre profils** (F10) : si le lieu de travail d'un conjoint est à 40 km ou moins du domicile, le motif « emploi du conjoint » est proposé à l'autre pour un trajet au-delà de 40 km ; si les deux sont à plus de 40 km, chacun est plafonné à 40 km sauf autre motif ; double résidence déclarée deux fois = alerte.
6. **Résultat du foyer** : tableau des 4 combinaisons (10 % / 10 %, réels / 10 %, 10 % / réels, réels / réels) avec la base imposable de chacun et l'impôt estimé du foyer ; la combinaison la moins chère est mise en avant (« Vous aux frais réels, votre conjoint à l'abattement »).
7. **Deux résumés séparés** : un bloc case 1AK + texte « Informations » pour le déclarant 1, un bloc case 1BK + texte pour le déclarant 2, chacun avec son bouton « Copier » et le rappel « sur impots.gouv.fr, cliquez sur Option frais réels du déclarant concerné ». Un résumé n'est produit que pour un déclarant qui gagne à opter.
8. **Sauvegarde** : le foyer est un seul dossier local par année. Aucun serveur, aucune synchronisation entre téléphones.
9. **Achat** : un seul achat pour le foyer. Activer la Bibliothèque familiale dans la Play Console (application payante à l'achat ; les achats intégrés ne sont pas partageables — à revérifier dans la Play Console au moment de la publication).

## Véhicule partagé par les deux conjoints (recherche du 16 octobre 2026)

Ce que disent les textes officiels :

1. Le barème s'applique « de façon séparée pour chaque véhicule » ; « il ne doit donc pas être fait masse des kilomètres parcourus par l'ensemble des véhicules » (BOI-RSA-BASE-30-50-30-20 § 400 ; même règle sur impots.gouv.fr, « J'utilise plusieurs véhicules, comment dois-je appliquer le barème kilométrique ? »).
2. Le barème est utilisable pour un véhicule appartenant au salarié ou à son conjoint ; un véhicule acheté après un PACS est présumé détenu à parts égales (§ 390).
3. **Aucun texte officiel trouvé ne traite le cas d'un même véhicule utilisé par les deux conjoints.** Le module en ligne d'impots.gouv.fr demande les km par déclarant, sans savoir si la voiture est partagée.

Décision FraisFit (règle de prudence, non improvisée, assumée et signalée) :

1. Le barème est calculé sur le total des km professionnels du véhicule (cohérent avec le principe « un barème par véhicule »), puis réparti entre les conjoints au prorata de leurs km. Ce calcul donne une déduction égale ou inférieure au calcul séparé (seule exception : quelques euros de plus lorsque le total du véhicule dépasse à peine 20 000 km, à cause d'un petit saut du barème officiel à ce seuil). Le moteur calcule donc les deux méthodes et retient la plus faible.
2. L'écran affiche : « Vous utilisez tous les deux la même voiture. Les textes officiels ne précisent pas ce cas : nous appliquons la règle la plus prudente. »
3. Ce choix entre dans la liste des « points d'attention » de fin de parcours (ajout n° 2).
4. Action de Marc, hors code : poser la question à la DGFiP par la messagerie sécurisée de son espace impots.gouv.fr, et mettre à jour cette règle selon la réponse.

## Trajets faits ensemble (covoiturage entre conjoints) — décision du 16 octobre 2026

Situation fréquente : les deux conjoints travaillent au même endroit et font le trajet ensemble certains jours (par exemple 1 ou 2 jours par semaine), chacun avec sa voiture les autres jours. Déclarer les deux voitures, les deux trajets et les deux péages tous les jours compte deux fois les jours partagés : c'est un risque réel de redressement.

Règle FraisFit (sous réserve de confirmation par la DGFiP) :

1. **Détection automatique du même lieu de travail.** Dans chaque fiche employeur (F12), le client indique le nom de l'employeur et la commune (ou le code postal) du lieu de travail ; ces informations restent sur le téléphone. L'application considère que le couple travaille au même endroit si l'une de ces conditions est remplie : même nom d'employeur (comparaison sans majuscules, accents ni forme juridique : « SAS », « SA »…), même commune ou même code postal de travail, ou réponse « oui » à la question directe « Travaillez-vous au même endroit que votre conjoint, ou tout près ? », posée systématiquement en mode foyer quand les deux ont un trajet en voiture.
2. **Si le même lieu est détecté et que deux voitures sont déclarées**, l'application affiche, avant de continuer, l'avertissement bienveillant suivant (texte exact) :

   > **Un point à vérifier ensemble**
   >
   > Vous travaillez tous les deux au même endroit et vous déclarez chacun votre voiture. C'est tout à fait possible si vous partez chacun de votre côté, avec vos propres horaires.
   >
   > En revanche, les jours où vous faites la route ensemble, une seule voiture roule : un seul trajet peut être déduit, celui du conducteur. Compter les deux trajets ces jours-là reviendrait à déclarer deux fois le même déplacement, et l'administration fiscale peut le corriger, avec des intérêts de retard.
   >
   > Pour que votre déclaration soit juste et sans risque, dites-nous simplement comment vous vous organisez.
   >
   > [ Nous partons toujours chacun avec notre voiture ]  [ Nous faisons parfois la route ensemble ]

   « Toujours chacun sa voiture » : le calcul continue avec deux voitures, et le récapitulatif garde la mention « deux véhicules, trajets séparés confirmés » (rappel des justificatifs utiles : carnets de bord, tickets de péage de chaque badge). « Parfois ensemble » : questions du point 3.
3. **Questions de covoiturage** : « Combien de jours par semaine faites-vous la route ensemble, en moyenne ? » et « Qui conduit ces jours-là ? » (conjoint 1, conjoint 2, ou chacun à tour de rôle avec la répartition). Valeur prudente si « Je ne sais pas » : 1 jour par semaine ensemble, conducteur = le conjoint au plus long trajet.
4. **Les jours faits ensemble, seul le conducteur déduit** : ses km au barème de sa voiture, ses péages et son parking. Le passager ne déduit rien pour ces jours-là, ni km, ni péage, ni parking.
5. Les autres jours, chacun déduit son propre trajet avec sa propre voiture, comme d'habitude.
6. Le calcul retire automatiquement les jours partagés des jours de trajet du passager.
7. Rappel de l'avertissement dans l'écran « Avant de recopier » (ajout n° 2) tant que le couple n'a pas répondu à la question d'organisation.
8. Les deux résumés 1AK / 1BK indiquent la règle appliquée, par exemple « 1 jour par semaine en covoiturage avec mon conjoint, conducteur : moi ; km de ces jours comptés une seule fois ».

## Covoiturage avec une personne extérieure au foyer

1. **Conducteur** : barème sur ses km, péages et parking ; les participations reçues des passagers sont saisies et retirées de ses frais déductibles (seul ce qui reste à sa charge est déductible ; règle appliquée par prudence, texte officiel à confirmer).
2. **Passager** (manquait dans F3.14) : question « Payez-vous un conducteur pour aller au travail ? » ; il déduit le montant réellement payé dans l'année, sur justificatifs (historique de la plateforme, virements, accord écrit) ; pas de barème kilométrique à son nom ; règle des 40 km applicable. Fiche d'aide : où trouver l'historique des paiements sur la plateforme ou les relevés bancaires. Valeur prudente si inconnu : zéro.

## Hors périmètre v1.0

Synchronisation entre deux téléphones, comptes utilisateurs. Piste v1.1 : envoyer son profil au conjoint par fichier ou QR code, sans serveur.

## Tests à ajouter

1. Couple : déclarant 1 à 45 km (conjoint à 10 km) → motif proposé automatiquement, 45 km retenus.
2. Couple : les deux à plus de 40 km sans autre motif → 40 km chacun.
3. Couple : déclarant 1 gagne aux frais réels, déclarant 2 non → combinaison « réels / 10 % » mise en avant, un seul résumé (1AK).
4. Abattement : deux salaires de 3 000 € et 60 000 € → 509 € et 6 000 €, calculés séparément.
5. Véhicule partagé : 6 000 km (conjoint 1) + 4 000 km (conjoint 2), 5 CV → barème sur 10 000 km = 4 965 €, réparti 2 979 € / 1 986 €.
6. Covoiturage conjugal : même lieu de travail à 25 km, 210 jours, ensemble 1 jour sur 5 (42 jours), conducteur = conjoint 1, deux voitures 5 CV → conjoint 1 : 210 × 50 = 10 500 km, soit 5 143,50 € ; conjoint 2 : 168 × 50 = 8 400 km, soit 4 393,80 € (et non 10 500 km chacun).
7. Covoiturage passager extérieur : 1 200 € payés au conducteur dans l'année → 1 200 € déductibles, aucun barème.
8. Covoiturage conducteur : barème 4 965 € et 900 € de participations reçues → 4 065 € déductibles.
9. Détection : employeurs « Dupont Industrie SAS » et « DUPONT INDUSTRIE », deux voitures → avertissement affiché ; même test avec employeurs différents mais même code postal → avertissement affiché ; employeurs et communes différents, question directe « non » → aucun avertissement.

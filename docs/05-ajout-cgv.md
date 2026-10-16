# FraisFit — Ajout n° 3 : conditions générales de vente et d'utilisation — 16 octobre 2026

Cet ajout complète `02-specifications-cosmetiques-accompagnement.md` et l'ajout n° 2 (`04-ajout-valeurs-non-verifiees.md`). Il s'applique immédiatement.

L'annexe « Limites d'usage et bonnes pratiques » n'est **pas** dans le dépôt : Marc la publie et la tient à jour sur son site Google (Google Sites), en dehors du code. L'application se contente d'y renvoyer par un lien, dont l'adresse est un paramètre (`liens.annexe_limites_usage` dans un fichier de configuration, valeur provisoire `[URL Google Site]`).

**Statut juridique : projet à faire relire par un avocat ou un juriste en droit de la consommation avant la publication.** Les passages entre crochets sont à compléter par Marc. Les textes de loi cités sont à revérifier sur Légifrance au moment de la relecture.

## Partie A — Intégration dans l'application (pour Claude Code)

1. Le texte de la partie B est stocké dans un fichier de contenu versionné (`contenu/cgv-v1.0.md`), jamais écrit en dur dans les écrans ; il porte un numéro de version et une date. L'annexe n'est pas copiée dans l'application : seul son lien est stocké.
2. **Premier lancement** : écran « Avant de commencer » avec un résumé en quatre phrases, les liens « Lire les conditions générales » et « Lire les limites d'usage » (ouvre le site Google dans le navigateur), et la case obligatoire « J'ai lu et j'accepte les conditions générales et leur annexe ». Le bouton « Commencer » reste inactif tant que la case n'est pas cochée. La date et la version acceptées sont enregistrées sur le téléphone (aucun envoi).
3. **Nouvelle version des textes** : l'écran réapparaît au lancement suivant, avec la phrase « Nos conditions ont changé le [date] » et un lien vers les changements.
4. **Accès permanent** : lien « Conditions et limites d'usage » dans le menu et dans le pied de page, à côté de « Application indépendante, non affiliée à l'administration fiscale. »
5. **Déclenchement contextuel** : quand le parcours rencontre un des cas ci-dessous, l'application affiche une carte « Ce cas doit être tranché par l'administration » avec une phrase courte, le conseil « Demandez confirmation par la messagerie sécurisée de votre espace impots.gouv.fr avant de déclarer » et le lien vers l'annexe. Ce cas compte comme un point d'attention dans l'écran « Avant de recopier » (ajout n° 2). Cas déclencheurs : `hors_public` (frontalier, non-résident, artisan, dirigeant non salarié, revenus étrangers), `vehicule_partage_conjoints`, `covoiturage`, `distance_plus_40_km_motivee`, `double_residence_ou_demenagement_ou_formation`, `alerte_vraisemblance_montant`, `electrique_au_reel`, `point_a_confirmer` (toute règle marquée « à confirmer » dans les spécifications).
6. **Web** : conditions générales publiées sur GitHub Pages à côté de la politique de confidentialité (`cgv.html`) ; lien dans la fiche Play Store et sur la page d'accueil du site ; l'annexe est accessible par le même lien Google Site.
7. **Export PDF** : la dernière page reprend la mention de responsabilité et l'adresse de l'annexe.

Tests : lien de l'annexe lu depuis la configuration (aucune URL en dur) ; case non cochée → « Commencer » inactif ; version 1.0 acceptée puis fichier en version 1.1 → écran affiché de nouveau ; cas « voiture partagée » rencontré → carte affichée et point d'attention compté.

## Partie B — Conditions générales de vente et d'utilisation de FraisFit (projet v1.0)

**Article 1 — Éditeur.** L'application FraisFit est éditée par [Prénom NOM], entrepreneur individuel (EI), SIRET [numéro], [adresse], contact : [adresse email FraisFit]. Ci-après « l'éditeur ».

**Article 2 — Objet.** Les présentes conditions encadrent l'achat et l'utilisation de FraisFit, application d'aide au calcul qui compare l'abattement forfaitaire de 10 % et l'option pour les frais réels des salariés, et propose un montant et un texte à reporter dans la déclaration de revenus. Elles s'appliquent avec leur annexe « Limites d'usage et bonnes pratiques », qui en fait partie intégrante et est consultable à l'adresse [URL Google Site].

**Article 3 — Nature du service.** FraisFit est un outil de calcul fondé sur les réponses de l'utilisateur et sur les barèmes et règles officiels publiés par l'administration fiscale pour l'année concernée. FraisFit ne fournit pas de consultation juridique ou fiscale personnalisée, ne remplace ni l'administration fiscale, ni un expert-comptable, ni un avocat, et n'est affilié à aucune administration. FraisFit ne dépose aucune déclaration : l'utilisateur reste seul à remplir et valider sa déclaration sur impots.gouv.fr.

**Article 4 — Public visé.** FraisFit s'adresse aux salariés et agents publics résidents fiscaux de France, pour leurs revenus d'activité salariée. Les situations exclues ou à trancher par l'administration sont listées dans l'annexe.

**Article 5 — Prix et paiement.** Le prix est indiqué TTC sur la fiche de l'application [Google Play / site]. Le paiement est traité par la plateforme de distribution selon ses propres conditions. [TVA non applicable, article 293 B du CGI, si franchise en base.] Un achat couvre [un foyer fiscal, sur les appareils de la Bibliothèque familiale Google Play — à confirmer].

**Article 6 — Droit de rétractation.** FraisFit est un contenu numérique fourni sans support matériel. Lors de l'achat, l'utilisateur demande l'exécution immédiate et reconnaît renoncer à son droit de rétractation dès le premier accès (article L221-28, 13° du Code de la consommation). Les règles de remboursement de la plateforme de distribution restent applicables.

**Article 7 — Obligations de l'éditeur.** L'éditeur s'engage à mettre en œuvre les barèmes et règles officiels en vigueur pour l'année de revenus indiquée, avec soin et en l'état des textes publiés à la date de la version, et à corriger dans les meilleurs délais toute erreur de calcul qui lui est signalée. Les garanties légales de conformité applicables aux contenus numériques (articles L224-25-12 et suivants du Code de la consommation) s'appliquent.

**Article 8 — Obligations de l'utilisateur.** L'utilisateur s'engage à saisir des informations exactes et complètes, à vérifier les valeurs signalées « non vérifiées » avant de les reporter, à relire le montant et le texte avant de les recopier, et à conserver ses justificatifs pendant la durée où l'administration peut contrôler sa déclaration (en général trois ans après l'année de déclaration).

**Article 9 — Responsabilité.** Les résultats sont des estimations calculées à partir des informations fournies par l'utilisateur. L'utilisateur reste seul responsable de sa déclaration de revenus, des choix qu'il y porte et de l'exactitude des informations déclarées. L'éditeur n'est pas responsable des conséquences d'une information inexacte ou incomplète saisie par l'utilisateur, d'une valeur prudente non vérifiée et acceptée comme telle par l'utilisateur, de l'utilisation de l'application hors de son public visé, ou d'une décision de l'administration sur un cas que l'annexe désigne comme relevant de son appréciation. Rien dans les présentes ne limite les droits que l'utilisateur tient de la loi en cas de manquement de l'éditeur à ses propres obligations.

**Article 10 — Données personnelles.** Les calculs sont effectués sur l'appareil de l'utilisateur. Aucune donnée n'est collectée ni transmise à l'éditeur. Voir la politique de confidentialité : [lien GitHub Pages].

**Article 11 — Propriété intellectuelle.** L'application, son nom, son logo et ses textes appartiennent à l'éditeur. L'achat donne un droit d'usage personnel, non cessible.

**Article 12 — Évolution.** Les barèmes changent chaque année. L'éditeur peut modifier les présentes conditions ; la nouvelle version est présentée à l'utilisateur au lancement suivant.

**Article 13 — Réclamations et médiation.** Toute réclamation s'adresse d'abord à [adresse email FraisFit]. À défaut d'accord, l'utilisateur peut recourir gratuitement au médiateur de la consommation : [nom, site internet du médiateur — à désigner avant le lancement, obligation des articles L612-1 et suivants]. Plateforme européenne de règlement en ligne des litiges : [à vérifier si toujours en service].

**Article 14 — Droit applicable.** Les présentes conditions sont soumises au droit français.

## Points à régler par Marc avant la publication

1. Compléter les crochets : identité EI, SIRET, adresse, email, prix, régime de TVA.
2. Désigner un médiateur de la consommation (adhésion payante, obligatoire pour vendre à des particuliers).
3. Vérifier qui est le vendeur au sens juridique pour un achat sur Google Play, et adapter les articles 5 et 6.
4. Faire relire l'ensemble par un avocat ou un juriste, notamment l'article 9.
5. Donner à Claude Code l'adresse définitive de l'annexe sur le site Google pour remplacer `[URL Google Site]`.

# FraisFit — Spécifications cosmétiques et accompagnement v1.0

Gel du 13 octobre 2026, mis à jour le 15 octobre 2026 (logo retenu) · Marc

## 1. Public cible et écran de filtrage

FraisFit s'adresse aux salariés français, en priorité ouvriers, employés et intervenantes à domicile (ADMR, UNA, sociétés mandataires, CESU), qui déclarent leur salaire en France et hésitent à passer aux frais réels. Tout le design est pensé pour quelqu'un qui n'a jamais ouvert le module frais réels d'impots.gouv.fr et qui a peur de se tromper.

| Profil | Accès | Raison affichée |
| --- | --- | --- |
| Ouvrier, employé, technicien, cadre salarié en France | Oui | Public principal |
| Fonctionnaire titulaire ou stagiaire, contractuel de la fonction publique, enseignant, militaire, agent hospitalier | Oui | Traitements imposés comme des salaires ; prise en charge de l'abonnement de transport à 75 %, à réintégrer |
| Intérimaire, salarié d'un particulier employeur, salarié en outre-mer | Oui | Salaires déclarés case 1AJ |
| Demandeur d'emploi inscrit, salarié en arrêt maladie une partie de l'année | Oui | Frais de recherche d'emploi et de formation ; jours d'absence déduits |
| Gérant ou dirigeant assimilé salarié | Oui | Mêmes règles que les salaires |
| Apprenti, étudiant salarié de 25 ans au plus | Oui, avec alerte | Une partie du salaire peut être exonérée : les frais réels n'ont d'intérêt que si le salaire imposable reste important |
| Travailleur frontalier (Suisse, Luxembourg, Allemagne, Belgique, Monaco…) | Non | Conventions fiscales et conversion des devises hors périmètre |
| Non-résident fiscal, ou personne arrivée en France ou partie à l'étranger dans l'année | Non | Déclaration 2042-NR ; seuls les frais liés aux salaires imposés en France sont déduits |
| Salarié d'une organisation internationale, expatrié ou impatrié à régime spécial | Non | Salaires exonérés selon des règles propres |
| Artisan, commerçant, profession libérale (dont infirmier libéral), micro-entrepreneur, exploitant agricole | Non | Les frais d'une entreprise relèvent de son régime propre (BIC, BNC, BA, micro), pas de la case 1AK |
| Assistant maternel ou familial agréé | Non en v1.0 | Régime spécifique avec abattement par enfant et par jour, souvent plus avantageux |
| Artiste musicien, chorégraphique, lyrique, intermittent du spectacle | Non en v1.0 (prévu v1.1) | Déductions forfaitaires spécifiques de 14 % et 5 % |
| Journaliste, élu local, parlementaire | Non en v1.0 | Règles spécifiques de la notice 2041 GP |
| Retraité sans salaire | Non | L'abattement sur pensions n'a pas d'option frais réels |

L'écran de filtrage pose cinq questions avant tout calcul :

1. « Votre salaire est-il versé par un employeur en France ? »
2. « Travaillez-vous à l'étranger (Suisse, Luxembourg, Allemagne, Belgique…) ? »
3. « Avez-vous une entreprise à votre nom ? »
4. « Avez-vous habité en France toute l'année ? »
5. « Exercez-vous l'un de ces métiers : assistant maternel, artiste du spectacle, journaliste, élu ? »

Une personne exclue reçoit un message bienveillant expliquant pourquoi l'outil ne lui convient pas. L'application étant payée au téléchargement (décision du 15/10/2026), le filtrage arrive après l'achat : l'écran d'exclusion indique comment demander le remboursement sur Google Play, et la fiche Play Store doit lister clairement les situations exclues pour éviter l'achat. Un salarié ayant aussi une activité d'artisan peut continuer, pour son seul salaire.

Après le filtrage, l'écran « Votre métier » propose les parcours métier (spécifications fonctionnelles F13 et F14) : intervenant à domicile, soignant salarié, enseignant, grand rouleur ou double résidence, autre métier.

## 2. Identité visuelle : bleu et blanc, familier sans être officiel

FraisFit reprend l'ambiance bleu et blanc de la déclaration 2042, qui rassure parce qu'elle est familière, mais avec un bleu, une police et un logo qui lui sont propres. Copier la police Marianne et les codes graphiques d'impots.gouv.fr n'est pas possible : le système de design de l'État (DSFR) et sa police sont réservés aux services de l'État, l'usage de la Marianne par un organisme privé est sanctionné, et une application payante qui ressemble à un service public risque le refus du Play Store et la méfiance des clients.

Interdits absolus : bandeau tricolore, Marianne, mention « République française », composants DSFR, bleu France #000091.

### Couleurs (jetons)

| Jeton | Thème clair | Thème sombre | Usage |
| --- | --- | --- | --- |
| `marine` | #12305A | #C9DBF5 | Nom FRAISFIT, en-tête, titres forts |
| `primaire` | #245A9E | #8FB4E8 | Boutons, liens, barre de progression, trajets domicile-travail |
| `primaire-fonce` | #163A6B | #C9DBF5 | Titres, bouton pressé |
| `bleu-fleche` | #4A7DB0 | #8FB4E8 | Illustrations |
| `turquoise` | #5BA7B6 | #7CC4D1 | Touches décoratives (jamais pour du texte) |
| `bleu-tres-clair` | #EAF1FA | #1B2A40 | Cartes, encadrés d'explication, résumé |
| `fond` | #FFFFFF | #111827 | Fond de page |
| `fond-secondaire` | #F5F7FA | #172033 | Zones de saisie groupées |
| `bordure` | #D3DCE8 | #2E3B52 | Champs, séparateurs |
| `texte` | #1B2433 | #E8EDF5 | Texte courant |
| `texte-secondaire` | #4A5568 | #A9B4C4 | Aides, unités |
| `ambre-aide` | #B45309 sur #FDF0E1 | #F5B266 sur #3A2A14 | Astérisque et fiches « Où trouver ? » |
| `vert-economie` | #1E7B4F | #6FD3A0 | Gain d'impôt, validation, trajets professionnels |
| `orange-attention` | texte #8A5A00 sur #FFF4D6 | texte #FFD58A sur #3A2E12 | Alertes douces |
| `rouge-erreur` | #B42318 | #F59B92 | Seulement les saisies impossibles |

Le bleu des boutons retenu par Marc est #245A9E (deuxième nuance testée). Les jetons sont aussi fournis dans `design/tokens.json`.

### Typographie et formes

| Élément | Choix |
| --- | --- |
| Police du texte | Atkinson Hyperlegible Next (Google Fonts, licence SIL OFL), conçue pour la lisibilité |
| Police du logo (nom FRAISFIT, « frais professionnels ») | Montserrat 800 et 500 |
| Police des montants | Inter en chiffres tabulaires |
| Tailles | Texte 17 sp/px (minimum 15) ; titres 22 à 28 ; montant du résultat 40 |
| Icônes | Pictogrammes au trait, coins arrondis (Material Symbols Rounded), toujours accompagnés d'un mot |
| Formes | Coins arrondis 12 dp, ombres très légères, beaucoup d'espace blanc |

### Logo (retenu le 14 octobre 2026)

| Usage | Fichier | Règle |
| --- | --- | --- |
| Logo complet (site, PDF, fiche Play Store) | `design/logo/logo-complet.png` | Flèches entrelacées + FRAISFIT + « frais professionnels », sur fond blanc |
| En-tête de l'application | `design/logo/logo-symbole-entrelace.png` + texte FRAISFIT en Montserrat | Hauteur 46 dp, fond blanc, filet `bordure` dessous |
| Icône de lancement Android et Play Store | `design/logo/icone-playstore.svg` (source) et `icone-playstore-512.png` | Deux flèches montantes, sans texte (Google Play affiche déjà le nom) ; zone de sécurité respectée pour le masque adaptatif |
| Petites tailles (≤ 48 px) | Icône à deux flèches | Jamais le logo entrelacé ni le mot FRAISFIT en dessous de 48 px |

Le logo complet est pour l'instant une photo détourée : une version vectorielle propre reste à produire avant publication. Mention permanente en pied de page : « Application indépendante, non affiliée à l'administration fiscale. »

## 3. Parcours rassurant

Le client avance une question à la fois, sait toujours où il en est, et peut s'arrêter sans rien perdre.

| Écran | Contenu | Ce qui rassure |
| --- | --- | --- |
| Accueil | « En 15 minutes, sachez si vous pouvez payer moins d'impôt. » Trois documents à préparer avec pictogrammes : bulletin de paie de décembre, carte grise, avis d'imposition | Durée annoncée, rien à chercher au milieu |
| Filtrage | Les cinq questions de la section 1 | On sait tout de suite si l'outil convient |
| Votre métier | Parcours métier (F13, F14) | Questions adaptées à son métier |
| Votre salaire | Une seule question par écran, avec astérisque | Image du bulletin montrant la ligne à lire |
| Vos jours | Calendrier simplifié, 218 jours par défaut | Il suffit de corriger |
| Votre trajet | Distance, véhicule, chevaux ; ou journée type (aide à domicile) | Image de la carte grise case P.6 |
| Repas, télétravail, autres frais | Questions oui/non qui ouvrent ou ferment chaque bloc | On ne voit que ce qui nous concerne |
| Relecture | Récapitulatif modifiable ligne par ligne | Rien n'est envoyé tant qu'on n'a pas validé |
| Résultat | Verdict en une phrase, gain en euros, détail repliable | Impôt en moins, pas seulement une base |
| Recopier dans ma déclaration | Pas-à-pas illustré : où cliquer sur impots.gouv.fr, case 1AK, texte à coller | Bouton « Copier » et confirmation « Copié » |

Principes appliqués partout : barre de progression nommée (« Étape 3 sur 7 : votre trajet »), bouton « Retour » toujours visible, sauvegarde automatique avec « Reprendre où je m'étais arrêté », option « Je ne sais pas » sur chaque question chiffrée, bandeau discret « Vos chiffres restent sur votre téléphone ».

## 4. Repères d'aide « astérisque » et règle des trois niveaux

**Règle d'accompagnement, sans exception.** Chaque question chiffrée a trois niveaux :

1. une question simple, en mots de tous les jours ;
2. l'astérisque ambre qui montre en image où trouver le chiffre ;
3. une solution de secours sans risque derrière « Je ne sais pas ».

La solution de secours est toujours la valeur prudente : celle qui donne la déduction la plus faible ou la réintégration la plus forte, jamais l'inverse. Elle est signalée dans le récapitulatif (« valeur prudente retenue ») et reste corrigeable. Aucune question ne laisse le client bloqué. Les valeurs prudentes sont dans `parametres/revenus-2025.json` → `valeurs_prudentes_je_ne_sais_pas`. Exception assumée (décision du 15/10/2026) : pour le prix du repas, « Je ne sais pas » retient le forfait de 5,45 € admis sans justificatif détaillé, et non 0 €.

**Composant.** Astérisque ambre de 20 dp dans une pastille de 44 dp minimum, placée après le libellé. La fiche s'ouvre en volet bas sur Android et en fenêtre sur le web. Elle contient : titre, image avec la zone entourée en ambre, « Où regarder », « Mots à chercher », « Si vous ne trouvez pas », bouton « J'ai trouvé ». Maquette : `design/maquettes/03-fiche-aide-carte-grise.html`.

| Champ | Document illustré | Où regarder | Si introuvable : solution de secours prudente |
| --- | --- | --- | --- |
| Salaire net imposable | Bulletin de paie de décembre | Ligne « net imposable », colonne cumul annuel | Montant prérempli case 1AJ de la déclaration en ligne ; à défaut, addition des 12 bulletins (seule donnée sans valeur par défaut) |
| Part employeur des titres-restaurant | Bulletin de paie | Ligne « titres-restaurant », part patronale | 60 % de la valeur du titre |
| Remboursement transport | Bulletin de paie | Lignes « remboursement transport », « prise en charge abonnement », « forfait mobilités » | 50 % de l'abonnement ; 75 % pour un agent public |
| Indemnité télétravail | Bulletin de paie | Lignes non soumises à cotisations | 2,70 € par jour de télétravail réintégrés |
| Prime de panier, indemnités kilométriques | Bulletin, notes de frais | Total annuel remboursé | Poste correspondant laissé à zéro, message invitant à demander au service paie |
| Jours de congés et RTT | Bulletin de paie | Compteurs en bas du bulletin | 218 jours travaillés pour un temps plein |
| Jours de télétravail | Attestation employeur ou avenant | Jours par semaine | Jours habituels × 47 semaines |
| Puissance fiscale | Carte grise | Case P.6 | 3 CV (barème le plus bas) |
| Énergie | Carte grise | Case P.3 (EL = électrique) | Thermique |
| Type de véhicule | Carte grise | Case J.1 (VP voiture, MTL… moto) | Choix par pictogrammes, pas de valeur par défaut |
| Distance domicile-travail | Itinéraire cartographique | Trajet le plus court | Itinéraire le plus court, arrondi à l'inférieur |
| Kilométrage annuel | Compteur, carnet de bord | Relevés début et fin d'année | Trajet × jours sur site, sans missions |
| Prix moyen du repas | Tickets, relevé bancaire, badge cantine | Moyenne de quelques semaines | Forfait 5,45 € par repas |
| Péages et parking | Badge, tickets | Total annuel | Zéro |
| Intérêts du crédit auto | Tableau d'amortissement | Colonne « intérêts » de l'année | Zéro |
| Cotisation syndicale | Attestation du syndicat | Montant de l'année | Zéro en frais réels (le crédit d'impôt de 66 % est conservé) |
| Nombre de parts | Avis d'imposition | Cadre « vos références » | Comparaison en revenu imposable seulement |
| Case 1AK | Déclaration en ligne | Traitements et salaires → « Option frais réels » → « Détail » | Pas-à-pas illustré et numéro d'assistance impots.gouv.fr |
| Convention collective (aide à domicile) | En-tête du bulletin | Ligne « convention collective » (IDCC 2941, 3127, 3239) | Règles générales, sans taux supposé |
| Km indemnisés (aide à domicile) | Bulletin de paie | Ligne « indemnités kilométriques » (km × taux) | Seuls les km indemnisés + un aller-retour domicile limité à 40 km |

Les libellés du bulletin varient selon les employeurs : chaque fiche donne plusieurs mots-clés.

## 5. Illustrations et captures

Toutes les images d'aide sont des documents d'exemple fictifs et redessinés, jamais des documents réels.

| Règle | Détail |
| --- | --- |
| Bulletin de paie | Modèle fictif (« Entreprise Exemple », « Salarié Exemple »), présentation simplifiée, chiffres ronds ; aucun vrai nom, numéro de sécurité sociale ni IBAN |
| Carte grise | Fac-similé barré « EXEMPLE », cases P.3, P.6, J.1, sans immatriculation réelle |
| Formulaire 2042 et avis | Extrait recadré du formulaire public, mention « Extrait du formulaire 2042, source impots.gouv.fr » |
| Écrans d'impots.gouv.fr | Schémas redessinés avec filigrane « Illustration », jamais de capture intégrale |
| Personnes aidées (aide à domicile) | Toujours « Personne aidée 1, 2… », jamais de nom ni d'adresse |
| Annotation | Cadre ambre de 3 dp, numéros ronds 1, 2, 3, flèche courte |
| Format | SVG ou WebP embarqués (hors connexion), lisibles à 360 dp, zoom à deux doigts |
| Texte alternatif | Une phrase par image |
| Mise à jour | Vérification chaque printemps quand impots.gouv.fr change ses écrans |

Volume v1.0 : environ 20 fiches pour une douzaine d'images distinctes.

## 6. Ton et micro-textes

Vouvoiement, phrases de moins de 15 mots, aucun sigle sans explication (PAS, TR, RFR bannis ou développés).

| Situation | À éviter | À écrire |
| --- | --- | --- |
| Question salaire | « Saisir le net imposable N-1 » | « Combien avez-vous gagné en 2025 ? Le chiffre est sur votre bulletin de décembre. » |
| Distance | « Distance DT aller » | « Combien de kilomètres entre chez vous et votre travail, aller simple ? » |
| Plus de 40 km | « Plafond dépassé » | « Au-delà de 40 km, il faut une raison. Choisissez la vôtre, on l'écrira pour vous. » |
| Saisie incohérente | « Erreur de saisie » | « Ce nombre de jours dépasse une année de travail. Pouvez-vous vérifier ? » |
| Résultat favorable | « Option frais réels recommandée » | « Bonne nouvelle : avec vos frais réels, vous payez environ 312 € d'impôt en moins. » |
| Résultat défavorable | « Frais réels non rentables » | « Ne changez rien : l'abattement automatique de 10 % est plus avantageux pour vous. » |
| Aide à domicile | « IK non indemnisées » | « Votre employeur vous en rembourse 15. Les 40 kilomètres comptent tous dans vos frais réels, et ce remboursement s'ajoute à votre salaire déclaré. » |
| Justificatifs | « Conservation obligatoire 3 ans » | « Gardez ces papiers 3 ans, au cas où les impôts vous les demandent. Voici la liste. » |
| Avertissement | Paragraphe juridique | « C'est une estimation. Votre déclaration sur impots.gouv.fr reste la référence. » |

Alertes en orange et encourageantes ; rouge réservé aux saisies impossibles. Jamais de message qui suggère une fraude ou une sanction.

## 7. Accessibilité, mobile, écran résultat et PDF

Objectif : niveau AA des règles WCAG 2.2, sur un téléphone d'entrée de gamme tenu d'une main.

| Exigence | Valeur |
| --- | --- |
| Contraste du texte | 4,5:1 minimum (3:1 à partir de 24 px) ; le turquoise n'est jamais utilisé pour du texte |
| Zones tactiles | 48 dp minimum, boutons principaux pleine largeur en bas d'écran |
| Taille de texte | Réglage « grande police » respecté jusqu'à 200 % sans texte coupé |
| Clavier | Numérique pour les montants, virgule acceptée, symbole € dans le champ |
| Lecteur d'écran | Libellé de chaque champ ; astérisque annoncée « aide : où trouver ce chiffre » |
| Écrans | Conçu d'abord pour 360 dp de large |
| Thèmes | Clair par défaut, sombre au choix |
| Hors connexion | Tout fonctionne sans réseau, sauf le calcul d'impôt optionnel en ligne |

Écran résultat : carte verte (ou bleue si le 10 % gagne) avec la phrase verdict et le gain en 40 sp ; deux colonnes « Abattement 10 % » et « Frais réels » ; détail repliable par poste ; deux blocs à copier (case 1AK et texte « Informations complémentaires ») en encadré `bleu-tres-clair` avec bouton « Copier ».

PDF : fond blanc, logo complet, date et millésime des paramètres, couleurs imprimables (lisible en noir et blanc), tableau des frais, texte 1AK, liste des justificatifs à cocher, mention d'indépendance en pied de page.

## 8. Maquettes de référence

| Fichier | Écran |
| --- | --- |
| `design/maquettes/01-accueil.html` | Accueil avec logo |
| `design/maquettes/02-question-puissance.html` | Question type avec astérisque et « Je ne sais pas » |
| `design/maquettes/03-fiche-aide-carte-grise.html` | Fiche d'aide en volet bas |
| `design/maquettes/04-aide-domicile-journee-type.html` | Journée type d'une aide à domicile (trajets en deux couleurs) |
| `design/maquettes/05-planche-logo.html` | Logo, icônes, couleurs |

## 9. Points ouverts

| Question | Proposition |
| --- | --- |
| Logo vectoriel complet | Redessiner le logo entrelacé en SVG avant publication |
| Production des images d'aide | Dessin vectoriel à partir des modèles publics, un lot par module |
| Frontaliers | Exclus en v1.0 ; à réexaminer |
| Mention d'indépendance | À aligner sur les mentions légales de la fiche Play Store |

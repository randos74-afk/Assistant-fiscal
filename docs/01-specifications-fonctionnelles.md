# FraisFit — Spécifications fonctionnelles figées v1.0

Oct 13, 2026 · @Marc

## 1. Objet et statut du gel

La liste des fonctions ci-dessous est définitive pour la version 1.0 de FraisFit : quatorze modules fonctionnels (F1 à F14), un catalogue complet de postes de frais réels (modules F3 à F6), la comparaison avec l'abattement de 10 % et le résumé prêt à coller pour la case 1AK. Toute nouvelle fonction relève désormais de la version 1.1.

| Élément | Valeur figée |
| --- | --- |
| Millésime fiscal par défaut | Revenus 2025, déclaration 2026 (correction en ligne jusqu'à début décembre 2026) |
| Millésime suivant | Revenus 2026, déclaration 2027 : paramètres à charger dès publication DGFiP (février-mars 2027) |
| Public | Salariés, agents publics, dirigeants assimilés salariés, demandeurs d'emploi inscrits ; un calcul par déclarant (1AK à 1DK). Inclus : fonctionnaires et contractuels publics. Exclus : travailleurs frontaliers, non-résidents et années de départ ou retour, salariés d'organisations internationales, expatriés et impatriés à régime spécial, artisans, commerçants, professions libérales, micro-entrepreneurs et exploitants agricoles, assistants maternels et familiaux, artistes du spectacle, journalistes, élus, retraités sans salaire (détail dans les spécifications cosmétiques, section 1) |
| Plateformes | Application web (React/Vite) et application Android (Kotlin, Jetpack Compose), même moteur de calcul et mêmes paramètres |
| Données | Calcul 100 % local, aucune donnée personnelle transmise (sauf appel optionnel au calcul d'impôt, voir F7) |
| Sources | Documents du projet (dépliant DGFiP GP 120 mars 2025, notice 2041 GP, formulaire 2042), BOFiP, impots.gouv.fr, article Tout sur mes finances du 30/06/2026, analyse du calculateur OptiFrais.fr |

Principe directeur : chaque montant affiché indique sa règle et sa source, et chaque poste réclame une justification conservée trois ans.

## 2. Paramètres fiscaux figés (revenus 2025)

Tous ces chiffres vivent dans un fichier de paramètres annuel (JSON versionné), jamais dans le code : changer d'année = charger un nouveau fichier.

| Paramètre | Valeur revenus 2025 | Source |
| --- | --- | --- |
| Abattement 10 % : minimum par déclarant | 509 € | [Aide-mémoire brochure IR 2026](https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2026/pdf_som/aide_memoire.pdf) |
| Abattement 10 % : maximum par déclarant | 14 555 € | idem (actualité BOFiP du 17/02/2026) |
| Valeur du repas pris au foyer | 5,45 € | [Tout sur mes finances](https://www.toutsurmesfinances.com/impots/frais-reels-comment-calculer-la-deduction-des-frais-de-repas-et-des-frais-kilometriques.html) |
| Forfait repas sans justificatif détaillé | 5,45 € par repas | idem, dépliant DGFiP |
| Seuil d'alerte prix du repas (indemnité restaurant URSSAF 2025) | 21,10 € | [WebLex](https://www.weblex.fr/chiffres-cles/limites-d-exoneration-d-impot-sur-le-revenu-applicable-aux-allocations-forfaitaires-pour-frais-professionnels-pour-2025) |
| Grand déplacement : logement + petit-déjeuner | 75,60 €/jour (75, 92, 93, 94) ; 56,10 €/jour ailleurs | idem |
| Télétravail forfait | 2,70 €/jour ; 59,40 €/mois ; 626,40 €/an | [Tissot](https://www.editions-tissot.fr/actualite/droit-du-travail/teletravail-lindemnite-est-exoneree-dimpot-sur-les-revenus), notice 2041 GP |
| Barème kilométrique | Barème de l'arrêté de mars 2023, reconduit à l'identique pour les revenus 2025 | Dépliant GP 120, Tout sur mes finances |
| Majoration véhicule 100 % électrique | + 20 % | Dépliant GP 120 |
| Plafond de puissance | Voiture : ligne « 7 CV et plus » ; moto : ligne « plus de 5 CV » pour toute puissance au-delà | Dépliant GP 120 |
| Distance domicile-travail admise sans justification | 40 km aller (80 km par jour) | Dépliant GP 120 |
| Matériel déductible immédiatement | jusqu'à 500 € HT ; au-delà amortissement linéaire (informatique : 3 ans) | [WebLex](https://www.weblex.fr/weblex-actualite/impot-sur-le-revenu-deduire-l-achat-de-votre-ordinateur), BOI-RSA-BASE-30-50-30-40 |
| Jours de référence télétravail (règle pratique) | 47 semaines travaillées ; 12 h par journée de télétravail en local à usage mixte | Notice 2041 GP |

Barème voitures thermiques, hybrides, hydrogène (d = km annuels du véhicule) :

| Puissance | d ≤ 5 000 km | 5 001 à 20 000 km | d > 20 000 km |
| --- | --- | --- | --- |
| 3 CV et moins | d × 0,529 | d × 0,316 + 1 065 | d × 0,370 |
| 4 CV | d × 0,606 | d × 0,340 + 1 330 | d × 0,407 |
| 5 CV | d × 0,636 | d × 0,357 + 1 395 | d × 0,427 |
| 6 CV | d × 0,665 | d × 0,374 + 1 457 | d × 0,447 |
| 7 CV et plus | d × 0,697 | d × 0,394 + 1 515 | d × 0,470 |

Barème deux-roues thermiques :

| Catégorie | d ≤ 3 000 km | 3 001 à 6 000 km | d > 6 000 km |
| --- | --- | --- | --- |
| Cyclomoteur (≤ 50 cm³ ou ≤ 4 kW) | d × 0,315 | d × 0,079 + 711 | d × 0,198 |
| Moto 1 ou 2 CV | d × 0,395 | d × 0,099 + 891 | d × 0,248 |
| Moto 3, 4, 5 CV | d × 0,468 | d × 0,082 + 1 158 | d × 0,275 |
| Moto plus de 5 CV | d × 0,606 | d × 0,079 + 1 583 | d × 0,343 |

Les versions électriques sont stockées telles que publiées par la DGFiP (tableaux du dépliant GP 120), et non recalculées à × 1,20, pour reproduire exactement les arrondis officiels.

## 3. F1 — Profil, revenus et réintégrations

F1 fixe la base sur laquelle tout est comparé : le salaire déclaré doit être majoré de toutes les allocations et prises en charge employeur dès qu'on opte pour les frais réels (notice 2041 GP, dépliant GP 120).

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F1.1 | Choix du millésime | Revenus 2025 par défaut ; liste des fichiers de paramètres disponibles |
| F1.2 | Nombre de déclarants | 1 à 4 profils (déclarant 1, déclarant 2, personnes à charge salariées) ; option frais réels ou 10 % choisie séparément pour chacun, cases 1AK à 1DK |
| F1.3 | Situation familiale et parts | Saisie des parts pour le calcul de l'impôt (F7) uniquement |
| F1.4 | Salaire net imposable | Montant prérempli case 1AJ (cumul annuel du bulletin de décembre) ; plusieurs employeurs additionnés |
| F1.5 | Assistant brut → net imposable | Facultatif, estimation indicative signalée comme telle |
| F1.6 | Revenus de remplacement | Allocations chômage et indemnités journalières saisies à part ; demandeur d'emploi inscrit = accès aux frais de recherche d'emploi et de formation (F6) |
| F1.7 | Réintégration titres-restaurant | Part employeur × nombre de titres, ajoutée au salaire déclaré |
| F1.8 | Réintégration transport | Prise en charge abonnement transport (50 % obligatoire et au-delà), prime carburant, forfait mobilités durables, prime de transport ; option légale de ne pas réintégrer la part obligatoire en renonçant à déduire les frais correspondants |
| F1.9 | Réintégration télétravail | Allocation forfaitaire ou remboursements télétravail ajoutés au salaire |
| F1.10 | Réintégration autres allocations | Indemnités kilométriques, primes de panier, indemnités de grand déplacement, remboursements de frais, avantage véhicule de fonction, repas fournis par l'employeur (avantage en nature 5,45 € par repas) |
| F1.11 | Salaire corrigé à déclarer | Calcul et affichage du montant à porter case 1AJ en cas d'option, avec le détail des ajouts |
| F1.12 | Cas exclus signalés | Journalistes (exonération 7 650 €), élus locaux, parlementaires : message d'orientation vers la notice 2041 GP, pas de calcul spécifique en v1.0 |

Alerte obligatoire en F1 : « Sans réintégration des remboursements employeur, la déduction est contestable. »

## 4. F2 — Calendrier de présence

F2 produit, pour chaque mois, le nombre de jours sur site, en télétravail et en déplacement ; ces trois compteurs alimentent kilomètres, repas et télétravail sans double saisie.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F2.1 | Mode simple | Jours travaillés par semaine, congés payés, RTT, jours fériés chômés, absences ; total annuel calculé (référence 218 jours pour un temps plein, modifiable) |
| F2.2 | Mode mensuel | Saisie des jours sur site, télétravail et déplacement pour chacun des 12 mois, bouton « remplir tous les mois » |
| F2.3 | Périodes et employeurs | Plusieurs périodes dans l'année (changement d'employeur, de lieu de travail, de véhicule, de domicile), chacune avec ses distances et paramètres |
| F2.4 | Absences | Arrêts maladie, maternité, chômage partiel, congés sans solde déduits des jours de présence |
| F2.5 | Temps partiel | Jours travaillés par semaine de 1 à 6 |
| F2.6 | Cohérence | Somme des jours sur site + télétravail + déplacement ≤ jours travaillés ; blocage si dépassement |
| F2.7 | Pas de repas les jours télétravaillés | Les jours de télétravail sont exclus automatiquement du calcul des repas (notice 2041 GP) |

## 5. F3 — Déplacements et véhicules

Le barème s'applique au kilométrage professionnel total de chaque véhicule sur l'année (domicile-travail + déplacements professionnels), jamais trajet par trajet : c'est ce total qui détermine la tranche.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F3.1 | Véhicules | Jusqu'à 3 véhicules par déclarant ; type (voiture, moto, cyclomoteur), énergie (essence, diesel, hybride, GPL, hydrogène, 100 % électrique), puissance fiscale ; un barème appliqué par véhicule |
| F3.2 | Propriété | Véhicule du déclarant ou d'un membre du foyer : barème autorisé ; véhicule prêté : avertissement de justification de prise en charge ; location : loyer couvert par le barème, non déductible en plus |
| F3.3 | Domicile-travail | Distance aller × 2 × jours sur site ; distance retenue plafonnée à 40 km aller |
| F3.4 | Au-delà de 40 km | Case « circonstance particulière » avec motif à choisir : emploi du conjoint ou partenaire, emploi précaire ou mobile, mutation, licenciement puis embauche éloignée (3 ans), santé, scolarité des enfants, mandat électif local, coût du logement hors de proportion ; distance réelle alors retenue et motif repris dans le résumé |
| F3.5 | Couple travaillant tous deux loin | Si les deux membres du couple sont à plus de 40 km, chacun est plafonné à 40 km, sauf si l'un des deux est à 40 km ou moins |
| F3.6 | Double aller-retour | Un seul aller-retour par jour (dépliant DGFiP GP 120, BOI-RSA-BASE-30-50-30-20) ; second aller-retour seulement dans des circonstances très particulières, avec une très forte justification : impossibilité de se restaurer sur le lieu de travail (cité expressément par la DGFiP), santé, horaires atypiques, proche à assister ; nombre de jours concernés. Décision de Marc (23/10/2026) : à l'étape des repas, « Je rentre déjeuner chez moi » ouvre la question du cas particulier (véhicule et distance unique seulement) ; le client choisit le motif, le nombre de jours (au plus les jours sur site, « Je ne sais pas » = rien déduit), et écrit lui-même sa situation et les éléments sur lesquels il s'appuie (40 caractères au moins chacun, sinon rien n'est ajouté). Km ajoutés au même véhicule : distance retenue × 2 × jours (cas DAR-01 et DAR-02) ; justification en annexe du PDF (F9.1) |
| F3.7 | Déplacements professionnels | Kilomètres de missions non remboursés par l'employeur, saisis en total ou par mois, ajoutés au véhicule concerné |
| F3.8 | Kilométrage forcé | Saisie directe du total annuel (relevé de compteur ou carnet de bord) en remplacement du calcul, proposée dès la question de la distance (« J'ai déjà calculé mes kilomètres de l'année ») ; le barème officiel reste appliqué à ce total ; la personne indique si un trajet dépasse 40 km aller et pour quel motif, repris dans le résumé |
| F3.9 | Frais hors barème | Péages, parking et stationnement, au prorata professionnel, ajoutés au barème |
| F3.10 | Intérêts de crédit auto | Intérêts annuels × part d'usage professionnel (km pro / km totaux du véhicule) |
| F3.11 | Option frais réels véhicule | Alternative au barème : carburant, entretien, assurance, dépréciation au prorata ; plafond automatique au montant du barème 7 CV (voiture) ou plus de 5 CV (deux-roues) pour la même distance, hors péages, parking et intérêts (BOI-RSA-BASE-30-50-30-20 § 500 à 520). Pour un véhicule électrique, liste déroulante dédiée : électricité de recharge à domicile au prorata des km pro, recharges sur bornes publiques, location de batterie, assurance, entretien, pneus, dépréciation ; plafond = barème 7 CV électrique, la majoration de 20 % restant à confirmer dans la version en vigueur du BOFiP avant développement ; l'écran affiche côte à côte « barème » et « frais réels » et retient le plus favorable |
| F3.12 | Transports en commun | Abonnement annuel moins prise en charge employeur ; billets ponctuels ; si la prise en charge a été réintégrée (F1.8), déduction du coût total |
| F3.13 | Taxi, VTC | Uniquement sur motif (horaires sans transport public, absence de permis) avec justificatifs |
| F3.14 | Vélo, trottinette, covoiturage | Vélo et trottinette : frais réels justifiés (entretien, achat amorti), pas de barème officiel ; covoiturage conducteur : barème sur les km parcourus moins la participation des passagers |
| F3.15 | Barème électrique | Véhicule 100 % électrique : barème majoré publié ; recharge et location de batterie déjà incluses, non déductibles en plus |

Le calcul affiche pour chaque véhicule la formule appliquée, par exemple « 8 000 km, 4 CV : 8 000 × 0,340 + 1 330 = 4 050 € », conforme aux exemples de l'article Tout sur mes finances.

## 6. F4 — Repas

Le montant déductible par repas est toujours un surcoût : prix payé moins 5,45 €, moins la part employeur du titre-restaurant ; le nombre de repas vient des jours sur site de F2.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F4.1 | Condition d'accès | Question : impossibilité de déjeuner à domicile (distance ou pause trop courte) ; sinon module fermé avec explication. « Je rentre déjeuner chez moi » reste proposé quelle que soit la distance (rien n'interdit de rentrer, correction de Marc du 23/10/2026 qui annule la décision du 22/10/2026) ; ce choix affiche que le trajet du midi ne se déduit pas (un seul aller-retour par jour, F3.6) |
| F4.2 | Mode « avec justificatifs » | (Prix moyen du repas − 5,45 €) × nombre de repas ; restaurant, cantine ou cafétéria |
| F4.3 | Mode « sans justificatif détaillé / gamelle » | 5,45 € × nombre de repas, si pas de restauration collective sur place ou à proximité |
| F4.3 bis | Restauration collective sur place (cantine, restaurant d'entreprise ou distributeurs de plats) | Règle officielle (impots.gouv.fr, « Je suis salarié et obligé de prendre mes repas à l'extérieur de mon domicile », consultée le 15/10/2026) : (1) repas pris sur place : prix payé − 5,45 € − part employeur des titres-restaurant ; (2) repas pris ailleurs par choix personnel : prix retenu plafonné au prix d'un repas sur place, part de l'employeur déduite (saisie en %, en € par jour ou en € sur l'année d'après la fiche de paie), exemple officiel restaurant 12 €, cantine 6 € : 0,55 € par jour ; (3) repas apporté sans justificatif : rien. Prix sur place inconnu : rien (valeur prudente). Cas REP-05 et REP-06. Remplace la règle « 5,45 € moins la part employeur » envisagée le même jour, sans fondement officiel |
| F4.4 | Titres-restaurant | Soustraction de la part employeur par repas (exemple officiel : 12 − 5,45 − 4,50 = 2,05 €) ; part saisie en euros ou en pourcentage de la valeur du titre ; réintégration liée en F1.7 |
| F4.5 | Plusieurs régimes dans l'année | Un régime de repas par période (avec ou sans titres, cantine ou non) |
| F4.6 | Repas fournis par l'employeur | Jours concernés exclus ; avantage en nature réintégré (F1.10) |
| F4.7 | Prime de panier | Saisie par jour, multipliée par les jours où elle est versée (pré-remplis avec les jours sur site) ; total réintégré (F1.10), puis calcul normal |
| F4.8 | Repas en déplacement professionnel | Nombre de repas non remboursés × (prix − 5,45 €) ; alerte si prix > 21,10 € |
| F4.9 | Seuil de vraisemblance | Prix moyen > 21,10 € : avertissement « dépense susceptible d'être jugée excessive », montant conservé sans plafonnement automatique |
| F4.10 | Jours de télétravail | Aucun repas déductible (règle 2041 GP) |
| F4.11 | Repas d'affaires imposés | Invitations professionnelles non remboursées, montant réel, rangées en F6 |

Le seuil de 21,10 € est une limite d'exonération sociale, pas un plafond fiscal écrit : d'où l'avertissement plutôt que la coupe, à la différence de certains simulateurs privés qui déduisent au plus 15,65 €.

## 7. F5 — Télétravail

L'application calcule les deux méthodes admises par la notice 2041 GP et retient la plus favorable, sauf choix contraire de l'utilisateur.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F5.1 | Forfait | 2,70 € × jours de télétravail, plafonné à 59,40 € par mois et 626,40 € par an. Le plafond mensuel exige le détail des 12 mois : si la personne ne connaît que son total annuel, il est réparti à parts égales sur les mois travaillés pour pré-remplir le calendrier, avec invitation à corriger mois par mois (les mois chargés réduisent le forfait) |
| F5.2 | Réel : local dédié (usage exclusif) | Charges du logement × (surface bureau / surface totale) × (jours télétravaillés / jours travaillés) ; studio : 50 % de la surface |
| F5.3 | Réel : pièce à usage mixte | Charges × (surface bureau / surface totale) × (jours télétravaillés × 12 h / 8 760 h) |
| F5.4 | Charges du local | Loyer ou intérêts d'emprunt, électricité, eau, chauffage, assurance habitation, taxe foncière ou impôts locaux de l'année, diagnostic électrique, travaux de mise en conformité |
| F5.5 | Communication | Internet et ligne fixe au prorata des jours ; téléphone portable si requis pour le télétravail |
| F5.6 | Mobilier et matériel | Bureau, siège, écran, ordinateur : déduction immédiate ≤ 500 € HT, sinon amortissement (F6.9), au prorata d'usage professionnel |
| F5.7 | Fournitures | Encre, papier, petites fournitures au réel |
| F5.8 | Allocation employeur | Si l'utilisateur déduit au réel ou au forfait, l'allocation est réintégrée (F1.9) |
| F5.9 | Interdits affichés | Repas des jours télétravaillés, frais de garde d'enfants : non déductibles |
| F5.10 | Choix et trace | Tableau comparatif forfait / réel et méthode retenue reprise dans le résumé |

## 8. F6 — Autres frais réels (catalogue complet)

F6 couvre tout ce qui n'est ni trajet, ni repas, ni télétravail : 17 postes, chacun avec ses conditions, sa méthode et la question qui l'ouvre, pour que l'utilisateur ne passe à côté d'aucun.

| Réf. | Poste | Condition d'accès | Calcul |
| --- | --- | --- | --- |
| F6.1 | Vêtements spéciaux et EPI | Tenue spécifique au métier (bleus, blouses, chaussures de sécurité), pas les vêtements de ville | Achat + entretien réel (pressing, lavage) |
| F6.2 | Documentation professionnelle | Ouvrages, revues, abonnements liés au métier | Montant réel |
| F6.3 | Formation professionnelle | Stage payé par le salarié ou le demandeur d'emploi inscrit, non remboursé | Frais pédagogiques + déplacements et repas de formation |
| F6.4 | Diplôme ou qualification | Améliore la situation ou permet de changer de métier ; hors remboursement de prêt étudiant | Montant réel |
| F6.5 | Recherche d'emploi | Demandeur d'emploi inscrit | Déplacements, envois, documentation, au réel |
| F6.6 | Cotisations syndicales | Déductibles sans limite si option frais réels | Montant réel ; message : perte du crédit d'impôt de 66 % sur ces cotisations, comparaison chiffrée proposée |
| F6.7 | Cotisations professionnelles obligatoires | Ordre professionnel, cotisation salariale au comité d'entreprise | Montant réel |
| F6.8 | Double résidence | Couple marié, pacsé ou concubin stable travaillant dans des lieux éloignés, hors convenance personnelle | Loyer et charges du second logement (ou intérêts si double résidence durable), trajets hebdomadaires au barème, surcoût repas ; motif obligatoire dans le résumé |
| F6.9 | Matériel, outillage, informatique, mobilier | Usage professionnel réel | ≤ 500 € HT : prix déduit l'année d'achat ; au-delà : amortissement linéaire (informatique 3 ans) prorata temporis ; × part d'usage pro ; suivi des annuités sur les années suivantes |
| F6.10 | Téléphone portable et forfait | Usage professionnel non pris en charge | Achat (F6.9) + abonnement × part pro |
| F6.11 | Local professionnel hors télétravail | L'employeur ne fournit aucun bureau nécessaire à l'activité | Même calcul que F5.2 à F5.4 |
| F6.12 | Déménagement professionnel | Changement de résidence imposé pour obtenir ou conserver un emploi ; hors frais de réinstallation du foyer | Montant réel non remboursé |
| F6.13 | Voyages et grands déplacements | Missions non remboursées | Transport, hébergement, repas (surcoût) au réel ; repères 75,60 / 56,10 € par nuit affichés |
| F6.14 | Invitations et réceptions | Imposées par la fonction (commerciaux, cadres), non remboursées | Montant réel avec bénéficiaires et objet à conserver |
| F6.15 | Frais de procès liés à l'emploi | Procédure visant des sommes imposables (salaires, indemnités) ; pas des dommages-intérêts exonérés | Honoraires et frais au réel |
| F6.16 | Intérêts d'emprunt pour entrer au capital de l'employeur | Salarié ou dirigeant, emprunt souscrit pour acquérir des parts de la société qui l'emploie | Intérêts annuels ; plafond et conditions affichés, justification renforcée |
| F6.17 | Autres frais justifiés | Libellé libre obligatoire | Montant réel, catégorie « divers » dans le résumé |

Chaque poste ouvert par l'utilisateur génère sa ligne dans le résumé 1AK (F8) et sa ligne dans la liste des justificatifs à conserver (F9).


**Bénévoles d'association (demande de Marc du 22/10/2026).** Les kilomètres faits avec son véhicule pour une association ne sont pas des frais réels de salarié : quand le bénévole renonce par écrit à leur remboursement, ils deviennent un don (reçu 2041-RD, cerfa 11580) ouvrant droit à une réduction d'impôt. L'étape « Autres frais » l'explique dans un encadré, avec les liens `recu_dons_benevoles` et `frais_benevoles` de `contenu/configuration.json`. Aucun calcul : ces sommes ne vont jamais dans la case 1AK.
## 9. F7 — Comparaison avec l'abattement de 10 % et impact sur l'impôt

La recommandation compare deux bases imposables et non deux totaux bruts, car l'option frais réels augmente aussi le salaire déclaré (réintégrations F1).

```latex
\text{Abattement} = \min\big(\max(10\% \times S_{1AJ\,prérempli};\ 509);\ 14\,555;\ S_{1AJ\,prérempli}\big)
```

```latex
\text{Gain} = \big(S_{prérempli} - \text{Abattement}\big) - \big(S_{corrigé} - \text{Frais réels}\big)
```

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F7.1 | Abattement par déclarant | Formule ci-dessus, minimum limité au salaire s'il est inférieur |
| F7.2 | Comparaison des bases | Revenu net imposable dans les deux hypothèses ; verdict « frais réels » seulement si le gain est positif |
| F7.3 | Seuil de bascule | Montant de frais réels à partir duquel l'option devient intéressante, affiché en clair |
| F7.4 | Impact sur l'impôt | Impôt estimé dans les deux cas : barème progressif, quotient familial et son plafonnement, décote ; calcul local ou appel facultatif à l'API OpenFisca avec accord explicite |
| F7.5 | Revenu fiscal de référence | Variation du RFR affichée (effet sur aides et tarifs sociaux) |
| F7.6 | Couple | Option indépendante par déclarant ; tableau des quatre combinaisons, la meilleure mise en avant |
| F7.7 | Frais supérieurs au salaire | Alerte et explication si les frais réels dépassent la rémunération du déclarant |
| F7.8 | Taux PAS | Hors périmètre en v1.0 (seul le barème compte pour l'impôt final) |

Dons, crédits d'impôt, PER et pensions restent hors périmètre : ils ne changent pas le choix entre frais réels et 10 %, et OptiFrais montre qu'ils alourdissent le parcours.

## 10. F8 — Résumé pour la case 1AK et les informations complémentaires

Chaque calcul se termine systématiquement par deux blocs à copier : le montant de la case 1AK (ou 1BK à 1DK), puis un texte de quelques lignes pour la rubrique « Informations complémentaires », dans l'ordre exigé : véhicule (kilométrage total, chevaux), puis repas, télétravail et autres déductions.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F8.1 | Rappel de procédure | Sur impots.gouv.fr : bouton « option frais réels » du déclarant, ajout de la case 1AK si absente, report du montant, salaire 1AJ corrigé si réintégrations |
| F8.2 | Ligne véhicule | Par véhicule : type, énergie, CV, km totaux, détail domicile-travail (km aller × 2 × jours) et missions, formule, montant |
| F8.3 | Lignes complémentaires | Péages et parking, intérêts, repas (nombre × montant unitaire), télétravail (méthode et jours), chaque poste F6 ouvert |
| F8.4 | Motifs | Motif dépassement 40 km, double aller-retour, double résidence repris en une phrase |
| F8.5 | Réintégrations | Ligne « salaire majoré de X € (titres-restaurant, transport, télétravail) » |
| F8.6 | Contrôle du total | Chaque ligne est arrondie à l'euro inférieur et le montant 1AK est la somme de ces lignes : l'égalité est garantie par construction |
| F8.7 | Format | Texte brut sans mise en forme, montants arrondis à l'euro inférieur (décision du 15/10/2026, comme les exemples GP 120 : 2 460,50 € → 2 460 €), longueur cible 1 000 caractères avec compteur affiché |
| F8.8 | Copie | Bouton « copier » pour la case et pour le texte, séparément, par déclarant |

Modèle de texte généré (exemple fictif) :

```markdown
Frais réels déclarant 1 : 5 714 € (case 1AK).
Véhicule : voiture diesel 5 CV, 7 920 km dans l'année (domicile-travail 22 km x 2 x 180 j sur site), barème : 7 920 x 0,357 + 1 395 = 4 222 €.
Péages et parking : 0 €. Intérêts crédit auto : 0 €.
Repas : 180 repas x (12,00 - 5,45) = 1 179 €, pas de cantine, déjeuner à domicile impossible.
Télétravail : forfait 2,70 € x 38 j = 102 €.
Autres : documentation professionnelle 211 €.
Salaire 1AJ majoré de 0 € (aucun remboursement employeur). Justificatifs conservés.
```

Ce format reprend l'exigence de la DGFiP de préciser la nature et le montant de chaque frais (dépliant GP 120). La limite réelle de caractères du champ en ligne reste à vérifier lors de la campagne 2027.

## 11. F9 — Exports, partage, confidentialité et mises à jour

F9 rend le résultat utilisable hors de l'application sans jamais faire sortir de données à l'insu de l'utilisateur.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F9.1 | Export PDF | Fenêtre autonome sur fond blanc (contournement déjà validé), détail des calculs, résumé 1AK, sources et date des paramètres. Second aller-retour quotidien (F3.6) : annexe après la note explicative (règle rappelée, km en jeu, texte du client mot pour mot, pièces attendues, date et signature) |
| F9.2 | Liste des justificatifs | Générée selon les postes ouverts (carte grise, relevés km, factures, attestation employeur de télétravail, tickets) avec rappel de conservation 3 ans |
| F9.3 | Sauvegarde locale | Dossier par année enregistré sur l'appareil, reprise l'année suivante (comme la reprise des mentions sur impots.gouv.fr). **Décision de Marc (16/10/2026) : aucun export ni import de fichier (.json) nulle part, le client ne saurait ni le retrouver ni l'ouvrir ; seule la sauvegarde automatique sur l'appareil reste.** |
| F9.4 | Partage de l'outil par lien | Accès réservé aux personnes ayant reçu le lien ; contrôle d'accès gratuit à trancher (piste Cloudflare Access) ; site non indexé par les moteurs |
| F9.5 | Partage d'une simulation | ~~Lien ou fichier généré à la demande~~ Abandonné (décision du 16/10/2026, voir F9.3) : on partage le PDF |
| F9.6 | Confidentialité | Aucun compte, aucun traceur, calcul local ; politique RGPD existante reprise dans l'app |
| F9.7 | Paramètres annuels | Fichier de paramètres signé et daté, mis à jour par publication de l'application ; mention « paramètres valables pour les revenus 2025 » visible sur chaque résultat |
| F9.8 | Mentions légales | Estimation indicative, non constitutive de conseil fiscal ; seuls impots.gouv.fr et l'avis d'imposition font foi |
| F9.9 | Accessibilité et langue | Français, vocabulaire sans jargon (pas de sigles non expliqués), lisible sur téléphone, thème clair et sombre |
| F9.10 | Note explicative | Deuxième partie du PDF, sur une nouvelle page : option pour les frais réels (article 83, 3° du CGI), rappel que le montant 1AK ne se soustrait pas du salaire 1AJ, détail par poste (formule et montant), circonstances particulières, sommes de l'employeur ajoutées au salaire, récapitulatif dont le total égale la case 1AK, valeurs prudentes signalées, pièces conservées 3 ans, lieu, date et signature. Nom et numéro fiscal laissés en blanc, à remplir à la main (aucune donnée personnelle stockée). Réponse à la consigne de l'administration : « Vous devrez indiquer le détail de vos frais dans une note explicative, et conserver les pièces justificatives pendant 3 ans » |

## 12. F10 — Situation familiale

Le montant déductible ne dépend pas du nombre de parts, mais la situation familiale décide si une longue distance ou une double résidence est admise. Ce qui compte n'est pas où habite le conjoint (le domicile est commun), mais où il travaille : un conjoint employé près du domicile justifie que l'autre fasse plus de 40 km.

| Réf. | Situation | Règle appliquée |
| --- | --- | --- |
| F10.1 | Couple marié, pacsé ou concubin stable | Option frais réels choisie séparément pour chacun ; concubinage traité comme le mariage, à condition de pouvoir prouver sa stabilité |
| F10.2 | Un conjoint travaille à 40 km ou moins du domicile commun | L'autre peut déduire sa distance réelle au-delà de 40 km ; question posée : « Où travaille votre conjoint ? » |
| F10.3 | Les deux conjoints travaillent à plus de 40 km | Chacun plafonné à 40 km, sauf autre motif personnel |
| F10.4 | Conjoint sans emploi | Motif « emploi du conjoint » indisponible ; autres motifs proposés |
| F10.5 | Célibataire | Motif « conjoint » indisponible ; restent mutation, emploi précaire ou mobile, licenciement, santé, coût du logement, mandat électif |
| F10.6 | Enfants | Scolarité et santé des enfants admises comme motifs au-delà de 40 km ; frais de garde refusés et renvoyés vers le crédit d'impôt |
| F10.7 | Double résidence | Ouverte aux couples dont les lieux de travail sont éloignés ; en principe fermée aux célibataires ; motif détaillé obligatoire |
| F10.8 | Proche à assister | Motif admis pour un second aller-retour quotidien |
| F10.9 | Véhicule du conjoint ou d'un membre du foyer | Barème utilisable |
| F10.10 | Nombre de parts | Ne change que l'économie d'impôt en euros affichée en F7, jamais le montant déductible |

## 13. F11 — Contrôles de vraisemblance et alertes

Il n'existe pas de seuil public qui déclenche un contrôle : la DGFiP sélectionne une large part de ses contrôles par analyse de données ([Actu-Juridique](https://www.actu-juridique.fr/fiscalite/fiscal-finances/detecter-plus-efficacement-la-fraude-fiscale-des-particuliers/)), et les frais réels gonflés figurent parmi les points surveillés ([Bourse Inside](https://bourseinside.fr/?p=9645)). FraisFit combine donc une alerte globale à trois niveaux et des contrôles ciblés par poste.

Un seuil unique à deux fois l'abattement (soit 20 % du salaire) déclencherait l'alerte chez la plupart des ouvriers qui font une longue route : 40 km aller, 218 jours, voiture 5 CV donnent 7 621 € de frais, soit environ 45 % d'un salaire net imposable de 17 000 €, en toute légalité. Ce seuil sert donc de rappel, pas d'alarme.

| Niveau | Déclencheur | Message et action |
| --- | --- | --- |
| 1. Rappel | Frais réels > 2 × abattement de 10 % | Bandeau bleu : « Vos frais sont élevés. C'est normal si vous faites beaucoup de route ; gardez bien vos justificatifs. » |
| 2. Vérification | Frais réels > 50 % du salaire déclaré | Bandeau orange et écran de relecture obligatoire des postes les plus lourds avant d'afficher le résumé |
| 3. Blocage | Frais réels > 100 % du salaire déclaré | Résumé non généré tant que l'utilisateur n'a pas confirmé chaque poste ; conseil de se rapprocher de son service des impôts |

| Contrôle ciblé | Déclencheur | Message |
| --- | --- | --- |
| Distance | Plus de 40 km aller sans motif | Distance ramenée à 40 km |
| Kilométrage | Km saisis > trajets calculés + missions déclarées, ou total > 30 000 km/an | « Vérifiez votre kilométrage et gardez un carnet de bord. » |
| Jours | Plus de 230 jours sur site pour un temps plein | « Avez-vous bien retiré congés, RTT et jours fériés ? » |
| Repas | Prix moyen > 21,10 €, ou repas les jours de télétravail | Alerte ou retrait automatique |
| Puissance | Plus de 7 CV saisis | Ramené à 7 CV, explication affichée |
| Cohérence familiale | Double résidence déclarée par un célibataire, ou motif « emploi du conjoint » avec conjoint sans emploi | Motif refusé |
| Remboursements | Frais déclarés sans aucune réintégration alors que l'utilisateur a indiqué des titres-restaurant ou un abonnement pris en charge | Blocage jusqu'à saisie des montants |
| Évolution | Hausse de plus de 50 % par rapport au dossier de l'année précédente enregistré | « Qu'est-ce qui a changé cette année ? », réponse reprise dans le résumé |

Les seuils de 50 % et 100 % sont des paramètres réglables, à ajuster après les premiers retours d'utilisateurs. Aucune alerte n'empêche un utilisateur légitime de déclarer : elles l'obligent à vérifier et à garder ses preuves.

## 14. F12 — Plusieurs employeurs dans l'année

Le client ne fait aucune addition lui-même : l'application les fait et les montre. Un déclarant n'a qu'une seule case de frais réels (1AK), qui regroupe les frais de tous ses emplois, et le barème s'applique au kilométrage total du véhicule sur l'année, tous employeurs confondus.

| Réf. | Fonction | Règle |
| --- | --- | --- |
| F12.1 | Question d'entrée | « Combien d'employeurs avez-vous eus en 2025 ? » (1, 2, 3, 4 ou plus) ; pictogrammes, astuce : « comptez aussi l'intérim, les particuliers employeurs et les missions courtes » |
| F12.2 | Fiche par employeur | Nom libre, période (mois de début et de fin), salaire net imposable cumulé lu sur le dernier bulletin de cet employeur, lieu de travail et distance, remboursements (transport, titres-restaurant, télétravail, indemnités kilométriques) |
| F12.3 | Addition automatique | Total des salaires affiché ligne par ligne, puis comparé au montant prérempli case 1AJ ; en cas d'écart, message : « Le montant prérempli fait foi, voulez-vous l'utiliser ? » |
| F12.4 | Raccourci sans risque | « Je ne retrouve pas tous mes bulletins » : saisie du seul total prérempli 1AJ, qui contient déjà tous les employeurs ; les autres champs restent par employeur |
| F12.5 | Calendrier | Chaque employeur a ses mois ; chevauchements autorisés (deux temps partiels) ; mois sans employeur traités comme sans trajet |
| F12.6 | Kilomètres | Trajets de chaque employeur additionnés par véhicule avant application du barème (une seule tranche) ; trajet direct d'un employeur à un autre dans la même journée = déplacement professionnel |
| F12.7 | Allocation chômage entre deux emplois | Saisie à part (attestation France Travail ou case 1AP préremplie) ; la déduction de 10 % porte sur les salaires et les allocations ensemble, l'option frais réels la remplace pour le tout (BOI-RSA-BASE-30-50-20) : la comparaison inclut donc les allocations, la case 1AJ non. Le minimum majoré des demandeurs d'emploi de longue durée a été supprimé (loi de finances pour 2019) : minimum de droit commun. Ouvre d'office les frais de recherche d'emploi (F6.5). Cas CHO-01 |
| F12.8 | Résumé 1AK | Une ligne par employeur (période, salaire, km, remboursements réintégrés), puis le total |
| F12.9 | Remboursements par employeur (mise en œuvre) | Allocation télétravail et remboursement de l'abonnement de transport saisis employeur par employeur, l'application additionne ; l'allocation réintégrée apparaît par employeur dans le résumé. Titres-restaurant et prime de panier restent saisis une fois, nombres pré-remplis avec tous les jours sur site |

## 15. F13 — Parcours « aide à domicile » (intervenants chez plusieurs bénéficiaires)

Les aides à domicile, auxiliaires de vie, aides ménagères et gardes d'enfants à domicile roulent beaucoup avec leur véhicule, sont peu remboursées (indemnité conventionnelle de la branche de 0,38 €/km, portée à 0,40 €/km au 1er juin 2026 ([SOLA](https://sola-saas.fr/indemnites-kilometriques-intervenants/)), contre environ 0,60 €/km au barème fiscal) et ont souvent plusieurs employeurs. C'est un public cible prioritaire, avec un parcours dédié.

Règles appliquées :

| Trajet | Traitement fiscal | Source |
| --- | --- | --- |
| Domicile → premier bénéficiaire, dernier bénéficiaire → domicile | Trajet domicile-travail : un aller-retour par jour, plafond 40 km aller sauf motif | BOI-RSA-BASE-30-50-30-20 § 10 à 160 |
| Entre deux bénéficiaires, retour au siège de la structure | Déplacement professionnel : totalité des km, sans plafond de 40 km | [Autrement Senior, guide CESU](https://www.autrementsenior.fr/actualites/optimisation-fiscale-cesu-frais-reels-guide) |
| Courses ou accompagnement du bénéficiaire | Professionnel ; si l'employeur ou le bénéficiaire rembourse, montant réintégré au salaire | Idem, notice 2041 GP |
| Indemnités kilométriques perçues | Réintégrées au salaire en cas d'option ; tous les km sont alors déduits au barème (gain ≈ écart entre barème et 0,38 €) | BOI § 530, notice 2041 GP |

Première question du parcours : « Qui vous emploie ? » (plusieurs réponses possibles, chaque employeur devient une fiche F12). Le type d'employeur décide du taux d'indemnité attendu, de la ligne à chercher sur le bulletin et des trajets remboursés.

| Type d'employeur | Texte applicable | Indemnité kilométrique de référence | Où lire les km |
| --- | --- | --- | --- |
| Association ou structure à but non lucratif (ADMR, ADAPEI, etc.) | Convention collective de la branche de l'aide à domicile du 21 mai 2010 (IDCC 2941), article 14.3 (version avenant 50-2022, en vigueur du 1er octobre 2022 au 1er juin 2026) : seuls les trajets entre deux interventions d'une même demi-journée sont indemnisés ; ni le trajet domicile → première intervention, ni le dernier retour, ni le trajet qui encadre la pause repas | Voiture 0,38 €/km, deux-roues à moteur 0,16 €/km pour les revenus 2025 (avenant 50-2022, agréé le 19 août 2022, en vigueur au 1er octobre 2022, étendu le 31 mars 2023) ; voiture 0,40 €/km depuis le 1er juin 2026 (avenant 76, agréé le 29 mai 2026, [Sénat](https://www.senat.fr/questions/base/2026/qSEQ260508795.html)) | Bulletin de paie, ligne « indemnités kilométriques » |
| Entreprise privée de services à la personne | Convention des entreprises de services à la personne (IDCC 3127) | Minimum conventionnel 0,35 €/km, souvent plus selon l'entreprise | Bulletin de paie |
| CCAS, mairie, département (agent public) | Barème des indemnités kilométriques de la fonction publique | Taux de la fonction publique selon puissance et distance | Bulletin ou état de frais de déplacement |
| Particulier employeur payé en CESU ou Pajemploi | Convention des particuliers employeurs et de l'emploi à domicile (IDCC 3239) : indemnité prévue au contrat quand le véhicule personnel sert aux besoins de l'employeur (courses, rendez-vous) ; trajet domicile → domicile de l'employeur non indemnisé | Taux fixé au contrat, souvent nul | Pas de bulletin détaillé : relevés CESU, contrat de travail, mode B (semaine type) recommandé |

Conséquences pour l'application : avec une association, une entreprise ou un CCAS, le mode A (km lus sur les bulletins) est proposé en premier ; avec des particuliers employeurs, le mode B l'est, car les trajets entre deux particuliers sont rarement remboursés mais restent déductibles. Le salaire CESU ou Pajemploi est déjà prérempli en case 1AJ via les attestations fiscales annuelles, ce qui alimente F12.4. Les primes carburant et l'aide « grands rouleurs » perçues sont demandées pour réintégration (F1.10). Le taux de référence est un paramètre annuel du fichier de paramètres, pour signaler un écart anormal entre km déclarés et indemnités perçues.

Cinquième cas, tiré d'un témoignage réel (auxiliaire de vie, 2026) : l'emploi via une société ou une association mandataire. Les employeurs sont les personnes aidées (convention des particuliers employeurs IDCC 3239), mais c'est le mandataire qui édite une fiche de paie par personne aidée et par mois (cinq personnes aidées = soixante fiches par an). Chaque fiche porte un petit forfait de participation aux frais de transport (3 à 4 €). L'indemnité kilométrique est fixée au contrat (article 57) et ne couvre en principe que les trajets faits à la demande de la personne aidée. Le pointage obligatoire chez chaque personne aidée laisse un historique daté qui sert de justificatif. Enfin, la surprime d'assurance pour usage professionnel (25 €/mois dans ce témoignage) n'est souvent pas remboursée : elle est déjà incluse dans le barème kilométrique, donc jamais déductible en plus.

### Parcours « intervenants à domicile », écran par écran

Priorité commerciale : les salariées de l'ADMR, de l'UNA et des mandataires sont un public clé. Le parcours applique la règle des trois niveaux (question simple, aide en image, solution de secours prudente) à chaque écran.

| Écran | Question posée | Aide en image (astérisque) | Solution de secours prudente |
| --- | --- | --- | --- |
| 1. Votre métier | « Travaillez-vous chez des personnes aidées ? » (aide à domicile, auxiliaire de vie, aide ménagère, garde d'enfants à domicile) | Pictogrammes des métiers | — |
| 2. Qui édite vos fiches de paie ? | Association (ADMR, UNA, ADEDOM…), entreprise prestataire, société ou association mandataire (une fiche par personne aidée), CESU ou Pajemploi en direct, CCAS ou mairie ; plusieurs choix possibles | En-tête de bulletin d'exemple, ligne « convention collective » entourée (IDCC 2941, 3127, 3239) | « Je ne sais pas » : règles générales, sans taux supposé |
| 3. Votre salaire de l'année | Montant prérempli case 1AJ, recommandé d'office pour les mandataires et le CESU (inutile d'additionner soixante fiches) | Capture redessinée de la déclaration en ligne | Addition des attestations fiscales annuelles |
| 4. Ce que vous avez reçu pour vos trajets | Indemnités kilométriques (km × taux) et forfaits transport ; pour les mandataires : récapitulatif annuel du mandataire, ou montant d'une fiche × nombre de fiches | Bulletin d'exemple, lignes « indemnités kilométriques » et « participation frais de transport » entourées | Montant d'une fiche × 12 × nombre de personnes aidées, à réintégrer en totalité |
| 5. Vos trajets | Journée type dessinée : maison → personne 1 → personne 2 → … → maison ; le client saisit chaque distance (itinéraire le plus court), l'application classe seule chaque trajet (domicile-travail en bleu, professionnel en vert) ; plusieurs journées types ; ou total d'un mois type × mois travaillés ; ou km lus sur les bulletins | Schéma animé de la journée type et légende des couleurs | Seuls les km déjà indemnisés, plus un aller-retour domicile limité à 40 km |
| 6. Contrôle de cohérence | Les km professionnels saisis doivent être au moins égaux aux km indemnisés (indemnités ÷ taux) | Explication en une phrase | Correction proposée automatiquement |
| 7. Vos autres frais | Repas entre deux interventions (forfait 5,45 € si retour impossible), téléphone personnel utilisé pour le pointage (part professionnelle), tenue de travail et entretien | Fiche « pourquoi votre surprime d'assurance n'est pas déductible » : déjà dans le barème ; peut être réclamée à l'employeur (art. 14.4 pour la branche associative) | Postes laissés à zéro |
| 8. Résultat et résumé 1AK | Verdict, gain, texte à coller avec km domicile-travail et km entre personnes aidées séparés | — | — |
| 9. Justificatifs | Plannings, historique de pointage exporté depuis l'application de l'employeur, captures d'itinéraires, bulletins ou récapitulatif annuel | Liste à cocher | — |
| 10. Pour l'an prochain | Carnet de bord mensuel prérempli avec les personnes aidées et leurs distances | — | — |

Cas de test n° 2 (témoignage mandataire, mois de mars) : 433 km domicile → première personne aidée et entre personnes aidées, plus 309 km de retours au domicile, soit 742 km par mois ; forfaits transport reçus 156,75 € par mois. Sur 12 mois à l'identique : 8 904 km, barème 4 CV 8 904 × 0,340 + 1 330 = 4 357 € de frais, et 1 881 € de forfaits à réintégrer au salaire. Le calcul réel retirera les mois de congés et appliquera la règle des 40 km par trajet domicile-travail.

Exemple de référence (journée d'une aide à domicile en association, voiture 4 CV, 200 jours, revenus 2025) :

| Trajet | Km | Indemnisé par l'employeur (art. 14.3) | Traitement fiscal |
| --- | --- | --- | --- |
| Domicile → bénéficiaire 1 | 8 | Non | Domicile-travail |
| B1 → B2 | 6 | Oui, 0,38 €/km | Professionnel |
| B2 → B3 | 5 | Oui | Professionnel |
| B3 → B4, avec pause repas entre les deux | 7 | Non (change de demi-journée) | Professionnel |
| B4 → B5 | 4 | Oui | Professionnel |
| B5 → domicile | 10 | Non | Domicile-travail |
| Total de la journée | 40 | 15 km, soit 5,70 € | 40 km déductibles |

Sur l'année : 8 000 km, barème 4 CV 8 000 × 0,340 + 1 330 = 4 050 € ; indemnités perçues 15 × 200 × 0,38 = 1 140 € réintégrées au salaire. Avec 18 000 € de salaire : base 16 200 € avec l'abattement de 10 %, 15 090 € avec les frais réels (19 140 − 4 050), soit 1 110 € de revenu imposable en moins, et 2 200 € si le forfait repas de 5,45 € s'applique. Si la pause repas se fait à la maison (B3 → domicile → B4), ce second aller-retour n'est pas retenu par défaut (règle d'un aller-retour par jour) ; il ne l'est que sur motif choisi par le client (horaires coupés), signalé dans le résumé.

Points vérifiés dans l'avenant 50-2022 et l'article 14 (documents du projet), et conséquences pour l'application :

| Point du texte | Conséquence dans FraisFit |
| --- | --- |
| Séquences non consécutives d'une même demi-journée : frais « reconstitués », mais soumis à une clause suspensive (art. 14.5 b) : applicables seulement si la structure est financée pour cela par l'État et le département | Les km réellement indemnisés varient d'une structure à l'autre : le mode A (km lus sur les bulletins) fait foi pour la réintégration ; aucun taux ni nombre de km n'est supposé |
| Transports en commun : abonnement remboursé à 100 % pour les intervenants à mi-temps ou plus | Rien à déduire au titre de l'abonnement ; si l'utilisateur déclare un abonnement, l'application rappelle que le remboursement doit être réintégré |
| Indemnité kilométrique inférieure au barème fiscal : extension sous réserve du principe de prise en charge des frais professionnels (Cass. soc., 20 juin 2013) | Information affichée sans conseil juridique ; le calcul fiscal est inchangé |
| Surcoût d'assurance pour missions spécifiques (courses, transport accompagné) remboursé par l'employeur (art. 14.4) | Non déductible en plus du barème ; remboursement à réintégrer s'il apparaît sur le bulletin |

Les deux textes de branche disent ce que l'employeur rembourse, donc ce qu'il faut réintégrer et quels km restent non remboursés. Les règles de déduction elles-mêmes restent celles de la DGFiP (barème GP 120, notice 2041 GP, BOFiP).

Trois façons de saisir les kilomètres, au choix du client, de la plus simple à la plus précise :

| Mode | Comment | Pour qui |
| --- | --- | --- |
| A. Depuis les bulletins | Les km indemnisés figurent sur chaque bulletin (ligne « indemnités kilométriques », nombre de km × taux) : le client recopie les 12 nombres de km, l'appli additionne ; elle ajoute ensuite les trajets domicile → premier et dernier → domicile (distance moyenne × jours) | Salariés d'une structure (association, entreprise, CCAS) ; le plus fiable |
| B. Semaine type | Le client décrit une ou plusieurs semaines types (jour par jour : bénéficiaires visités, km entre eux, aide pour les distances par itinéraire), puis indique combien de semaines chaque type s'applique ; changement de planning = nouvelle semaine type | Particuliers employeurs (CESU), plannings changeants |
| C. Compteur | Km totaux du véhicule dans l'année moins km personnels estimés ; mode le moins sûr, alerte et rappel du carnet de bord | Dernier recours |

Solution de secours sans risque : si aucun mode n'aboutit, l'application ne retient que les km indemnisés par l'employeur (mode A partiel) et signale la valeur prudente.

Accompagnement spécifique : écran d'accueil du parcours avec schéma « maison → bénéficiaire 1 → bénéficiaire 2 → maison » distinguant en deux couleurs trajet domicile-travail et trajets professionnels ; fiche astérisque montrant la ligne des km indemnisés sur un bulletin d'exemple ; modèle de carnet de bord mensuel téléchargeable (date, bénéficiaire, km) pour l'année suivante ; liste des justificatifs adaptée (plannings, bulletins, carnet). Repas pris entre deux interventions et téléphone professionnel au prorata proposés dans le même parcours.

Point à surveiller : le trajet domicile → premier bénéficiaire est traité en domicile-travail ; un intervenant sans aucun lieu de travail fixe pourrait défendre un traitement plus favorable, non retenu par prudence en v1.0.

## 16. F14 — Parcours par métier

Après le filtrage, un écran « Votre métier » propose cinq profils. Le profil ne change aucune règle de calcul : il ouvre d'office les postes utiles, pose des questions spécifiques, montre des fiches d'aide adaptées (documents du métier) et active des alertes ciblées. « Autre métier » donne le parcours général, sans rien perdre.

| Profil | Postes ouverts d'office | Questions spécifiques | Pièges et alertes | Sources |
| --- | --- | --- | --- | --- |
| Intervenant à domicile (ADMR, UNA, mandataire, CESU) | Parcours F13 complet | Voir F13 | Voir F13 | Avenant 50-2022, art. 14 CCN BAD |
| Soignant salarié (infirmier, aide-soignant, sage-femme, kiné salarié ; hôpital, clinique, Ehpad, SSIAD, HAD) | Trajets, repas, tenues et chaussures, cotisation à l'ordre professionnel, formation et diplômes universitaires, documentation | « Votre employeur lave-t-il vos tenues ? » (si oui, entretien non déductible) ; « Travaillez-vous de nuit ou en 12 h ? » (repas et trajets aux horaires sans transport en commun) ; « Faites-vous des soins à domicile (SSIAD, HAD) ? » (bascule vers la journée type F13) | Self ou cantine subventionnée : surcoût au-delà de 5,45 € seulement ; infirmiers libéraux exclus (bénéfices non commerciaux, pas de case 1AK) ; chiffres de certains sites privés erronés (taux ou plafonds périmés), seuls les paramètres officiels sont utilisés | [Piik](https://www.piik.net/frais-reels-ou-abattement-de-10-quel-choix-pour-linfirmiere-salariee-en-2026/), notice 2041 GP |
| Enseignant (Éducation nationale, privé sous contrat, enseignement agricole) | Trajets, bureau à domicile, matériel informatique, fournitures et matériel pédagogique, documentation, formation et concours, cotisation syndicale, déménagement après mutation, double résidence | « Êtes-vous remplaçant (TZR, brigade) ou sur plusieurs établissements ? » (trajets réels vers chaque établissement, journée type) ; « Avez-vous été muté cette année ? » (déménagement, double résidence) ; « Travaillez-vous chez vous ? » (bureau au prorata de surface et d'usage) | Indemnités de sujétions de remplacement et remboursements de frais à réintégrer ; bureau à domicile : alerte si une salle de travail est disponible dans l'établissement ; restaurant administratif subventionné : surcoût seulement ; matériel informatique : usage privé jamais forfaitisé ; calendrier scolaire et arrêté d'affectation comme justificatifs | [Guide SE-UNSA](https://www.se-unsa.org/wp-content/uploads/2025/09/Impots-MAJ-2025.pdf) |
| Grand rouleur ou double résidence | Trajets au-delà de 40 km avec motif, péages, parking, intérêts, double résidence (loyer et charges du second logement, trajets hebdomadaires au barème, surcoût repas) | Motif du dépassement (F3.4, F10) ; nombre d'allers-retours hebdomadaires vers le domicile familial | Alerte de niveau 1 attendue et normale ; motif repris mot pour mot dans le résumé 1AK | BOI-RSA-BASE-30-50-30-20 |
| Artiste du spectacle (musicien, danseur, chanteur lyrique, choriste, comédien) | — | — | Exclus en v1.0, prévu en v1.1 : déductions forfaitaires de 14 % (plafond 20 377 €) et 5 % (plafond 7 277,50 €) pour les revenus 2025, articulation avec les autres frais réels à confirmer dans le BOFiP avant développement | [Guide Adami 2026](https://www.adami.fr/wp-content/uploads/2026/06/GUIDE-DE-LA-FISCALITE-ARTISTE-2026.pdf) |

Cas de test métier à constituer avant développement : une infirmière de nuit en 12 h sans transport en commun, une infirmière de SSIAD (journée type), un professeur des écoles remplaçant sur trois écoles, un professeur de collège muté à 400 km en double résidence.

## 17. Exclusions, alertes et points à surveiller

Ces dépenses sont refusées par l'application avec une phrase d'explication, pour éviter qu'un utilisateur ne déclare un frais contestable.

| Dépense refusée | Raison affichée |
| --- | --- |
| Frais de garde d'enfants | Jamais déductibles en frais professionnels, même en télétravail (crédit d'impôt distinct) |
| Repas les jours de télétravail | Exclus par la notice 2041 GP |
| Loyer d'un véhicule loué en plus du barème | Déjà couvert par le barème |
| Recharge électrique en plus du barème | Déjà incluse |
| Garage de la résidence principale | Aucune dépense supplémentaire |
| Remboursement de prêt étudiant | Exclu des frais de diplôme |
| Vêtements de ville, costume | Pas de caractère spécifique |
| Réinstallation du foyer lors d'un déménagement | Exclue du déménagement professionnel |

| Point à surveiller | Action |
| --- | --- |
| Amendement I-CF1500 au budget 2027, adopté en commission le 7 octobre 2026 : plancher du barème kilométrique = barème revenus 2025 majoré de 10 % pour les revenus 2026 ([Selectra](https://selectra.info/finance/actualites/marche/bareme-kilometrique-10-pourcent-frais-reels)) | Non voté définitivement : prévoir le paramètre « coefficient de plancher » dans le fichier 2026, valeur fixée après la loi de finances |
| Plafond 10 % : 14 555 € selon impots.gouv.fr, 14 556 € sur certains sites privés | Valeur officielle 14 555 € retenue |
| Valeurs 2026 (repas foyer, télétravail, barème) | À charger dès la brochure pratique 2027 |
| Deux PDF du projet (« déclarer frais réels article », « comment déclarer ») | Scans sans texte lisible : à remplacer par une version texte pour contrôle |
| Limite de caractères du champ en ligne | À vérifier sur impots.gouv.fr au printemps 2027 |
| Frais réels supérieurs au salaire (F7.7) | Réglé le 16/10/2026 : l'excédent est un déficit déduit du revenu global (BOI-RSA-BASE-10 § 20, CGI art. 156 I) ; explication affichée, calcul de l'impôt du foyer sur la somme des bases |

### Sources consultées

Documents du projet : dépliant DGFiP « Frais professionnels » GP 120 (mars 2025), notice 2041 GP revenus 2024, formulaire 2042. Pages web : [Tout sur mes finances, frais réels 2025](https://www.toutsurmesfinances.com/impots/frais-reels-comment-calculer-la-deduction-des-frais-de-repas-et-des-frais-kilometriques.html) ; [Aide-mémoire brochure IR 2026, impots.gouv.fr](https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2026/pdf_som/aide_memoire.pdf) ; [Legifiscal, déduction forfaitaire revenus 2025](https://www.legifiscal.fr/actualites-fiscales/4427-revenus-2025-deduction-forfaitaire-traitements-salaires.html) ; [WebLex, allocations forfaitaires 2025](https://www.weblex.fr/chiffres-cles/limites-d-exoneration-d-impot-sur-le-revenu-applicable-aux-allocations-forfaitaires-pour-frais-professionnels-pour-2025) ; [WebLex, achat d'ordinateur](https://www.weblex.fr/weblex-actualite/impot-sur-le-revenu-deduire-l-achat-de-votre-ordinateur) ; [Tissot, télétravail revenus 2025](https://www.editions-tissot.fr/actualite/droit-du-travail/teletravail-lindemnite-est-exoneree-dimpot-sur-les-revenus) ; [Bercy Infos, double résidence](https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mon-impot-sur-le-revenu/impot-sur-le-revenu-comment-deduire-les-frais-de-double-residence) ; [OptiFrais, calculateur frais réels](https://optifrais.fr/frais-reels.html) ; [Selectra, amendement barème +10 %](https://selectra.info/finance/actualites/marche/bareme-kilometrique-10-pourcent-frais-reels) ; références BOFiP BOI-RSA-BASE-30-50-30-10 à 40.

# Les chiffres de FraisFit : mode d'emploi

Tous les chiffres fiscaux de l'application sont dans ce dossier, **un fichier par année de revenus** : `revenus-2025.json` sert à la déclaration faite en 2026, `revenus-2026.json` servira à celle de 2027, etc. Le site et l'application lisent ces fichiers ; aucun chiffre n'est écrit dans le code. Un fichier JSON ne peut pas contenir de commentaires : les explications sont donc ici.

## La mise à jour de chaque année

L'administration fiscale publie les chiffres d'une année de revenus l'année suivante, en général entre février et avril.

| Quand | Ce qu'il faut faire | Badge sur l'accueil |
| --- | --- | --- |
| 1er janvier | Rien : l'application continue avec les chiffres de l'an dernier. | Rouge « en attente » |
| Février à avril, dès la publication | Demander à Claude Code : « Crée `parametres/revenus-2026.json` à partir de 2025, statut provisoire ». | Rouge (orange après le 30 mars) |
| Ensuite | Vérifier chaque ligne avec le tableau ci-dessous, colonne « Où vérifier ». Corriger les chiffres qui ont changé et mettre à jour les sources. | — |
| Une fois tout contrôlé | Dans le bloc `millesime` : `"statut": "vérifié"` et `"date_verification": "AAAA-MM-JJ"` (date du jour). | Vert « vérifié le… » |
| Pour finir | `npm test` (le contrôle doit passer), puis envoyer sur GitHub : le site se met à jour tout seul sur Vercel. | — |

La date de fin du badge rouge (30 mars) se règle dans `contenu/configuration.json`, rubrique `mise_a_jour_annuelle`.

Les 70 cas de `tests/cas-de-test.json` restent calculés sur les revenus 2025 : ils vérifient le **moteur**, pas les chiffres de la nouvelle année. Pour la nouvelle année, la vérification ligne par ligne, c'est vous.

## Ligne par ligne

Légende de la dernière colonne : **chaque année** = le chiffre change presque toujours ; **à revoir** = souvent reconduit, mais à contrôler ; **stable** = règle de loi qui change rarement ; **FraisFit** = réglage de l'application, pas un chiffre officiel.

### millesime : l'en-tête du fichier

| Ligne | Ce que c'est | Fréquence |
| --- | --- | --- |
| `revenus` | Année des revenus déclarés (2025). | chaque année |
| `declaration` | Année où l'on déclare (2026). | chaque année |
| `statut` | `provisoire` ou `vérifié`. Commande la couleur du badge. | chaque année |
| `date_gel` | Date où le fichier a été figé. | chaque année |
| `date_verification` | Date de votre contrôle, affichée dans le badge vert (« vérifié le 13/10/2026 »). | chaque année |

### abattement_10_pourcent : l'abattement automatique

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `taux` | 10 % retirés automatiquement des salaires. | Brochure pratique de l'impôt sur le revenu | stable |
| `minimum_par_declarant` | Abattement minimum (509 €). | Brochure pratique, aide-mémoire ; BOFiP BOI-BAREME-000035 | chaque année |
| `maximum_par_declarant` | Abattement maximum (14 555 €). | Idem | chaque année |

### repas

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `valeur_repas_au_foyer` | Prix d'un repas pris chez soi, retiré du prix du repas (5,45 €). | Dépliant DGFiP GP 120 « frais réels », brochure pratique | chaque année |
| `forfait_sans_justificatif_detaille` | Montant par repas sans ticket détaillé (même chiffre). | Idem | chaque année |
| `seuil_alerte_prix_repas` | Au-delà (21,10 €), simple avertissement, jamais une coupe. | URSSAF : limite d'exonération de l'indemnité de repas au restaurant | chaque année |
| `avantage_en_nature_repas_fourni_employeur` | Valeur d'un repas fourni par l'employeur (5,45 €). | URSSAF, avantages en nature nourriture | chaque année |

### grand_deplacement_reperes (affichage seulement)

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `logement_petit_dejeuner_paris_petite_couronne_par_jour` | Repère logement à Paris et petite couronne (75,60 €). | URSSAF, indemnités de grand déplacement | chaque année |
| `logement_petit_dejeuner_autres_departements_par_jour` | Repère logement ailleurs (56,10 €). | Idem | chaque année |
| `repas_par_repas` | Repère repas (21,10 €). | Idem | chaque année |

### teletravail

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `forfait_par_jour` | Forfait par jour de télétravail (2,70 €). | Notice 2041 GP ; brochure pratique | à revoir |
| `plafond_mensuel` / `plafond_annuel` | Plafonds du forfait (59,40 € et 626,40 €). | Idem | à revoir |
| `semaines_travaillees_reference` | 47 semaines pour passer d'un rythme hebdomadaire à l'année. | Choix de calcul (docs/01) | FraisFit |
| `heures_par_journee_teletravail_local_mixte`, `heures_par_an`, `studio_part_professionnelle` | Règles de prorata d'un local servant aussi au logement. | Notice 2041 GP | stable |

### materiel

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `seuil_deduction_immediate_HT` | Sous 500 € hors taxes, l'achat est déduit en une fois. | BOFiP BOI-RSA-BASE-30-50-30-40 | stable |
| `duree_amortissement_informatique_ans` | Au-delà, réparti sur 3 ans (informatique). | Idem | stable |

### deplacements

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `distance_aller_max_sans_justification_km` | 40 km : au-delà, il faut un motif. | Brochure pratique ; BOFiP | stable |
| `allers_retours_par_jour_par_defaut` | Un aller-retour par jour. | Choix de calcul | FraisFit |
| `puissance_max_voiture_cv` | Ligne « 7 CV et plus » du barème. | Dépliant GP 120 | stable |
| `majoration_electrique` | Majoration de 20 % des véhicules électriques, pour information seulement : les barèmes électriques sont recopiés tels quels. | Dépliant GP 120 | à revoir |

### bareme_kilometrique

Chaque ligne du barème s'écrit `{"a": …, "b": …}` : pour d kilomètres dans la tranche, montant = d × a + b. Les trois blocs d'une ligne correspondent aux trois tranches (`tranches_km` donne les limites : 5 000 et 20 000 km pour les voitures, 3 000 et 6 000 km pour les deux-roues).

| Bloc | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `voiture_thermique` | Lignes 3 à 7 CV (3 = 3 CV et moins, 7 = 7 CV et plus). | Dépliant DGFiP GP 120 de l'année ; arrêté du barème kilométrique | à revoir |
| `voiture_electrique` | Mêmes lignes, chiffres électriques officiels. **Recopier, ne jamais recalculer ×1,20.** | Idem | à revoir |
| `cyclomoteur_thermique` / `cyclomoteur_electrique` | Une seule ligne. | Idem | à revoir |
| `moto_thermique` / `moto_electrique` | Lignes 1-2 CV, 3-5 CV, plus de 5 CV. | Idem | à revoir |

Le barème est reconduit à l'identique depuis l'arrêté de mars 2023. Voir aussi `points_a_surveiller` : une hausse de 10 % est en discussion pour les revenus 2026.

### alertes_vraisemblance (réglages FraisFit)

| Ligne | Ce que c'est |
| --- | --- |
| `niveau_1_rappel_multiple_abattement` | Rappel si les frais réels dépassent 2 fois l'abattement. |
| `niveau_2_verification_part_du_salaire` | Vérification demandée au-delà de 50 % du salaire. |
| `niveau_3_blocage_part_du_salaire` | Blocage au-delà de 100 % du salaire. |
| `jours_sur_site_max_temps_plein` | Alerte au-delà de 230 jours sur site. |
| `km_annuels_alerte` | Alerte au-delà de 30 000 km par an. |
| `hausse_annuelle_alerte` | Alerte si les frais augmentent de plus de 50 % d'une année sur l'autre. |

Aucun seuil officiel n'existe : à ajuster d'après les retours des utilisateurs.

### valeurs_prudentes_je_ne_sais_pas (réglages FraisFit)

Valeurs appliquées quand l'utilisateur répond « Je ne sais pas ». Elles donnent toujours la déduction la plus faible : 3 CV, moteur thermique, 218 jours travaillés, 60 % de titre-restaurant payés par l'employeur, 50 % ou 75 % d'abonnement de transport remboursés, forfait repas de 5,45 €, péages et intérêts à zéro, cotisations syndicales hors frais réels, covoiturage entre conjoints un jour par semaine. Le forfait repas suit `repas.forfait_sans_justificatif_detaille` : changer le texte `prix_repas` si ce chiffre change.

### aide_a_domicile

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `indemnite_km_branche_associative_voiture` / `_deux_roues` | Indemnités kilométriques de la convention de la branche aide à domicile (0,38 € et 0,16 €). | Convention IDCC 2941, art. 14.3, et ses avenants (Légifrance) | à revoir |
| `indemnite_km_branche_associative_voiture_depuis_2026_06_01` | 0,40 € depuis le 1er juin 2026 (avenant 76) : à intégrer dans le fichier des revenus 2026. | Idem | à revoir |
| `minimum_conventionnel_services_a_la_personne` | Minimum de 0,35 € par km. | Conventions IDCC 3127 et 3239 | à revoir |

### impot_revenu (estimation de l'impôt)

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `tranches` | Barème par part (0 %, 11 %, 30 %, 41 %, 45 %) et limites des tranches. | Loi de finances de l'année ; CGI art. 197 (Légifrance) | chaque année |
| `plafond_par_demi_part` | Plafond de l'avantage d'une demi-part. | Brochure pratique, aide-mémoire | chaque année |
| `plafond_deux_premieres_demi_parts_parent_isole` | Plafond pour un parent seul. | Idem | chaque année |
| `reduction_complementaire_veuf_avec_enfants` | Réduction des veufs avec enfants à charge. | CGI art. 197 | chaque année |
| `decote_personne_seule`, `decote_couple`, `decote_taux` | Décote des petits impôts. | Idem | chaque année |
| `seuil_mise_en_recouvrement` | Impôt non réclamé en dessous de 61 €. | Brochure pratique | à revoir |

### cotisations_syndicales

| Ligne | Ce que c'est | Où vérifier | Fréquence |
| --- | --- | --- | --- |
| `taux_credit_impot` | Crédit d'impôt de 66 %, perdu si les cotisations passent en frais réels. | CGI art. 199 quater C ; notice 2041 GP | stable |

### resume_1ak

| Ligne | Ce que c'est |
| --- | --- |
| `longueur_cible_caracteres` | Longueur visée pour le texte à recopier dans « Informations complémentaires » (1 000 caractères). Limite réelle du champ à vérifier au printemps 2027. |

### points_a_surveiller

Liste libre des questions ouvertes pour l'année suivante. À relire à chaque mise à jour, puis à vider ou à compléter.

## Règles à ne jamais oublier

- Un chiffre qui manque s'ajoute au fichier **avec sa source** ; on ne l'invente jamais.
- Les virgules décimales s'écrivent avec un point (`5.45`) et il n'y a pas de virgule après le dernier élément d'un bloc. Si le fichier est mal formé, `npm test` le signale.
- Ne jamais modifier un ancien fichier pour une nouvelle année : on en ajoute un.

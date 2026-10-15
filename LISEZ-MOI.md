# FraisFit — dossier de démarrage pour Claude Code

Version du 15 octobre 2026. Le projet contient désormais tout ce qui a été décidé pour FraisFit : spécifications, chiffres fiscaux officiels, cas de test, maquettes, logo et sources.

## Contenu (installé dans Assistant-fiscal le 15 octobre 2026)

```
Assistant-fiscal/
├── CLAUDE.md                     Instructions lues automatiquement par Claude Code
├── LISEZ-MOI.md                  Ce fichier
├── docs/                         Spécifications + PDF officiels + textes aide à domicile
├── parametres/revenus-2025.json  Tous les chiffres fiscaux (un fichier par année)
├── tests/                        49 cas de test + calcul de référence
├── design/                       Couleurs, maquettes, logo et icône Play Store
├── src/ …                        Le code existant de l'application
```

Pensez à enregistrer ces ajouts dans Git : `git add . && git commit -m "Ajout des spécifications FraisFit v1.0"`.

## Premier message à donner à Claude Code

Copiez-collez ceci :

> Lis CLAUDE.md, puis les deux fichiers de docs/ et parametres/revenus-2025.json. Résume-moi en dix lignes ce que tu as compris et signale toute contradiction. Ensuite, commence l'étape 1 : le moteur de calcul TypeScript qui charge le JSON de paramètres, avec des tests qui vérifient les 33 cas de tests/cas-de-test.json. Ne touche pas encore à l'interface.

## Vérifier les cas de test vous-même

Si Python est installé : `python3 tests/reference_calcul.py`. Le message « tous les exemples officiels sont retrouvés » confirme que les chiffres sont justes.

## Chaque année

Au printemps, quand la DGFiP publie la brochure pratique, ajoutez `parametres/revenus-2026.json` (copie du 2025, chiffres mis à jour) et demandez à Claude Code de l'intégrer. Le code ne doit pas changer.

## À noter

- Le site Tout sur mes finances contient une erreur de calcul : il annonce 991,60 € pour un repas de cantine à 10 € sur 218 jours, alors que le résultat juste est 991,90 €. Le cas de test REP-03 utilise la bonne valeur.
- Le logo complet est une photo détourée : prévoir une version vectorielle avant la publication. L'icône Play Store est, elle, déjà en vectoriel (`design/logo/icone-playstore.svg`).
- Les PDF « déclarer frais réels article » et « comment déclarer » de docs/ sont des scans sans texte : Claude Code ne peut pas les lire.

# FraisFit

Savoir si l'option frais réels (case 1AK) fait payer moins d'impôt que l'abattement automatique de 10 %, puis obtenir le montant et le texte à coller dans la déclaration. Application indépendante, non affiliée à l'administration fiscale.

---

## Fonctionnalités

- Filtrage des situations non couvertes, choix du métier
- Parcours en 7 étapes : salaire, jours (calendrier réel, mois par mois), trajet, repas, télétravail, autres frais, relecture
- Aide « astérisque » avec document d'exemple et « Je ne sais pas » qui retient la valeur prudente
- Comparaison sur les bases imposables, réintégrations des remboursements de l'employeur comprises
- Montant de la case 1AK et texte « Informations complémentaires » à copier
- Calcul 100 % local : aucune donnée envoyée

---

## Déploiement

### 1. Cloner le dépôt

```bash
git clone https://github.com/randos74-afk/Assistant-fiscal.git
cd Assistant-fiscal
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer en développement local

```bash
npm run dev
```

Ouvre http://localhost:5173

### 4. Construire pour la production

```bash
npm run build
```

Les fichiers sont générés dans le dossier `dist/`.

---

## Déploiement gratuit sur Vercel (recommandé)

1. Aller sur [vercel.com](https://vercel.com) → **Add New Project**
2. Importer le dépôt GitHub `randos74-afk/Assistant-fiscal`
3. Framework : **Vite** (détecté automatiquement)
4. Cliquer **Deploy**

Le lien généré n'est **pas indexé** par les moteurs de recherche (`noindex` dans le HTML). Partagez-le uniquement aux personnes concernées.

---

## Déploiement sur Netlify (alternative)

1. Aller sur [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Sélectionner le dépôt GitHub
3. Build command : `npm run build`
4. Publish directory : `dist`
5. Cliquer **Deploy site**

---

## Structure du projet

```
assistant-fiscal/
├── parametres/revenus-AAAA.json  ← Tous les chiffres fiscaux, un fichier par année
├── tests/                        ← Cas de test de référence (Python) et résultats attendus
├── docs/                         ← Spécifications et documents officiels
├── design/                       ← Couleurs, maquettes, logo
└── src/
    ├── moteur/    ← Moteur de calcul pur, sans chiffre écrit dans le code
    ├── parcours/  ← Logique des questions (testée)
    └── ui/        ← Écrans React
```

---

## Mise à jour des chiffres fiscaux

Ajouter `parametres/revenus-AAAA.json` pour une nouvelle année : aucun chiffre n'est écrit dans le code. Vérifier ensuite avec `npm test`.

---

## Licence

Usage privé — non destiné à une diffusion publique commerciale.

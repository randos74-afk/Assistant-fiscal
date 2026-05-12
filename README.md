# Simulateur Frais Réels 2025

Outil de simulation et d'optimisation des frais réels salariés pour la déclaration de revenus française 2025. Barèmes DGFiP 2026 (GP 120).

---

## Fonctionnalités

- Arbre de questions dynamique (questions conditionnelles selon les réponses)
- Calcul en temps réel de toutes les catégories de frais réels
- Comparaison automatique avec l'abattement forfaitaire 10 %
- Moteur d'optimisation avec score de pertinence
- Alertes de conformité fiscale
- Texte prêt à copier pour la rubrique « Informations complémentaires »
- **Impression / export PDF** depuis l'onglet Détail
- Remboursement repas employeur : montant fixe **ou** pourcentage

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
├── index.html          ← Point d'entrée HTML (styles d'impression PDF inclus)
├── vite.config.js      ← Configuration Vite
├── package.json        ← Dépendances
└── src/
    ├── main.jsx        ← Point d'entrée React
    └── App.jsx         ← Application complète (questions + calcul + résultats)
```

---

## Mise à jour des barèmes

Les barèmes kilométriques sont dans `src/App.jsx`, constante `BK` en haut du fichier.
Le forfait repas à domicile est dans la constante `REPAS_FOYER`.

---

## Licence

Usage privé — non destiné à une diffusion publique commerciale.

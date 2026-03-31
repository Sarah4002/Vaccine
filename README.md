# 💉 VacciTrack — Application de Suivi de Vaccination

Application web complète de gestion et suivi des vaccinations, construite avec **React** (frontend) et **Node.js/Express** (backend).

---

## 🚀 Démarrage rapide

### Prérequis
- **Node.js** v18+ ([télécharger](https://nodejs.org))
- **npm** (inclus avec Node.js)

### Installation

```bash
# 1. Installer les dépendances du serveur
cd server
npm install

# 2. Installer les dépendances du client
cd ../client
npm install
```

### Lancement

**Terminal 1 — Serveur Node.js (port 3001)**
```bash
cd server
node index.js
```

**Terminal 2 — Client React (port 3000)**
```bash
cd client
npm start
```

Ouvrez **http://localhost:3000** dans votre navigateur.

---

## 📁 Structure du projet

```
vaccine-app/
├── server/
│   ├── index.js          # API REST Express
│   └── package.json
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   └── Sidebar.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx      # Tableau de bord + graphiques
│       │   ├── Patients.jsx       # CRUD patients
│       │   ├── Vaccinations.jsx   # CRUD vaccinations
│       │   └── Rappels.jsx        # Alertes rappels
│       ├── utils/
│       │   └── api.js             # Client HTTP
│       ├── App.jsx
│       ├── index.js
│       └── index.css
└── README.md
```

---

## ✨ Fonctionnalités

### 📊 Tableau de bord
- Statistiques globales (patients, vaccinations, rappels, retards)
- Graphique en barres : vaccinations par mois
- Graphique circulaire : répartition par type de vaccin
- Liste des prochains rappels

### 👥 Gestion des patients
- Liste complète avec recherche en temps réel
- Ajout / modification / suppression de patients
- Informations : nom, prénom, date de naissance, sexe, groupe sanguin, contact

### 💉 Vaccinations
- Enregistrement de toutes les vaccinations
- Filtrage par patient et par statut
- Gestion des doses multiples et rappels
- Suivi : médecin, centre, numéro de lot
- Statuts : Complète / À venir / Annulée

### 🔔 Rappels
- Alertes automatiques (30 jours à l'avance)
- Tri par urgence : En retard / Urgents (≤7j) / À venir
- Numéros de téléphone pour contact rapide

---

## 🔌 API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/patients` | Liste des patients (+ `?search=`) |
| POST | `/api/patients` | Créer un patient |
| PUT | `/api/patients/:id` | Modifier un patient |
| DELETE | `/api/patients/:id` | Supprimer un patient |
| GET | `/api/vaccinations` | Liste (+ `?patientId=&statut=`) |
| POST | `/api/vaccinations` | Créer une vaccination |
| PUT | `/api/vaccinations/:id` | Modifier une vaccination |
| DELETE | `/api/vaccinations/:id` | Supprimer une vaccination |
| GET | `/api/rappels` | Rappels dans les 30 jours |
| GET | `/api/stats` | Statistiques globales |
| GET | `/api/vaccins-disponibles` | Liste des vaccins |

---

## 🗄️ Base de données

Cette version utilise une **base de données en mémoire** (données pré-chargées).  
Pour la production, intégrez une vraie base de données :

**Option recommandée — SQLite avec better-sqlite3 :**
```bash
npm install better-sqlite3
```

**Option cloud — MongoDB Atlas :**
```bash
npm install mongoose
```

---

## 🎨 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18, React Router v6 |
| Graphiques | Recharts |
| Backend | Node.js, Express 4 |
| Style | CSS custom (design system dark) |
| Polices | Syne (titres) + DM Sans (corps) |

---

## 📝 Données de démonstration

L'application inclut 3 patients et 4 vaccinations de démonstration pour tester toutes les fonctionnalités immédiatement.

---

*VacciTrack — Développé pour la gestion médicale des vaccinations en Algérie*

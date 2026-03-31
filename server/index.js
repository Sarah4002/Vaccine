const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ===== PERSISTANCE JSON =====
const DB_FILE = path.join(__dirname, 'db.json');

const DEFAULT_DB = {
  patients: [
    { 
      id: '1', nom: 'Benali', prenom: 'Ahmed', dateNaissance: '1985-03-15', sexe: 'M', 
      telephone: '0550123456', email: 'ahmed.benali@email.com', adresse: 'Oran, Algérie', 
      groupeSanguin: 'A+', poids: '75', fonction: 'DZD', service: 'SEMEP',
      createdAt: new Date().toISOString() 
    }
  ],
  vaccinations: [],
  ordonnances: [],
  stocks: [
    { id: '1', vaccin: 'Anti-Rabique', lot: 'LOT-RAB-2024-001', quantiteInitiale: 500, quantiteRestante: 320, datePeremption: '2025-06-30' },
    { id: '2', vaccin: 'Hépatite B', lot: 'LOT-HEP-2024-045', quantiteInitiale: 200, quantiteRestante: 15, datePeremption: '2024-08-15' },
    { id: '3', vaccin: 'DT', lot: 'LOT-DT-2024-FLU-12', quantiteInitiale: 1000, quantiteRestante: 100, datePeremption: '2024-12-01' }
  ],
  settings: [
    {
      id: 'default',
      langue: 'fr',
      theme: 'light',
      notificationsEmail: true,
      notificationsPush: true,
      affichageRappels: true,
      createdAt: new Date().toISOString()
    }
  ],
  helpArticles: [
    {
      id: '1',
      titre: 'Comment ajouter un nouveau patient?',
      categorie: 'Patients',
      contenu: 'Pour ajouter un nouveau patient, accédez à la page Patients, cliquez sur "Ajouter Patient" et remplissez le formulaire avec les informations personnelles.',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      titre: 'Enregistrer une vaccination',
      categorie: 'Vaccinations',
      contenu: 'Allez à la page Vaccinations, sélectionnez un patient, puis cliquez sur "Nouvelle Vaccination" pour enregistrer le vaccin administré.',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      titre: 'Gérer les stocks de vaccins',
      categorie: 'Pharmacie',
      contenu: 'La page Pharmacie affiche l\'inventaire des vaccins disponibles. Vous pouvez mettre à jour les quantités et consulter les dates d\'expiration.',
      createdAt: new Date().toISOString()
    }
  ],
  supportTickets: []
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.patients && parsed.vaccinations && parsed.stocks) {
        // Migration: ajouter les champs manquants
        if (!parsed.ordonnances) parsed.ordonnances = [];
        if (!parsed.settings) parsed.settings = [];
        if (!parsed.helpArticles) parsed.helpArticles = [];
        if (!parsed.supportTickets) parsed.supportTickets = [];
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture db.json:', err.message);
  }
  saveDB(DEFAULT_DB);
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Erreur sauvegarde db.json:', err.message);
  }
}

let db = loadDB();

// HELPER STATS
function getStats() {
  const now = new Date();
  const rappelsProchains = db.vaccinations.filter(v => {
    if (!v.dateProchaineDose) return false;
    const diff = (new Date(v.dateProchaineDose) - now) / (1000*60*60*24);
    return diff >= 0 && diff <= 30;
  });
  const enRetard = db.vaccinations.filter(v => {
    if (!v.dateProchaineDose) return false;
    return new Date(v.dateProchaineDose) < now && v.statut !== 'complete';
  });
  
  return { 
    totalPatients: db.patients.length, 
    totalVaccinations: db.vaccinations.length, 
    rappelsProchains: rappelsProchains.length, 
    vaccinationsEnRetard: enRetard.length,
    stocksCritiques: db.stocks.filter(s => (s.quantiteRestante/s.quantiteInitiale) <= 0.2).length
  };
}

// ROUTE PATIENTS
app.get('/api/patients', (req, res) => {
  const { search } = req.query;
  let result = db.patients;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(p => p.nom.toLowerCase().includes(s) || p.prenom.toLowerCase().includes(s));
  }
  res.json(result);
});

app.post('/api/patients', (req, res) => {
  const patient = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.patients.push(patient);
  saveDB(db);
  res.status(201).json(patient);
});

app.put('/api/patients/:id', (req, res) => {
  const idx = db.patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Patient non trouvé' });
  db.patients[idx] = { ...db.patients[idx], ...req.body };
  saveDB(db);
  res.json(db.patients[idx]);
});

app.delete('/api/patients/:id', (req, res) => {
  db.patients = db.patients.filter(p => p.id !== req.params.id);
  db.vaccinations = db.vaccinations.filter(v => v.patientId !== req.params.id);
  if (db.ordonnances) db.ordonnances = db.ordonnances.filter(o => o.patientId !== req.params.id);
  saveDB(db);
  res.json({ message: 'Patient supprimé' });
});

// ROUTE VACCINATIONS (Protocoles specialize)
app.get('/api/vaccinations', (req, res) => {
  const { patientId } = req.query;
  let result = db.vaccinations;
  if (patientId) result = result.filter(v => v.patientId === patientId);
  
  result = result.map(v => {
    const p = db.patients.find(p => p.id === v.patientId);
    return { ...v, patient: p ? `${p.prenom} ${p.nom}` : 'Inconnu' };
  });
  res.json(result);
});

app.post('/api/vaccinations', (req, res) => {
  const vaccination = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.vaccinations.push(vaccination);
  
  // DEDUCTION STOCK OPTIONNELLE
  const stock = db.stocks.find(s => s.vaccin === vaccination.vaccin && s.quantiteRestante > 0);
  if (stock) {
    stock.quantiteRestante -= 1;
  }

  saveDB(db);
  res.status(201).json(vaccination);
});

app.delete('/api/vaccinations/:id', (req, res) => {
  db.vaccinations = db.vaccinations.filter(v => v.id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Supprimé' });
});

// ROUTE STOCKS (Pharmacie)
app.get('/api/stocks', (req, res) => {
  res.json(db.stocks);
});

app.post('/api/stocks', (req, res) => {
  const stock = { id: uuidv4(), ...req.body };
  db.stocks.push(stock);
  saveDB(db);
  res.status(201).json(stock);
});

app.put('/api/stocks/:id', (req, res) => {
  const idx = db.stocks.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lot non trouvé' });
  db.stocks[idx] = { ...db.stocks[idx], ...req.body };
  saveDB(db);
  res.json(db.stocks[idx]);
});

app.delete('/api/stocks/:id', (req, res) => {
  db.stocks = db.stocks.filter(s => s.id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Lot supprimé' });
});

// RAPPELS
app.get('/api/rappels', (req, res) => {
  const now = new Date();
  const rappels = db.vaccinations
    .filter(v => v.dateProchaineDose)
    .map(v => {
      const patient = db.patients.find(p => p.id === v.patientId);
      const joursRestants = Math.ceil((new Date(v.dateProchaineDose) - now) / (1000*60*60*24));
      return { 
        ...v, 
        patient: patient ? `${patient.prenom} ${patient.nom}` : 'Inconnu', 
        telephone: patient?.telephone,
        joursRestants,
        urgent: joursRestants <= 7 && joursRestants >= 0,
        enRetard: joursRestants < 0
      };
    })
    .filter(v => v.joursRestants <= 30) // On voit à 30 jours
    .sort((a, b) => a.joursRestants - b.joursRestants);
  res.json(rappels);
});

app.get('/api/stats', (req, res) => res.json(getStats()));
app.get('/api/vaccins-disponibles', (req, res) => res.json(['Anti-Rabique', 'Hépatite B', 'DT']));

// ROUTE ORDONNANCES
app.get('/api/ordonnances', (req, res) => {
  const { patientId } = req.query;
  let result = db.ordonnances || [];
  if (patientId) result = result.filter(o => o.patientId === patientId);
  result = result.map(o => {
    const p = db.patients.find(p => p.id === o.patientId);
    return { ...o, patientNom: p ? `${p.prenom} ${p.nom}` : 'Inconnu' };
  });
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/ordonnances', (req, res) => {
  if (!db.ordonnances) db.ordonnances = [];
  const ordonnance = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.ordonnances.push(ordonnance);
  saveDB(db);
  res.status(201).json(ordonnance);
});

app.delete('/api/ordonnances/:id', (req, res) => {
  if (!db.ordonnances) db.ordonnances = [];
  db.ordonnances = db.ordonnances.filter(o => o.id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Ordonnance supprimée' });
});

// ===== SETTINGS (PARAMÈTRES) =====
app.get('/api/settings', (req, res) => {
  const settings = db.settings && db.settings.length > 0 ? db.settings[0] : {
    id: 'default',
    langue: 'fr',
    theme: 'light',
    notificationsEmail: true,
    notificationsPush: true,
    affichageRappels: true
  };
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  if (!db.settings) db.settings = [];
  if (db.settings.length === 0) {
    db.settings.push({ id: 'default', ...req.body, createdAt: new Date().toISOString() });
  } else {
    db.settings[0] = { ...db.settings[0], ...req.body };
  }
  saveDB(db);
  res.json(db.settings[0]);
});

// ===== HELP ARTICLES (CENTRE D'AIDE) =====
app.get('/api/help-articles', (req, res) => {
  const { search, categorie } = req.query;
  let result = db.helpArticles || [];
  
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(a => 
      a.titre.toLowerCase().includes(s) || 
      a.contenu.toLowerCase().includes(s)
    );
  }
  
  if (categorie) {
    result = result.filter(a => a.categorie === categorie);
  }
  
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/help-articles/:id', (req, res) => {
  const article = db.helpArticles && db.helpArticles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Article non trouvé' });
  res.json(article);
});

app.post('/api/help-articles', (req, res) => {
  if (!db.helpArticles) db.helpArticles = [];
  const article = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.helpArticles.push(article);
  saveDB(db);
  res.status(201).json(article);
});

app.put('/api/help-articles/:id', (req, res) => {
  if (!db.helpArticles) db.helpArticles = [];
  const idx = db.helpArticles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Article non trouvé' });
  db.helpArticles[idx] = { ...db.helpArticles[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDB(db);
  res.json(db.helpArticles[idx]);
});

app.delete('/api/help-articles/:id', (req, res) => {
  if (!db.helpArticles) db.helpArticles = [];
  db.helpArticles = db.helpArticles.filter(a => a.id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Article supprimé' });
});

// ===== SUPPORT TICKETS =====
app.get('/api/support-tickets', (req, res) => {
  const { statut } = req.query;
  let result = db.supportTickets || [];
  
  if (statut) {
    result = result.filter(t => t.statut === statut);
  }
  
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/support-tickets/:id', (req, res) => {
  const ticket = db.supportTickets && db.supportTickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé' });
  res.json(ticket);
});

app.post('/api/support-tickets', (req, res) => {
  if (!db.supportTickets) db.supportTickets = [];
  const ticket = { 
    id: uuidv4(), 
    ...req.body, 
    statut: 'ouvert',
    priorite: req.body.priorite || 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.supportTickets.push(ticket);
  saveDB(db);
  res.status(201).json(ticket);
});

app.put('/api/support-tickets/:id', (req, res) => {
  if (!db.supportTickets) db.supportTickets = [];
  const idx = db.supportTickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket non trouvé' });
  db.supportTickets[idx] = { 
    ...db.supportTickets[idx], 
    ...req.body, 
    updatedAt: new Date().toISOString() 
  };
  saveDB(db);
  res.json(db.supportTickets[idx]);
});

app.delete('/api/support-tickets/:id', (req, res) => {
  if (!db.supportTickets) db.supportTickets = [];
  db.supportTickets = db.supportTickets.filter(t => t.id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Ticket supprimé' });
});

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (password === 'admin') {
    res.json({ token: 'fake-jwt', user: { email, nom: 'Admin' } });
  } else {
    res.status(401).json({ error: 'Invalide' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[VacciTrack Backend] Server running on http://localhost:${PORT}`);
});

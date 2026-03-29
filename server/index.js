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
    { id: '1', nom: 'Benali', prenom: 'Ahmed', dateNaissance: '1985-03-15', sexe: 'M', telephone: '0550123456', email: 'ahmed.benali@email.com', adresse: 'Oran, Algérie', groupeSanguin: 'A+', createdAt: new Date().toISOString() },
    { id: '2', nom: 'Kaddour', prenom: 'Fatima', dateNaissance: '1992-07-22', sexe: 'F', telephone: '0661234567', email: 'fatima.kaddour@email.com', adresse: 'Alger, Algérie', groupeSanguin: 'O+', createdAt: new Date().toISOString() },
    { id: '3', nom: 'Meziane', prenom: 'Youcef', dateNaissance: '2010-11-08', sexe: 'M', telephone: '0770987654', email: 'parent.meziane@email.com', adresse: 'Constantine, Algérie', groupeSanguin: 'B+', createdAt: new Date().toISOString() }
  ],
  vaccinations: [
    { id: 'v1', patientId: '1', vaccin: 'COVID-19 (Pfizer)', dose: '1ère dose', dateAdministration: '2024-01-15', dateProchaineDose: '2024-02-15', medecin: 'Dr. Hadj Ali', centre: 'Clinique El Baraka', lotNumero: 'LOT-2024-001', statut: 'complete', notes: 'Pas de réaction indésirable', createdAt: new Date().toISOString() },
    { id: 'v2', patientId: '1', vaccin: 'COVID-19 (Pfizer)', dose: '2ème dose', dateAdministration: '2024-02-18', dateProchaineDose: null, medecin: 'Dr. Hadj Ali', centre: 'Clinique El Baraka', lotNumero: 'LOT-2024-008', statut: 'complete', notes: 'Légère fièvre 24h après', createdAt: new Date().toISOString() },
    { id: 'v3', patientId: '2', vaccin: 'Grippe (Influvac)', dose: 'Annuelle', dateAdministration: '2024-10-05', dateProchaineDose: '2025-10-05', medecin: 'Dr. Boumediene', centre: 'CHU Oran', lotNumero: 'LOT-2024-FLU-12', statut: 'complete', notes: '', createdAt: new Date().toISOString() },
    { id: 'v4', patientId: '3', vaccin: 'ROR (Rougeole-Oreillons-Rubéole)', dose: '1ère dose', dateAdministration: '2024-12-01', dateProchaineDose: '2025-06-01', medecin: 'Dr. Cherif', centre: 'Polyclinique Ain El Turck', lotNumero: 'LOT-2024-ROR-05', statut: 'a_venir', notes: 'Rappel prévu dans 6 mois', createdAt: new Date().toISOString() }
  ]
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.patients && parsed.vaccinations) return parsed;
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
console.log(`📂 Base chargée: ${db.patients.length} patients, ${db.vaccinations.length} vaccinations`);

const VACCINS_DISPONIBLES = [
  'COVID-19 (Pfizer)', 'COVID-19 (AstraZeneca)', 'COVID-19 (Sinovac)',
  'Grippe (Influvac)', 'Grippe (Vaxigrip)',
  'ROR (Rougeole-Oreillons-Rubéole)', 'BCG (Tuberculose)',
  'Hépatite A', 'Hépatite B', 'Tétanos-Diphtérie',
  'Polio (OPV)', 'Polio (IPV)', 'Méningite', 'Pneumocoque',
  'HPV', 'Varicelle', 'Rage', 'Fièvre jaune', 'Typhoïde'
];

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
  const counts = {};
  db.vaccinations.forEach(v => { const m = v.dateAdministration.slice(0,7); counts[m]=(counts[m]||0)+1; });
  const vaccinationsParMois = Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)).map(([mois,count])=>({mois,count}));
  const vcounts = {};
  db.vaccinations.forEach(v => { const n=v.vaccin.split(' ')[0]; vcounts[n]=(vcounts[n]||0)+1; });
  const vaccinationsParVaccin = Object.entries(vcounts).map(([vaccin,count])=>({vaccin,count}));
  return { totalPatients: db.patients.length, totalVaccinations: db.vaccinations.length, rappelsProchains: rappelsProchains.length, vaccinationsEnRetard: enRetard.length, vaccinationsParMois, vaccinationsParVaccin };
}

// PATIENTS
app.get('/api/patients', (req, res) => {
  const { search } = req.query;
  let result = db.patients;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(p => p.nom.toLowerCase().includes(s) || p.prenom.toLowerCase().includes(s) || (p.email||'').toLowerCase().includes(s));
  }
  res.json(result);
});

app.get('/api/patients/:id', (req, res) => {
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient non trouvé' });
  res.json({ ...patient, vaccinations: db.vaccinations.filter(v => v.patientId === req.params.id) });
});

app.post('/api/patients', (req, res) => {
  const patient = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.patients.push(patient);
  saveDB(db);
  console.log(`✅ Patient ajouté: ${patient.prenom} ${patient.nom} [${patient.id}]`);
  res.status(201).json(patient);
});

app.put('/api/patients/:id', (req, res) => {
  const idx = db.patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Patient non trouvé' });
  db.patients[idx] = { ...db.patients[idx], ...req.body };
  saveDB(db);
  console.log(`✏️  Patient modifié: ${db.patients[idx].prenom} ${db.patients[idx].nom}`);
  res.json(db.patients[idx]);
});

app.delete('/api/patients/:id', (req, res) => {
  const p = db.patients.find(p => p.id === req.params.id);
  db.patients = db.patients.filter(p => p.id !== req.params.id);
  db.vaccinations = db.vaccinations.filter(v => v.patientId !== req.params.id);
  saveDB(db);
  console.log(`🗑️  Patient supprimé: ${p?.prenom} ${p?.nom}`);
  res.json({ message: 'Patient supprimé' });
});

// VACCINATIONS
app.get('/api/vaccinations', (req, res) => {
  const { patientId, statut } = req.query;
  let result = db.vaccinations;
  if (patientId) result = result.filter(v => v.patientId === patientId);
  if (statut) result = result.filter(v => v.statut === statut);
  result = result.map(v => {
    const p = db.patients.find(p => p.id === v.patientId);
    return { ...v, patient: p ? `${p.prenom} ${p.nom}` : 'Inconnu' };
  });
  res.json(result);
});

app.post('/api/vaccinations', (req, res) => {
  const vaccination = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.vaccinations.push(vaccination);
  saveDB(db);
  console.log(`✅ Vaccination ajoutée: ${vaccination.vaccin}`);
  res.status(201).json(vaccination);
});

app.put('/api/vaccinations/:id', (req, res) => {
  const idx = db.vaccinations.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vaccination non trouvée' });
  db.vaccinations[idx] = { ...db.vaccinations[idx], ...req.body };
  saveDB(db);
  res.json(db.vaccinations[idx]);
});

app.delete('/api/vaccinations/:id', (req, res) => {
  const v = db.vaccinations.find(v => v.id === req.params.id);
  db.vaccinations = db.vaccinations.filter(v => v.id !== req.params.id);
  saveDB(db);
  console.log(`🗑️  Vaccination supprimée: ${v?.vaccin}`);
  res.json({ message: 'Vaccination supprimée' });
});

// RAPPELS
app.get('/api/rappels', (req, res) => {
  const now = new Date();
  const rappels = db.vaccinations
    .filter(v => v.dateProchaineDose)
    .map(v => {
      const patient = db.patients.find(p => p.id === v.patientId);
      const joursRestants = Math.ceil((new Date(v.dateProchaineDose) - now) / (1000*60*60*24));
      return { ...v, patient: patient ? `${patient.prenom} ${patient.nom}` : 'Inconnu', telephone: patient?.telephone, joursRestants, urgent: joursRestants <= 7 && joursRestants >= 0, enRetard: joursRestants < 0 };
    })
    .filter(v => v.joursRestants <= 30)
    .sort((a, b) => a.joursRestants - b.joursRestants);
  res.json(rappels);
});

app.get('/api/stats', (req, res) => res.json(getStats()));
app.get('/api/vaccins-disponibles', (req, res) => res.json(VACCINS_DISPONIBLES));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🏥 VacciTrack démarré sur http://localhost:${PORT}`);
  console.log(`💾 Base de données: ${DB_FILE}`);
});

// database.js — SQLite avec better-sqlite3 (synchrone, natif)
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'vaccitrack.db');
const JSON_PATH = path.join(__dirname, 'db.json');

let db;

function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── Patients ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id              TEXT PRIMARY KEY,
      nom             TEXT NOT NULL,
      prenom          TEXT NOT NULL,
      dateNaissance   TEXT,
      sexe            TEXT DEFAULT 'M',
      telephone       TEXT,
      email           TEXT,
      adresse         TEXT,
      wilaya          TEXT,
      daira           TEXT,
      commune         TEXT,
      adressePrecise  TEXT,
      groupeSanguin   TEXT DEFAULT 'A+',
      poids           TEXT,
      fonction        TEXT,
      service         TEXT,
      profession      TEXT,
      instruction     TEXT,
      createdAt       TEXT NOT NULL
    )
  `);

  // ── Ajouter colonnes médicales si inexistantes ─────────────────────────────
  const medicalColumns = [
    'antecedents',
    'allergies',
    'maladiesChroniques',
    'traitementEnCours',
    'contreIndications',
    'fumeur',
    'alcool',
    'activitePhysique',
    'mutuelle',
    'numeroCNAS',
    'medecinTraitant',
    'notesClinicien',
  ];

  medicalColumns.forEach(col => {
    try {
      db.prepare(`ALTER TABLE patients ADD COLUMN ${col} TEXT`).run();
      console.log(`✅ Colonne ajoutée: ${col}`);
    } catch (err) {
      // Colonne existe déjà — normal
    }
  });

  // ── Vaccinations ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaccinations (
      id                 TEXT PRIMARY KEY,
      patientId          TEXT NOT NULL,
      type               TEXT,
      vaccin             TEXT,
      dose               TEXT,
      statut             TEXT DEFAULT 'complete',
      dateAdministration TEXT,
      dateProchaineDose  TEXT,
      protocoleData      TEXT,
      createdAt          TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // ── Ordonnances ───────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordonnances (
      id           TEXT PRIMARY KEY,
      patientId    TEXT NOT NULL,
      date         TEXT,
      medecin      TEXT,
      diagnostic   TEXT,
      observations TEXT,
      medicaments  TEXT,
      createdAt    TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // ── Stocks ────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      id               TEXT PRIMARY KEY,
      vaccin           TEXT NOT NULL,
      lot              TEXT,
      quantiteInitiale INTEGER DEFAULT 0,
      quantiteRestante INTEGER DEFAULT 0,
      datePeremption   TEXT
    )
  `);

  // ── Stock Movements ─────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id               TEXT PRIMARY KEY,
      stockId          TEXT NOT NULL,
      type             TEXT NOT NULL, -- 'ENTREE', 'SORTIE', 'AJUSTEMENT'
      quantite         INTEGER NOT NULL,
      patientId        TEXT,
      motif            TEXT,
      createdAt        TEXT NOT NULL,
      FOREIGN KEY (stockId) REFERENCES stocks(id) ON DELETE CASCADE,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE SET NULL
    )
  `);

  // ── Support Tickets ───────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id          TEXT PRIMARY KEY,
      titre       TEXT NOT NULL,
      description TEXT NOT NULL,
      categorie   TEXT DEFAULT 'Question',
      priorite    TEXT DEFAULT 'normal',
      statut      TEXT DEFAULT 'ouvert',
      createdAt   TEXT NOT NULL,
      updatedAt   TEXT NOT NULL
    )
  `);

  // ── Help Articles ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS help_articles (
      id        TEXT PRIMARY KEY,
      titre     TEXT NOT NULL,
      description TEXT,
      contenu   TEXT NOT NULL,
      categorie TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // ── Seed Help Articles if empty ───────────────────────────────────────────
  const helpCount = db.prepare('SELECT COUNT(*) as n FROM help_articles').get().n;
  if (helpCount === 0) {
    const now = new Date().toISOString();
    const helpStmt = db.prepare('INSERT INTO help_articles (id, titre, contenu, categorie, createdAt) VALUES (?,?,?,?,?)');
    helpStmt.run('h1', 'Guide de Vaccination Anti-Rabique', '<p>Le protocole dépend du <b>grade</b> de la morsure :</p><ul><li><b>Grade I</b>: Léchage sur peau intacte.</li><li><b>Grade II</b>: Morsure mineure.</li><li><b>Grade III</b>: Morsure transdermique.</li></ul>', 'Vaccinations', now);
    helpStmt.run('h2', 'Gestion des Stocks FEFO', '<p>Utilisez toujours les vaccins avec la date de péremption la plus proche en premier (<b>First Expired First Out</b>).</p>', 'Pharmacie', now);
    helpStmt.run('h3', 'Utilisation de la Carte SIG', '<p>La carte SIG permet de visualiser la répartition des patients. Utilisez les filtres pour affiner l\'analyse par commune.</p>', 'Carte', now);
    console.log('🌱 Articles d\'aide insérés');
  }

  // ── Migration depuis db.json ou seed ──────────────────────────────────────
  const count = db.prepare('SELECT COUNT(*) as n FROM patients').get().n;
  if (count === 0 && fs.existsSync(JSON_PATH)) {
    migrateFromJSON();
  } else if (count === 0) {
    seedDefaultData();
  }

  console.log(`✅ SQLite initialisé: ${DB_PATH}`);
  return db;
}

// ── Migration depuis JSON ─────────────────────────────────────────────────
function migrateFromJSON() {
  console.log('📦 Migration db.json → SQLite...');
  try {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    const patientStmt = db.prepare(`
      INSERT OR IGNORE INTO patients
      (id,nom,prenom,dateNaissance,sexe,telephone,email,adresse,wilaya,daira,commune,
       adressePrecise,groupeSanguin,poids,fonction,service,profession,instruction,
       antecedents,allergies,maladiesChroniques,traitementEnCours,contreIndications,
       fumeur,alcool,activitePhysique,mutuelle,numeroCNAS,medecinTraitant,notesClinicien,
       createdAt)
      VALUES
      (@id,@nom,@prenom,@dateNaissance,@sexe,@telephone,@email,@adresse,@wilaya,@daira,@commune,
       @adressePrecise,@groupeSanguin,@poids,@fonction,@service,@profession,@instruction,
       @antecedents,@allergies,@maladiesChroniques,@traitementEnCours,@contreIndications,
       @fumeur,@alcool,@activitePhysique,@mutuelle,@numeroCNAS,@medecinTraitant,@notesClinicien,
       @createdAt)
    `);

    const transaction = db.transaction(() => {
      (raw.patients || []).forEach(p => {
        patientStmt.run({
          id: p.id, nom: p.nom, prenom: p.prenom,
          dateNaissance: p.dateNaissance || null, sexe: p.sexe || 'M',
          telephone: p.telephone || null, email: p.email || null,
          adresse: p.adresse || null, wilaya: p.wilaya || null,
          daira: p.daira || null, commune: p.commune || null,
          adressePrecise: p.adressePrecise || null,
          groupeSanguin: p.groupeSanguin || 'A+', poids: String(p.poids || ''),
          fonction: p.fonction || null, service: p.service || null,
          profession: p.profession || null, instruction: p.instruction || null,
          antecedents: p.antecedents || null,
          allergies: p.allergies || null,
          maladiesChroniques: p.maladiesChroniques || null,
          traitementEnCours: p.traitementEnCours || null,
          contreIndications: p.contreIndications || null,
          fumeur: p.fumeur || null,
          alcool: p.alcool || null,
          activitePhysique: p.activitePhysique || null,
          mutuelle: p.mutuelle || null,
          numeroCNAS: p.numeroCNAS || null,
          medecinTraitant: p.medecinTraitant || null,
          notesClinicien: p.notesClinicien || null,
          createdAt: p.createdAt || new Date().toISOString(),
        });
      });
    });

    transaction();
    console.log(`✅ Migration terminée: ${raw.patients?.length || 0} patients importés`);
  } catch (err) {
    console.error('❌ Erreur migration:', err.message);
    seedDefaultData();
  }
}

// ── Seed par défaut ─────────────────────────────────────────────────────────
function seedDefaultData() {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO patients
      (id,nom,prenom,dateNaissance,sexe,telephone,email,adresse,groupeSanguin,poids,fonction,service,createdAt)
    VALUES ('1','Benali','Ahmed','1985-03-15','M','0550123456','ahmed.benali@email.com',
            'Oran, Algérie','A+','75','Médecin','SEMEP',?)
  `).run(now);
  console.log('🌱 Données initiales insérées');

  // Help Articles Seed
  const helpCount = db.prepare('SELECT COUNT(*) as n FROM help_articles').get().n;
  if (helpCount === 0) {
    const helpStmt = db.prepare('INSERT INTO help_articles (id, titre, contenu, categorie, createdAt) VALUES (?,?,?,?,?)');
    helpStmt.run('h1', 'Guide de Vaccination Anti-Rabique', 'Le protocole dépend du grade de la morsure (I, II ou III). Consultez la carte SIG pour voir les zones à risque.', 'Vaccinations', now);
    helpStmt.run('h2', 'Gestion des Stocks FEFO', 'Utilisez toujours les vaccins avec la date de péremption la plus proche en premier (First Expired First Out).', 'Pharmacie', now);
    helpStmt.run('h3', 'Utilisation de la Carte SIG', 'La carte SIG Tlemcen permet de visualiser la densité de patients par commune. Cliquez sur une commune pour voir les détails.', 'Carte', now);
  }
}

// ── Récupérer DB ──────────────────────────────────────────────────────────
function getDB() {
  if (!db) initDB();
  return db;
}

module.exports = { initDB, getDB };
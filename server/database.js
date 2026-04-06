// database.js — SQLite avec better-sqlite3 (synchrone, natif)
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.VACCITRACK_DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'vaccitrack.db');
const JSON_PATH = path.join(DATA_DIR, 'db.json');
const FALLBACK_JSON_PATH = path.join(__dirname, 'db.json');

let db;

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);

  db.pragma('journal_mode = MEMORY');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -16000');

  // ── Patients ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id              TEXT PRIMARY KEY,
      nom             TEXT NOT NULL,
      prenom          TEXT NOT NULL,
      dateNaissance   TEXT,
      age             INTEGER,
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
    'age',
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
      db.prepare(`ALTER TABLE patients ADD COLUMN ${col} ${col === 'age' ? 'INTEGER' : 'TEXT'}`).run();
      console.log(`✅ Colonne ajoutée: ${col}`);
    } catch (err) {
      // Colonne existe déjà — normal
    }
  });

  try {
    db.prepare('ALTER TABLE support_tickets ADD COLUMN updatedAt TEXT').run();
  } catch (err) {
    // Colonne existe deja ou table absente avant creation
  }

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

  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id        TEXT PRIMARY KEY,
      stockId   TEXT NOT NULL,
      type      TEXT NOT NULL,
      quantite  INTEGER DEFAULT 0,
      patientId TEXT,
      motif     TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (stockId) REFERENCES stocks(id) ON DELETE CASCADE,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id                 TEXT PRIMARY KEY,
      langue             TEXT DEFAULT 'fr',
      theme              TEXT DEFAULT 'light',
      notificationsEmail INTEGER DEFAULT 1,
      notificationsPush  INTEGER DEFAULT 1,
      affichageRappels   INTEGER DEFAULT 1,
      updatedAt          TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id           TEXT PRIMARY KEY,
      titre        TEXT NOT NULL,
      description  TEXT NOT NULL,
      categorie    TEXT,
      priorite     TEXT DEFAULT 'normal',
      statut       TEXT DEFAULT 'ouvert',
      createdAt    TEXT NOT NULL
    )
  `);

  try {
    db.prepare('ALTER TABLE support_tickets ADD COLUMN updatedAt TEXT').run();
  } catch (err) {
    // Colonne existe deja
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS help_articles (
      id           TEXT PRIMARY KEY,
      titre        TEXT NOT NULL,
      categorie    TEXT NOT NULL,
      contenu      TEXT NOT NULL,
      createdAt    TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS help_feedback (
      id           TEXT PRIMARY KEY,
      articleId    TEXT NOT NULL,
      feedbackType TEXT NOT NULL,
      createdAt    TEXT NOT NULL,
      FOREIGN KEY (articleId) REFERENCES help_articles(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_patients_createdAt ON patients(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_patients_nom_prenom_sexe ON patients(nom, prenom, sexe);
    CREATE INDEX IF NOT EXISTS idx_patients_wilaya ON patients(wilaya);
    CREATE INDEX IF NOT EXISTS idx_patients_lower_nom ON patients(lower(nom));
    CREATE INDEX IF NOT EXISTS idx_patients_lower_prenom ON patients(lower(prenom));
    CREATE INDEX IF NOT EXISTS idx_patients_lower_email ON patients(lower(email));

    CREATE INDEX IF NOT EXISTS idx_vaccinations_patientId_date ON vaccinations(patientId, dateAdministration DESC);
    CREATE INDEX IF NOT EXISTS idx_vaccinations_type_date ON vaccinations(type, dateAdministration DESC);
    CREATE INDEX IF NOT EXISTS idx_vaccinations_dateProchaineDose ON vaccinations(dateProchaineDose);
    CREATE INDEX IF NOT EXISTS idx_vaccinations_createdAt ON vaccinations(createdAt DESC);

    CREATE INDEX IF NOT EXISTS idx_ordonnances_patientId_createdAt ON ordonnances(patientId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_stocks_vaccin ON stocks(vaccin);
    CREATE INDEX IF NOT EXISTS idx_stocks_datePeremption ON stocks(datePeremption);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_stockId_createdAt ON stock_movements(stockId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_createdAt ON support_tickets(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_help_articles_categorie ON help_articles(categorie);
    CREATE INDEX IF NOT EXISTS idx_help_feedback_articleId ON help_feedback(articleId);
  `);

  // ── Migration depuis db.json ou seed ──────────────────────────────────────
  const count = db.prepare('SELECT COUNT(*) as n FROM patients').get().n;
  if (count === 0 && (fs.existsSync(JSON_PATH) || fs.existsSync(FALLBACK_JSON_PATH))) {
    migrateFromJSON();
  } else if (count === 0) {
    
  }

  seedSystemTables();

  console.log(`✅ SQLite initialisé: ${DB_PATH}`);
  return db;
}

// ── Migration depuis JSON ─────────────────────────────────────────────────
function migrateFromJSON() {
  console.log('📦 Migration db.json → SQLite...');
  try {
    const sourceJsonPath = fs.existsSync(JSON_PATH) ? JSON_PATH : FALLBACK_JSON_PATH;
    const raw = JSON.parse(fs.readFileSync(sourceJsonPath, 'utf8'));

    const patientStmt = db.prepare(`
      INSERT OR IGNORE INTO patients
      (id,nom,prenom,dateNaissance,age,sexe,telephone,email,adresse,wilaya,daira,commune,
       adressePrecise,groupeSanguin,poids,fonction,service,profession,instruction,
       antecedents,allergies,maladiesChroniques,traitementEnCours,contreIndications,
       fumeur,alcool,activitePhysique,mutuelle,numeroCNAS,medecinTraitant,notesClinicien,
       createdAt)
      VALUES
      (@id,@nom,@prenom,@dateNaissance,@age,@sexe,@telephone,@email,@adresse,@wilaya,@daira,@commune,
       @adressePrecise,@groupeSanguin,@poids,@fonction,@service,@profession,@instruction,
       @antecedents,@allergies,@maladiesChroniques,@traitementEnCours,@contreIndications,
       @fumeur,@alcool,@activitePhysique,@mutuelle,@numeroCNAS,@medecinTraitant,@notesClinicien,
       @createdAt)
    `);

    const transaction = db.transaction(() => {
      (raw.patients || []).forEach(p => {
        patientStmt.run({
          id: p.id, nom: p.nom, prenom: p.prenom,
          dateNaissance: p.dateNaissance || null, age: p.age ?? null, sexe: p.sexe || 'M',
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
    
  }
}

function seedSystemTables() {
  const now = new Date().toISOString();

  const settingsCount = db.prepare('SELECT COUNT(*) as n FROM app_settings').get().n;
  if (settingsCount === 0) {
    db.prepare(`
      INSERT INTO app_settings (id, langue, theme, notificationsEmail, notificationsPush, affichageRappels, updatedAt)
      VALUES ('default', 'fr', 'light', 1, 1, 1, ?)
    `).run(now);
  }

  const articleCount = db.prepare('SELECT COUNT(*) as n FROM help_articles').get().n;
  if (articleCount > 0) return;

  const insertArticle = db.prepare(`
    INSERT INTO help_articles (id, titre, categorie, contenu, createdAt)
    VALUES (@id, @titre, @categorie, @contenu, @createdAt)
  `);

  const articles = [
    {
      id: 'anti-rabique',
      titre: 'Protocole Anti-Rabique',
      categorie: 'Vaccinations',
      contenu: '<p>Le module anti-rabique permet de renseigner le grade, le protocole VAR, les dates automatiques et les rappels.</p><p>Commencez par selectionner le patient, puis choisissez le type de vaccin et le protocole approprie.</p>',
    },
    {
      id: 'gestion-stocks',
      titre: 'Gestion des Stocks et FEFO',
      categorie: 'Pharmacie',
      contenu: '<p>La page pharmacie suit les lots, les dates de peremption et les quantites restantes.</p><p>Utilisez les lots les plus proches de la peremption en priorite pour appliquer la logique FEFO.</p>',
    },
    {
      id: 'carte-tlemcen',
      titre: 'Lecture de la Carte SIG Tlemcen',
      categorie: 'Carte',
      contenu: '<p>La carte affiche les patients regroupes par commune avec une densite proportionnelle au nombre de dossiers.</p><p>Vous pouvez rechercher une commune et consulter la liste des patients associes.</p>',
    },
    {
      id: 'patients',
      titre: 'Gestion des Dossiers Patients',
      categorie: 'Patients',
      contenu: '<p>Chaque dossier patient centralise les donnees administratives, medicales et vaccinales.</p><p>Depuis le detail, vous pouvez creer un registre vaccinal ou une ordonnance.</p>',
    },
    {
      id: 'rappels',
      titre: 'Rappels de Vaccination',
      categorie: 'Rappels',
      contenu: '<p>Les rappels sont calcules a partir de la prochaine date de dose enregistree dans chaque protocole.</p><p>Les dossiers en retard ou proches de l echeance apparaissent en priorite.</p>',
    },
  ];

  const seed = db.transaction(() => {
    articles.forEach((article) => insertArticle.run({ ...article, createdAt: now }));
  });
  seed();
}



// ── Récupérer DB ──────────────────────────────────────────────────────────
function getDB() {
  if (!db) initDB();
  return db;
}

module.exports = { initDB, getDB };

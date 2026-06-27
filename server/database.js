// database.js - MySQL backend with a synchronous wrapper for the existing code.
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const DATA_DIR = process.env.VACCITRACK_DATA_DIR || __dirname;
const JSON_PATH = path.join(DATA_DIR, 'db.json');
const FALLBACK_JSON_PATH = path.join(__dirname, 'db.json');

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vaccitrack',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  multipleStatements: true,
  dateStrings: true,
  charset: 'utf8mb4',
};

const RESPONSE_BYTES = Number(process.env.MYSQL_SYNC_BUFFER_SIZE || 16 * 1024 * 1024);

function translateSql(sql) {
  if (!sql) return sql;

  let out = String(sql);

  out = out.replace(/substr\s*\(/gi, 'SUBSTRING(');
  out = out.replace(/strftime\('\%Y'\s*,\s*'now'\s*\)/gi, 'YEAR(CURDATE())');
  out = out.replace(/strftime\('\%Y'\s*,\s*([^)]+?)\)/gi, 'YEAR($1)');
  out = out.replace(/json_extract\(\s*([^,]+?)\s*,\s*'([^']+)'\s*\)/gi,
    "JSON_UNQUOTE(JSON_EXTRACT($1, '$2'))");
  out = out.replace(/\(\s*([^()]+?)\s*\|\|\s*' '\s*\|\|\s*([^()]+?)\s*\)/g,
    'CONCAT($1, \' \', $2)');
  out = out.replace(/\bINSERT\s+OR\s+IGNORE\b/gi, 'INSERT IGNORE');
  out = out.replace(/ON\s+CONFLICT\s*\(\s*id\s*\)\s+DO\s+UPDATE\s+SET\s+[\s\S]*$/i,
    'ON DUPLICATE KEY UPDATE langue = VALUES(langue), theme = VALUES(theme), notificationsEmail = VALUES(notificationsEmail), notificationsPush = VALUES(notificationsPush), affichageRappels = VALUES(affichageRappels), updatedAt = VALUES(updatedAt)');

  return out;
}

function normalizeArgs(args, namedParams) {
  if (!args || args.length === 0) return [];
  if (args.length === 1) {
    const [first] = args;
    if (Array.isArray(first)) return first;
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      if (namedParams && namedParams.length) {
        return namedParams.map((name) => first[name]);
      }
      return first;
    }
    return [first];
  }
  return args;
}

function compileStatement(sql) {
  const translated = translateSql(sql);
  const namedParams = [];
  const finalSql = translated.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
    namedParams.push(name);
    return '?';
  });
  return { sql: finalSql, namedParams };
}

function createSyncBufferClient(worker) {
  const signal = new Int32Array(new SharedArrayBuffer(8));
  const data = new Uint8Array(new SharedArrayBuffer(RESPONSE_BYTES));
  const decoder = new TextDecoder();

  function call(action, payload = {}) {
    Atomics.store(signal, 0, 0);
    Atomics.store(signal, 1, 0);
    worker.postMessage({ action, payload, signalBuffer: signal.buffer, dataBuffer: data.buffer });
    Atomics.wait(signal, 0, 0);

    const status = Atomics.load(signal, 0);
    const length = Atomics.load(signal, 1);
    const text = length > 0 ? decoder.decode(data.subarray(0, length)) : '';
    const parsed = text ? JSON.parse(text) : null;

    if (status !== 1) {
      throw new Error(parsed?.error || text || 'MySQL request failed');
    }

    return parsed;
  }

  return call;
}

function buildSchema() {
  return `
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      prenom VARCHAR(255) NOT NULL,
      dateNaissance VARCHAR(32),
      age INT NULL,
      sexe VARCHAR(8) DEFAULT 'M',
      telephone VARCHAR(64),
      email VARCHAR(255),
      adresse TEXT,
      wilaya VARCHAR(128),
      daira VARCHAR(128),
      commune VARCHAR(128),
      adressePrecise TEXT,
      groupeSanguin VARCHAR(8) DEFAULT 'A+',
      poids VARCHAR(32),
      fonction VARCHAR(255),
      service VARCHAR(255),
      profession VARCHAR(255),
      instruction VARCHAR(255),
      antecedents TEXT,
      allergies TEXT,
      maladiesChroniques TEXT,
      traitementEnCours TEXT,
      contreIndications TEXT,
      fumeur TEXT,
      alcool TEXT,
      activitePhysique TEXT,
      mutuelle TEXT,
      numeroCNAS VARCHAR(64),
      medecinTraitant VARCHAR(255),
      notesClinicien TEXT,
      createdAt VARCHAR(32) NOT NULL,
      INDEX idx_patients_createdAt (createdAt),
      INDEX idx_patients_nom_prenom_sexe (nom, prenom, sexe),
      INDEX idx_patients_wilaya (wilaya),
      INDEX idx_patients_nom (nom),
      INDEX idx_patients_prenom (prenom),
      INDEX idx_patients_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS vaccinations (
      id VARCHAR(64) PRIMARY KEY,
      patientId VARCHAR(64) NOT NULL,
      type VARCHAR(64),
      vaccin VARCHAR(255),
      dose VARCHAR(64),
      statut VARCHAR(32) DEFAULT 'complete',
      dateAdministration VARCHAR(32),
      dateProchaineDose VARCHAR(32),
      protocoleData TEXT,
      createdAt VARCHAR(32) NOT NULL,
      INDEX idx_vaccinations_patientId_date (patientId, dateAdministration),
      INDEX idx_vaccinations_type_date (type, dateAdministration),
      INDEX idx_vaccinations_dateProchaineDose (dateProchaineDose),
      INDEX idx_vaccinations_createdAt (createdAt),
      CONSTRAINT fk_vaccinations_patient
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS ordonnances (
      id VARCHAR(64) PRIMARY KEY,
      patientId VARCHAR(64) NOT NULL,
      date VARCHAR(32),
      medecin VARCHAR(255),
      diagnostic TEXT,
      observations TEXT,
      medicaments TEXT,
      createdAt VARCHAR(32) NOT NULL,
      INDEX idx_ordonnances_patientId_createdAt (patientId, createdAt),
      CONSTRAINT fk_ordonnances_patient
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS stocks (
      id VARCHAR(64) PRIMARY KEY,
      vaccin VARCHAR(255) NOT NULL,
      lot VARCHAR(255),
      quantiteInitiale INT DEFAULT 0,
      quantiteRestante INT DEFAULT 0,
      datePeremption VARCHAR(32),
      INDEX idx_stocks_vaccin (vaccin),
      INDEX idx_stocks_datePeremption (datePeremption)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(64) PRIMARY KEY,
      stockId VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL,
      quantite INT DEFAULT 0,
      patientId VARCHAR(64) NULL,
      motif TEXT,
      createdAt VARCHAR(32) NOT NULL,
      INDEX idx_stock_movements_stockId_createdAt (stockId, createdAt),
      CONSTRAINT fk_stock_movements_stock
        FOREIGN KEY (stockId) REFERENCES stocks(id) ON DELETE CASCADE,
      CONSTRAINT fk_stock_movements_patient
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS app_settings (
      id VARCHAR(64) PRIMARY KEY,
      langue VARCHAR(32) DEFAULT 'fr',
      theme VARCHAR(32) DEFAULT 'light',
      notificationsEmail TINYINT(1) DEFAULT 1,
      notificationsPush TINYINT(1) DEFAULT 1,
      affichageRappels TINYINT(1) DEFAULT 1,
      updatedAt VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(64) PRIMARY KEY,
      titre VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      categorie VARCHAR(255),
      priorite VARCHAR(32) DEFAULT 'normal',
      statut VARCHAR(32) DEFAULT 'ouvert',
      createdAt VARCHAR(32) NOT NULL,
      updatedAt VARCHAR(32),
      INDEX idx_support_tickets_createdAt (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS help_articles (
      id VARCHAR(64) PRIMARY KEY,
      titre VARCHAR(255) NOT NULL,
      categorie VARCHAR(255) NOT NULL,
      contenu TEXT NOT NULL,
      createdAt VARCHAR(32) NOT NULL,
      INDEX idx_help_articles_categorie (categorie)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS help_feedback (
      id VARCHAR(64) PRIMARY KEY,
      articleId VARCHAR(64) NOT NULL,
      feedbackType VARCHAR(64) NOT NULL,
      createdAt VARCHAR(32) NOT NULL,
      INDEX idx_help_feedback_articleId (articleId),
      CONSTRAINT fk_help_feedback_article
        FOREIGN KEY (articleId) REFERENCES help_articles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
}

function workerMain() {
  const mysql = require('mysql2/promise');
  const encoder = new TextEncoder();
  const config = workerData?.config || MYSQL_CONFIG;

  function writeResponse(signalBuffer, dataBuffer, status, payload) {
    const signal = new Int32Array(signalBuffer);
    const data = new Uint8Array(dataBuffer);
    const body = encoder.encode(JSON.stringify(payload ?? null));
    if (body.length > data.length) {
      throw new Error('MySQL response exceeded sync buffer size');
    }
    data.fill(0);
    data.set(body, 0);
    Atomics.store(signal, 1, body.length);
    Atomics.store(signal, 0, status);
    Atomics.notify(signal, 0, 1);
  }

  (async () => {
    const pool = mysql.createPool(config);
    const sessions = new Map();
    let nextSessionId = 1;

    parentPort.on('message', async (message) => {
      const { action, payload = {}, signalBuffer, dataBuffer } = message;

      try {
        let result = null;

        if (action === 'ping') {
          result = { ok: true };
        } else if (action === 'begin') {
          const conn = await pool.getConnection();
          await conn.beginTransaction();
          const sessionId = nextSessionId++;
          sessions.set(sessionId, conn);
          result = { sessionId };
        } else if (action === 'commit' || action === 'rollback') {
          const conn = sessions.get(payload.sessionId);
          if (!conn) throw new Error(`Unknown MySQL transaction session: ${payload.sessionId}`);
          if (action === 'commit') await conn.commit();
          else await conn.rollback();
          conn.release();
          sessions.delete(payload.sessionId);
          result = { ok: true };
        } else if (action === 'query' || action === 'execute' || action === 'exec') {
          const compiled = compileStatement(payload.sql || '');
          const conn = payload.sessionId ? sessions.get(payload.sessionId) : null;
          if (payload.sessionId && !conn) {
            throw new Error(`Unknown MySQL transaction session: ${payload.sessionId}`);
          }

          const params = payload.params ?? [];
          const executor = conn || pool;
          const [rowsOrResult] = await executor.query(compiled.sql, params);

          if (action === 'query') {
            result = { rows: Array.isArray(rowsOrResult) ? rowsOrResult : [] };
          } else {
            result = {
              result: {
                affectedRows: rowsOrResult?.affectedRows ?? 0,
                insertId: rowsOrResult?.insertId ?? 0,
                changedRows: rowsOrResult?.changedRows ?? 0,
              },
            };
          }
        } else {
          throw new Error(`Unknown action: ${action}`);
        }

        writeResponse(signalBuffer, dataBuffer, 1, result);
      } catch (error) {
        writeResponse(signalBuffer, dataBuffer, 2, { error: error?.message || String(error) });
      }
    });
  })().catch((error) => {
    parentPort.postMessage({ fatal: true, error: error?.message || String(error) });
  });
}

function createDBClient() {
  const worker = new Worker(__filename, {
    workerData: { role: 'mysql-worker' },
  });
  const call = createSyncBufferClient(worker);

  call('ping');

  let activeSessionId = null;

  const db = {
    exec(sql) {
      return call('exec', {
        sql,
        sessionId: activeSessionId,
      });
    },
    pragma() {
      return null;
    },
    prepare(sql) {
      const statement = compileStatement(sql);
      return {
        get: (...args) => {
          const params = normalizeArgs(args, statement.namedParams);
          const response = call('query', {
            sql: statement.sql,
            params,
            sessionId: activeSessionId,
          });
          return response?.rows?.[0] ?? null;
        },
        all: (...args) => {
          const params = normalizeArgs(args, statement.namedParams);
          const response = call('query', {
            sql: statement.sql,
            params,
            sessionId: activeSessionId,
          });
          return response?.rows || [];
        },
        run: (...args) => {
          const params = normalizeArgs(args, statement.namedParams);
          return call('execute', {
            sql: statement.sql,
            params,
            sessionId: activeSessionId,
          });
        },
      };
    },
    transaction(fn) {
      return (...args) => {
        if (activeSessionId !== null) {
          return fn(...args);
        }

        const { sessionId } = call('begin');
        activeSessionId = sessionId;
        try {
          const result = fn(...args);
          call('commit', { sessionId });
          return result;
        } catch (error) {
          try {
            call('rollback', { sessionId });
          } catch {
            // Ignore rollback failures so the original error is preserved.
          }
          throw error;
        } finally {
          activeSessionId = null;
        }
      };
    },
    close() {
      worker.terminate().catch(() => {});
    },
  };

  return db;
}

function migrateFromJSON(db) {
  console.log('Migration db.json -> MySQL...');
  try {
    const sourceJsonPath = fs.existsSync(JSON_PATH) ? JSON_PATH : FALLBACK_JSON_PATH;
    const raw = JSON.parse(fs.readFileSync(sourceJsonPath, 'utf8'));

    const patientStmt = db.prepare(`
      INSERT IGNORE INTO patients
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
      (raw.patients || []).forEach((p) => {
        patientStmt.run({
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          dateNaissance: p.dateNaissance || null,
          age: p.age ?? null,
          sexe: p.sexe || 'M',
          telephone: p.telephone || null,
          email: p.email || null,
          adresse: p.adresse || null,
          wilaya: p.wilaya || null,
          daira: p.daira || null,
          commune: p.commune || null,
          adressePrecise: p.adressePrecise || null,
          groupeSanguin: p.groupeSanguin || 'A+',
          poids: String(p.poids || ''),
          fonction: p.fonction || null,
          service: p.service || null,
          profession: p.profession || null,
          instruction: p.instruction || null,
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
    console.log(`Migration terminee: ${raw.patients?.length || 0} patients importes`);
  } catch (error) {
    console.error('Erreur migration:', error.message);
  }
}

function seedSystemTables(db) {
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

function initDB() {
  const bootstrapConfig = {
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    password: MYSQL_CONFIG.password,
    database: undefined,
    waitForConnections: true,
    connectionLimit: 1,
    multipleStatements: true,
    dateStrings: true,
    charset: 'utf8mb4',
  };

  const bootstrapWorker = new Worker(__filename, {
    workerData: {
      role: 'mysql-worker',
      config: bootstrapConfig,
    },
  });
  const bootstrapCall = createSyncBufferClient(bootstrapWorker);
  bootstrapCall('ping');

  const dbName = MYSQL_CONFIG.database;
  bootstrapCall('exec', {
    sql: `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  });
  bootstrapWorker.terminate().catch(() => {});

  const db = createDBClient();
  db.exec(buildSchema());

  const countRow = db.prepare('SELECT COUNT(*) as n FROM patients').get() || { n: 0 };
  const count = Number(countRow.n || 0);
  if (count === 0 && (fs.existsSync(JSON_PATH) || fs.existsSync(FALLBACK_JSON_PATH))) {
    migrateFromJSON(db);
  }

  seedSystemTables(db);

  console.log(`MySQL initialised: ${MYSQL_CONFIG.database} @ ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
  return db;
}

module.exports = { initDB, getDB: initDB };

if (!isMainThread && workerData?.role === 'mysql-worker') {
  workerMain();
}

// server.js — VacciTrack avec better-sqlite3 (SQLite natif synchrone)
const express    = require('express');
const cors       = require('cors');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
const path       = require('path');
const fs         = require('fs');
const multer     = require('multer');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { initDB } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = process.env.VACCITRACK_DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Multer pour upload fichier Excel ─────────────────────────────────────────
const uploadDir = path.join(DATA_DIR, 'uploads_tmp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `antirab_${Date.now()}_${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Seuls les fichiers .xlsx et .xls sont acceptes'));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

const db = initDB();

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad      = v => v ? String(v).padStart(2, '0') : null;
const fromJSON = v => { try { return v ? JSON.parse(v) : null; } catch { return null; } };
const hydrateVacc = v => v ? { ...v, protocoleData: fromJSON(v.protocoleData) } : null;
const hydrateOrd  = o => o ? { ...o, medicaments: fromJSON(o.medicaments) }     : null;
const normalizeText = value => String(value || '').trim();
const normalizeKey = value => normalizeText(value).toLowerCase();
const normalizeHeader = value => normalizeKey(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const UNKNOWN_NAME = 'Non renseigne';
const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['1', 'true', 'oui', 'on'].includes(String(value).toLowerCase());
};
const hydrateSettings = row => ({
  langue: row?.langue || 'fr',
  theme: row?.theme || 'light',
  notificationsEmail: toBool(row?.notificationsEmail, true),
  notificationsPush: toBool(row?.notificationsPush, true),
  affichageRappels: toBool(row?.affichageRappels, true),
});

const pickRowValue = (row, candidates = []) => {
  const entries = Object.entries(row || {});
  for (const candidate of candidates) {
    const target = normalizeHeader(candidate);
    const match = entries.find(([key]) => normalizeHeader(key) === target);
    if (match && normalizeText(match[1])) return match[1];
  }
  return null;
};

const parseExcelDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const buildIsoDate = (year, month, day) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`;
  };
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 20000 && value < 60000) {
      const utc = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
      return new Date(utc).toISOString().slice(0, 10);
    }
    if (value >= 10000000 && value <= 99999999) {
      const raw = String(Math.trunc(value));
      return buildIsoDate(raw.slice(0, 4), raw.slice(4, 6), raw.slice(6, 8))
        || buildIsoDate(raw.slice(4, 8), raw.slice(2, 4), raw.slice(0, 2));
    }
  }
  const raw = normalizeText(value).replace(/\./g, '/').replace(/-/g, '/');
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, '');
  const compactDigits = compact.match(/^(\d{8})$/);
  if (compactDigits) {
    const digits = compactDigits[1];
    const asYmd = buildIsoDate(digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8));
    if (asYmd) return asYmd;
    const asDmy = buildIsoDate(digits.slice(4, 8), digits.slice(2, 4), digits.slice(0, 2));
    if (asDmy) return asDmy;
  }
  const dayMonthYear = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (dayMonthYear) {
    const [, d, m, y] = dayMonthYear;
    const year = y.length === 2 ? `20${y}` : y;
    return buildIsoDate(year, m, d);
  }
  const isoLike = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (isoLike) { const [, y, m, d] = isoLike; return buildIsoDate(y, m, d); }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
};

const buildRowDate = (row) => {
  const directFields = ['VACCINAT01','CONSULTATI','DATCONS','DATECONS','DATMORSURE'];
  for (const field of directFields) {
    const parsed = parseExcelDate(pickRowValue(row, [field]));
    if (parsed) return parsed;
  }
  const year = normalizeText(pickRowValue(row, ['ANNEE']));
  const month = pad(pickRowValue(row, ['MOIS']));
  if (year && month) return `${year}-${month}-01`;
  return new Date().toISOString().slice(0, 10);
};

const extractPatientIdentity = (row) => {
  let nom = normalizeText(pickRowValue(row, ['NOM']));
  let prenom = normalizeText(pickRowValue(row, ['PRENOM']));

  if (nom && !prenom) {
    const parts = nom.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      prenom = parts[parts.length - 1];
      nom = parts.slice(0, -1).join(' ');
    } else {
      prenom = UNKNOWN_NAME;
    }
  }

  if (!nom && prenom) nom = UNKNOWN_NAME;

  return {
    nom: normalizeText(nom),
    prenom: normalizeText(prenom),
  };
};

// ── Lire un fichier Excel via PowerShell (chemin fixe historique) ─────────────
function readAntirabWorkbook(workbookPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'import_antirab.ps1');
    if (!fs.existsSync(workbookPath)) return reject(new Error(`Fichier introuvable: ${workbookPath}`));
    execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, workbookPath],
      { maxBuffer: 80 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr?.toString() || err.message));
        try {
          const raw = stdout?.toString()?.trim();
          const parsed = raw ? JSON.parse(raw) : [];
          resolve(Array.isArray(parsed) ? parsed : [parsed]);
        } catch (parseErr) { reject(new Error(`Lecture Excel invalide: ${parseErr.message}`)); }
      }
    );
  });
}

// ── Lire un fichier Excel via Node.js (xlsx) — fallback cross-platform ───────
async function readExcelWithXlsx(filePath) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath, { cellDates: false, raw: true });
    const rows = [];
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
      rows.push(...data);
    });
    return rows;
  } catch (err) {
    throw new Error(`Impossible de lire le fichier Excel (xlsx): ${err.message}`);
  }
}

async function readWorkbookWithXlsx(filePath) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath, { cellDates: false, raw: true });
    const sheets = workbook.SheetNames.map((sheetName) => ({
      name: sheetName,
      rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true }),
    }));
    return { sheetNames: workbook.SheetNames, sheets };
  } catch (err) {
    throw new Error(`Impossible de lire le fichier Excel (xlsx): ${err.message}`);
  }
}

function isExportedWorkbook(workbook) {
  const names = new Set((workbook?.sheetNames || []).map((name) => normalizeKey(name)));
  return names.has('patients') && names.has('vaccinations');
}

function importExportedWorkbookIntoDB(workbook) {
  const patientsSheet = (workbook.sheets || []).find((sheet) => normalizeKey(sheet.name) === 'patients');
  const vaccinationsSheet = (workbook.sheets || []).find((sheet) => normalizeKey(sheet.name) === 'vaccinations');
  const patientRows = Array.isArray(patientsSheet?.rows) ? patientsSheet.rows : [];
  const vaccinationRows = Array.isArray(vaccinationsSheet?.rows) ? vaccinationsSheet.rows : [];

  const findPatientById = db.prepare('SELECT id FROM patients WHERE id = ? LIMIT 1');
  const findPatientByIdentity = db.prepare(`
    SELECT id FROM patients
    WHERE lower(trim(nom)) = ? AND lower(trim(prenom)) = ? AND coalesce(sexe, '') = ?
    LIMIT 1
  `);
  const insertPatient = db.prepare(`
    INSERT INTO patients
      (id,nom,prenom,dateNaissance,age,sexe,telephone,email,adresse,wilaya,daira,commune,
       adressePrecise,groupeSanguin,poids,fonction,service,profession,instruction,
       antecedents,allergies,maladiesChroniques,traitementEnCours,contreIndications,
       fumeur,alcool,activitePhysique,mutuelle,numeroCNAS,medecinTraitant,notesClinicien,createdAt)
    VALUES
      (@id,@nom,@prenom,@dateNaissance,@age,@sexe,@telephone,@email,@adresse,@wilaya,@daira,
       @commune,@adressePrecise,@groupeSanguin,@poids,@fonction,@service,@profession,@instruction,
       @antecedents,@allergies,@maladiesChroniques,@traitementEnCours,@contreIndications,
       @fumeur,@alcool,@activitePhysique,@mutuelle,@numeroCNAS,@medecinTraitant,@notesClinicien,@createdAt)
  `);
  const findVaccinationById = db.prepare('SELECT id FROM vaccinations WHERE id = ? LIMIT 1');
  const findVaccinationBySignature = db.prepare(`
    SELECT id FROM vaccinations
    WHERE patientId = ?
      AND coalesce(type, '') = ?
      AND coalesce(vaccin, '') = ?
      AND coalesce(dateAdministration, '') = ?
      AND coalesce(dose, '') = ?
    LIMIT 1
  `);
  const insertVaccination = db.prepare(`
    INSERT INTO vaccinations
      (id,patientId,type,vaccin,dose,statut,dateAdministration,dateProchaineDose,protocoleData,createdAt)
    VALUES
      (@id,@patientId,@type,@vaccin,@dose,@statut,@dateAdministration,@dateProchaineDose,@protocoleData,@createdAt)
  `);

  const result = {
    totalRows: patientRows.length + vaccinationRows.length,
    importedPatients: 0,
    importedVaccinations: 0,
    skippedRows: 0,
  };
  const patientIdMap = new Map();

  const tx = db.transaction(() => {
    patientRows.forEach((row) => {
      const sourceId = normalizeText(row.id || row.patientId);
      const nom = normalizeText(row.nom);
      const prenom = normalizeText(row.prenom);
      const sexe = normalizeText(row.sexe) || 'M';

      if (!nom || !prenom) {
        result.skippedRows += 1;
        return;
      }

      let patient = sourceId ? findPatientById.get(sourceId) : null;
      if (!patient) {
        patient = findPatientByIdentity.get(normalizeKey(nom), normalizeKey(prenom), sexe);
      }

      if (!patient) {
        let patientId = sourceId || uuidv4();
        if (sourceId && findPatientById.get(sourceId)) patientId = uuidv4();
        insertPatient.run({
          id: patientId,
          nom,
          prenom,
          dateNaissance: parseExcelDate(row.dateNaissance) || normalizeText(row.dateNaissance) || null,
          age: row.age === '' || row.age === null || row.age === undefined ? null : Number.parseInt(row.age, 10) || null,
          sexe,
          telephone: normalizeText(row.telephone) || null,
          email: normalizeText(row.email) || null,
          adresse: normalizeText(row.adresse) || null,
          wilaya: normalizeText(row.wilaya) || null,
          daira: normalizeText(row.daira) || null,
          commune: normalizeText(row.commune) || null,
          adressePrecise: normalizeText(row.adressePrecise) || null,
          groupeSanguin: normalizeText(row.groupeSanguin) || 'A+',
          poids: normalizeText(row.poids) || '',
          fonction: normalizeText(row.fonction) || null,
          service: normalizeText(row.service) || null,
          profession: normalizeText(row.profession) || null,
          instruction: normalizeText(row.instruction) || null,
          antecedents: normalizeText(row.antecedents) || null,
          allergies: normalizeText(row.allergies) || null,
          maladiesChroniques: normalizeText(row.maladiesChroniques) || null,
          traitementEnCours: normalizeText(row.traitementEnCours) || null,
          contreIndications: normalizeText(row.contreIndications) || null,
          fumeur: normalizeText(row.fumeur) || null,
          alcool: normalizeText(row.alcool) || null,
          activitePhysique: normalizeText(row.activitePhysique) || null,
          mutuelle: normalizeText(row.mutuelle) || null,
          numeroCNAS: normalizeText(row.numeroCNAS) || null,
          medecinTraitant: normalizeText(row.medecinTraitant) || null,
          notesClinicien: normalizeText(row.notesClinicien) || null,
          createdAt: normalizeText(row.createdAt) || new Date().toISOString(),
        });
        patient = { id: patientId };
        result.importedPatients += 1;
      }

      if (sourceId) patientIdMap.set(sourceId, patient.id);
    });

    vaccinationRows.forEach((row) => {
      const sourceVaccinationId = normalizeText(row.id);
      const sourcePatientId = normalizeText(row.patientId);
      let patientId = sourcePatientId ? (patientIdMap.get(sourcePatientId) || sourcePatientId) : '';

      if (!patientId && normalizeText(row.patient)) {
        const parts = normalizeText(row.patient).split(/\s+/).filter(Boolean);
        const prenom = parts.shift() || '';
        const nom = parts.join(' ');
        const found = (nom || prenom)
          ? findPatientByIdentity.get(normalizeKey(nom), normalizeKey(prenom), normalizeText(row.sexe) || 'M')
          : null;
        if (found) patientId = found.id;
      }

      if (!patientId || !findPatientById.get(patientId)) {
        result.skippedRows += 1;
        return;
      }

      if (sourceVaccinationId && findVaccinationById.get(sourceVaccinationId)) {
        result.skippedRows += 1;
        return;
      }

      const type = normalizeText(row.type);
      const vaccin = normalizeText(row.vaccin);
      const dose = normalizeText(row.dose);
      const dateAdministration = parseExcelDate(row.dateAdministration) || normalizeText(row.dateAdministration) || null;
      const existingVaccination = findVaccinationBySignature.get(
        patientId,
        type,
        vaccin,
        dateAdministration || '',
        dose,
      );
      if (existingVaccination) {
        result.skippedRows += 1;
        return;
      }

      let protocoleData = null;
      if (normalizeText(row.protocoleData)) {
        try { protocoleData = JSON.parse(String(row.protocoleData)); } catch {}
      }
      if (!protocoleData) {
        protocoleData = {
          grade: normalizeText(row.grade) || null,
          schema: normalizeText(row.schema) || null,
        };
      }

      let vaccinationId = sourceVaccinationId || uuidv4();
      if (sourceVaccinationId && findVaccinationById.get(sourceVaccinationId)) vaccinationId = uuidv4();
      insertVaccination.run({
        id: vaccinationId,
        patientId,
        type: type || null,
        vaccin: vaccin || null,
        dose: dose || null,
        statut: normalizeText(row.statut) || 'complete',
        dateAdministration,
        dateProchaineDose: parseExcelDate(row.dateProchaineDose) || normalizeText(row.dateProchaineDose) || null,
        protocoleData: JSON.stringify(protocoleData),
        createdAt: normalizeText(row.createdAt) || dateAdministration || new Date().toISOString(),
      });
      result.importedVaccinations += 1;
    });
  });

  tx();
  return result;
}

// ── Importer des lignes dans la base ─────────────────────────────────────────
function importRowsIntoDB(rows) {
  const findPatient = db.prepare(`
    SELECT id FROM patients
    WHERE lower(trim(nom)) = ? AND lower(trim(prenom)) = ? AND coalesce(sexe, '') = ?
    LIMIT 1
  `);
  const insertPatient = db.prepare(`
    INSERT INTO patients
      (id,nom,prenom,dateNaissance,age,sexe,telephone,email,adresse,wilaya,daira,commune,
       adressePrecise,groupeSanguin,poids,fonction,service,profession,instruction,
       antecedents,allergies,maladiesChroniques,traitementEnCours,contreIndications,
       fumeur,alcool,activitePhysique,mutuelle,numeroCNAS,medecinTraitant,notesClinicien,createdAt)
    VALUES
      (@id,@nom,@prenom,@dateNaissance,@age,@sexe,@telephone,@email,@adresse,@wilaya,@daira,
       @commune,@adressePrecise,@groupeSanguin,@poids,@fonction,@service,@profession,@instruction,
       @antecedents,@allergies,@maladiesChroniques,@traitementEnCours,@contreIndications,
       @fumeur,@alcool,@activitePhysique,@mutuelle,@numeroCNAS,@medecinTraitant,@notesClinicien,@createdAt)
  `);
  const findVaccination = db.prepare(`
    SELECT id FROM vaccinations
    WHERE patientId = ? AND type = 'rage'
      AND coalesce(dateAdministration, '') = ? AND coalesce(vaccin, '') = ?
    LIMIT 1
  `);
  const insertVaccination = db.prepare(`
    INSERT INTO vaccinations
      (id,patientId,type,vaccin,dose,statut,dateAdministration,dateProchaineDose,protocoleData,createdAt)
    VALUES
      (@id,@patientId,@type,@vaccin,@dose,@statut,@dateAdministration,@dateProchaineDose,@protocoleData,@createdAt)
  `);

  const result = { totalRows: rows.length, importedPatients: 0, importedVaccinations: 0, skippedRows: 0 };

  const importTransaction = db.transaction((items) => {
    items.forEach((row) => {
      const { nom, prenom } = extractPatientIdentity(row);

      if (!nom || !prenom) { result.skippedRows += 1; return; }

      const sexe = normalizeKey(pickRowValue(row, ['SEXE'])).startsWith('f') ? 'F' : 'M';
      const dateAdministration = buildRowDate(row);
      const sourceYear = Number(pickRowValue(row, ['ANNEE'])) || new Date(dateAdministration).getFullYear();
      const age = Number.parseInt(pickRowValue(row, ['AGE']), 10);
      const dateNaissance = Number.isFinite(age) && age >= 0 ? `${sourceYear - age}-01-01` : null;

      let patient = findPatient.get(normalizeKey(nom), normalizeKey(prenom), sexe);
      if (!patient) {
        const patientId = uuidv4();
        insertPatient.run({
          id: patientId, nom, prenom, dateNaissance, age: Number.isFinite(age) ? age : null, sexe,
          telephone: normalizeText(pickRowValue(row, ['TEL','TELEPHONE'])) || null,
          email: null,
          adresse: normalizeText(pickRowValue(row, ['ADRESSE'])) || null,
          wilaya:  normalizeText(pickRowValue(row, ['WILAYA']))  || null,
          daira:   normalizeText(pickRowValue(row, ['DAIRA']))   || null,
          commune: normalizeText(pickRowValue(row, ['COMMUNE'])) || null,
          adressePrecise: null,
          groupeSanguin: 'A+',
          poids:      normalizeText(pickRowValue(row, ['POID','POIDS'])) || '',
          fonction:   normalizeText(pickRowValue(row, ['FONCTION']))     || null,
          service:    normalizeText(pickRowValue(row, ['SERVICE']))      || null,
          profession: normalizeText(pickRowValue(row, ['PROF','PROFESSION'])) || null,
          instruction: normalizeText(pickRowValue(row, ['INSTRUC','INSTRUCTION','NIVINSTR'])) || null,
          antecedents: null, allergies: null, maladiesChroniques: null,
          traitementEnCours: null, contreIndications: null,
          fumeur: null, alcool: null, activitePhysique: null,
          mutuelle: null, numeroCNAS: null,
          medecinTraitant: null, notesClinicien: null,
          createdAt: dateAdministration,
        });
        patient = { id: patientId };
        result.importedPatients += 1;
      }

      const vaccin = normalizeText(pickRowValue(row, ['DCI'])) || normalizeText(pickRowValue(row, ['TYPVAC'])) || 'Anti-Rabique';
      const existingVaccination = findVaccination.get(patient.id, dateAdministration, vaccin);
      if (existingVaccination) { result.skippedRows += 1; return; }

      const vaccAnimalText = normalizeText(pickRowValue(row, ['VACCANIM']));
      const sutureVal      = normalizeText(pickRowValue(row, ['SUTURE','SUTUR']));
      const sutureMoment   = normalizeText(pickRowValue(row, ['SUTURE_MOMENT','MOMSUTURE']));

      const protocoleData = {
        grade:                normalizeText(pickRowValue(row, ['CLASRISQ'])) || null,
        dateExposition:       parseExcelDate(pickRowValue(row, ['DATMORSURE'])),
        especeAnimale:        normalizeText(pickRowValue(row, ['MORDEUR'])) || null,
        statutAnimal:         normalizeText(pickRowValue(row, ['STATANIM'])) || null,
        animalVaccine: /oui|vaccine|vaccin/i.test(vaccAnimalText) ? true : /non|inconnu/i.test(vaccAnimalText) ? false : null,
        localisationPlaies:   normalizeText(pickRowValue(row, ['SIEGE'])) || null,
        circonstancesMorsure: normalizeText(pickRowValue(row, ['NATULESI'])) || null,
        // III.1 Soins locaux
        soinsLocaux:    /oui|1|true/i.test(normalizeText(pickRowValue(row, ['SOINS','SOINSLOCAUX','SOINSLOCAU']))) || false,
        lavageEau:      /oui|1|true/i.test(normalizeText(pickRowValue(row, ['LAVEAU','LAVAGEEAU'])))  || false,
        lavageEauSavon: /oui|1|true/i.test(normalizeText(pickRowValue(row, ['LAVEAUSAVON'])))          || false,
        applicationProduit: normalizeText(pickRowValue(row, ['PRODUIT','ANTISEPTIQUE'])) || null,
        // III.2 ERIG
        erig:           /oui|1|true/i.test(normalizeText(pickRowValue(row, ['ERIG']))),
        erigLot:        normalizeText(pickRowValue(row, ['LOTERIG']))              || null,
        erigPeremption: parseExcelDate(pickRowValue(row, ['DPÉERIG','DPERIG'])),
        erigQuantiteTotale: normalizeText(pickRowValue(row, ['ERIGTOT','QTOTERIG','QTERIG'])) || null,
        erigQuantiteIM:     normalizeText(pickRowValue(row, ['ERIGINJ','QIMERIG']))            || null,
        erigBesredka:   normalizeText(pickRowValue(row, ['BESREDKA'])) || 'non',
        erigDilution:   /oui|1|true/i.test(normalizeText(pickRowValue(row, ['DILLUT','DILUTIONERIG']))) || false,
        // III.3 Chirurgie
        chirurgie:         normalizeText(pickRowValue(row, ['INTERVCH','CHIRURGIE'])) || 'non',
        chirurgieDate:     parseExcelDate(pickRowValue(row, ['DATINTER','DATCHIR'])),
        chirurgieHopital:  normalizeText(pickRowValue(row, ['HOPITAL'])) || null,
        chirurgieService:  normalizeText(pickRowValue(row, ['SERVICE2'])) || null,
        // III.4 Suture
        suture:       /oui|1|true/i.test(sutureVal),
        sutureDetail: sutureMoment ? (
          /avant/i.test(sutureMoment) ? "Avant l'infiltration d'ERIG" : "Apres l'infiltration d'ERIG"
        ) : '',
        // III.5 VAR
        varType:      normalizeText(pickRowValue(row, ['TYPVAC']))   || null,
        varDCI:       normalizeText(pickRowValue(row, ['DCI']))      || null,
        varLot:       normalizeText(pickRowValue(row, ['LOTVAR']))   || null,
        varPeremption: parseExcelDate(pickRowValue(row, ['DATPÉVAR','DATPEVAR'])),
        varDose:      normalizeText(pickRowValue(row, ['VARDOSE']))  || null,
        varVoieAdmin: normalizeText(pickRowValue(row, ['VOIADM','VOIEDADMIN'])) || 'Intra musculaire',
        varDoseBase:  normalizeText(pickRowValue(row, ['DOSEBASE'])) || null,
        observations: normalizeText(pickRowValue(row, ['OBSERV','OBSERVATION'])) || null,
        mpvi: {
          mpviMineur:      /oui|1|true/i.test(normalizeText(pickRowValue(row, ['MPVI']))) ? 'oui' : 'non',
          mpviMineurTypes: normalizeText(pickRowValue(row, ['MPVI1'])) || '',
          mpviMajeur:      'non',
          mpviMajeurTypes: '',
          mpviDate:        parseExcelDate(pickRowValue(row, ['DATMPVI'])),
          mpviResume:      normalizeText(pickRowValue(row, ['MESUMPVI'])) || '',
        },
      };

      insertVaccination.run({
        id: uuidv4(), patientId: patient.id, type: 'rage', vaccin,
        dose: normalizeText(pickRowValue(row, ['VARDOSE'])) || null,
        statut: 'complete', dateAdministration, dateProchaineDose: null,
        protocoleData: JSON.stringify(protocoleData), createdAt: dateAdministration,
      });
      result.importedVaccinations += 1;
    });
  });

  importTransaction(rows);
  return result;
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────
app.get('/api/patients', (req, res) => {
  try {
    const { search, all, year } = req.query;
    const clauses = [];
    const params = [];

    if (year) {
      clauses.push("substr(createdAt,1,4) = ?");
      params.push(String(year));
    }

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      clauses.push("(lower(nom) LIKE ? OR lower(prenom) LIKE ? OR lower(email) LIKE ?)");
      params.push(s, s, s);
    }

    const whereSql = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    let rows;
    if (all === '1' || search || year) {
      rows = db.prepare(`SELECT * FROM patients${whereSql} ORDER BY createdAt DESC`).all(...params);
    } else {
      rows = db.prepare('SELECT * FROM patients ORDER BY createdAt DESC').all();
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient non trouvé' });
    const vaccinations = db.prepare('SELECT * FROM vaccinations WHERE patientId=? ORDER BY dateAdministration DESC').all(req.params.id).map(hydrateVacc);
    res.json({ ...patient, vaccinations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/export/patients', (req, res) => {
  try {
    const XLSX = require('xlsx');
    const patients = db.prepare('SELECT * FROM patients ORDER BY createdAt DESC').all();
    const vaccinations = db.prepare('SELECT * FROM vaccinations ORDER BY dateAdministration DESC, createdAt DESC').all().map(hydrateVacc);

    const patientNames = patients.reduce((acc, patient) => {
      acc[patient.id] = `${patient.prenom || ''} ${patient.nom || ''}`.trim();
      return acc;
    }, {});

    const summaryRows = [
      { champ: 'exportedAt', valeur: new Date().toISOString() },
      { champ: 'patients', valeur: patients.length },
      { champ: 'vaccinations', valeur: vaccinations.length },
    ];

    const patientVaccinationRows = patients.flatMap((patient) => {
      const patientVaccinations = vaccinations.filter((vaccination) => vaccination.patientId === patient.id);
      if (patientVaccinations.length === 0) {
        return [{
          patientId: patient.id,
          nom: patient.nom || '',
          prenom: patient.prenom || '',
          dateNaissance: patient.dateNaissance || '',
          age: patient.age ?? '',
          sexe: patient.sexe || '',
          telephone: patient.telephone || '',
          commune: patient.commune || '',
          wilaya: patient.wilaya || '',
          typeVaccin: '',
          vaccin: '',
          dose: '',
          statut: '',
          dateAdministration: '',
          dateProchaineDose: '',
          grade: '',
          schema: '',
        }];
      }

      return patientVaccinations.map((vaccination) => ({
        patientId: patient.id,
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        dateNaissance: patient.dateNaissance || '',
        age: patient.age ?? '',
        sexe: patient.sexe || '',
        telephone: patient.telephone || '',
        commune: patient.commune || '',
        wilaya: patient.wilaya || '',
        typeVaccin: vaccination.type || '',
        vaccin: vaccination.vaccin || '',
        dose: vaccination.dose || '',
        statut: vaccination.statut || '',
        dateAdministration: vaccination.dateAdministration || '',
        dateProchaineDose: vaccination.dateProchaineDose || '',
        grade: vaccination.protocoleData?.grade || '',
        schema: vaccination.protocoleData?.schema || '',
      }));
    });

    const patientRows = patients.map((patient) => {
      const patientVaccinations = vaccinations.filter((vaccination) => vaccination.patientId === patient.id);
      return {
        id: patient.id,
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        dateNaissance: patient.dateNaissance || '',
        age: patient.age ?? '',
        sexe: patient.sexe || '',
        telephone: patient.telephone || '',
        adresse: patient.adresse || '',
        adressePrecise: patient.adressePrecise || '',
        commune: patient.commune || '',
        daira: patient.daira || '',
        wilaya: patient.wilaya || '',
        profession: patient.profession || '',
        fonction: patient.fonction || '',
        groupeSanguin: patient.groupeSanguin || '',
        createdAt: patient.createdAt || '',
        vaccinationsCount: patientVaccinations.length,
      };
    });

    const vaccinationRows = vaccinations.map((vaccination) => ({
      id: vaccination.id,
      patientId: vaccination.patientId || '',
      patient: vaccination.patient || patientNames[vaccination.patientId] || '',
      type: vaccination.type || '',
      vaccin: vaccination.vaccin || '',
      dose: vaccination.dose || '',
      statut: vaccination.statut || '',
      dateAdministration: vaccination.dateAdministration || '',
      dateProchaineDose: vaccination.dateProchaineDose || '',
      grade: vaccination.protocoleData?.grade || '',
      schema: vaccination.protocoleData?.schema || '',
      protocoleData: vaccination.protocoleData ? JSON.stringify(vaccination.protocoleData) : '',
      createdAt: vaccination.createdAt || '',
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(patientVaccinationRows), 'Patients_Vaccins');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(patientRows), 'Patients');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(vaccinationRows), 'Vaccinations');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Resume');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `vaccitrack_export_patients_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', (req, res) => {
  try {
    const p = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO patients
        (id,nom,prenom,dateNaissance,age,sexe,telephone,email,adresse,wilaya,daira,commune,
         adressePrecise,groupeSanguin,poids,fonction,service,profession,instruction,
         antecedents,allergies,maladiesChroniques,traitementEnCours,contreIndications,
         fumeur,alcool,activitePhysique,mutuelle,numeroCNAS,medecinTraitant,notesClinicien,createdAt)
      VALUES
        (@id,@nom,@prenom,@dateNaissance,@age,@sexe,@telephone,@email,@adresse,@wilaya,@daira,
         @commune,@adressePrecise,@groupeSanguin,@poids,@fonction,@service,@profession,@instruction,
         @antecedents,@allergies,@maladiesChroniques,@traitementEnCours,@contreIndications,
         @fumeur,@alcool,@activitePhysique,@mutuelle,@numeroCNAS,@medecinTraitant,@notesClinicien,@createdAt)
    `).run({
      id:p.id, nom:p.nom, prenom:p.prenom, dateNaissance:p.dateNaissance||null, age:Number.isFinite(Number(p.age)) ? Number(p.age) : null,
      sexe:p.sexe||'M', telephone:p.telephone||null, email:p.email||null,
      adresse:p.adresse||null, wilaya:p.wilaya||null, daira:p.daira||null,
      commune:p.commune||null, adressePrecise:p.adressePrecise||null,
      groupeSanguin:p.groupeSanguin||'A+', poids:String(p.poids||''),
      fonction:p.fonction||null, service:p.service||null,
      profession:p.profession||null, instruction:p.instruction||null,
      antecedents:p.antecedents||null, allergies:p.allergies||null,
      maladiesChroniques:p.maladiesChroniques||null, traitementEnCours:p.traitementEnCours||null,
      contreIndications:p.contreIndications||null, fumeur:p.fumeur||null,
      alcool:p.alcool||null, activitePhysique:p.activitePhysique||null,
      mutuelle:p.mutuelle||null, numeroCNAS:p.numeroCNAS||null,
      medecinTraitant:p.medecinTraitant||null, notesClinicien:p.notesClinicien||null,
      createdAt:p.createdAt,
    });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/patients/:id', (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE patients SET
        nom=@nom, prenom=@prenom, dateNaissance=@dateNaissance, age=@age, sexe=@sexe,
        telephone=@telephone, email=@email, adresse=@adresse,
        wilaya=@wilaya, daira=@daira, commune=@commune, adressePrecise=@adressePrecise,
        groupeSanguin=@groupeSanguin, poids=@poids,
        fonction=@fonction, service=@service, profession=@profession, instruction=@instruction,
        antecedents=@antecedents, allergies=@allergies,
        maladiesChroniques=@maladiesChroniques, traitementEnCours=@traitementEnCours,
        contreIndications=@contreIndications, fumeur=@fumeur, alcool=@alcool,
        activitePhysique=@activitePhysique, mutuelle=@mutuelle,
        numeroCNAS=@numeroCNAS, medecinTraitant=@medecinTraitant, notesClinicien=@notesClinicien
      WHERE id=@id
    `).run({
      id:req.params.id, nom:b.nom, prenom:b.prenom,
      dateNaissance:b.dateNaissance||null, age:Number.isFinite(Number(b.age)) ? Number(b.age) : null, sexe:b.sexe||'M',
      telephone:b.telephone||null, email:b.email||null, adresse:b.adresse||null,
      wilaya:b.wilaya||null, daira:b.daira||null, commune:b.commune||null,
      adressePrecise:b.adressePrecise||null, groupeSanguin:b.groupeSanguin||'A+',
      poids:String(b.poids||''), fonction:b.fonction||null, service:b.service||null,
      profession:b.profession||null, instruction:b.instruction||null,
      antecedents:b.antecedents||null, allergies:b.allergies||null,
      maladiesChroniques:b.maladiesChroniques||null, traitementEnCours:b.traitementEnCours||null,
      contreIndications:b.contreIndications||null, fumeur:b.fumeur||null,
      alcool:b.alcool||null, activitePhysique:b.activitePhysique||null,
      mutuelle:b.mutuelle||null, numeroCNAS:b.numeroCNAS||null,
      medecinTraitant:b.medecinTraitant||null, notesClinicien:b.notesClinicien||null,
    });
    res.json(db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/patients/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vaccinations WHERE patientId=?').run(req.params.id);
    db.prepare('DELETE FROM patients WHERE id=?').run(req.params.id);
    res.json({ message: 'Patient supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── VACCINATIONS ──────────────────────────────────────────────────────────────
app.get('/api/vaccinations', (req, res) => {
  try {
    const { patientId, all, year } = req.query;
    const join = `SELECT v.*, (p.prenom||' '||p.nom) as patient FROM vaccinations v LEFT JOIN patients p ON v.patientId=p.id`;
    const clauses = [];
    const params = [];

    if (patientId && all !== '1') {
      clauses.push('v.patientId=?');
      params.push(patientId);
    }

    if (year) {
      clauses.push("substr(v.dateAdministration,1,4) = ?");
      params.push(String(year));
    }

    const whereSql = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const rows = db.prepare(`${join}${whereSql} ORDER BY v.dateAdministration DESC`).all(...params);
    res.json(rows.map(hydrateVacc));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vaccinations', (req, res) => {
  try {
    const v = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO vaccinations (id,patientId,type,vaccin,dose,statut,dateAdministration,dateProchaineDose,protocoleData,createdAt)
      VALUES (@id,@patientId,@type,@vaccin,@dose,@statut,@dateAdministration,@dateProchaineDose,@protocoleData,@createdAt)
    `).run({
      id:v.id, patientId:v.patientId, type:v.type||null, vaccin:v.vaccin||null,
      dose:v.dose||null, statut:v.statut||'complete',
      dateAdministration:v.dateAdministration||null,
      dateProchaineDose:v.dateProchaineDose||null,
      protocoleData:v.protocoleData ? JSON.stringify(v.protocoleData) : null,
      createdAt:v.createdAt,
    });
    const match = db.prepare(`SELECT * FROM stocks WHERE lower(vaccin) LIKE ? AND quantiteRestante > 0 LIMIT 1`).get(`%${(v.vaccin||'').split(' ')[0].toLowerCase()}%`);
    if (match) {
      db.prepare('UPDATE stocks SET quantiteRestante = quantiteRestante - 1 WHERE id=?').run(match.id);
      db.prepare(`
        INSERT INTO stock_movements (id, stockId, type, quantite, patientId, motif, createdAt)
        VALUES (?, ?, 'SORTIE', 1, ?, ?, ?)
      `).run(uuidv4(), match.id, v.patientId, `Vaccination: ${v.vaccin || v.type || 'Vaccin'}`, new Date().toISOString());
    }
    res.status(201).json(hydrateVacc(db.prepare('SELECT * FROM vaccinations WHERE id=?').get(v.id)));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/vaccinations/:id', (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE vaccinations SET type=@type, vaccin=@vaccin, dose=@dose, statut=@statut,
        dateAdministration=@dateAdministration, dateProchaineDose=@dateProchaineDose, protocoleData=@protocoleData
      WHERE id=@id
    `).run({
      id:req.params.id, type:b.type||null, vaccin:b.vaccin||null, dose:b.dose||null,
      statut:b.statut||'complete', dateAdministration:b.dateAdministration||null,
      dateProchaineDose:b.dateProchaineDose||null,
      protocoleData:b.protocoleData ? JSON.stringify(b.protocoleData) : null,
    });
    res.json(hydrateVacc(db.prepare('SELECT * FROM vaccinations WHERE id=?').get(req.params.id)));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/vaccinations/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vaccinations WHERE id=?').run(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ORDONNANCES ───────────────────────────────────────────────────────────────
app.get('/api/ordonnances', (req, res) => {
  try {
    const { patientId } = req.query;
    const join = `SELECT o.*, (p.prenom||' '||p.nom) as patientNom FROM ordonnances o LEFT JOIN patients p ON o.patientId=p.id`;
    const rows = patientId
      ? db.prepare(`${join} WHERE o.patientId=? ORDER BY o.createdAt DESC`).all(patientId)
      : db.prepare(`${join} ORDER BY o.createdAt DESC`).all();
    res.json(rows.map(hydrateOrd));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ordonnances', (req, res) => {
  try {
    const o = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.prepare(`INSERT INTO ordonnances (id,patientId,date,medecin,diagnostic,observations,medicaments,createdAt) VALUES (@id,@patientId,@date,@medecin,@diagnostic,@observations,@medicaments,@createdAt)`).run({
      id:o.id, patientId:o.patientId, date:o.date||null, medecin:o.medecin||null,
      diagnostic:o.diagnostic||null, observations:o.observations||null,
      medicaments:o.medicaments ? JSON.stringify(o.medicaments) : null, createdAt:o.createdAt,
    });
    res.status(201).json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/ordonnances/:id', (req, res) => {
  try { db.prepare('DELETE FROM ordonnances WHERE id=?').run(req.params.id); res.json({ message: 'Ordonnance supprimée' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STOCKS ────────────────────────────────────────────────────────────────────
app.get('/api/stocks', (req, res) => {
  try { res.json(db.prepare('SELECT * FROM stocks ORDER BY vaccin').all()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stocks/movements', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT m.*, s.vaccin, s.lot, (p.prenom||' '||p.nom) as patientNom
      FROM stock_movements m
      JOIN stocks s ON m.stockId = s.id
      LEFT JOIN patients p ON m.patientId = p.id
      ORDER BY m.createdAt DESC
      LIMIT 100
    `).all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stocks', (req, res) => {
  try {
    const s = { id: uuidv4(), ...req.body };
    db.prepare(`INSERT INTO stocks (id,vaccin,lot,quantiteInitiale,quantiteRestante,datePeremption) VALUES (@id,@vaccin,@lot,@quantiteInitiale,@quantiteRestante,@datePeremption)`).run({
      id:s.id, vaccin:s.vaccin, lot:s.lot||null,
      quantiteInitiale:Number(s.quantiteInitiale)||0,
      quantiteRestante:Number(s.quantiteRestante)||0,
      datePeremption:s.datePeremption||null,
    });
    db.prepare(`
      INSERT INTO stock_movements (id, stockId, type, quantite, motif, createdAt)
      VALUES (?, ?, 'ENTREE', ?, ?, ?)
    `).run(uuidv4(), s.id, Number(s.quantiteInitiale) || 0, 'Reception initiale de lot', new Date().toISOString());
    res.status(201).json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/stocks/:id', (req, res) => {
  try {
    const b = req.body;
    db.prepare(`UPDATE stocks SET vaccin=@vaccin, lot=@lot, quantiteInitiale=@quantiteInitiale, quantiteRestante=@quantiteRestante, datePeremption=@datePeremption WHERE id=@id`).run({
      id:req.params.id, vaccin:b.vaccin, lot:b.lot||null,
      quantiteInitiale:Number(b.quantiteInitiale)||0,
      quantiteRestante:Number(b.quantiteRestante)||0,
      datePeremption:b.datePeremption||null,
    });
    res.json(db.prepare('SELECT * FROM stocks WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/stocks/:id', (req, res) => {
  try { db.prepare('DELETE FROM stocks WHERE id=?').run(req.params.id); res.json({ message: 'Lot supprimé' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── RAPPELS ───────────────────────────────────────────────────────────────────
app.get('/api/rappels', (req, res) => {
  try {
    const now = new Date();
    const rows = db.prepare(`SELECT v.*, (p.prenom||' '||p.nom) as patient, p.telephone FROM vaccinations v LEFT JOIN patients p ON v.patientId=p.id WHERE v.dateProchaineDose IS NOT NULL`).all();
    const rappels = rows.map(v => {
      const jours = Math.ceil((new Date(v.dateProchaineDose) - now) / 86400000);
      return { ...hydrateVacc(v), joursRestants: jours, urgent: jours <= 7 && jours >= 0, enRetard: jours < 0 };
    }).filter(v => v.joursRestants <= 30).sort((a, b) => a.joursRestants - b.joursRestants);
    res.json(rappels);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STATS ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  try {
    const { period = 'month', year, month, day, sexe, ageMin, ageMax, wilaya } = req.query;
    const pW = []; const pP = [];
    if (sexe)   { pW.push("sexe = ?");                                                   pP.push(sexe); }
    if (wilaya) { pW.push("wilaya LIKE ?");                                              pP.push(`%${wilaya}%`); }
    if (year)   { pW.push("substr(createdAt,1,4) = ?");                                  pP.push(year); }
    if (month)  { pW.push("substr(createdAt,6,2) = ?");                                  pP.push(pad(month)); }
    if (day)    { pW.push("substr(createdAt,9,2) = ?");                                  pP.push(pad(day)); }
    if (ageMin) { pW.push("(strftime('%Y','now') - strftime('%Y',dateNaissance)) >= ?");  pP.push(+ageMin); }
    if (ageMax) { pW.push("(strftime('%Y','now') - strftime('%Y',dateNaissance)) <= ?");  pP.push(+ageMax); }
    const pSQL = pW.length ? `WHERE ${pW.join(' AND ')}` : '';

    const totalPatients    = db.prepare(`SELECT COUNT(*) as n FROM patients ${pSQL}`).get(...pP).n;
    const parSexe          = db.prepare(`SELECT sexe, COUNT(*) as count FROM patients ${pSQL} GROUP BY sexe`).all(...pP);
    const parAge           = db.prepare(`SELECT CASE WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 1 THEN '< 1 an' WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 5 THEN '1–4' WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 15 THEN '5–14' WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 25 THEN '15–24' WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 40 THEN '25–39' WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 60 THEN '40–59' ELSE '60+' END as tranche, COUNT(*) as count FROM patients ${pSQL} GROUP BY tranche`).all(...pP);
    const parWilaya        = db.prepare(`SELECT COALESCE(wilaya,'Non renseignée') as wilaya, COUNT(*) as count FROM patients ${pSQL} GROUP BY wilaya ORDER BY count DESC LIMIT 10`).all(...pP);
    const parFonction      = db.prepare(`SELECT COALESCE(fonction,'Non renseignée') as fonction, COUNT(*) as count FROM patients ${pSQL} GROUP BY fonction ORDER BY count DESC LIMIT 8`).all(...pP);
    const parGroupeSanguin = db.prepare(`SELECT COALESCE(groupeSanguin,'Inconnu') as groupe, COUNT(*) as count FROM patients ${pSQL} GROUP BY groupe ORDER BY count DESC`).all(...pP);
    const pGrp = period === 'day' ? "substr(createdAt,1,10)" : period === 'year' ? "substr(createdAt,1,4)" : "substr(createdAt,1,7)";
    const patientsParPeriode = db.prepare(`SELECT ${pGrp} as label, COUNT(*) as count FROM patients ${pSQL} GROUP BY label ORDER BY label`).all(...pP);

    const vW = []; const vP = [];
    if (sexe)   { vW.push("p.sexe = ?");                                                    vP.push(sexe); }
    if (wilaya) { vW.push("p.wilaya LIKE ?");                                               vP.push(`%${wilaya}%`); }
    if (year)   { vW.push("substr(v.dateAdministration,1,4) = ?");                          vP.push(year); }
    if (month)  { vW.push("substr(v.dateAdministration,6,2) = ?");                          vP.push(pad(month)); }
    if (day)    { vW.push("substr(v.dateAdministration,9,2) = ?");                          vP.push(pad(day)); }
    if (ageMin) { vW.push("(strftime('%Y','now') - strftime('%Y',p.dateNaissance)) >= ?");  vP.push(+ageMin); }
    if (ageMax) { vW.push("(strftime('%Y','now') - strftime('%Y',p.dateNaissance)) <= ?");  vP.push(+ageMax); }
    const vSQL  = vW.length ? `WHERE ${vW.join(' AND ')}` : '';
    const vJoin = `FROM vaccinations v LEFT JOIN patients p ON v.patientId=p.id`;

    const totalVaccinations     = db.prepare(`SELECT COUNT(*) as n ${vJoin} ${vSQL}`).get(...vP).n;
    const vGrp = period === 'day' ? "substr(v.dateAdministration,1,10)" : period === 'year' ? "substr(v.dateAdministration,1,4)" : "substr(v.dateAdministration,1,7)";
    const vaccinationsParMois   = db.prepare(`SELECT ${vGrp} as mois, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY mois ORDER BY mois`).all(...vP);
    const vaccinationsParVaccin = db.prepare(`SELECT COALESCE(v.vaccin,'Inconnu') as vaccin, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY v.vaccin ORDER BY count DESC`).all(...vP);
    const vaccinationsParType   = db.prepare(`SELECT COALESCE(v.type,'Inconnu') as type, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY v.type ORDER BY count DESC`).all(...vP);
    const vaccinationsParStatut = db.prepare(`SELECT COALESCE(v.statut,'Inconnu') as statut, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY v.statut`).all(...vP);
    const gradeExtra = vW.length ? `${vSQL} AND json_extract(v.protocoleData,'$.grade') IS NOT NULL` : `WHERE json_extract(v.protocoleData,'$.grade') IS NOT NULL`;
    const vaccinationsParGrade  = db.prepare(`SELECT json_extract(v.protocoleData,'$.grade') as grade, COUNT(*) as count ${vJoin} ${gradeExtra} GROUP BY grade ORDER BY grade`).all(...vP);
    const vaccinationsParSexe   = db.prepare(`SELECT COALESCE(p.sexe,'?') as sexe, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY p.sexe`).all(...vP);

    const today = new Date().toISOString().slice(0, 10);
    const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const rappelsProchains      = db.prepare(`SELECT COUNT(*) as n FROM vaccinations WHERE dateProchaineDose IS NOT NULL AND dateProchaineDose >= ? AND dateProchaineDose <= ?`).get(today, in30).n;
    const vaccinationsEnRetard  = db.prepare(`SELECT COUNT(*) as n FROM vaccinations WHERE dateProchaineDose IS NOT NULL AND dateProchaineDose < ? AND statut != 'complete'`).get(today).n;
    const stocks                = db.prepare('SELECT * FROM stocks').all();
    const stocksCritiques       = stocks.filter(s => s.quantiteInitiale > 0 && (s.quantiteRestante / s.quantiteInitiale) <= 0.2).length;
    const stocksPerimes         = stocks.filter(s => s.datePeremption && new Date(s.datePeremption) < new Date()).length;

    res.json({
      totalPatients, totalVaccinations, rappelsProchains, vaccinationsEnRetard,
      stocksCritiques, stocksPerimes, patientsParPeriode, parSexe, parAge, parWilaya,
      parFonction, parGroupeSanguin, vaccinationsParMois, vaccinationsParVaccin,
      vaccinationsParType, vaccinationsParStatut, vaccinationsParGrade, vaccinationsParSexe,
    });
  } catch (err) {
    console.error('❌ /api/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── IMPORT ANTIRAB — chemin fixe (ancien) ────────────────────────────────────
app.get('/api/settings', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM app_settings WHERE id = ?').get('default');
    res.json(hydrateSettings(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', (req, res) => {
  try {
    const payload = hydrateSettings(req.body || {});
    db.prepare(`
      INSERT INTO app_settings (id, langue, theme, notificationsEmail, notificationsPush, affichageRappels, updatedAt)
      VALUES ('default', @langue, @theme, @notificationsEmail, @notificationsPush, @affichageRappels, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        langue = excluded.langue,
        theme = excluded.theme,
        notificationsEmail = excluded.notificationsEmail,
        notificationsPush = excluded.notificationsPush,
        affichageRappels = excluded.affichageRappels,
        updatedAt = excluded.updatedAt
    `).run({
      ...payload,
      notificationsEmail: payload.notificationsEmail ? 1 : 0,
      notificationsPush: payload.notificationsPush ? 1 : 0,
      affichageRappels: payload.affichageRappels ? 1 : 0,
      updatedAt: new Date().toISOString(),
    });
    res.json(hydrateSettings(db.prepare('SELECT * FROM app_settings WHERE id = ?').get('default')));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/support/tickets', (req, res) => {
  try { res.json(db.prepare('SELECT * FROM support_tickets ORDER BY createdAt DESC').all()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/support-tickets', (req, res) => {
  try {
    const { statut } = req.query;
    const rows = statut
      ? db.prepare('SELECT * FROM support_tickets WHERE statut=? ORDER BY createdAt DESC').all(statut)
      : db.prepare('SELECT * FROM support_tickets ORDER BY createdAt DESC').all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/support/tickets', (req, res) => {
  try {
    const now = new Date().toISOString();
    const ticket = {
      id: uuidv4(),
      titre: normalizeText(req.body?.titre),
      description: normalizeText(req.body?.description),
      categorie: normalizeText(req.body?.categorie) || 'Question',
      priorite: normalizeText(req.body?.priorite) || 'normal',
      statut: 'ouvert',
      createdAt: now,
      updatedAt: now,
    };
    if (!ticket.titre || !ticket.description) {
      return res.status(400).json({ error: 'Titre et description requis.' });
    }
    db.prepare(`
      INSERT INTO support_tickets (id, titre, description, categorie, priorite, statut, createdAt, updatedAt)
      VALUES (@id, @titre, @description, @categorie, @priorite, @statut, @createdAt, @updatedAt)
    `).run(ticket);
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/support-tickets', (req, res) => {
  try {
    const now = new Date().toISOString();
    const ticket = {
      id: uuidv4(),
      titre: normalizeText(req.body?.titre),
      description: normalizeText(req.body?.description),
      categorie: normalizeText(req.body?.categorie) || 'Question',
      priorite: normalizeText(req.body?.priorite) || 'normal',
      statut: 'ouvert',
      createdAt: now,
      updatedAt: now,
    };
    if (!ticket.titre || !ticket.description) {
      return res.status(400).json({ error: 'Titre et description requis.' });
    }
    db.prepare(`
      INSERT INTO support_tickets (id, titre, description, categorie, priorite, statut, createdAt, updatedAt)
      VALUES (@id, @titre, @description, @categorie, @priorite, @statut, @createdAt, @updatedAt)
    `).run(ticket);
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/support-tickets/:id', (req, res) => {
  try {
    const statut = normalizeText(req.body?.statut) || 'ouvert';
    const updatedAt = new Date().toISOString();
    db.prepare('UPDATE support_tickets SET statut=?, updatedAt=? WHERE id=?').run(statut, updatedAt, req.params.id);
    res.json(db.prepare('SELECT * FROM support_tickets WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/help/articles', (req, res) => {
  try {
    const { search = '', categorie = '' } = req.query;
    const clauses = [];
    const params = [];
    if (categorie) {
      clauses.push('categorie = ?');
      params.push(categorie);
    }
    if (search) {
      const s = `%${String(search).toLowerCase()}%`;
      clauses.push('(lower(titre) LIKE ? OR lower(contenu) LIKE ? OR lower(categorie) LIKE ?)');
      params.push(s, s, s);
    }
    const whereSql = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM help_articles${whereSql} ORDER BY createdAt DESC, titre ASC`).all(...params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/help-articles', (req, res) => {
  try {
    const { search = '', categorie = '' } = req.query;
    const clauses = [];
    const params = [];
    if (search) {
      const s = `%${String(search).toLowerCase()}%`;
      clauses.push('(lower(titre) LIKE ? OR lower(contenu) LIKE ?)');
      params.push(s, s);
    }
    if (categorie) {
      clauses.push('categorie = ?');
      params.push(categorie);
    }
    const whereSql = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM help_articles${whereSql} ORDER BY createdAt DESC`).all(...params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/help/articles/:id/feedback', (req, res) => {
  try {
    const article = db.prepare('SELECT id FROM help_articles WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article introuvable.' });
    db.prepare(`
      INSERT INTO help_feedback (id, articleId, feedbackType, createdAt)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, normalizeText(req.body?.type) || 'useful', new Date().toISOString());
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/help-articles/:id/feedback', (req, res) => {
  try {
    const article = db.prepare('SELECT id FROM help_articles WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article introuvable.' });
    db.prepare(`
      INSERT INTO help_feedback (id, articleId, feedbackType, createdAt)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, normalizeText(req.body?.type) || 'useful', new Date().toISOString());
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/map/communes', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        COALESCE(NULLIF(trim(commune), ''), 'Non specifiee') as commune,
        COUNT(*) as count,
        SUM(CASE WHEN sexe = 'M' THEN 1 ELSE 0 END) as hommes,
        SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END) as femmes
      FROM patients
      GROUP BY COALESCE(NULLIF(trim(commune), ''), 'Non specifiee')
      ORDER BY count DESC, commune ASC
    `).all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/import-antirab', async (req, res) => {
  try {
    const workbookPath = path.join(__dirname, 'ANTIRAB base de donnée.xlsx');
    let rows;
    try { rows = await readAntirabWorkbook(workbookPath); }
    catch { rows = await readExcelWithXlsx(workbookPath); }
    if (!rows.length) return res.status(400).json({ error: 'Le fichier ANTIRAB est vide.' });
    const result = importRowsIntoDB(rows);
    res.json({ message: 'Import ANTIRAB termine.', ...result });
  } catch (err) {
    console.error('Import ANTIRAB error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── IMPORT ANTIRAB — upload fichier (NOUVEAU) ─────────────────────────────────
app.post('/api/import-antirab-upload', upload.single('file'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni.' });
    console.log(`📂 Fichier recu: ${req.file.originalname} (${req.file.size} bytes)`);

    let result;
    const workbook = await readWorkbookWithXlsx(filePath);
    if (isExportedWorkbook(workbook)) {
      result = importExportedWorkbookIntoDB(workbook);
    } else {
      let rows;
      // Tenter d'abord PowerShell (Windows), sinon fallback xlsx Node
      try { rows = await readAntirabWorkbook(filePath); }
      catch (psErr) {
        console.log(`PowerShell non disponible (${psErr.message}), utilisation de xlsx...`);
        rows = await readExcelWithXlsx(filePath);
      }

      if (!rows || rows.length === 0) return res.status(400).json({ error: 'Le fichier est vide ou illisible.' });
      result = importRowsIntoDB(rows);
    }

    console.log(`✅ Import termine: ${result.importedPatients} patients, ${result.importedVaccinations} vaccinations`);
    res.json({ message: 'Import termine avec succes.', ...result });
  } catch (err) {
    console.error('❌ Import upload error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Supprimer le fichier temporaire
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});

// ── DIVERS ────────────────────────────────────────────────────────────────────
app.get('/api/vaccins-disponibles', (req, res) => {
  res.json(['Anti-Rabique Tissulaire','Anti-Rabique Cellulaire','Hépatite B','DT','BCG','ROR','Grippe','COVID-19']);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  (email === 'serviceepi@chu-tlemcen.dz' && password === 'Admin2026')
    ? res.json({ token: 'fake-jwt', user: { email, nom: 'Service Epidemiologie' } })
    : res.status(401).json({ error: 'Identifiants invalides' });
});

// ── PDF ───────────────────────────────────────────────────────────────────────
const calcAge = (value) => {
  if (!value) return '';
  try {
    const dob = new Date(String(value).split('T')[0]);
    if (Number.isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const beforeBirthday = today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
    if (beforeBirthday) age -= 1;
    return String(age);
  } catch { return ''; }
};
const fmtDate = (value) => {
  if (!value) return '';
  try {
    const raw = String(value).split('T')[0];
    const [y, m, d] = raw.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    return String(value);
  } catch { return String(value); }
};

const COORDS_ORDONNANCE = {
  date:          { x: 460, y: 636, size: 9 },
  nomPatient:    { x: 400, y: 619, size: 10 },
  dateNaissance: { x: 210, y: 603, size: 9 },
  nImmat:        { x: 395, y: 583, size: 9 },
  rx: [
    { x: 30, y: 544, size: 10 },
    { x: 30, y: 525, size: 10 },
    { x: 30, y: 506, size: 10 },
    { x: 30, y: 487, size: 10 },
    { x: 30, y: 468, size: 10 },
    { x: 30, y: 449, size: 10 },
  ],
  obs: [
    { x: 30, y: 420, size: 9 },
    { x: 30, y: 409, size: 9 },
  ],
  medecin: { x: 30, y: 103, size: 9 },
};

const COORDS_DT_P1 = {
  nom:      { x: 220, y: 412, size: 11 },
  prenom:   { x: 250, y: 381, size: 11 },
  age:      { x: 150, y: 338, size: 11 },
  adresse:  { x: 280, y: 304, size: 10 },
  fonction: { x: 290, y: 268, size: 10 },
};

const COORDS_DT_P2 = {
  dose1:   { x: 350, y: 592, size: 10 },
  dose2m:  { x: 370, y: 532, size: 10 },
  dose1an: { x: 365, y: 470, size: 10 },
  dose10:  { x: 395, y: 410, size: 10 },
  medecin: { x: 640, y: 290, size: 9 },
};

async function buildDtPdf(payload) {
  const templatePath = path.join(__dirname, 'carte_vaccination_DT.pdf');
  const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const DATE_BASELINE_SHIFT = -1.25;

  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  const p2 = pages[1];

  const patient = payload.patient || {};
  const vacc = payload.vaccination || {};
  const proto = payload.protocoleData || {};

  const draw = (pg, text, x, y, size = 10, isBold = false, maxWidth = 350) => {
    if (!pg || !text) return;
    let t = String(text);
    const f = isBold ? bold : font;
    while (t.length > 1 && f.widthOfTextAtSize(t, size) > maxWidth) {
      t = t.slice(0, -1);
    }
    pg.drawText(t, { x, y, size, font: f, color: rgb(0, 0, 0) });
  };
  const drawDate = (pg, value, x, y, size = 10, maxWidth = 350) => {
    if (!value) return;
    draw(pg, fmtDate(value), x, y + DATE_BASELINE_SHIFT, size, false, maxWidth);
  };

  draw(p1, patient.nom || '', COORDS_DT_P1.nom.x, COORDS_DT_P1.nom.y, COORDS_DT_P1.nom.size, false, 300);
  draw(p1, patient.prenom || '', COORDS_DT_P1.prenom.x, COORDS_DT_P1.prenom.y, COORDS_DT_P1.prenom.size, false, 300);

  const ageStr = patient.dateNaissance
    ? `${calcAge(patient.dateNaissance)} ans`
    : (patient.age ? `${patient.age} ans` : '');
  draw(p1, ageStr, COORDS_DT_P1.age.x, COORDS_DT_P1.age.y, COORDS_DT_P1.age.size, false, 100);

  const adresse = [patient.adressePrecise, patient.adresse, patient.commune, patient.wilaya]
    .filter(Boolean).join(', ');
  draw(p1, adresse, COORDS_DT_P1.adresse.x, COORDS_DT_P1.adresse.y, COORDS_DT_P1.adresse.size, false, 310);
  draw(p1, patient.fonction || patient.profession || '', COORDS_DT_P1.fonction.x, COORDS_DT_P1.fonction.y, COORDS_DT_P1.fonction.size, false, 300);

  const dtDates = proto.dates || {};
  const d1 = dtDates.D1 || vacc.dateAdministration || '';
  drawDate(p2, d1, COORDS_DT_P2.dose1.x, COORDS_DT_P2.dose1.y, COORDS_DT_P2.dose1.size);
  drawDate(p2, dtDates.D2 || '', COORDS_DT_P2.dose2m.x, COORDS_DT_P2.dose2m.y, COORDS_DT_P2.dose2m.size);
  drawDate(p2, dtDates.D3 || dtDates.Rappel || '', COORDS_DT_P2.dose1an.x, COORDS_DT_P2.dose1an.y, COORDS_DT_P2.dose1an.size);

  let rappelDecennal = dtDates.Rappel10 || '';
  if (!rappelDecennal && d1) {
    try {
      const d = new Date(d1);
      d.setFullYear(d.getFullYear() + 10);
      rappelDecennal = d.toISOString().slice(0, 10);
    } catch {}
  }
  drawDate(p2, rappelDecennal, COORDS_DT_P2.dose10.x, COORDS_DT_P2.dose10.y, COORDS_DT_P2.dose10.size);

  const medecinDT = proto.medecin || vacc.medecin || '';
  draw(p2, medecinDT ? `Dr. ${medecinDT}` : '', COORDS_DT_P2.medecin.x, COORDS_DT_P2.medecin.y, COORDS_DT_P2.medecin.size, true, 150);

  return pdfDoc.save();
}

async function buildVaccinationPdf(payload) {
  const type    = payload.type || payload.vaccination?.type || 'rage';
  if (type === 'dt') return buildDtPdf(payload);

  const templatePath = path.join(__dirname, 'carte_de_vaccination_z.pdf');
  const pdfDoc  = await PDFDocument.load(fs.readFileSync(templatePath));
  const font    = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages   = pdfDoc.getPages();
  const p1      = pages[0];
  const p2      = pages[1];

  const patient = payload.patient    || {};
  const vacc    = payload.vaccination || {};
  const proto   = payload.protocoleData || {};
  const mpvi    = proto.mpvi || {};

  const draw = (pg, text, x, y, size = 9, isBold = false, maxW = 0) => {
    if (!pg || text === null || text === undefined || text === '') return;
    let t = String(text);
    const f = isBold ? bold : font;
    if (maxW > 0) while (t.length > 1 && f.widthOfTextAtSize(t, size) > maxW) t = t.slice(0, -1);
    pg.drawText(t, { x, y, size, font: f, color: rgb(0, 0, 0) });
  };
  const DATE_BASELINE_SHIFT = -1.25;
  const drawDate = (pg, value, x, y, size = 8, maxW = 0) => {
    if (!pg || value === null || value === undefined || value === '') return;
    draw(pg, fmtDate(value), x, y + DATE_BASELINE_SHIFT, size, false, maxW);
  };
  const dot = (pg, x, y, r = 4) => {
    if (!pg) return;
    pg.drawCircle({ x, y, size: r, color: rgb(0,0,0), borderColor: rgb(0,0,0), borderWidth: 0.3 });
  };
  const drawLines = (pg, text, x, y, size, maxW, lineH = 10) => {
    if (!text) return;
    const words = String(text).split(' ');
    let line = ''; let cy = y;
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) > maxW && line) {
        draw(pg, line, x, cy, size, false, maxW); cy -= lineH; line = w;
      } else { line = candidate; }
    }
    if (line) draw(pg, line, x, cy, size, false, maxW);
  };

  const nomPrenom = `${patient.prenom||''} ${patient.nom||''}`.trim();
  const adresse   = [patient.adressePrecise, patient.adresse].filter(Boolean).join(', ');

  draw(p1, nomPrenom,                                     400, 182, 9, false, 175);
  draw(p1, calcAge(patient.dateNaissance),                400, 165, 9);
  draw(p1, patient.poids ? `${patient.poids} Kg` : '',   460, 165, 9);
  draw(p1, adresse.slice(0, 62),                          356, 148, 8, false, 218);
  if (adresse.length > 62) draw(p1, adresse.slice(62, 120), 314, 138, 8, false, 258);
  drawDate(p1, proto.dateExposition || vacc.dateAdministration, 405, 113, 9, 168);

  const gradeCx = { 'Grade I': 380, 'Grade II': 466, 'Grade III': 554 };
  if (gradeCx[proto.grade]) dot(p1, gradeCx[proto.grade], 86, 4);
  draw(p1, proto.medecin || '', 270, 76, 8, false, 82);

  const obs = proto.observations || '';
  if (obs) {
    draw(p1, obs.slice(0, 55),    30, 56, 8, false, 202);
    if (obs.length > 55)  draw(p1, obs.slice(55, 110),  30, 45, 8, false, 202);
    if (obs.length > 110) draw(p1, obs.slice(110, 165), 30, 34, 8, false, 202);
  }

  const TABLE_ROWS = {
    J0:{y:361},J1:{y:353},J2:{y:345},J3:{y:337},J4:{y:329},J5:{y:321},J6:{y:313},
    J10:{y:297},J14:{y:289},J24:{y:281},J29:{y:273},J34:{y:265},J90:{y:257},
  };

  if (type === 'rage') {
    const datesVAR = proto.datesVAR || {};
    const grade    = proto.grade || 'Grade II';
    const colX     = (grade === 'Grade III') ? 183 : 97;
    const labelToRow = { 'J0':'J0','J3':'J3','J7':'J5','J14':'J14','J28':'J29','J30':'J29','J90':'J90','J29':'J29','J34':'J34' };
    Object.entries(datesVAR).forEach(([label, dateVal]) => {
      if (!dateVal) return;
      const rowKey = labelToRow[label] || label;
      const rowDef = TABLE_ROWS[rowKey];
      if (!rowDef) return;
      drawDate(p1, dateVal, colX, rowDef.y, 7.5, 80);
    });
  }

  const terrain = patient.maladiesChroniques || patient.antecedents || '';
  draw(p2, terrain.slice(0, 50),                    135, 397, 8, false, 150);
  if (terrain.length > 50) draw(p2, terrain.slice(50, 100), 21, 386, 8, false, 286);

  const expo = String(proto.circonstancesMorsure || '').toLowerCase();
  if      (expo.includes('morsure'))                               dot(p2, 117, 369, 4);
  else if (expo.includes('griff'))                                 dot(p2, 177, 369, 4);
  else if (expo.includes('lechage') || expo.includes('léchage'))  dot(p2, 231, 369, 4);

  const locStr = Array.isArray(proto.localisationPlaies) ? proto.localisationPlaies.join(', ') : (proto.localisationPlaies || '');
  draw(p2, locStr, 101, 350, 8, false, 183);

  const espece = String(proto.especeAnimale || '').toLowerCase();
  if      (espece === 'chien') dot(p2, 29, 330, 4);
  else if (espece === 'chat')  dot(p2, 110, 330, 4);
  else if (espece === 'autre') { dot(p2, 180, 330, 4); draw(p2, proto.especeAnimalePrecise||'', 228, 326, 8, false, 65); }

  dot(p2, proto.soinsLocaux ? 112 : 180, 285, 4);
  dot(p2, proto.erig ? 114 : 190, 265, 4);

  if (proto.erig) {
    drawDate(p2, proto.erigDate,                              136, 246, 8, 152);
    draw(p2, proto.erigQuantiteTotale ? `${proto.erigQuantiteTotale} ml` : '', 144, 232, 8, false, 122);
    draw(p2, proto.erigQuantiteIM ? `${proto.erigQuantiteIM} ml` : '',         162, 204, 8, false, 54);
    draw(p2, proto.erigLot || '',                              56, 190, 8, false, 222);
    drawDate(p2, proto.erigPeremption,                        124, 174, 8, 152);

    // III.4 Suture
    if (proto.suture) {
      dot(p2, 110, 245, 4);
      if (proto.sutureDetail && proto.sutureDetail.toLowerCase().includes('avant')) dot(p2, 130, 235, 4);
      else if (proto.sutureDetail) dot(p2, 200, 235, 4);
    } else {
      dot(p2, 175, 245, 4);
    }
  }

  dot(p2, proto.varType === 'cellulaire' ? 142 : 200, 157, 4);
  drawDate(p2, vacc.dateAdministration,  133, 137, 8, 152);
  draw(p2, proto.varLot || proto.lot || '',    56, 122, 8, false, 222);
  drawDate(p2, proto.varPeremption || proto.peremption, 124, 106, 8, 152);

  // Voie VAR
  const varVoie = String(proto.varVoieAdmin || proto.varVoie || '').toLowerCase();
  if (varVoie.includes('sous')) dot(p2, 130, 170, 4);
  else if (varVoie.includes('intra d') || varVoie.includes('derm')) dot(p2, 160, 162, 4);
  else dot(p2, 150, 154, 4); // intra musculaire par défaut

  // Dose de base tissulaire
  if (proto.varDoseBase) draw(p2, proto.varDoseBase, 100, 145, 8, false, 80);

  const hasDT = (type === 'dt');
  dot(p2, hasDT ? 143 : 225, 67, 4);
  dot(p2, proto.antibiotique ? 139 : 225, 35, 4);

  if (type === 'rage' && proto.varType === 'cellulaire') {
    const datesVAR = proto.datesVAR || {};
    const protocole = proto.cellulProtocole || 'ESSEN';
    if (protocole === 'ZAGREB') {
      const zagrebMap = { 'J0 (2 sites)':{x:394,y:366},'J7':{x:394,y:336},'J21':{x:394,y:304},'Rappel (J90)':{x:394,y:280} };
      Object.entries(datesVAR).forEach(([label, dateVal]) => {
        const coord = zagrebMap[label];
        if (coord && dateVal) drawDate(p2, dateVal, coord.x, coord.y, 7.5, 85);
      });
    } else {
      const essenMap = { 'J0':{x:488,y:366},'J3':{x:488,y:354},'J7':{x:488,y:336},'J14':{x:488,y:320},'J28':{x:488,y:304} };
      Object.entries(datesVAR).forEach(([label, dateVal]) => {
        const coord = essenMap[label];
        if (coord && dateVal) drawDate(p2, dateVal, coord.x, coord.y, 7.5, 85);
      });
    }
  }

  if (mpvi.mpviMineur === 'oui' || mpvi.mpviMajeur === 'oui') {
    let mpviY = 220;
    if (mpvi.mpviMineur === 'oui') {
      draw(p2, 'MPVI Mineur:', 314, mpviY, 7.5, true, 265); mpviY -= 10;
      const types = (mpvi.mpviMineurTypes || []).join(', ') || mpvi.mpviMineurAutre || '';
      if (types) { drawLines(p2, types, 314, mpviY, 7, 265, 9); mpviY -= 18; }
    }
    if (mpvi.mpviMajeur === 'oui') {
      draw(p2, 'MPVI MAJEUR:', 314, mpviY, 7.5, true, 265); mpviY -= 10;
      const types = (mpvi.mpviMajeurTypes || []).join(', ') || mpvi.mpviMajeurAutre || '';
      if (types) { drawLines(p2, types, 314, mpviY, 7, 265, 9); }
    }
  }

  if (type !== 'rage') {
    const lines = [];
    if (type === 'grippe')  lines.push(`Grippe ${proto.saison||''} — ${proto.souche||''} | ${proto.marque||''} | Lot: ${proto.lot||'-'}`);
    else if (type === 'hepb')    lines.push(`Hepatite B — Schema: ${proto.schema||'-'} | ${proto.marque||''} | Lot: ${proto.lot||'-'}`);
    else if (type === 'dt')      lines.push(`DT — Schema: ${proto.schema||'-'} | ${proto.marque||''} | Lot: ${proto.lot||'-'}`);
    else if (type === 'pneumo')  lines.push(`Pneumocoque — ${proto.typeVaccin||''} | ${proto.numeroDose||'-'} | Lot: ${proto.lot||'-'}`);
    else if (type === 'meningo') lines.push(`Meningocoque — ${proto.typeVaccin||''} | ${proto.numeroDose||'-'} | Lot: ${proto.lot||'-'}`);
    if (proto.observations) lines.push(`Obs: ${proto.observations}`);
    lines.slice(0, 3).forEach((line, i) => draw(p1, line, 30, 56 - i * 11, 8, false, 202));
    drawDate(p2, vacc.dateAdministration, 133, 137, 8, 152);
    draw(p2, proto.lot || '', 56, 122, 8, false, 222);
    drawDate(p2, proto.peremption, 124, 106, 8, 152);
    draw(p2, `Vaccin: ${vacc.vaccin || type}`, 38, 147, 8, false, 265);
  }

  return pdfDoc.save();
}

async function buildOrdonnancePdf(payload) {
  const templatePath = path.join(__dirname, 'ordonnance_haute_qualite.pdf');
  const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];
  const patient = payload.patient || {};
  const ordonnance = payload.ordonnance || {};
  const meds = Array.isArray(ordonnance.medicaments) ? ordonnance.medicaments : [];
  const rawPatientAge = normalizeText(patient.age);
  const patientAge = rawPatientAge
    ? (/\bans?\b/i.test(rawPatientAge) ? rawPatientAge : `${rawPatientAge} ans`)
    : (patient.dateNaissance ? `${calcAge(patient.dateNaissance)} ans` : '');

  const draw = (text, x, y, size = 10, isBold = false, maxW = 0) => {
    if (text === null || text === undefined || text === '') return;
    let t = String(text);
    const f = isBold ? bold : font;
    if (maxW > 0) while (t.length > 1 && f.widthOfTextAtSize(t, size) > maxW) t = t.slice(0, -1);
    page.drawText(t, { x, y, size, font: f, color: rgb(0, 0, 0) });
  };
  const drawLines = (text, x, y, size, maxW, lineH = 12, maxLines = 3) => {
    if (!text) return;
    const words = String(text).split(' ');
    let line = '';
    let cy = y;
    let lines = 0;
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) > maxW && line) {
        draw(line, x, cy, size, false, maxW);
        cy -= lineH;
        line = w;
        lines += 1;
        if (lines >= maxLines) return;
      } else {
        line = candidate;
      }
    }
    if (line && lines < maxLines) draw(line, x, cy, size, false, maxW);
  };

  const dateOrd = ordonnance.date
    ? fmtDate(ordonnance.date)
    : fmtDate(new Date().toISOString().slice(0, 10));
  draw(dateOrd, COORDS_ORDONNANCE.date.x, COORDS_ORDONNANCE.date.y, COORDS_ORDONNANCE.date.size);

  const nomComplet = `${patient.prenom || ''} ${patient.nom || ''}`.trim();
  draw(nomComplet, COORDS_ORDONNANCE.nomPatient.x, COORDS_ORDONNANCE.nomPatient.y, COORDS_ORDONNANCE.nomPatient.size, false, 160);

  const dateNaiss = patient.dateNaissance
    ? `${fmtDate(patient.dateNaissance)}${patientAge ? `  (${patientAge})` : ''}`
    : patientAge;
  draw(dateNaiss, COORDS_ORDONNANCE.dateNaissance.x, COORDS_ORDONNANCE.dateNaissance.y, COORDS_ORDONNANCE.dateNaissance.size, false, 350);

  draw(patient.numeroCNAS || patient.nImmat || '', COORDS_ORDONNANCE.nImmat.x, COORDS_ORDONNANCE.nImmat.y, COORDS_ORDONNANCE.nImmat.size, false, 180);

  meds.slice(0, 6).forEach((med, i) => {
    if (!med.nom) return;
    const coord = COORDS_ORDONNANCE.rx[i];
    const parts = [med.nom];
    if (med.dosage) parts.push(med.dosage);
    if (med.duree) parts.push(med.duree);
    const ligne = `Rx ${i + 1}:  ${parts.join('   -   ')}`;
    draw(ligne, coord.x, coord.y, coord.size, false, 530);

    if (med.instructions && i < 5) {
      draw(`        ${med.instructions}`, coord.x, coord.y - 10, 8, false, 530);
    }
  });

  if (ordonnance.observations) {
    const obs = ordonnance.observations;
    draw(obs.slice(0, 90), COORDS_ORDONNANCE.obs[0].x, COORDS_ORDONNANCE.obs[0].y, COORDS_ORDONNANCE.obs[0].size, false, 530);
    if (obs.length > 90) {
      draw(obs.slice(90, 180), COORDS_ORDONNANCE.obs[1].x, COORDS_ORDONNANCE.obs[1].y, COORDS_ORDONNANCE.obs[1].size, false, 530);
    }
  }

  const medecinLabel = ordonnance.medecin ? `Dr. ${ordonnance.medecin}` : '';
  draw(medecinLabel, COORDS_ORDONNANCE.medecin.x, COORDS_ORDONNANCE.medecin.y, COORDS_ORDONNANCE.medecin.size, true, 200);

  return pdfDoc.save();
}

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const pdfBytes = await buildVaccinationPdf(req.body);
    const { type = 'rage', patient = {} } = req.body;
    const fname = `carte_${type}_${patient.nom||'patient'}_${patient.prenom||''}.pdf`
      .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    res.set({ 'Content-Type':'application/pdf', 'Content-Disposition':`attachment; filename="${fname}"`, 'Content-Length':pdfBytes.length });
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('❌ PDF error:', err?.message);
    res.status(500).json({ error: 'Erreur PDF', detail: err.message });
  }
});

app.post('/api/generate-ordonnance-pdf', async (req, res) => {
  try {
    const pdfBytes = await buildOrdonnancePdf(req.body);
    const { patient = {} } = req.body;
    const fname = `ordonnance_${patient.nom||'patient'}_${patient.prenom||''}.pdf`
      .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    res.set({ 'Content-Type':'application/pdf', 'Content-Disposition':`attachment; filename="${fname}"`, 'Content-Length':pdfBytes.length });
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('❌ Ordonnance PDF error:', err?.message);
    res.status(500).json({ error: 'Erreur PDF ordonnance', detail: err.message });
  }
});

app.post('/api/generate-dt-pdf', async (req, res) => {
  try {
    const pdfBytes = await buildDtPdf(req.body);
    const { patient = {} } = req.body;
    const fname = `carte_DT_${patient.nom || 'patient'}_${patient.prenom || ''}.pdf`
      .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fname}"`,
      'Content-Length': pdfBytes.length,
    });
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('❌ DT PDF error:', err?.message);
    res.status(500).json({ error: 'Erreur PDF carte DT', detail: err.message });
  }
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const np = db.prepare('SELECT COUNT(*) as n FROM patients').get().n;
  const nv = db.prepare('SELECT COUNT(*) as n FROM vaccinations').get().n;
  const ns = db.prepare('SELECT COUNT(*) as n FROM stocks').get().n;
  console.log(`🏥 VacciTrack: http://localhost:${PORT}`);
  console.log(`📊 ${np} patients · ${nv} vaccinations · ${ns} stocks`);
  console.log(`📂 Import Excel disponible: POST /api/import-antirab-upload`);
});

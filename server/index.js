// server.js — VacciTrack avec better-sqlite3 (SQLite natif synchrone)
const express    = require('express');
const cors       = require('cors');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
const path       = require('path');
const fs         = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { initDB } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const db = initDB();

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad      = v => v ? String(v).padStart(2, '0') : null;
const fromJSON = v => { try { return v ? JSON.parse(v) : null; } catch { return null; } };
const hydrateVacc = v => v ? { ...v, protocoleData: fromJSON(v.protocoleData) } : null;
const hydrateOrd  = o => o ? { ...o, medicaments: fromJSON(o.medicaments) }     : null;

// ── PATIENTS ──────────────────────────────────────────────────────────────────
app.get('/api/patients', (req, res) => {
  try {
    const { search } = req.query;
    let rows;
    if (search) {
      const s = `%${search.toLowerCase()}%`;
      rows = db.prepare(
        `SELECT * FROM patients
         WHERE lower(nom) LIKE ? OR lower(prenom) LIKE ? OR lower(email) LIKE ?
         ORDER BY createdAt DESC`
      ).all(s, s, s);
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
    const vaccinations = db.prepare(
      'SELECT * FROM vaccinations WHERE patientId=? ORDER BY dateAdministration DESC'
    ).all(req.params.id).map(hydrateVacc);
    res.json({ ...patient, vaccinations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/patients ────────────────────────────────────────────────────────
app.post('/api/patients', (req, res) => {
  try {
    const p = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO patients
        (id,nom,prenom,dateNaissance,sexe,telephone,email,adresse,wilaya,daira,commune,
         adressePrecise,groupeSanguin,poids,fonction,service,profession,instruction,
         antecedents,allergies,maladiesChroniques,traitementEnCours,contreIndications,
         fumeur,alcool,activitePhysique,mutuelle,numeroCNAS,medecinTraitant,notesClinicien,
         createdAt)
      VALUES
        (@id,@nom,@prenom,@dateNaissance,@sexe,@telephone,@email,@adresse,@wilaya,@daira,
         @commune,@adressePrecise,@groupeSanguin,@poids,@fonction,@service,@profession,@instruction,
         @antecedents,@allergies,@maladiesChroniques,@traitementEnCours,@contreIndications,
         @fumeur,@alcool,@activitePhysique,@mutuelle,@numeroCNAS,@medecinTraitant,@notesClinicien,
         @createdAt)
    `).run({
      id:p.id, nom:p.nom, prenom:p.prenom, dateNaissance:p.dateNaissance||null,
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
    console.log(`✅ Nouveau patient: ${p.prenom} ${p.nom}`);
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/patients/:id ─────────────────────────────────────────────────────
app.put('/api/patients/:id', (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE patients SET
        nom=@nom, prenom=@prenom, dateNaissance=@dateNaissance, sexe=@sexe,
        telephone=@telephone, email=@email, adresse=@adresse,
        wilaya=@wilaya, daira=@daira, commune=@commune, adressePrecise=@adressePrecise,
        groupeSanguin=@groupeSanguin, poids=@poids,
        fonction=@fonction, service=@service, profession=@profession, instruction=@instruction,
        antecedents=@antecedents, allergies=@allergies,
        maladiesChroniques=@maladiesChroniques, traitementEnCours=@traitementEnCours,
        contreIndications=@contreIndications, fumeur=@fumeur, alcool=@alcool,
        activitePhysique=@activitePhysique, mutuelle=@mutuelle,
        numeroCNAS=@numeroCNAS, medecinTraitant=@medecinTraitant,
        notesClinicien=@notesClinicien
      WHERE id=@id
    `).run({
      id:req.params.id, nom:b.nom, prenom:b.prenom,
      dateNaissance:b.dateNaissance||null, sexe:b.sexe||'M',
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
    const p = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
    db.prepare('DELETE FROM vaccinations WHERE patientId=?').run(req.params.id);
    db.prepare('DELETE FROM patients WHERE id=?').run(req.params.id);
    console.log(`🗑️ Supprimé: ${p?.prenom} ${p?.nom}`);
    res.json({ message: 'Patient supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── VACCINATIONS ──────────────────────────────────────────────────────────────
app.get('/api/vaccinations', (req, res) => {
  try {
    const { patientId } = req.query;
    const join = `SELECT v.*, (p.prenom||' '||p.nom) as patient
                  FROM vaccinations v LEFT JOIN patients p ON v.patientId=p.id`;
    const rows = patientId
      ? db.prepare(`${join} WHERE v.patientId=? ORDER BY v.dateAdministration DESC`).all(patientId)
      : db.prepare(`${join} ORDER BY v.dateAdministration DESC`).all();
    res.json(rows.map(hydrateVacc));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vaccinations', (req, res) => {
  try {
    const v = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO vaccinations
        (id,patientId,type,vaccin,dose,statut,dateAdministration,dateProchaineDose,protocoleData,createdAt)
      VALUES
        (@id,@patientId,@type,@vaccin,@dose,@statut,
         @dateAdministration,@dateProchaineDose,@protocoleData,@createdAt)
    `).run({
      id:v.id, patientId:v.patientId, type:v.type||null, vaccin:v.vaccin||null,
      dose:v.dose||null, statut:v.statut||'complete',
      dateAdministration:v.dateAdministration||null,
      dateProchaineDose:v.dateProchaineDose||null,
      protocoleData:v.protocoleData ? JSON.stringify(v.protocoleData) : null,
      createdAt:v.createdAt,
    });

    // Déduire stock automatiquement
    const match = db.prepare(
      `SELECT * FROM stocks WHERE lower(vaccin) LIKE ? AND quantiteRestante > 0 LIMIT 1`
    ).get(`%${(v.vaccin||'').split(' ')[0].toLowerCase()}%`);
    if (match) {
      db.prepare('UPDATE stocks SET quantiteRestante = quantiteRestante - 1 WHERE id=?').run(match.id);
    }

    console.log(`✅ Vaccination enregistrée: ${v.vaccin||v.type}`);
    res.status(201).json(hydrateVacc(db.prepare('SELECT * FROM vaccinations WHERE id=?').get(v.id)));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/vaccinations/:id', (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE vaccinations SET
        type=@type, vaccin=@vaccin, dose=@dose, statut=@statut,
        dateAdministration=@dateAdministration,
        dateProchaineDose=@dateProchaineDose,
        protocoleData=@protocoleData
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
    const join = `SELECT o.*, (p.prenom||' '||p.nom) as patientNom
                  FROM ordonnances o LEFT JOIN patients p ON o.patientId=p.id`;
    const rows = patientId
      ? db.prepare(`${join} WHERE o.patientId=? ORDER BY o.createdAt DESC`).all(patientId)
      : db.prepare(`${join} ORDER BY o.createdAt DESC`).all();
    res.json(rows.map(hydrateOrd));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ordonnances', (req, res) => {
  try {
    const o = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO ordonnances (id,patientId,date,medecin,diagnostic,observations,medicaments,createdAt)
      VALUES (@id,@patientId,@date,@medecin,@diagnostic,@observations,@medicaments,@createdAt)
    `).run({
      id:o.id, patientId:o.patientId, date:o.date||null, medecin:o.medecin||null,
      diagnostic:o.diagnostic||null, observations:o.observations||null,
      medicaments:o.medicaments ? JSON.stringify(o.medicaments) : null,
      createdAt:o.createdAt,
    });
    res.status(201).json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/ordonnances/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM ordonnances WHERE id=?').run(req.params.id);
    res.json({ message: 'Ordonnance supprimée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STOCKS ────────────────────────────────────────────────────────────────────
app.get('/api/stocks', (req, res) => {
  try { res.json(db.prepare('SELECT * FROM stocks ORDER BY vaccin').all()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stocks', (req, res) => {
  try {
    const s = { id: uuidv4(), ...req.body };
    db.prepare(`
      INSERT INTO stocks (id,vaccin,lot,quantiteInitiale,quantiteRestante,datePeremption)
      VALUES (@id,@vaccin,@lot,@quantiteInitiale,@quantiteRestante,@datePeremption)
    `).run({
      id:s.id, vaccin:s.vaccin, lot:s.lot||null,
      quantiteInitiale:Number(s.quantiteInitiale)||0,
      quantiteRestante:Number(s.quantiteRestante)||0,
      datePeremption:s.datePeremption||null,
    });
    res.status(201).json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/stocks/:id', (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE stocks SET
        vaccin=@vaccin, lot=@lot,
        quantiteInitiale=@quantiteInitiale,
        quantiteRestante=@quantiteRestante,
        datePeremption=@datePeremption
      WHERE id=@id
    `).run({
      id:req.params.id, vaccin:b.vaccin, lot:b.lot||null,
      quantiteInitiale:Number(b.quantiteInitiale)||0,
      quantiteRestante:Number(b.quantiteRestante)||0,
      datePeremption:b.datePeremption||null,
    });
    res.json(db.prepare('SELECT * FROM stocks WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/stocks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM stocks WHERE id=?').run(req.params.id);
    res.json({ message: 'Lot supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── RAPPELS ───────────────────────────────────────────────────────────────────
app.get('/api/rappels', (req, res) => {
  try {
    const now = new Date();
    const rows = db.prepare(`
      SELECT v.*, (p.prenom||' '||p.nom) as patient, p.telephone
      FROM vaccinations v LEFT JOIN patients p ON v.patientId=p.id
      WHERE v.dateProchaineDose IS NOT NULL
    `).all();
    const rappels = rows
      .map(v => {
        const jours = Math.ceil((new Date(v.dateProchaineDose) - now) / 86400000);
        return {
          ...hydrateVacc(v),
          joursRestants: jours,
          urgent: jours <= 7 && jours >= 0,
          enRetard: jours < 0,
        };
      })
      .filter(v => v.joursRestants <= 30)
      .sort((a, b) => a.joursRestants - b.joursRestants);
    res.json(rappels);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STATS COMPLÈTES ───────────────────────────────────────────────────────────
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

    const totalPatients     = db.prepare(`SELECT COUNT(*) as n FROM patients ${pSQL}`).get(...pP).n;
    const parSexe           = db.prepare(`SELECT sexe, COUNT(*) as count FROM patients ${pSQL} GROUP BY sexe`).all(...pP);
    const parAge            = db.prepare(`
      SELECT CASE
        WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 1  THEN '< 1 an'
        WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 5  THEN '1–4'
        WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 15 THEN '5–14'
        WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 25 THEN '15–24'
        WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 40 THEN '25–39'
        WHEN (strftime('%Y','now') - strftime('%Y',dateNaissance)) < 60 THEN '40–59'
        ELSE '60+'
      END as tranche, COUNT(*) as count FROM patients ${pSQL} GROUP BY tranche
    `).all(...pP);
    const parWilaya         = db.prepare(`SELECT COALESCE(wilaya,'Non renseignée') as wilaya, COUNT(*) as count FROM patients ${pSQL} GROUP BY wilaya ORDER BY count DESC LIMIT 10`).all(...pP);
    const parFonction       = db.prepare(`SELECT COALESCE(fonction,'Non renseignée') as fonction, COUNT(*) as count FROM patients ${pSQL} GROUP BY fonction ORDER BY count DESC LIMIT 8`).all(...pP);
    const parGroupeSanguin  = db.prepare(`SELECT COALESCE(groupeSanguin,'Inconnu') as groupe, COUNT(*) as count FROM patients ${pSQL} GROUP BY groupe ORDER BY count DESC`).all(...pP);

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

    const totalVaccinations    = db.prepare(`SELECT COUNT(*) as n ${vJoin} ${vSQL}`).get(...vP).n;
    const vGrp = period === 'day' ? "substr(v.dateAdministration,1,10)" : period === 'year' ? "substr(v.dateAdministration,1,4)" : "substr(v.dateAdministration,1,7)";
    const vaccinationsParMois  = db.prepare(`SELECT ${vGrp} as mois, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY mois ORDER BY mois`).all(...vP);
    const vaccinationsParVaccin = db.prepare(`SELECT COALESCE(v.vaccin,'Inconnu') as vaccin, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY v.vaccin ORDER BY count DESC`).all(...vP);
    const vaccinationsParType  = db.prepare(`SELECT COALESCE(v.type,'Inconnu') as type, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY v.type ORDER BY count DESC`).all(...vP);
    const vaccinationsParStatut = db.prepare(`SELECT COALESCE(v.statut,'Inconnu') as statut, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY v.statut`).all(...vP);

    const gradeExtra = vW.length
      ? `${vSQL} AND json_extract(v.protocoleData,'$.grade') IS NOT NULL`
      : `WHERE json_extract(v.protocoleData,'$.grade') IS NOT NULL`;
    const vaccinationsParGrade = db.prepare(`SELECT json_extract(v.protocoleData,'$.grade') as grade, COUNT(*) as count ${vJoin} ${gradeExtra} GROUP BY grade ORDER BY grade`).all(...vP);
    const vaccinationsParSexe  = db.prepare(`SELECT COALESCE(p.sexe,'?') as sexe, COUNT(*) as count ${vJoin} ${vSQL} GROUP BY p.sexe`).all(...vP);

    const today = new Date().toISOString().slice(0, 10);
    const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const rappelsProchains     = db.prepare(`SELECT COUNT(*) as n FROM vaccinations WHERE dateProchaineDose IS NOT NULL AND dateProchaineDose >= ? AND dateProchaineDose <= ?`).get(today, in30).n;
    const vaccinationsEnRetard = db.prepare(`SELECT COUNT(*) as n FROM vaccinations WHERE dateProchaineDose IS NOT NULL AND dateProchaineDose < ? AND statut != 'complete'`).get(today).n;

    const stocks          = db.prepare('SELECT * FROM stocks').all();
    const stocksCritiques = stocks.filter(s => s.quantiteInitiale > 0 && (s.quantiteRestante / s.quantiteInitiale) <= 0.2).length;
    const stocksPerimes   = stocks.filter(s => s.datePeremption && new Date(s.datePeremption) < new Date()).length;

    res.json({
      totalPatients, totalVaccinations, rappelsProchains, vaccinationsEnRetard,
      stocksCritiques, stocksPerimes,
      patientsParPeriode, parSexe, parAge, parWilaya, parFonction, parGroupeSanguin,
      vaccinationsParMois, vaccinationsParVaccin, vaccinationsParType,
      vaccinationsParStatut, vaccinationsParGrade, vaccinationsParSexe,
    });
  } catch (err) {
    console.error('❌ /api/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DIVERS ────────────────────────────────────────────────────────────────────
app.get('/api/vaccins-disponibles', (req, res) => {
  res.json(['Anti-Rabique Tissulaire','Anti-Rabique Cellulaire','Hépatite B','DT','BCG','ROR','Grippe','COVID-19']);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  password === 'admin'
    ? res.json({ token: 'fake-jwt', user: { email, nom: 'Admin' } })
    : res.status(401).json({ error: 'Identifiants invalides' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Remplacez la route POST /api/generate-pdf dans server.js par ceci
// Compatible Windows (python) + Linux/Mac (python3)
// ─────────────────────────────────────────────────────────────────────────────



const fmtPdfDate = value => {
  if (!value) return '';
  try {
    const raw = String(value).split('T')[0];
    const [y, m, d] = raw.split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(value);
  } catch {
    return String(value);
  }
};

const calcAge = value => {
  if (!value) return '';
  try {
    const dob = new Date(String(value).split('T')[0]);
    if (Number.isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const beforeBirthday =
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
    if (beforeBirthday) age -= 1;
    return String(age);
  } catch {
    return '';
  }
};

async function buildVaccinationPdf(payload) {
  const templatePath = path.join(__dirname, 'carte de vaccination z.pdf');
  const existingPdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const patient = payload.patient || {};
  const vaccination = payload.vaccination || {};
  const protocole = payload.protocoleData || {};
  const type = payload.type || vaccination.type || 'rage';
  const [page, page2] = pdfDoc.getPages();

  const nomPrenom = `${patient.prenom || ''} ${patient.nom || ''}`.trim();
  const adresse = [
    patient.adressePrecise,
    patient.adresse,
    patient.commune,
    patient.daira,
    patient.wilaya,
  ].filter(Boolean).join(', ');

  const draw = (targetPage, text, x, y, size = 10, useBold = false) => {
    if (!targetPage || !text) return;
    targetPage.drawText(String(text), { x, y, size, font: useBold ? bold : font });
  };

  const markChoice = (targetPage, x, y, size = 4) => {
    if (!targetPage) return;
    targetPage.drawCircle({
      x,
      y,
      size,
      color: rgb(0, 0, 0),
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
  };

  const drawLines = (targetPage, lines, x, y, size = 8, gap = 10, useBold = false) => {
    (lines || []).filter(Boolean).forEach((line, index) => {
      draw(targetPage, line, x, y - (index * gap), size, useBold);
    });
  };

  const mpvi = protocole.mpvi || {};
  const protocolSummary = [];
  const scheduleLines = [];

  if (vaccination.vaccin) protocolSummary.push(`Vaccin: ${vaccination.vaccin}`);
  if (vaccination.statut) protocolSummary.push(`Statut: ${vaccination.statut}`);

  if (type === 'rage') {
    protocolSummary.push(`Type: Anti-rabique ${protocole.varType || 'tissulaire'}`);
    if (protocole.grade) protocolSummary.push(`Grade: ${protocole.grade}`);
    if (protocole.cellulProtocole) protocolSummary.push(`Protocole: ${protocole.cellulProtocole}`);
    if (protocole.especeAnimale) protocolSummary.push(`Espece: ${protocole.especeAnimale}`);
    if (protocole.localisationPlaies) protocolSummary.push(`Plaies: ${protocole.localisationPlaies}`);
    Object.entries(protocole.datesVAR || {}).forEach(([label, value]) => {
      if (value) scheduleLines.push(`${label}: ${fmtPdfDate(value)}`);
    });
  }

  if (type === 'hepb') {
    protocolSummary.push('Type: Hepatite B');
    if (protocole.schema) protocolSummary.push(`Schema: ${protocole.schema}`);
    if (protocole.voie) protocolSummary.push(`Voie: ${protocole.voie}`);
    if (protocole.doseML) protocolSummary.push(`Dose: ${protocole.doseML} ml`);
    Object.entries(protocole.dates || {}).forEach(([label, value]) => {
      if (value) scheduleLines.push(`${label}: ${fmtPdfDate(value)}`);
    });
  }

  if (type === 'dt') {
    protocolSummary.push('Type: DT');
    if (protocole.schema) protocolSummary.push(`Schema: ${protocole.schema}`);
    if (protocole.voie) protocolSummary.push(`Voie: ${protocole.voie}`);
    if (protocole.doseML) protocolSummary.push(`Dose: ${protocole.doseML} ml`);
  }

  if (type === 'grippe') {
    protocolSummary.push('Type: Grippe saisonniere');
    if (protocole.saison) protocolSummary.push(`Saison: ${protocole.saison}`);
    if (protocole.souche) protocolSummary.push(`Souche: ${protocole.souche}`);
    if (protocole.voie) protocolSummary.push(`Voie: ${protocole.voie}`);
    if (protocole.dose) protocolSummary.push(`Dose: ${protocole.dose} ml`);
  }

  if (type === 'pneumo') {
    protocolSummary.push('Type: Pneumocoque');
    if (protocole.typeVaccin) protocolSummary.push(`Vaccin: ${protocole.typeVaccin}`);
    if (protocole.schema) protocolSummary.push(`Schema: ${protocole.schema}`);
    if (protocole.numeroDose) protocolSummary.push(`Dose numero: ${protocole.numeroDose}`);
    if (protocole.voie) protocolSummary.push(`Voie: ${protocole.voie}`);
    if (protocole.dose) protocolSummary.push(`Dose: ${protocole.dose} ml`);
    Object.entries(protocole.dates || {}).forEach(([label, value]) => {
      if (value) scheduleLines.push(`${label}: ${fmtPdfDate(value)}`);
    });
  }

  if (type === 'meningo') {
    protocolSummary.push('Type: Meningocoque');
    if (protocole.typeVaccin) protocolSummary.push(`Vaccin: ${protocole.typeVaccin}`);
    if (protocole.schema) protocolSummary.push(`Schema: ${protocole.schema}`);
    if (protocole.numeroDose) protocolSummary.push(`Dose numero: ${protocole.numeroDose}`);
    if (protocole.voie) protocolSummary.push(`Voie: ${protocole.voie}`);
    if (protocole.dose) protocolSummary.push(`Dose: ${protocole.dose} ml`);
    Object.entries(protocole.dates || {}).forEach(([label, value]) => {
      if (value) scheduleLines.push(`${label}: ${fmtPdfDate(value)}`);
    });
  }

  const mpviSummary = [];
  if (mpvi.mpviMineur === 'oui') {
    mpviSummary.push(`MPVI mineur: ${(mpvi.mpviMineurTypes || []).join(', ') || mpvi.mpviMineurAutre || 'oui'}`);
  }
  if (mpvi.mpviMajeur === 'oui') {
    mpviSummary.push(`MPVI majeur: ${(mpvi.mpviMajeurTypes || []).join(', ') || mpvi.mpviMajeurAutre || 'oui'}`);
  }

  if (type === 'rage') {
    const gradeMap = {
      'Grade I': [371, 85],
      'Grade II': [455, 85],
      'Grade III': [539, 85],
    };
    const gradeCoords = gradeMap[protocole.grade];
    if (gradeCoords) markChoice(page, gradeCoords[0], gradeCoords[1]);

    const expo = String(protocole.circonstancesMorsure || '').toLowerCase();
    if (expo.includes('morsure')) markChoice(page2, 116, 371);
    else if (expo.includes('griffure') || expo.includes('griff')) markChoice(page2, 183, 371);
    else if (expo.includes('lechage') || expo.includes('léchage')) markChoice(page2, 245, 371);

    const espece = String(protocole.especeAnimale || '').toLowerCase();
    if (espece === 'chien') markChoice(page2, 30, 337);
    else if (espece === 'chat') markChoice(page2, 119, 337);
    else if (espece) markChoice(page2, 187, 337);

    markChoice(page2, protocole.soinsLocaux ? 113 : 155, 283);
    markChoice(page2, protocole.erig ? 108 : 170, 264);
    markChoice(page2, protocole.varType === 'cellulaire' ? 185 : 245, 154);
    markChoice(page2, 228, 71);
    markChoice(page2, 228, 31);
  }

  draw(page, nomPrenom, 390, 180, 10);
  draw(page, calcAge(patient.dateNaissance), 338, 163, 10);
  draw(page, patient.poids, 460, 163, 10);
  draw(page, adresse, 356, 146, 8);
  draw(page, fmtPdfDate(protocole.dateExposition || vaccination.dateAdministration), 405, 111, 10);
  draw(page, protocole.medecin, 270, 75, 8);
  drawLines(page, [
    ...protocolSummary.slice(0, 3),
    protocole.observations ? `Obs: ${protocole.observations}` : '',
  ], 30, 48, 8, 10);

  draw(page2, patient.maladiesChroniques || patient.antecedents, 135, 396, 8);
  draw(page2, protocole.localisationPlaies, 93, 354, 8);
  draw(page2, fmtPdfDate(protocole.erigDate), 130, 243, 8);
  draw(page2, protocole.erigQuantiteTotale ? `${protocole.erigQuantiteTotale} ml` : '', 145, 228, 8);
  draw(page2, protocole.erigQuantiteIM, 140, 214, 8);
  draw(page2, protocole.erigLot, 80, 186, 8);
  draw(page2, fmtPdfDate(protocole.erigPeremption), 133, 169, 8);
  draw(page2, fmtPdfDate(vaccination.dateAdministration), 130, 132, 8);
  draw(page2, protocole.varLot, 80, 117, 8);
  draw(page2, fmtPdfDate(protocole.varPeremption), 133, 101, 8);
  draw(page2, protocole.voie, 180, 132, 8);
  draw(page2, protocole.dose || protocole.doseML, 200, 117, 8);
  drawLines(page2, protocolSummary.slice(3), 300, 240, 8, 10);
  drawLines(page2, scheduleLines.slice(0, 8), 300, 160, 8, 10);
  drawLines(page2, mpviSummary, 300, 70, 8, 10, true);

  return pdfDoc.save();
}

// ── Détection automatique de la commande Python ───────────────────────────────
app.post('/api/generate-pdf', async (req, res, next) => {
  try {
    const pdfBytes = await buildVaccinationPdf(req.body);
    const { type = 'rage', patient = {} } = req.body;
    const fname = `carte_${type}_${patient.nom || 'patient'}_${patient.prenom || ''}.pdf`
      .replace(/\s+/g, '_');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fname}"`,
      'Content-Length': pdfBytes.length,
    });
    res.send(Buffer.from(pdfBytes));
    console.log(`Carte PDF générée via pdf-lib: ${fname} (${pdfBytes.length} bytes)`);
  } catch (err) {
    console.error('PDF error:', err?.message);
    res.status(500).json({
      error: 'Erreur PDF',
      detail: err.message,
    });
  }
});

function getPythonRuntime() {
  if (process.platform === 'win32') {
    return { command: 'py', args: ['-3'] };
  }
  return { command: 'python3', args: [] };
}

// ── GÉNÉRATION PDF ─────────────────────────────────────────────────────────────
app.post('/api/generate-pdf', (req, res) => {
  const payload    = JSON.stringify(req.body);
  const scriptPath = path.join(__dirname, 'generate_pdf_report.py');
  const tmpFile    = path.join(require('os').tmpdir(), `vaccitrack_${Date.now()}.pdf`);
  const python     = getPythonRuntime();

  execFile(python.command, [...python.args, scriptPath, payload, tmpFile],
    { encoding: 'buffer', maxBuffer: 20 * 1024 * 1024 },
    (err, stdout, stderr) => {
      if (err) {
        console.error('PDF error:', err?.message, stderr?.toString());
        return res.status(500).json({
          error: 'Erreur PDF',
          detail: stderr?.toString() || stdout?.toString() || err.message,
        });
      }

      try {
        const pdfBuffer = fs.readFileSync(tmpFile);
        const { type = 'rage', patient = {} } = req.body;
        const fname = `carte_${type}_${patient.nom || 'patient'}_${patient.prenom || ''}.pdf`
          .replace(/\s+/g, '_');

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fname}"`,
          'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);

        // Nettoyage fichier temporaire
        try { fs.unlinkSync(tmpFile); } catch (_) {}
        console.log(`📄 Carte PDF générée: ${fname} (${pdfBuffer.length} bytes)`);
      } catch (readErr) {
        console.error('PDF read error:', readErr.message);
        res.status(500).json({ error: 'Erreur lecture PDF', detail: readErr.message });
      }
    }
  );
});


// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const np = db.prepare('SELECT COUNT(*) as n FROM patients').get().n;
  const nv = db.prepare('SELECT COUNT(*) as n FROM vaccinations').get().n;
  const ns = db.prepare('SELECT COUNT(*) as n FROM stocks').get().n;
  console.log(`🏥 VacciTrack: http://localhost:${PORT}`);
  console.log(`📊 ${np} patients · ${nv} vaccinations · ${ns} stocks`);
});
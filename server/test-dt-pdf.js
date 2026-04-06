// test-dt-pdf.js - Script de test pour la génération PDF DT
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Fonctions utilitaires du serveur
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

// Coordonnées DT
const DT_COORDS = {
  p1: {
    nom:      { x: 55,  y: 95.0,  size: 10, maxW: 230 },
    prenom:   { x: 70,  y: 78.0,  size: 10, maxW: 220 },
    age:      { x: 48,  y: 64.0,  size: 10, maxW: 100 },
    adresse:  { x: 68,  y: 46.5,  size:  9, maxW: 220 },
    fonction: { x: 73,  y: 29.5,  size: 10, maxW: 215 },
  },
  p2: {
    dose1:    { x: 112, y: 163.0, size: 10, maxW: 180 },
    dose2m:   { x: 132, y: 133.0, size: 10, maxW: 165 },
    dose1an:  { x: 128, y: 103.5, size: 10, maxW: 170 },
    dose10:   { x: 140, y:  70.5, size: 10, maxW: 155 },
    medecin:  { x: 217, y:  26.0, size:  9, maxW:  70 },
  },
};

async function buildDtPdf(payload) {
  console.log('🔍 DT PDF - Payload reçu:', JSON.stringify(payload, null, 2));
  const templatePath = path.join(__dirname, 'carte_de_vaccination_dt.pdf');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template PDF non trouvé: ${templatePath}`);
  }

  const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  const p2 = pages[1];

  const patient = payload.patient || {};
  const vacc = payload.vaccination || {};
  const proto = payload.protocoleData || {};

  console.log('🔍 DT PDF - Patient:', patient);
  console.log('🔍 DT PDF - Vaccination:', vacc);
  console.log('🔍 DT PDF - Protocole:', proto);

  // Fonction de nettoyage
  const cleanText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .trim();
  };

  const draw = (pg, text, coord, isBold = false) => {
    if (!pg || !text) return;
    let t = cleanText(String(text));
    const f = isBold ? bold : font;
    if (coord.maxW) {
      while (t.length > 1 && f.widthOfTextAtSize(t, coord.size) > coord.maxW) {
        t = t.slice(0, -1);
      }
    }
    pg.drawText(t, {
      x: coord.x, y: coord.y,
      size: coord.size,
      font: f,
      color: rgb(0, 0, 0),
    });
  };

  // Calcul des dates
  const addMonths = (isoDate, months) => {
    try {
      const d = new Date(isoDate);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().slice(0, 10);
    } catch { return ''; }
  };
  const addYears = (isoDate, years) => {
    try {
      const d = new Date(isoDate);
      d.setFullYear(d.getFullYear() + years);
      return d.toISOString().slice(0, 10);
    } catch { return ''; }
  };

  const dtDates = proto.dates || {};
  const d1Raw = dtDates.D1 || vacc.dateAdministration || '';

  const d2 = dtDates.D2 || (d1Raw ? addMonths(d1Raw, 2) : '');
  const d3 = dtDates.D3 || dtDates.Rappel || (d1Raw ? addYears(d1Raw, 1) : '');
  const rappel10 = dtDates.Rappel10 || dtDates['Rappel (10 ans)'] || (d1Raw ? addYears(d1Raw, 10) : '');

  // Remplissage page 1
  console.log('🔍 DT PDF - Remplissage page 1...');
  draw(p1, patient.nom || '', DT_COORDS.p1.nom);
  draw(p1, patient.prenom || '', DT_COORDS.p1.prenom);

  const ageStr = patient.dateNaissance
    ? `${calcAge(patient.dateNaissance)} ans`
    : (patient.age ? `${patient.age} ans` : '');
  draw(p1, ageStr, DT_COORDS.p1.age);

  const adresse = [patient.adressePrecise, patient.adresse, patient.commune, patient.wilaya]
    .filter(Boolean).join(', ');
  draw(p1, adresse, DT_COORDS.p1.adresse);

  const fonction = patient.fonction || patient.profession || '';
  draw(p1, fonction, DT_COORDS.p1.fonction);

  // Remplissage page 2
  console.log('🔍 DT PDF - Remplissage page 2...');
  console.log('🔍 DT PDF - Dates calculées:', { d1Raw, d2, d3, rappel10 });
  draw(p2, fmtDate(d1Raw), DT_COORDS.p2.dose1);
  draw(p2, fmtDate(d2), DT_COORDS.p2.dose2m);
  draw(p2, fmtDate(d3), DT_COORDS.p2.dose1an);
  draw(p2, fmtDate(rappel10), DT_COORDS.p2.dose10);

  const medecinDT = proto.medecin || vacc.medecin || '';
  if (medecinDT) {
    const medecinLabel = /^Dr\.?/i.test(medecinDT) ? medecinDT : `Dr. ${medecinDT}`;
    draw(p2, medecinLabel, DT_COORDS.p2.medecin, true);
  }

  console.log('🔍 DT PDF - Génération terminée');
  return pdfDoc.save();
}

// Test
const testPayload = {
  patient: {
    nom: 'Dupont',
    prenom: 'Jean',
    dateNaissance: '1990-01-01',
    adresse: '123 Rue de la Paix',
    commune: 'Alger',
    wilaya: 'Alger',
    fonction: 'Ingénieur'
  },
  vaccination: {
    dateAdministration: '2024-01-01'
  },
  protocoleData: {
    schema: 'Primo-vaccination',
    dates: {
      D1: '2024-01-01',
      D2: '2024-03-01',
      D3: '2025-01-01',
      Rappel: '2034-01-01'
    },
    medecin: 'Dr. Martin'
  }
};

buildDtPdf(testPayload)
  .then(pdfBytes => {
    fs.writeFileSync('test_dt_debug.pdf', pdfBytes);
    console.log('✅ PDF DT généré: test_dt_debug.pdf');
  })
  .catch(err => {
    console.error('❌ Erreur génération PDF DT:', err.message);
  });
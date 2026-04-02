const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'vaccitrack.db');
const EXCEL_PATH = path.join(__dirname, '..', 'ANTIRAB base de donnée.xlsx');

const db = new Database(DB_PATH);

console.log('🚀 Démarrage de la migration avec calcul des rappels (J0, J3, J7, J14)...');

function excelDateToISO(excelDate) {
    if (!excelDate || isNaN(excelDate)) return null;
    try {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

function calculateNextDose(currentDateISO, currentDoseNumber) {
    if (!currentDateISO || !currentDoseNumber) return null;
    const date = new Date(currentDateISO);
    let daysToAdd = 0;
    
    // Selon le protocole Anti-Rabique standard (Essen/Tissulaire)
    // J0 -> J3 (+3j)
    // J3 -> J7 (+4j)
    // J7 -> J14 (+7j)
    // J14 -> J30 (+16j)
    // J30 -> Fin
    
    if (currentDoseNumber == 1) daysToAdd = 3;
    else if (currentDoseNumber == 2) daysToAdd = 4;
    else if (currentDoseNumber == 3) daysToAdd = 7;
    else if (currentDoseNumber == 4) daysToAdd = 16;
    else return null; // Dose 5 ou autre => Fin du protocole

    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
}

try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    console.log(`🧹 Nettoyage des tables...`);
    db.prepare('DELETE FROM vaccinations').run();
    db.prepare('DELETE FROM patients').run();

    const insertPatient = db.prepare(`
      INSERT INTO patients
        (id, nom, prenom, dateNaissance, sexe, telephone, email, adresse, wilaya, daira, commune,
         adressePrecise, groupeSanguin, poids, fonction, service, profession, instruction,
         createdAt)
      VALUES
        (@id, @nom, @prenom, @dateNaissance, @sexe, @telephone, @email, @adresse, @wilaya, @daira, @commune,
         @adressePrecise, @groupeSanguin, @poids, @fonction, @service, @profession, @instruction,
         @createdAt)
    `);

    const insertVacc = db.prepare(`
      INSERT INTO vaccinations (id, patientId, type, vaccin, dose, statut, dateAdministration, dateProchaineDose, protocoleData, createdAt)
      VALUES (@id, @patientId, @type, @vaccin, @dose, @statut, @dateAdministration, @dateProchaineDose, @protocoleData, @createdAt)
    `);

    const currentYear = new Date().getFullYear();
    let pCount = 0;
    let vCount = 0;
    let rCount = 0;

    const transaction = db.transaction((rows) => {
        for (const row of rows) {
            const nom = String(row.NOM || '').toUpperCase().trim();
            const prenom = String(row.PRENOM || '').trim();
            if (!nom && !prenom) continue;

            const pId = uuidv4();
            let dob = null;
            if (row.AGE) {
                const age = parseInt(row.AGE);
                if (!isNaN(age)) dob = `${currentYear - age}-01-01`;
            }

            insertPatient.run({
                id: pId, nom, prenom, dateNaissance: dob,
                sexe: (row.SEXE && String(row.SEXE).toUpperCase() === 'F') ? 'F' : 'M',
                telephone: row.TEL || null, 
                email: row.EMAIL || null,
                adresse: row.ADRESSE || null,
                wilaya: row.WILAYA || 'Tlemcen',
                daira: row.DAIRA || null,
                commune: row.COMMUNE || null,
                adressePrecise: row.ADRESSE_PRECISE || null,
                groupeSanguin: row.GS || 'A+',
                poids: String(row.POID || ''),
                fonction: row.FONCTION || null,
                service: row.SERVICE || null,
                profession: row.PROF || null,
                instruction: row.NIVINSTR || null,
                createdAt: new Date().toISOString()
            });
            pCount++;

            const vDate = excelDateToISO(row.CONSULTATI);
            if (vDate) {
                const doseNum = parseInt(row.NBR) || 1;
                const nextDate = calculateNextDose(vDate, doseNum);
                
                const observations = [
                    row.CAT ? `Animal: ${row.CAT}` : null,
                    row.SIE ? `Siège: ${row.SIE}` : null,
                    row.NAT ? `Nature: ${row.NAT}` : null
                ].filter(Boolean).join(' | ');

                insertVacc.run({
                    id: uuidv4(), patientId: pId,
                    type: 'Rage', vaccin: 'Anti-Rabique',
                    dose: doseNum.toString(), statut: 'complete',
                    dateAdministration: vDate,
                    dateProchaineDose: nextDate,
                    protocoleData: JSON.stringify({ note: observations }),
                    createdAt: new Date().toISOString()
                });
                vCount++;
                if (nextDate) rCount++;
            }
            if (pCount % 1000 === 0) console.log(`⏳ ${pCount} patients...`);
        }
    });

    transaction(data);
    console.log(`✅ Migration terminée !`);
    console.log(`📈 Patients : ${pCount}, Vaccins : ${vCount}, Prochains rappels estimés : ${rCount}`);

} catch (err) {
    console.error('❌ Erreur:', err.message);
} finally {
    db.close();
}

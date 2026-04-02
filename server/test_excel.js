const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ANTIRAB base de donnée.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('HEADERS:', JSON.stringify(data[0]));
    console.log('ROW1:', JSON.stringify(data[1]));
} catch (e) {
    console.error('ERROR:', e.message);
}

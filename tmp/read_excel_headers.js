const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\DeLL\\Desktop\\Vaccine\\ANTIRAB base de donnée.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length > 0) {
    console.log('Headers:', data[0]);
    console.log('Row 1:', data[1]);
  } else {
    console.log('Empty sheet');
  }
} catch (err) {
  console.error('Error reading Excel:', err.message);
}

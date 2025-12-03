import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract lot data
 * Maps from "Production Analysis_Report (Aug'25).xlsx" structure:
 * - Data: A3:Q70 (rows 2-69 in 0-indexed, actual data from row 5)
 * - Header: Row 4 (0-indexed, Excel row 5)
 * - Product Size: Column F (index 5)
 * - Tonnage: Column G (index 6) - "Representative Lot Qty"
 * - Fe: Column J (index 9)
 * - SiO2: Column K (index 10)
 * - Al2O3: Column L (index 11)
 * - P: Column O (index 14)
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        console.log('=== Starting Excel import ===');
        console.log('File name:', file.name);
        
        const workbook = XLSX.read(ev.target.result, { type: 'binary' });
        console.log('Workbook loaded, sheets:', workbook.SheetNames);
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Total rows in sheet:', rows.length);
        
        if (!rows || rows.length < 6) {
          reject(new Error('Excel file too small'));
          return;
        }
        
        // For "Production Analysis_Report (Aug'25).xlsx" structure
        // Column indices (0-based):
        const productSizeIdx = 5;  // Column F
        const tonnageIdx = 6;      // Column G (Representative Lot Qty)
        const feIdx = 9;           // Column J (Fe)
        const siIdx = 10;          // Column K (SiO2)
        const alIdx = 11;          // Column L (Al2O3)
        const pIdx = 14;           // Column O (P)
        
        console.log('Using column mapping for standard Excel format:');
        console.log('  Product Size (F):', productSizeIdx);
        console.log('  Tonnage/Lot Qty (G):', tonnageIdx);
        console.log('  Fe (J):', feIdx);
        console.log('  SiO2 (K):', siIdx);
        console.log('  Al2O3 (L):', alIdx);
        console.log('  P (O):', pIdx);
        
        // Data rows: A3:Q70 (rows 2-69 in 0-indexed)
        // Actual data starts from row 5 (index 5 = Excel row 6)
        const dataStartIdx = 5;  // Row 6 in Excel = index 5
        const dataEndIdx = 70;   // Row 71 in Excel = index 70
        
        console.log(`Extracting data from rows ${dataStartIdx} to ${Math.min(dataEndIdx, rows.length)}`);
        
        const data = [];
        for (let i = dataStartIdx; i < Math.min(dataEndIdx, rows.length); i++) {
          const row = rows[i];
          
          if (!Array.isArray(row) || !row[feIdx]) {
            continue;
          }
          
          try {
            const feVal = row[feIdx];
            const sioVal = row[siIdx];
            const productSizeVal = row[productSizeIdx];
            const tonnageVal = row[tonnageIdx];
            
            if (feVal === null || feVal === undefined || sioVal === null || sioVal === undefined) {
              continue;
            }
            
            const fe = parseFloat(feVal);
            const sio2 = parseFloat(sioVal);
            const tonnage = parseFloat(tonnageVal) || 1000;
            
            if (isNaN(fe) || isNaN(sio2)) {
              continue;
            }
            
            const al2o3 = alIdx >= 0 && row[alIdx] ? parseFloat(row[alIdx]) || 0 : 0;
            const p = pIdx >= 0 && row[pIdx] ? parseFloat(row[pIdx]) || 0 : 0;
            
            // Detect product size
            let productSize = '10-40mm';
            if (productSizeVal) {
              const sizeStr = String(productSizeVal).toLowerCase();
              if (sizeStr.includes('fine')) {
                productSize = 'Fines';
              } else if (sizeStr.includes('10-40') || sizeStr.includes('coarse')) {
                productSize = '10-40mm';
              }
            }
            
            console.log(`Row ${i+1}: Fe=${fe}%, SiO2=${sio2}%, Tonnage=${tonnage}t, Size=${productSize}`);
            
            // Validate ranges (Fe 40-80%, SiO2 > 0)
            if (fe > 40 && fe < 80 && sio2 > 0) {
              data.push({
                lotId: `Sample_${i - dataStartIdx + 1}`,
                tonnage: tonnage,
                Fe: parseFloat(fe.toFixed(2)),
                SiO2: parseFloat(sio2.toFixed(2)),
                Al2O3: parseFloat(al2o3.toFixed(3)),
                P: parseFloat(p.toFixed(4)),
                productSize: productSize
              });
            }
          } catch (e) {
            console.error(`Error processing row ${i}:`, e);
          }
        }
        
        console.log('Final data array:', data);
        console.log(`Successfully extracted ${data.length} valid lots`);
        resolve(data);
      } catch (err) {
        console.error('Excel import error:', err);
        reject(err);
      }
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse CSV file and extract lot data
 */
export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        console.log('=== Starting CSV import ===');
        console.log('File name:', file.name);
        
        const text = ev.target.result;
        const rows = text.trim().split(/\r?\n/);
        const hdr = rows[0].split(/,|;/).map(h => h.trim().toLowerCase());
        
        console.log('Header:', hdr);
        
        const productSizeIdx = hdr.findIndex(h => h.includes('size') || h.includes('product'));
        
        const data = rows.slice(1)
          .map((r, idx) => {
            const cols = r.split(/,|;/);
            const obj = {};
            hdr.forEach((h, i) => { obj[h] = cols[i]; });
            
            let productSize = '10-40mm';
            if (productSizeIdx >= 0 && cols[productSizeIdx]) {
              const sizeStr = String(cols[productSizeIdx]).toLowerCase();
              if (sizeStr.includes('fine')) {
                productSize = 'Fines';
              } else if (sizeStr.includes('10-40') || sizeStr.includes('coarse')) {
                productSize = '10-40mm';
              }
            }
            
            return {
              lotId: obj['lot id'] || obj.lotid || obj['lot'] || `CSV_Lot_${idx}`,
              tonnage: +obj.tonnage || 1000,
              Fe: +obj['fe%'] || +obj.fe || 0,
              SiO2: +obj['sio2%'] || +obj.sio2 || 0,
              Al2O3: +obj['al2o3%'] || +obj.al2o3 || 0,
              P: +obj['p%'] || +obj.p || 0,
              productSize: productSize
            };
          })
          .filter(d => d.Fe > 0);
        
        console.log('Final data array:', data);
        resolve(data);
      } catch (err) {
        console.error('CSV import error:', err);
        reject(err);
      }
    };
    
    reader.readAsText(file);
  });
}

/**
 * Handle file upload based on file extension
 */
export async function importFile(file) {
  try {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return await parseExcelFile(file);
    } else if (file.name.endsWith('.csv')) {
      return await parseCSVFile(file);
    } else {
      throw new Error('Unsupported file format. Please use .xlsx, .xls, or .csv');
    }
  } catch (err) {
    console.error('File import error:', err);
    throw err;
  }
}

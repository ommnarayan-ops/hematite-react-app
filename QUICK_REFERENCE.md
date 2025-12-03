# Quick Reference Guide

## 📁 File Locations

| Feature | File | Lines |
|---------|------|-------|
| Main App | `src/App.js` | 190 |
| Excel/CSV Import | `src/utils/fileImport.js` | 140 |
| Blending Algorithm | `src/utils/blendingAlgorithm.js` | 95 |
| Form Components | `src/components/Forms.js` | 150 |
| Results Display | `src/components/ResultsDisplay.js` | 95 |

## 🔍 Finding Code by Feature

### "I want to modify the blending algorithm"
**File**: `src/utils/blendingAlgorithm.js`
- Find: `calculateBlend()` function
- Features: Lot selection, specification validation, allocation
- Change: Sorting strategy, constraint logic, calculation method

### "I want to add a new Excel column"
**File**: `src/utils/fileImport.js`
- Find: `parseExcelFile()` → look for `feIdx`, `siIdx`, etc.
- Features: Column detection, data validation, product size extraction
- Change: Add new column index detection, add new field to returned object

### "I want to change the form layout"
**File**: `src/components/Forms.js`
- Find: Component name (e.g., `AddLotForm`)
- Features: Input fields, form structure, styling
- Change: Add/remove inputs, reorder fields, update styles

### "I want to customize result display"
**File**: `src/components/ResultsDisplay.js`
- Find: `ResultsBySize` component
- Features: Table layout, colors, column definitions
- Change: Add new columns, change colors, add charts

### "I want to handle a new file format"
**File**: `src/utils/fileImport.js`
- Find: `importFile()` function
- Add: New function `parseSomeFormatFile()`
- Update: `importFile()` to route to new parser

## 🎯 Common Tasks

### Add a new specification input
1. Open `src/App.js`
2. Add state: `const [NewSpec, setNewSpec] = useState(default);`
3. Open `src/components/Forms.js`
4. Add input in `SpecificationsForm`
5. Pass prop in `App.js`

### Change algorithm behavior
1. Open `src/utils/blendingAlgorithm.js`
2. Modify `calculateBlend()` or `buildAndSolve()`
3. Test with sample data in browser

### Add new lot field
1. Update `src/utils/fileImport.js` to extract field
2. Update `src/components/Forms.js` form to input field
3. Update `src/components/ResultsDisplay.js` to display in results
4. Ensure `src/App.js` passes through to calculations

### Fix file import issue
1. Check console logs in browser DevTools
2. Look at `parseExcelFile()` or `parseCSVFile()` in `src/utils/fileImport.js`
3. Debug header detection or column mapping
4. Add validation or error handling as needed

## 📊 Data Structures

### Lot Object
```javascript
{
  lotId: string,           // Unique identifier
  tonnage: number,         // Weight in tonnes
  Fe: number,              // Iron percentage
  SiO2: number,            // Silica percentage
  Al2O3: number,           // Alumina percentage
  P: number,               // Phosphorus percentage
  productSize: string      // "10-40mm" or "Fines"
}
```

### Result Object
```javascript
{
  '10-40mm': {
    blended: {
      Fe: number,                    // Blended Fe %
      SiO2: number,                  // Blended SiO2 %
      Al2O3: number,                 // Blended Al2O3 %
      P: number,                     // Blended P %
      total_allocated: number,       // Tonnes allocated
      fe_tonnage: number,            // Fe tonnes
      sio2_tonnage: number,          // SiO2 tonnes
      al_tonnage: number,            // Al2O3 tonnes
      p_tonnage: number,             // P tonnes
      specs: { fe_min, sio2_max, al_max, p_max },
      met_specs: { fe: bool, sio2: bool, al: bool, p: bool }
    },
    allocations: [
      {
        lotId: string,
        allocated: number,
        fe_contrib: number,
        sio2_contrib: number,
        al_contrib: number,
        p_contrib: number
      }
    ]
  },
  'Fines': { /* same structure */ }
}
```

## 🔧 Import Statements

### In `App.js`:
```javascript
import { importFile } from './utils/fileImport';
import { buildAndSolve } from './utils/blendingAlgorithm';
import { SpecificationsForm, ... } from './components/Forms';
import { ResultsDisplay } from './components/ResultsDisplay';
```

### In other files:
```javascript
// Import specific utility
import { parseExcelFile } from './utils/fileImport';

// Import specific component
import { LotsTable } from './components/Forms';
```

## 🚀 Development Workflow

1. **Start Dev Server**
   ```bash
   npm start
   ```
   Opens on http://localhost:3000 (or next available port)

2. **Edit a File**
   - Changes auto-compile
   - Browser auto-reloads
   - Check browser console for errors

3. **Test New Feature**
   - Use sample data (auto-loads)
   - Or upload test Excel file
   - Check console logs for debugging

4. **Build for Production**
   ```bash
   npm run build
   ```
   Creates optimized build in `build/` folder

## 🐛 Debugging Tips

### Check Console
1. Open DevTools (F12 or right-click → Inspect)
2. Go to Console tab
3. Look for:
   - `=== Starting file import ===` (file parse logs)
   - `Final data array:` (imported lots)
   - Error messages

### Test File Import
1. Use provided Excel files in project root
2. Check console logs for column detection
3. Verify Fe and SiO2 column indices
4. Check product size detection

### Test Algorithm
1. Ensure lots added (check table)
2. Click "Run Blend Model"
3. Check console for allocation logs
4. Verify results appear below table

### Check State
1. Add temporary console.log in `App.js`
2. Log lots, result, form state
3. Watch values change on interaction

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `CODE_STRUCTURE.md` | Detailed code organization |
| `REFACTORING_NOTES.md` | What changed and why |
| `PROJECT_STRUCTURE.md` | Complete architecture overview |
| `QUICK_REFERENCE.md` | This file |

## 💡 Key Concepts

### Product Size Segregation
- Lots divided into "10-40mm" (coarse) and "Fines"
- Blending calculated independently for each
- Results shown separately with color coding

### Greedy Allocation Algorithm
- Sorts lots by Fe% (highest first)
- Tries to include each lot in order
- Only includes if specifications are met
- Stops when shipment target reached

### Quality Specifications
- Fe Minimum: Must be ≥ this value
- SiO2 Maximum: Must be ≤ this value
- Al2O3 Maximum: Must be ≤ this value
- P Maximum: Must be ≤ this value

### File Import Validation
- Fe must be between 40-80%
- SiO2 must be > 0
- Rows without Fe/SiO2 are skipped
- Product size auto-detected from column

## ❓ FAQ

**Q: Where does the Excel file get parsed?**
A: `src/utils/fileImport.js` → `parseExcelFile()`

**Q: How does the blending calculation work?**
A: `src/utils/blendingAlgorithm.js` → `calculateBlend()`

**Q: Can I add new form inputs?**
A: Yes, add to `src/components/Forms.js` and update `App.js`

**Q: How do I change the algorithm?**
A: Modify `src/utils/blendingAlgorithm.js`

**Q: Why are results shown separately?**
A: Product size segregation - each size calculated independently

**Q: Can I modify the Excel column names?**
A: Yes, in `fileImport.js` → column detection logic

**Q: How do I add a new metric?**
A: Add state in `App.js`, form input in `Forms.js`, calculation in algorithm file

## 🎨 Styling

- **Color codes**:
  - 10-40mm: Blue background (#e3f2fd)
  - Fines: Purple background (#f3e5f5)
  - Pass: Green text
  - Fail: Red text
  - Buttons: Blue (#007bff)

- **Modify styling**:
  - Inline styles in component files
  - Global styles in `src/App.css`
  - Customize colors in component style props

## 📞 Support

For issues or questions:
1. Check console logs (DevTools → Console)
2. Review relevant code file
3. Check documentation files
4. Test with sample data first
5. Verify file format matches expectations

# Project Structure Overview

## Directory Layout

```
hematite-react-app/
│
├── public/
│   └── index.html
│
├── src/
│   ├── App.js                    # Main React component (190 lines)
│   ├── App.css                   # Global styles
│   ├── index.js                  # React entry point
│   │
│   ├── utils/                    # Utility functions
│   │   ├── fileImport.js         # Excel/CSV file parsing (140 lines)
│   │   └── blendingAlgorithm.js  # Blending optimization logic (95 lines)
│   │
│   └── components/               # Reusable React components
│       ├── Forms.js              # Form components (150 lines)
│       └── ResultsDisplay.js     # Results display components (95 lines)
│
├── package.json                  # Dependencies and scripts
├── CODE_STRUCTURE.md             # Detailed code documentation
├── REFACTORING_NOTES.md          # Refactoring summary
│
└── [Excel files for testing]
    ├── Production Analysis_Report (Aug'25).xlsx
    ├── Production_Samples_Analysis_Report (June'25).xlsx
    ├── Production_Samples_Analysis_Report (May'25).xlsx
    └── Product_Analysis_Report_July'25.xlsx
```

## Module Dependencies

```
App.js (Main Component)
  │
  ├─── fileImport.js (File Handling)
  │      └─── xlsx library
  │
  ├─── blendingAlgorithm.js (Calculation)
  │
  ├─── Forms.js (UI Components)
  │      └─── React
  │
  └─── ResultsDisplay.js (Results UI)
         └─── React
```

## Key Files and Their Purpose

### 1. `src/App.js` - Application Root
**Lines**: 190
**Purpose**: Main React component that:
- Manages application state (lots, specifications, results)
- Handles user interactions (add lot, upload file, run blend)
- Orchestrates component rendering
- Provides user feedback via messages

**Key State Variables**:
- `lots`: Array of lot objects
- `form`: Form input state
- `T`: Shipment target tonnage
- `FeMin, SiO2spec, AlSpec, Pspec`: Quality specifications
- `result`: Blending calculation results
- `loading`, `message`: UI feedback

**Key Functions**:
- `addLot()`: Add manual lot entry
- `removeLot()`: Remove lot by index
- `handleFileUpload()`: Process uploaded file
- `handleBuildAndSolve()`: Run blending algorithm

### 2. `src/utils/fileImport.js` - File Parsing
**Lines**: 140
**Purpose**: Parse and import data from Excel and CSV files

**Exported Functions**:
- `parseExcelFile(file)` - Handles .xlsx/.xls files
  - Finds header row with Fe/SiO2 columns
  - Validates data ranges (Fe: 40-80%, SiO2 > 0)
  - Detects product size from metadata
  - Returns Promise with lot array

- `parseCSVFile(file)` - Handles .csv files
  - Maps CSV columns to lot properties
  - Supports various column name variations
  - Detects product size from columns
  - Returns Promise with lot array

- `importFile(file)` - Main entry point
  - Routes to appropriate parser based on extension
  - Handles errors with user-friendly messages

### 3. `src/utils/blendingAlgorithm.js` - Calculation Engine
**Lines**: 95
**Purpose**: Implement the blending optimization algorithm

**Exported Functions**:
- `calculateBlend(lotsForSize, T, specs)` - Core algorithm
  - Uses greedy allocation sorted by Fe%
  - Validates all specifications before accepting lot
  - Returns blended composition and allocations

- `buildAndSolve(lots, T, feMin, sio2Spec, alSpec, pSpec)` - Main solver
  - Separates lots by product size (10-40mm and Fines)
  - Runs independent calculation for each size
  - Returns results keyed by product size

**Algorithm Details**:
- **Sort Strategy**: Descending Fe% (highest Fe first)
- **Allocation Method**: Greedy (take maximum possible from each lot)
- **Validation**: Check SiO2, Al2O3, P limits before accepting
- **Output**: Blended composition % and actual tonnage contributions

### 4. `src/components/Forms.js` - Form Components
**Lines**: 150
**Purpose**: Reusable form and input components

**Exported Components**:
- `SpecificationsForm` - Quality specification inputs
  - Fe Min (%), SiO2 Max (%), Al2O3 Max (%), P Max (%)
  - Grid layout with number inputs

- `ShipmentTargetInput` - Total tonnage target
  - Number input for shipment target

- `AddLotForm` - Manual lot entry form
  - Lot ID, Tonnage, Fe%, SiO2%, Al2O3%, P%, Product Size
  - Flexbox layout, Submit button

- `FileUploadSection` - File import UI
  - Accepts .csv, .xlsx, .xls files
  - Shows upload status

- `LotsTable` - Lot listing and management
  - Displays all lots in table format
  - Shows product size, composition, and Remove button
  - Sortable columns

- `RunBlendButton` - Calculation trigger
  - Styled button to start blend calculation

### 5. `src/components/ResultsDisplay.js` - Results Components
**Lines**: 95
**Purpose**: Display blending calculation results

**Exported Components**:
- `ResultsBySize` - Single product size results
  - Blended composition table with Pass/Fail status
  - Lot allocations detail table
  - Contribution calculations
  - Color-coded section

- `ResultsDisplay` - Main results wrapper
  - Shows separate sections for 10-40mm and Fines
  - Handles missing product sizes gracefully

## Data Flow Diagram

```
User Input
    │
    ├─→ Manual Entry (Form)
    │   └─→ addLot() → lots state
    │
    └─→ File Upload
        └─→ handleFileUpload()
            └─→ importFile()
                ├─→ parseExcelFile() or parseCSVFile()
                └─→ setLots([...lots, ...imported])

Lots List
    │
    └─→ Run Blend Model
        └─→ handleBuildAndSolve()
            └─→ buildAndSolve()
                ├─→ Filter by product size
                └─→ calculateBlend() for each size
                    └─→ Greedy allocation algorithm
                        └─→ setResult(blendResult)

Results Display
    │
    └─→ ResultsDisplay
        ├─→ ResultsBySize (10-40mm)
        │   ├─→ Composition table
        │   └─→ Allocations table
        │
        └─→ ResultsBySize (Fines)
            ├─→ Composition table
            └─→ Allocations table
```

## Technology Stack

- **Framework**: React 18.2.0
- **Build Tool**: React Scripts 5.0.1
- **File Processing**: XLSX library (v0.18+)
- **Styling**: CSS (inline styles in components)
- **Language**: JavaScript (ES6+)
- **Node Runtime**: v14+ (for development)

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| App.js | 190 | Main component |
| fileImport.js | 140 | File parsing |
| blendingAlgorithm.js | 95 | Algorithm |
| Forms.js | 150 | Form components |
| ResultsDisplay.js | 95 | Results UI |
| **Total** | **~670** | - |

## How to Use Each Module

### Import File Parsing
```javascript
import { importFile } from './utils/fileImport';

// Usage
try {
  const data = await importFile(file);
  console.log(`Imported ${data.length} lots`);
} catch (err) {
  console.error('Import failed:', err.message);
}
```

### Use Blending Algorithm
```javascript
import { buildAndSolve } from './utils/blendingAlgorithm';

// Usage
const results = buildAndSolve(
  lots,
  10000,  // T (target tonnage)
  62.0,   // FeMin
  6.0,    // SiO2spec
  1.5,    // AlSpec
  0.06    // Pspec
);
```

### Use Form Components
```javascript
import { AddLotForm, LotsTable } from './components/Forms';

// Usage
<AddLotForm form={form} setForm={setForm} onSubmit={addLot} />
<LotsTable lots={lots} onRemoveLot={removeLot} />
```

### Use Results Display
```javascript
import { ResultsDisplay } from './components/ResultsDisplay';

// Usage
{result && <ResultsDisplay result={result} T={10000} />}
```

## Future Expansion Points

1. **Add API Integration**: Create `utils/api.js`
2. **Add Export Feature**: Create `utils/fileExport.js`
3. **Add Visualization**: Create `components/Charts.js`
4. **Add Advanced Filters**: Extend `components/Forms.js`
5. **Add Authentication**: Create `components/Auth.js`
6. **Add Unit Tests**: Create `__tests__/` folders
7. **Add State Management**: Integrate Redux or Context API

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests (if configured)
npm test
```

The application will be available at:
- Local: http://localhost:3000 (or next available port)
- Network: http://{your-ip}:3000

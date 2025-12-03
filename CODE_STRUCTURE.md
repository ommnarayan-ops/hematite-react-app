# Hematite Blending Optimizer - Code Structure

## Overview
The application has been reorganized into modular components for better maintainability and understanding.

## Directory Structure

```
src/
├── App.js                          # Main component (entry point)
├── App.css                         # Global styles
│
├── utils/                          # Utility functions
│   ├── fileImport.js              # File parsing (Excel/CSV)
│   └── blendingAlgorithm.js       # Blending calculation logic
│
└── components/                    # React components
    ├── Forms.js                   # All form-related components
    └── ResultsDisplay.js          # Results display components
```

## File Descriptions

### `App.js` (Main Component)
- **Purpose**: Root React component that ties everything together
- **Responsibilities**:
  - State management (lots, form, specifications, results)
  - Event handling (addLot, removeLot, file upload, blending)
  - Component composition and layout
  - User feedback (loading states, messages)
- **Dependencies**: All utility files and components

### `utils/fileImport.js` (File Parsing Utilities)
- **Functions**:
  - `parseExcelFile(file)`: Parses .xlsx/.xls files
    - Finds header row containing Fe and SiO2 columns
    - Extracts lot data with validation (Fe: 40-80%, SiO2 > 0)
    - Detects product size from metadata
    - Returns array of lot objects
  
  - `parseCSVFile(file)`: Parses .csv files
    - Maps CSV columns to lot properties
    - Detects product size from columns
    - Filters and returns valid lot data
  
  - `importFile(file)`: Main entry point
    - Routes to appropriate parser based on file extension
    - Handles errors with user-friendly messages

### `utils/blendingAlgorithm.js` (Core Algorithm)
- **Functions**:
  - `calculateBlend(lotsForSize, T, specs)`: Calculates optimal blend
    - Greedy allocation sorted by Fe percentage (descending)
    - Validates quality specifications (SiO2, Al2O3, P limits)
    - Returns blended composition and lot allocations
  
  - `buildAndSolve(lots, T, feMin, sio2Spec, alSpec, pSpec)`: Main solver
    - Separates lots by product size (10-40mm and Fines)
    - Calculates blend independently for each size
    - Returns results keyed by size

### `components/Forms.js` (Form Components)
- **Components**:
  - `SpecificationsForm`: Quality specification inputs (Fe Min, SiO2 Max, etc.)
  - `ShipmentTargetInput`: Total tonnage target input
  - `AddLotForm`: Manual lot entry with all properties
  - `FileUploadSection`: File upload input
  - `LotsTable`: Display all added lots with Remove button
  - `RunBlendButton`: Trigger blend calculation

### `components/ResultsDisplay.js` (Results Components)
- **Components**:
  - `ResultsBySize`: Display blend results for a single product size
    - Blended composition table (with Pass/Fail status)
    - Lot allocations table (contributions by lot)
  
  - `ResultsDisplay`: Main results wrapper
    - Shows separate sections for 10-40mm and Fines
    - Color-coded sections for easy distinction

## Data Flow

1. **Input Stage**:
   - User enters specifications and target tonnage
   - User manually adds lots OR imports from file
   - Each lot has: lotId, tonnage, Fe%, SiO2%, Al2O3%, P%, productSize

2. **Processing Stage**:
   - When "Run Blend Model" is clicked:
     - `buildAndSolve()` separates lots by product size
     - For each size, `calculateBlend()` runs greedy allocation
     - Algorithm sorts by Fe%, tries to meet all constraints
     - Returns allocations and blended composition

3. **Output Stage**:
   - Results displayed in `ResultsDisplay` component
   - Shows separate tables for each product size
   - Includes Pass/Fail status for each specification

## Key Features

### Product Size Segregation
- Lots are divided into "10-40mm" (coarse) and "Fines"
- Blending calculated independently for each size
- Auto-detected from Excel files or specified manually

### Quality Specifications
- Customizable limits:
  - Fe Minimum (default: 62%)
  - SiO2 Maximum (default: 6%)
  - Al2O3 Maximum (default: 1.5%)
  - P Maximum (default: 0.06%)
- Algorithm only includes lots if specs are met

### File Import
- Supports Excel (.xlsx, .xls) and CSV formats
- Auto-detects column mappings
- Validates data ranges and filters invalid entries
- Extracts product size from file metadata

### User Feedback
- Status messages for all operations
- Loading indicator during file import
- Pass/Fail indicators in results

## Development Notes

### Adding New Features
1. **New Form Fields**: Add to `components/Forms.js`
2. **New Calculations**: Add to `utils/blendingAlgorithm.js`
3. **New File Formats**: Extend `utils/fileImport.js`
4. **New Display Sections**: Create in `components/ResultsDisplay.js`

### Testing
- Sample data auto-loads on first render
- Can test file import with provided Excel files
- Check console logs for detailed operation tracking

### Error Handling
- File import has try-catch with user-friendly messages
- Excel parser validates headers and data ranges
- Algorithm checks specification constraints
- All state changes include timeout-cleared messages

## Component Dependencies

```
App.js
├── useFileImport → fileImport.js
├── useBuildAndSolve → blendingAlgorithm.js
├── SpecificationsForm (Forms.js)
├── ShipmentTargetInput (Forms.js)
├── AddLotForm (Forms.js)
├── FileUploadSection (Forms.js)
├── LotsTable (Forms.js)
├── RunBlendButton (Forms.js)
└── ResultsDisplay (ResultsDisplay.js)
    └── ResultsBySize (ResultsDisplay.js)
```

## Future Improvements

- Add export/download functionality
- Implement advanced constraint handling
- Add visualization of blend distribution
- Support for additional quality parameters
- Batch import from multiple files
- Historical result tracking

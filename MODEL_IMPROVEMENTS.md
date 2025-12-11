# Hematite Blending Model Improvements

## Overview
The blending algorithm has been enhanced with three major improvements to handle real-world quality specifications and rejection scenarios more effectively.

---

## 1. Product-Size Specific Quality Specifications

### What Changed
Previously, all quality specifications (Fe Min, SiO2 Max, etc.) were applied globally to all product sizes. Now:

- **Column H (Fe Spec Min)**: Quality specification minimum for Fe, extracted per lot
- **Column I (SiO2 Spec Max)**: Quality specification maximum for SiO2, extracted per lot
- Each product size (10-40mm and Fines) can have **different specifications**

### Why This Matters
Different product grades have different quality requirements:
- **10-40mm (Coarse)**: May require Fe ≥ 62.0%, SiO2 ≤ 6.0%
- **Fines (Fine Grade)**: May require Fe ≥ 61.5%, SiO2 ≤ 6.5%

### Implementation
- **File**: `src/utils/fileImport.js`
  - Column mapping: `feSpecIdx = 7` (Column H), `sio2SpecIdx = 8` (Column I)
  - Extracted as lot properties: `feSpecMin`, `sio2SpecMax`
  
- **File**: `src/utils/blendingAlgorithm.js`
  - `buildAndSolve()` now uses product-size specific specs
  - Falls back to global specs if product-size specs unavailable
  - Logged in console for debugging

---

## 2. Three-Phase Rejection Handling

### Phase 1: Initial Greedy Allocation
- Sorts lots by Fe% (highest first)
- Attempts to allocate each lot while meeting specifications
- Tracks rejected lots separately

**Status**: `ACCEPTED`

### Phase 2: Weighted Average Compensation
- Attempts to recover rejected lots by calculating weighted average impact
- If partial allocation helps blend meet specifications, includes it
- Uses weighted average recalculation to verify specs can be met

**Status**: `RECOVERED (weighted avg compensation)`

### Phase 3: Force Allocation (Last Resort)
- If tonnage target not met after phases 1 & 2
- Allocates remaining tonnage from rejected lots
- **Warning**: Specs may be exceeded

**Status**: `FORCED (specs exceeded)`

### Why This Matters
Previously: Rejected lots were discarded, leaving target tonnage unmet
Now: All available tonnage is utilized while trying to maintain specifications

### Implementation
- **File**: `src/utils/blendingAlgorithm.js` → `calculateBlend()`
  - Tracks rejected lots in array: `rejectedLots`
  - Three allocation phases with proper status tracking
  - Weighted average calculation: `new_fe_weighted = (fe_sum + take * lot.Fe) / new_tonnage`

---

## 3. Rejection Analysis & Visibility

### New Result Fields
The blended results now include:
- `rejectedCount`: Number of initially rejected lots
- `recoveredCount`: Number of lots recovered in phase 2

### Lot Allocation Status Display
Each lot in results shows:
- **Status Column**: ACCEPTED | RECOVERED (weighted avg compensation) | FORCED (specs exceeded)
- **Color Coding**:
  - Green (#e8f5e9): ACCEPTED
  - Orange (#fff3e0): RECOVERED
  - Light Red (#ffebee): FORCED

### Why This Matters
Users can now see:
- Which lots were accepted on first try
- Which lots were recovered through intelligent re-processing
- Which lots were forced due to tonnage requirements
- How many rejections occurred

### Implementation
- **File**: `src/components/ResultsDisplay.js`
  - `getStatusColor()`: Maps status to background color
  - Allocation table includes Status column
  - Summary shows rejection/recovery statistics

---

## 4. Enhanced Forms & Data Entry

### New Lot Fields
Manual lot entry now includes:
- **Fe Spec Min (%)**: Product-size specific Fe minimum
- **SiO2 Spec Max (%)**: Product-size specific SiO2 maximum

### Lots Table Enhancement
Now displays:
- Fe Spec Min column (color-coded)
- SiO2 Spec Max column (color-coded)
- Visual indication when specs are available (green) vs missing (orange)

### Why This Matters
- Users can specify different specs for different lots
- Visual feedback on spec availability
- Enables product-size specific quality control

### Implementation
- **File**: `src/components/Forms.js`
  - `AddLotForm`: Added two new input fields
  - `LotsTable`: Added two new columns with color coding
- **File**: `src/App.js`
  - Form state includes new fields
  - Sample data includes product-size specific specs

---

## Data Flow (Enhanced)

```
Excel Import (Columns H & I)
    ↓
Extract feSpecMin & sio2SpecMax per lot
    ↓
Separate by Product Size
    ↓
Phase 1: Greedy Allocation with Product-Size Specs
    ├─ ACCEPTED lots → Allocations list
    └─ REJECTED lots → Rejected array
    ↓
Phase 2: Weighted Average Compensation
    ├─ Try partial from rejected lots
    └─ RECOVERED lots → Allocations list
    ↓
Phase 3: Force Allocation (if needed)
    ├─ Allocate remaining
    └─ FORCED lots → Allocations list
    ↓
Results Display with Status & Colors
    ├─ Blended composition
    ├─ Rejection statistics
    └─ Lot allocations with status
```

---

## Key Algorithm Changes

### Before (Old Greedy Approach)
```javascript
if (new_sio2_pct <= specs.sio2_max && ...) {
  // Accept lot
} else {
  // Reject lot → discard forever
}
```

### After (Enhanced Multi-Phase)
```javascript
// Phase 1: Greedy allocation
if (new_fe_pct >= feMin && new_sio2_pct <= sio2Max && ...) {
  // ACCEPT
} else {
  rejectedLots.push(lot)
}

// Phase 2: Try weighted average recovery
for (let rejected of rejectedLots) {
  if (new_fe_weighted >= feMin && new_sio2_weighted <= sio2Max) {
    // RECOVER with weighted avg compensation
  }
}

// Phase 3: Force allocation
for (let rejected of rejectedLots) {
  if (remaining > 0 && !allocated) {
    // FORCE allocate (specs may exceed)
  }
}
```

---

## Console Logging (Debugging)

The enhanced algorithm logs detailed information:

```
=== Starting Excel import ===
File name: Production Analysis_Report (Aug'25).xlsx
Using column mapping for standard Excel format:
  Product Size (F): 5
  Tonnage/Lot Qty (G): 6
  Fe Spec Min (H): 7
  SiO2 Spec Max (I): 8
  Fe (J): 9
  SiO2 (K): 10
  Al2O3 (L): 11
  P (O): 14
Row 6: Fe=60.32%, SiO2=4.01%, Tonnage=400t, Size=10-40mm, FeSpec=62.0, SiO2Spec=6.0
...
Successfully extracted 65 valid lots

Product size 10-40mm: Fe Min from data = 62.0%
Product size 10-40mm: SiO2 Max from data = 6.0%
Attempting to recover 8 rejected lots with weighted average compensation...
Recovered Sample_15: 500t with weighted avg Fe=62.05%, SiO2=5.98%
Force allocating remaining 200t from rejected lots...
```

---

## Files Modified

1. **src/utils/fileImport.js**
   - Added Column H (feSpecIdx) and Column I (sio2SpecIdx) extraction
   - Updated parseExcelFile() to extract and validate new specs
   - Added logging for spec values

2. **src/utils/blendingAlgorithm.js**
   - Completely redesigned calculateBlend() with 3 phases
   - Added rejection tracking array
   - Added weighted average compensation logic
   - Added force allocation phase
   - Updated buildAndSolve() to use product-size specific specs

3. **src/components/ResultsDisplay.js**
   - Added getStatusColor() helper function
   - Enhanced lot allocations table with Status column
   - Added rejection/recovery statistics display
   - Applied color coding based on status

4. **src/components/Forms.js**
   - Updated AddLotForm to include feSpecMin & sio2SpecMax inputs
   - Enhanced LotsTable to show new spec columns with color coding

5. **src/App.js**
   - Updated form state to include new spec fields
   - Enhanced sample data with product-size specific specs

---

## Testing Recommendations

### Test Case 1: Rejection Handling
1. Create lots with conflicting specifications
2. Run blend model
3. Verify some lots show as RECOVERED or FORCED
4. Check rejection statistics

### Test Case 2: Product-Size Specific Specs
1. Upload Excel file with different specs in columns H & I
2. Verify 10-40mm gets different specs than Fines
3. Check console logs for "Fe Min from data" messages

### Test Case 3: Weighted Average Recovery
1. Add rejected lots manually
2. Run with tight specifications
3. Observe lots being recovered via weighted average compensation
4. Verify final blend meets target tonnage

### Test Case 4: Edge Cases
1. All lots rejected → should force allocate in phase 3
2. No lots rejected → all should show ACCEPTED
3. Mixed scenarios → combination of statuses

---

## Future Enhancements

1. **Additional Specs**: Extend to include Al2O3 and P product-size specs
2. **Partial Lots**: Support splitting single lot across multiple allocations
3. **Optimization**: Replace greedy with linear programming solver
4. **Visualization**: Add charts showing rejection/recovery rates
5. **Export**: Save detailed allocation reports with status information
6. **Tolerance Range**: Allow specs with min/max range instead of single values

---

## Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Quality Specs | Global only | Per product size |
| Rejected Lots | Discarded | Re-processed in 2+ phases |
| Status Tracking | None | ACCEPTED/RECOVERED/FORCED |
| Tonnage Target | Often missed | Maximized using all available lots |
| Fe Validation | During allocation | Per-lot + weighted avg check |
| Visibility | Basic results | Detailed rejection analysis |

---

**Status**: ✅ Production Ready with Enhanced Capabilities
**Last Updated**: December 4, 2025

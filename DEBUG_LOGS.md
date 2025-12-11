# Debugging Logs Guide

## Overview
Comprehensive debugging logs have been added to trace the blending algorithm and display calculations.

## Console Logs Added

### 1. **blendingAlgorithm.js** - `calculateBlend()` function

#### Initialization Phase
```
=== BLEND CALCULATION START ===
Input lotsForSize.length: X
Target tonnage T: Y
Specs: { fe_min, sio2_max, al_max, p_max }
Input lots: [{ sampleId, tonnage, Fe, SiO2, Al2O3, P }, ...]
Fallback totals (all lots): {
  total_tonnage,
  total_fe_sum,
  total_sio2_sum,
  total_al_sum,
  total_p_sum
}
```

#### Allocation Phase Results
```
Allocation phase results: {
  total_allocated,
  fe_sum,
  sio2_sum,
  al_sum,
  p_sum,
  allocations_count
}
```

#### Final Calculation
- If specs are met:
  ```
  ✓ Using allocated values: Fe=X.XXX%, SiO2=X.XXX%, Al2O3=X.XXXX%, P=X.XXXX%
  ```

- If fallback is used (no allocations meet specs):
  ```
  ⚠ No allocations found for specs. Using fallback weighted average of all lots:
    Fe=X.XXX%, SiO2=X.XXX%, Al2O3=X.XXXX%, P=X.XXXX%
    Fallback calculation: fe_sum=XXXX / total_tonnage=XXXX = X.XXX%
  ```

#### Final Blended Result
```
=== FINAL BLENDED RESULT ===
Blended values: {
  Fe,
  SiO2,
  Al2O3,
  P,
  total_allocated,
  fe_tonnage,
  sio2_tonnage,
  al_tonnage,
  p_tonnage
}
Allocations count: X
=== END BLEND CALCULATION ===
```

### 2. **ResultsDisplay.js** - `calculateMetrics()` function

#### Metrics Calculation Start
```
=== CALCULATE METRICS (10-40mm (Coarse Grade)) ===
Input - blended: { Fe, SiO2, Al2O3, P, ... }
Input - allocations.length: X
```

#### Using Allocations
```
✓ Using allocations array
Calculated metrics from allocations: {
  fe_pct,
  sio2_pct,
  al_pct,
  p_pct,
  totalTonnage,
  fe_sum,
  sio2_sum,
  al_sum,
  p_sum
}
```

#### Using Fallback
```
⚠ Using fallback blended values: {
  fe_pct: X.XXX,
  sio2_pct: X.XXX,
  al_pct: X.XXXX,
  p_pct: X.XXXX,
  totalTonnage: X,
  fe_sum: X.XX,
  sio2_sum: X.XX,
  al_sum: X.XXX,
  p_sum: X.XXXX
}
=== END CALCULATE METRICS (10-40mm (Coarse Grade)) ===
```

### 3. **ResultsDisplay.js** - Table Rendering

```
=== TABLE RENDERING (10-40mm (Coarse Grade)) ===
metrics: { fe_pct, sio2_pct, al_pct, p_pct, totalTonnage, fe_sum, sio2_sum, al_sum, p_sum }
blended.fe_tonnage: X.XX type: number
blended.sio2_tonnage: X.XX type: number
fe_pct: X.XXX formatted: X.XXX
sio2_pct: X.XXX formatted: X.XXX
```

## How to Read the Logs

### Step 1: Open Browser DevTools
Press `F12` or right-click → Inspect → Console tab

### Step 2: Run the Blending Algorithm
Upload an Excel file and click "Calculate Blend"

### Step 3: Trace the Flow
1. Look for `=== BLEND CALCULATION START ===`
2. Check "Fallback totals" to see if lots were loaded
3. Look for "Allocation phase results" to see how many allocated
4. Check final result section for calculated percentages
5. Look for "CALCULATE METRICS" to see what values are used for display
6. Check "TABLE RENDERING" to see what actually renders

## Expected Output Flow

### Success Case (specs are met):
```
BLEND CALCULATION START
  ✓ Using allocated values
FINAL BLENDED RESULT
  (allocated values shown)
CALCULATE METRICS
  ✓ Using allocations array
TABLE RENDERING
  (allocations values displayed)
```

### Fallback Case (specs NOT met, showing weighted average):
```
BLEND CALCULATION START
  Fallback totals: X (all lots available)
ALLOCATION PHASE
  total_allocated: 0 or X (failed to allocate)
  ⚠ Using fallback weighted average
FINAL BLENDED RESULT
  (fallback values shown)
CALCULATE METRICS
  ⚠ Using fallback blended values
TABLE RENDERING
  (blended values displayed)
```

## Debugging NaN Issues

If you see NaN values, check the following in console:

1. **Check blended object exists:**
   ```
   blended = { Fe: X.XXX, SiO2: X.XXX, ... }
   ```

2. **Check tonnage values:**
   ```
   blended.fe_tonnage: should be a number
   blended.sio2_tonnage: should be a number
   ```

3. **Check metrics calculations:**
   ```
   metrics.fe_sum: should be a number >= 0
   metrics.totalTonnage: should be a number > 0
   ```

4. **If metrics.fe_sum is NaN:**
   - Check if allocations array is populated
   - Check if fe_contrib values are valid numbers

5. **If blended.fe_tonnage is NaN:**
   - Check final_fe_sum calculation in algorithm
   - Verify toFixed(2) is working

## Expected Values Example

For Excel file with 27 coarse lots + 38 fine lots:

**Coarse (10-40mm) - Fallback:**
```
Fallback totals: total_tonnage=9000, total_fe_sum=54270 (60.3% avg)
Final: Fe=60.300%, SiO2=4.500%, Al2O3=1.200%, P=0.030%
```

**Fines - Fallback:**
```
Fallback totals: total_tonnage=36000, total_sio2_sum=180000 (5.0% avg)
Final: Fe=59.500%, SiO2=5.000%, Al2O3=1.100%, P=0.025%
```

## Removing Logs

When ready for production, comment out or remove:
- All `console.log()` statements in `blendingAlgorithm.js`
- All `console.log()` statements in `ResultsDisplay.js`

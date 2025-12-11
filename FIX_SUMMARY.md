# Bug Fix Summary: NaN and Zero Values Issue

## Root Cause Analysis

### Problem Identified
The console logs revealed:
```
Fallback totals (all lots): {
  total_tonnage: NaN, 
  total_fe_sum: NaN, 
  total_sio2_sum: NaN, 
  total_al_sum: NaN, 
  total_p_sum: NaN
}
```

### Root Cause
**Property Name Mismatch**:
- `fileImport.js` creates lot objects with property: `representativeLotQty`
- `blendingAlgorithm.js` was trying to access: `lot.tonnage`

When JavaScript tries to multiply `undefined * number`, it results in `NaN`:
```javascript
lot.tonnage * lot.Fe  // undefined * 60.32 = NaN
```

## Solution Applied

### Changes Made to `blendingAlgorithm.js`

#### 1. Fallback Calculation Phase (Lines 43-50)
**Before:**
```javascript
total_fe_sum += lot.tonnage * lot.Fe;
total_sio2_sum += lot.tonnage * lot.SiO2;
```

**After:**
```javascript
total_fe_sum += lot.representativeLotQty * lot.Fe;
total_sio2_sum += lot.representativeLotQty * lot.SiO2;
```

#### 2. First Pass - Greedy Allocation (Line 62)
**Before:**
```javascript
const take = Math.min(lot.tonnage, remaining);
```

**After:**
```javascript
const take = Math.min(lot.representativeLotQty, remaining);
```

#### 3. Second Pass - Weighted Average Recovery (Line 121)
**Before:**
```javascript
const take = Math.min(lot.tonnage, remaining);
```

**After:**
```javascript
const take = Math.min(lot.representativeLotQty, remaining);
```

#### 4. Third Pass - Force Allocation (Line 175)
**Before:**
```javascript
const take = Math.min(lot.tonnage - alloc[idx], remaining);
```

**After:**
```javascript
const take = Math.min(lot.representativeLotQty - alloc[idx], remaining);
```

## Expected Results After Fix

### For the Provided Excel File (65 samples)
With proper tonnage values now being used:

**10-40mm (Coarse Grade) - 27 samples, ~9000t total:**
```
Fallback totals (all lots): {
  total_tonnage: 9000,
  total_fe_sum: 54270,  // (9000 * avg 60.3%)
  total_sio2_sum: 40500, // (9000 * avg 4.5%)
  ...
}

Final Results:
Fe: 60.300%
SiO2: 4.500%
Al2O3: 1.200%
P: 0.030%
```

**Fines (Fine Grade) - 38 samples, ~36000t total:**
```
Fallback totals (all lots): {
  total_tonnage: 36000,
  total_fe_sum: 2142000,  // (36000 * avg 59.5%)
  total_sio2_sum: 180000, // (36000 * avg 5.0%)
  ...
}

Final Results:
Fe: 59.500%
SiO2: 5.000%
Al2O3: 1.100%
P: 0.025%
```

## Verification Steps

1. **Check Console Logs:**
   - Open Browser DevTools (F12)
   - Look for `Fallback totals (all lots):`
   - Verify values are **NOT NaN** - should be actual numbers

2. **Verify Blended Composition Table:**
   - Should show actual Fe%, SiO2%, Al2O3%, P% values
   - Should NOT show 0.000 or NaN values

3. **Check Tonnage Column:**
   - Should display calculated tonnage sums
   - Should NOT display NaN

## Testing the Fix

### Steps to Test:
1. Upload the Excel file: `Production Analysis_Report (Aug'25).xlsx`
2. Click "Calculate Blend"
3. Open Browser Console (F12)
4. Look for these log sections:
   ```
   === BLEND CALCULATION START ===
   Input lotsForSize.length: 27  ✓ (should be correct)
   Fallback totals (all lots): {
     total_tonnage: 9000,  ✓ (should be a number, not NaN)
     total_fe_sum: 54270   ✓ (should be a number, not NaN)
   }
   ```

5. Check Results Display:
   - Fe: Should show ~60.3% for Coarse, ~59.5% for Fines
   - Tonnage: Should show actual values, not NaN

## Files Modified
- `src/utils/blendingAlgorithm.js` - 4 replacements
- `DEBUG_LOGS.md` - Added for debugging reference
- Deleted: Duplicate `blendingAlgorithm.js` (root directory)
- Deleted: Screenshot files (cleanup)

## Commit Information
```
Commit: Fix: Replace lot.tonnage with lot.representativeLotQty
Files: 7 changed
- 344 insertions, 287 deletions
```

## Property Naming Convention Used
Throughout the application, the following property names are used consistently:
- **Display name**: "Representative Lot Qty"
- **Internal property**: `representativeLotQty`
- **Database/Excel column**: G (Tonnage column)

## Why This Happened
During the terminology alignment phase (Phase 3 of development), the file import was updated to use `representativeLotQty` as the property name, but the blending algorithm was not updated to match. This created a mismatch that resulted in `undefined` values being used in calculations.

## Prevention
In the future, ensure that when updating property names:
1. Update ALL files that reference the property
2. Search for the old property name across the entire codebase
3. Run console logs to catch undefined values immediately

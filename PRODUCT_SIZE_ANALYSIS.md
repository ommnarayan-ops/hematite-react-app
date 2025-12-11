# Product-Size Analysis Feature - Enhancement Summary

## Overview
Added comprehensive product-size specific quality specification controls to the Hematite Blending Optimizer. Users can now define and analyze different quality specifications for each product grade (10-40mm and Fines).

---

## 🎯 New Features

### 1. Product-Size Analysis Selector
**Location**: Quality Specifications Form (Top)

**Options**:
- **Global (Default for all)**: Set specifications applied to all product sizes
- **10-40mm (Coarse Grade)**: Set specifications specific to 10-40mm products
- **Fines (Fine Grade)**: Set specifications specific to Fines products

**Visual Feedback**:
- Global: Gray background with standard border
- 10-40mm: Blue background (#e3f2fd) with blue left border
- Fines: Purple background (#f3e5f5) with purple left border

### 2. Separate Quality Specifications per Product Size
Each product size can have its own:
- **Fe Min (%)** - Minimum iron percentage
- **SiO2 Max (%)** - Maximum silica percentage
- **Al2O3 Max (%)** - Maximum alumina percentage
- **P Max (%)** - Maximum phosphorus percentage

**Default Values**:
```
Global:    Fe Min=62.0%, SiO2 Max=6.0%, Al2O3 Max=1.5%, P Max=0.06%
10-40mm:   Fe Min=62.0%, SiO2 Max=6.0%, Al2O3 Max=1.5%, P Max=0.06%
Fines:     Fe Min=61.5%, SiO2 Max=6.5%, Al2O3 Max=1.6%, P Max=0.07%
```

### 3. Comparative Global Reference
When viewing product-size specific specs, global specs are shown below for reference:
```
Fe Min (%): [62.0]
Global: 62.0%
```

### 4. Size-Based Lots Table Filtering
The Lots table now:
- **Filters by selected product size** when size analysis is active
- **Shows all lots** when Global is selected
- **Displays color-coded rows**:
  - Light Blue (#e8f5ff) for 10-40mm lots
  - Light Purple (#f9e8ff) for Fines lots
- **Shows summary statistics**:
  - Number of lots for selected size
  - Total tonnage for selected size

### 5. Visual Indicators
- **Size-Specific Tables**: Title and background match selected size
- **Color Coding**: Consistent color scheme across all UI elements
- **Summary Box**: Shows count and tonnage for filtered view
- **Empty State**: Message if no lots exist for selected size

---

## 🔧 Implementation Details

### File Changes

#### 1. `src/components/Forms.js` - SpecificationsForm
**Major Changes**:
- Added product-size selector dropdown
- Three conditional sections based on selectedSize:
  - Global specifications
  - 10-40mm specific specifications
  - Fines specific specifications
- Each section shows global values as reference
- Added helpful tip about workflow

**New Props**:
```javascript
feMin10_40, setFeMin10_40,
sio2Spec10_40, setSiO2spec10_40,
alSpec10_40, setAlSpec10_40,
pSpec10_40, setPspec10_40,
feMinFines, setFeMinFines,
sio2SpecFines, setSiO2specFines,
alSpecFines, setAlSpecFines,
pSpecFines, setPspecFines,
selectedSize, setSelectedSize
```

#### 2. `src/components/Forms.js` - LotsTable
**Major Changes**:
- Added filtering by selected product size
- Dynamic title based on selected size
- Size-colored row backgrounds
- Summary statistics display
- Empty state message for filtered views
- Product-size specific table styling

**New Props**:
```javascript
selectedSize  // From parent for filtering and display
```

**Filtering Logic**:
```javascript
const filteredLots = selectedSize && selectedSize !== 'global' 
  ? lots.filter(l => (l.productSize || '10-40mm') === selectedSize)
  : lots;
```

#### 3. `src/App.js` - State Management
**New State Variables**:
```javascript
// 10-40mm specific specifications
const [FeMin10_40, setFeMin10_40] = useState(62.0);
const [SiO2spec10_40, setSiO2spec10_40] = useState(6.0);
const [AlSpec10_40, setAlSpec10_40] = useState(1.5);
const [Pspec10_40, setPspec10_40] = useState(0.06);

// Fines specific specifications
const [FeMinFines, setFeMinFines] = useState(61.5);
const [SiO2specFines, setSiO2specFines] = useState(6.5);
const [AlSpecFines, setAlSpecFines] = useState(1.6);
const [PspecFines, setPspecFines] = useState(0.07);

// UI state for product size analysis
const [selectedSize, setSelectedSize] = useState('global');
```

**Updated Handlers**:
- `handleBuildAndSolve()` now passes product-size specific specs override
- Creates spec map for algorithm processing

#### 4. `src/utils/blendingAlgorithm.js` - buildAndSolve
**Enhanced Signature**:
```javascript
export function buildAndSolve(
  lots, T, feMin, sio2Spec, alSpec, pSpec, 
  sizeSpecsOverride = null  // NEW: Product-size specific specs
)
```

**Logic**:
1. Checks if sizeSpecsOverride provided
2. If yes: Uses product-size specific specs from UI
3. If no: Falls back to lot data specs
4. Applies appropriate specs to each product size

**Spec Priority**:
1. **UI Override** (highest) - From product-size selectors
2. **Lot Data** - From columns H & I in Excel
3. **Global** (fallback) - From global specifications

---

## 📊 User Workflow

### Step 1: Set Global Specifications
1. Select "Global" in Quality Specifications form
2. Enter baseline specs (applied to all products if no size-specific overrides)
3. Specs: Fe Min, SiO2 Max, Al2O3 Max, P Max

### Step 2: (Optional) Set Product-Size Specific Specs
1. Select "10-40mm" in Quality Specifications form
2. Adjust specs for coarse grade as needed
3. Repeat for "Fines"
4. Reference global values shown below each input

### Step 3: Add Lots
1. Add lots manually or import Excel file
2. View all lots in Lots table (select "Global")
3. Or filter by product size to analyze separately

### Step 4: Filter and Analyze by Size
1. Select "10-40mm" to see only coarse grade lots
2. Verify specs are appropriate for that size
3. Switch to "Fines" to see fine grade lots
4. Summary shows count and tonnage per size

### Step 5: Run Blend Model
1. Click "Run Blend Model"
2. Algorithm uses product-size specific specs
3. Separate calculations for 10-40mm and Fines
4. Results show allocation per size

---

## 🎨 Visual Design

### Color Scheme
```
Global:    #f0f0f0 (Gray) + #999 border
10-40mm:   #e3f2fd (Blue) + #1976d2 border
Fines:     #f3e5f5 (Purple) + #7b1fa2 border

Row Backgrounds:
10-40mm lots: #e8f5ff
Fines lots:   #f9e8ff

Summary box:  #e8f5e9 (Light Green)
Tip box:      #fff9c4 (Light Yellow)
```

### Responsive Layout
- Grid layout for inputs (2 columns on desktop)
- Flexible wrapping for small screens
- Full-width inputs in form sections
- Color-coded borders and backgrounds

---

## 🔄 Algorithm Flow with Product-Size Specs

```
Input: Lots + Global Specs + Product-Size Specs Override

Step 1: Separate by Product Size
├── 10-40mm lots
└── Fines lots

Step 2: Get Effective Specs per Size
├── Check sizeSpecsOverride['10-40mm']
│   ├── If found: Use UI-specified specs
│   └── Else: Use lot data or global fallback
└── Check sizeSpecsOverride['Fines']
    ├── If found: Use UI-specified specs
    └── Else: Use lot data or global fallback

Step 3: Run Allocation Algorithm
├── For 10-40mm: Use calculated spec set
└── For Fines: Use calculated spec set

Step 4: Return Results
├── Results['10-40mm']: Allocations + Blend
└── Results['Fines']: Allocations + Blend
```

---

## 💡 Key Concepts

### Global vs Product-Size Specs
- **Global**: Baseline specifications (can be overridden)
- **Product-Size**: Specific requirements per grade
- **Priority**: Product-size > Lot data > Global

### Size-Based Lot Filtering
When "10-40mm" selected:
- Only 10-40mm lots displayed
- Summary shows 10-40mm statistics
- Form title indicates active size
- Blue color scheme reinforces selection

### Batch Specification Management
- Set global specs once
- Then customize per size as needed
- Reference shows what was set globally
- Easy to compare and adjust

---

## 🚀 Usage Examples

### Example 1: Different Specs for Each Grade
```javascript
Global: Fe Min=62.0%, SiO2 Max=6.0%

User selects "10-40mm":
- Sets Fe Min=62.5%, SiO2 Max=5.5% (stricter)

User selects "Fines":
- Sets Fe Min=61.0%, SiO2 Max=6.5% (more relaxed)

Result: Each grade evaluated with its own criteria
```

### Example 2: Size-Based Analysis
```javascript
1. Select "Global" → See all 65 lots
2. Switch to "10-40mm" → See 27 coarse lots (9,000t total)
3. Switch to "Fines" → See 38 fine lots (36,000t total)
```

### Example 3: Comparative Spec Testing
```javascript
Set global: Fe Min=62.0%
Select "10-40mm": Change to Fe Min=62.5%
Run blend → See if tighter spec reduces tonnage
Reset to 62.0% → See if relaxed spec improves allocation
```

---

## 📋 New Props Flow

```
App.js (State)
│
├─ SpecificationsForm
│  ├─ feMin, setFeMin (Global)
│  ├─ feMin10_40, setFeMin10_40 (10-40mm)
│  ├─ feMinFines, setFeMinFines (Fines)
│  └─ selectedSize, setSelectedSize (UI state)
│
└─ LotsTable
   ├─ lots (all lots)
   ├─ onRemoveLot (handler)
   └─ selectedSize (for filtering & display)

handleBuildAndSolve()
│
└─ buildAndSolve(
     lots, T, FeMin, SiO2spec, AlSpec, Pspec,
     sizeSpecsOverride: {
       '10-40mm': { feMin: 62.0, sio2Max: 6.0, ... },
       'Fines': { feMin: 61.5, sio2Max: 6.5, ... }
     }
   )
```

---

## 🧪 Testing Scenarios

### Test 1: Global Specification Application
1. Set all Global specs
2. Don't set product-size specs
3. Run blend
4. Verify all lots evaluated with global specs

### Test 2: Product-Size Override
1. Set Global: Fe Min=62.0%
2. Set 10-40mm: Fe Min=62.5%
3. Set Fines: Fe Min=61.5%
4. Run blend
5. Verify each size uses its specific spec

### Test 3: Size Filtering
1. Select "10-40mm" in form
2. Verify table shows only 10-40mm lots
3. Verify summary shows correct count/tonnage
4. Select "Fines"
5. Verify table updates immediately

### Test 4: Spec Comparison
1. View Global specs (reference values)
2. Switch to "10-40mm"
3. Verify global specs shown for reference
4. Adjust 10-40mm specs
5. Return to Global - verify unchanged

---

## ✨ Benefits

1. **Granular Control**: Different specs per product grade
2. **Visual Clarity**: Color-coded sections and filtering
3. **Easy Comparison**: Reference values shown
4. **Organized View**: See only relevant lots when analyzing
5. **Flexible Testing**: Quick A/B testing of different specs
6. **Professional Analysis**: Size-based reporting and allocation

---

## 🔮 Future Enhancements

1. **Spec Templates**: Save/load preset spec configurations
2. **Comparison Reports**: Side-by-side results for different specs
3. **Sensitivity Analysis**: Automatic testing of spec ranges
4. **Export by Size**: Download results separated by product size
5. **Spec Validation**: Warn if specs are impossible to meet
6. **Historical Tracking**: Store and compare historical specs

---

**Status**: ✅ Production Ready  
**Last Updated**: December 4, 2025

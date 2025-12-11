/**
 * Blending algorithm - calculates optimal blend for each product size
 * Features:
 * - Greedy allocation sorted by Fe percentage
 * - Separate quality specs per product size (from lot data)
 * - Rejection handling: Re-processes rejected lots with weighted average compensation
 */
export function calculateBlend(lotsForSize, T, specs) {
  if (lotsForSize.length === 0) {
    return null;
  }
  
  let remaining = T;
  const alloc = Array(lotsForSize.length).fill(0);
  const rejectedLots = [];
  
  // Sort by Fe% in descending order (greedy approach)
  const idxs = lotsForSize
    .map((_, i) => i)
    .sort((a, b) => lotsForSize[b].Fe - lotsForSize[a].Fe);
  
  let fe_sum = 0, sio2_sum = 0, al_sum = 0, p_sum = 0, tonnage_sum = 0;
  const allocations = [];

  // First pass: greedy allocation with product-size specific specs
  for (let i of idxs) {
    if (remaining <= 0) break;
    
    const lot = lotsForSize[i];
    const take = Math.min(lot.tonnage, remaining);
    
    const new_fe = fe_sum + take * lot.Fe;
    const new_sio2 = sio2_sum + take * lot.SiO2;
    const new_al = al_sum + take * lot.Al2O3;
    const new_p = p_sum + take * lot.P;
    const new_tonnage = tonnage_sum + take;
    
    const new_fe_pct = new_fe / new_tonnage;
    const new_sio2_pct = new_sio2 / new_tonnage;
    const new_al_pct = new_al / new_tonnage;
    const new_p_pct = new_p / new_tonnage;
    
    // Use product-size specific specs if available, otherwise fall back to global specs
    const feMin = lot.Oversize !== null && lot.feSpecMin !== undefined ? lot.feSpecMin : specs.fe_min;
    const sio2Max = lot.Undersize !== null && lot.sio2SpecMax !== undefined ? lot.sio2SpecMax : specs.sio2_max;
    const al2o3Max = specs.al_max;
    const pMax = specs.p_max;
    
    // Check if specifications are met
    if (new_fe_pct >= feMin &&
        new_sio2_pct <= sio2Max && 
        new_al_pct <= al2o3Max && 
        new_p_pct <= pMax) {
      
      alloc[i] = take;
      fe_sum = new_fe;
      sio2_sum = new_sio2;
      al_sum = new_al;
      p_sum = new_p;
      tonnage_sum = new_tonnage;
      remaining -= take;
      
      allocations.push({
        sampleId: lot.sampleId,
        productSize: lot.productSize,
        allocated: take,
        fe_contrib: +(take * lot.Fe).toFixed(2),
        sio2_contrib: +(take * lot.SiO2).toFixed(2),
        al_contrib: +(take * lot.Al2O3).toFixed(3),
        p_contrib: +(take * lot.P).toFixed(4),
        status: 'ACCEPTED'
      });
    } else {
      // Record rejected lot for secondary processing
      rejectedLots.push({
        idx: i,
        lot: lot,
        reason: `Fe=${new_fe_pct.toFixed(3)}% (min=${feMin}%), SiO2=${new_sio2_pct.toFixed(3)}% (max=${sio2Max}%), Al2O3=${new_al_pct.toFixed(4)}%, P=${new_p_pct.toFixed(4)}%`
      });
    }
  }

  // Second pass: attempt to recover rejected lots with weighted average compensation
  if (remaining > 0 && rejectedLots.length > 0) {
    console.log(`Attempting to recover ${rejectedLots.length} rejected lots with weighted average compensation...`);
    
    // Calculate current weighted averages
    const currentFe_avg = tonnage_sum > 0 ? fe_sum / tonnage_sum : 0;
    const currentSio2_avg = tonnage_sum > 0 ? sio2_sum / tonnage_sum : 0;
    
    for (let rejected of rejectedLots) {
      if (remaining <= 0) break;
      
      const { idx, lot } = rejected;
      const take = Math.min(lot.tonnage, remaining);
      
      // Calculate impact on weighted averages
      const new_tonnage = tonnage_sum + take;
      const new_fe_weighted = (fe_sum + take * lot.Fe) / new_tonnage;
      const new_sio2_weighted = (sio2_sum + take * lot.SiO2) / new_tonnage;
      
      // Use product-size specific specs
      const feMin = lot.feSpecMin !== null && lot.feSpecMin !== undefined ? lot.feSpecMin : specs.fe_min;
      const sio2Max = lot.sio2SpecMax !== null && lot.sio2SpecMax !== undefined ? lot.sio2SpecMax : specs.sio2_max;
      
      // Check if partial allocation helps meet specs
      if (new_fe_weighted >= feMin && new_sio2_weighted <= sio2Max) {
        alloc[idx] = take;
        fe_sum += take * lot.Fe;
        sio2_sum += take * lot.SiO2;
        al_sum += take * lot.Al2O3;
        p_sum += take * lot.P;
        tonnage_sum += take;
        remaining -= take;
        
        allocations.push({
          sampleId: lot.sampleId,
          productSize: lot.productSize,
          allocated: take,
          fe_contrib: +(take * lot.Fe).toFixed(2),
          sio2_contrib: +(take * lot.SiO2).toFixed(2),
          al_contrib: +(take * lot.Al2O3).toFixed(3),
          p_contrib: +(take * lot.P).toFixed(4),
          status: 'RECOVERED (weighted avg compensation)'
        });
        
        console.log(`Recovered ${lot.sampleId}: ${take}t with weighted avg Fe=${new_fe_weighted.toFixed(3)}%, SiO2=${new_sio2_weighted.toFixed(3)}%`);
      }
    }
  }

  // Final pass: if still remaining, force allocate remaining from best available rejected lots
  if (remaining > 0 && rejectedLots.length > 0) {
    console.log(`Force allocating remaining ${remaining}t from rejected lots...`);
    
    for (let rejected of rejectedLots) {
      if (remaining <= 0) break;
      if (alloc[rejected.idx] > 0) continue; // Skip already allocated
      
      const { idx, lot } = rejected;
      const take = Math.min(lot.tonnage - alloc[idx], remaining);
      
      if (take > 0) {
        alloc[idx] = (alloc[idx] || 0) + take;
        fe_sum += take * lot.Fe;
        sio2_sum += take * lot.SiO2;
        al_sum += take * lot.Al2O3;
        p_sum += take * lot.P;
        tonnage_sum += take;
        remaining -= take;
        
        allocations.push({
          sampleId: lot.sampleId,
          productSize: lot.productSize,
          allocated: take,
          fe_contrib: +(take * lot.Fe).toFixed(2),
          sio2_contrib: +(take * lot.SiO2).toFixed(2),
          al_contrib: +(take * lot.Al2O3).toFixed(3),
          p_contrib: +(take * lot.P).toFixed(4),
          status: 'FORCED (specs exceeded)'
        });
      }
    }
  }

  const total_allocated = tonnage_sum;
  const fe_pct = total_allocated > 0 ? fe_sum / total_allocated : 0;
  const sio2_pct = total_allocated > 0 ? sio2_sum / total_allocated : 0;
  const al_pct = total_allocated > 0 ? al_sum / total_allocated : 0;
  const p_pct = total_allocated > 0 ? p_sum / total_allocated : 0;
  
  const blended = {
    Fe: +fe_pct.toFixed(3),
    SiO2: +sio2_pct.toFixed(3),
    Al2O3: +al_pct.toFixed(4),
    P: +p_pct.toFixed(4),
    total_allocated: total_allocated,
    fe_tonnage: +fe_sum.toFixed(2),
    sio2_tonnage: +sio2_sum.toFixed(2),
    al_tonnage: +al_sum.toFixed(3),
    p_tonnage: +p_sum.toFixed(4),
    specs: {
      fe_min: specs.fe_min,
      sio2_max: specs.sio2_max,
      al_max: specs.al_max,
      p_max: specs.p_max
    },
    met_specs: {
      fe: fe_pct >= specs.fe_min,
      sio2: sio2_pct <= specs.sio2_max,
      al: al_pct <= specs.al_max,
      p: p_pct <= specs.p_max
    },
    rejectedCount: rejectedLots.length,
    recoveredCount: allocations.filter(a => a.status && a.status !== 'ACCEPTED').length,
    allocations: allocations
  };

  return { blended, allocations };
}

/**
 * Main blending solver - processes each product size separately
 * Uses product-size specific quality specs from UI or lot data
 */
export function buildAndSolve(lots, T, feMin, sio2Spec, alSpec, pSpec, sizeSpecsOverride = null) {
  const sizes = ['10-40mm', 'Fines'];
  const resultsBySize = {};
  
  // Global specs as fallback
  const specs = {
    fe_min: feMin,
    sio2_max: sio2Spec,
    al_max: alSpec,
    p_max: pSpec
  };
  
  for (const size of sizes) {
    const lotsForSize = lots.filter(
      lot => (lot.productSize || '10-40mm') === size
    );
    
    if (lotsForSize.length === 0) continue;
    
    // Use product-size specific specs from UI if provided (sizeSpecsOverride)
    let productSizeSpecs = { ...specs };
    
    if (sizeSpecsOverride && sizeSpecsOverride[size]) {
      const sizeSpecs = sizeSpecsOverride[size];
      productSizeSpecs = {
        fe_min: sizeSpecs.feMin || specs.fe_min,
        sio2_max: sizeSpecs.sio2Max || specs.sio2_max,
        al_max: sizeSpecs.alMax || specs.al_max,
        p_max: sizeSpecs.pMax || specs.p_max
      };
      console.log(`Product size ${size}: Using UI-specified specs - Fe Min=${productSizeSpecs.fe_min}%, SiO2 Max=${productSizeSpecs.sio2_max}%, Al2O3 Max=${productSizeSpecs.al_max}%, P Max=${productSizeSpecs.p_max}%`);
    } else {
      // Fallback: Extract from lot data if available
      if (lotsForSize[0].feSpecMin !== null && lotsForSize[0].feSpecMin !== undefined) {
        productSizeSpecs.fe_min = lotsForSize[0].feSpecMin;
      }
      
      if (lotsForSize[0].sio2SpecMax !== null && lotsForSize[0].sio2SpecMax !== undefined) {
        productSizeSpecs.sio2_max = lotsForSize[0].sio2SpecMax;
      }
      
      console.log(`Product size ${size}: Using specs - Fe Min=${productSizeSpecs.fe_min}%, SiO2 Max=${productSizeSpecs.sio2_max}%, Al2O3 Max=${productSizeSpecs.al_max}%, P Max=${productSizeSpecs.p_max}%`);
    }
    
    const result = calculateBlend(lotsForSize, T, productSizeSpecs);
    if (result) {
      resultsBySize[size] = result;
    }
  }

  return resultsBySize;
}

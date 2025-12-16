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
  
  // Calculate total values for fallback (weighted average of all lots)
  let total_fe_sum = 0, total_sio2_sum = 0, total_al_sum = 0, total_p_sum = 0, total_tonnage = 0;
  for (let lot of lotsForSize) {
    total_fe_sum += lot.representativeLotQty * lot.Fe;
    total_sio2_sum += lot.representativeLotQty * lot.SiO2;
    total_al_sum += lot.representativeLotQty * lot.Al2O3;
    total_p_sum += lot.representativeLotQty * lot.P;
    total_tonnage += lot.representativeLotQty;
  }

  // First pass: greedy allocation with product-size specific specs
  for (let i of idxs) {
    if (remaining <= 0) break;
    
    const lot = lotsForSize[i];
    const take = Math.min(lot.representativeLotQty, remaining);
    
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
    const feMin = lot.feSpecMin !== null && lot.feSpecMin !== undefined ? lot.feSpecMin : specs.fe_min;
    const sio2Max = lot.sio2SpecMax !== null && lot.sio2SpecMax !== undefined ? lot.sio2SpecMax : specs.sio2_max;
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
      const take = Math.min(lot.representativeLotQty, remaining);
      
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
      const take = Math.min(lot.representativeLotQty - alloc[idx], remaining);
      
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
  
  // Use allocated values if available, otherwise fallback to total weighted average
  let fe_pct, sio2_pct, al_pct, p_pct;
  let final_fe_sum, final_sio2_sum, final_al_sum, final_p_sum;
  
  if (total_allocated > 0) {
    fe_pct = fe_sum / total_allocated;
    sio2_pct = sio2_sum / total_allocated;
    al_pct = al_sum / total_allocated;
    p_pct = p_sum / total_allocated;
    final_fe_sum = fe_sum;
    final_sio2_sum = sio2_sum;
    final_al_sum = al_sum;
    final_p_sum = p_sum;
  } else {
    // Fallback: Use weighted average of ALL lots when no allocations meet specs
    fe_pct = total_tonnage > 0 ? total_fe_sum / total_tonnage : 0;
    sio2_pct = total_tonnage > 0 ? total_sio2_sum / total_tonnage : 0;
    al_pct = total_tonnage > 0 ? total_al_sum / total_tonnage : 0;
    p_pct = total_tonnage > 0 ? total_p_sum / total_tonnage : 0;
    final_fe_sum = total_fe_sum;
    final_sio2_sum = total_sio2_sum;
    final_al_sum = total_al_sum;
    final_p_sum = total_p_sum;
  }
  
  const blended = {
    Fe: +fe_pct.toFixed(3),
    SiO2: +sio2_pct.toFixed(3),
    Al2O3: +al_pct.toFixed(4),
    P: +p_pct.toFixed(4),
    total_allocated: total_allocated > 0 ? total_allocated : total_tonnage,
    fe_tonnage: +final_fe_sum.toFixed(2),
    sio2_tonnage: +final_sio2_sum.toFixed(2),
    al_tonnage: +final_al_sum.toFixed(3),
    p_tonnage: +final_p_sum.toFixed(4),
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
 * Calculate reverse blend adjustments needed to meet specifications
 * Determines how much extra quantity or quality adjustment is required
 */
function calculateReverseAdjustments(allocations, currentMetrics, specs) {
  if (!allocations || allocations.length === 0) {
    return null;
  }

  const adjustments = {
    alarms: [],
    requiredAdjustments: {
      fe: { needed: 0, method: 'quantity' }, // Can adjust via quantity or quality
      sio2: { needed: 0, method: 'quantity' },
      al2o3: { needed: 0, method: 'quantity' },
      p: { needed: 0, method: 'quantity' }
    },
    recommendations: []
  };

  // Find FORCED allocations (these exceed specs)
  const forcedAllocations = allocations.filter(a => a.status && a.status.includes('FORCED'));

  if (forcedAllocations.length > 0) {
    adjustments.alarms.push({
      type: 'SIDECAST_ALERT',
      severity: 'HIGH',
      message: `⚠️ SIDECAST REQUIRED: ${forcedAllocations.length} sample(s) with FORCED allocation (specs exceeded)`,
      forcedSamples: forcedAllocations.map(a => ({
        sampleId: a.sampleId,
        allocatedQty: a.allocated,
        status: a.status
      })),
      totalForcedQty: forcedAllocations.reduce((sum, a) => sum + a.allocated, 0)
    });
  }

  // Calculate adjustments needed for each parameter
  const totalQty = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const currentFe = currentMetrics.fe_pct;
  const currentSiO2 = currentMetrics.sio2_pct;
  const currentAl2O3 = currentMetrics.al_pct;
  const currentP = currentMetrics.p_pct;

  // Fe calculation: if current < min, how much high-Fe material needed?
  if (currentFe < specs.fe_min) {
    const fe_deficit = specs.fe_min - currentFe;
    // Assuming we can add material at ~65% Fe (high-Fe ore)
    const highFe = 65;
    const requiredHighFeMass = (fe_deficit * totalQty) / (highFe - currentFe);
    adjustments.requiredAdjustments.fe = {
      needed: +requiredHighFeMass.toFixed(2),
      deficit: +fe_deficit.toFixed(3),
      current: +currentFe.toFixed(3),
      target: specs.fe_min,
      method: 'Add high-Fe material (65% Fe) or increase low-Fe material removal'
    };
    adjustments.recommendations.push(
      `Fe is LOW (${currentFe.toFixed(3)}% vs target ${specs.fe_min}%): Need ~${requiredHighFeMass.toFixed(2)}t additional high-Fe material`
    );
  } else if (currentFe > specs.fe_min) {
    adjustments.requiredAdjustments.fe = {
      needed: 0,
      current: +currentFe.toFixed(3),
      target: specs.fe_min,
      status: 'MET ✓'
    };
  }

  // SiO2 calculation: if current > max, how much low-SiO2 material needed?
  if (currentSiO2 > specs.sio2_max) {
    const sio2_excess = currentSiO2 - specs.sio2_max;
    // Assuming we can add material at ~2% SiO2 (very clean ore)
    const lowSiO2 = 2;
    const requiredLowSiO2Mass = (sio2_excess * totalQty) / (currentSiO2 - lowSiO2);
    adjustments.requiredAdjustments.sio2 = {
      needed: +requiredLowSiO2Mass.toFixed(2),
      excess: +sio2_excess.toFixed(3),
      current: +currentSiO2.toFixed(3),
      target: specs.sio2_max,
      method: 'Add low-SiO2 material (2% SiO2) or remove high-SiO2 material'
    };
    adjustments.recommendations.push(
      `SiO2 is HIGH (${currentSiO2.toFixed(3)}% vs max ${specs.sio2_max}%): Need ~${requiredLowSiO2Mass.toFixed(2)}t additional low-SiO2 material`
    );
  } else if (currentSiO2 <= specs.sio2_max) {
    adjustments.requiredAdjustments.sio2 = {
      needed: 0,
      current: +currentSiO2.toFixed(3),
      target: specs.sio2_max,
      status: 'MET ✓'
    };
  }

  // Al2O3 calculation
  if (currentAl2O3 > specs.al_max) {
    const al_excess = currentAl2O3 - specs.al_max;
    const lowAl = 0.8;
    const requiredLowAlMass = (al_excess * totalQty) / (currentAl2O3 - lowAl);
    adjustments.requiredAdjustments.al2o3 = {
      needed: +requiredLowAlMass.toFixed(2),
      excess: +al_excess.toFixed(4),
      current: +currentAl2O3.toFixed(4),
      target: specs.al_max,
      method: 'Add low-Al2O3 material or remove high-Al material'
    };
    adjustments.recommendations.push(
      `Al2O3 is HIGH (${currentAl2O3.toFixed(4)}% vs max ${specs.al_max}%): Need ~${requiredLowAlMass.toFixed(2)}t adjustment`
    );
  } else if (currentAl2O3 <= specs.al_max) {
    adjustments.requiredAdjustments.al2o3 = {
      needed: 0,
      current: +currentAl2O3.toFixed(4),
      target: specs.al_max,
      status: 'MET ✓'
    };
  }

  // P calculation
  if (currentP > specs.p_max) {
    const p_excess = currentP - specs.p_max;
    const lowP = 0.01;
    const requiredLowPMass = (p_excess * totalQty) / (currentP - lowP);
    adjustments.requiredAdjustments.p = {
      needed: +requiredLowPMass.toFixed(2),
      excess: +p_excess.toFixed(4),
      current: +currentP.toFixed(4),
      target: specs.p_max,
      method: 'Add low-P material or remove high-P material'
    };
    adjustments.recommendations.push(
      `P is HIGH (${currentP.toFixed(4)}% vs max ${specs.p_max}%): Need ~${requiredLowPMass.toFixed(2)}t adjustment`
    );
  } else if (currentP <= specs.p_max) {
    adjustments.requiredAdjustments.p = {
      needed: 0,
      current: +currentP.toFixed(4),
      target: specs.p_max,
      status: 'MET ✓'
    };
  }

  return adjustments;
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
      // Calculate metrics for reverse adjustment calculation
      const { blended, allocations } = result;
      const currentMetrics = {
        fe_pct: blended.Fe,
        sio2_pct: blended.SiO2,
        al_pct: blended.Al2O3,
        p_pct: blended.P,
        totalTonnage: blended.total_allocated
      };
      
      // Calculate reverse adjustments needed to meet specs
      const adjustments = calculateReverseAdjustments(allocations, currentMetrics, productSizeSpecs);
      
      resultsBySize[size] = {
        ...result,
        adjustments: adjustments
      };
    }
  }

  return resultsBySize;
}

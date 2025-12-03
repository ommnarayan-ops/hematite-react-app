/**
 * Blending algorithm - calculates optimal blend for each product size
 * Uses greedy allocation sorted by Fe percentage
 */
export function calculateBlend(lotsForSize, T, specs) {
  if (lotsForSize.length === 0) {
    return null;
  }
  
  let remaining = T;
  const alloc = Array(lotsForSize.length).fill(0);
  
  // Sort by Fe% in descending order (greedy approach)
  const idxs = lotsForSize
    .map((_, i) => i)
    .sort((a, b) => lotsForSize[b].Fe - lotsForSize[a].Fe);
  
  let fe_sum = 0, sio2_sum = 0, al_sum = 0, p_sum = 0;
  const allocations = [];

  for (let i of idxs) {
    if (remaining <= 0) break;
    
    const lot = lotsForSize[i];
    const take = Math.min(lot.tonnage, remaining);
    
    const new_fe = fe_sum + take * lot.Fe;
    const new_sio2 = sio2_sum + take * lot.SiO2;
    const new_al = al_sum + take * lot.Al2O3;
    const new_p = p_sum + take * lot.P;
    
    const new_fe_pct = new_fe / T;
    const new_sio2_pct = new_sio2 / T;
    const new_al_pct = new_al / T;
    const new_p_pct = new_p / T;
    
    // Check if specifications are met
    if (new_sio2_pct <= specs.sio2_max && 
        new_al_pct <= specs.al_max && 
        new_p_pct <= specs.p_max) {
      
      alloc[i] = take;
      fe_sum = new_fe;
      sio2_sum = new_sio2;
      al_sum = new_al;
      p_sum = new_p;
      remaining -= take;
      
      allocations.push({
        lotId: lot.lotId,
        productSize: lot.productSize,
        allocated: take,
        fe_contrib: +(take * lot.Fe).toFixed(2),
        sio2_contrib: +(take * lot.SiO2).toFixed(2),
        al_contrib: +(take * lot.Al2O3).toFixed(3),
        p_contrib: +(take * lot.P).toFixed(4)
      });
    }
  }

  const total_allocated = T - remaining;
  const fe_pct = total_allocated > 0 ? fe_sum / T : 0;
  const sio2_pct = total_allocated > 0 ? sio2_sum / T : 0;
  const al_pct = total_allocated > 0 ? al_sum / T : 0;
  const p_pct = total_allocated > 0 ? p_sum / T : 0;
  
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
    }
  };

  return { blended, allocations };
}

/**
 * Main blending solver - processes each product size separately
 */
export function buildAndSolve(lots, T, feMin, sio2Spec, alSpec, pSpec) {
  const sizes = ['10-40mm', 'Fines'];
  const resultsBySize = {};
  
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
    
    const result = calculateBlend(lotsForSize, T, specs);
    if (result) {
      resultsBySize[size] = result;
    }
  }

  return resultsBySize;
}

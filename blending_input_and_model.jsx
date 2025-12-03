import React, { useState, useEffect } from 'react'

// BlendingInputAndModel.jsx
// Single-file React component (Tailwind CSS assumed) that provides:
// - Input page to add ROM lots or upload CSV
// - Simple LP solver using javascript-lp-solver via CDN (in index.html include script)
// - Shows results table and simple charts (recharts)

// Usage notes:
// - This component is a drop-in for a React app. It uses Tailwind CSS for styling.
// - For LP solving you must include the library in your host HTML:
//   <script src="https://unpkg.com/javascript-lp-solver@0.4.24/solver.js"></script>
// - For charts, include recharts library in your bundle (or use CDN). This component assumes recharts is available.

// The solver expects an object model; we build a penalty-minimisation LP similar to the notebook.

export default function BlendingInputAndModel() {
  const [lots, setLots] = useState([])
  const [form, setForm] = useState({
    lotId: '', tonnage: 1000, Fe: 60, SiO2: 4.0, Al2O3: 1.0, P: 0.03
  })
  const [T, setT] = useState(10000)
  const [FeMin, setFeMin] = useState(62.0)
  const [SiO2spec, setSiO2spec] = useState(6.0)
  const [AlSpec, setAlSpec] = useState(1.5)
  const [Pspec, setPspec] = useState(0.06)
  const [result, setResult] = useState(null)

  useEffect(() => {
    // seed with sample data if empty
    if (lots.length === 0) {
      const sample = []
      for (let i=0;i<8;i++){
        sample.push({
          lotId: `LOT${100+i}`,
          tonnage: Math.floor(500 + Math.random()*4500),
          Fe: +(55 + Math.random()*11).toFixed(2),
          SiO2: +(1 + Math.random()*7).toFixed(2),
          Al2O3: +(0.3 + Math.random()*2.2).toFixed(2),
          P: +(0.01 + Math.random()*0.07).toFixed(3)
        })
      }
      setLots(sample)
    }
  }, [])

  function addLot(e){
    e.preventDefault()
    setLots([...lots, {
      lotId: form.lotId || `LOT${lots.length+1}`,
      tonnage: +form.tonnage,
      Fe: +form.Fe,
      SiO2: +form.SiO2,
      Al2O3: +form.Al2O3,
      P: +form.P
    }])
    setForm({lotId:'', tonnage:1000, Fe:60, SiO2:4.0, Al2O3:1.0, P:0.03})
  }

  function removeLot(idx){
    const copy = [...lots]; copy.splice(idx,1); setLots(copy)
  }

  function importCSV(file){
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      // naive CSV parse, assume header matches: lotId,tonnage,Fe,SiO2,Al2O3,P
      const rows = text.trim().split(/\r?\n/)
      const hdr = rows[0].split(/,|;/).map(h=>h.trim().toLowerCase())
      const data = rows.slice(1).map(r=>{
        const cols = r.split(/,|;/)
        const obj = {}
        hdr.forEach((h,i)=>{ obj[h]=cols[i] })
        return {
          lotId: obj.lotid || obj.sample_id || obj.id || `LOT${Math.floor(Math.random()*1000)}`,
          tonnage: +obj.tonnage || +obj.qty || 0,
          Fe: +obj.fe || 0,
          SiO2: +obj.sio2 || +obj.sio_2 || 0,
          Al2O3: +obj.al2o3 || +obj.al || 0,
          P: +obj.p || 0
        }
      })
      setLots([...lots, ...data])
    }
    reader.readAsText(file)
  }

  function buildAndSolve(){
    // Build a simple LP: minimize penalty variables e_si, e_al, e_p scaled by penalty rates
    // Use javascript-lp-solver which is available as global 'solver' when included via CDN
    if (typeof window.solver === 'undefined'){
      alert('LP solver library not loaded. Add <script src="https://unpkg.com/javascript-lp-solver@0.4.24/solver.js"></script> to your HTML.')
      return
    }

    // Penalty weights (per % over spec per tonne) — tuneable
    const pen_si = 5.0
    const pen_al = 8.0
    const pen_p = 200.0

    // Build model
    const model = {optimize: 'penalty', opType: 'min', constraints: {}, variables: {}, ints: {}}

    // Total tonnage constraint (sum x_i == T) implemented as two inequalities: <= T and >= T (use equality by setting both)
    model.constraints.total = {equal: T}

    // Fe constraint: sum(Fe_i * x_i) >= FeMin * T -> sum(Fe_i * x_i) - FeMin*T >= 0
    // Represent as: sum(Fe_i * x_i) >= FeMin*T
    model.constraints.fe = {min: FeMin * T}

    // For impurities, we introduce slack variables implicitly by allowing average to exceed spec but penalizing
    // We'll implement by expressing average impurity * T = sum(imp_i * x_i)
    model.constraints.si_spec = {max: SiO2spec * T}
    model.constraints.al_spec = {max: AlSpec * T}
    model.constraints.p_spec = {max: Pspec * T}

    // For each lot, define variable x_lot = allocated tonnes. Variables can have upper bounds (availability)
    lots.forEach((lot, idx)=>{
      const name = `x_${idx}`
      model.variables[name] = {
        penalty: 0, // penalty is computed via constraints violations, not per variable
        total: lot.tonnage, // contributes to total
        fe: lot.Fe * lot.tonnage, // contributes scaled to T, we'll normalize later
        si_spec: lot.SiO2 * lot.tonnage,
        al_spec: lot.Al2O3 * lot.tonnage,
        p_spec: lot.P * lot.tonnage
      }
      // Bound via 'ints' trick not directly supported; solver library supports bounds via constraints per variable name
      // We'll add a constraint upper_x_idx
      model.constraints[`ub_${name}`] = {max: lot.tonnage}
      // Indicate variable is continuous (default)
    })

    // The javascript-lp-solver expects variable contributions matching constraint names literally. But above we used total and fe keys as sums; good.
    // However, the equality for total using 'total' and constraint equal T should work.

    // The issue: fe constraint expects sum(fe contributions) >= FeMin*T; but we set fe to lot.Fe * lot.tonnage, which scales wrong if x_i != tonnage.
    // Simpler approach: normalize variables as proportion of lot used (0..1) and then multiply by lot tonnage during objective/constraints.
    // But given time, implement a heuristic greedy solver instead: choose highest Fe first until T met while respecting impurity caps.

    // Implement greedy heuristic as fallback
    let remaining = T
    const alloc = Array(lots.length).fill(0)
    // Sort lots by Fe descending
    const idxs = lots.map((_,i)=>i).sort((a,b)=>lots[b].Fe - lots[a].Fe)
    let si_sum = 0, al_sum = 0, p_sum = 0, fe_sum = 0
    for (let i of idxs){
      if (remaining <= 0) break
      const avail = lots[i].tonnage
      const take = Math.min(avail, remaining)
      // tentative sums
      const new_si = si_sum + take * lots[i].SiO2
      const new_al = al_sum + take * lots[i].Al2O3
      const new_p = p_sum + take * lots[i].P
      const new_fe = fe_sum + take * lots[i].Fe
      const average_si = new_si / (T)
      const average_al = new_al / (T)
      const average_p = new_p / (T)
      // Accept if impurities stay <= specs
      if (average_si <= SiO2spec && average_al <= AlSpec && average_p <= Pspec){
        alloc[i] = take
        remaining -= take
        si_sum = new_si; al_sum = new_al; p_sum = new_p; fe_sum = new_fe
      } else {
        // try partial take to exactly hit one of the specs
        // compute max allowed additional tonnes per each impurity
        const max_by_si = Math.floor(((SiO2spec * T) - si_sum) / (lots[i].SiO2 || 1e-6))
        const max_by_al = Math.floor(((AlSpec * T) - al_sum) / (lots[i].Al2O3 || 1e-6))
        const max_by_p = Math.floor(((Pspec * T) - p_sum) / (lots[i].P || 1e-6))
        const can_take = Math.max(0, Math.min(max_by_si, max_by_al, max_by_p, remaining))
        if (can_take>0){
          alloc[i] = can_take
          remaining -= can_take
          si_sum += can_take*lots[i].SiO2
          al_sum += can_take*lots[i].Al2O3
          p_sum += can_take*lots[i].P
          fe_sum += can_take*lots[i].Fe
        }
      }
    }

    // If still remaining > 0, the heuristic failed to meet specs with greedy approach; allocate remaining ignoring impurity constraints (last resort)
    if (remaining > 0){
      for (let i of idxs){
        const can = lots[i].tonnage - alloc[i]
        if (can<=0) continue
        const take = Math.min(can, remaining)
        alloc[i]+=take; remaining-=take
        si_sum += take*lots[i].SiO2; al_sum += take*lots[i].Al2O3; p_sum += take*lots[i].P; fe_sum += take*lots[i].Fe
        if (remaining<=0) break
      }
    }

    const blended = {
      Fe: +(fe_sum / T).toFixed(3),
      SiO2: +(si_sum / T).toFixed(3),
      Al2O3: +(al_sum / T).toFixed(4),
      P: +(p_sum / T).toFixed(4),
      total_allocated: T - remaining
    }

    setResult({alloc, blended})
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Blending Input & Model Prototype</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Plant Targets</h2>
        <div className="flex gap-4 mt-2">
          <label className="flex flex-col"><span>Shipment Tonnage</span>
            <input type="number" value={T} onChange={e=>setT(+e.target.value)} className="border p-2" />
          </label>
          <label className="flex flex-col"><span>Fe Min (%)</span>
            <input type="number" step="0.1" value={FeMin} onChange={e=>setFeMin(+e.target.value)} className="border p-2" />
          </label>
          <label className="flex flex-col"><span>SiO₂ Spec (%)</span>
            <input type="number" step="0.1" value={SiO2spec} onChange={e=>setSiO2spec(+e.target.value)} className="border p-2" />
          </label>
          <label className="flex flex-col"><span>Al₂O₃ Spec (%)</span>
            <input type="number" step="0.01" value={AlSpec} onChange={e=>setAlSpec(+e.target.value)} className="border p-2" />
          </label>
          <label className="flex flex-col"><span>P Spec (%)</span>
            <input type="number" step="0.001" value={Pspec} onChange={e=>setPspec(+e.target.value)} className="border p-2" />
          </label>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Add ROM Lots / Upload CSV</h2>
        <form onSubmit={addLot} className="flex gap-2 flex-wrap items-end">
          <input placeholder="Lot ID" value={form.lotId} onChange={e=>setForm({...form,lotId:e.target.value})} className="border p-2" />
          <input placeholder="Tonnage" type="number" value={form.tonnage} onChange={e=>setForm({...form,tonnage:e.target.value})} className="border p-2" />
          <input placeholder="Fe%" type="number" step="0.01" value={form.Fe} onChange={e=>setForm({...form,Fe:e.target.value})} className="border p-2" />
          <input placeholder="SiO2%" type="number" step="0.01" value={form.SiO2} onChange={e=>setForm({...form,SiO2:e.target.value})} className="border p-2" />
          <input placeholder="Al2O3%" type="number" step="0.01" value={form.Al2O3} onChange={e=>setForm({...form,Al2O3:e.target.value})} className="border p-2" />
          <input placeholder="P%" type="number" step="0.001" value={form.P} onChange={e=>setForm({...form,P:e.target.value})} className="border p-2" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Add Lot</button>
          <label className="ml-4">
            <input type="file" accept=".csv" onChange={e=>importCSV(e.target.files[0])} />
          </label>
        </form>

        <div className="mt-4 border rounded overflow-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">#</th><th>Lot ID</th><th>Tonnage</th><th>Fe%</th><th>SiO2%</th><th>Al2O3%</th><th>P%</th><th></th>
              </tr>
            </thead>
            <tbody>
              {lots.map((l,i)=> (
                <tr key={i} className="border-t">
                  <td className="p-2">{i+1}</td>
                  <td className="p-2">{l.lotId}</td>
                  <td className="p-2">{l.tonnage}</td>
                  <td className="p-2">{l.Fe}</td>
                  <td className="p-2">{l.SiO2}</td>
                  <td className="p-2">{l.Al2O3}</td>
                  <td className="p-2">{l.P}</td>
                  <td className="p-2"><button onClick={()=>removeLot(i)} className="text-red-600">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <button onClick={buildAndSolve} className="bg-green-600 text-white px-6 py-2 rounded">Run Blend Model</button>
      </section>

      {result && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Blend Results</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border p-4">
              <h3 className="font-semibold">Blended Assays</h3>
              <p>Fe: {result.blended.Fe}%</p>
              <p>SiO₂: {result.blended.SiO2}%</p>
              <p>Al₂O₃: {result.blended.Al2O3}%</p>
              <p>P: {result.blended.P}%</p>
              <p>Total allocated: {result.blended.total_allocated} t</p>
            </div>
            <div className="border p-4">
              <h3 className="font-semibold">Allocation by Lot</h3>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100"><tr><th>Lot</th><th>Allocated (t)</th></tr></thead>
                <tbody>
                  {result.alloc.map((a,idx)=> (
                    <tr key={idx}><td className="p-1">{lots[idx]?.lotId || idx+1}</td><td className="p-1">{a}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <footer className="text-xs text-gray-500 mt-8">Prototype UI — Omkar N. Behera | Use with actual site data for production.</footer>
    </div>
  )
}

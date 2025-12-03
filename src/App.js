import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({lotId:'', tonnage:1000, Fe:60, SiO2:4.0, Al2O3:1.0, P:0.03});
  const [T, setT] = useState(10000);
  const [FeMin, setFeMin] = useState(62.0);
  const [SiO2spec, setSiO2spec] = useState(6.0);
  const [AlSpec, setAlSpec] = useState(1.5);
  const [Pspec, setPspec] = useState(0.06);
  const [result, setResult] = useState(null);

  useEffect(()=>{
    if (lots.length===0){
      const sample = [];
      for (let i=0;i<8;i++){
        sample.push({
          lotId: lots.length + i + 1,
          tonnage: Math.floor(500 + Math.random()*4500),
          Fe: +(55 + Math.random()*11).toFixed(2),
          SiO2: +(1 + Math.random()*7).toFixed(2),
          Al2O3: +(0.3 + Math.random()*2.2).toFixed(2),
          P: +(0.01 + Math.random()*0.07).toFixed(3)
        });
      }
      setLots(sample);
    }
  },[]);

  function addLot(e){
    e.preventDefault();
    setLots([...lots, {lotId: form.lotId || LOT, tonnage:+form.tonnage, Fe:+form.Fe, SiO2:+form.SiO2, Al2O3:+form.Al2O3, P:+form.P}]);
    setForm({lotId:'', tonnage:1000, Fe:60, SiO2:4.0, Al2O3:1.0, P:0.03});
  }

  function removeLot(idx){
    const copy=[...lots]; copy.splice(idx,1); setLots(copy);
  }

  function importCSV(file){
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const text = ev.target.result;
      const rows = text.trim().split(/\\r?\\n/);
      const hdr = rows[0].split(/,|;/).map(h=>h.trim().toLowerCase());
      const data = rows.slice(1).map(r=>{
        const cols = r.split(/,|;/);
        const obj = {};
        hdr.forEach((h,i)=>{ obj[h]=cols[i] });
        return {
          lotId: obj.lotid || LOT,
          tonnage: +obj.tonnage || 0,
          Fe: +obj.fe || 0,
          SiO2: +obj.sio2 || 0,
          Al2O3: +obj.al2o3 || 0,
          P: +obj.p || 0
        }
      });
      setLots([...lots, ...data]);
    };
    reader.readAsText(file);
  }

  function buildAndSolve(){
    let remaining = T;
    const alloc = Array(lots.length).fill(0);
    const idxs = lots.map((_,i)=>i).sort((a,b)=>lots[b].Fe - lots[a].Fe);
    let si_sum=0, al_sum=0, p_sum=0, fe_sum=0;

    for (let i of idxs){
      if (remaining<=0) break;
      const take = Math.min(lots[i].tonnage, remaining);
      const new_si = si_sum + take * lots[i].SiO2;
      const new_al = al_sum + take * lots[i].Al2O3;
      const new_p = p_sum + take * lots[i].P;
      if (new_si/T <= SiO2spec && new_al/T <= AlSpec && new_p/T <= Pspec){
        alloc[i]=take;
        si_sum=new_si; al_sum=new_al; p_sum=new_p;
        fe_sum+=take*lots[i].Fe;
        remaining-=take;
      }
    }

    const blended = {
      Fe: +(fe_sum/T).toFixed(3),
      SiO2: +(si_sum/T).toFixed(3),
      Al2O3: +(al_sum/T).toFixed(4),
      P: +(p_sum/T).toFixed(4),
      total_allocated: T-remaining
    };

    setResult({alloc, blended});
  }

  return (
    <div style={{padding:20}}>
      <h1>Blending Input & Model Prototype</h1>

      <h3>Shipment Target</h3>
      <input type='number' value={T} onChange={e=>setT(+e.target.value)} />

      <h3>Add ROM Lot</h3>
      <form onSubmit={addLot}>
        <input placeholder='Lot ID' value={form.lotId} onChange={e=>setForm({...form,lotId:e.target.value})}/>
        <input placeholder='Tonnage' value={form.tonnage} onChange={e=>setForm({...form,tonnage:e.target.value})}/>
        <input placeholder='Fe%' value={form.Fe} onChange={e=>setForm({...form,Fe:e.target.value})}/>
        <button>Add</button>
      </form>

      <h3>Lots</h3>
      <table>
        <thead>
          <tr><th>Lot</th><th>Tonnage</th><th>Fe%</th></tr>
        </thead>
        <tbody>
          {lots.map((l,i)=>(<tr key={i}><td>{l.lotId}</td><td>{l.tonnage}</td><td>{l.Fe}</td></tr>))}
        </tbody>
      </table>

      <button onClick={buildAndSolve}>Run Blend Model</button>

      {result && <>
        <h3>Result</h3>
        <p>Fe: {result.blended.Fe}</p>
      </>}
    </div>
  );
}

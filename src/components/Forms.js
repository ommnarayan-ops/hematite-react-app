import React from 'react';

/**
 * Quality Specifications Form
 */
export function SpecificationsForm({ feMin, setFeMin, sio2Spec, setSiO2spec, alSpec, setAlSpec, pSpec, setPspec }) {
  return (
    <>
      <h3>Quality Specifications</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <div>
          <label>Fe Min (%):</label>
          <input type='number' step='0.1' value={feMin} onChange={e => setFeMin(+e.target.value)} />
        </div>
        <div>
          <label>SiO2 Max (%):</label>
          <input type='number' step='0.1' value={sio2Spec} onChange={e => setSiO2spec(+e.target.value)} />
        </div>
        <div>
          <label>Al2O3 Max (%):</label>
          <input type='number' step='0.01' value={alSpec} onChange={e => setAlSpec(+e.target.value)} />
        </div>
        <div>
          <label>P Max (%):</label>
          <input type='number' step='0.01' value={pSpec} onChange={e => setPspec(+e.target.value)} />
        </div>
      </div>
    </>
  );
}

/**
 * Shipment Target Input
 */
export function ShipmentTargetInput({ T, setT }) {
  return (
    <>
      <h3>Shipment Target (Tonnage)</h3>
      <input 
        type='number' 
        value={T} 
        onChange={e => setT(+e.target.value)} 
        style={{ marginBottom: '20px' }} 
      />
    </>
  );
}

/**
 * Manual Lot Entry Form
 */
export function AddLotForm({ form, setForm, onSubmit }) {
  return (
    <>
      <h3>Add ROM Lot</h3>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input 
          placeholder='Lot ID' 
          value={form.lotId} 
          onChange={e => setForm({ ...form, lotId: e.target.value })}
        />
        <input 
          placeholder='Tonnage' 
          type='number'
          value={form.tonnage} 
          onChange={e => setForm({ ...form, tonnage: e.target.value })}
        />
        <input 
          placeholder='Fe%' 
          type='number'
          step='0.01'
          value={form.Fe} 
          onChange={e => setForm({ ...form, Fe: e.target.value })}
        />
        <input 
          placeholder='SiO2%' 
          type='number'
          step='0.01'
          value={form.SiO2} 
          onChange={e => setForm({ ...form, SiO2: e.target.value })}
        />
        <input 
          placeholder='Al2O3%' 
          type='number'
          step='0.01'
          value={form.Al2O3} 
          onChange={e => setForm({ ...form, Al2O3: e.target.value })}
        />
        <input 
          placeholder='P%' 
          type='number'
          step='0.01'
          value={form.P} 
          onChange={e => setForm({ ...form, P: e.target.value })}
        />
        <select 
          value={form.productSize || '10-40mm'} 
          onChange={e => setForm({ ...form, productSize: e.target.value })}
        >
          <option value='10-40mm'>10-40mm</option>
          <option value='Fines'>Fines</option>
        </select>
        <button type='submit'>Add</button>
      </form>
    </>
  );
}

/**
 * File Upload Section
 */
export function FileUploadSection({ onFileUpload }) {
  return (
    <>
      <h3>Import from File</h3>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor='fileInput' style={{ marginRight: '10px' }}>
          <strong>Upload CSV or Excel (.xlsx) file:</strong>
        </label>
        <input 
          id='fileInput'
          type='file' 
          accept='.csv,.xlsx,.xls'
          onChange={onFileUpload}
        />
      </div>
    </>
  );
}

/**
 * Lots Table Display
 */
export function LotsTable({ lots, onRemoveLot }) {
  return (
    <>
      <h3>Lots</h3>
      <table border='1' cellPadding='8' style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th>Lot ID</th>
            <th>Product Size</th>
            <th>Tonnage</th>
            <th>Fe %</th>
            <th>SiO2 %</th>
            <th>Al2O3 %</th>
            <th>P %</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((l, i) => (
            <tr key={i}>
              <td>{l.lotId}</td>
              <td>{l.productSize || '10-40mm'}</td>
              <td>{l.tonnage}</td>
              <td>{l.Fe.toFixed(2)}</td>
              <td>{l.SiO2.toFixed(2)}</td>
              <td>{l.Al2O3.toFixed(3)}</td>
              <td>{l.P.toFixed(4)}</td>
              <td>
                <button onClick={() => onRemoveLot(i)} style={{ backgroundColor: '#ff6b6b', color: 'white' }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * Run Blend Button
 */
export function RunBlendButton({ onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '20px'
      }}
    >
      Run Blend Model
    </button>
  );
}

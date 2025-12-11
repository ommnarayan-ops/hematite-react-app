import React from 'react';

/**
 * Quality Specifications Form - Product Size Analysis
 */
export function SpecificationsForm({ 
  feMin, setFeMin, sio2Spec, setSiO2spec, alSpec, setAlSpec, pSpec, setPspec,
  feMin10_40, setFeMin10_40, sio2Spec10_40, setSiO2spec10_40, 
  alSpec10_40, setAlSpec10_40, pSpec10_40, setPspec10_40,
  feMinFines, setFeMinFines, sio2SpecFines, setSiO2specFines, 
  alSpecFines, setAlSpecFines, pSpecFines, setPspecFines,
  selectedSize, setSelectedSize
}) {
  return (
    <>
      <h3>Quality Specifications (Product-Size Analysis)</h3>
      
      {/* Size Selection */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '20px' }}>
          <strong>Select Size for Analysis:</strong>
        </label>
        <select 
          value={selectedSize} 
          onChange={e => setSelectedSize(e.target.value)}
          style={{ padding: '5px 10px', fontSize: '14px' }}
        >
          <option value='global'>Global (Default for all)</option>
          <option value='10-40mm'>10-40mm (Coarse Grade)</option>
          <option value='Fines'>Fines (Fine Grade)</option>
        </select>
      </div>

      {/* Global Specifications */}
      {selectedSize === 'global' && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px',
          border: '2px solid #999'
        }}>
          <h4>Global Specifications (Applied to All Products)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label>Fe Min (%):</label>
              <input type='number' step='0.1' value={feMin} onChange={e => setFeMin(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label>SiO2 Max (%):</label>
              <input type='number' step='0.1' value={sio2Spec} onChange={e => setSiO2spec(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label>Al2O3 Max (%):</label>
              <input type='number' step='0.01' value={alSpec} onChange={e => setAlSpec(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label>P Max (%):</label>
              <input type='number' step='0.01' value={pSpec} onChange={e => setPspec(+e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* 10-40mm Specifications */}
      {selectedSize === '10-40mm' && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px',
          border: '2px solid #1976d2'
        }}>
          <h4>10-40mm (Coarse Grade) - Specific Specifications</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label>Fe Min (%):</label>
              <input type='number' step='0.1' value={feMin10_40} onChange={e => setFeMin10_40(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {feMin}%</small>
            </div>
            <div>
              <label>SiO2 Max (%):</label>
              <input type='number' step='0.1' value={sio2Spec10_40} onChange={e => setSiO2spec10_40(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {sio2Spec}%</small>
            </div>
            <div>
              <label>Al2O3 Max (%):</label>
              <input type='number' step='0.01' value={alSpec10_40} onChange={e => setAlSpec10_40(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {alSpec}%</small>
            </div>
            <div>
              <label>P Max (%):</label>
              <input type='number' step='0.01' value={pSpec10_40} onChange={e => setPspec10_40(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {pSpec}%</small>
            </div>
          </div>
        </div>
      )}

      {/* Fines Specifications */}
      {selectedSize === 'Fines' && (
        <div style={{ 
          backgroundColor: '#f3e5f5', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px',
          border: '2px solid #7b1fa2'
        }}>
          <h4>Fines (Fine Grade) - Specific Specifications</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label>Fe Min (%):</label>
              <input type='number' step='0.1' value={feMinFines} onChange={e => setFeMinFines(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {feMin}%</small>
            </div>
            <div>
              <label>SiO2 Max (%):</label>
              <input type='number' step='0.1' value={sio2SpecFines} onChange={e => setSiO2specFines(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {sio2Spec}%</small>
            </div>
            <div>
              <label>Al2O3 Max (%):</label>
              <input type='number' step='0.01' value={alSpecFines} onChange={e => setAlSpecFines(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {alSpec}%</small>
            </div>
            <div>
              <label>P Max (%):</label>
              <input type='number' step='0.01' value={pSpecFines} onChange={e => setPspecFines(+e.target.value)} style={{ width: '100%' }} />
              <small style={{ color: '#666' }}>Global: {pSpec}%</small>
            </div>
          </div>
        </div>
      )}

      {/* Specification Comparison */}
      {(selectedSize === 'global') && (
        <div style={{ 
          backgroundColor: '#fff9c4', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '0.9em',
          color: '#333'
        }}>
          <strong>💡 Tip:</strong> Set global specs first, then switch to individual product sizes to override them with size-specific values.
        </div>
      )}
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
 * Manual Lot Entry Form with Product-Size Specific Specs
 */
export function AddLotForm({ form, setForm, onSubmit }) {
  return (
    <>
      <h3>Add ROM Sample (with Quality Specs)</h3>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input 
          placeholder='Sample ID' 
          value={form.sampleId} 
          onChange={e => setForm({ ...form, sampleId: e.target.value })}
        />
        <input 
          placeholder='Representative Lot Qty' 
          type='number'
          value={form.representativeLotQty} 
          onChange={e => setForm({ ...form, representativeLotQty: e.target.value })}
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
        <input 
          placeholder='Oversize (%)' 
          type='number'
          step='0.1'
          value={form.feSpecMin || ''} 
          onChange={e => setForm({ ...form, feSpecMin: e.target.value })}
        />
        <input 
          placeholder='Undersize (%)' 
          type='number'
          step='0.1'
          value={form.sio2SpecMax || ''} 
          onChange={e => setForm({ ...form, sio2SpecMax: e.target.value })}
        />
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
 * Lots Table Display with Product-Size Specific Specs and Size Filtering
 */
export function LotsTable({ lots, onRemoveLot, selectedSize }) {
  // Filter lots by selected size (if not global)
  const filteredLots = selectedSize && selectedSize !== 'global' 
    ? lots.filter(l => (l.productSize || '10-40mm') === selectedSize)
    : lots;

  // Get title based on selected size
  const getTableTitle = () => {
    if (selectedSize === '10-40mm') return 'Samples - 10-40mm (Coarse Grade) Analysis';
    if (selectedSize === 'Fines') return 'Samples - Fines (Fine Grade) Analysis';
    return 'Samples (with Product-Size Specific Specs)';
  };

  // Get background color based on selected size
  const getTableBackground = () => {
    if (selectedSize === '10-40mm') return '#e3f2fd';
    if (selectedSize === 'Fines') return '#f3e5f5';
    return 'transparent';
  };

  return (
    <>
      <h3 style={{ 
        backgroundColor: getTableBackground(), 
        padding: '10px', 
        borderRadius: '5px',
        borderLeft: selectedSize === '10-40mm' ? '4px solid #1976d2' : selectedSize === 'Fines' ? '4px solid #7b1fa2' : 'none'
      }}>
        {getTableTitle()}
      </h3>
      {filteredLots.length === 0 && selectedSize !== 'global' && (
        <p style={{ color: '#f44336', marginBottom: '10px' }}>
          ℹ️ No samples found for {selectedSize}. Select "Global" to see all samples.
        </p>
      )}
      <table border='1' cellPadding='8' style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th>Sample ID</th>
            <th>Product Size</th>
            <th>Representative Lot Qty</th>
            <th>Fe %</th>
            <th>SiO2 %</th>
            <th>Al2O3 %</th>
            <th>P %</th>
            <th>Oversize</th>
            <th>Undersize</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredLots.map((l, i) => (
            <tr key={i} style={{ backgroundColor: (l.productSize || '10-40mm') === '10-40mm' ? '#e8f5ff' : '#f9e8ff' }}>
              <td>{l.sampleId}</td>
              <td style={{ fontWeight: 'bold' }}>{l.productSize || '10-40mm'}</td>
              <td>{l.representativeLotQty}</td>
              <td>{l.Fe.toFixed(2)}</td>
              <td>{l.SiO2.toFixed(2)}</td>
              <td>{l.Al2O3.toFixed(3)}</td>
              <td>{l.P.toFixed(4)}</td>
              <td style={{ backgroundColor: l.feSpecMin ? '#e8f5e9' : '#fff3e0' }}>
                {l.feSpecMin ? l.feSpecMin.toFixed(2) : 'N/A'}
              </td>
              <td style={{ backgroundColor: l.sio2SpecMax ? '#e8f5e9' : '#fff3e0' }}>
                {l.sio2SpecMax ? l.sio2SpecMax.toFixed(2) : 'N/A'}
              </td>
              <td>
                <button onClick={() => onRemoveLot(i)} style={{ backgroundColor: '#ff6b6b', color: 'white' }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredLots.length > 0 && (
        <div style={{ 
          backgroundColor: '#e8f5e9', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '15px',
          fontSize: '0.9em'
        }}>
          <strong>Summary for {selectedSize === 'global' ? 'All Sizes' : selectedSize}:</strong> 
          {filteredLots.length} samples | 
          {filteredLots.reduce((sum, l) => sum + l.representativeLotQty, 0).toFixed(0)}t total
        </div>
      )}
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

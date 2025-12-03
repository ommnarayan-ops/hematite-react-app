import React from 'react';

/**
 * Display results for a single product size
 */
export function ResultsBySize({ size, sizeLabel, result, bgColor, headerBgColor }) {
  if (!result) return null;

  const { blended, allocations } = result;

  return (
    <div style={{ backgroundColor: bgColor, padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
      <h4>{sizeLabel}</h4>
      
      {/* Blended Composition Table */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
        <h5>Blended Composition</h5>
        <table border='1' cellPadding='8' style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: headerBgColor }}>
              <th>Parameter</th>
              <th>Value (%)</th>
              <th>Tonnage</th>
              <th>Specification</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fe</td>
              <td>{blended.Fe.toFixed(3)}</td>
              <td>{blended.fe_tonnage}</td>
              <td>≥ {blended.specs.fe_min}%</td>
              <td style={{ color: blended.met_specs.fe ? 'green' : 'red', fontWeight: 'bold' }}>
                {blended.met_specs.fe ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td>SiO2</td>
              <td>{blended.SiO2.toFixed(3)}</td>
              <td>{blended.sio2_tonnage}</td>
              <td>≤ {blended.specs.sio2_max}%</td>
              <td style={{ color: blended.met_specs.sio2 ? 'green' : 'red', fontWeight: 'bold' }}>
                {blended.met_specs.sio2 ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td>Al2O3</td>
              <td>{blended.Al2O3.toFixed(4)}</td>
              <td>{blended.al_tonnage}</td>
              <td>≤ {blended.specs.al_max}%</td>
              <td style={{ color: blended.met_specs.al ? 'green' : 'red', fontWeight: 'bold' }}>
                {blended.met_specs.al ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td>P</td>
              <td>{blended.P.toFixed(4)}</td>
              <td>{blended.p_tonnage}</td>
              <td>≤ {blended.specs.p_max}%</td>
              <td style={{ color: blended.met_specs.p ? 'green' : 'red', fontWeight: 'bold' }}>
                {blended.met_specs.p ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: '10px' }}>
          <strong>Total Allocated: {blended.total_allocated} / 10000 tonnes</strong>
        </p>
      </div>

      {/* Lot Allocations Table */}
      {allocations.length > 0 && (
        <div>
          <h5>Lot Allocations</h5>
          <table border='1' cellPadding='8' style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#d4edda' }}>
                <th>Lot ID</th>
                <th>Allocated (t)</th>
                <th>Fe Contrib (t)</th>
                <th>SiO2 Contrib (t)</th>
                <th>Al2O3 Contrib (t)</th>
                <th>P Contrib (t)</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((alloc, i) => (
                <tr key={i}>
                  <td>{alloc.lotId}</td>
                  <td>{alloc.allocated}</td>
                  <td>{alloc.fe_contrib}</td>
                  <td>{alloc.sio2_contrib}</td>
                  <td>{alloc.al_contrib}</td>
                  <td>{alloc.p_contrib}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Main Results Display component
 */
export function ResultsDisplay({ result, T }) {
  if (!result) return null;

  return (
    <>
      <h3>Blending Results by Product Size</h3>
      
      {result['10-40mm'] && (
        <ResultsBySize
          size='10-40mm'
          sizeLabel='10-40mm (Coarse Grade)'
          result={result['10-40mm']}
          bgColor='#e3f2fd'
          headerBgColor='#e8f4f8'
        />
      )}
      
      {result['Fines'] && (
        <ResultsBySize
          size='Fines'
          sizeLabel='Fines (Fine Grade)'
          result={result['Fines']}
          bgColor='#f3e5f5'
          headerBgColor='#e8f4f8'
        />
      )}
    </>
  );
}

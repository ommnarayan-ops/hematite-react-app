import React from 'react';

/**
 * Helper function to get background color based on allocation status
 */
function getStatusColor(status) {
  if (!status || status === 'ACCEPTED') return '#e8f5e9';  // Green
  if (status.includes('RECOVERED')) return '#fff3e0';      // Orange
  if (status.includes('FORCED')) return '#ffebee';         // Light Red
  return '#ffffff';                                         // Default white
}

/**
 * Display results for a single product size
 */
export function ResultsBySize({ size, sizeLabel, result, bgColor, headerBgColor }) {
  if (!result) return null;

  const { blended, allocations } = result;

  // Calculate percentages using SUMPRODUCT formula separately for each product size
  // Formula: SUMPRODUCT(Representative Lot Qty × Parameter %) / SUM(Representative Lot Qty)
  const calculateMetrics = () => {
    // Try to calculate from allocations array first
    if (allocations && allocations.length > 0) {
      // Sum of tonnage allocated
      const totalTonnage = allocations.reduce((sum, alloc) => sum + alloc.allocated, 0);
      
      if (totalTonnage > 0) {
        // Sum of (tonnage × parameter %) for each parameter
        // contrib stores tonnage × parameter% directly from the algorithm
        const fe_sum = allocations.reduce((sum, alloc) => sum + alloc.fe_contrib, 0);
        const sio2_sum = allocations.reduce((sum, alloc) => sum + alloc.sio2_contrib, 0);
        const al_sum = allocations.reduce((sum, alloc) => sum + alloc.al_contrib, 0);
        const p_sum = allocations.reduce((sum, alloc) => sum + alloc.p_contrib, 0);
        
        // Calculate percentages: SUMPRODUCT result / total tonnage = weighted average %
        const fe_pct = fe_sum / totalTonnage;
        const sio2_pct = sio2_sum / totalTonnage;
        const al_pct = al_sum / totalTonnage;
        const p_pct = p_sum / totalTonnage;
        
        const result = {
          fe_pct,
          sio2_pct,
          al_pct,
          p_pct,
          totalTonnage,
          fe_sum,
          sio2_sum,
          al_sum,
          p_sum
        };
        return result;
      }
    }
    
    // Fallback: use blended values from algorithm when allocations array is empty or totalTonnage is 0
    const fallbackMetrics = {
      fe_pct: blended?.Fe || 0,
      sio2_pct: blended?.SiO2 || 0,
      al_pct: blended?.Al2O3 || 0,
      p_pct: blended?.P || 0,
      totalTonnage: blended?.total_allocated || 0,
      fe_sum: blended?.fe_tonnage || 0,
      sio2_sum: blended?.sio2_tonnage || 0,
      al_sum: blended?.al_tonnage || 0,
      p_sum: blended?.p_tonnage || 0
    };
    return fallbackMetrics;
  };

  const metrics = calculateMetrics();
  const fe_pct = metrics.fe_pct;
  const sio2_pct = metrics.sio2_pct;
  const al_pct = metrics.al_pct;
  const p_pct = metrics.p_pct;

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
              <td style={{ cursor: 'help' }}>
                {fe_pct.toFixed(3)}
              </td>
              <td>{metrics.fe_sum || blended?.fe_tonnage || 0}</td>
              <td>≥ {blended?.specs?.fe_min || 0}%</td>
              <td style={{ color: fe_pct >= (blended?.specs?.fe_min || 0) ? 'green' : 'red', fontWeight: 'bold' }}>
                {fe_pct >= (blended?.specs?.fe_min || 0) ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td>SiO2</td>
              <td style={{ cursor: 'help' }}>
                {sio2_pct.toFixed(3)}
              </td>
              <td>{metrics.sio2_sum || blended?.sio2_tonnage || 0}</td>
              <td>≤ {blended?.specs?.sio2_max || 0}%</td>
              <td style={{ color: sio2_pct <= (blended?.specs?.sio2_max || 0) ? 'green' : 'red', fontWeight: 'bold' }}>
                {sio2_pct <= (blended?.specs?.sio2_max || 0) ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td>Al2O3</td>
              <td style={{ cursor: 'help' }}>
                {al_pct.toFixed(4)}
              </td>
              <td>{metrics.al_sum || blended?.al_tonnage || 0}</td>
              <td>≤ {blended?.specs?.al_max || 0}%</td>
              <td style={{ color: al_pct <= (blended?.specs?.al_max || 0) ? 'green' : 'red', fontWeight: 'bold' }}>
                {al_pct <= (blended?.specs?.al_max || 0) ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td>P</td>
              <td style={{ cursor: 'help' }}>
                {p_pct.toFixed(4)}
              </td>
              <td>{metrics.p_sum || blended?.p_tonnage || 0}</td>
              <td>≤ {blended?.specs?.p_max || 0}%</td>
              <td style={{ color: p_pct <= (blended?.specs?.p_max || 0) ? 'green' : 'red', fontWeight: 'bold' }}>
                {p_pct <= (blended?.specs?.p_max || 0) ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: '10px' }}>
          <strong>Total Allocated: {metrics.totalTonnage} / 10000 tonnes</strong>
        </p>
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0f0f0', borderLeft: '4px solid #2196F3', borderRadius: '3px' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9em', fontWeight: 'bold', color: '#1976D2' }}>
            Formula Calculations (SUMPRODUCT Method) for {sizeLabel}:
          </p>
          
          <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.8em', fontWeight: '600', color: '#333' }}>Fe:</p>
            <p style={{ margin: '0', fontSize: '0.75em', fontFamily: 'monospace', color: '#444' }}>
              = SUMPRODUCT(Representative Lot Qty × Fe %) / SUM(Representative Lot Qty)
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75em', fontFamily: 'monospace', color: '#666' }}>
              = {metrics.fe_sum.toFixed(2)} / {metrics.totalTonnage} = {fe_pct.toFixed(3)}%
            </p>
          </div>

          <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.8em', fontWeight: '600', color: '#333' }}>SiO2:</p>
            <p style={{ margin: '0', fontSize: '0.75em', fontFamily: 'monospace', color: '#444' }}>
              = SUMPRODUCT(Representative Lot Qty × SiO2 %) / SUM(Representative Lot Qty)
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75em', fontFamily: 'monospace', color: '#666' }}>
              = {metrics.sio2_sum.toFixed(2)} / {metrics.totalTonnage} = {sio2_pct.toFixed(3)}%
            </p>
          </div>

          <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.8em', fontWeight: '600', color: '#333' }}>Al2O3:</p>
            <p style={{ margin: '0', fontSize: '0.75em', fontFamily: 'monospace', color: '#444' }}>
              = SUMPRODUCT(Representative Lot Qty × Al2O3 %) / SUM(Representative Lot Qty)
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75em', fontFamily: 'monospace', color: '#666' }}>
              = {metrics.al_sum.toFixed(2)} / {metrics.totalTonnage} = {al_pct.toFixed(4)}%
            </p>
          </div>

          <div style={{ marginBottom: '0px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.8em', fontWeight: '600', color: '#333' }}>P:</p>
            <p style={{ margin: '0', fontSize: '0.75em', fontFamily: 'monospace', color: '#444' }}>
              = SUMPRODUCT(Representative Lot Qty × P %) / SUM(Representative Lot Qty)
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75em', fontFamily: 'monospace', color: '#666' }}>
              = {metrics.p_sum.toFixed(2)} / {metrics.totalTonnage} = {p_pct.toFixed(4)}%
            </p>
          </div>
        </div>
      </div>

      {/* Lot Allocations Table */}
      {allocations.length > 0 && (
        <div>
          <h5>Lot Allocations (with Rejection Handling)</h5>
          <table border='1' cellPadding='8' style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#d4edda' }}>
                <th>Sample ID</th>
                <th>Status</th>
                <th>Allocated (t)</th>
                <th>Fe Contrib (t)</th>
                <th>SiO2 Contrib (t)</th>
                <th>Al2O3 Contrib (t)</th>
                <th>P Contrib (t)</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((alloc, i) => (
                <tr key={i} style={{ backgroundColor: getStatusColor(alloc.status) }}>
                  <td>{alloc.sampleId}</td>
                  <td style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                    {alloc.status || 'ACCEPTED'}
                  </td>
                  <td>{alloc.allocated}</td>
                  <td>{alloc.fe_contrib}</td>
                  <td>{alloc.sio2_contrib}</td>
                  <td>{alloc.al_contrib}</td>
                  <td>{alloc.p_contrib}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {blended.rejectedCount > 0 && (
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              <strong>Rejection Analysis:</strong> {blended.rejectedCount} lots initially rejected | {blended.recoveredCount} lots recovered via weighted average compensation
            </p>
          )}
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

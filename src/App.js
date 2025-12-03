import React, { useState, useEffect } from 'react';
import './App.css';
import { importFile } from './utils/fileImport';
import { buildAndSolve } from './utils/blendingAlgorithm';
import {
  SpecificationsForm,
  ShipmentTargetInput,
  AddLotForm,
  FileUploadSection,
  LotsTable,
  RunBlendButton
} from './components/Forms';
import { ResultsDisplay } from './components/ResultsDisplay';

export default function App() {
  // State management
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({
    lotId: '',
    tonnage: 1000,
    Fe: 60,
    SiO2: 4.0,
    Al2O3: 1.0,
    P: 0.03,
    productSize: '10-40mm'
  });
  const [T, setT] = useState(10000);
  const [FeMin, setFeMin] = useState(62.0);
  const [SiO2spec, setSiO2spec] = useState(6.0);
  const [AlSpec, setAlSpec] = useState(1.5);
  const [Pspec, setPspec] = useState(0.06);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize with sample data
  useEffect(() => {
    if (lots.length === 0) {
      const sample = [];
      for (let i = 0; i < 8; i++) {
        sample.push({
          lotId: i + 1,
          tonnage: Math.floor(500 + Math.random() * 4500),
          Fe: +(55 + Math.random() * 11).toFixed(2),
          SiO2: +(1 + Math.random() * 7).toFixed(2),
          Al2O3: +(0.3 + Math.random() * 2.2).toFixed(2),
          P: +(0.01 + Math.random() * 0.07).toFixed(3),
          productSize: i % 2 === 0 ? '10-40mm' : 'Fines'
        });
      }
      setLots(sample);
    }
  }, []);

  // Add new lot from form
  function addLot(e) {
    e.preventDefault();
    setLots([
      ...lots,
      {
        lotId: form.lotId || `LOT_${Date.now()}`,
        tonnage: +form.tonnage,
        Fe: +form.Fe,
        SiO2: +form.SiO2,
        Al2O3: +form.Al2O3,
        P: +form.P,
        productSize: form.productSize || '10-40mm'
      }
    ]);
    setForm({
      lotId: '',
      tonnage: 1000,
      Fe: 60,
      SiO2: 4.0,
      Al2O3: 1.0,
      P: 0.03,
      productSize: '10-40mm'
    });
    setMessage('Lot added successfully!');
    setTimeout(() => setMessage(''), 3000);
  }

  // Remove lot by index
  function removeLot(idx) {
    const copy = [...lots];
    copy.splice(idx, 1);
    setLots(copy);
    setMessage('Lot removed!');
    setTimeout(() => setMessage(''), 3000);
  }

  // Handle file upload
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('Importing file...');
    try {
      const data = await importFile(file);
      setLots([...lots, ...data]);
      setMessage(`Successfully imported ${data.length} lot(s)`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Import error:', err);
      setMessage(`Error importing file: ${err.message}`);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  // Run blending solver
  function handleBuildAndSolve() {
    if (lots.length === 0) {
      setMessage('Please add at least one lot first!');
      return;
    }

    const blendResult = buildAndSolve(lots, T, FeMin, SiO2spec, AlSpec, Pspec);
    
    if (Object.keys(blendResult).length === 0) {
      setMessage('Unable to calculate blend with current specifications');
      setResult(null);
    } else {
      setResult(blendResult);
      setMessage('Blend calculation completed!');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Hematite Blending Optimizer</h1>
      
      {/* Status Message */}
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#e8f5e9',
          borderLeft: '4px solid #4caf50',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {/* Quality Specifications Form */}
      <SpecificationsForm
        feMin={FeMin}
        setFeMin={setFeMin}
        sio2Spec={SiO2spec}
        setSiO2spec={setSiO2spec}
        alSpec={AlSpec}
        setAlSpec={setAlSpec}
        pSpec={Pspec}
        setPspec={setPspec}
      />

      {/* Shipment Target */}
      <ShipmentTargetInput T={T} setT={setT} />

      {/* Add Lot Form */}
      <AddLotForm form={form} setForm={setForm} onSubmit={addLot} />

      {/* File Upload */}
      <FileUploadSection onFileUpload={handleFileUpload} />
      {loading && <p style={{ color: '#666' }}>Loading file...</p>}

      {/* Lots Table */}
      <LotsTable lots={lots} onRemoveLot={removeLot} />

      {/* Run Blend Button */}
      <RunBlendButton onClick={handleBuildAndSolve} />

      {/* Results Display */}
      {result && <ResultsDisplay result={result} T={T} />}
    </div>
  );
}

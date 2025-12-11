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
    sampleId: '',
    representativeLotQty: 1000,
    Fe: 60,
    SiO2: 4.0,
    Al2O3: 1.0,
    P: 0.03,
    productSize: '10-40mm',
    feSpecMin: 62.0,
    sio2SpecMax: 6.0
  });
  const [T, setT] = useState(10000);
  
  // Global quality specifications
  const [FeMin, setFeMin] = useState(62.0);
  const [SiO2spec, setSiO2spec] = useState(6.0);
  const [AlSpec, setAlSpec] = useState(1.5);
  const [Pspec, setPspec] = useState(0.06);

  // 10-40mm specific specifications
  const [FeMin10_40, setFeMin10_40] = useState(62.0);
  const [SiO2spec10_40, setSiO2spec10_40] = useState(6.0);
  const [AlSpec10_40, setAlSpec10_40] = useState(1.5);
  const [Pspec10_40, setPspec10_40] = useState(0.06);

  // Fines specific specifications
  const [FeMinFines, setFeMinFines] = useState(61.5);
  const [SiO2specFines, setSiO2specFines] = useState(6.5);
  const [AlSpecFines, setAlSpecFines] = useState(1.6);
  const [PspecFines, setPspecFines] = useState(0.07);

  // UI state for product size analysis
  const [selectedSize, setSelectedSize] = useState('global');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize with sample data
  useEffect(() => {
    if (lots.length === 0) {
      const sample = [];
      for (let i = 0; i < 8; i++) {
        sample.push({
          sampleId: i + 1,
          representativeLotQty: Math.floor(500 + Math.random() * 4500),
          Fe: +(55 + Math.random() * 11).toFixed(2),
          SiO2: +(1 + Math.random() * 7).toFixed(2),
          Al2O3: +(0.3 + Math.random() * 2.2).toFixed(2),
          P: +(0.01 + Math.random() * 0.07).toFixed(3),
          productSize: i % 2 === 0 ? '10-40mm' : 'Fines',
          feSpecMin: i % 2 === 0 ? 62.0 : 61.5,  // Product-size specific
          sio2SpecMax: i % 2 === 0 ? 6.0 : 6.5
        });
      }
      setLots(sample);
    }
  }, []);

  // Add new sample from form
  function addLot(e) {
    e.preventDefault();
    setLots([
      ...lots,
      {
        sampleId: form.sampleId || `Sample_${Date.now()}`,
        representativeLotQty: +form.representativeLotQty,
        Fe: +form.Fe,
        SiO2: +form.SiO2,
        Al2O3: +form.Al2O3,
        P: +form.P,
        productSize: form.productSize || '10-40mm',
        feSpecMin: +form.feSpecMin,
        sio2SpecMax: +form.sio2SpecMax
      }
    ]);
    setForm({
      sampleId: '',
      representativeLotQty: 1000,
      Fe: 60,
      SiO2: 4.0,
      Al2O3: 1.0,
      P: 0.03,
      productSize: '10-40mm',
      feSpecMin: 62.0,
      sio2SpecMax: 6.0
    });
    setMessage('Sample added successfully!');
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

    // Prepare product-size specific specs override
    const sizeSpecsOverride = {
      '10-40mm': {
        feMin: FeMin10_40,
        sio2Max: SiO2spec10_40,
        alMax: AlSpec10_40,
        pMax: Pspec10_40
      },
      'Fines': {
        feMin: FeMinFines,
        sio2Max: SiO2specFines,
        alMax: AlSpecFines,
        pMax: PspecFines
      }
    };

    const blendResult = buildAndSolve(lots, T, FeMin, SiO2spec, AlSpec, Pspec, sizeSpecsOverride);
    
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
        feMin10_40={FeMin10_40}
        setFeMin10_40={setFeMin10_40}
        sio2Spec10_40={SiO2spec10_40}
        setSiO2spec10_40={setSiO2spec10_40}
        alSpec10_40={AlSpec10_40}
        setAlSpec10_40={setAlSpec10_40}
        pSpec10_40={Pspec10_40}
        setPspec10_40={setPspec10_40}
        feMinFines={FeMinFines}
        setFeMinFines={setFeMinFines}
        sio2SpecFines={SiO2specFines}
        setSiO2specFines={setSiO2specFines}
        alSpecFines={AlSpecFines}
        setAlSpecFines={setAlSpecFines}
        pSpecFines={PspecFines}
        setPspecFines={setPspecFines}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
      />

      {/* Shipment Target */}
      <ShipmentTargetInput T={T} setT={setT} />

      {/* Add Lot Form */}
      <AddLotForm form={form} setForm={setForm} onSubmit={addLot} />

      {/* File Upload */}
      <FileUploadSection onFileUpload={handleFileUpload} />
      {loading && <p style={{ color: '#666' }}>Loading file...</p>}

      {/* Lots Table */}
      <LotsTable lots={lots} onRemoveLot={removeLot} selectedSize={selectedSize} />

      {/* Run Blend Button */}
      <RunBlendButton onClick={handleBuildAndSolve} />

      {/* Results Display */}
      {result && <ResultsDisplay result={result} T={T} />}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Activity, Stethoscope } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import WardView from './components/WardView';
import PatientModal from './components/PatientModal';
import OCRImporter from './components/OCRImporter';
import './index.css';

const MainApp = () => {
  const { wards, activeWardId, setActiveWardId, movePatient } = useHospital();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOCROpen, setIsOCROpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  useEffect(() => {
    const handleOpenModal = (e) => {
      setEditingPatient(e.detail);
      setIsModalOpen(true);
    };
    window.addEventListener('openPatientModal', handleOpenModal);
    return () => window.removeEventListener('openPatientModal', handleOpenModal);
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && over.data.current?.type === 'Bed') {
      const patientId = active.id.replace('patient-', '');
      const { fromRoomId, fromBedNumber } = active.data.current;
      const { roomId: toRoomId, bed: { bedNumber: toBedNumber } } = over.data.current;

      // Don't move if it's the exact same bed
      if (fromRoomId !== toRoomId || fromBedNumber !== toBedNumber) {
        // Also ensure bed is empty
        if (!over.data.current.bed.patient) {
          movePatient(patientId, fromRoomId, fromBedNumber, toRoomId, toBedNumber);
        }
      }
    }
  };

  const handleNewPatientClick = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="app-container">
        <header className="app-header glass-panel">
          <div className="brand animate-fade-in">
            <Stethoscope className="brand-icon" size={32} />
            <h1 className="brand-title">PediCare Servis Takip</h1>
          </div>
          <div className="actions">
            <button className="btn btn-outline" style={{ marginRight: '1rem' }} onClick={() => setIsOCROpen(true)}>
              <Activity size={18} />
              OCR ile Fotoğraftan Ekle
            </button>
            <button className="btn btn-primary" onClick={handleNewPatientClick}>
              + Yeni Hasta Ekle
            </button>
          </div>
        </header>

        <div className="tabs-container animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {Object.values(wards).map(ward => (
            <button
              key={ward.id}
              className={`tab-btn ${activeWardId === ward.id ? 'active' : ''}`}
              onClick={() => setActiveWardId(ward.id)}
            >
              {ward.name}
            </button>
          ))}
        </div>

        <main className="tab-content animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <WardView />
        </main>

        <PatientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patientToEdit={editingPatient}
        />

        <OCRImporter
          isOpen={isOCROpen}
          onClose={() => setIsOCROpen(false)}
        />
      </div>
    </DndContext>
  );
};

function App() {
  return (
    <HospitalProvider>
      <MainApp />
    </HospitalProvider>
  );
}

export default App;

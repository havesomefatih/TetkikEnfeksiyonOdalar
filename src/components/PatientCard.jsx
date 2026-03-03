import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useHospital } from '../context/HospitalContext';
import { User, Activity, Edit3 } from 'lucide-react';

const PatientCard = ({ patientId, roomId, bedNumber }) => {
    const { patients } = useHospital();
    const patient = patients[patientId];

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `patient-${patientId}`,
        data: { type: 'Patient', patient, fromRoomId: roomId, fromBedNumber: bedNumber }
    });

    if (!patient) return null;

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 999 : 1,
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'none',
        cursor: 'grab'
    };

    const getDiagnosisColor = (diagnosis) => {
        const colors = {
            "RSV": "var(--color-diagnosis-1)",
            "İnfluenza": "var(--color-diagnosis-2)",
            "Rhinovirus": "var(--color-diagnosis-3)",
            "Adenovirus": "var(--color-diagnosis-4)"
        };
        return colors[diagnosis] || "var(--color-diagnosis-5)";
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}
            {...listeners}
            {...attributes}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                    backgroundColor: patient.gender === 'Kız' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: patient.gender === 'Kız' ? '#ec4899' : '#3b82f6',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-full)'
                }}>
                    <User size={14} />
                </div>
                <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {patient.name}
                        {patient.isDischarging && (
                            <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.15rem 0.3rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>Taburcu</span>
                        )}
                    </h4>
                    {patient.diagnosis && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                            <Activity size={10} color={getDiagnosisColor(patient.diagnosis)} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {patient.diagnosis}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Button - prevent drag on this specific element */}
            <button
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    // Open edit modal
                    window.dispatchEvent(new CustomEvent('openPatientModal', { detail: patient }));
                }}
            >
                <Edit3 size={14} />
            </button>
        </div>
    );
};

export default PatientCard;

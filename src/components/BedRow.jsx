import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import PatientCard from './PatientCard';
import { useHospital } from '../context/HospitalContext';
import { Bookmark } from 'lucide-react';

const BedRow = ({ bed, roomId }) => {
    const { toggleBedReservation } = useHospital();

    const { isOver, setNodeRef } = useDroppable({
        id: `bed-${bed.id}`,
        data: { type: 'Bed', bed, roomId }
    });

    return (
        <div
            ref={setNodeRef}
            className={`bed-row ${isOver ? 'bed-over' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.15)',
                border: isOver ? '1px dashed var(--accent-primary)' : '1px solid transparent',
                minHeight: '3.5rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                opacity: bed.isReserved ? 0.6 : 1
            }}
        >
            <div style={{
                width: '1.5rem',
                height: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bed.isReserved ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginRight: '0.75rem',
                color: bed.isReserved ? 'var(--warning)' : 'var(--text-muted)'
            }}>
                {bed.bedNumber}
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {bed.patient ? (
                    <PatientCard patientId={bed.patient} roomId={roomId} bedNumber={bed.bedNumber} />
                ) : (
                    <>
                        <span style={{ color: bed.isReserved ? 'var(--warning)' : 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', fontWeight: bed.isReserved ? '500' : 'normal' }}>
                            {bed.isReserved ? 'Rezerve Yatak (Boş)' : 'Boş Yatak'}
                        </span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBedReservation(roomId, bed.bedNumber);
                            }}
                            title={bed.isReserved ? "Rezervasyonu Kaldır" : "Yatağı Rezerve Et"}
                            style={{
                                background: bed.isReserved ? 'rgba(245, 158, 11, 0.1)' : 'none',
                                border: bed.isReserved ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                color: bed.isReserved ? 'var(--warning)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Bookmark size={14} fill={bed.isReserved ? 'var(--warning)' : 'none'} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BedRow;

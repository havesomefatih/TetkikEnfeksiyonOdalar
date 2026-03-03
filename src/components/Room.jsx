import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import BedRow from './BedRow';
import { BedDouble, Users, Lock } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

const Room = ({ room }) => {
    const { toggleRoomIsolation } = useHospital();
    const { isOver, setNodeRef } = useDroppable({
        id: `room-${room.id}`,
        data: { type: 'Room', room }
    });

    const occupiedCount = room.beds.filter(b => b.patient).length;

    return (
        <div
            ref={setNodeRef}
            className={`room-card glass-panel animate-fade-in ${isOver ? 'room-over' : ''}`}
            style={{
                padding: '1.25rem',
                border: isOver ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: isOver ? 'var(--bg-tertiary)' : 'rgba(30, 41, 59, 0.5)',
                transition: 'all 0.2s ease',
                boxShadow: isOver ? 'var(--shadow-glow)' : 'var(--shadow-md)'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        padding: '0.35rem',
                        borderRadius: '0.375rem',
                        color: 'var(--accent-primary)'
                    }}>
                        <BedDouble size={18} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Oda {room.id}</h3>
                        {room.isIsolated && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                                İzole Oda
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => toggleRoomIsolation(room.id)}
                        title={room.isIsolated ? "İzolasyonu Kaldır" : "Odayı İzole Et (Yatışa Kapat)"}
                        style={{ background: 'none', border: 'none', color: room.isIsolated ? 'var(--danger)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                    >
                        <Lock size={16} />
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        color: occupiedCount === room.capacity ? 'var(--danger)' : 'var(--success)',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-full)'
                    }}>
                        <Users size={12} />
                        <span>{occupiedCount} / {room.capacity}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: room.isIsolated ? 0.7 : 1 }}>
                {room.beds.map((bed) => (
                    <BedRow
                        key={bed.id}
                        bed={bed}
                        roomId={room.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default Room;

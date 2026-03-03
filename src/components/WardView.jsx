import React from 'react';
import { useHospital } from '../context/HospitalContext';
import Room from './Room';

const WardView = () => {
    const { wards, activeWardId, rooms } = useHospital();

    const activeWard = wards[activeWardId];
    const wardRoomIds = activeWard.rooms.map(r => r.id);

    // Filter rooms that belong to the active ward
    const activeRooms = wardRoomIds.map(roomId => rooms[roomId]).filter(Boolean);

    return (
        <div className="ward-view">
            <div className="ward-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>{activeWard.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Toplam {activeRooms.length} oda görüntüleniyor
                    </p>
                </div>
            </div>

            <div className="ward-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
            }}>
                {activeRooms.map(room => (
                    <Room key={room.id} room={room} />
                ))}
            </div>
        </div>
    );
};

export default WardView;

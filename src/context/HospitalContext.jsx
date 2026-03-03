import React, { createContext, useContext, useState, useEffect } from 'react';
import { wards as initialWardsData } from '../data/wards';

const HospitalContext = createContext();

export const useHospital = () => useContext(HospitalContext);

// Generates an empty room structure based on capacities
const generateInitialRooms = () => {
    const rooms = {};

    Object.values(initialWardsData).forEach(ward => {
        ward.rooms.forEach(room => {
            // Create empty beds array matching capacity
            const beds = Array(room.capacity).fill(null).map((_, i) => ({
                id: `${room.id}-${i + 1}`,
                bedNumber: i + 1,
                patient: null,
                isReserved: false
            }));

            rooms[room.id] = {
                id: room.id,
                wardId: ward.id,
                capacity: room.capacity,
                isIsolated: false,
                beds: beds
            };
        });
    });

    return rooms;
};

export const HospitalProvider = ({ children }) => {
    const [activeWardId, setActiveWardId] = useState('cocuk-enfeksiyon');
    const [rooms, setRooms] = useState(generateInitialRooms());
    const [patients, setPatients] = useState({}); // Stores patient details separately by their ID

    const addPatientToRoom = (patientData, roomId, bedNumber) => {
        setPatients(prev => ({
            ...prev,
            [patientData.id]: patientData
        }));

        setRooms(prev => {
            const newRooms = { ...prev };
            const room = { ...newRooms[roomId] };
            const beds = [...room.beds];

            const bedIndex = beds.findIndex(b => b.bedNumber === bedNumber);
            if (bedIndex !== -1) {
                beds[bedIndex] = { ...beds[bedIndex], patient: patientData.id };
            }

            room.beds = beds;
            newRooms[roomId] = room;
            return newRooms;
        });
    };

    const movePatient = (patientId, fromRoomId, fromBedNumber, toRoomId, toBedNumber) => {
        setRooms(prev => {
            const newRooms = { ...prev };

            // Remove from source map
            const fromRoom = { ...newRooms[fromRoomId] };
            const fromBeds = [...fromRoom.beds];
            const fromBedIndex = fromBeds.findIndex(b => b.bedNumber === fromBedNumber);
            if (fromBedIndex !== -1) {
                fromBeds[fromBedIndex] = { ...fromBeds[fromBedIndex], patient: null };
            }
            fromRoom.beds = fromBeds;
            newRooms[fromRoomId] = fromRoom;

            // Add to dest map
            const toRoom = { ...newRooms[toRoomId] };
            const toBeds = [...toRoom.beds];
            const toBedIndex = toBeds.findIndex(b => b.bedNumber === toBedNumber);
            if (toBedIndex !== -1) {
                toBeds[toBedIndex] = { ...toBeds[toBedIndex], patient: patientId };
            }
            toRoom.beds = toBeds;
            newRooms[toRoomId] = toRoom;

            return newRooms;
        });
    };

    const updatePatient = (patientId, updates) => {
        setPatients(prev => ({
            ...prev,
            [patientId]: { ...prev[patientId], ...updates }
        }));
    };

    const toggleRoomIsolation = (roomId) => {
        setRooms(prev => {
            const newRooms = { ...prev };
            newRooms[roomId] = { ...newRooms[roomId], isIsolated: !newRooms[roomId].isIsolated };
            return newRooms;
        });
    };

    const toggleBedReservation = (roomId, bedNumber) => {
        setRooms(prev => {
            const newRooms = { ...prev };
            const room = { ...newRooms[roomId] };
            const beds = [...room.beds];

            const bedIndex = beds.findIndex(b => b.bedNumber === bedNumber);
            if (bedIndex !== -1) {
                beds[bedIndex] = { ...beds[bedIndex], isReserved: !beds[bedIndex].isReserved };
            }

            room.beds = beds;
            newRooms[roomId] = room;
            return newRooms;
        });
    };

    const checkRecommendations = (newPatient) => {
        let green = [];
        let yellow = [];
        let mergeSuggestions = [];
        let interWardSuggestions = [];

        // Helper to check rooms in a specific ward
        const checkWardRooms = (wardId) => {
            const wardGreen = [];
            const wardYellow = [];

            const wardRooms = initialWardsData[wardId].rooms.map(r => rooms[r.id]);

            wardRooms.forEach(room => {
                if (room.isIsolated) return; // Do not recommend isolated rooms

                const emptyBeds = room.beds.filter(b => !b.patient && !b.isReserved);
                if (emptyBeds.length === 0) return;

                const occupants = room.beds.filter(b => b.patient).map(b => patients[b.patient]);

                if (occupants.length === 0) {
                    emptyBeds.forEach(bed => wardGreen.push({ roomId: room.id, bedNumber: bed.bedNumber, reason: `Tamamen Boş Oda (${initialWardsData[wardId].name})` }));
                } else {
                    let diagnosisMatch = true;
                    let genderMatch = true;

                    occupants.forEach(occ => {
                        // Allow "Yok" to not strictly mismatch if we want, but currently strict:
                        if (occ.diagnosis !== newPatient.diagnosis) diagnosisMatch = false;
                        if (occ.gender !== newPatient.gender) genderMatch = false;
                    });

                    if (newPatient.diagnosis !== 'Yok' && diagnosisMatch && genderMatch) {
                        emptyBeds.forEach(bed => wardGreen.push({ roomId: room.id, bedNumber: bed.bedNumber, reason: `Aynı Tanı ve Cinsiyet (${initialWardsData[wardId].name})` }));
                    } else {
                        let reason = !diagnosisMatch ? 'Farklı Tanı Riski' : 'Farklı Cinsiyet';
                        if (!diagnosisMatch && !genderMatch) reason = 'Farklı Tanı ve Cinsiyet';
                        emptyBeds.forEach(bed => wardYellow.push({ roomId: room.id, bedNumber: bed.bedNumber, reason: `${reason} (${initialWardsData[wardId].name})` }));
                    }
                }
            });

            return { wardGreen, wardYellow, wardRooms };
        };

        // First check current ward
        const { wardGreen: currentGreen, wardYellow: currentYellow, wardRooms: currentWardRooms } = checkWardRooms(activeWardId);
        green.push(...currentGreen);
        yellow.push(...currentYellow);

        // Advanced Merge Check for current ward
        const partiallyOccupiedRooms = currentWardRooms.filter(r =>
            !r.isIsolated && r.beds.some(b => b.patient) && r.beds.some(b => !b.patient && !b.isReserved)
        );

        if (partiallyOccupiedRooms.length >= 2) {
            for (let i = 0; i < partiallyOccupiedRooms.length; i++) {
                for (let j = i + 1; j < partiallyOccupiedRooms.length; j++) {
                    const r1 = partiallyOccupiedRooms[i];
                    const r2 = partiallyOccupiedRooms[j];

                    const r1Pats = r1.beds.filter(b => b.patient).map(b => patients[b.patient]);
                    const r2Pats = r2.beds.filter(b => b.patient).map(b => patients[b.patient]);

                    if (r1Pats.length === 1 && r2Pats.length === 1 && r1.capacity >= 2) {
                        const p1 = r1Pats[0];
                        const p2 = r2Pats[0];

                        if (p1.diagnosis !== 'Yok' && p1.diagnosis === p2.diagnosis && p1.gender === p2.gender) {
                            mergeSuggestions.push({
                                description: `ÖNERİ: Oda ${r2.id} ve ${r1.id}'deki ${p1.diagnosis} hastalarını birleştirerek yepyeni boş bir oda yaratabilirsiniz.`
                            });
                        }
                    }
                }
            }
        }

        // Inter-Ward Support: If current ward is completely empty of green/yellow, OR just constantly check other ward for Greens
        const otherWardId = activeWardId === 'cocuk-enfeksiyon' ? 'cocuk-tetkik' : 'cocuk-enfeksiyon';
        const { wardGreen: otherGreen, wardYellow: otherYellow } = checkWardRooms(otherWardId);

        if (green.length === 0 && yellow.length === 0) {
            // If completely full, suggest anything from the other ward but as red/inter-ward alerts
            interWardSuggestions.push(...otherGreen.map(g => ({ ...g, isInterWard: true })));
            interWardSuggestions.push(...otherYellow.map(y => ({ ...y, isInterWard: true })));
        } else {
            // Even if we have space, if there is a Green (Perfect match) in the OTHER ward, we should at least tell them.
            if (otherGreen.length > 0) {
                interWardSuggestions.push(...otherGreen.map(g => ({ ...g, isInterWard: true })));
            }
        }

        return { green, yellow, mergeSuggestions, interWardSuggestions };
    };

    const value = {
        wards: initialWardsData,
        activeWardId,
        setActiveWardId,
        rooms,
        patients,
        addPatientToRoom,
        movePatient,
        updatePatient,
        checkRecommendations,
        toggleRoomIsolation,
        toggleBedReservation
    };

    return (
        <HospitalContext.Provider value={value}>
            {children}
        </HospitalContext.Provider>
    );
};

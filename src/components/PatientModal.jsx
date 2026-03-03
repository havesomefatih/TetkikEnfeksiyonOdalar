import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const PatientModal = ({ isOpen, onClose, patientToEdit = null }) => {
    const { updatePatient, addPatientToRoom, checkRecommendations } = useHospital();

    const [formData, setFormData] = useState({
        name: '',
        gender: 'Erkek',
        diagnosis: 'Yok',
        isDischarging: false,
        selectedBed: null
    });

    const [recommendations, setRecommendations] = useState({ green: [], yellow: [], mergeSuggestions: [] });

    useEffect(() => {
        if (patientToEdit) {
            setFormData({
                name: patientToEdit.name || '',
                gender: patientToEdit.gender || 'Erkek',
                diagnosis: patientToEdit.diagnosis || 'Yok',
                isDischarging: patientToEdit.isDischarging || false,
                selectedBed: null
            });
            setRecommendations({ green: [], yellow: [], mergeSuggestions: [] });
        } else {
            setFormData({
                name: '',
                gender: 'Erkek',
                diagnosis: 'Yok',
                isDischarging: false,
                selectedBed: null
            });
        }
    }, [patientToEdit, isOpen]);

    // Recalculate recommendations when formData (for new patient) changes
    useEffect(() => {
        if (!patientToEdit && isOpen) {
            const recs = checkRecommendations({
                diagnosis: formData.diagnosis,
                gender: formData.gender
            });
            setRecommendations(recs);
        }
    }, [formData.diagnosis, formData.gender, patientToEdit, isOpen, checkRecommendations]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (patientToEdit) {
            updatePatient(patientToEdit.id, {
                name: formData.name,
                gender: formData.gender,
                diagnosis: formData.diagnosis,
                isDischarging: formData.isDischarging
            });
        } else {
            const newId = `patient-${Date.now()}`;

            // If a bed is selected, place there. Otherwise, pick the first green or yellow.
            let targetRoom, targetBed;
            if (formData.selectedBed) {
                [targetRoom, targetBed] = formData.selectedBed.split('-');
            } else if (recommendations.green.length > 0) {
                targetRoom = recommendations.green[0].roomId;
                targetBed = recommendations.green[0].bedNumber;
            } else if (recommendations.yellow.length > 0) {
                targetRoom = recommendations.yellow[0].roomId;
                targetBed = recommendations.yellow[0].bedNumber;
            } else {
                alert('Uygun boş yatak bulunamadı!');
                return;
            }

            addPatientToRoom({
                id: newId,
                name: formData.name,
                gender: formData.gender,
                diagnosis: formData.diagnosis,
                isDischarging: formData.isDischarging
            }, targetRoom, parseInt(targetBed));
        }
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="glass-panel animate-fade-in" style={{
                width: '100%', maxWidth: '550px', padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {patientToEdit ? 'Hasta Detayları' : 'Yeni Hasta Ekle'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                Cinsiyet
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.1)', outline: 'none'
                                }}
                            >
                                <option value="Erkek">Erkek</option>
                                <option value="Kız">Kız</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                Yatış Tanısı
                            </label>
                            <select
                                value={['Yok', 'RSV', 'İnfluenza', 'Rhinovirus', 'Adenovirus', 'Nöbet/Nöro', 'Biyopsi', 'Anjiyo'].includes(formData.diagnosis) ? formData.diagnosis : 'Diğer'}
                                onChange={(e) => {
                                    if (e.target.value === 'Diğer') {
                                        setFormData({ ...formData, diagnosis: '' }); // reset for custom input if needed
                                        setTimeout(() => document.getElementById('custom-diagnosis')?.focus(), 50);
                                    } else {
                                        setFormData({ ...formData, diagnosis: e.target.value });
                                    }
                                }}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.1)', outline: 'none'
                                }}
                            >
                                <option value="Yok">Bilinmiyor/Eklenmedi</option>
                                <option value="RSV">RSV</option>
                                <option value="İnfluenza">İnfluenza</option>
                                <option value="Rhinovirus">Rhinovirus</option>
                                <option value="Adenovirus">Adenovirus</option>
                                <option value="Nöbet/Nöro">Nöbet/Nöro</option>
                                <option value="Biyopsi">Biyopsi</option>
                                <option value="Anjiyo">Anjiyo</option>
                                <option value="Diğer">Diğer (Özel Giriş)</option>
                            </select>

                            {!['Yok', 'RSV', 'İnfluenza', 'Rhinovirus', 'Adenovirus', 'Nöbet/Nöro', 'Biyopsi', 'Anjiyo'].includes(formData.diagnosis) && (
                                <input
                                    id="custom-diagnosis"
                                    type="text"
                                    placeholder="Manuel tanı giriniz..."
                                    value={formData.diagnosis}
                                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    style={{
                                        marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'rgba(0, 0, 0, 0.4)', color: 'white',
                                        border: '1px solid rgba(59, 130, 246, 0.5)', outline: 'none'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', padding: '0.75rem', backgroundColor: formData.isDischarging ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', border: formData.isDischarging ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.2s' }}>
                        <input
                            type="checkbox"
                            checked={formData.isDischarging}
                            onChange={(e) => setFormData({ ...formData, isDischarging: e.target.checked })}
                            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--danger)', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.875rem', color: formData.isDischarging ? 'var(--danger)' : 'white', fontWeight: formData.isDischarging ? '600' : '400' }}>Taburcu Planı Var</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mevcut veya eklenecek hastayı vurgulayarak belirtir.</div>
                        </div>
                    </label>

                    {!patientToEdit && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem' }}>Yatış Önerileri</h3>

                            {formData.diagnosis === 'Yok' && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                                    * Tanı girmeden doğru öneri almak zordur.
                                </p>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {recommendations.green.map((rec, i) => (
                                    <label key={`g-${i}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="selectedBed"
                                            value={`${rec.roomId}-${rec.bedNumber}`}
                                            checked={formData.selectedBed === `${rec.roomId}-${rec.bedNumber}`}
                                            onChange={(e) => setFormData({ ...formData, selectedBed: e.target.value })}
                                        />
                                        <CheckCircle size={18} color="var(--success)" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '500' }}>Oda {rec.roomId} - Yatak {rec.bedNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.reason}</div>
                                        </div>
                                    </label>
                                ))}

                                {recommendations.yellow.map((rec, i) => (
                                    <label key={`y-${i}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="selectedBed"
                                            value={`${rec.roomId}-${rec.bedNumber}`}
                                            checked={formData.selectedBed === `${rec.roomId}-${rec.bedNumber}`}
                                            onChange={(e) => setFormData({ ...formData, selectedBed: e.target.value })}
                                        />
                                        <AlertTriangle size={18} color="var(--warning)" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '500' }}>Oda {rec.roomId} - Yatak {rec.bedNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>{rec.reason}</div>
                                        </div>
                                    </label>
                                ))}

                                {recommendations.interWardSuggestions?.map((rec, i) => (
                                    <label key={`iw-${i}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="selectedBed"
                                            value={`${rec.roomId}-${rec.bedNumber}`}
                                            checked={formData.selectedBed === `${rec.roomId}-${rec.bedNumber}`}
                                            onChange={(e) => setFormData({ ...formData, selectedBed: e.target.value })}
                                        />
                                        <Info size={18} color="var(--danger)" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '500', color: 'var(--danger)' }}>DİĞER SERVİS: Oda {rec.roomId} - Yatak {rec.bedNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{rec.reason}</div>
                                        </div>
                                    </label>
                                ))}

                                {recommendations.green.length === 0 && recommendations.yellow.length === 0 && (!recommendations.interWardSuggestions || recommendations.interWardSuggestions.length === 0) && (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Uygun yatak bulunamadı. Servisler dolu olabilir.
                                    </div>
                                )}
                            </div>

                            {recommendations.mergeSuggestions.length > 0 && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--accent-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
                                        <Info size={16} /> Gelişmiş Yer Değiştirme Önerisi
                                    </div>
                                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {recommendations.mergeSuggestions.map((merge, i) => (
                                            <li key={i}>{merge.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                        Kaydet
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PatientModal;

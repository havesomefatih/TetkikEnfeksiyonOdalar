import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, X, LoaderCircle, CheckCircle } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

const OCRImporter = ({ isOpen, onClose }) => {
    const { addPatientToRoom, activeWardId } = useHospital();
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [progress, setProgress] = useState(0);
    const [parsedPatients, setParsedPatients] = useState([]);
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        if (isOpen) {
            setImage(null);
            setStatus('idle');
            setParsedPatients([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
            setStatus('idle');
            setParsedPatients([]);
        }
    };

    const optimizeImage = (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max width/height for mobile memory constraints
                const MAX_SIZE = 1600;
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Draw normally
                ctx.drawImage(img, 0, 0, width, height);

                // Optional: basic grayscale/contrast to help OCR
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                    // simple contrast boost
                    const contrast = 1.2;
                    const val = ((avg / 255 - 0.5) * contrast + 0.5) * 255;
                    data[i] = data[i + 1] = data[i + 2] = val;
                }
                ctx.putImageData(imageData, 0, 0);

                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.src = imageUrl;
        });
    };

    const processImage = async () => {
        if (!image) return;
        setStatus('processing');
        setProgress(0);

        try {
            // First step: Shrink and grayscale image so mobile browsers don't run out of memory for Tesseract WebAssembly
            const optimizedImageUrl = await optimizeImage(image);

            const worker = await Tesseract.createWorker('tur+eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(parseInt(m.progress * 100));
                    }
                }
            });

            const { data: { text } } = await worker.recognize(optimizedImageUrl);
            await worker.terminate();

            parseText(text);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const parseText = (text) => {
        const lines = text.split('\n');
        const patients = [];

        // Updated regex to catch cases where there might be no space or weird characters
        const roomRegex = /(30[1-7]|31[1-7]|32[1-9]|33[0-3])\s*[-|._ ]\s*([1-3])/;

        lines.forEach(line => {
            const match = line.match(roomRegex);
            if (match) {
                let namePart = line.substring(0, match.index).trim();
                namePart = namePart.replace(/^[^a-zA-ZğüşıöçĞÜŞİÖÇ]+/, '').trim();

                // If name part is very short or looks like a protocol number, we still want to add it so user can edit it manually
                // Let's reduce the length restriction to 1 and remove numbers completely from namePart to ensure we don't grab protocols
                namePart = namePart.replace(/[0-9]/g, '').trim();

                if (namePart.length > 0) {
                    patients.push({
                        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: namePart,
                        roomId: match[1],
                        bedNumber: parseInt(match[2]),
                        diagnosis: 'Yok',
                        gender: 'Erkek',
                        status: 'pending'
                    });
                }
            }
        });

        // Even if some lines didn't match the regex perfectly, if they have a name but no room, we might miss them.
        // For simplicity, we just allow the user to edit whatever we caught, or they can use "Yeni Hasta" button.

        setParsedPatients(patients);
    };

    const handlePatientEdit = (id, field, value) => {
        setParsedPatients(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handlePatientDelete = (id) => {
        setParsedPatients(prev => prev.filter(p => p.id !== id));
    };

    const saveParsedPatients = () => {
        parsedPatients.forEach(p => {
            const isGirl = ['LINA', 'NEVA', 'GÜLCE', 'RÜBEYDE', 'LÜTFİYE', 'ASEL', 'BUĞLEM', 'ADA', 'ZEHRA', 'KÜBRA', 'ECRİN', 'ÖYKÜ', 'ELA'].some(name => p.name.includes(name));
            p.gender = isGirl ? 'Kız' : 'Erkek';
            p.id = `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            addPatientToRoom(p, p.roomId, p.bedNumber);
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000
        }}>
            <div className="glass-panel animate-fade-in" style={{
                width: '100%', maxWidth: '600px', padding: '2rem',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Fotoğraftan Tablo Oku (OCR)</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {!image ? (
                    <div
                        style={{
                            border: '2px dashed rgba(255,255,255,0.2)',
                            borderRadius: 'var(--radius-lg)', padding: '3rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            backgroundColor: 'rgba(0,0,0,0.1)'
                        }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <Camera size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Hastane sisteminin ekran fotoğrafını seçin</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>İsim soyisim ve oda/yatak sütunları net okunmalı</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        <img src={image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />

                        {status === 'idle' && (
                            <button className="btn btn-primary" onClick={processImage} style={{ width: '100%', justifyContent: 'center' }}>
                                Resmi Tara ve Hastaları Bul
                            </button>
                        )}

                        {status === 'processing' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                <LoaderCircle className="animate-spin" size={24} color="var(--accent-primary)" />
                                <p style={{ fontSize: '0.875rem' }}>Analiz Ediliyor... %{progress}</p>
                                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '4px', transition: 'width 0.2s ease' }} />
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '1rem', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={20} />
                                        <span style={{ fontWeight: '500' }}>Taramada {parsedPatients.length} Hasta Bulundu</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newTempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                            setParsedPatients([...parsedPatients, { id: newTempId, name: 'Yeni Hasta', roomId: '301', bedNumber: 1, diagnosis: 'Yok', gender: 'Erkek' }]);
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        + Manuel Satır Ekle
                                    </button>
                                </div>

                                <div style={{
                                    backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem',
                                    borderRadius: 'var(--radius-md)', maxHeight: '300px', overflowY: 'auto',
                                    display: 'flex', flexDirection: 'column', gap: '0.5rem'
                                }}>
                                    {parsedPatients.map((p, i) => (
                                        <div key={p.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.5rem', borderBottom: i !== parsedPatients.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}>
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(e) => handlePatientEdit(p.id, 'name', e.target.value)}
                                                style={{ flex: 1, padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <input
                                                    type="text"
                                                    value={p.roomId}
                                                    onChange={(e) => handlePatientEdit(p.id, 'roomId', e.target.value)}
                                                    style={{ width: '50px', padding: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-primary)', borderRadius: '4px', fontSize: '0.875rem', textAlign: 'center' }}
                                                />
                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                <input
                                                    type="number"
                                                    value={p.bedNumber}
                                                    min="1" max="3"
                                                    onChange={(e) => handlePatientEdit(p.id, 'bedNumber', parseInt(e.target.value) || 1)}
                                                    style={{ width: '40px', padding: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-primary)', borderRadius: '4px', fontSize: '0.875rem', textAlign: 'center' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handlePatientDelete(p.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {parsedPatients.length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>İsim veya oda eşleşmesi bulunamadı.</p>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStatus('idle')}>
                                        Yeniden Tara
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                        disabled={parsedPatients.length === 0}
                                        onClick={saveParsedPatients}
                                    >
                                        Hepsini Odaya Yerleştir
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default OCRImporter;

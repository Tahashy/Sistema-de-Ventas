// src/modules/caja/components/ModalAbrirCaja.jsx

import React, { useState, useEffect } from 'react';
import { X, DoorOpen, DollarSign } from 'lucide-react';

const ModalAbrirCaja = ({ isOpen, onClose, onConfirm }) => {
    const [montoInicial, setMontoInicial] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMontoInicial('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(montoInicial);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px 16px 0 0'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DoorOpen size={24} color="#10b981" />
                        Abrir Caja (Turno)
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    <form id="abrirCajaForm" onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                                Monto Inicial / Sencillo en Cajón (S/.)
                            </label>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
                                Ingresa el dinero con el que estás empezando tu turno para poder dar vueltos.
                            </p>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={20} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={montoInicial}
                                    onChange={(e) => setMontoInicial(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0 0 16px 16px'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: 'white',
                            color: '#475569',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="abrirCajaForm"
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Confirmar Apertura
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalAbrirCaja;

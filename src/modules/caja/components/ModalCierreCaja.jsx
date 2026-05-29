// src/modules/caja/components/ModalCierreCaja.jsx

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calculator, CreditCard, Smartphone } from 'lucide-react';
import { formatearMoneda } from '../../pedidos/utils/pedidoHelpers';

const ModalCierreCaja = ({ isOpen, onClose, resumen, onConfirm }) => {
    const [montoInicial, setMontoInicial] = useState('');
    const [declaradoEfectivo, setDeclaradoEfectivo] = useState('');
    const [declaradoTarjeta, setDeclaradoTarjeta] = useState('');
    const [declaradoDigital, setDeclaradoDigital] = useState('');
    const [notas, setNotas] = useState('');

    // Diferencias
    const [difEfectivo, setDifEfectivo] = useState(0);
    const [difTarjeta, setDifTarjeta] = useState(0);
    const [difDigital, setDifDigital] = useState(0);

    // Reset fields when opening
    useEffect(() => {
        if (isOpen) {
            setMontoInicial('');
            setDeclaradoEfectivo('');
            setDeclaradoTarjeta('');
            setDeclaradoDigital('');
            setNotas('');
        }
    }, [isOpen]);

    // Calcular diferencias en tiempo real
    useEffect(() => {
        if (resumen) {
            // Sencillo
            const sencillo = parseFloat(montoInicial) || 0;

            // Efectivo (Ventas + Sencillo Inicial)
            const esperadoEfectivo = (resumen.total_efectivo || 0) + sencillo;
            setDifEfectivo((parseFloat(declaradoEfectivo) || 0) - esperadoEfectivo);

            // Tarjeta
            setDifTarjeta((parseFloat(declaradoTarjeta) || 0) - (resumen.total_tarjeta || 0));

            // Digital (Yape + Plin)
            const esperadoDigital = (resumen.total_yape || 0) + (resumen.total_plin || 0);
            setDifDigital((parseFloat(declaradoDigital) || 0) - esperadoDigital);
        }
    }, [montoInicial, declaradoEfectivo, declaradoTarjeta, declaradoDigital, resumen]);

    if (!isOpen || !resumen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(montoInicial, declaradoEfectivo, declaradoTarjeta, declaradoDigital, notas);
    };

    const hayDescuadre = difEfectivo !== 0 || difTarjeta !== 0 || difDigital !== 0;

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
                maxWidth: '600px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px 16px 0 0'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calculator size={24} color="#FF6B35" />
                        Cuadre y Cierre de Caja
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    <form id="cierreCajaForm" onSubmit={handleSubmit}>
                        
                        <div style={{ marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                                ¿Con cuánto Sencillo (Fondo de Caja) empezaste hoy?
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>S/</span>
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
                                        padding: '10px 10px 10px 32px',
                                        borderRadius: '6px',
                                        border: '1px solid #94a3b8',
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                            Por favor, ingresa los montos que has verificado físicamente y en tus reportes.
                        </p>

                        {resumen.total_delivery > 0 && (
                            <div style={{ marginBottom: '20px', padding: '12px', background: '#FEF3C7', borderLeft: '4px solid #F59E0B', borderRadius: '4px' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400E', fontWeight: '600' }}>
                                    ⚠️ Tienes {formatearMoneda(resumen.total_delivery)} acumulados por servicios de Delivery.
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#92400E' }}>
                                    Los montos esperados abajo ya incluyen este dinero recaudado. Deberás separarlo físicamente para pagarle al motorizado.
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            
                            {/* EFECTIVO */}
                            <MethodInput 
                                label="Efectivo Total en Cajón" 
                                icon={DollarSign} 
                                iconColor="#10b981"
                                value={declaradoEfectivo} 
                                onChange={setDeclaradoEfectivo}
                                esperado={(resumen.total_efectivo || 0) + (parseFloat(montoInicial) || 0)}
                                diferencia={difEfectivo}
                                helperText="(Cuenta billetes y monedas)"
                            />

                            {/* TARJETA */}
                            <MethodInput 
                                label="Voucher Tarjeta/POS" 
                                icon={CreditCard} 
                                iconColor="#8b5cf6"
                                value={declaradoTarjeta} 
                                onChange={setDeclaradoTarjeta}
                                esperado={resumen.total_tarjeta || 0}
                                diferencia={difTarjeta}
                            />

                            {/* DIGITAL (YAPE + PLIN) */}
                            <MethodInput 
                                label="Billeteras (Yape/Plin)" 
                                icon={Smartphone} 
                                iconColor="#d946ef"
                                value={declaradoDigital} 
                                onChange={setDeclaradoDigital}
                                esperado={(resumen.total_yape || 0) + (resumen.total_plin || 0)}
                                diferencia={difDigital}
                            />
                        </div>

                        {/* Notas */}
                        <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                                Notas u Observaciones {hayDescuadre && <span style={{ color: '#ef4444' }}>*</span>}
                            </label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                required={hayDescuadre}
                                placeholder={hayDescuadre ? "Por favor explica el motivo del descuadre en algún método..." : "Observaciones opcionales..."}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.95rem',
                                    resize: 'vertical',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                    <button type="button" onClick={onClose} style={{ padding: '10px 16px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>
                        Cancelar
                    </button>
                    <button type="submit" form="cierreCajaForm" style={{ padding: '10px 20px', border: 'none', backgroundColor: '#1e293b', color: 'white', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                        Confirmar Cierre de Turno
                    </button>
                </div>
            </div>
        </div>
    );
};

const MethodInput = ({ label, icon: Icon, iconColor, value, onChange, esperado, diferencia, helperText }) => (
    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
            <Icon size={18} color={iconColor} /> {label}
        </label>
        {helperText && <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#64748b' }}>{helperText}</p>}
        {!helperText && <div style={{ height: '12px', marginBottom: '12px' }}></div>}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: '#64748b' }}>
            <span>Esperado:</span>
            <span style={{ fontWeight: '600' }}>{formatearMoneda(esperado)}</span>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>S/</span>
            <input
                type="number"
                step="0.01"
                min="0"
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0.00"
                style={{
                    width: '100%',
                    padding: '10px 10px 10px 32px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: '500',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
            />
        </div>

        {value !== '' && (
            <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                color: diferencia === 0 ? '#166534' : (diferencia > 0 ? '#1e40af' : '#991b1b')
            }}>
                <span>Dif:</span>
                <span>{diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}</span>
            </div>
        )}
    </div>
);

export default ModalCierreCaja;

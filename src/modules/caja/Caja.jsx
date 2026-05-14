// src/modules/caja/Caja.jsx

import React, { useState } from 'react';
import { useCierreCaja } from './hooks/useCierreCaja';
import ModalCierreCaja from './components/ModalCierreCaja';
import { formatearMoneda, formatearFechaHora } from '../pedidos/utils/pedidoHelpers';
import { useAuth } from '../auth/AuthContext';
import { DollarSign, AlertCircle, Clock, CheckCircle2, TrendingUp, CreditCard, Smartphone, User } from 'lucide-react';
import { showToast } from '../../components/Toast';

const Caja = ({ restauranteId }) => {
    const { user } = useAuth();
    const { 
        loading, 
        ultimoCierre, 
        resumenActual, 
        fechaInicioCalculo, 
        realizarCierre 
    } = useCierreCaja(restauranteId);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleConfirmCierre = async (montoInicialSencillo, declaradoEfectivo, declaradoTarjeta, declaradoDigital, notas) => {
        const { success, error } = await realizarCierre(montoInicialSencillo, declaradoEfectivo, declaradoTarjeta, declaradoDigital, notas);
        if (success) {
            showToast('Cierre de caja registrado exitosamente', 'success');
            setIsModalOpen(false);
        } else {
            showToast(`Error al cerrar caja: ${error}`, 'error');
        }
    };

    if (loading && !resumenActual) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px' }}>
                <p style={{ color: '#64748b' }}>Cargando datos de caja...</p>
            </div>
        );
    }

    const ventasTotales = resumenActual?.total_general || 0;
    const hayVentas = ventasTotales > 0;

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Control de Caja
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={16} />
                            Cajero: {user?.nombre || user?.email || 'Usuario'}
                        </span>
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> 
                        Contando ventas desde: {fechaInicioCalculo ? formatearFechaHora(fechaInicioCalculo) : 'No determinado'}
                    </p>
                </div>
                
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!hayVentas || loading}
                    style={{
                        backgroundColor: !hayVentas ? '#cbd5e0' : '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: !hayVentas || loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}
                >
                    <CheckCircle2 size={20} />
                    {loading ? 'Procesando...' : 'Realizar Cierre de Caja'}
                </button>
            </div>

            {/* Warning if no sales */}
            {!hayVentas && !loading && (
                <div style={{ 
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fde68a', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#b45309'
                }}>
                    <AlertCircle size={24} />
                    <div>
                        <strong>No hay ventas registradas</strong> desde el último cierre. El botón estará habilitado cuando se registre al menos un pedido pagado.
                    </div>
                </div>
            )}

            {/* Stats Dashboard */}
            <h2 style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '16px' }}>Resumen del Turno Actual</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <StatCard 
                    title="Total Ventas" 
                    value={formatearMoneda(resumenActual?.total_general || 0)} 
                    icon={TrendingUp} 
                    color="#3b82f6" 
                    subtitle={`${resumenActual?.num_pedidos || 0} pedidos`}
                />
                <StatCard 
                    title="Ventas Efectivo" 
                    value={formatearMoneda(resumenActual?.total_efectivo || 0)} 
                    icon={DollarSign} 
                    color="#10b981" 
                    subtitle="Cobrado en efectivo"
                />
                <StatCard 
                    title="Tarjetas / POS" 
                    value={formatearMoneda(resumenActual?.total_tarjeta || 0)} 
                    icon={CreditCard} 
                    color="#8b5cf6" 
                />
                <StatCard 
                    title="Yape / Plin" 
                    value={formatearMoneda((resumenActual?.total_yape || 0) + (resumenActual?.total_plin || 0))} 
                    icon={Smartphone} 
                    color="#d946ef" 
                />
            </div>

            {/* Historial (Último cierre) */}
            <h2 style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '16px' }}>Último Cierre Registrado</h2>
            {ultimoCierre ? (
                <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 4px 0' }}>Periodo del Turno</p>
                            <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>
                                {ultimoCierre.fecha_inicio ? formatearFechaHora(ultimoCierre.fecha_inicio) : '-'} a {formatearFechaHora(ultimoCierre.fecha_cierre)}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 4px 0' }}>Ventas Registradas</p>
                            <p style={{ fontWeight: 'bold', color: '#10b981', margin: 0, fontSize: '1.1rem' }}>
                                {formatearMoneda(ultimoCierre.total_general)}
                            </p>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ color: '#64748b', fontSize: '0.9rem', borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '8px' }}>Método</th>
                                    <th style={{ padding: '8px' }}>Esperado (Sistema)</th>
                                    <th style={{ padding: '8px' }}>Declarado (Cajero)</th>
                                    <th style={{ padding: '8px' }}>Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ResumenRow 
                                    label="Efectivo (Inc. Sencillo)" 
                                    esperado={(ultimoCierre.total_efectivo || 0) + (ultimoCierre.monto_inicial || 0)} 
                                    declarado={ultimoCierre.declarado_efectivo || 0} 
                                    diferencia={ultimoCierre.diferencia_efectivo || 0} 
                                />
                                <ResumenRow 
                                    label="Tarjeta / POS" 
                                    esperado={ultimoCierre.total_tarjeta || 0} 
                                    declarado={ultimoCierre.declarado_tarjeta || 0} 
                                    diferencia={ultimoCierre.diferencia_tarjeta || 0} 
                                />
                                <ResumenRow 
                                    label="Billeteras Digitales (Yape/Plin)" 
                                    esperado={(ultimoCierre.total_yape || 0) + (ultimoCierre.total_plin || 0)} 
                                    declarado={ultimoCierre.declarado_digital || 0} 
                                    diferencia={ultimoCierre.diferencia_digital || 0} 
                                />
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
                    No hay cierres de caja previos registrados.
                </div>
            )}

            {/* Modal de Cierre */}
            <ModalCierreCaja 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                resumen={resumenActual}
                onConfirm={handleConfirmCierre}
            />
        </div>
    );
};

const ResumenRow = ({ label, esperado, declarado, diferencia }) => (
    <tr style={{ borderBottom: '1px solid #f8fafc' }}>
        <td style={{ padding: '12px 8px', fontWeight: '500', color: '#334155' }}>{label}</td>
        <td style={{ padding: '12px 8px', color: '#475569' }}>{formatearMoneda(esperado)}</td>
        <td style={{ padding: '12px 8px', fontWeight: '500' }}>{formatearMoneda(declarado)}</td>
        <td style={{ 
            padding: '12px 8px', 
            fontWeight: 'bold',
            color: diferencia < 0 ? '#ef4444' : diferencia > 0 ? '#10b981' : '#64748b'
        }}>
            {diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}
        </td>
    </tr>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
    }}>
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
        }}>
            <Icon size={22} />
        </div>
        <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{title}</p>
            <h3 style={{ margin: '4px 0', fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>{value}</h3>
            {subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{subtitle}</p>}
        </div>
    </div>
);

export default Caja;

import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, ArrowDown, ArrowUp, CheckCircle, AlertCircle, FileText, Search } from 'lucide-react';
import { obtenerHistorialCierres } from '../../../services/cierreCajaService';
import { formatearMoneda, formatearFechaHora, obtenerRangoFechaLimaUTC } from '../../pedidos/utils/pedidoHelpers';
import { showToast } from '../../../components/Toast';
import * as XLSX from 'xlsx';

const HistorialCierres = ({ restauranteId }) => {
    const [cierresOriginales, setCierresOriginales] = useState([]);
    const [cierres, setCierres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cierreExpandido, setCierreExpandido] = useState(null);
    const [busquedaCajero, setBusquedaCajero] = useState('');
    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: ''
    });

    const cargarHistorial = async () => {
        if (!restauranteId) return;
        setLoading(true);
        
        let queryFiltros = { limite: 100 };
        if (filtros.fechaInicio && filtros.fechaFin) {
            queryFiltros.fechaInicio = obtenerRangoFechaLimaUTC(filtros.fechaInicio);
            queryFiltros.fechaFin = obtenerRangoFechaLimaUTC(filtros.fechaFin, true);
        }

        const { data, error } = await obtenerHistorialCierres(restauranteId, queryFiltros);
        if (error) {
            showToast('Error cargando el historial de cierres', 'error');
        } else {
            setCierresOriginales(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        cargarHistorial();
    }, [restauranteId, filtros.fechaInicio, filtros.fechaFin]);

    // Filtrar por cajero localmente
    useEffect(() => {
        if (!busquedaCajero.trim()) {
            setCierres(cierresOriginales);
        } else {
            const term = busquedaCajero.toLowerCase();
            const filtrados = cierresOriginales.filter(c => 
                c.usuarios?.nombre?.toLowerCase().includes(term)
            );
            setCierres(filtrados);
        }
    }, [busquedaCajero, cierresOriginales]);

    const exportarAExcel = () => {
        if (cierres.length === 0) {
            showToast('No hay cierres para exportar', 'warning');
            return;
        }

        const datosExportacion = cierres.map(cierre => ({
            'Fecha Apertura': cierre.fecha_inicio ? new Date(cierre.fecha_inicio).toLocaleString('es-PE') : '-',
            'Fecha Cierre': new Date(cierre.fecha_cierre).toLocaleString('es-PE'),
            'Cajero': cierre.usuarios?.nombre || 'Usuario',
            'Ingresos Brutos': parseFloat(cierre.total_general || 0).toFixed(2),
            'Ventas Netas': parseFloat((cierre.total_general || 0) - (cierre.total_delivery || 0)).toFixed(2),
            'Fondo Delivery': parseFloat(cierre.total_delivery || 0).toFixed(2),
            'Fondo Sencillo Inicial': parseFloat(cierre.monto_inicial || 0).toFixed(2),
            'Efectivo Declarado': parseFloat(cierre.declarado_efectivo || 0).toFixed(2),
            'Tarjeta Declarado': parseFloat(cierre.declarado_tarjeta || 0).toFixed(2),
            'Yape/Plin Declarado': parseFloat(cierre.declarado_digital || 0).toFixed(2),
            'Diferencia Efectivo': parseFloat(cierre.diferencia_efectivo || 0).toFixed(2),
            'Notas de Descuadre': cierre.notas || 'Sin notas',
            'Número Pedidos': cierre.num_pedidos || 0
        }));

        const ws = XLSX.utils.json_to_sheet(datosExportacion);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Historial_Cierres");
        XLSX.writeFile(wb, `Historial_Cierres_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showToast('Historial exportado a Excel', 'success');
    };

    const toggleExpand = (id) => {
        if (cierreExpandido === id) {
            setCierreExpandido(null);
        } else {
            setCierreExpandido(id);
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando historial de cierres...</div>;
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} color="#64748b" /> Últimos Cierres Registrados
                </h2>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    {/* Buscador de Cajero */}
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar cajero..."
                            value={busquedaCajero}
                            onChange={(e) => setBusquedaCajero(e.target.value)}
                            style={{ padding: '8px 8px 8px 36px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem', width: '200px' }}
                        />
                    </div>

                    {/* Filtro de Fechas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="date"
                            value={filtros.fechaInicio}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                        />
                        <span style={{ color: '#94a3b8' }}>-</span>
                        <input
                            type="date"
                            value={filtros.fechaFin}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                        />
                    </div>

                    <button
                    onClick={exportarAExcel}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                    }}
                >
                    <Download size={18} /> Exportar Excel
                    </button>
                </div>
            </div>

            {cierres.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No hay cierres de caja registrados en el sistema.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <tr>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Periodo (Inicio - Cierre)</th>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Ingresos Brutos</th>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Ventas Netas</th>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Pozo Delivery</th>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Cajero</th>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Estado (Descuadre)</th>
                                <th style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cierres.map((cierre) => {
                                const diferenciaTotal = (cierre.diferencia_efectivo || 0) + (cierre.diferencia_tarjeta || 0) + (cierre.diferencia_digital || 0);
                                const isDescuadre = diferenciaTotal !== 0;
                                const isExpanded = cierreExpandido === cierre.id;

                                return (
                                    <React.Fragment key={cierre.id}>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: isExpanded ? '#f8fafc' : 'white' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' }}>
                                                    {formatearFechaHora(cierre.fecha_cierre)}
                                                </div>
                                                {cierre.fecha_inicio && (
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                        Desde: {formatearFechaHora(cierre.fecha_inicio)}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 'bold', color: '#334155' }}>
                                                {formatearMoneda(cierre.total_general)}
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#10b981', fontWeight: '600' }}>
                                                {formatearMoneda((cierre.total_general || 0) - (cierre.total_delivery || 0))}
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#f59e0b', fontWeight: '500' }}>
                                                {formatearMoneda(cierre.total_delivery || 0)}
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>
                                                {cierre.usuarios?.nombre || 'Usuario'}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    backgroundColor: isDescuadre ? '#fef2f2' : '#dcfce7',
                                                    color: isDescuadre ? '#ef4444' : '#166534'
                                                }}>
                                                    {isDescuadre ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                                    {isDescuadre ? `Descuadre: ${diferenciaTotal > 0 ? '+' : ''}${formatearMoneda(diferenciaTotal)}` : 'Cuadre Perfecto'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <button 
                                                    onClick={() => toggleExpand(cierre.id)}
                                                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500' }}
                                                >
                                                    {isExpanded ? 'Ocultar' : 'Ver Detalles'}
                                                    {isExpanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="7" style={{ padding: 0 }}>
                                                    <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                                        
                                                        {/* Desglose de Dinero */}
                                                        <div>
                                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <DollarSign size={16} /> Desglose Físico Declarado
                                                            </h4>
                                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                                                                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                                    <span>Sencillo Inicial:</span> <span>{formatearMoneda(cierre.monto_inicial || 0)}</span>
                                                                </li>
                                                                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                                    <span>Efectivo Declarado:</span> <span style={{ fontWeight: '500' }}>{formatearMoneda(cierre.declarado_efectivo || 0)}</span>
                                                                </li>
                                                                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                                    <span>Tarjeta/POS Declarado:</span> <span style={{ fontWeight: '500' }}>{formatearMoneda(cierre.declarado_tarjeta || 0)}</span>
                                                                </li>
                                                                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                                    <span>Yape/Plin Declarado:</span> <span style={{ fontWeight: '500' }}>{formatearMoneda(cierre.declarado_digital || 0)}</span>
                                                                </li>
                                                            </ul>
                                                        </div>

                                                        {/* Notas y Diferencias */}
                                                        <div>
                                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <FileText size={16} /> Notas del Cajero
                                                            </h4>
                                                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '0.9rem', color: cierre.notas ? '#334155' : '#94a3b8', fontStyle: cierre.notas ? 'normal' : 'italic' }}>
                                                                {cierre.notas || "El cajero no dejó ninguna observación durante este cierre de turno."}
                                                            </div>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistorialCierres;

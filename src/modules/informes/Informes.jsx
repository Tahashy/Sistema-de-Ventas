import React, { useState } from 'react';
import { useInformes } from './hooks/useInformes';
import ResumenVentas from './components/ResumenVentas';
import RankingProductos from './components/RankingProductos';
import { Download, FileText, Calendar } from 'lucide-react';
import { formatearMoneda } from '../pedidos/utils/pedidoHelpers';

const Informes = ({ restauranteId }) => {
    const { data, loading, rango, cambiarRango, fechas, exportarExcel, exportarPDF } = useInformes(restauranteId);
    const [tabActivo, setTabActivo] = useState('ventas'); // ventas, productos, categorias, horarios

    if (!restauranteId) return null;

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>Informes y Reportes</h1>
                    <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>Análisis detallado del rendimiento del restaurante</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={exportarPDF}
                        style={{
                            padding: '10px 16px', background: 'white', border: '1px solid #D1D5DB',
                            borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: '600', color: '#374151'
                        }}>
                        <FileText size={18} /> Exportar PDF
                    </button>
                    <button
                        onClick={exportarExcel}
                        style={{
                            padding: '10px 16px', background: '#FF6B35', border: 'none',
                            borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: '600', color: 'white'
                        }}>
                        <Download size={18} /> Exportar Excel
                    </button>
                </div>
            </div>

            {/* Filtros Fecha */}
            <div style={{ background: 'white', padding: '8px', borderRadius: '12px', display: 'inline-flex', gap: '8px', marginBottom: '32px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {['hoy', 'ayer', 'semana', 'mes', 'ano'].map(r => (
                    <button
                        key={r}
                        onClick={() => cambiarRango(r)}
                        style={{
                            padding: '8px 24px',
                            background: rango === r ? '#FF6B35' : 'transparent',
                            color: rango === r ? 'white' : '#4B5563',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                        }}
                    >
                        {r === 'ano' ? 'Año' : r}
                    </button>
                ))}
            </div>

            {/* Tabs Navegación */}
            <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '32px' }}>
                    {[
                        { id: 'ventas', label: 'Ventas' },
                        { id: 'productos', label: 'Productos' },
                        { id: 'categorias', label: 'Categorías' },
                        { id: 'horarios', label: 'Horarios' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTabActivo(tab.id)}
                            style={{
                                padding: '0 0 16px 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: tabActivo === tab.id ? '2px solid #FF6B35' : '2px solid transparent',
                                color: tabActivo === tab.id ? '#FF6B35' : '#6B7280',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '15px'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Cargando datos...</div>
            ) : (
                <>
                    {/* Vista Resumen (siempre visible en tab Ventas, o parcial en otros) */}
                    {tabActivo === 'ventas' && (
                        <>
                            <ResumenVentas kpis={data.kpis} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
                                <RankingProductos productos={data.rankingProductos} totalVentas={data.kpis.ventasTotales} />
                                {/* Aquí iría el segundo componente grid */}
                            </div>
                        </>
                    )}

                    {tabActivo === 'productos' && (
                        <RankingProductos productos={data.rankingProductos} totalVentas={data.kpis.ventasTotales} />
                    )}

                    {tabActivo === 'categorias' && (
                        // Reutilizando componente visual para categorías, adaptando datos
                        <RankingProductos
                            productos={data.rankingCategorias.map(c => ({ ...c, ingreso: c.ingresos, cantidad: c.pedidos }))} // Adaptador simple
                            totalVentas={data.kpis.ventasTotales}
                        />
                    )}

                    {tabActivo === 'horarios' && (
                        // Placeholder visual usando estructura similar
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px' }}>
                            <h3>Rendimiento por Horario</h3>
                            {data.analisisHorarios.map(h => (
                                <div key={h.hora} style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '12px 0' }}>
                                    <div style={{ width: '60px', fontWeight: 'bold' }}>{h.hora}:00</div>
                                    <div style={{ flex: 1, height: '24px', background: '#F3F4F6', borderRadius: '12px' }}>
                                        <div style={{
                                            width: `${(h.total / (Math.max(...data.analisisHorarios.map(x => x.total)) || 1)) * 100}%`,
                                            height: '100%', background: '#FF6B35', borderRadius: '12px'
                                        }}></div>
                                    </div>
                                    <div style={{ width: '80px', textAlign: 'right' }}>{formatearMoneda(h.total)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Informes;

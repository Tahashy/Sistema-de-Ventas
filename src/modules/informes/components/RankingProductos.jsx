import React from 'react';
import { formatearMoneda } from '../../pedidos/utils/pedidoHelpers';

const RankingProductos = ({ productos, totalVentas }) => {
    // Encontrar maximo para calcular ancho de barras
    const maxIngresos = Math.max(...productos.map(p => p.ingresos), 0);

    return (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Productos Más Vendidos</h3>

            {/* Header Tabla */}
            <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1fr 1fr 1fr', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid #F3F4F6', color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                <div>#</div>
                <div>Producto</div>
                <div>Cantidad</div>
                <div>Ingresos</div>
                <div>Rendimiento</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {productos.map((prod, index) => {
                    const porcentaje = maxIngresos > 0 ? (prod.ingresos / maxIngresos) * 100 : 0;
                    const porcentajeTotal = totalVentas > 0 ? ((prod.ingresos / totalVentas) * 100).toFixed(1) : 0;

                    return (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                            {/* Rank Badge */}
                            <div>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: index < 3 ? '#FF6B35' : '#F3F4F6',
                                    color: index < 3 ? 'white' : '#6B7280',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
                                }}>
                                    #{index + 1}
                                </div>
                            </div>
                            <div style={{ fontWeight: '600', color: '#374151' }}>{prod.nombre}</div>
                            <div style={{ color: '#6B7280' }}>{prod.cantidad} un.</div>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{formatearMoneda(prod.ingresos)}</div>

                            {/* Barra Progreso */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${porcentaje}%`, height: '100%', background: '#FF6B35', borderRadius: '4px' }}></div>
                                </div>
                                {/*<span style={{ fontSize: '12px', color: '#6B7280', width: '40px' }}>{porcentajeTotal}%</span>*/}
                            </div>
                        </div>
                    );
                })}

                {productos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No hay datos disponibles</div>
                )}
            </div>
        </div>
    );
};

export default RankingProductos;

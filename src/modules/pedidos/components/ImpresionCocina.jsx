// src/modules/pedidos/components/ImpresionCocina.jsx

import React from 'react';

const ImpresionCocina = ({ pedido }) => {
    const getTipoLabel = (tipo) => {
        switch (tipo) {
            case 'mesa': return '🪑 MESA';
            case 'llevar': return '📦 PARA LLEVAR';
            case 'delivery': return '🚚 DELIVERY';
            default: return '';
        }
    };

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'monospace',
            maxWidth: '80mm',
            margin: '0 auto'
        }}>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .impresion-cocina,
                    .impresion-cocina * {
                        visibility: visible;
                    }
                    .impresion-cocina {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>

            <div className="impresion-cocina">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px dashed #000', paddingBottom: '10px' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>
                        🍔 COCINA
                    </h1>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0' }}>
                        PEDIDO #{pedido.numero_pedido}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0' }}>
                        {getTipoLabel(pedido.tipo)}
                        {pedido.tipo === 'mesa' && ` ${pedido.numero_mesa}`}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        {new Date(pedido.created_at).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Cliente */}
                {pedido.cliente_nombre && (
                    <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                        <strong>Cliente:</strong> {pedido.cliente_nombre}
                    </div>
                )}

                {/* Productos */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        borderBottom: '2px solid #000',
                        paddingBottom: '5px',
                        marginBottom: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        PRODUCTOS
                    </div>

                    {pedido.pedido_items?.map((item, index) => (
                        <div key={index} style={{ marginBottom: '15px', fontSize: '14px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                marginBottom: '5px'
                            }}>
                                <span>{item.cantidad}x</span>
                                <span style={{ flex: 1, marginLeft: '10px' }}>
                                    {item.producto_nombre}
                                </span>
                            </div>

                            {/* Agregados */}
                            {item.agregados && item.agregados.length > 0 && (
                                <div style={{
                                    marginLeft: '30px',
                                    fontSize: '13px',
                                    fontStyle: 'italic'
                                }}>
                                    {item.agregados.map((agregado, idx) => (
                                        <div key={idx} style={{ marginBottom: '2px' }}>
                                            + {agregado.nombre}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Notas */}
                {pedido.notas && (
                    <div style={{
                        marginTop: '20px',
                        padding: '10px',
                        border: '2px solid #000',
                        borderRadius: '5px',
                        fontSize: '14px'
                    }}>
                        <strong>📝 NOTAS ESPECIALES:</strong>
                        <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>
                            {pedido.notas}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: '30px',
                    textAlign: 'center',
                    borderTop: '2px dashed #000',
                    paddingTop: '10px',
                    fontSize: '12px'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        ¡BUEN TRABAJO! 👨‍🍳
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImpresionCocina;

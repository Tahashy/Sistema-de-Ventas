// src/modules/pedidos/components/ImpresionRecibo.jsx

import React from 'react';

const ImpresionRecibo = ({ pedido }) => {
    const getTipoLabel = (tipo) => {
        switch (tipo) {
            case 'mesa': return 'Mesa';
            case 'llevar': return 'Para Llevar';
            case 'delivery': return 'Delivery';
            default: return '';
        }
    };

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '80mm',
            margin: '0 auto'
        }}>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .impresion-recibo,
                    .impresion-recibo * {
                        visibility: visible;
                    }
                    .impresion-recibo {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>

            <div className="impresion-recibo">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>
                        TAKEMI FAST&FOOD
                    </h1>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Restaurante
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                        ════════════════════
                    </div>
                </div>

                {/* Info del Pedido */}
                <div style={{ marginBottom: '15px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <strong>Pedido:</strong>
                        <span>#{pedido.numero_pedido}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <strong>Tipo:</strong>
                        <span>{getTipoLabel(pedido.tipo)}</span>
                    </div>
                    {pedido.tipo === 'mesa' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <strong>Mesa:</strong>
                            <span>{pedido.numero_mesa}</span>
                        </div>
                    )}
                    {pedido.cliente_nombre && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <strong>Cliente:</strong>
                            <span>{pedido.cliente_nombre}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <strong>Fecha:</strong>
                        <span>
                            {new Date(pedido.created_at).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>
                        ════════════════════
                    </div>
                </div>

                {/* Productos */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        fontSize: '13px'
                    }}>
                        DETALLE DEL PEDIDO
                    </div>

                    {pedido.pedido_items?.map((item, index) => (
                        <div key={index} style={{ marginBottom: '10px', fontSize: '12px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '2px'
                            }}>
                                <span>
                                    {item.cantidad}x {item.producto_nombre}
                                </span>
                                <span style={{ fontWeight: 'bold' }}>
                                    ${(item.precio_unitario * item.cantidad).toFixed(2)}
                                </span>
                            </div>

                            {/* Agregados */}
                            {item.agregados && item.agregados.length > 0 && (
                                <div style={{
                                    marginLeft: '15px',
                                    fontSize: '11px',
                                    color: '#666'
                                }}>
                                    {item.agregados.map((agregado, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '1px'
                                        }}>
                                            <span>+ {agregado.nombre}</span>
                                            <span>${parseFloat(agregado.precio).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Totales */}
                <div style={{
                    borderTop: '1px dashed #000',
                    paddingTop: '10px',
                    marginBottom: '15px',
                    fontSize: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Subtotal:</span>
                        <span>${parseFloat(pedido.subtotal).toFixed(2)}</span>
                    </div>

                    {pedido.taper_adicional && pedido.costo_taper > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span>Taper adicional:</span>
                            <span>${parseFloat(pedido.costo_taper).toFixed(2)}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>IVA (10%):</span>
                        <span>${parseFloat(pedido.iva).toFixed(2)}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '2px solid #000',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>
                        <span>TOTAL:</span>
                        <span>${parseFloat(pedido.total).toFixed(2)}</span>
                    </div>
                </div>

                {/* Método de Pago */}
                <div style={{
                    marginBottom: '15px',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: '5px'
                }}>
                    <strong>Método de Pago:</strong> {pedido.metodo_pago.toUpperCase()}
                </div>

                {/* Notas */}
                {pedido.notas && (
                    <div style={{
                        marginBottom: '15px',
                        fontSize: '11px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                    }}>
                        <strong>Notas:</strong>
                        <div style={{ marginTop: '3px' }}>
                            {pedido.notas}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    marginTop: '20px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #000'
                }}>
                    <div style={{ marginBottom: '5px' }}>
                        ¡Gracias por su preferencia!
                    </div>
                    <div style={{ color: '#666' }}>
                        Vuelva pronto 😊
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImpresionRecibo;

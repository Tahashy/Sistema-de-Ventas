import React, { forwardRef } from 'react';
import { formatearMoneda } from '../utils/pedidoHelpers';

const TicketImpresion = forwardRef(({ pedido, restaurante, tipoImpresion = 'cliente', itemsFiltrados = null }, ref) => {
    if (!pedido || !restaurante) return null;

    // Si itemsFiltrados existe, usamos eso. Si no, usamos todos los items del pedido.
    const itemsParaImprimir = itemsFiltrados || pedido.pedido_items || [];

    const isCocina = tipoImpresion === 'cocina' || tipoImpresion === 'comanda';

    return (
        <div style={{ display: 'none' }}>
            <div ref={ref} className="ticket-print">
                {/* Encabezado */}
                <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed black', paddingBottom: '10px' }}>

                    {/* LOGO */}
                    {!isCocina && restaurante.ticket_config?.show_logo !== false && restaurante.logo_url && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <img
                                src={restaurante.logo_url}
                                alt="Logo"
                                style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    )}

                    <h2 style={{ margin: '0 0 5px 0', fontSize: isCocina ? '24px' : '16px', fontWeight: 'bold' }}>
                        {isCocina ? 'COMANDA COCINA' : (restaurante.nombre || 'Nombre Negocio')}
                    </h2>
                    {!isCocina && (
                        <>
                            <p style={{ margin: 0 }}>{restaurante.direccion || 'Dirección no registrada'}</p>
                            <p style={{ margin: 0 }}>Tel: {restaurante.telefono || '-'}</p>
                            {restaurante.ticket_config?.header_msg && (
                                <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '12px' }}>
                                    {restaurante.ticket_config.header_msg}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Info Pedido */}
                <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: isCocina ? '18px' : '12px', fontWeight: 'bold' }}>
                        Pedido: #{pedido.numero_pedido}
                    </p>
                    <p style={{ margin: '0 0 2px 0' }}>Fecha: {new Date().toLocaleString()}</p>
                    {!isCocina && <p style={{ margin: '0 0 2px 0' }}>Cliente: {pedido.cliente_nombre || 'General'}</p>}
                    <p style={{ margin: '0 0 2px 0' }}>Tipo: {pedido.tipo?.toUpperCase() || pedido.tipo_servicio?.toUpperCase()}</p>

                    {(pedido.numero_mesa || pedido.mesa) && (
                        <div style={{
                            margin: '4px 0',
                            fontSize: isCocina ? '20px' : '14px',
                            fontWeight: 'bold',
                            border: isCocina ? '2px solid black' : 'none',
                            padding: isCocina ? '4px' : '0',
                            textAlign: isCocina ? 'center' : 'left'
                        }}>
                            MESA: {pedido.numero_mesa || pedido.mesa}
                        </div>
                    )}
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '10px 0', marginBottom: '10px' }}>
                    {itemsParaImprimir.length === 0 ? (
                        <p style={{ textAlign: 'center', margin: 0 }}>- Sin items nuevos -</p>
                    ) : (
                        itemsParaImprimir.map((item, index) => (
                            <div key={index} style={{ marginBottom: isCocina ? '16px' : '8px', borderBottom: isCocina ? '1px dotted #ccc' : 'none', paddingBottom: isCocina ? '8px' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{
                                        fontWeight: isCocina ? 'bold' : 'normal',
                                        fontSize: isCocina ? '18px' : '12px',
                                        flex: 1
                                    }}>
                                        {item.cantidad} x {item.producto_nombre || item.nombre}
                                    </span>
                                    {/* Precio solo si NO es cocina */}
                                    {!isCocina && <span style={{ marginLeft: '8px' }}>{formatearMoneda(item.subtotal)}</span>}
                                </div>

                                {item.agregados && item.agregados.length > 0 && (
                                    <div style={{
                                        fontSize: isCocina ? '14px' : '11px',
                                        paddingLeft: '10px',
                                        marginTop: '2px',
                                        fontStyle: 'italic'
                                    }}>
                                        {item.agregados.map(a => `+ ${a.nombre}`).join(', ')}
                                    </div>
                                )}

                                {item.notas && (
                                    <div style={{
                                        fontSize: isCocina ? '16px' : '12px',
                                        fontWeight: 'bold',
                                        padding: '4px',
                                        marginTop: '4px',
                                        background: '#eee',
                                        borderLeft: '4px solid black'
                                    }}>
                                        NOTA: {item.notas}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Totales - Solo si NO es cocina */}
                {!isCocina && (
                    <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 2px 0' }}>Subtotal: {formatearMoneda(pedido.subtotal)}</p>
                        {pedido.descuento > 0 && <p style={{ margin: '0 0 2px 0' }}>Descuento: -{formatearMoneda(pedido.descuento)}</p>}
                        {pedido.cargo_servicio > 0 && <p style={{ margin: '0 0 2px 0' }}>Servicio: +{formatearMoneda(pedido.cargo_servicio)}</p>}
                        {pedido.cargo_embalaje > 0 && <p style={{ margin: '0 0 2px 0' }}>Embalaje: +{formatearMoneda(pedido.cargo_embalaje)}</p>}
                        {pedido.propina > 0 && <p style={{ margin: '0 0 2px 0' }}>Propina: +{formatearMoneda(pedido.propina)}</p>}
                        <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
                            TOTAL: {formatearMoneda(pedido.total)}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                            Método pago: {pedido.metodo_pago ? pedido.metodo_pago.toUpperCase() : '-'}
                        </p>
                        {pedido.vuelto > 0 && <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Vuelto: {formatearMoneda(pedido.vuelto)}</p>}
                    </div>
                )}

                {/* Pie */}
                {/* Pie */}
                <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '20px' }}>
                    <p>
                        {isCocina
                            ? '--- FIN COMANDA ---'
                            : (restaurante.ticket_config?.footer_msg || '¡Gracias por su compra!')}
                    </p>
                </div>
            </div>
        </div>
    );
});

export default TicketImpresion;

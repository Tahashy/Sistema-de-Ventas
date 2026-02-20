import { impresionService } from '../../../services/impresionService';
import { impresorasService } from '../../../services/impresorasService';

const ModalDetallePago = ({ pedido, onClose }) => {
    if (!pedido) return null;

    const [imprimiendo, setImprimiendo] = useState(false);

    const handlePrintCocina = async () => {
        setImprimiendo(true);
        try {
            const impresoras = impresorasService.getImpresorasPorTipo('cocina');
            if (impresoras.length === 0) {
                showToast('No hay impresoras de cocina configuradas', 'warning');
                return;
            }

            const ops = impresionService.formatearComanda(pedido);
            for (const imp of impresoras) {
                await impresionService.enviarAlPlugin(ops, imp.ip);
            }
            showToast('Comanda enviada a cocina', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setImprimiendo(false);
        }
    };

    const handlePrintRecibo = async () => {
        setImprimiendo(true);
        try {
            const impresoras = impresorasService.getImpresorasPorTipo('caja');
            if (impresoras.length === 0) {
                showToast('No hay impresoras de caja configuradas', 'warning');
                return;
            }

            const ops = impresionService.formatearTicket(pedido);
            for (const imp of impresoras) {
                await impresionService.enviarAlPlugin(ops, imp.ip);
            }
            showToast('Recibo impreso', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setImprimiendo(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                            Pedido #{pedido.numero_pedido}
                        </h2>
                        <span style={{
                            fontSize: '0.875rem',
                            color: pedido.estado === 'entregado' ? '#10b981' : '#ef4444',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                        }}>
                            {pedido.estado}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>

                    {/* Info Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <InfoItem icon={Calendar} label="Fecha Finalización" value={formatearFechaHora(pedido.fecha_finalizacion || pedido.created_at)} />
                        <InfoItem icon={User} label="Cliente" value={pedido.cliente_nombre || 'Cliente General'} />
                        <InfoItem icon={ShoppingBag} label="Tipo Servicio" value={pedido.tipo_servicio || 'Mostrador'} />
                        <InfoItem icon={CreditCard} label="Método Pago" value={pedido.metodo_pago} />
                    </div>

                    {/* Items Table */}
                    <div style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: '#f1f5f9' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Cant.</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Producto</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Precio</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedido.pedido_items?.map((item, index) => (
                                    <tr key={item.id || index} style={{ borderTop: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '12px', fontWeight: '600' }}>{item.cantidad}x</td>
                                        <td style={{ padding: '12px' }}>
                                            <div>{item.producto_nombre}</div>
                                            {item.agregados && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {Object.entries(item.agregados).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{formatearMoneda(item.precio_unitario)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{formatearMoneda(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totales Section */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '250px' }}>
                            <ResumenRow label="Subtotal" value={formatearMoneda(pedido.subtotal)} />
                            {parseFloat(pedido.descuento) > 0 && (
                                <ResumenRow label="Descuento" value={`-${formatearMoneda(pedido.descuento)}`} color="#ef4444" />
                            )}
                            {parseFloat(pedido.cargo_servicio) > 0 && (
                                <ResumenRow label="Servicio" value={formatearMoneda(pedido.cargo_servicio)} />
                            )}
                            {parseFloat(pedido.propina) > 0 && (
                                <ResumenRow label="Propina" value={formatearMoneda(pedido.propina)} />
                            )}
                            <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
                                <ResumenRow label="Total Pagado" value={formatearMoneda(pedido.total)} bold size="1.1rem" />
                            </div>
                            {pedido.monto_recibido && (
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                                    Recibido: {formatearMoneda(pedido.monto_recibido)} | Vuelto: {formatearMoneda(pedido.vuelto || 0)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    backgroundColor: '#f8fafc'
                }}>
                    <button
                        onClick={handlePrintCocina}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e0',
                            backgroundColor: 'white',
                            color: '#4a5568',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <Printer size={18} /> Ticket Cocina
                    </button>
                    <button
                        onClick={handlePrintRecibo}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#FF6B35',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(255, 107, 53, 0.3)'
                        }}
                    >
                        <Printer size={18} /> Imprimir Recibo
                    </button>
                </div>
            </div>


            {/* Componente oculto para impresión - REMOVIDO POR QZ TRAY */}
        </div >
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            color: '#64748b'
        }}>
            <Icon size={20} />
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontWeight: '600', color: '#334155' }}>{value || '-'}</div>
        </div>
    </div>
);

const ResumenRow = ({ label, value, bold = false, size = '0.9rem', color = '#334155' }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: size,
        fontWeight: bold ? '700' : '400',
        color: color
    }}>
        <span>{label}</span>
        <span>{value}</span>
    </div>
);

export default ModalDetallePago;

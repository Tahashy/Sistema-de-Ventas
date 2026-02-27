import { impresionService } from '../../../services/impresionService';
import { impresorasService } from '../../../services/impresorasService';
import { formatearFechaHora } from '../utils/pedidoHelpers';

const PanelLateralPedido = ({ pedido, restaurante, onClose, onCambiarEstado, onEditar, onEliminar, isAdmin }) => {
    const isMobile = window.innerWidth < 768;

    const getTipoIcon = (tipo) => {
        const icons = {
            mesa: '🪑',
            llevar: '📦',
            delivery: '🚚'
        };
        return icons[tipo] || '🛒';
    };

    const handleImprimir = async (tipo) => {
        try {
            const tipoImpresion = tipo === 'cocina' ? 'cocina' : 'caja';
            const impresoras = impresorasService.getImpresorasPorTipo(tipoImpresion);

            if (impresoras.length === 0) {
                showToast(`No hay impresoras de ${tipoImpresion} configuradas`, 'warning');
                return;
            }

            const ops = tipo === 'cocina'
                ? impresionService.formatearComanda(pedido)
                : impresionService.formatearTicket(pedido, { empresa: restaurante?.nombre });

            for (const imp of impresoras) {
                await impresionService.enviarAlPlugin(ops, imp.ip);
            }
            showToast('Impresión enviada', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };


    const opcionesImpresion = [
        {
            label: 'Ticket Cocina',
            value: 'cocina',
            icon: PackageIcon,
            color: '#FF6B35'
        },
        {
            label: 'Recibo Completo',
            value: 'cliente',
            icon: Printer,
            color: '#3B82F6'
        }
    ];

    const opcionesEstado = [
        {
            label: 'Pendiente',
            value: 'pendiente',
            icon: Clock,
            color: '#F59E0B'
        },
        {
            label: 'Preparando',
            value: 'preparando',
            icon: AlertCircle,
            color: '#FF6B35'
        },
        {
            label: 'Listo',
            value: 'listo',
            icon: CheckCircle,
            color: '#10B981'
        },
        {
            label: 'Entregado',
            value: 'entregado',
            icon: CheckCircle,
            color: '#6B7280'
        }
    ];

    const subtotal = pedido.pedido_items?.reduce((sum, item) =>
        sum + parseFloat(item.subtotal || 0), 0
    ) || 0;

    return ReactDOM.createPortal(
        <>
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .panel-lateral {
                    animation: slideInRight 0.3s ease-out;
                }

                .panel-overlay {
                    animation: fadeIn 0.3s ease-out;
                }
@media print {
        /* Ocultar todo excepto la vista de impresión */
        body > *:not(.vista-impresion) {
            display: none !important;
        }
        
        .panel-lateral,
        .panel-overlay {
            display: none !important;
        }
        
        /* Mostrar la vista de impresión */
        .vista-impresion {
            display: block !important;
            position: static !important;
            left: auto !important;
        }
        
        .vista-impresion * {
            visibility: visible !important;
        }
    }
                
            `}</style>

            {/* Overlay */}
            <div
                className="panel-overlay"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 999
                }}
            />

            {/* Panel Lateral */}
            <div
                className="panel-lateral"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: isMobile ? '100%' : '450px',
                    background: 'white',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    background: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px'
                    }}>
                        <div style={{ flex: 1 }}>
                            <h2 style={{
                                margin: '0 0 8px 0',
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1a202c'
                            }}>
                                Pedido #{pedido.numero_pedido}
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: getEstadoColor(pedido.estado) + '20',
                                    color: getEstadoColor(pedido.estado),
                                    textTransform: 'capitalize'
                                }}>
                                    {pedido.estado}
                                </span>
                                <span style={{
                                    padding: '6px 12px',
                                    background: '#f7fafc',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#4a5568',
                                    textTransform: 'capitalize'
                                }}>
                                    {getTipoIcon(pedido.tipo)} {pedido.tipo}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#f7fafc',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginLeft: '12px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#f7fafc'}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <DropdownButton
                            label="Imprimir"
                            icon={Printer}
                            variant="secondary"
                            options={opcionesImpresion}
                            onSelect={handleImprimir}
                        />

                        <button
                            onClick={() => {
                                const url = generarLinkWhatsapp(pedido, restaurante);
                                if (url) {
                                    window.open(url, '_blank');
                                } else {
                                    showToast('El pedido no tiene número de teléfono', 'error');
                                }
                            }}
                            title="Enviar resumen detallado por WhatsApp"
                            style={{
                                padding: '10px 16px',
                                background: '#25D366',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(95%)'}
                            onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(100%)'}
                        >
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </span>
                            WhatsApp
                        </button>

                        {pedido.estado !== 'entregado' && pedido.estado !== 'anulado' && (
                            <>
                                <DropdownButton
                                    label="Estado"
                                    icon={AlertCircle}
                                    variant="success"
                                    options={opcionesEstado}
                                    onSelect={(nuevoEstado) => onCambiarEstado(pedido.id, nuevoEstado)}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* BOTÓN DE EDICIÓN PRINCIPAL (UX MEJORADA) */}
                {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                    <div style={{ padding: '0 20px 20px 20px' }}>
                        <button
                            onClick={() => onEditar(pedido)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#FFF7ED',
                                border: '2px dashed #F97316',
                                borderRadius: '12px',
                                color: '#C2410C',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FFEDD5';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFF7ED';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Edit size={20} />
                            ✏️ MODIFICAR / AGREGAR ITEMS
                        </button>
                    </div>
                )}

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {/* Información del Pedido */}
                    <div style={{
                        padding: '16px',
                        background: '#f7fafc',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1a202c'
                        }}>
                            Información del Pedido
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pedido.tipo === 'mesa' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', color: '#718096' }}>Mesa:</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                                        {pedido.numero_mesa}
                                    </span>
                                </div>
                            )}
                            {pedido.cliente_nombre && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', color: '#718096' }}>Cliente:</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                                        {pedido.cliente_nombre}
                                    </span>
                                </div>
                            )}
                            {pedido.direccion_delivery && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', color: '#718096' }}>Dirección:</span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1a202c',
                                        maxWidth: '60%',
                                        textAlign: 'right'
                                    }}>
                                        {pedido.direccion_delivery}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: '#718096' }}>Método de Pago:</span>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1a202c',
                                    textTransform: 'capitalize'
                                }}>
                                    {pedido.metodo_pago}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: '#718096' }}>Hora:</span>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                                    {formatearFechaHora(pedido.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Productos */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1a202c'
                        }}>
                            Productos ({pedido.pedido_items?.length || 0})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pedido.pedido_items?.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '14px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '4px'
                                    }}>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1a202c',
                                            flex: 1
                                        }}>
                                            {item.cantidad}x {item.producto_nombre}
                                        </p>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#FF6B35'
                                        }}>
                                            ${parseFloat(item.subtotal).toFixed(2)}
                                        </p>
                                    </div>
                                    <p style={{
                                        margin: '0 0 4px 0',
                                        fontSize: '13px',
                                        color: '#718096'
                                    }}>
                                        ${parseFloat(item.precio_unitario).toFixed(2)} c/u
                                    </p>
                                    {item.agregados && item.agregados.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            {item.agregados.map((ag, idx) => (
                                                <p key={idx} style={{
                                                    margin: '2px 0',
                                                    fontSize: '12px',
                                                    color: '#10B981',
                                                    fontWeight: '500'
                                                }}>
                                                    + {ag.nombre} (${parseFloat(ag.precio).toFixed(2)})
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notas */}
                    {pedido.notas && (
                        <div style={{
                            padding: '14px',
                            background: '#FFF7ED',
                            border: '1px solid #FDBA74',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#C2410C'
                            }}>
                                📝 Notas del Pedido
                            </h4>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#9A3412',
                                lineHeight: '1.5'
                            }}>
                                {pedido.notas}
                            </p>
                        </div>
                    )}

                    {/* Totales */}
                    <div style={{
                        padding: '16px',
                        background: '#f7fafc',
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            fontSize: '14px'
                        }}>
                            <span style={{ color: '#718096' }}>Subtotal:</span>
                            <span style={{ fontWeight: '600', color: '#4a5568' }}>
                                ${subtotal.toFixed(2)}
                            </span>
                        </div>
                        {pedido.taper_adicional && pedido.costo_taper > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                fontSize: '14px'
                            }}>
                                <span style={{ color: '#718096' }}>Taper(s):</span>
                                <span style={{ fontWeight: '600', color: '#10B981' }}>
                                    ${parseFloat(pedido.costo_taper).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            fontSize: '14px'
                        }}>
                            <span style={{ color: '#718096' }}>IVA (10%):</span>
                            <span style={{ fontWeight: '600', color: '#4a5568' }}>
                                ${parseFloat(pedido.iva || 0).toFixed(2)}
                            </span>
                        </div>

                        {/* Costos Adicionales */}
                        {pedido.descuento > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#EF4444' }}>
                                <span>Descuento:</span>
                                <span>-${parseFloat(pedido.descuento).toFixed(2)}</span>
                            </div>
                        )}
                        {pedido.cargo_servicio > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#718096' }}>Servicio:</span>
                                <span style={{ fontWeight: '600', color: '#4a5568' }}>+${parseFloat(pedido.cargo_servicio).toFixed(2)}</span>
                            </div>
                        )}
                        {pedido.cargo_embalaje > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#718096' }}>Embalaje:</span>
                                <span style={{ fontWeight: '600', color: '#4a5568' }}>+${parseFloat(pedido.cargo_embalaje).toFixed(2)}</span>
                            </div>
                        )}
                        {pedido.propina > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#718096' }}>Propina:</span>
                                <span style={{ fontWeight: '600', color: '#4a5568' }}>+${parseFloat(pedido.propina).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '12px',
                            borderTop: '2px solid #e2e8f0',
                            fontSize: '18px'
                        }}>
                            <span style={{ fontWeight: '700', color: '#1a202c' }}>Total:</span>
                            <span style={{ fontWeight: '700', color: '#FF6B35' }}>
                                ${parseFloat(pedido.total).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    {/* Zona de Peligro */}
                    {(pedido.estado !== 'cancelado' && pedido.estado !== 'entregado' || isAdmin) && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            borderTop: '2px dashed #E5E7EB'
                        }}>
                            <h4 style={{
                                margin: '0 0 12px 0',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                color: '#9CA3AF',
                                letterSpacing: '0.05em'
                            }}>
                                Zona de Riesgo
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {pedido.estado !== 'cancelado' && pedido.estado !== 'entregado' && (
                                    <button
                                        onClick={() => {
                                            onCambiarEstado(pedido.id, 'cancelado');
                                            onClose();
                                        }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #FECACA',
                                            background: '#FEF2F2',
                                            color: '#EF4444',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <AlertCircle size={18} />
                                        Cancelar Pedido
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            onEliminar(pedido.id);
                                            onClose();
                                        }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #FECACA',
                                            background: 'white',
                                            color: '#DC2626',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <X size={18} />
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Vista de Impresión Oculta */}

            <div style={{ display: 'none' }}>
                <TicketImpresion
                    ref={componentRef}
                    pedido={pedido}
                    restaurante={restaurante || { nombre: 'Restaurante', direccion: '', telefono: '' }}
                    tipoImpresion={vistaImpresion}
                />
            </div>
        </>,
        document.body
    );
};

export default PanelLateralPedido;

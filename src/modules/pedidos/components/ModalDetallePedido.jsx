// src/modules/pedidos/components/ModalDetallePedido.jsx

import React from 'react';
import { X, CheckCircle, Utensils, Package, Truck, ShoppingBag } from 'lucide-react';
import { getEstadoColor } from '../utils/pedidoHelpers';

const ModalDetallePedido = ({ pedido, onClose, onCambiarEstado }) => {
  const isMobile = window.innerWidth < 768;

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'mesa': return <Utensils size={20} />;
      case 'llevar': return <Package size={20} />;
      case 'delivery': return <Truck size={20} />;
      default: return <ShoppingBag size={20} />;
    }
  };

  const subtotal = pedido.pedido_items?.reduce((sum, item) =>
    sum + parseFloat(item.subtotal || 0), 0
  ) || 0;

  const siguienteEstado =
    pedido.estado === 'pendiente' ? 'preparando' :
    pedido.estado === 'preparando' ? 'listo' : 'entregado';

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .modal-detalle {
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : '20px',
        overflow: 'auto'
      }}>
        <div className="modal-detalle" style={{
          background: 'white',
          borderRadius: isMobile ? 0 : '20px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '600px',
          maxHeight: isMobile ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? '16px' : '24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                margin: '0 0 4px 0',
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '700',
                color: '#1a202c'
              }}>
                Pedido #{pedido.numero_pedido}
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '8px'
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'capitalize'
                }}>
                  {getTipoIcon(pedido.tipo)}
                  {pedido.tipo}
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
                marginLeft: '12px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px' : '24px'
          }}>
            {/* Información del Cliente */}
            <div style={{
              padding: isMobile ? '16px' : '20px',
              background: '#f7fafc',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: isMobile ? '16px' : '18px',
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
                    {new Date(pedido.created_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {pedido.usuarios?.nombre && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#718096' }}>Atendido por:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                      {pedido.usuarios.nombre}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Productos */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: isMobile ? '16px' : '18px',
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
                      padding: isMobile ? '12px' : '16px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: isMobile ? '14px' : '15px',
                        fontWeight: '600',
                        color: '#1a202c',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.cantidad}x {item.producto_nombre}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#718096'
                      }}>
                        ${parseFloat(item.precio_unitario).toFixed(2)} c/u
                      </p>
                      {item.agregados && item.agregados.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
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
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '700',
                        color: '#FF6B35'
                      }}>
                        ${parseFloat(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tapers Adicionales */}
            {pedido.taper_adicional && pedido.costo_taper > 0 && (
              <div style={{
                padding: isMobile ? '12px' : '16px',
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#166534'
                }}>
                  Tapers Adicionales
                </h4>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  color: '#15803d'
                }}>
                  <span>Taper(s) adicional(es)</span>
                  <span style={{ fontWeight: '700' }}>
                    ${parseFloat(pedido.costo_taper).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notas */}
            {pedido.notas && (
              <div style={{
                padding: isMobile ? '12px' : '16px',
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
                  Notas del Pedido
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
              padding: isMobile ? '16px' : '20px',
              background: '#f7fafc',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: isMobile ? '14px' : '15px'
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
                  fontSize: isMobile ? '14px' : '15px'
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
                marginBottom: '12px',
                fontSize: isMobile ? '14px' : '15px'
              }}>
                <span style={{ color: '#718096' }}>IVA (10%):</span>
                <span style={{ fontWeight: '600', color: '#4a5568' }}>
                  ${parseFloat(pedido.iva || 0).toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '2px solid #e2e8f0',
                fontSize: isMobile ? '18px' : '20px'
              }}>
                <span style={{ fontWeight: '700', color: '#1a202c' }}>Total:</span>
                <span style={{ fontWeight: '700', color: '#FF6B35' }}>
                  ${parseFloat(pedido.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer con Acciones */}
          {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
            <div style={{
              padding: isMobile ? '16px' : '24px',
              borderTop: '1px solid #e2e8f0',
              background: 'white',
              display: 'flex',
              gap: '12px'
            }} className="no-print">
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: isMobile ? '12px' : '14px',
                  background: '#6B7280',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                className="no-print"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: isMobile ? '12px' : '14px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  color: '#4a5568',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  onCambiarEstado(pedido.id, siguienteEstado);
                  onClose();
                }}
                style={{
                  flex: 2,
                  padding: isMobile ? '12px' : '14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <CheckCircle size={18} />
                Marcar como {siguienteEstado}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ModalDetallePedido;
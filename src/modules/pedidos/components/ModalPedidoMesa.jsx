// src/modules/pedidos/components/ModalPedidoMesa.jsx

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Printer, DollarSign, Clock } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { showToast } from '../../../components/Toast';
import { liberarMesa } from '../../../services/mesasService';
import ModalAgregados from './ModalAgregados';
import ConfirmationModal from '../../../components/ConfirmationModal';

const ModalPedidoMesa = ({ mesa, productos, onClose, onSuccess }) => {
    const [pedido, setPedido] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [agregarProductos, setAgregarProductos] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [productoAgregados, setProductoAgregados] = useState(null);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        cargarPedido();
    }, [mesa.id]);

    const cargarPedido = async () => {
        try {
            // Verificar si la mesa tiene un pedido activo
            if (!mesa.pedido_activo_id) {
                showToast('Esta mesa no tiene un pedido activo', 'error');
                onClose();
                return;
            }

            const { data: pedidoData, error: pedidoError } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id', mesa.pedido_activo_id)
                .single();

            if (pedidoError) throw pedidoError;

            const { data: itemsData, error: itemsError } = await supabase
                .from('pedido_items')
                .select('*')
                .eq('pedido_id', pedidoData.id);

            if (itemsError) throw itemsError;

            setPedido(pedidoData);
            setItems(itemsData);
        } catch (error) {
            console.error('Error cargando pedido:', error);
            showToast('Error cargando pedido', 'error');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const agregarProductoAlPedido = async (producto, agregadosSeleccionados = []) => {
        try {
            const precioTotal = parseFloat(producto.precio) +
                agregadosSeleccionados.reduce((sum, ag) => sum + parseFloat(ag.precio), 0);

            const { error } = await supabase
                .from('pedido_items')
                .insert([{
                    pedido_id: pedido.id,
                    producto_id: producto.id,
                    producto_nombre: producto.nombre,
                    cantidad: 1,
                    precio_unitario: precioTotal,
                    agregados: agregadosSeleccionados,
                    subtotal: precioTotal
                }]);

            if (error) throw error;

            // Recalcular totales
            await recalcularTotales();
            showToast('Producto agregado', 'success');
            setProductoAgregados(null);
        } catch (error) {
            console.error('Error agregando producto:', error);
            showToast('Error agregando producto', 'error');
        }
    };

    const recalcularTotales = async () => {
        const { data: itemsActualizados } = await supabase
            .from('pedido_items')
            .select('*')
            .eq('pedido_id', pedido.id);

        const subtotal = itemsActualizados.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const iva = subtotal * 0.10;
        const total = subtotal + iva;

        await supabase
            .from('pedidos')
            .update({ subtotal, iva, total })
            .eq('id', pedido.id);

        setPedido({ ...pedido, subtotal, iva, total });
        setItems(itemsActualizados);
    };

    const ejecutarCierreCuenta = async () => {
        try {
            // Actualizar estado del pedido y datos de pago
            await supabase
                .from('pedidos')
                .update({
                    estado: 'entregado',
                    metodo_pago: metodoPago,
                    fecha_finalizacion: new Date().toISOString(),
                })
                .eq('id', pedido.id);

            // Liberar la mesa
            await liberarMesa(mesa.id);

            showToast('Cuenta cerrada exitosamente', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error cerrando cuenta:', error);
            showToast('Error cerrando cuenta', 'error');
        }
    };

    const cerrarCuenta = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Cerrar Cuenta',
            message: '¿Estás seguro de cerrar la cuenta de esta mesa? Se marcará como entregado y liberará la mesa.',
            type: 'warning',
            onConfirm: ejecutarCierreCuenta
        });
    };

    const imprimirCuenta = () => {
        window.print();
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const calcularTiempoTranscurrido = () => {
        if (!mesa.hora_inicio) return '';
        const inicio = new Date(mesa.hora_inicio);
        const ahora = new Date();
        const diff = Math.floor((ahora - inicio) / 1000 / 60);

        if (diff < 60) return `${diff} minutos`;
        const horas = Math.floor(diff / 60);
        const minutos = diff % 60;
        return `${horas}h ${minutos}m`;
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px' }}>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'center', zIndex: 1000,
                padding: isMobile ? 0 : '20px', overflow: 'auto'
            }} className="modal-pedido-mesa-container">
                <div style={{
                    background: 'white',
                    borderRadius: isMobile ? 0 : '20px',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '800px',
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
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{
                                margin: '0 0 4px 0',
                                fontSize: isMobile ? '20px' : '24px',
                                fontWeight: '700',
                                color: '#1a202c'
                            }}>
                                {mesa.numero_mesa}
                            </h2>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#718096' }}>
                                {mesa.mesero && (
                                    <span>👤 {mesa.mesero.nombre}</span>
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} />
                                    {calcularTiempoTranscurrido()}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            border: 'none', background: '#f7fafc', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
                        {!agregarProductos ? (
                            <>
                                {/* Lista de productos del pedido */}
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1a202c'
                                }}>
                                    Productos Ordenados
                                </h3>

                                <div style={{ marginBottom: '24px' }}>
                                    {items.map((item, index) => (
                                        <div key={index} style={{
                                            padding: '12px',
                                            background: '#f7fafc',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={{
                                                    margin: '0 0 4px 0',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: '#1a202c'
                                                }}>
                                                    {item.cantidad}x {item.producto_nombre}
                                                </p>
                                                {item.agregados && item.agregados.length > 0 && (
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '12px',
                                                        color: '#10B981'
                                                    }}>
                                                        + {item.agregados.map(a => a.nombre).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                color: '#FF6B35'
                                            }}>
                                                ${parseFloat(item.subtotal).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totales */}
                                <div style={{
                                    padding: '16px',
                                    background: '#f7fafc',
                                    borderRadius: '12px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px',
                                        fontSize: '14px'
                                    }}>
                                        <span style={{ color: '#718096' }}>Subtotal:</span>
                                        <span style={{ fontWeight: '600' }}>${parseFloat(pedido.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <span style={{ color: '#718096' }}>IVA (10%):</span>
                                        <span style={{ fontWeight: '600' }}>${parseFloat(pedido.iva).toFixed(2)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        paddingTop: '12px',
                                        borderTop: '2px solid #e2e8f0',
                                        fontSize: '18px'
                                    }}>
                                        <span style={{ fontWeight: '700', color: '#1a202c' }}>TOTAL:</span>
                                        <span style={{ fontWeight: '700', color: '#FF6B35' }}>
                                            ${parseFloat(pedido.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Agregar productos */}
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1a202c'
                                }}>
                                    Agregar Productos
                                </h3>

                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        marginBottom: '16px',
                                        boxSizing: 'border-box'
                                    }}
                                />

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                    gap: '12px'
                                }}>
                                    {productosFiltrados.map(producto => (
                                        <div
                                            key={producto.id}
                                            onClick={() => {
                                                if (producto.agregados && producto.agregados.length > 0) {
                                                    setProductoAgregados(producto);
                                                } else {
                                                    agregarProductoAlPedido(producto, []);
                                                }
                                            }}
                                            style={{
                                                padding: '12px',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <div>
                                                <p style={{
                                                    margin: '0 0 4px 0',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: '#1a202c'
                                                }}>
                                                    {producto.nombre}
                                                </p>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '15px',
                                                    fontWeight: '700',
                                                    color: '#FF6B35'
                                                }}>
                                                    ${parseFloat(producto.precio).toFixed(2)}
                                                </p>
                                            </div>
                                            <Plus size={20} style={{ color: '#10B981' }} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer con Pago */}
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {!agregarProductos && (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '8px', display: 'block' }}>Método de Pago:</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                    {['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'].map(metodo => (
                                        <button
                                            key={metodo}
                                            onClick={() => setMetodoPago(metodo)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '20px', border: 'none',
                                                backgroundColor: metodoPago === metodo ? '#1F2937' : '#E2E8F0',
                                                color: metodoPago === metodo ? 'white' : '#4A5568',
                                                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {metodo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setAgregarProductos(!agregarProductos)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: agregarProductos ? '#f7fafc' : '#10B981',
                                    border: agregarProductos ? '2px solid #e2e8f0' : 'none',
                                    borderRadius: '10px',
                                    color: agregarProductos ? '#4a5568' : 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {agregarProductos ? <X size={18} /> : <Plus size={18} />}
                                {agregarProductos ? 'Cancelar' : 'Agregar Productos'}
                            </button>
                            {!agregarProductos && (
                                <>
                                    <button
                                        onClick={imprimirCuenta}
                                        className="no-print"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#3B82F6',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                                        }}
                                    >
                                        <Printer size={18} />
                                        Imprimir
                                    </button>
                                    <button
                                        onClick={cerrarCuenta}
                                        className="no-print"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 12px rgba(255,107,53,0.3)'
                                        }}
                                    >
                                        <DollarSign size={18} />
                                        Cerrar Cuenta
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Agregados */}
            {productoAgregados && (
                <ModalAgregados
                    producto={productoAgregados}
                    onClose={() => setProductoAgregados(null)}
                    onConfirmar={(agregados) => agregarProductoAlPedido(productoAgregados, agregados)}
                />
            )}

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .modal-pedido-mesa-container, .modal-pedido-mesa-container * {
                        visibility: visible;
                    }
                    .modal-pedido-mesa-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="Cerrar Cuenta"
            />
        </>
    );
};

export default ModalPedidoMesa;

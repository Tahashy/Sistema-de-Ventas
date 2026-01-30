// src/modules/pedidos/Pedidos.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingBag, Grid3x3, List } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { showToast } from '../../components/Toast';
import useWindowSize from '../../hooks/useWindowSize';

// Componentes
import StatCard from './components/StatCard';
import PedidoCard from './components/PedidoCard';
import PedidoRow from './components/PedidoRow';
import ModalNuevoPedido from './components/ModalNuevoPedido';
import PanelLateralPedido from './components/PanelLateralPedido';
// import ModalEditarPedido from './components/ModalEditarPedido';
import VistaMesas from './components/VistaMesas';
import ModalPedidoMesa from './components/ModalPedidoMesa';
import TicketImpresion from './components/TicketImpresion';
import { useRef } from 'react';

// Hook personalizado
import { usePedidos } from './hooks/usePedidos';
import ConfirmationModal from '../../components/ConfirmationModal';

const thStyle = {
    padding: '16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '2px solid #e2e8f0'
};

const Pedidos = ({ restauranteId, restaurante, isAdmin, userId, openNewOrderModal, setOpenNewOrderModal }) => {
    const { pedidos, loading, cargarPedidos, cambiarEstadoPedido: cambiarEstadoHook, eliminarPedido: eliminarHook, togglePago } = usePedidos(restauranteId);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    const eliminarPedido = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Pedido',
            message: '¿Estás seguro de eliminar este pedido permanentemente? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => eliminarHook(id)
        });
    };

    const cambiarEstadoPedido = (id, nuevoEstado) => {
        if (nuevoEstado === 'anulado') {
            setConfirmModal({
                isOpen: true,
                title: 'Anular Pedido',
                message: '¿Estás seguro de anular este pedido?',
                type: 'warning',
                onConfirm: () => cambiarEstadoHook(id, nuevoEstado)
            });
        } else {
            cambiarEstadoHook(id, nuevoEstado);
        }
    };
    const { isMobile } = useWindowSize();

    const [productos, setProductos] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [pedidoAEditar, setPedidoAEditar] = useState(null);
    const [vistaActiva, setVistaActiva] = useState(() => localStorage.getItem('vistaActivaPedidos') || 'mesas');

    useEffect(() => {
        localStorage.setItem('vistaActivaPedidos', vistaActiva);
    }, [vistaActiva]);
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
    const [mostrarModalPedidoMesa, setMostrarModalPedidoMesa] = useState(false);
    const [mesaParaNuevoPedido, setMesaParaNuevoPedido] = useState(null);

    const [updateKey, setUpdateKey] = useState(0);

    // Estado para impresión
    const [pedidoImprimir, setPedidoImprimir] = useState(null);
    const componentRef = useRef();

    const handleImprimir = (pedido) => {
        setPedidoImprimir(pedido);
        // Esperar a que el estado se actualice y el componente se renderice
        setTimeout(() => {
            if (componentRef.current) {
                const printContent = componentRef.current.innerHTML;
                const windowUrl = 'about:blank';
                const uniqueName = new Date();
                const windowName = 'Print' + uniqueName.getTime();
                const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

                if (printWindow) {
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.focus();

                    // Necesario para que carguen los estilos/imágenes si los hubiera
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                        setPedidoImprimir(null); // Limpiar después de imprimir
                    }, 250);
                } else {
                    showToast('Permite los pop-ups para imprimir', 'warning');
                }
            }
        }, 100);
    };

    const handleSuccess = () => {
        cargarPedidos();
        setUpdateKey(prev => prev + 1);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        cargarProductos();
    }, [restauranteId]);

    // Check if we should auto-open the new order modal (from Navbar button)
    useEffect(() => {
        if (openNewOrderModal) {
            setMostrarModalNuevo(true);
            setOpenNewOrderModal(false); // Reset the flag
        }
    }, [openNewOrderModal, setOpenNewOrderModal]);

    const cargarProductos = async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*, categorias(nombre)')
                .eq('restaurante_id', restauranteId)
                .eq('disponible', true)
                .order('nombre');

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    const editarPedido = (pedido) => {
        // Verificar que el pedido sea editable
        if (['entregado', 'cancelado', 'anulado'].includes(pedido.estado)) {
            showToast('No se puede editar un pedido finalizado', 'error');
            return;
        }

        setPedidoAEditar(pedido);
        setMostrarModalEditar(true);
    };

    const handleMesaClick = (mesa) => {
        if (mesa.estado === 'ocupada') {
            // Abrir modal de pedido activo
            setMesaSeleccionada(mesa);
            setMostrarModalPedidoMesa(true);
        } else {
            // Abrir modal para crear nuevo pedido
            setMesaParaNuevoPedido(mesa);
            setMostrarModalNuevo(true);
        }
    };

    const handleOrdenSinMesa = () => {
        setMesaParaNuevoPedido(null);
        setMostrarModalNuevo(true);
    };

    const pedidosFiltrados = pedidos.filter(p => {
        const matchSearch =
            p.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.numero_mesa?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
        return matchSearch && matchEstado;
    });

    const estadisticas = {
        total: pedidos.length,
        pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
        preparando: pedidos.filter(p => p.estado === 'preparando').length,
        listos: pedidos.filter(p => p.estado === 'listo').length,
    };

    return (
        <>
            <style>{`
        @media print {
          * {
            visibility: hidden;
          }
          .modal-detalle {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .modal-detalle,
          .modal-detalle * {
            visibility: visible;
          }
          .no-print,
          .modal-detalle button {
            display: none !important;
          }
          @page {
            size: letter;
            margin: 15mm;
          }
        }
        @media (max-width: 768px) {
          .modal-detalle {
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

            <div style={{ padding: isMobile ? '16px' : '32px' }}>
                {/* Header */}
                <div className="pedidos-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '16px'
                }}>
                    <div>
                        <h1 style={{
                            margin: '0 0 8px 0',
                            fontSize: isMobile ? '24px' : '32px',
                            fontWeight: '700',
                            color: '#1a202c'
                        }}>
                            Gestión de Pedidos
                        </h1>
                        <p style={{
                            margin: 0,
                            fontSize: isMobile ? '14px' : '16px',
                            color: '#718096'
                        }}>
                            Administra las órdenes del restaurante
                        </p>
                    </div>
                    <button
                        onClick={() => setMostrarModalNuevo(true)}
                        style={{
                            padding: isMobile ? '10px 16px' : '12px 24px',
                            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Plus size={18} />
                        {isMobile ? 'Nuevo' : 'Nuevo Pedido'}
                    </button>
                </div>

                {/* Pestañas */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    background: '#f7fafc',
                    padding: '6px',
                    borderRadius: '10px',
                    width: 'fit-content'
                }}>
                    <button
                        onClick={() => setVistaActiva('mesas')}
                        style={{
                            padding: '10px 20px',
                            background: vistaActiva === 'mesas' ? '#FF6B35' : 'transparent',
                            color: vistaActiva === 'mesas' ? 'white' : '#718096',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Grid3x3 size={18} />
                        Mesas
                    </button>
                    <button
                        onClick={() => setVistaActiva('pedidos')}
                        style={{
                            padding: '10px 20px',
                            background: vistaActiva === 'pedidos' ? '#FF6B35' : 'transparent',
                            color: vistaActiva === 'pedidos' ? 'white' : '#718096',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <List size={18} />
                        Lista de Pedidos
                    </button>
                </div>


                {/* Contenido según vista activa */}
                {vistaActiva === 'mesas' ? (
                    <VistaMesas
                        key={updateKey} // Force reload when key changes
                        restauranteId={restauranteId}
                        onMesaClick={handleMesaClick}
                        onOrdenSinMesa={handleOrdenSinMesa}
                    />
                ) : (
                    <>
                        {/* Modales */}
                        {
                            mostrarModalNuevo && (
                                <ModalNuevoPedido
                                    restauranteId={restauranteId}
                                    restaurante={restaurante}
                                    userId={userId}
                                    productos={productos}
                                    mesa={mesaParaNuevoPedido}
                                    onClose={() => {
                                        setMostrarModalNuevo(false);
                                        setMesaParaNuevoPedido(null);
                                    }}
                                    onSuccess={() => {
                                        handleSuccess();
                                        setMostrarModalNuevo(false);
                                        setMesaParaNuevoPedido(null);
                                    }}
                                />
                            )
                        }

                        {/* Modal Pedido de Mesa */}
                        {mostrarModalPedidoMesa && mesaSeleccionada && (
                            <ModalPedidoMesa
                                mesa={mesaSeleccionada}
                                productos={productos}
                                onClose={() => {
                                    setMostrarModalPedidoMesa(false);
                                    setMesaSeleccionada(null);
                                }}
                                onSuccess={() => {
                                    handleSuccess();
                                    setMostrarModalPedidoMesa(false);
                                    setMesaSeleccionada(null);
                                }}
                            />
                        )}

                        {/* Estadísticas */}
                        <div className="stats-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: isMobile ? '12px' : '20px',
                            marginBottom: '24px'
                        }}>
                            <StatCard title="Total" value={estadisticas.total} color="#3B82F6" />
                            <StatCard title="Pendientes" value={estadisticas.pendientes} color="#F59E0B" />
                            <StatCard title="Preparando" value={estadisticas.preparando} color="#FF6B35" />
                            <StatCard title="Listos" value={estadisticas.listos} color="#10B981" />
                        </div>

                        {/* Filtros */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search
                                    size={20}
                                    style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#a0aec0'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div className="filtros-estado" style={{
                                display: 'flex',
                                gap: '8px',
                                background: '#f7fafc',
                                padding: '6px',
                                borderRadius: '10px'
                            }}>
                                {['todos', 'pendiente', 'preparando', 'listo', 'entregado'].map(estado => (
                                    <button
                                        key={estado}
                                        onClick={() => setFiltroEstado(estado)}
                                        style={{
                                            padding: '8px 12px',
                                            background: filtroEstado === estado ? '#FF6B35' : 'transparent',
                                            color: filtroEstado === estado ? 'white' : '#718096',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textTransform: 'capitalize',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {estado === 'todos' ? 'Todos' : estado}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Lista de Pedidos */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
                                Cargando pedidos...
                            </div>
                        ) : pedidosFiltrados.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                background: 'white',
                                borderRadius: '16px',
                                border: '2px dashed #e2e8f0'
                            }}>
                                <ShoppingBag size={48} color="#cbd5e0" style={{ marginBottom: '16px' }} />
                                <p style={{ color: '#718096', fontSize: '16px', margin: 0 }}>
                                    No hay pedidos
                                </p>
                            </div>
                        ) : isMobile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {pedidosFiltrados.map(pedido => (
                                    <PedidoCard
                                        key={pedido.id}
                                        pedido={pedido}
                                        now={now}
                                        onCambiarEstado={cambiarEstadoPedido}
                                        onVerDetalle={(p) => {
                                            setPedidoSeleccionado(p);
                                            setMostrarDetalle(true);
                                        }}
                                        onEditar={editarPedido}
                                        onEliminar={eliminarPedido}
                                        onImprimir={handleImprimir}
                                        isAdmin={isAdmin}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden'
                            }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                        <thead style={{ background: '#f7fafc' }}>
                                            <tr>
                                                <th style={thStyle}>Pedido</th>
                                                <th style={thStyle}>Tipo</th>
                                                <th style={thStyle}>Cliente/Mesa</th>
                                                <th style={thStyle}>Método</th>
                                                <th style={thStyle}>Pago</th>
                                                <th style={thStyle}>Total</th>
                                                <th style={thStyle}>Estado</th>
                                                <th style={thStyle}>Hora</th>
                                                <th style={thStyle}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pedidosFiltrados.map(pedido => (
                                                <PedidoRow
                                                    key={pedido.id}
                                                    pedido={pedido}
                                                    now={now}
                                                    onCambiarEstado={cambiarEstadoPedido}
                                                    onVerDetalle={(p) => {
                                                        setPedidoSeleccionado(p);
                                                        setMostrarDetalle(true);
                                                    }}
                                                    onEliminar={eliminarPedido}
                                                    onEditar={editarPedido}
                                                    onImprimir={handleImprimir}
                                                    onTogglePago={togglePago}
                                                    isAdmin={isAdmin}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Modales */}
                {mostrarModalNuevo && (
                    <ModalNuevoPedido
                        restauranteId={restauranteId}
                        userId={userId}
                        productos={productos}
                        mesa={mesaParaNuevoPedido}
                        onClose={() => {
                            setMostrarModalNuevo(false);
                            setMesaParaNuevoPedido(null);
                        }}
                        onSuccess={() => {
                            cargarPedidos();
                            setMostrarModalNuevo(false);
                            setMesaParaNuevoPedido(null);
                        }}
                    />
                )}

                {mostrarDetalle && pedidoSeleccionado && (
                    <PanelLateralPedido
                        pedido={pedidoSeleccionado}
                        restaurante={restaurante}
                        onClose={() => {
                            setMostrarDetalle(false);
                            setPedidoSeleccionado(null);
                        }}
                        onCambiarEstado={cambiarEstadoPedido}
                        onEliminar={eliminarPedido}
                        isAdmin={isAdmin}
                        onEditar={(pedido) => {
                            setMostrarDetalle(false);
                            editarPedido(pedido);
                        }}
                    />
                )}
                {mostrarModalEditar && pedidoAEditar && (
                    <ModalNuevoPedido
                        restauranteId={restauranteId}
                        restaurante={restaurante}
                        userId={userId}
                        productos={productos}
                        pedidoAEditar={pedidoAEditar}
                        onClose={() => {
                            setMostrarModalEditar(false);
                            setPedidoAEditar(null);
                        }}
                        onSuccess={() => {
                            cargarPedidos();
                            setMostrarModalEditar(false);
                            setPedidoAEditar(null);
                        }}
                    />
                )}

                {/* Modal Pedido de Mesa */}
                {mostrarModalPedidoMesa && mesaSeleccionada && (
                    <ModalPedidoMesa
                        mesa={mesaSeleccionada}
                        productos={productos}
                        onClose={() => {
                            setMostrarModalPedidoMesa(false);
                            setMesaSeleccionada(null);
                        }}
                        onSuccess={() => {
                            cargarPedidos();
                            setMostrarModalPedidoMesa(false);
                            setMesaSeleccionada(null);
                        }}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            {/* Componente oculto para impresión */}
            <TicketImpresion
                ref={componentRef}
                pedido={pedidoImprimir}
                restaurante={{
                    nombre: 'Mi Restaurante', // Fallback si no llega prop
                    direccion: 'Dirección Principal 123',
                    telefono: '999-999-999',
                    ...restauranteId // Si restauranteId fuera objeto, pero en App pasamos `restaurante`.
                    // Mejor usar la prop `restaurante` que añadimos a Pedidos
                }}
            />
        </>
    );
};

export default Pedidos;
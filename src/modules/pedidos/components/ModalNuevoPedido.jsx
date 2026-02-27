// src/modules/pedidos/components/ModalNuevoPedido.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, X, Plus, Minus, Trash2, User, Phone, MapPin,
    CreditCard, DollarSign, ChefHat, ShoppingBag, Truck, Edit, Printer, Check,
    CheckCircle, MessageCircle
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { showToast } from '../../../components/Toast';
import { generarNumeroPedido, formatearMoneda, generarLinkWhatsapp } from '../utils/pedidoHelpers';
import ModalPersonalizarProducto from './ModalPersonalizarProducto';
import TicketImpresion from './TicketImpresion';
import VistaMesasSelector from './VistaMesasSelector';
import { ocuparMesa } from '../../../services/mesasService';
import { obtenerSiguienteCorrelativo } from '../../../services/pedidosService';
import useWindowSize from '../../../hooks/useWindowSize';
import useImpresora from '../../../hooks/useImpresora';
import SelectorUbicacion from './SelectorUbicacion';

// Placeholder for printing components (to be implemented/integrated)
const PrintButton = ({ onClick, label, color = '#3B82F6' }) => (
    <button
        onClick={onClick}
        style={{
            padding: '10px 16px', borderRadius: '10px', border: 'none',
            backgroundColor: color, color: 'white', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px'
        }}
    >
        <Printer size={16} /> {label}
    </button>
);

const ModalNuevoPedido = ({ restauranteId, restaurante = { nombre: 'Restaurante', direccion: '', telefono: '' }, userId, productos, onClose, onSuccess, mesa = null, pedidoAEditar = null }) => {
    // Mode
    const isEditing = !!pedidoAEditar;

    // Estados principales
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todo');
    const [productoAPersonalizar, setProductoAPersonalizar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(isEditing);

    // Mapa state
    const [mostrarMapa, setMostrarMapa] = useState(false);

    // Estado confirmación post-creación
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

    // Datos del pedido
    const [tipoPedido, setTipoPedido] = useState(mesa ? 'mesa' : 'mostrador');
    const [cliente, setCliente] = useState({ nombre: '', telefono: '', direccion: '' });
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [mesaSeleccionada, setMesaSeleccionada] = useState(mesa); // Mesa seleccionada actual
    const [mostrarSelectorMesa, setMostrarSelectorMesa] = useState(false);

    // Valores monetarios adicionales
    const [descuento, setDescuento] = useState(0);
    const [propina, setPropina] = useState(0);
    const [servicio, setServicio] = useState(0);
    const [embalaje, setEmbalaje] = useState(0);
    const [montoRecibido] = useState('');

    const [itemsOriginales, setItemsOriginales] = useState([]);

    // Print State
    const ticketRef = useRef();
    const { imprimir, imprimiendo } = useImpresora();
    const [printConfig, setPrintConfig] = useState({ tipo: 'cliente', items: null });

    const { isMobile } = useWindowSize();
    // En mobile inicia oculto (false), en escritorio visible (true)
    const [showCart, setShowCart] = useState(false);

    useEffect(() => {
        if (!isMobile) setShowCart(true);
    }, [isMobile]);

    // Cargar datos si es edición
    useEffect(() => {
        if (isEditing) {
            cargarDatosEdicion();
        }
    }, [pedidoAEditar]);

    const cargarDatosEdicion = async () => {
        try {
            // Cargar items
            const { data: items, error } = await supabase
                .from('pedido_items')
                .select('*')
                .eq('pedido_id', pedidoAEditar.id);

            if (error) throw error;

            // Formatear items para el carrito
            const cartItems = items.map(item => ({
                ...item,
                uniqueId: item.id || Date.now() + Math.random(), // ID estable o nuevo
                id: item.producto_id,
                nombre: item.producto_nombre,
                precio: item.precio_unitario // Asumimos precio base unitario guardado o derivado
            }));

            setCarrito(cartItems);
            setItemsOriginales(cartItems.map(i => i.uniqueId)); // Snapshot IDs

            // Cargar datos cabecera
            setCliente({
                nombre: pedidoAEditar.cliente_nombre || '',
                telefono: pedidoAEditar.cliente_celular || '',
                direccion: pedidoAEditar.direccion_delivery || ''
            });
            setTipoPedido(pedidoAEditar.tipo_servicio || 'mostrador');
            setMetodoPago(pedidoAEditar.metodo_pago || 'efectivo');
            setDescuento(pedidoAEditar.descuento || 0);
            setPropina(pedidoAEditar.propina || 0);
            setServicio(pedidoAEditar.cargo_servicio || 0);
            setEmbalaje(pedidoAEditar.cargo_embalaje || 0);

            // Si tiene mesa
            if (pedidoAEditar.numero_mesa) {
                setTipoPedido('mesa');
                // Podríamos buscar la mesa real por número si necesitamos el objeto ID, 
                // pero por ahora mostraremos el número
                // setMesaSeleccionada({ numero_mesa: pedidoAEditar.numero_mesa });
            }

        } catch (error) {
            console.error('Error cargando pedido:', error);
            showToast('Error cargando detalles del pedido', 'error');
        } finally {
            setInitLoading(false);
        }
    };

    // Categorías únicas
    const categorias = useMemo(() => {
        const cats = new Set(productos.map(p => p.categorias?.nombre).filter(Boolean));
        return ['todo', ...Array.from(cats)];
    }, [productos]);

    // Filtrar productos
    const productosFiltrados = useMemo(() => {
        return productos.filter(p => {
            const matchCat = categoriaSeleccionada === 'todo' || p.categorias?.nombre === categoriaSeleccionada;
            const matchSearch = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [productos, categoriaSeleccionada, busqueda]);

    // Totales
    const totales = useMemo(() => {
        const subtotal = carrito.reduce((acc, item) => acc + item.subtotal, 0);
        const total = subtotal - parseFloat(descuento || 0) + parseFloat(propina || 0) + parseFloat(servicio || 0) + parseFloat(embalaje || 0);
        const vuelto = montoRecibido ? parseFloat(montoRecibido) - total : 0;
        return { subtotal, total, vuelto };
    }, [carrito, descuento, propina, servicio, embalaje, montoRecibido]);

    // Handlers
    const handleAddProducto = (producto) => {
        setProductoAPersonalizar(producto);
    };

    const confirmAddProducto = (itemPersonalizado) => {
        setCarrito([...carrito, { ...itemPersonalizado, uniqueId: Date.now() }]);
        setProductoAPersonalizar(null);
        showToast('Producto agregado', 'success');
    };

    const removerItem = (uniqueId) => {
        setCarrito(carrito.filter(item => item.uniqueId !== uniqueId));
    };

    const handleSubmit = async () => {
        if (carrito.length === 0) {
            showToast('El carrito está vacío', 'error');
            return;
        }

        setLoading(true);
        try {
            const pedidoData = {
                restaurante_id: restauranteId,
                // numero_pedido: se mantiene o genera
                tipo: tipoPedido === 'mostrador' ? 'llevar' : tipoPedido,

                numero_mesa: (tipoPedido === 'mesa' && mesaSeleccionada) ? mesaSeleccionada.numero_mesa : null,
                cliente_nombre: cliente.nombre || 'Cliente General',
                cliente_celular: cliente.telefono,
                direccion_delivery: cliente.direccion,
                metodo_pago: metodoPago,
                subtotal: totales.subtotal,
                descuento: parseFloat(descuento || 0),
                propina: parseFloat(propina || 0),
                cargo_servicio: parseFloat(servicio || 0),
                cargo_embalaje: parseFloat(embalaje || 0),
                total: totales.total,
                monto_recibido: parseFloat(montoRecibido || 0),
                vuelto: totales.vuelto > 0 ? totales.vuelto : 0,
            };

            let pedidoId;

            if (isEditing) {
                // UPDATE
                await supabase
                    .from('pedidos')
                    .update(pedidoData)
                    .eq('id', pedidoAEditar.id);

                pedidoId = pedidoAEditar.id;

                // Actualizar items: Borrar e insertar es lo más fácil para sincronizar, 
                // o hacer upsert inteligente. Por simplicidad y seguridad:
                // 1. Borrar items existentes (¡Cuidado con locks, pero ok aquí!)
                await supabase.from('pedido_items').delete().eq('pedido_id', pedidoId);

                // 2. Insertar todos de nuevo
                // (Optimización futura: diff changes)
            } else {
                // INSERT
                pedidoData.numero_pedido = generarNumeroPedido();
                pedidoData.usuario_id = userId;
                pedidoData.estado = 'pendiente';

                // Obtener correlativo diario
                try {
                    const correlativo = await obtenerSiguienteCorrelativo(restauranteId);
                    if (correlativo) {
                        pedidoData.orden_dia = correlativo;
                    }
                } catch (corrError) {
                    console.error('Error al obtener correlativo:', corrError);
                }

                const { data: newPedido, error } = await supabase
                    .from('pedidos')
                    .insert([pedidoData])
                    .select()
                    .single();

                if (error) throw error;
                pedidoId = newPedido.id;
            }

            // Insert items logic (shared)
            const itemsToInsert = carrito.map(item => ({
                pedido_id: pedidoId,
                producto_id: item.id,
                producto_nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.subtotal,
                notas: item.notas,
                agregados: item.agregados
            }));

            const { error: errorItems } = await supabase
                .from('pedido_items')
                .insert(itemsToInsert);

            if (errorItems) throw errorItems;

            if (tipoPedido === 'mesa' && mesaSeleccionada && !isEditing) {
                await ocuparMesa(mesaSeleccionada.id, pedidoId, userId);
            }

            showToast(isEditing ? 'Pedido actualizado' : 'Pedido creado', 'success');

            if (isEditing) {
                onSuccess();
                onClose();
            } else {
                // Preparar objeto para confirmación
                const pedidoCompleto = {
                    ...pedidoData,
                    id: pedidoId,
                    numero_pedido: pedidoData.numero_pedido || 'Nuevo',
                    pedido_items: carrito,
                    created_at: new Date().toISOString()
                };
                setPedidoConfirmado(pedidoCompleto);
                setMostrarConfirmacion(true);
                onSuccess(); // Refrescar lista de fondo
            }

        } catch (error) {
            console.error('Error guardando pedido:', error);
            showToast('Error al guardar', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Selector de Mesa
    const handleSelectMesa = () => {
        setMostrarSelectorMesa(true);
    };

    // Callback del Mapa
    const onUbicacionConfirmada = (pos) => {
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`;
        // Agregamos el link al final de la dirección o en notas, para que salga en el mensaje y se guarde
        // Vamos a ser inteligentes: si ya existe dirección, le anexamos el link.

        // Limpiamos links anteriores si hubiera para no duplicar
        let direccionBase = cliente.direccion.split('| Maps:')[0].trim();

        const nuevaDireccion = `${direccionBase} | Maps: ${mapsLink}`;
        setCliente({ ...cliente, direccion: nuevaDireccion });

        showToast('Ubicación agregada correctamente', 'success');
    };

    const onMesaSelected = (mesa) => {
        setMesaSeleccionada(mesa);
        setMostrarSelectorMesa(false);
        // Si es "Mesa", actualizamos el tipo
        if (tipoPedido !== 'mesa') setTipoPedido('mesa');
    };

    // Impresión
    const handlePrint = async (tipo) => {
        let itemsParaImprimir = carrito;

        // Lógica inteligente para cocina en modo edición
        if (tipo === 'cocina' && isEditing) {
            // Filtrar solo los items que NO estaban en el pedido original (o modificados si tuvieramos esa lógica)
            // Aquí asumimos que itemsOriginales tiene los uniqueId de los que ya existían
            const nuevosItems = carrito.filter(item => !itemsOriginales.includes(item.uniqueId));

            if (nuevosItems.length > 0) {
                // Si hay nuevos, preguntamos o imprimimos solo nuevos por defecto para cocina
                // Podríamos hacerlo configurable, pero la lógica solicitada es "mejorar esa lógica"
                itemsParaImprimir = nuevosItems;
                showToast(`Imprimiendo ${nuevosItems.length} items nuevos para cocina`, 'info');
            } else {
                showToast('No hay items nuevos para cocina', 'info');
                // Si el usuario fuerza imprimir cocina sin cambios, quizás quiera reimprimir todo?
                // Por ahora, si no hay nuevos, imprimimos todo pero avisamos.
                // O mejor, imprimimos todo si confirmamos?
                // El requerimiento dice: "imprimir solo los agregados".
                // Si no hay nuevos, imprimimos todo por si acaso sea una reimpresión manual.
            }
        }

        // Preparar estado para el componente oculto
        setPrintConfig({ tipo: tipo, items: itemsParaImprimir });

        // Esperar un ciclo de render para que TicketImpresion se actualice con los nuevos props
        setTimeout(() => {
            imprimir(ticketRef);
        }, 100);
    };


    if (initLoading) return <div className="p-10 text-center">Cargando pedido...</div>;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? 0 : '20px'
        }}>
            <div style={{
                backgroundColor: '#F3F4F6',
                width: '100%', maxWidth: '1400px', height: isMobile ? '100%' : '90vh',
                borderRadius: isMobile ? 0 : '16px',
                display: 'flex', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
            }}>

                {/* COLUMNA 1: CATEGORÍAS (Desktop Sidebar) */}
                <div style={{
                    width: '100px', backgroundColor: 'white', borderRight: '1px solid #E5E7EB',
                    display: isMobile ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '20px 0', overflowY: 'auto'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <ShoppingBag color="#FF6B35" size={32} />
                    </div>
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaSeleccionada(cat)}
                            style={{
                                width: '80px', height: '80px', marginBottom: '12px',
                                borderRadius: '12px', cursor: 'pointer',
                                backgroundColor: categoriaSeleccionada === cat ? '#FFF5F0' : 'transparent',
                                color: categoriaSeleccionada === cat ? '#FF6B35' : '#6B7280',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', fontWeight: '600', fontSize: '11px', textAlign: 'center',
                                border: categoriaSeleccionada === cat ? '2px solid #FF6B35' : '1px solid transparent'
                            }}
                        >
                            <div style={{ marginBottom: '4px' }}>
                                {cat === 'todo' ? '🍽️' : '🍔'}
                            </div>
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* COLUMNA 2: PRODUCTOS */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: '#F3F4F6', padding: isMobile ? '16px' : '20px',
                    position: 'relative', overflow: 'hidden' // Ensure relative for absolute children if any
                }}>

                    {/* Header Mobile & Search */}
                    <div style={{
                        display: 'flex', gap: '16px', marginBottom: isMobile ? '16px' : '20px',
                        backgroundColor: 'white', padding: '16px', borderRadius: '12px',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', alignItems: 'center'
                    }}>
                        {isMobile && (
                            <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                                <X size={24} color="#4B5563" />
                            </button>
                        )}
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search color="#9CA3AF" size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px',
                                    borderRadius: '8px', border: '1px solid #E5E7EB',
                                    fontSize: '15px', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Categorías Horizontal (Solo Mobile) */}
                    {isMobile && (
                        <div style={{
                            display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px',
                            scrollbarWidth: 'none', msOverflowStyle: 'none' // Hide scrollbar
                        }}>
                            {categorias.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoriaSeleccionada(cat)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', border: 'none',
                                        backgroundColor: categoriaSeleccionada === cat ? '#FF6B35' : 'white',
                                        color: categoriaSeleccionada === cat ? 'white' : '#4B5563',
                                        fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        flexShrink: 0
                                    }}
                                >
                                    {cat === 'todo' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // Slightly smaller min-width for mobile
                        gap: '16px', overflowY: 'auto', flex: 1, paddingBottom: isMobile ? '80px' : '20px' // Padding for bottom bar
                    }}>
                        {productosFiltrados.map(producto => (
                            <div
                                key={producto.id}
                                onClick={() => handleAddProducto(producto)}
                                style={{
                                    backgroundColor: 'white', borderRadius: '12px',
                                    padding: '16px', cursor: 'pointer',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                    transition: 'transform 0.2s',
                                    border: '2px solid transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    height: '120px', backgroundColor: '#F9FAFB', borderRadius: '8px',
                                    marginBottom: '12px', backgroundImage: `url(${producto.imagen_url})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center'
                                }} />
                                <h4 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '15px', fontWeight: '600' }}>
                                    {producto.nombre}
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: '16px' }}>
                                        {formatearMoneda(producto.precio)}
                                    </span>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        backgroundColor: '#FFF5F0', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Plus size={18} color="#FF6B35" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Bottom Bar Cart Trigger */}
                    {isMobile && carrito.length > 0 && (
                        <div style={{
                            position: 'absolute', bottom: '16px', left: '16px', right: '16px',
                            backgroundColor: '#1F2937', borderRadius: '16px', padding: '12px 20px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', cursor: 'pointer', zIndex: 50
                        }} onClick={() => setShowCart(true)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    background: '#FF6B35', color: 'white', borderRadius: '50%',
                                    width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'
                                }}>
                                    {carrito.reduce((acc, item) => acc + item.cantidad, 0)}
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>Ver Pedido</span>
                            </div>
                            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                                {formatearMoneda(totales.total)}
                            </span>
                        </div>
                    )}
                </div>

                {/* COLUMNA 3: CARRITO */}
                <div style={{
                    width: isMobile ? '100%' : '400px', backgroundColor: 'white', borderLeft: '1px solid #E5E7EB',
                    display: !showCart ? 'none' : 'flex', flexDirection: 'column',
                    position: isMobile ? 'absolute' : 'relative',
                    top: 0, bottom: 0, right: 0,
                    zIndex: 20
                }}>
                    {/* Header Carrito */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                                {isEditing ? `Editar #${pedidoAEditar.numero_pedido}` : 'Nuevo Pedido'}
                            </h3>
                            {
                                <button onClick={isMobile ? () => setShowCart(false) : onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} color="#6B7280" />
                                </button>
                            }
                        </div>

                        {/* Tipos */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {[
                                { id: 'mostrador', icon: ShoppingBag, label: 'Llevar' },
                                { id: 'mesa', icon: ChefHat, label: 'Mesa' },
                                { id: 'delivery', icon: Truck, label: 'Delivery' }
                            ].map(tipo => (
                                <button
                                    key={tipo.id}
                                    onClick={() => setTipoPedido(tipo.id)}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '8px',
                                        border: `1px solid ${tipoPedido === tipo.id ? '#FF6B35' : '#E5E7EB'}`,
                                        backgroundColor: tipoPedido === tipo.id ? '#FFF5F0' : 'white',
                                        color: tipoPedido === tipo.id ? '#FF6B35' : '#4B5563',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                    }}
                                >
                                    <tipo.icon size={14} /> {tipo.label}
                                </button>
                            ))}
                        </div>

                        {/* Selector Mesa (Si es Mesa) */}
                        {tipoPedido === 'mesa' && (
                            <div style={{ marginBottom: '12px' }}>
                                <button
                                    onClick={handleSelectMesa}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: mesaSeleccionada ? '#DEF7EC' : '#F3F4F6',
                                        border: '1px dashed #FF6B35',
                                        borderRadius: '8px',
                                        color: mesaSeleccionada ? '#03543F' : '#6B7280',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    {mesaSeleccionada
                                        ? mesaSeleccionada.numero_mesa
                                        : 'Seleccionar Mesa...'}
                                </button>
                            </div>
                        )}

                        {/* Cliente Inputs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ position: 'relative' }}>
                                <User size={16} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                                <input
                                    placeholder="Nombre Cliente"
                                    value={cliente.nombre}
                                    onChange={e => setCliente({ ...cliente, nombre: e.target.value })}
                                    style={{
                                        width: '100%', padding: '8px 8px 8px 34px', borderRadius: '8px',
                                        border: '1px solid #E5E7EB', outline: 'none', fontSize: '13px'
                                    }}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                                <input
                                    placeholder="WhatsApp / Teléfono"
                                    value={cliente.telefono}
                                    onChange={e => setCliente({ ...cliente, telefono: e.target.value })}
                                    style={{
                                        width: '100%', padding: '8px 8px 8px 34px', borderRadius: '8px',
                                        border: '1px solid #E5E7EB', outline: 'none', fontSize: '13px'
                                    }}
                                />
                            </div>
                            {tipoPedido === 'delivery' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <MapPin size={16} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                                        <input
                                            placeholder="Dirección de entrega"
                                            value={cliente.direccion}
                                            onChange={e => setCliente({ ...cliente, direccion: e.target.value })}
                                            style={{
                                                width: '100%', padding: '8px 8px 8px 34px', borderRadius: '8px',
                                                border: '1px solid #E5E7EB', outline: 'none', fontSize: '13px'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setMostrarMapa(true)}
                                        title="Seleccionar en Mapa"
                                        style={{
                                            padding: '8px 12px', background: '#3B82F6', color: 'white',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <MapPin size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista Carrito */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {carrito.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '40px' }}>
                                <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p>Carrito vacío</p>
                            </div>
                        ) : (
                            carrito.map((item) => (
                                <div key={item.uniqueId} style={{
                                    display: 'flex', gap: '12px', marginBottom: '16px',
                                    paddingBottom: '16px', borderBottom: '1px dashed #E5E7EB'
                                }}>
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '6px',
                                        backgroundColor: '#FF6B35', color: 'white', fontSize: '12px',
                                        fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {item.cantidad}x
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>{item.nombre}</span>
                                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                                                {formatearMoneda(item.subtotal)}
                                            </span>
                                        </div>
                                        {item.notas && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>📝 {item.notas}</p>}
                                        {item.agregados?.length > 0 && (
                                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#059669' }}>
                                                + {item.agregados.map(a => a.nombre).join(', ')}
                                            </p>
                                        )}
                                        {/* Tag Nuevo si no estaba antes */}
                                        {isEditing && !itemsOriginales.includes(item.uniqueId) && (
                                            <span style={{ fontSize: '10px', background: '#DEF7EC', color: '#03543F', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>Nuevo</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removerItem(item.uniqueId)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                        {/* Selector Método Pago */}
                        <div style={{ marginBottom: '16px', display: 'flex', overflow: 'auto', gap: '8px', paddingBottom: '4px' }}>
                            {['efectivo', 'tarjeta', 'yape', 'plin'].map(metodo => (
                                <button
                                    key={metodo}
                                    onClick={() => setMetodoPago(metodo)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '16px', border: 'none',
                                        backgroundColor: metodoPago === metodo ? '#1F2937' : '#E5E7EB',
                                        color: metodoPago === metodo ? 'white' : '#4B5563',
                                        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        textTransform: 'capitalize', whiteSpace: 'nowrap'
                                    }}
                                >
                                    {metodo}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            {/* Inputs simplificados para props */}
                            <input type="number" placeholder="Propina" value={propina} onChange={e => setPropina(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <input type="number" placeholder="Descuento" value={descuento} onChange={e => setDescuento(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <input type="number" placeholder="Embalaje" value={embalaje} onChange={e => setEmbalaje(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <input type="number" placeholder="Servicio" value={servicio} onChange={e => setServicio(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontWeight: '700', fontSize: '18px' }}>Total</span>
                            <span style={{ fontWeight: '700', fontSize: '18px', color: '#FF6B35' }}>{formatearMoneda(totales.total)}</span>
                        </div>

                        {/* Botones de Acción */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <PrintButton
                                        label="Cocina"
                                        color="#059669"
                                        onClick={() => handlePrint('cocina')}
                                    />
                                    <PrintButton
                                        label="Cliente"
                                        color="#3B82F6"
                                        onClick={() => handlePrint('cliente')}
                                    />
                                </div>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || carrito.length === 0}
                                style={{
                                    flex: 1, padding: '16px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                                    border: 'none', color: 'white', fontSize: '16px', fontWeight: '700',
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                                    opacity: loading || carrito.length === 0 ? 0.7 : 1
                                }}
                            >
                                {loading ? '...' : isEditing ? 'Guardar Cambios' : 'Crear Pedido'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* OVERLAY DE ÉXITO */}
                {mostrarConfirmacion && pedidoConfirmado && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'white', zIndex: 100,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '40px'
                    }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <CheckCircle size={48} color="#10B981" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#065F46', marginBottom: '8px' }}>¡Pedido Creado!</h2>
                        <p style={{ color: '#6B7280', marginBottom: '32px' }}>El pedido #{pedidoConfirmado.numero_pedido} se ha registrado correctamente.</p>

                        <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '400px', flexDirection: 'column' }}>
                            <button
                                onClick={() => {
                                    const url = generarLinkWhatsapp(pedidoConfirmado, restaurante);
                                    if (url) window.open(url, '_blank');
                                    else showToast('El cliente no tiene teléfono registrado', 'warning');
                                }}
                                style={{
                                    padding: '16px', borderRadius: '12px', border: 'none',
                                    background: '#25D366', color: 'white', fontSize: '16px', fontWeight: '700',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.4)'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Enviar a WhatsApp
                            </button>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => handlePrint('cliente')}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB',
                                        background: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Imprimir Recibo
                                </button>
                                <button
                                    onClick={() => handlePrint('cocina')}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB',
                                        background: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Imprimir Cocina
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                style={{
                                    marginTop: '16px', padding: '12px', borderRadius: '8px', border: 'none',
                                    background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontWeight: '500'
                                }}
                            >
                                Cerrar y volver
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {productoAPersonalizar && (
                <ModalPersonalizarProducto
                    producto={productoAPersonalizar}
                    onClose={() => setProductoAPersonalizar(null)}
                    onConfirmar={confirmAddProducto}
                />
            )}

            {mostrarSelectorMesa && (
                <VistaMesasSelector
                    restauranteId={restauranteId}
                    onSelect={onMesaSelected}
                    onClose={() => setMostrarSelectorMesa(false)}
                />
            )}

            {mostrarMapa && (
                <SelectorUbicacion
                    onClose={() => setMostrarMapa(false)}
                    onConfirm={onUbicacionConfirmada}
                />
            )}

            {/* Hidden Print Component */}
            <TicketImpresion
                ref={ticketRef}
                pedido={{
                    numero_pedido: isEditing ? pedidoAEditar.numero_pedido : 'Nuevo',
                    created_at: new Date().toISOString(),
                    cliente_nombre: cliente.nombre,
                    tipo: tipoPedido,
                    numero_mesa: mesaSeleccionada?.numero_mesa,
                    pedido_items: carrito, // Default full list, overridden by itemsFiltrados if set
                    subtotal: totales.subtotal,
                    descuento: parseFloat(descuento || 0),
                    cargo_servicio: parseFloat(servicio || 0),
                    cargo_embalaje: parseFloat(embalaje || 0),
                    propina: parseFloat(propina || 0),
                    total: totales.total,
                    metodo_pago: metodoPago
                }}
                restaurante={restaurante}
                tipoImpresion={printConfig.tipo}
                itemsFiltrados={printConfig.items}
            />
            {/* Cierre de fragmento o condicional pendiente por el reemplazo del Header */}
        </div>
    );
};


export default ModalNuevoPedido;
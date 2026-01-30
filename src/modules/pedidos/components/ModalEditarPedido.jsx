// src/modules/pedidos/components/ModalEditarPedido.jsx

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { showToast } from '../../../components/Toast';
import { calcularTotales } from '../utils/pedidoHelpers';
import ModalAgregados from './ModalAgregados';

const ModalEditarPedido = ({ pedido, productos, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cliente_nombre: pedido.cliente_nombre || '',
        cliente_celular: pedido.cliente_celular || '',
        metodo_pago: pedido.metodo_pago || 'efectivo',
        notas: pedido.notas || ''
    });

    // Cargar items del pedido al carrito
    const [carrito, setCarrito] = useState([]);
    const [CarritoOriginal, setCarritoOriginal] = useState([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('all');
    const [productoAgregados, setProductoAgregados] = useState(null);
    const [taperCustom, setTaperCustom] = useState({ descripcion: '', precio: '' });
    const [tapersAgregados, setTapersAgregados] = useState([]);

    const isMobile = window.innerWidth < 768;
    const puedeEditarProductos = pedido.estado === 'pendiente';
    const puedeAgregarProductos = ['pendiente', 'preparando', 'listo'].includes(pedido.estado);

    useEffect(() => {
        cargarDatosPedido();
    }, []);

    const cargarDatosPedido = () => {
        // Convertir pedido_items a formato de carrito
        const itemsCarrito = pedido.pedido_items?.map(item => ({
            id: item.producto_id,
            nombre: item.producto_nombre,
            precio: parseFloat(item.precio_unitario),
            cantidad: item.cantidad,
            agregados: item.agregados || [],
            item_id: item.id, // ID del pedido_item para actualizaciones
            esNuevo: false,
            impreso: item.impreso !== false
        })) || [];

        setCarrito(itemsCarrito);
        setCarritoOriginal(JSON.parse(JSON.stringify(itemsCarrito))); // Copia profunda

        // Cargar tapers si existen
        if (pedido.taper_adicional && pedido.costo_taper > 0) {
            setTapersAgregados([{
                id: Date.now(),
                descripcion: 'Taper adicional',
                precio: parseFloat(pedido.costo_taper)
            }]);
        }
    };

    const categorias = [...new Set(productos.map(p => p.categorias?.nombre).filter(Boolean))];

    const productosFiltrados = productos.filter(p => {
        const matchBusqueda = p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase());
        const matchCategoria = categoriaFiltro === 'all' || p.categorias?.nombre === categoriaFiltro;
        return matchBusqueda && matchCategoria;
    });

    const agregarAlCarrito = (producto) => {
        if (!puedeAgregarProductos) {
            showToast('No se pueden agregar productos en este estado', 'error');
            return;
        }

        if (producto.agregados && producto.agregados.length > 0) {
            setProductoAgregados(producto);
            return;
        }
        agregarProductoAlCarrito(producto, []);
    };

    const agregarProductoAlCarrito = (producto, agregadosSeleccionados) => {
        const itemExistente = carrito.find(item =>
            item.id === producto.id &&
            JSON.stringify(item.agregados) === JSON.stringify(agregadosSeleccionados)
        );

        if (itemExistente) {
            setCarrito(carrito.map(item =>
                item.id === producto.id && JSON.stringify(item.agregados) === JSON.stringify(agregadosSeleccionados)
                    ? { ...item, cantidad: item.cantidad + 1, esNuevo: true }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                id: producto.id,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                cantidad: 1,
                agregados: agregadosSeleccionados,
                esNuevo: true, // Marca para saber que es nuevo
                impreso: false
            }]);
        }

        setProductoAgregados(null);
        showToast('Producto agregado', 'success');
    };

    const actualizarCantidad = (index, nuevaCantidad) => {
        if (!puedeEditarProductos) {
            showToast('Solo puedes modificar cantidades en estado pendiente', 'error');
            return;
        }

        if (nuevaCantidad <= 0) {
            setCarrito(carrito.filter((_, i) => i !== index));
        } else {
            setCarrito(carrito.map((item, i) =>
                i === index ? { ...item, cantidad: nuevaCantidad } : item
            ));
        }
    };

    const handleSubmit = async () => {
        if (carrito.length === 0) {
            showToast('El pedido debe tener al menos un producto', 'error');
            return;
        }

        setLoading(true);

        try {
            const { subtotal, iva, total } = calcularTotales(carrito, tapersAgregados);

            // 1. Actualizar datos del pedido
            const { error: pedidoError } = await supabase
                .from('pedidos')
                .update({
                    cliente_nombre: formData.cliente_nombre || null,
                    cliente_celular: formData.cliente_celular || null,
                    metodo_pago: formData.metodo_pago,
                    notas: formData.notas || null,
                    taper_adicional: tapersAgregados.length > 0,
                    costo_taper: tapersAgregados.reduce((sum, t) => sum + parseFloat(t.precio), 0),
                    subtotal: subtotal,
                    iva: iva,
                    total: total,
                    tiene_productos_sin_imprimir: carrito.some(item => item.esNuevo)
                })
                .eq('id', pedido.id);

            if (pedidoError) throw pedidoError;

            // 2. Eliminar items anteriores
            const { error: deleteError } = await supabase
                .from('pedido_items')
                .delete()
                .eq('pedido_id', pedido.id);

            if (deleteError) throw deleteError;

            // 3. Insertar nuevos items
            const items = carrito.map(item => ({
                pedido_id: pedido.id,
                producto_id: item.id,
                producto_nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                agregados: item.agregados,
                subtotal: (item.precio + item.agregados.reduce((s, a) => s + parseFloat(a.precio), 0)) * item.cantidad,
                impreso: item.esNuevo ? false : true
            }));
            const { error: itemsError } = await supabase
                .from('pedido_items')
                .insert(items);

            if (itemsError) throw itemsError;

            showToast('Pedido actualizado exitosamente', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error actualizando pedido:', error);
            showToast('Error al actualizar pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, costoTaper, iva, total } = calcularTotales(carrito, tapersAgregados);

    return (
        <>
            <style>{`
        @media (max-width: 768px) {
          .modal-editar-pedido { 
            max-width: 100% !important; 
            height: 100vh !important; 
            border-radius: 0 !important; 
          }
        }
      `}</style>

            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'center', zIndex: 1000,
                padding: isMobile ? 0 : '20px', overflow: 'auto'
            }}>
                <div className="modal-editar-pedido" style={{
                    background: 'white', borderRadius: isMobile ? 0 : '20px',
                    width: '100%', maxWidth: isMobile ? '100%' : '900px',
                    maxHeight: isMobile ? '100vh' : '90vh',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{
                                margin: '0 0 4px 0', fontSize: isMobile ? '20px' : '24px',
                                fontWeight: '700', color: '#1a202c'
                            }}>
                                Editar Pedido #{pedido.numero_pedido}
                            </h2>
                            <p style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', color: '#718096' }}>
                                Estado: <span style={{
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                    color: pedido.estado === 'pendiente' ? '#F59E0B' : '#FF6B35'
                                }}>
                                    {pedido.estado}
                                </span>
                            </p>
                        </div>
                        <button onClick={onClose} style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            border: 'none', background: '#f7fafc', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Advertencia según estado */}
                    {!puedeEditarProductos && puedeAgregarProductos && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#FFF7ED',
                            borderBottom: '1px solid #FDBA74',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertTriangle size={18} color="#C2410C" />
                            <p style={{ margin: 0, fontSize: '13px', color: '#9A3412' }}>
                                El pedido está en preparación. Solo puedes agregar productos nuevos.
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    <div style={{
                        flex: 1, overflowY: 'auto',
                        padding: isMobile ? '16px' : '24px'
                    }}>
                        {/* Información del pedido */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                margin: '0 0 16px 0', fontSize: isMobile ? '16px' : '18px',
                                fontWeight: '700', color: '#1a202c'
                            }}>
                                Información del Pedido
                            </h3>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block', marginBottom: '8px',
                                    fontSize: '14px', fontWeight: '600', color: '#2d3748'
                                }}>
                                    Nombre del Cliente
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre del cliente"
                                    value={formData.cliente_nombre}
                                    onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        border: '2px solid #e2e8f0', borderRadius: '10px',
                                        fontSize: '15px', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block', marginBottom: '8px',
                                    fontSize: '14px', fontWeight: '600', color: '#2d3748'
                                }}>
                                    Celular (WhatsApp)
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Ej: +51 987654321"
                                    value={formData.cliente_celular}
                                    onChange={(e) => setFormData({ ...formData, cliente_celular: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        border: '2px solid #e2e8f0', borderRadius: '10px',
                                        fontSize: '15px', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block', marginBottom: '8px',
                                    fontSize: '14px', fontWeight: '600', color: '#2d3748'
                                }}>
                                    Método de Pago
                                </label>
                                <select
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        border: '2px solid #e2e8f0', borderRadius: '10px',
                                        fontSize: '15px', outline: 'none', cursor: 'pointer',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="efectivo">💵 Efectivo</option>
                                    <option value="tarjeta">💳 Tarjeta</option>
                                    <option value="yape">📱 Yape</option>
                                    <option value="plin">📱 Plin</option>
                                </select>
                            </div>
                        </div>

                        {/* Productos actuales */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                margin: '0 0 16px 0', fontSize: isMobile ? '16px' : '18px',
                                fontWeight: '700', color: '#1a202c'
                            }}>
                                Productos del Pedido
                            </h3>

                            <div style={{
                                padding: isMobile ? '12px' : '16px',
                                background: '#f7fafc', borderRadius: '12px'
                            }}>
                                {carrito.length === 0 ? (
                                    <p style={{ margin: 0, color: '#718096', fontSize: '14px', textAlign: 'center' }}>
                                        No hay productos en el pedido
                                    </p>
                                ) : (
                                    carrito.map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', padding: '12px 0',
                                            borderBottom: index < carrito.length - 1 ? '1px solid #e2e8f0' : 'none'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: isMobile ? '13px' : '14px',
                                                        color: '#4a5568', fontWeight: '600'
                                                    }}>
                                                        {item.nombre}
                                                    </span>
                                                    {item.esNuevo && (
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            background: '#10B981',
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: '600'
                                                        }}>
                                                            NUEVO
                                                        </span>
                                                    )}
                                                </div>
                                                {item.agregados.length > 0 && (
                                                    <span style={{ fontSize: '11px', color: '#10B981', display: 'block', marginTop: '2px' }}>
                                                        + {item.agregados.map(a => a.nombre).join(', ')}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '12px', color: '#718096' }}>
                                                    ${item.precio.toFixed(2)} c/u
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                                                    disabled={!puedeEditarProductos}
                                                    style={{
                                                        width: '28px', height: '28px',
                                                        background: puedeEditarProductos ? '#e2e8f0' : '#f7fafc',
                                                        border: 'none', borderRadius: '6px',
                                                        cursor: puedeEditarProductos ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        opacity: puedeEditarProductos ? 1 : 0.5
                                                    }}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{
                                                    fontSize: isMobile ? '13px' : '14px', fontWeight: '600',
                                                    minWidth: '30px', textAlign: 'center'
                                                }}>
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                                                    disabled={!puedeEditarProductos}
                                                    style={{
                                                        width: '28px', height: '28px',
                                                        background: puedeEditarProductos ? '#FF6B35' : '#f7fafc',
                                                        border: 'none', borderRadius: '6px',
                                                        cursor: puedeEditarProductos ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: puedeEditarProductos ? 'white' : '#cbd5e0',
                                                        opacity: puedeEditarProductos ? 1 : 0.5
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <span style={{
                                                    fontSize: isMobile ? '13px' : '14px', fontWeight: '700',
                                                    color: '#FF6B35', minWidth: '60px', textAlign: 'right'
                                                }}>
                                                    ${((item.precio + item.agregados.reduce((s, a) => s + parseFloat(a.precio), 0)) * item.cantidad).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Agregar más productos */}
                        {puedeAgregarProductos && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{
                                    margin: '0 0 16px 0', fontSize: isMobile ? '16px' : '18px',
                                    fontWeight: '700', color: '#1a202c'
                                }}>
                                    Agregar Más Productos
                                </h3>

                                {/* Búsqueda */}
                                <div style={{ marginBottom: '16px', position: 'relative' }}>
                                    <Search size={20} style={{
                                        position: 'absolute', left: '16px', top: '50%',
                                        transform: 'translateY(-50%)', color: '#a0aec0'
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        value={busquedaProducto}
                                        onChange={(e) => setBusquedaProducto(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 16px 12px 48px',
                                            border: '2px solid #e2e8f0', borderRadius: '10px',
                                            fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                {/* Filtro categorías */}
                                <div style={{
                                    display: 'flex', gap: '8px', marginBottom: '16px',
                                    overflowX: 'auto', whiteSpace: 'nowrap'
                                }}>
                                    <button
                                        onClick={() => setCategoriaFiltro('all')}
                                        style={{
                                            padding: '8px 16px',
                                            background: categoriaFiltro === 'all' ? '#FF6B35' : '#f7fafc',
                                            color: categoriaFiltro === 'all' ? 'white' : '#718096',
                                            border: 'none', borderRadius: '8px', fontSize: '13px',
                                            fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        Todos
                                    </button>
                                    {categorias.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoriaFiltro(cat)}
                                            style={{
                                                padding: '8px 16px',
                                                background: categoriaFiltro === cat ? '#FF6B35' : '#f7fafc',
                                                color: categoriaFiltro === cat ? 'white' : '#718096',
                                                border: 'none', borderRadius: '8px', fontSize: '13px',
                                                fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Grid productos */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                    gap: '12px',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    {productosFiltrados.map(producto => (
                                        <div
                                            key={producto.id}
                                            style={{
                                                padding: '12px', border: '1px solid #e2e8f0',
                                                borderRadius: '10px', background: 'white',
                                                display: 'flex', gap: '12px', alignItems: 'center',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            onClick={() => agregarAlCarrito(producto)}
                                        >
                                            <div style={{
                                                width: '50px', height: '50px',
                                                borderRadius: '8px',
                                                background: producto.imagen_url ? `url(${producto.imagen_url}) center/cover` : '#f7fafc',
                                                flexShrink: 0
                                            }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: '0 0 4px 0', fontSize: '13px',
                                                    fontWeight: '600', color: '#1a202c',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>
                                                    {producto.nombre}
                                                </p>
                                                <p style={{
                                                    margin: 0, fontSize: '14px',
                                                    fontWeight: '700', color: '#FF6B35'
                                                }}>
                                                    ${parseFloat(producto.precio).toFixed(2)}
                                                </p>
                                            </div>
                                            <button style={{
                                                padding: '8px', background: '#10B981', border: 'none',
                                                borderRadius: '6px', color: 'white', cursor: 'pointer'
                                            }}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tapers */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                margin: '0 0 16px 0', fontSize: isMobile ? '16px' : '18px',
                                fontWeight: '700', color: '#1a202c'
                            }}>
                                Tapers Adicionales
                            </h3>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr auto',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Descripción"
                                    value={taperCustom.descripcion}
                                    onChange={(e) => setTaperCustom({ ...taperCustom, descripcion: e.target.value })}
                                    style={{
                                        padding: '10px 12px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Precio"
                                    value={taperCustom.precio}
                                    onChange={(e) => setTaperCustom({ ...taperCustom, precio: e.target.value })}
                                    style={{
                                        padding: '10px 12px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (taperCustom.descripcion && taperCustom.precio) {
                                            setTapersAgregados([...tapersAgregados, {
                                                id: Date.now(),
                                                descripcion: taperCustom.descripcion,
                                                precio: parseFloat(taperCustom.precio)
                                            }]);
                                            setTaperCustom({ descripcion: '', precio: '' });
                                            showToast('Taper agregado', 'success');
                                        }
                                    }}
                                    style={{
                                        padding: '10px 16px',
                                        background: '#10B981',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    +
                                </button>
                            </div>

                            {tapersAgregados.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {tapersAgregados.map((taper, index) => (
                                        <div
                                            key={taper.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                background: '#f7fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <span style={{ fontSize: '14px' }}>{taper.descripcion}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>
                                                    ${taper.precio.toFixed(2)}
                                                </span>
                                                <button
                                                    onClick={() => setTapersAgregados(tapersAgregados.filter((_, i) => i !== index))}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: '#FEE2E2',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        color: '#EF4444',
                                                        fontSize: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notas */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block', marginBottom: '8px',
                                fontSize: '14px', fontWeight: '600', color: '#2d3748'
                            }}>
                                Notas
                            </label>
                            <textarea
                                placeholder="Instrucciones especiales..."
                                value={formData.notas}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                rows={3}
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    border: '2px solid #e2e8f0', borderRadius: '10px',
                                    fontSize: '14px', outline: 'none', resize: 'vertical',
                                    fontFamily: 'inherit', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Resumen de totales */}

                        <div style={{
                            padding: '16px',
                            background: '#f7fafc',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#718096' }}>Subtotal:</span>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
                            </div>
                            {costoTaper > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#718096' }}>Tapers:</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#10B981' }}>${costoTaper.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '14px', color: '#718096' }}>IVA (10%):</span>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>${iva.toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                paddingTop: '12px', borderTop: '2px solid #e2e8f0'
                            }}>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a202c' }}>TOTAL:</span>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: '#FF6B35' }}>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex', gap: '12px', background: 'white'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: isMobile ? '12px' : '14px',
                                background: 'white', border: '2px solid #e2e8f0',
                                borderRadius: '10px', fontSize: isMobile ? '14px' : '16px',
                                fontWeight: '600', color: '#4a5568', cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                flex: 2, padding: isMobile ? '12px' : '14px',
                                background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                border: 'none', borderRadius: '10px',
                                fontSize: isMobile ? '14px' : '16px',
                                fontWeight: '600', color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: loading ? 'none' : '0 4px 12px rgba(16,185,129,0.3)'
                            }}
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Agregados */}
            {productoAgregados && (
                <ModalAgregados
                    producto={productoAgregados}
                    onClose={() => setProductoAgregados(null)}
                    onConfirmar={(agregados) => agregarProductoAlCarrito(productoAgregados, agregados)}
                />
            )}
        </>
    );
};
export default ModalEditarPedido;
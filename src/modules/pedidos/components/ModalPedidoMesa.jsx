// src/modules/pedidos/components/ModalPedidoMesa.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
    X, Printer, Clock, AlertCircle, CheckCircle, Package, Edit, 
    Trash2, ChefHat, Receipt, DollarSign 
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { showToast } from '../../../components/Toast';
import { liberarMesa } from '../../../services/mesasService';
import { 
    parseSupabaseTimestamp, 
    sanitizarNombreMesa, 
    formatearMoneda,
    formatearFechaHora,
    generarLinkWhatsapp,
    getEstadoColor 
} from '../utils/pedidoHelpers';
import { impresionService } from '../../../services/impresionService';
import { impresorasService } from '../../../services/impresorasService';
import DropdownButton from './DropdownButton';

const ModalPedidoMesa = ({ 
    mesa, 
    productos, 
    restaurante, 
    isAdmin, 
    onCambiarEstado, 
    onEliminar, 
    onEditar, 
    onClose, 
    onSuccess 
}) => {
    const [pedido, setPedido] = useState(null);
    const [sinPedido, setSinPedido] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        if (!mesa?.id) return;
        cargarPedido();

        // Suscripción Realtime para cambios en el pedido activo
        // Esto permite que si se paga desde otro módulo, el modal se actualice solo
        const subscription = supabase
            .channel(`pedido_mesa_${mesa.id}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'pedidos',
                filter: `numero_mesa=eq.${mesa.numero_mesa}` 
            }, (payload) => {
                // Si el pedido actual se actualizó, recargamos
                if (pedido && payload.new.id === pedido.id) {
                    cargarPedido();
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [mesa?.id]);

    const cargarPedido = async () => {
        if (!mesa?.id) return;
        try {
            setLoading(true);
            let pedidoId = mesa.pedido_activo_id;

            // Si no tenemos el ID del pedido en el objeto mesa, 
            // consultamos la mesa directamente para obtener el dato más reciente de la DB
            if (!pedidoId) {
                const { data: mesaDb } = await supabase
                    .from('mesas')
                    .select('pedido_activo_id')
                    .eq('id', mesa.id)
                    .single();
                pedidoId = mesaDb?.pedido_activo_id;
            }

            let pedidoData = null;
            let pedidoError = null;

            if (pedidoId) {
                // MÉTODO A: Búsqueda por ID directo (100% fiable)
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*, usuarios (nombre)')
                    .eq('id', pedidoId)
                    .maybeSingle();
                pedidoData = data;
                pedidoError = error;
            }

            // MÉTODO B: Fallback por nombre (si el ID falló o no existe)
            if (!pedidoData) {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*, usuarios (nombre)')
                    .in('numero_mesa', [mesa.numero_mesa, sanitizarNombreMesa(mesa.numero_mesa)])
                    .in('estado', ['pendiente', 'preparando', 'listo'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                pedidoData = data;
                pedidoError = error;
            }

            if (pedidoError) throw pedidoError;

            if (!pedidoData) {
                setSinPedido(true);
                setLoading(false);
                return;
            }
            setSinPedido(false);

            // Cargar items del pedido
            const { data: itemsData, error: itemsError } = await supabase
                .from('pedido_items')
                .select('*')
                .eq('pedido_id', pedidoData.id);

            if (itemsError) throw itemsError;

            setPedido(pedidoData);
            setItems(itemsData);
        } catch (error) {
            console.error('Error cargando pedido:', error);
            showToast('No se pudo encontrar el pedido activo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImprimir = async (tipo) => {
        if (!pedido) return;
        try {
            const tipoImpresion = tipo === 'cocina' ? 'cocina' : 'caja';
            const impresoras = impresorasService.getImpresorasPorTipo(tipoImpresion);

            if (impresoras.length === 0) {
                showToast(`No hay impresoras de ${tipoImpresion} configuradas`, 'warning');
                return;
            }

            // OPCIÓN B: El botón general siempre imprime TODO el listado
            const itemsAImprimir = [...items];

            const ops = tipo === 'cocina'
                ? impresionService.formatearComanda({ ...pedido, pedido_items: itemsAImprimir })
                : impresionService.formatearTicket({ ...pedido, pedido_items: itemsAImprimir }, { restaurante: restaurante });

            for (const imp of impresoras) {
                await impresionService.enviarAlPlugin(ops, imp.ip);
            }

            // Si se imprimió en cocina, marcar como impresos todos los productos que estaban pendientes
            if (tipo === 'cocina') {
                const itemIdsPendientes = items.filter(i => !i.impreso).map(i => i.id).filter(Boolean);
                
                if (itemIdsPendientes.length > 0) {
                    await supabase
                        .from('pedido_items')
                        .update({ impreso: true })
                        .in('id', itemIdsPendientes);
                    
                    await supabase
                        .from('pedidos')
                        .update({ tiene_productos_sin_imprimir: false })
                        .eq('id', pedido.id);
                    
                    cargarPedido();
                }
            }

            showToast('Impresión enviada', 'success');
        } catch (error) {
            console.error('Error en impresión:', error);
            showToast(error.message, 'error');
        }
    };

    const handleImprimirIndividual = async (producto) => {
        try {
            const impresoras = impresorasService.getImpresorasPorTipo('cocina');
            if (impresoras.length === 0) {
                showToast('No hay impresoras de cocina configuradas', 'warning');
                return;
            }

            // Crear objeto de pedido con UN SOLO producto
            const pedidoIndividual = {
                ...pedido,
                notas: null, // OJO: No imprimir notas generales en comanda individual
                pedido_items: [producto]
            };

            const ops = impresionService.formatearComanda(pedidoIndividual);

            for (const imp of impresoras) {
                await impresionService.enviarAlPlugin(ops, imp.ip);
            }

            // Si no estaba impreso, marcarlo en DB
            if (!producto.impreso) {
                await supabase
                    .from('pedido_items')
                    .update({ impreso: true })
                    .eq('id', producto.id);
                
                cargarPedido();
            }

            showToast(`Comanda de ${producto.producto_nombre} enviada`, 'success');
        } catch (error) {
            console.error('Error impresión individual:', error);
            showToast(error.message, 'error');
        }
    };

    const handleCerrarCuenta = async () => {
        if (!pedido) return;
        try {
            // 1. Marcar pedido como entregado
            const { error: errorPedido } = await supabase
                .from('pedidos')
                .update({ 
                    estado: 'entregado',
                    fecha_finalizacion: new Date().toISOString() 
                })
                .eq('id', pedido.id);

            if (errorPedido) throw errorPedido;

            // 2. Liberar mesa
            await liberarMesa(mesa.id);
            
            showToast('Cuenta cerrada y mesa liberada', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error al cerrar cuenta:', error);
            showToast('Error al cerrar cuenta', 'error');
        }
    };

    const getTipoIcon = (tipo) => {
        const icons = {
            mesa: '🪑',
            llevar: '📦',
            delivery: '🚚'
        };
        return icons[tipo] || '🛒';
    };

    const opcionesImpresion = [
        { label: 'Ticket Cocina', value: 'cocina', icon: Package, color: '#FF6B35' },
        { label: 'Recibo Caja', value: 'cliente', icon: Printer, color: '#3B82F6' }
    ];

    const opcionesEstado = [
        { label: 'Pendiente', value: 'pendiente', icon: Clock, color: '#F59E0B' },
        { label: 'Preparando', value: 'preparando', icon: AlertCircle, color: '#FF6B35' },
        { label: 'Listo', value: 'listo', icon: CheckCircle, color: '#10B981' }
    ];

    const handleLiberarManual = async () => {
        try {
            await liberarMesa(mesa.id);
            showToast('Mesa liberada correctamente', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error al liberar mesa:', error);
            showToast('Error al liberar mesa', 'error');
        }
    };

    if (loading) return null;

    if (sinPedido) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white', borderRadius: '24px', padding: '40px',
                    maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#FEF3C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                    }}>
                        <AlertCircle size={40} color="#D97706" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937', marginBottom: '12px' }}>Mesa Sin Pedido</h3>
                    <p style={{ color: '#6B7280', marginBottom: '32px', fontSize: '15px', lineHeight: '1.5' }}>
                        Esta mesa figura como <strong>Ocupada</strong>, pero no se encontró ningún pedido activo.<br/>¿Deseas liberarla para ponerla disponible?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={handleLiberarManual}
                            style={{
                                padding: '14px', borderRadius: '12px', border: 'none',
                                backgroundColor: '#10B981', color: 'white', fontWeight: '700', fontSize: '16px',
                                cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
                            }}
                        >
                            Liberar Mesa Ahora
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px', borderRadius: '10px', border: 'none',
                                backgroundColor: 'transparent', color: '#6B7280', fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar y ver después
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return ReactDOM.createPortal(
        <>
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .modal-detalle-mesa {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>

            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : '20px',
                overflow: 'auto'
            }} onClick={onClose}>
                
                <div 
                    className="modal-detalle-mesa"
                    style={{
                        background: 'white',
                        borderRadius: isMobile ? 0 : '24px',
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '500px',
                        maxHeight: isMobile ? '100vh' : '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header Premium */}
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid #f1f5f9',
                        background: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>
                                            {pedido.numero_mesa}
                                        </h2>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            backgroundColor: pedido.pagado ? '#D1FAE5' : '#FEE2E2',
                                            color: pedido.pagado ? '#059669' : '#DC2626',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            border: `1px solid ${pedido.pagado ? '#A7F3D0' : '#FECACA'}`
                                        }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: pedido.pagado ? '#10B981' : '#EF4444'
                                            }} />
                                            {pedido.pagado ? 'CUENTA PAGADA' : 'PENDIENTE DE PAGO'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#6B7280', fontSize: '14px' }}>
                                        <span style={{ fontWeight: '600' }}>ORDEN #{pedido.numero_pedido}</span>
                                        <span>•</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} />
                                            {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ 
                                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                                background: '#f1f5f9', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: '#64748b'
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Barra de Acciones Pro */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <DropdownButton 
                                label="Imprimir" icon={Printer} variant="secondary"
                                options={opcionesImpresion} onSelect={handleImprimir}
                            />
                            <button
                                onClick={() => {
                                    const url = generarLinkWhatsapp(pedido, restaurante);
                                    url ? window.open(url, '_blank') : showToast('Sin número de cliente', 'error');
                                }}
                                style={{
                                    padding: '10px 16px', background: '#22c55e', border: 'none',
                                    borderRadius: '10px', color: 'white', fontSize: '14px',
                                    fontWeight: '700', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(34,197,94,0.2)'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                WhatsApp
                            </button>
                            <DropdownButton 
                                label="Estado" icon={AlertCircle} variant="success"
                                options={opcionesEstado} 
                                onSelect={async (st) => {
                                    await onCambiarEstado(pedido.id, st);
                                    // Si el estado es final, cerramos y refrescamos
                                    if (['entregado', 'anulado'].includes(st)) {
                                        onSuccess();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Botón Principal: Edición / Modificación */}
                    <div style={{ padding: '0 24px 20px 24px' }}>
                        <button
                            onClick={() => onEditar(pedido)}
                            style={{
                                width: '100%', padding: '14px', background: '#FFF7ED',
                                border: '2px dashed #F97316', borderRadius: '16px',
                                color: '#C2410C', fontSize: '15px', fontWeight: '800',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '10px', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFEDD5'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FFF7ED'}
                        >
                            <Edit size={20} />
                            ✏️ MODIFICAR / AGREGAR ITEMS
                        </button>
                    </div>

                    {/* Contenido Scrollable */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px 24px' }}>
                        {/* Info Mesa */}
                        <div style={{ 
                            padding: '16px', background: '#f8fafc', borderRadius: '16px', 
                            border: '1px solid #f1f5f9', marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Información</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>Mesero:</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{pedido?.usuarios?.nombre || 'General'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>Apertura:</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{formatearFechaHora(pedido?.created_at)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>Método Pago:</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase' }}>
                                        {pedido?.metodo_pago && (pedido.metodo_pago.startsWith('[') || pedido.metodo_pago.startsWith('{')) ? 'COMPARTIDO' : (pedido?.metodo_pago || '-')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Productos ({items.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {items.map((item, idx) => (
                                    <div key={idx} style={{ 
                                        padding: '14px', 
                                        background: 'white', 
                                        border: '1px solid #f1f5f9', 
                                        borderRadius: '16px',
                                        position: 'relative' 
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                                        {item.cantidad}x {item.producto_nombre}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImprimirIndividual(item);
                                                        }}
                                                        title={item.impreso ? "Re-imprimir este plato" : "Imprimir comanda de este plato"}
                                                        style={{
                                                            border: 'none',
                                                            background: item.impreso ? '#f1f5f9' : '#fff7ed',
                                                            color: item.impreso ? '#94a3b8' : '#f97316',
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Printer size={14} />
                                                    </button>
                                                </div>
                                                {item.agregados?.length > 0 && (
                                                    <div style={{ marginTop: '6px' }}>
                                                        {item.agregados.map((ag, i) => (
                                                            <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: '#10B981', fontWeight: '600' }}>+ {ag.nombre}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#FF6B35' }}>{formatearMoneda(item.subtotal)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totales */}
                        <div style={{ padding: '20px', background: '#1e293b', borderRadius: '20px', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>
                                <span>Subtotal:</span>
                                <span>{formatearMoneda(pedido?.subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', opacity: 0.8 }}>
                                <span>IVA (0%):</span>
                                <span>$0.00</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '22px' }}>
                                <span style={{ fontWeight: '700' }}>TOTAL:</span>
                                <span style={{ fontWeight: '800', color: '#fb923c' }}>{formatearMoneda(pedido?.total)}</span>
                            </div>
                        </div>

                        {/* Zona de Riesgo Pro */}
                        <div style={{ marginTop: '30px', padding: '20px', borderTop: '2px dashed #f1f5f9' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', fontWeight: '800' }}>Zona de Riesgo</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button
                                    onClick={() => { onCambiarEstado(pedido.id, 'anulado'); onClose(); }}
                                    style={{
                                        padding: '12px', borderRadius: '12px', border: '1px solid #fee2e2',
                                        background: '#fef2f2', color: '#ef4444', fontWeight: '700',
                                        fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <AlertCircle size={18} /> Cancelar
                                </button>
                                <button
                                    onClick={handleCerrarCuenta}
                                    disabled={!pedido.pagado}
                                    style={{
                                        padding: '12px', borderRadius: '12px', border: 'none',
                                        background: pedido.pagado ? '#F97316' : '#cbd5e1', color: 'white', fontWeight: '800',
                                        fontSize: '13px', cursor: pedido.pagado ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '8px', boxShadow: pedido.pagado ? '0 4px 6px rgba(249,115,22,0.2)' : 'none'
                                    }}
                                >
                                    <CheckCircle size={18} /> Cerrar Cuenta
                                </button>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => { onEliminar(pedido.id); onClose(); }}
                                    style={{
                                        width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px',
                                        border: '1px solid #f1f5f9', background: 'white', color: '#ef4444',
                                        fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Trash2 size={18} /> Eliminar Pedido
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default ModalPedidoMesa;

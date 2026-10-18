import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { impresorasService } from '../services/impresorasService';
import { imprimirPedidoAutomatico, imprimirAdicionalesAutomatico } from '../services/impresionAutomaticaService';

/**
 * Hook para escuchar nuevos pedidos y adicionales en tiempo real (Supabase Realtime)
 * y enviarlos automáticamente a la impresora configurada mediante QZ Tray.
 */
export const useImpresionAutomatica = (restauranteId, restaurante) => {
    useEffect(() => {
        if (!restauranteId) return;

        const procesarPedidoRealtime = async (pedidoId, intento = 1) => {
            const config = impresorasService.getAutoPrintConfig();
            if (!config || !config.activo) return;

            // Esperar un momento en el primer intento para permitir que los items se hayan insertado en DB
            if (intento === 1) {
                await new Promise((resolve) => setTimeout(resolve, 600));
            }

            try {
                const { data: pedidoCompleto, error } = await supabase
                    .from('pedidos')
                    .select(`
                        *,
                        pedido_items (*)
                    `)
                    .eq('id', pedidoId)
                    .single();

                if (error || !pedidoCompleto) return;

                if ((!pedidoCompleto.pedido_items || pedidoCompleto.pedido_items.length === 0) && intento < 3) {
                    setTimeout(() => procesarPedidoRealtime(pedidoId, intento + 1), 800);
                    return;
                }

                if (!pedidoCompleto.pedido_items || pedidoCompleto.pedido_items.length === 0) return;

                await imprimirPedidoAutomatico(pedidoCompleto, restaurante);
            } catch (err) {
                console.error('Error en procesarPedidoRealtime:', err);
            }
        };

        const procesarAdicionalesRealtime = async (pedidoId) => {
            const config = impresorasService.getAutoPrintConfig();
            if (!config || !config.activo) return;

            await new Promise((resolve) => setTimeout(resolve, 600));

            try {
                const { data: pedidoCompleto, error } = await supabase
                    .from('pedidos')
                    .select(`
                        *,
                        pedido_items (*)
                    `)
                    .eq('id', pedidoId)
                    .single();

                if (error || !pedidoCompleto) return;

                const itemsNuevos = (pedidoCompleto.pedido_items || []).filter(i => !i.impreso);
                if (itemsNuevos.length > 0) {
                    await imprimirAdicionalesAutomatico(pedidoCompleto, itemsNuevos, restaurante);
                }
            } catch (err) {
                console.error('Error procesando adicionales en Realtime:', err);
            }
        };

        // Suscripción Realtime a nuevos pedidos y actualizaciones
        const canal = supabase
            .channel(`autoprint_pedidos_${restauranteId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'pedidos',
                    filter: `restaurante_id=eq.${restauranteId}`
                },
                (payload) => {
                    const nuevoPedidoId = payload?.new?.id;
                    if (!nuevoPedidoId) return;

                    // Si ya fue impreso localmente por el modal de creación, OMITIR INMEDIATAMENTE
                    if (typeof window !== 'undefined' && window.__pedidosProcesadosAuto?.has(nuevoPedidoId)) {
                        return;
                    }

                    // Registrarlo de inmediato para evitar que eventos simultáneos lo tomen dos veces
                    if (typeof window !== 'undefined') {
                        window.__pedidosProcesadosAuto = window.__pedidosProcesadosAuto || new Set();
                        window.__pedidosProcesadosAuto.add(nuevoPedidoId);
                    }

                    const estado = payload?.new?.estado;
                    if (['cancelado', 'anulado'].includes(estado)) return;

                    procesarPedidoRealtime(nuevoPedidoId);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pedidos',
                    filter: `restaurante_id=eq.${restauranteId}`
                },
                (payload) => {
                    // Si el pedido fue actualizado y tiene productos pendientes de impresión
                    if (payload?.new?.tiene_productos_sin_imprimir === true) {
                        procesarAdicionalesRealtime(payload.new.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, [restauranteId, restaurante]);
};

export default useImpresionAutomatica;

// src/modules/pedidos/hooks/usePedidos.js

import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { showToast } from '../../../components/Toast';
import { parseSupabaseTimestamp } from '../utils/pedidoHelpers';
import { liberarMesa } from '../../../services/mesasService';

export const usePedidos = (restauranteId) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items (
            id,
            cantidad,
            precio_unitario,
            subtotal,
            producto_nombre,
            agregados
          ),
          usuarios (
            nombre
          )
        `)
        .eq('restaurante_id', restauranteId)
        .in('estado', ['pendiente', 'preparando', 'listo'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      showToast('Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) return;

      const estadosFinalizados = ['listo', 'entregado', 'cancelado', 'anulado'];
      const esFinalizacion = estadosFinalizados.includes(nuevoEstado);

      let updateData = { estado: nuevoEstado };

      if (esFinalizacion && !pedido.tiempo_preparacion) {
        const inicio = parseSupabaseTimestamp(pedido.created_at);
        const ahora = new Date();
        const tiempoSegundos = Math.floor((ahora - inicio) / 1000);

        updateData.tiempo_preparacion = tiempoSegundos;
        updateData.fecha_finalizacion = ahora.toISOString();
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedidoId);

      if (error) throw error;

      // RELEASE MESA IF TERMINAL STATUS
      const estadosTerminales = ['entregado', 'cancelado', 'anulado'];
      if (estadosTerminales.includes(nuevoEstado)) {
        try {
          const { data: mesaOcupada } = await supabase
            .from('mesas')
            .select('id')
            .eq('pedido_activo_id', pedidoId)
            .maybeSingle();

          if (mesaOcupada) {
            await liberarMesa(mesaOcupada.id);
            showToast('Mesa liberada automáticamente', 'info');
          }
        } catch (releaseError) {
          // console.error('Error liberando mesa automáticamente:', releaseError);
        }
      }

      // Update local state
      if (['entregado', 'cancelado', 'anulado'].includes(nuevoEstado)) {
        // Remove from active list
        setPedidos(prevPedidos => prevPedidos.filter(p => p.id !== pedidoId));
      } else {
        // Update status in list
        setPedidos(prevPedidos =>
          prevPedidos.map(p =>
            p.id === pedidoId ? { ...p, ...updateData } : p
          )
        );
      }

      showToast(`Pedido actualizado a: ${nuevoEstado}`, 'success');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showToast('Error al actualizar estado', 'error');
    }
  };

  const togglePago = async (pedidoId, estadoActual) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ pagado: !estadoActual })
        .eq('id', pedidoId);

      if (error) throw error;

      // Actualización optimista local
      setPedidos(prevPedidos =>
        prevPedidos.map(p =>
          p.id === pedidoId ? { ...p, pagado: !estadoActual } : p
        )
      );

      showToast(estadoActual ? 'Marcado como NO PAGADO' : 'Marcado como PAGADO', 'success');
    } catch (error) {
      console.error('Error actualizando pago:', error);
      showToast('Error al actualizar pago', 'error');
    }
  };

  const eliminarPedido = async (pedidoId) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedidoId);

      if (error) throw error;
      await cargarPedidos();
      showToast('Pedido eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      showToast('Error al eliminar pedido', 'error');
    }
  };

  useEffect(() => {
    if (!restauranteId) return;

    cargarPedidos();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:pedidos')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `restaurante_id=eq.${restauranteId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Check if it matches our active filter
            if (['pendiente', 'preparando', 'listo'].includes(payload.new.estado)) {
              // Fetch to get full relations (items, user) or optimistic add if simple
              // For simplicity and correctness with relations, we reload or fetch single
              cargarPedidos();
            }
          } else if (payload.eventType === 'UPDATE') {
            const nuevoEstado = payload.new.estado;
            const id = payload.new.id;

            // If updated to terminal, remove
            if (['entregado', 'cancelado', 'anulado'].includes(nuevoEstado)) {
              setPedidos(prev => prev.filter(p => p.id !== id));
            } else if (['pendiente', 'preparando', 'listo'].includes(nuevoEstado)) {
              // If updated to active (maybe from something else, or just change), update/add
              // We might need to fetch if it wasn't in list, but standard update:
              setPedidos(prev => {
                const exists = prev.find(p => p.id === id);
                if (exists) {
                  return prev.map(p => p.id === id ? { ...p, ...payload.new } : p);
                } else {
                  // New to list? Reload to be safe with relations
                  cargarPedidos();
                  return prev;
                }
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setPedidos(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restauranteId]);

  return {
    pedidos,
    loading,
    cargarPedidos,
    cambiarEstadoPedido,
    eliminarPedido,
    togglePago
  };
};
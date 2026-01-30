// src/services/pagosService.js

import { supabase } from './supabaseClient';

/**
 * Obtener pagos/ventas finalizadas con filtros
 */
export const obtenerPagos = async (restauranteId, filtros = {}) => {
    try {
        let query = supabase
            .from('pedidos')
            .select(`
        *,
        pedido_items (
          id,
          cantidad,
          precio_unitario,
          subtotal,
          producto_nombre,
          agregados,
          notas
        ),
        usuarios (
          nombre
        )
      `)
            .eq('restaurante_id', restauranteId)
            .in('estado', ['entregado', 'cancelado', 'anulado'])
            .order('fecha_finalizacion', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filtros.fechaInicio && filtros.fechaFin) {
            query = query
                .gte('fecha_finalizacion', filtros.fechaInicio)
                .lte('fecha_finalizacion', filtros.fechaFin);
        }

        if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
            query = query.eq('metodo_pago', filtros.metodoPago);
        }

        if (filtros.tipoServicio && filtros.tipoServicio !== 'todos') {
            query = query.eq('tipo_servicio', filtros.tipoServicio);
        }

        // Limitar resultados
        query = query.limit(filtros.limit || 100);

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error obteniendo pagos:', error);
        return { data: null, error };
    }
};

/**
 * Buscar pago por número de pedido o nombre de cliente
 */
export const buscarPago = async (restauranteId, query) => {
    try {
        const cleanQuery = query.replace('#', '').trim();
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
        *,
        pedido_items (*),
        usuarios (nombre)
      `)
            .eq('restaurante_id', restauranteId)
            .in('estado', ['entregado', 'cancelado', 'anulado'])
            .or(`numero_pedido.ilike.%${cleanQuery}%,cliente_nombre.ilike.%${cleanQuery}%`)
            .limit(20);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error buscando pago:', error);
        return { data: null, error };
    }
};

/**
 * Obtener estadísticas de ventas para un rango de fechas
 */
export const obtenerEstadisticas = async (restauranteId, fechaInicio, fechaFin) => {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('total, metodo_pago, tipo_servicio, propina')
            .eq('restaurante_id', restauranteId)
            .eq('estado', 'entregado')
            .gte('fecha_finalizacion', fechaInicio)
            .lte('fecha_finalizacion', fechaFin);

        if (error) throw error;

        // Calcular estadísticas
        const estadisticas = {
            totalVentas: 0,
            cantidadPedidos: data.length,
            ticketPromedio: 0,
            totalPropinas: 0,
            porMetodoPago: {
                efectivo: 0,
                tarjeta: 0,
                yape: 0,
                plin: 0,
                transferencia: 0,
                otros: 0
            },
            porTipoServicio: {
                mostrador: 0,
                mesa: 0,
                domicilio: 0
            }
        };

        data.forEach(pedido => {
            estadisticas.totalVentas += parseFloat(pedido.total || 0);
            estadisticas.totalPropinas += parseFloat(pedido.propina || 0);

            // Por método de pago
            const metodo = pedido.metodo_pago || 'otros';
            if (estadisticas.porMetodoPago[metodo] !== undefined) {
                estadisticas.porMetodoPago[metodo] += parseFloat(pedido.total || 0);
            } else {
                estadisticas.porMetodoPago.otros += parseFloat(pedido.total || 0);
            }

            // Por tipo de servicio
            const tipo = pedido.tipo_servicio || 'mostrador';
            if (estadisticas.porTipoServicio[tipo] !== undefined) {
                estadisticas.porTipoServicio[tipo] += parseFloat(pedido.total || 0);
            }
        });

        estadisticas.ticketPromedio = estadisticas.cantidadPedidos > 0
            ? estadisticas.totalVentas / estadisticas.cantidadPedidos
            : 0;

        return { data: estadisticas, error: null };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { data: null, error };
    }
};

/**
 * Obtener detalle completo de un pago
 */
export const obtenerDetallePago = async (pedidoId) => {
    try {
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
          agregados,
          notas
        ),
        usuarios (
          id,
          nombre,
          email
        )
      `)
            .eq('id', pedidoId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error obteniendo detalle de pago:', error);
        return { data: null, error };
    }
};

/**
 * Obtener resumen del día actual
 */
export const obtenerResumenDia = async (restauranteId) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const { data: estadisticas } = await obtenerEstadisticas(
            restauranteId,
            hoy.toISOString(),
            manana.toISOString()
        );

        return { data: estadisticas, error: null };
    } catch (error) {
        console.error('Error obteniendo resumen del día:', error);
        return { data: null, error };
    }
};

/**
 * Exportar datos para reporte (preparar datos)
 */
export const prepararDatosExportacion = async (restauranteId, filtros = {}) => {
    try {
        const { data: pagos } = await obtenerPagos(restauranteId, { ...filtros, limit: 1000 });

        if (!pagos) return { data: null, error: { message: 'No hay datos para exportar' } };

        // Formatear datos para exportación
        const datosExportacion = pagos.map(pago => ({
            'Número Pedido': pago.numero_pedido,
            'Fecha': new Date(pago.fecha_finalizacion || pago.created_at).toLocaleString('es-ES'),
            'Cliente': pago.cliente_nombre || 'Sin nombre',
            'Tipo': pago.tipo_servicio || 'mostrador',
            'Mesa': pago.numero_mesa || '-',
            'Subtotal': pago.subtotal,
            'Descuento': pago.descuento || 0,
            'Servicio': pago.cargo_servicio || 0,
            'Embalaje': pago.cargo_embalaje || 0,
            'Propina': pago.propina || 0,
            'IVA': pago.iva || 0,
            'Total': pago.total,
            'Método Pago': pago.metodo_pago || 'efectivo',
            'Estado': pago.estado,
            'Mesero': pago.usuarios?.nombre || '-'
        }));

        return { data: datosExportacion, error: null };
    } catch (error) {
        console.error('Error preparando datos de exportación:', error);
        return { data: null, error };
    }
};

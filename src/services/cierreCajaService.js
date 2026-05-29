// src/services/cierreCajaService.js

import { supabase } from './supabaseClient';
import { obtenerEstadisticas } from './pagosService';

/**
 * Obtener el último cierre de caja
 */
export const obtenerUltimoCierre = async (restauranteId) => {
    try {
        const { data, error } = await supabase
            .from('cierres_caja')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .order('fecha_cierre', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error obteniendo último cierre de caja:', error);
        return { data: null, error };
    }
};

/**
 * Obtener historial de cierres (con filtros)
 */
export const obtenerHistorialCierres = async (restauranteId, filtros = {}) => {
    try {
        let query = supabase
            .from('cierres_caja')
            .select(`
                *,
                usuarios (nombre)
            `)
            .eq('restaurante_id', restauranteId)
            .order('fecha_cierre', { ascending: false });

        if (filtros.fechaInicio && filtros.fechaFin) {
            query = query
                .gte('fecha_cierre', filtros.fechaInicio)
                .lte('fecha_cierre', filtros.fechaFin);
        }

        query = query.limit(filtros.limite || 100);

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error obteniendo historial de cierres:', error);
        return { data: null, error };
    }
};

/**
 * Registrar un nuevo cierre de caja (Inserta un nuevo registro)
 */
export const registrarCierre = async (datosCierre) => {
    try {
        const { data, error } = await supabase
            .from('cierres_caja')
            .insert([datosCierre])
            .select()
            .single();

        if (error) throw error;

        // Disparar envío de correo asíncronamente (Vercel Serverless Function)
        fetch('/api/enviar-cierre-caja', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cierreId: data.id,
                restauranteId: datosCierre.restaurante_id
            })
        }).catch(err => console.error("Error al disparar función de email (Vercel API):", err));

        return { data, error: null };
    } catch (error) {
        console.error('Error registrando cierre de caja:', error);
        return { data: null, error };
    }
};

/**
 * Obtener el resumen de ventas desde la fecha indicada hasta ahora
 */
export const obtenerResumenVentasCaja = async (restauranteId, fechaInicio) => {
    try {
        const fechaFin = new Date().toISOString();
        
        const { data: estadisticas, error } = await obtenerEstadisticas(
            restauranteId,
            fechaInicio,
            fechaFin
        );

        if (error) throw error;

        const resumen = {
            total_efectivo: estadisticas.porMetodoPago.efectivo || 0,
            total_tarjeta: estadisticas.porMetodoPago.tarjeta || 0,
            total_yape: estadisticas.porMetodoPago.yape || 0,
            total_plin: estadisticas.porMetodoPago.plin || 0,
            total_general: estadisticas.totalVentas || 0,
            total_delivery: estadisticas.totalDelivery || 0,
            num_pedidos: estadisticas.cantidadPedidos || 0,
            fecha_fin_calculada: fechaFin
        };

        return { data: resumen, error: null };
    } catch (error) {
        console.error('Error obteniendo resumen para caja:', error);
        return { data: null, error };
    }
};

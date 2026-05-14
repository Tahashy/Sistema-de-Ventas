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
            num_pedidos: estadisticas.cantidadPedidos || 0,
            fecha_fin_calculada: fechaFin
        };

        return { data: resumen, error: null };
    } catch (error) {
        console.error('Error obteniendo resumen para caja:', error);
        return { data: null, error };
    }
};

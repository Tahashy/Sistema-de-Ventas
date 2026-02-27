import { supabase } from './supabaseClient';

/**
 * Obtiene el siguiente correlativo diario para un restaurante.
 * Cuenta cuántos pedidos se han hecho hoy (Lima) y retorna count + 1.
 */
export const obtenerSiguienteCorrelativo = async (restauranteId) => {
    try {
        // Obtenemos el inicio del día en Lima (UTC-5)
        // Calculamos la fecha actual en Lima
        const ahora = new Date();
        const limaOffset = -5;
        const horaLima = new Date(ahora.getTime() + (limaOffset * 60 * 60 * 1000) + (ahora.getTimezoneOffset() * 60 * 1000));

        // Formateamos YYYY-MM-DD del día en Lima
        const fechaLima = horaLima.toISOString().split('T')[0];

        // El inicio del día en Lima (00:00:00) es las 05:00:00 UTC
        const inicioUTC = `${fechaLima}T05:00:00.000Z`;

        const { count, error } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('restaurante_id', restauranteId)
            .gte('created_at', inicioUTC);

        if (error) throw error;

        return (count || 0) + 1;
    } catch (error) {
        console.error('Error obteniendo correlativo:', error);
        return 1; // Fallback a 1
    }
};

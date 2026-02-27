import { supabase } from './supabaseClient';

/**
 * Obtiene el siguiente correlativo diario para un restaurante.
 * Cuenta cuántos pedidos se han hecho hoy (Lima) y retorna count + 1.
 */
export const obtenerSiguienteCorrelativo = async (restauranteId) => {
    try {
        // Obtenemos hoy en Lima
        const hoyLima = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const inicioUTC = new Date(hoyLima + 'T00:00:00').toISOString();

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

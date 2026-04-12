import { supabase } from './supabaseClient';

/**
 * Obtiene el siguiente correlativo diario para un restaurante.
 * Cuenta cuántos pedidos se han hecho hoy (Lima) y retorna count + 1.
 */
export const obtenerSiguienteCorrelativo = async (restauranteId) => {
    try {
        // Obtenemos la fecha actual en la zona horaria de Lima (YYYY-MM-DD)
        const formatter = new Intl.DateTimeFormat('en-CA', { 
            timeZone: 'America/Lima',
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const fechaLima = formatter.format(new Date());

        // El inicio del día en Lima (00:00:00) convertido a UTC
        const inicioUTC = new Date(`${fechaLima}T00:00:00-05:00`).toISOString();

        // Obtenemos el último número de orden del día para evitar problemas si se borraron pedidos
        const { data, error } = await supabase
            .from('pedidos')
            .select('orden_dia')
            .eq('restaurante_id', restauranteId)
            .gte('created_at', inicioUTC)
            .order('orden_dia', { ascending: false })
            .limit(1);

        if (error) throw error;

        const maxOrden = data.length > 0 ? (data[0].orden_dia || 0) : 0;
        return maxOrden + 1;
    } catch (error) {
        console.error('Error obteniendo correlativo:', error);
        return 1; // Fallback a 1
    }
};

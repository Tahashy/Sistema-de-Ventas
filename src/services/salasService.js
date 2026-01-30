// src/services/salasService.js

import { supabase } from './supabaseClient';

/**
 * Obtener todas las salas de un restaurante
 */
export const obtenerSalas = async (restauranteId) => {
    try {
        const { data, error } = await supabase
            .from('salas')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error obteniendo salas:', error);
        return { data: null, error };
    }
};

/**
 * Crear una nueva sala
 */
export const crearSala = async (restauranteId, nombre, orden = 0) => {
    try {
        const { data, error } = await supabase
            .from('salas')
            .insert([
                {
                    restaurante_id: restauranteId,
                    nombre,
                    orden,
                    activo: true
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creando sala:', error);
        return { data: null, error };
    }
};

/**
 * Actualizar una sala existente
 */
export const actualizarSala = async (salaId, datos) => {
    try {
        const { data, error } = await supabase
            .from('salas')
            .update(datos)
            .eq('id', salaId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error actualizando sala:', error);
        return { data: null, error };
    }
};

/**
 * Eliminar (desactivar) una sala
 */
export const eliminarSala = async (salaId) => {
    try {
        // Verificar si la sala tiene mesas asociadas
        const { data: mesas, error: errorMesas } = await supabase
            .from('mesas')
            .select('id')
            .eq('sala_id', salaId)
            .eq('activo', true);

        if (errorMesas) throw errorMesas;

        if (mesas && mesas.length > 0) {
            return {
                data: null,
                error: {
                    message: `No se puede eliminar la sala porque tiene ${mesas.length} mesa(s) asociada(s). Elimina las mesas primero.`
                }
            };
        }

        // Si no tiene mesas, desactivar la sala
        const { data, error } = await supabase
            .from('salas')
            .update({ activo: false })
            .eq('id', salaId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error eliminando sala:', error);
        return { data: null, error };
    }
};

/**
 * Reordenar salas
 */
export const reordenarSalas = async (salas) => {
    try {
        const updates = salas.map((sala, index) =>
            supabase
                .from('salas')
                .update({ orden: index })
                .eq('id', sala.id)
        );

        await Promise.all(updates);
        return { data: true, error: null };
    } catch (error) {
        console.error('Error reordenando salas:', error);
        return { data: null, error };
    }
};

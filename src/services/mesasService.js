// src/services/mesasService.js

import { supabase } from './supabaseClient';

/**
 * Obtener todas las salas con sus mesas
 */
export const getSalas = async (restauranteId) => {
    try {
        // Obtener salas
        const { data: salas, error: salasError } = await supabase
            .from('salas')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (salasError) throw salasError;

        // Obtener mesas para cada sala
        const { data: mesas, error: mesasError } = await supabase
            .from('mesas')
            .select(`
                *,
                mesero:mesero_asignado(id, nombre),
                pedido_activo:pedido_activo_id(id, numero_pedido, total)
            `)
            .in('sala_id', salas.map(s => s.id))
            .eq('activo', true)
            .order('numero_mesa', { ascending: true });

        if (mesasError) throw mesasError;

        // Agrupar mesas por sala
        const salasConMesas = salas.map(sala => ({
            ...sala,
            mesas: mesas.filter(m => m.sala_id === sala.id)
        }));

        return { data: salasConMesas, error: null };
    } catch (error) {
        console.error('Error obteniendo salas:', error);
        return { data: null, error };
    }
};

/**
 * Crear una sala con sus mesas automáticamente
 */
export const createSala = async (restauranteId, nombre, cantidadMesas) => {
    try {
        // Crear la sala
        const { data: sala, error: salaError } = await supabase
            .from('salas')
            .insert([{
                restaurante_id: restauranteId,
                nombre: nombre,
                orden: 0
            }])
            .select()
            .single();

        if (salaError) throw salaError;

        // Crear las mesas automáticamente
        const mesas = [];
        for (let i = 1; i <= cantidadMesas; i++) {
            mesas.push({
                sala_id: sala.id,
                numero_mesa: `Mesa ${i}`
            });
        }

        const { error: mesasError } = await supabase
            .from('mesas')
            .insert(mesas);

        if (mesasError) throw mesasError;

        return { data: sala, error: null };
    } catch (error) {
        console.error('Error creando sala:', error);
        return { data: null, error };
    }
};

/**
 * Actualizar una sala
 */
export const updateSala = async (id, data) => {
    try {
        const { data: sala, error } = await supabase
            .from('salas')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data: sala, error: null };
    } catch (error) {
        console.error('Error actualizando sala:', error);
        return { data: null, error };
    }
};

/**
 * Eliminar una sala (solo si no tiene mesas ocupadas)
 */
export const deleteSala = async (id) => {
    try {
        // Verificar si hay mesas ocupadas
        const { data: mesasOcupadas, error: checkError } = await supabase
            .from('mesas')
            .select('id')
            .eq('sala_id', id)
            .eq('estado', 'ocupada');

        if (checkError) throw checkError;

        if (mesasOcupadas && mesasOcupadas.length > 0) {
            return {
                data: null,
                error: { message: 'No se puede eliminar una sala con mesas ocupadas' }
            };
        }

        // Eliminar la sala (las mesas se eliminan automáticamente por CASCADE)
        const { error } = await supabase
            .from('salas')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { data: true, error: null };
    } catch (error) {
        console.error('Error eliminando sala:', error);
        return { data: null, error };
    }
};

/**
 * Obtener una mesa específica
 */
export const getMesaById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('mesas')
            .select(`
                *,
                sala:sala_id(id, nombre),
                mesero:mesero_asignado(id, nombre),
                pedido_activo:pedido_activo_id(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error obteniendo mesa:', error);
        return { data: null, error };
    }
};

/**
 * Actualizar estado de una mesa
 */
export const updateEstadoMesa = async (id, estado, data = {}) => {
    try {
        const updateData = { estado, ...data };

        const { data: mesa, error } = await supabase
            .from('mesas')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data: mesa, error: null };
    } catch (error) {
        console.error('Error actualizando estado de mesa:', error);
        return { data: null, error };
    }
};

/**
 * Ocupar una mesa (al crear pedido)
 */
export const ocuparMesa = async (mesaId, pedidoId, meseroId) => {
    return updateEstadoMesa(mesaId, 'ocupada', {
        pedido_activo_id: pedidoId,
        mesero_asignado: meseroId,
        hora_inicio: new Date().toISOString()
    });
};

/**
 * Liberar una mesa (al cerrar pedido)
 */
export const liberarMesa = async (mesaId) => {
    return updateEstadoMesa(mesaId, 'disponible', {
        pedido_activo_id: null,
        mesero_asignado: null,
        hora_inicio: null
    });
};

/**
 * Obtener pedido activo de una mesa
 */
export const getPedidoActivoMesa = async (mesaId) => {
    try {
        const { data: mesa, error: mesaError } = await supabase
            .from('mesas')
            .select('pedido_activo_id')
            .eq('id', mesaId)
            .single();

        if (mesaError) throw mesaError;
        if (!mesa.pedido_activo_id) return { data: null, error: null };

        const { data: pedido, error: pedidoError } = await supabase
            .from('pedidos')
            .select(`
                *,
                items:pedido_items(*)
            `)
            .eq('id', mesa.pedido_activo_id)
            .single();

        if (pedidoError) throw pedidoError;
        return { data: pedido, error: null };
    } catch (error) {
        console.error('Error obteniendo pedido activo:', error);
        return { data: null, error };
    }
};

/**
 * Agregar mesa a una sala existente
 */
export const agregarMesa = async (salaId, numeroMesa) => {
    try {
        const { data, error } = await supabase
            .from('mesas')
            .insert([{
                sala_id: salaId,
                numero_mesa: numeroMesa
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error agregando mesa:', error);
        return { data: null, error };
    }
};

/**
 * Actualizar mesa (cambiar nombre)
 */
export const updateMesa = async (mesaId, numeroMesa) => {
    try {
        const { data, error } = await supabase
            .from('mesas')
            .update({ numero_mesa: numeroMesa })
            .eq('id', mesaId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error actualizando mesa:', error);
        return { data: null, error };
    }
};

/**
 * Eliminar mesa (solo si está disponible)
 */
export const eliminarMesa = async (mesaId, force = false) => {
    try {
        if (!force) {
            // Verificar si la mesa está disponible
            const { data: mesa, error: checkError } = await supabase
                .from('mesas')
                .select('estado')
                .eq('id', mesaId)
                .single();

            if (checkError) throw checkError;

            if (mesa.estado === 'ocupada') {
                return {
                    data: null,
                    error: { message: 'Mesa ocupada', code: 'BUSY_TABLE' }
                };
            }
        }

        const { error } = await supabase
            .from('mesas')
            .delete()
            .eq('id', mesaId);

        if (error) throw error;
        return { data: true, error: null };
    } catch (error) {
        console.error('Error eliminando mesa:', error);
        return { data: null, error };
    }
};

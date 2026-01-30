import { supabase } from './supabaseClient';

// --- USUARIOS CRUD ---

export const getUsers = async (restauranteId) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .eq('activo', true);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export const createUser = async (userData) => {
    try {
        // En un caso real, la contraseña debería hashearse en backend o edge function.
        // Aquí se asume texto plano según AuthContext actual (simple demo).
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                ...userData,
                activo: true,
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        // Soft delete
        const { error } = await supabase
            .from('usuarios')
            .update({ activo: false })
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// --- CONFIGURACION GENERAL ---

export const getRestaurantInfo = async (restauranteId) => {
    try {
        const { data, error } = await supabase
            .from('restaurantes')
            .select('*')
            .eq('id', restauranteId)
            .single();

        if (error) throw error;
        return data; // Ahora devuelve todas las columnas nuevas
    } catch (error) {
        console.error('Error fetching restaurant info:', error);
        return null;
    }
};

export const updateRestaurantInfo = async (id, data) => {
    try {
        const { error } = await supabase
            .from('restaurantes')
            .update(data)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating restaurant info:', error);
        throw error;
    }
};

// --- HORARIOS ---

export const getSchedules = async (restauranteId) => {
    try {
        const { data, error } = await supabase.rpc('obtener_horarios', {
            p_restaurante_id: restauranteId
        });

        if (error) throw error;

        // Si no hay horarios (primera vez), devolver estructura default
        if (!data || data.length === 0) {
            return [
                { dia: 'Lunes', abierto: true, inicio: '09:00', fin: '22:00' },
                { dia: 'Martes', abierto: true, inicio: '09:00', fin: '22:00' },
                { dia: 'Miércoles', abierto: true, inicio: '09:00', fin: '22:00' },
                { dia: 'Jueves', abierto: true, inicio: '09:00', fin: '22:00' },
                { dia: 'Viernes', abierto: true, inicio: '09:00', fin: '23:00' },
                { dia: 'Sábado', abierto: true, inicio: '09:00', fin: '23:00' },
                { dia: 'Domingo', abierto: true, inicio: '09:00', fin: '22:00' }
            ];
        }

        // Ordenar días
        const ordenDias = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7 };
        return data.sort((a, b) => ordenDias[a.dia] - ordenDias[b.dia]);

    } catch (error) {
        console.error('Error fetching schedules:', error);
        return [];
    }
};

export const saveSchedules = async (restauranteId, schedules) => {
    try {
        const { error } = await supabase.rpc('guardar_horarios', {
            p_restaurante_id: restauranteId,
            p_horarios: schedules
        });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving schedules:', error);
        throw error;
    }
};

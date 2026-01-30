import { supabase } from './supabaseClient';

export const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        // 1. Verificar contraseña actual fetching the user
        const { data: user, error: fetchError } = await supabase
            .from('usuarios')
            .select('password')
            .eq('id', userId)
            .single();

        if (fetchError || !user) throw new Error('Usuario no encontrado');

        if (user.password !== currentPassword) {
            throw new Error('La contraseña actual es incorrecta');
        }

        // 2. Actualizar contraseña
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ password: newPassword })
            .eq('id', userId);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: error.message };
    }
};

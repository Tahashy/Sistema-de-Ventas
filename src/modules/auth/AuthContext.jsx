import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setRestauranteContext } from '../../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurante, setRestaurante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('user');
    const savedRestaurante = localStorage.getItem('restaurante');

    if (savedUser && savedRestaurante) {
      setUser(JSON.parse(savedUser));
      setRestaurante(JSON.parse(savedRestaurante));
      setRestauranteContext(JSON.parse(savedRestaurante).id);
    }

    setLoading(false);
  }, []);

  const login = async (email, password, restauranteId) => {
    try {
      // Buscar usuario con email, password y restaurante
      const { data: usuarios, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password) // ⬅️ VALIDAR CONTRASEÑA
        .eq('restaurante_id', restauranteId)
        .eq('activo', true)
        .single();

      if (userError || !usuarios) {
        throw new Error('Credenciales incorrectas o usuario inactivo');
      }

      // Buscar restaurante
      const { data: rest, error: restError } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', restauranteId)
        .eq('activo', true)
        .single();

      if (restError || !rest) {
        throw new Error('Restaurante no encontrado o inactivo');
      }

      // Establecer contexto
      await setRestauranteContext(restauranteId);

      // Guardar en estado y localStorage
      setUser(usuarios);
      setRestaurante(rest);
      localStorage.setItem('user', JSON.stringify(usuarios));
      localStorage.setItem('restaurante', JSON.stringify(rest));
      localStorage.setItem('restaurante_id', restauranteId);

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setRestaurante(null);
    localStorage.removeItem('user');
    localStorage.removeItem('restaurante');
    localStorage.removeItem('restaurante_id');
  };

  const refreshRestaurant = async () => {
    try {
      if (!restaurante?.id) return;

      const { data: rest, error } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', restaurante.id)
        .single();

      if (error || !rest) throw error || new Error('No data');

      setRestaurante(rest);
      localStorage.setItem('restaurante', JSON.stringify(rest));
      return true;
    } catch (e) {
      console.error('Error refreshing restaurant:', e);
      return false;
    }
  };

  const value = {
    user,
    restaurante,
    loading,
    login,
    logout,
    refreshRestaurant,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
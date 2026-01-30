import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Función para establecer el restaurante actual
export const setRestauranteContext = async (restauranteId) => {
  const { error } = await supabase.rpc('set_current_restaurante', {
    restaurante_id: restauranteId
  })
  if (error) console.error('Error setting context:', error)
  return !error
}

// Función para verificar contexto
export const getCurrentRestaurante = () => {
  return localStorage.getItem('restaurante_id')
}
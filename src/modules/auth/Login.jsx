import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from './AuthContext';
import { Utensils, Mail, Building2, AlertCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restauranteId, setRestauranteId] = useState('');
  const [restaurantes, setRestaurantes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRestaurantes, setLoadingRestaurantes] = useState(true);
  
  const { login } = useAuth();

  useEffect(() => {
    cargarRestaurantes();
  }, []);

  const cargarRestaurantes = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurantes')
        .select('id, nombre, plan')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setRestaurantes(data || []);
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
      setError('Error al cargar restaurantes');
    } finally {
      setLoadingRestaurantes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !restauranteId) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    
    const result = await login(email, password, restauranteId);
    
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
    
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-container {
          animation: fadeIn 0.6s ease-out;
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 24px !important;
            margin: 16px !important;
          }
          
          .login-title {
            font-size: 24px !important;
          }
          
          .logo-circle {
            width: 60px !important;
            height: 60px !important;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 20px !important;
          }
          
          .credentials-box {
            font-size: 12px !important;
            padding: 12px !important;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Imagen de fondo con overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/fondoLogin.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px)',
          transform: 'scale(1.1)',
          zIndex: 0
        }} />
        
        {/* Overlay oscuro */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1
        }} />

        {/* Card de Login */}
        <div 
          className="login-container"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '400px'
          }}
        >
          <div 
            className="login-card"
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              padding: '20px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div 
                className="logo-circle"
                style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(255,107,53,0.4)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              >
                <Utensils size={32} color="white" />
              </div>
              <h1 
                className="login-title"
                style={{ 
                  fontSize: '28px', 
                  margin: '0 0 8px 0',
                  fontWeight: '700',
                  color: '#1a202c',
                  letterSpacing: '-0.5px'
                }}
              >
                Sistema de Gestión
              </h1>
              <p style={{ 
                color: '#718096', 
                margin: 0,
                fontSize: '15px'
              }}>
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              {/* Restaurante */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#2d3748',
                  fontSize: '14px'
                }}>
                  <Building2 size={16} style={{ 
                    display: 'inline', 
                    marginRight: '6px',
                    verticalAlign: 'middle'
                  }} />
                  Restaurante
                </label>
                
                {loadingRestaurantes ? (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: '#718096',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f7fafc'
                  }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: '8px' }}>Cargando...</span>
                  </div>
                ) : (
                  <select
                    value={restauranteId}
                    onChange={(e) => setRestauranteId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF6B35';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Selecciona un restaurante</option>
                    {restaurantes.map(rest => (
                      <option key={rest.id} value={rest.id}>
                        {rest.nombre} • {rest.plan.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#2d3748',
                  fontSize: '14px'
                }}>
                  <Mail size={16} style={{ 
                    display: 'inline', 
                    marginRight: '6px',
                    verticalAlign: 'middle'
                  }} />
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FF6B35';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Contraseña */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#2d3748',
                  fontSize: '14px'
                }}>
                  <Lock size={16} style={{ 
                    display: 'inline', 
                    marginRight: '6px',
                    verticalAlign: 'middle'
                  }} />
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF6B35';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#718096',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#FF6B35'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#718096'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#FEE2E2',
                  color: '#991B1B',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading || loadingRestaurantes}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(255,107,53,0.3)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(255,107,53,0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255,107,53,0.3)';
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
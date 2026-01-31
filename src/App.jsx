import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import Login from './modules/auth/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './modules/dashboard/Dashboard';
import Productos from './modules/productos/Productos';
import Pedidos from './modules/pedidos/Pedidos';
import Toast from './components/Toast';
import Pagos from './modules/caja/Pagos';
import Informes from './modules/informes/Informes';
import Configuracion from './modules/configuracion/Configuracion';
import useWindowSize from './hooks/useWindowSize';
import { LanguageProvider } from './modules/configuracion/LanguageContext';

// Route configuration
const routes = [
  { path: '/', name: 'panel', element: Dashboard },
  { path: '/pedidos', name: 'pedidos', element: Pedidos },
  { path: '/productos', name: 'productos', element: Productos },
  { path: '/pagos', name: 'pagos', element: Pagos },
  { path: '/informes', name: 'informes', element: Informes },
  { path: '/configuracion', name: 'configuracion', element: Configuracion },
];

function AppLayout() {
  const { isAuthenticated, user, restaurante, logout } = useAuth();
  const { isDesktop } = useWindowSize();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openNewOrderModal, setOpenNewOrderModal] = useState(false);

  // Get active section from current path
  const getActiveSection = () => {
    const route = routes.find(r => r.path === location.pathname);
    return route ? route.name : 'panel';
  };

  // Close sidebar on desktop
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle logout redirect
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleNuevoPedido = () => {
    navigate('/pedidos');
    setOpenNewOrderModal(true);
  };

  const handleSetActiveSection = (section) => {
    const route = routes.find(r => r.name === section);
    if (route) {
      navigate(route.path);
    }
  };

  return (
    <>
      <Toast />
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f7fafc',
        position: 'relative'
      }}>
        <Sidebar
          activeSection={getActiveSection()}
          setActiveSection={handleSetActiveSection}
          onLogout={logout}
          user={user}
          isAdmin={user.rol === 'admin'}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div
          className="main-content"
          style={{
            marginLeft: isDesktop ? '260px' : 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: isDesktop ? 'calc(100% - 260px)' : '100%',
            transition: 'margin-left 0.3s ease, width 0.3s ease'
          }}
        >
          <Navbar
            restaurante={restaurante}
            onNuevoPedido={handleNuevoPedido}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setSidebarOpen={setSidebarOpen}
          />

          <main style={{
            marginTop: '70px',
            flex: 1,
            minHeight: 'calc(100vh - 70px)',
            width: '100%',
            overflowX: 'hidden'
          }}>
            <Routes>
              <Route
                path="/"
                element={<Dashboard restauranteId={restaurante.id} />}
              />
              <Route
                path="/pedidos"
                element={
                  <Pedidos
                    restauranteId={restaurante.id}
                    restaurante={restaurante}
                    userId={user.id}
                    isAdmin={user.rol === 'admin'}
                    openNewOrderModal={openNewOrderModal}
                    setOpenNewOrderModal={setOpenNewOrderModal}
                  />
                }
              />
              <Route
                path="/productos"
                element={<Productos restauranteId={restaurante.id} isAdmin={user.rol === 'admin'} />}
              />
              <Route
                path="/pagos"
                element={<Pagos restauranteId={restaurante.id} />}
              />
              <Route
                path="/informes"
                element={<Informes restauranteId={restaurante.id} />}
              />
              <Route
                path="/configuracion"
                element={<Configuracion restauranteId={restaurante.id} />}
              />
              {/* Redirect unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppLayout />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Bot } from 'lucide-react';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Confirm from './pages/Confirm';
import Dashboard from './pages/Dashboard';
import Reservas from './pages/Reservas';
import Mesas from './pages/Mesas';
import Clientes from './pages/Clientes';
import Analytics from './pages/Analytics';
import Configuracion from './pages/Configuracion';
import Comunicacion from './pages/Comunicacion';
import Calendario from './pages/Calendario';

// Componentes
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { isAuthenticated, isReady, user } = useAuthContext();

  console.log('🎯 AppContent render:', {
    isAuthenticated,
    isReady,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });

  // Mostrar loading solo si realmente no está listo
  if (!isReady) {
    console.log('❌ App not ready, showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">La-IA</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  console.log('✅ App ready, rendering router...');

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
        />
        <Route path="/confirm" element={<Confirm />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas protegidas con Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservas"
          element={
            <ProtectedRoute>
              <Layout>
                <Reservas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesas"
          element={
            <ProtectedRoute>
              <Layout>
                <Mesas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <Layout>
                <Clientes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Layout>
                <Configuracion />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comunicacion"
          element={
            <ProtectedRoute>
              <Layout>
                <Comunicacion />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              <Layout>
                <Calendario />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route
          path="/"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/login" replace />
          }
        />

        {/* Catch all - redirigir a dashboard o login */}
        <Route
          path="*"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/login" replace />
          }
        />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default function App() {
  console.log('🚀 App component rendering...');

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
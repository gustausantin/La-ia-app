import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider, useAuthContext } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Confirm from './pages/Confirm';
import Dashboard from './pages/Dashboard';
import Reservas from './pages/Reservas';
import Mesas from './pages/Mesas';
import Clientes from './pages/Clientes';
import Comunicacion from './pages/Comunicacion';
import Analytics from './pages/Analytics';
import Calendario from './pages/Calendario';
import Configuracion from './pages/Configuracion';

// Styles
import './index.css';

function AppContent() {
  const { isAuthenticated, isReady, user } = useAuthContext();

  console.log('🎯 AppContent render:', {
    isAuthenticated,
    isReady,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });

  // Si no está listo, mostrar loading
  if (!isReady) {
    console.log('❌ App not ready, showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Iniciando La-IA...</h2>
          <p className="text-sm text-gray-500">Configurando tu experiencia</p>
        </div>
      </div>
    );
  }

  console.log('✅ App ready, rendering router...');

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        } />
        <Route path="/confirm" element={<Confirm />} />

        {/* Rutas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="mesas" element={<Mesas />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="comunicacion" element={<Comunicacion />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        {/* Ruta catch-all */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
}

export default function App() {
  console.log('🚀 App component rendering...');

  useEffect(() => {
    console.log('🚀 Starting React application...');
    console.log('✅ React app rendered');
    return () => {
      console.log('🔄 React application unmounting...');
    };
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
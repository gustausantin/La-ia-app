import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Bot, RefreshCw, AlertCircle } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const {
    isReady,
    isAuthenticated,
    user
  } = useAuthContext();

  // Mostrar loading mientras se inicializa la autenticación
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificando acceso...</h2>
          <p className="text-sm text-gray-500">Un momento por favor</p>
        </div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Renderizar la aplicación protegida
  return children;
};

export default ProtectedRoute;
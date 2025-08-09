import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Bot, RefreshCw, AlertCircle } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const {
    isReady,
    isAuthenticated,
    user,
    loadingRestaurant,
    restaurantInfo,
    retryAttempts,
    handleRetry
  } = useAuthContext();

  // Mostrar loading mientras se inicializa la autenticación
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg font-medium mb-2">Iniciando La-IA...</p>
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Mostrar loading del restaurante
  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Cargando tu restaurante...
          </h2>
          <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-600 text-sm">
            Preparando tu panel de control...
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay restaurante después de todos los intentos
  if (!restaurantInfo && retryAttempts === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error cargando el restaurante
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            No pudimos cargar la información de tu restaurante. Por favor, intenta de nuevo o contacta con soporte.
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar la aplicación protegida
  return children;
};

export default ProtectedRoute;
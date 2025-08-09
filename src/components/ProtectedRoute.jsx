
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Bot, AlertCircle } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    restaurantInfo, 
    loadingRestaurant,
    loadRestaurantInfo 
  } = useAuthContext();

  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    let timer;
    if (loadingRestaurant) {
      timer = setTimeout(() => setShowTip(true), 3000);
    } else {
      setShowTip(false);
    }
    return () => clearTimeout(timer);
  }, [loadingRestaurant]);

  const handleRetry = async () => {
    if (retryAttempts >= 3 || !user?.id) return;
    
    setIsRetrying(true);
    setRetryAttempts(prev => prev + 1);
    
    try {
      await loadRestaurantInfo(user.id);
    } catch (error) {
      console.error('Error en retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Mostrar loading mientras se inicializa
  if (loading) {
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

          {showTip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium mb-2">💡 Tip:</p>
              <p>Estamos configurando tu restaurante por primera vez. Esto puede tardar unos segundos.</p>
            </div>
          )}

          {retryAttempts > 0 && retryAttempts < 3 && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {isRetrying ? 'Reintentando...' : 'Reintentar'}
            </button>
          )}

          {retryAttempts >= 3 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-700">
                No se pudo cargar el restaurante. Intenta recargar la página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Recargar página
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si no hay info del restaurante después de cargar, mostrar error
  if (!restaurantInfo && !loadingRestaurant && retryAttempts === 0) {
    // Intentar cargar automáticamente una vez
    setTimeout(() => handleRetry(), 100);
  }

  // Renderizar la aplicación
  return children;
}

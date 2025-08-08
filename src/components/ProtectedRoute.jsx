
import { useAuthContext } from '../contexts/AuthContext';
import { Bot, ChefHat, Sparkles, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { user, restaurant, isLoading, isReady, isAuthenticated, error, refreshRestaurant } = useAuthContext();
  const [showTip, setShowTip] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Mostrar tip después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Función para manejar reintentos
  const handleRetry = async () => {
    if (retryAttempts >= 3) return;
    
    setIsRetrying(true);
    try {
      await refreshRestaurant();
      setRetryAttempts(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error en retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Si no está listo, mostrar pantalla de carga
  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto animate-pulse">
              <Bot className="w-10 h-10 text-purple-600" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cargando La-IA...
          </h2>
          <p className="text-gray-600 mb-6">
            Preparando tu asistente inteligente
          </p>

          {user && !restaurant && (
            <>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <ChefHat className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Cargando tu restaurante...</span>
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
            </>
          )}
        </div>
      </div>
    );
  }

  // Si hay error de autenticación
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está todo bien, mostrar el contenido
  return children;
}

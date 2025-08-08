
import { useAuthContext } from '../contexts/AuthContext';
import { Bot, ChefHat, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, restaurant, isLoading, isReady, isAuthenticated, refreshRestaurant } = useAuthContext();
  const [showTip, setShowTip] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  // Mostrar tip después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Intentar recargar restaurante si el usuario está autenticado pero no tiene restaurante
  useEffect(() => {
    if (isReady && isAuthenticated && user && !restaurant && retryCount < 3) {
      console.log(`🔄 Reintentando cargar restaurante (intento ${retryCount + 1})`);
      setRestaurantLoading(true);
      
      const timer = setTimeout(async () => {
        try {
          await refreshRestaurant();
          setRetryCount(prev => prev + 1);
        } catch (error) {
          console.error('❌ Error en retry:', error);
        } finally {
          setRestaurantLoading(false);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isReady, isAuthenticated, user, restaurant, retryCount, refreshRestaurant]);

  // Mostrar pantalla de carga mientras se inicializa
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Bot className="w-12 h-12 text-white animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cargando La-IA...
          </h2>
          
          <p className="text-gray-600 mb-6">
            Preparando tu asistente virtual
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // Usuario no autenticado
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mb-6 border border-white/30">
            <Bot className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Acceso Restringido
          </h1>
          
          <p className="text-blue-100 mb-8">
            Necesitas iniciar sesión para acceder al panel de control de La-IA
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full px-6 py-3 bg-white text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg"
            >
              Iniciar Sesión
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-white/10 backdrop-blur-lg text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              Volver al Inicio
            </button>
          </div>

          <p className="text-sm text-blue-200 mt-6">
            ¿No tienes cuenta? Contacta con nosotros para una demo gratuita
          </p>
        </div>

        <div className="absolute bottom-8 right-8 opacity-20">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">La-IA</span>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado pero sin restaurante
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
            <ChefHat className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {restaurantLoading ? 'Cargando tu restaurante...' : 'Configuración Pendiente'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {restaurantLoading 
              ? 'Estamos preparando todo para ti...' 
              : retryCount >= 3 
                ? 'No se pudo cargar los datos del restaurante. Por favor, verifica tu configuración.'
                : 'Necesitas completar la configuración de tu restaurante.'
            }
          </p>

          {restaurantLoading ? (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full animate-loading-bar"></div>
            </div>
          ) : retryCount < 3 ? (
            <button
              onClick={() => {
                setRetryCount(0);
                refreshRestaurant();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Reintentar Carga
            </button>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Recargar Página
              </button>
              <button
                onClick={() => window.location.href = '/register'}
                className="w-full px-6 py-3 border border-orange-300 text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition-all duration-200"
              >
                Completar Registro
              </button>
            </div>
          )}

          {showTip && !restaurantLoading && (
            <div className="animate-fade-in bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-orange-900 font-medium">¿Necesitas ayuda?</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Contacta con soporte si tienes problemas con la configuración inicial.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Usuario autenticado con restaurante - mostrar contenido
  return children;
}

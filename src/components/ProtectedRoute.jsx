// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Bot, 
  Shield, 
  Lock, 
  ChefHat,
  Sparkles,
  AlertCircle,
  Coffee,
  Clock
} from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading, restaurant } = useAuthContext();
  const location = useLocation();
  const [loadingMessage, setLoadingMessage] = useState('Verificando acceso...');
  const [showTip, setShowTip] = useState(false);

  // Mensajes de carga rotativos para hacer la espera más amena
  const loadingMessages = [
    { text: "Verificando acceso...", icon: Shield },
    { text: "Preparando tu panel de control...", icon: ChefHat },
    { text: "Activando el agente IA...", icon: Bot },
    { text: "Cargando las reservas del día...", icon: Clock },
    { text: "Casi listo...", icon: Coffee }
  ];

  useEffect(() => {
    if (loading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex].text);
      }, 2000);

      // Mostrar tip después de 3 segundos
      const tipTimeout = setTimeout(() => setShowTip(true), 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(tipTimeout);
      };
    }
  }, [loading]);

  // Estado de carga mejorado
  if (loading) {
    const currentMessage = loadingMessages.find(msg => msg.text === loadingMessage) || loadingMessages[0];
    const Icon = currentMessage.icon;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-md mx-auto p-8">
          {/* Logo animado */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto relative">
              {/* Círculo exterior animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-40 animate-ping animation-delay-200"></div>

              {/* Icono central */}
              <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <Icon className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Mensaje de carga */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2 transition-all duration-500">
            {loadingMessage}
          </h3>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-loading-bar"></div>
          </div>

          {/* Tip opcional */}
          {showTip && (
            <div className="animate-fade-in bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-blue-900 font-medium">¿Sabías que?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    El agente IA de Son-IA puede gestionar hasta 100 reservas simultáneas 
                    por WhatsApp, llamadas y redes sociales.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Usuario no autenticado - Diseño mejorado
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-float-delayed"></div>
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 text-center max-w-lg mx-auto p-8">
          {/* Icono de bloqueo */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
              <Lock className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Mensaje principal */}
          <h2 className="text-4xl font-bold text-white mb-4">
            Acceso Restringido
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Necesitas iniciar sesión para acceder al panel de control de La-IA
          </p>

          {/* Características */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
              <Bot className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <p className="text-sm text-white">Agente IA 24/7</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
              <ChefHat className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <p className="text-sm text-white">Gestión Total</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Iniciar Sesión</span>
              <Sparkles className="w-5 h-5" />
            </button>

            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-white/10 backdrop-blur-lg text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              Volver al Inicio
            </button>
          </div>

          {/* Información adicional */}
          <p className="text-sm text-blue-200 mt-6">
            ¿No tienes cuenta? Contacta con nosotros para una demo gratuita
          </p>
        </div>

        {/* Marca de agua del logo */}
        <div className="absolute bottom-8 right-8 opacity-20">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">Son-IA</span>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado pero posiblemente sin restaurante configurado
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
            <ChefHat className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Configuración Requerida
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas configurar tu restaurante antes de continuar
          </p>

          <button 
            onClick={() => window.location.href = '/configuracion'}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Configurar Restaurante
          </button>
        </div>
      </div>
    );
  }

  // Todo OK - Renderizar children
  return children;
}

// Estilos CSS necesarios (agregar a tu archivo de estilos globales)
const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(-10deg); }
}

@keyframes loading-bar {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
}

.animate-loading-bar {
  animation: loading-bar 3s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animation-delay-200 {
  animation-delay: 200ms;
}
`;
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Bot, RefreshCw } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <Bot className="w-12 h-12 text-purple-600 mr-2" />
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700">
        Verificando acceso...
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        Son-IA está validando tus permisos
      </p>
    </div>
  </div>
);

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated } = useAuthContext();

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

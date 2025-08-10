// App.jsx - Aplicación principal mejorada para La-IA
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { AuthProvider, useAuthContext, initSession } from "./contexts/AuthContext";
import { Toaster } from 'react-hot-toast';
import NotificationCenter from './components/NotificationCenter';
import { Bot, RefreshCw } from "lucide-react";
import { supabase } from "./lib/supabase";

// Lazy loading para optimización
const Layout = lazy(() => import("./components/Layout"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Confirm = lazy(() => import("./pages/Confirm.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Reservas = lazy(() => import("./pages/Reservas"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Mesas = lazy(() => import("./pages/Mesas"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Comunicacion = lazy(() => import("./pages/Comunicacion"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Configuracion = lazy(() => import("./pages/Configuracion"));

// Componente de carga mejorado
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <Bot className="w-12 h-12 text-purple-600 mr-2" />
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700">
        Cargando La-IA...
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        Tu asistente IA está preparando todo
      </p>
    </div>
  </div>
);

// Componente de fallback para Suspense
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
      <p className="text-gray-600">Cargando página...</p>
    </div>
  </div>
);

// Componente de rutas protegidas
function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated } = useAuthContext();

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente de prueba para verificar la inicialización
function InitializationTest() {
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('🚀 Iniciando prueba de inicialización...');
        
        // 1) Usuario
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          console.error('Error obteniendo usuario:', authErr);
          setError(authErr.message);
        }
        const uid = authData?.user?.id || null;
        setAuthUserId(uid);
        console.log('👤 Usuario autenticado:', uid ? 'Sí' : 'No');

        // 2) Inicializa sesión + restaurante
        if (uid) {
          console.log('🏪 Inicializando sesión y restaurante...');
          const { user, restaurant } = await initSession();
          setRestaurant(restaurant || null);
          console.log('✅ Restaurante cargado:', restaurant?.name || 'Ninguno');
        }
      } catch (e) {
        console.error("❌ Error en initSession:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Probando inicialización...
          </h2>
          <p className="text-gray-600 text-sm">
            Verificando función RPC...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">La-IA - Prueba de Inicialización</h1>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Estado de Autenticación</h3>
            <p className="text-blue-700">
              Usuario: {authUserId ? `✅ ${authUserId}` : "❌ No logueado"}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Estado del Restaurante</h3>
            <p className="text-green-700">
              Restaurante: {restaurant?.name ? `🏪 ${restaurant.name}` : "❌ Ninguno"}
            </p>
            {restaurant && (
              <div className="mt-2 text-sm text-green-600">
                <p>ID: {restaurant.id}</p>
                <p>Tipo de cocina: {restaurant.cuisine_type || 'No especificado'}</p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">¿Qué debería pasar?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Si ya tenías restaurante vinculado → aparecerá el nombre</li>
              <li>• Si no tenías → se creará automáticamente vía RPC</li>
              <li>• Revisa la consola del navegador para más detalles</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔄 Recargar Prueba
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de rutas principales
function AppRoutes() {
  const { isReady, isAuthenticated } = useAuthContext();

  // MODO PRUEBA: Comentar estas líneas para volver al funcionamiento normal
  // y descomentar el return de abajo
  /*
  return <InitializationTest />;
  */

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Ruta de login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Suspense fallback={<LoadingScreen />}>
              <Login />
            </Suspense>
          )
        }
      />

      {/* Ruta de registro */}
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Suspense fallback={<LoadingScreen />}>
              <Register />
            </Suspense>
          )
        }
      />

      {/* Ruta de confirmación de email - PÚBLICA */}
      <Route
        path="/confirm"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <Confirm />
          </Suspense>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Layout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        {/* Rutas anidadas */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoading />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="reservas"
          element={
            <Suspense fallback={<PageLoading />}>
              <Reservas />
            </Suspense>
          }
        />
        <Route
          path="clientes"
          element={
            <Suspense fallback={<PageLoading />}>
              <Clientes />
            </Suspense>
          }
        />
        <Route
          path="mesas"
          element={
            <Suspense fallback={<PageLoading />}>
              <Mesas />
            </Suspense>
          }
        />
        <Route
          path="calendario"
          element={
            <Suspense fallback={<PageLoading />}>
              <Calendario />
            </Suspense>
          }
        />
        <Route
          path="analytics"
          element={
            <Suspense fallback={<PageLoading />}>
              <Analytics />
            </Suspense>
          }
        />
        <Route
          path="comunicacion"
          element={
            <Suspense fallback={<PageLoading />}>
              <Comunicacion />
            </Suspense>
          }
        />
        <Route
          path="configuracion"
          element={
            <Suspense fallback={<PageLoading />}>
              <Configuracion />
            </Suspense>
          }
        />
      </Route>

      {/* Ruta catch-all */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

// Componente principal App
function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <NotificationCenter />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
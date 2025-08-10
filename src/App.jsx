// App.jsx - Aplicación principal mejorada para La-IA
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
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

// Componente de rutas principales
function AppRoutes() {
  const { isReady, isAuthenticated } = useAuthContext();

  // Test de verificación de auth_user_id
  useEffect(() => {
    if (isReady && isAuthenticated) {
      (async () => {
        const { data: userRes } = await supabase.auth.getUser();
        console.log("AUTH USER →", userRes?.user?.id);

        // 1) Probar mapping con auth_user_id
        const { data: mapping, error: mapErr } = await supabase
          .from("user_restaurant_mapping")
          .select(`
            role,
            permissions,
            restaurant:restaurant_id (*)
          `)
          .eq("auth_user_id", userRes?.user?.id)
          .single();

        console.log("MAPPING →", { mapping, mapErr });

        // 2) Probar notificaciones del restaurante (si hay restaurante)
        const restId = mapping?.restaurant?.id;
        if (restId) {
          const { data: notifs, error: notifErr } = await supabase
            .from("notifications")
            .select("*")
            .eq("restaurant_id", restId)
            .order("created_at", { ascending: false })
            .limit(5);

          console.log("NOTIFS →", { count: notifs?.length || 0, notifErr });
        }
      })();
    }
  }, [isReady, isAuthenticated]);

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
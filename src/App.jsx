// App.jsx - Aplicación principal mejorada para Son-IA

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { Toaster } from 'react-hot-toast';
import NotificationCenter from './components/NotificationCenter';
import { Bot, RefreshCw } from "lucide-react";

// Lazy loading para optimización
const Layout = lazy(() => import("./components/Layout"));
const Login = lazy(() => import("./pages/Login"));
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
        Cargando Son-IA...
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

// Separar la lógica de rutas en su propio componente
function AppRoutes() {
  const { isReady, isAuthenticated } = useAuthContext();

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route element={<Layout />}>
            {/* Ruta por defecto al dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Rutas principales con lazy loading */}
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/reservas"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Reservas />
                </Suspense>
              }
            />
            <Route
              path="/clientes"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Clientes />
                </Suspense>
              }
            />
            <Route
              path="/mesas"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Mesas />
                </Suspense>
              }
            />
            <Route
              path="/calendario"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Calendario />
                </Suspense>
              }
            />
            <Route
              path="/analytics"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Analytics />
                </Suspense>
              }
            />
            <Route
              path="/comunicacion"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Comunicacion />
                </Suspense>
              }
            />
            <Route
              path="/configuracion"
              element={
                <Suspense fallback={<PageLoading />}>
                  <Configuracion />
                </Suspense>
              }
            />
          </Route>

          {/* Redirigir cualquier ruta no válida al dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}

// Componente principal App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
        <Suspense fallback={<LoadingScreen />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
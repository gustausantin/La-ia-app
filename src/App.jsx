
// App.jsx - Aplicación principal mejorada para Son-IA

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useAuthContext } from './contexts/AuthContext';
import { Bot, RefreshCw } from 'lucide-react';

// Debug logging
console.log('🚀 Starting React application...');

// Lazy loading para optimización
const Layout = lazy(() => import('./components/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reservas = lazy(() => import('./pages/Reservas'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Mesas = lazy(() => import('./pages/Mesas'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Comunicacion = lazy(() => import('./pages/Comunicacion'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Configuracion = lazy(() => import('./pages/Configuracion'));

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

// Componente principal de contenido
function AppContent() {
  const { isReady, isAuthenticated, user } = useAuthContext();
  
  // Debug logging
  useEffect(() => {
    console.log('🎯 AppContent render:', {
      isAuthenticated,
      isReady,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, isReady, user]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!isReady) {
    console.log('❌ App not ready, showing loading...');
    return <LoadingScreen />;
  }

  console.log('✅ App ready, rendering router...');

  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
}

function App() {
  console.log('🚀 App component rendering...');

  useEffect(() => {
    console.log('✅ React app rendered');
    
    // Cleanup en unmount
    return () => {
      console.log('🔄 React application unmounting...');
    };
  }, []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

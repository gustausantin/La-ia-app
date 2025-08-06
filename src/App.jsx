// App.jsx - Aplicación principal mejorada para La-IA

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  createBrowserRouter,
  RouterProvider,
  useRoutes // Import useRoutes for potential future use if needed
} from "react-router-dom";
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

// Future flags para evitar warnings
const router = createBrowserRouter(
  [
    // Las rutas se definirán después
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

// Componente de rutas mejorado para el nuevo router
function AppRoutes() {
  const { isReady, isAuthenticated } = useAuthContext();

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!isReady) {
    return <LoadingScreen />;
  }

  // Define las rutas que serán pasadas a createBrowserRouter
  const routeDefinitions = [
    !isAuthenticated ? {
      path: "/login",
      element: <Login />,
    } : {
      path: "/", // A root path to redirect to dashboard if authenticated
      element: <Navigate to="/dashboard" replace />,
    },
    !isAuthenticated && {
      path: "*",
      element: <Navigate to="/login" replace />,
    },
    isAuthenticated && {
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> }, // Default to dashboard
        {
          path: "/dashboard",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Dashboard />
            </Suspense>
          ),
        },
        {
          path: "/reservas",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Reservas />
            </Suspense>
          ),
        },
        {
          path: "/clientes",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Clientes />
            </Suspense>
          ),
        },
        {
          path: "/mesas",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Mesas />
            </Suspense>
          ),
        },
        {
          path: "/calendario",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Calendario />
            </Suspense>
          ),
        },
        {
          path: "/analytics",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Analytics />
            </Suspense>
          ),
        },
        {
          path: "/comunicacion",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Comunicacion />
            </Suspense>
          ),
        },
        {
          path: "/configuracion",
          element: (
            <Suspense fallback={<PageLoading />}>
              <Configuracion />
            </Suspense>
          ),
        },
        {
          path: "*",
          element: <Navigate to="/dashboard" replace />,
        },
      ],
    },
  ].filter(Boolean); // Filter out any null or undefined routes

  // Note: In a real application, you would update the 'router' definition with these routes.
  // For this example, we are demonstrating the structure.
  // The actual implementation requires re-configuring the 'router' constant in the main App component.

  // This component would typically not render anything itself when using createBrowserRouter directly
  // unless it's part of the fallback or error handling.
  // TheRouterProvider in the App component handles the actual routing.
  return null;
}

// Componente principal App
function App() {
  return (
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
      {/* Render the router provided by createBrowserRouter */}
      <RouterProvider router={router} fallbackElement={<LoadingScreen />} />
    </AuthProvider>
  );
}

export default App;
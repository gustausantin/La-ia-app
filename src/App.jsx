// src/App.jsx
import InitializationTest from "./dev/InitializationTest";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { BrowserRouter as Router } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from 'react-hot-toast';

const Login = lazy(() => import("./pages/Login.jsx"));

function TestApp() {
  const { isAuthenticated, isReady } = useAuthContext();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div>Cargando login...</div>}>
        <Login />
      </Suspense>
    );
  }

  // Si está autenticado, mostrar test
  return <InitializationTest />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
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
        <TestApp />
      </Router>
    </AuthProvider>
  );
}
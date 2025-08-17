// index.jsx - Entrada principal mejorada para Son-IA

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Cambiado de App.css a index.css
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { Bot, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";

// Manejar promesas rechazadas globalmente
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevenir que aparezca en consola como error
});

// Manejar errores globales
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

// Error Boundary para capturar errores
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    // Aquí podrías enviar el error a un servicio de monitoreo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Ups! Algo salió mal
            </h1>
            <p className="text-gray-600 mb-6">
              Nuestro agente IA está trabajando para solucionar el problema.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
            >
              Recargar aplicación
            </button>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Detalles del error (solo desarrollo)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading inicial mientras carga la app
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4 animate-float">
        <Bot className="w-10 h-10 text-purple-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Son-IA</h1>
      <p className="text-gray-600">Cargando tu asistente inteligente...</p>
      <div className="mt-4">
        <div className="agent-loader mx-auto"></div>
      </div>
    </div>
  </div>
);

// Configuración mejorada del Toaster
const toasterConfig = {
  position: "top-right",
  reverseOrder: false,
  gutter: 8,
  containerStyle: {
    top: 20,
    right: 20,
  },
  toastOptions: {
    duration: 4000,
    style: {
      background: "#ffffff",
      color: "#1F2937",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      borderRadius: "0.75rem",
      padding: "1rem",
      border: "1px solid #E5E7EB",
    },
    success: {
      duration: 3000,
      icon: <CheckCircle2 className="w-5 h-5" />,
      iconTheme: {
        primary: "#10B981",
        secondary: "#ffffff",
      },
      style: {
        background: "#F0FDF4",
        color: "#166534",
        border: "1px solid #BBF7D0",
      },
    },
    error: {
      duration: 5000,
      icon: <XCircle className="w-5 h-5" />,
      iconTheme: {
        primary: "#EF4444",
        secondary: "#ffffff",
      },
      style: {
        background: "#FEF2F2",
        color: "#991B1B",
        border: "1px solid #FECACA",
      },
    },
    loading: {
      icon: <div className="agent-loader w-5 h-5" />,
      style: {
        background: "#F3F4F6",
        color: "#374151",
      },
    },
    // Custom para notificaciones del agente
    custom: {
      duration: 4000,
      style: {
        background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
        color: "#ffffff",
        border: "none",
      },
    },
  },
  // Configuración para toasts del agente IA
  custom: {
    agent: (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg rounded-lg pointer-events-auto flex`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">Agente IA</p>
              <p className="mt-1 text-sm text-purple-100">{t.message}</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
};

// Configuración de meta tags para PWA
const updateMetaTags = () => {
  // Tema color
  const metaThemeColor = document.querySelector("meta[name=theme-color]");
  if (metaThemeColor) {
    metaThemeColor.content = "#8B5CF6";
  }

  // Descripción
  const metaDescription = document.querySelector("meta[name=description]");
  if (metaDescription) {
    metaDescription.content =
      "Son-IA: Tu recepcionista virtual inteligente 24/7. Gestiona reservas automáticamente por WhatsApp, llamadas y más.";
  }
};

// Renderizar la aplicación
const root = ReactDOM.createRoot(document.getElementById("root"));

// Función para renderizar la app
const renderApp = () => {
  updateMetaTags();
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Renderizar inmediatamente
renderApp();

// Registrar Service Worker para PWA (si existe)
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("SW registrado:", registration);
      })
      .catch((error) => {
        console.log("Error al registrar SW:", error);
      });
  });
}

// Hot Module Replacement para desarrollo
if (import.meta.hot) {
  import.meta.hot.accept();
}

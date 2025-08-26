// components/ErrorBoundary.jsx - Manejo robusto de errores para La-IA

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import logger from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generar ID único para el error
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log del error
    logger.error('Error Boundary capturó un error', {
      error: error.message,
      stack: error.stack,
      errorId,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // En producción, enviar a servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo, errorId);
    }
  }

  reportErrorToService = async (error, errorInfo, errorId) => {
    try {
      // Aquí podrías enviar a Sentry, LogRocket, etc.
    } catch (reportError) {
      logger.error('Error al reportar error', reportError);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    logger.info('Usuario intentó recuperar de error');
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
    logger.info('Usuario navegó al dashboard después de error');
  };

  handleGoBack = () => {
    window.history.back();
    logger.info('Usuario navegó hacia atrás después de error');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icono de Error */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Ups! Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-6">
              Hemos detectado un error inesperado. Nuestro equipo ha sido notificado.
            </p>

            {/* ID del Error */}
            {this.state.errorId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">ID del Error:</p>
                <p className="font-mono text-sm text-gray-700">{this.state.errorId}</p>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de Nuevo
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir al Dashboard
              </button>

              <button
                onClick={this.handleGoBack}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver Atrás
              </button>
            </div>

            {/* Información Técnica (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Ver detalles técnicos
                </summary>
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs font-mono text-red-800 overflow-auto max-h-40">
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                </div>
              </details>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Si el problema persiste, contacta a nuestro soporte técnico
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

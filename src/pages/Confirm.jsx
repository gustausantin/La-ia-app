
import { useState, useEffect } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { Bot, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const confirmAccount = async () => {
      try {
        const token = searchParams.get('confirmation_token');
        
        if (!token) {
          setStatus('error');
          setMessage('Token de confirmación no encontrado en la URL');
          return;
        }

        console.log('Confirmando cuenta con token:', token);

        const { data, error } = await supabase.auth.verifyOtp({
          type: 'email',
          token
        });

        if (error) {
          console.error('Error confirmando cuenta:', error);
          setStatus('error');
          
          if (error.message.includes('expired')) {
            setMessage('El enlace de confirmación ha expirado. Solicita uno nuevo.');
          } else if (error.message.includes('invalid')) {
            setMessage('El enlace de confirmación no es válido.');
          } else {
            setMessage(error.message || 'Error al confirmar la cuenta');
          }
          return;
        }

        if (data?.user) {
          console.log('Cuenta confirmada exitosamente:', data.user);
          setStatus('success');
          setMessage('¡Cuenta confirmada exitosamente!');
          toast.success('¡Cuenta confirmada! Ya puedes acceder a La-IA');
          
          // Iniciar countdown para redirección
          const countdownInterval = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                window.location.href = '/login';
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(countdownInterval);
        } else {
          setStatus('error');
          setMessage('No se pudo confirmar la cuenta');
        }

      } catch (error) {
        console.error('Excepción confirmando cuenta:', error);
        setStatus('error');
        setMessage('Error inesperado al confirmar la cuenta');
      }
    };

    confirmAccount();
  }, [searchParams]);

  // Pantalla de verificación
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-40 animate-ping" style={{ animationDelay: '200ms' }}></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <RefreshCw className="w-12 h-12 text-white animate-spin" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Confirmando tu cuenta...
          </h2>
          <p className="text-gray-600 mb-4">
            Estamos verificando tu email con Supabase
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Cuenta Confirmada! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Tu email ha sido verificado exitosamente
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              Ya puedes acceder a <strong>La-IA</strong>, tu recepcionista virtual inteligente.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Redirigiendo al login en <strong>{countdown}</strong> segundos...
              </p>
            </div>

            <Link
              to="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Bot className="w-4 h-4 mr-2" />
              Acceder a La-IA
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Bot className="w-4 h-4" />
            <span>La-IA - Recepcionista Virtual</span>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-6">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Error de Confirmación
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          No pudimos confirmar tu cuenta
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {message}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/register"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
          >
            <Mail className="w-4 h-4 mr-2" />
            Volver al Registro
          </Link>

          <Link
            to="/login"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Ir al Login
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-xs text-gray-500">
            Si el problema persiste, contacta con soporte
          </p>
        </div>
      </div>
    </div>
  );
}

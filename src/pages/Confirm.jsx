
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bot, CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'email') {
          setStatus('error');
          setMessage('Link de confirmación inválido');
          return;
        }

        console.log('🔄 Confirmando email...');

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          console.error('❌ Error confirmando email:', error);
          setStatus('error');
          setMessage('Error confirmando el email. El link puede haber expirado.');
          return;
        }

        if (data.user) {
          console.log('✅ Email confirmado exitosamente');
          setStatus('success');
          setMessage('¡Email confirmado exitosamente!');
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }

      } catch (error) {
        console.error('❌ Error inesperado:', error);
        setStatus('error');
        setMessage('Error inesperado confirmando el email');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ml-3">
              La-IA
            </h1>
          </div>

          {status === 'loading' && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Confirmando tu email...
              </h2>
              <p className="text-gray-600">
                Por favor espera mientras verificamos tu cuenta
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6 animate-pulse" />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ¡Email Confirmado!
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="flex items-center justify-center text-purple-600">
                <ArrowRight className="w-5 h-5 animate-pulse" />
                <span className="ml-2">Redirigiendo al dashboard...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Error de Confirmación
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Ir al Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Volver a Registro
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

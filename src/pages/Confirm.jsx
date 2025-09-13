// Confirm.jsx - Página para manejar confirmación de email
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function Confirm() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Confirmando tu cuenta...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Obtener tokens de la URL (formato Supabase)
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const token = searchParams.get('token'); // Formato alternativo
        const type = searchParams.get('type');
        // Verificar si tenemos token en formato correcto
        if (!access_token && !token) {
          setStatus('error');
          setMessage('⚠️ Enlace de confirmación inválido. Por favor, solicita un nuevo email de confirmación.');
          return;
        }

        // Usar el token disponible
        const tokenToUse = access_token || token;

        // Usar exchangeCodeForSession para manejar el token de confirmación
        let sessionData, sessionError;
        
        if (access_token && refresh_token) {
          // Si tenemos ambos tokens, establecer sesión directamente
          const result = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          sessionData = result.data;
          sessionError = result.error;
        } else if (tokenToUse) {
          // Si solo tenemos un token, usar verifyOtp
          const result = await supabase.auth.verifyOtp({
            token_hash: tokenToUse,
            type: 'signup'
          });
          sessionData = result.data;
          sessionError = result.error;
        } else {
          throw new Error('No se encontraron tokens válidos');
        }

        if (sessionError) {
          throw sessionError;
        }

        // Verificar que el usuario esté confirmado
        if (!sessionData.user?.email_confirmed_at) {
          throw new Error('Email no confirmado');
        }

        // Verificar si hay registro pendiente
        const pendingData = localStorage.getItem('pendingRegistration');
        
        if (pendingData) {
          const pending = JSON.parse(pendingData);
          
          // Crear restaurante con datos guardados
          const { data: restaurantData, error: restaurantError } = await supabase
            .rpc('create_restaurant_securely', {
              restaurant_data: {
                name: pending.restaurantName,
                email: sessionData.user.email,
                phone: pending.phone,
                city: pending.city,
                address: pending.address,
                postal_code: pending.postalCode,
                cuisine_type: pending.cuisineType,
                plan: "trial",
                active: true
              },
              user_profile: {
                email: sessionData.user.email,
                full_name: pending.restaurantName
              }
            });

          if (restaurantError) {
            throw new Error("Error al crear el restaurante");
          }

          // Limpiar datos temporales
          localStorage.removeItem('pendingRegistration');
        }

        setStatus('success');
        setMessage('🎉 ¡Email confirmado exitosamente! Redirigiendo al dashboard...');
        
        // Forzar actualización del AuthContext enviando evento personalizado
        window.dispatchEvent(new CustomEvent('auth-updated'));
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error) {
        setStatus('error');
        setMessage(`❌ Error al confirmar email: ${error.message}`);
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-16 h-16 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-600" />;
      default:
        return <RefreshCw className="w-16 h-16 text-gray-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${getBackgroundColor()}`}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          {getIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Confirmación de Email
        </h1>
        
        <p className="text-gray-600 mb-6 whitespace-pre-line">
          {message}
        </p>

        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Volver al Login
            </button>
            
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda? Contacta con soporte: support@la-ia.app
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-sm text-gray-500">
            Serás redirigido automáticamente en unos segundos...
          </div>
        )}
      </div>
    </div>
  );
}
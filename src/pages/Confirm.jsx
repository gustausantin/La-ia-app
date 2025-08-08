import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recargarDatosRestaurante } = useAuth();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const confirmarEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'email') {
          throw new Error('Token de confirmación inválido');
        }

        console.log('🔄 Confirmando email...');

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        });

        if (error) {
          console.error('Error confirmando email:', error);
          throw error;
        }

        console.log('✅ Email confirmado');
        setConfirmed(true);
        toast.success('¡Email confirmado exitosamente!');

        // Esperar un momento antes de recargar datos
        setTimeout(async () => {
          console.log('🔄 Recargando datos del restaurante...');
          const exito = await recargarDatosRestaurante();

          if (exito) {
            console.log('✅ Datos recargados, redirigiendo...');
            navigate('/dashboard');
          } else {
            console.log('⚠️ Error recargando datos, redirigiendo a login');
            navigate('/login');
          }
        }, 2000);

      } catch (error) {
        console.error('❌ Error en confirmación:', error);
        setError(error.message);
        toast.error('Error confirmando el email');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    confirmarEmail();
  }, [searchParams, navigate, recargarDatosRestaurante]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Confirmando tu email...</h2>
          <p className="text-gray-600 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de confirmación</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Email confirmado!</h2>
          <p className="text-gray-600 mb-4">Tu cuenta ha sido activada exitosamente</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Cargando tu restaurante...</p>
        </div>
      </div>
    );
  }

  return null;
}
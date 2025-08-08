import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const obtenerDatosUsuario = async (userId, maxIntentos = 3) => {
    console.log(`AuthProvider: Obteniendo datos del usuario (intento 1/${maxIntentos})...`);

    try {
      // Intentar obtener el mapping del usuario
      const { data: mappingData, error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .select('restaurant_id')
        .eq('user_id', userId)
        .single();

      if (mappingError) {
        console.error('Error obteniendo mapping:', mappingError);

        if (mappingError.code === 'PGRST116') {
          // No hay mapping - usuario recién registrado
          console.log('Usuario sin restaurante asignado');
          setRestaurantData(null);
          return true;
        }
        throw mappingError;
      }

      if (!mappingData?.restaurant_id) {
        console.log('Usuario sin restaurante asignado');
        setRestaurantData(null);
        return true;
      }

      // Obtener datos del restaurante
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', mappingData.restaurant_id)
        .single();

      if (restaurantError) {
        console.error('Error obteniendo restaurante:', restaurantError);
        throw restaurantError;
      }

      console.log('✅ Datos del restaurante obtenidos:', restaurantData);
      setRestaurantData(restaurantData);
      return true;

    } catch (error) {
      console.error('Error en obtenerDatosUsuario:', error);
      return false;
    }
  };

  useEffect(() => {
    const inicializarAuth = async () => {
      try {
        console.log('🔄 Inicializando AuthProvider...');

        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error obteniendo sesión:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log('✅ Usuario autenticado:', session.user.email);
          setUser(session.user);

          // Solo intentar obtener datos del restaurante si el usuario está confirmado
          if (session.user.email_confirmed_at) {
            const exito = await obtenerDatosUsuario(session.user.id);
            if (!exito) {
              console.log('⚠️ No se pudieron obtener datos del restaurante');
              setRestaurantData(null);
            }
          } else {
            console.log('⚠️ Usuario no confirmado, no se obtienen datos del restaurante');
            setRestaurantData(null);
          }
        } else {
          console.log('❌ No hay usuario autenticado');
          setUser(null);
          setRestaurantData(null);
        }

      } catch (error) {
        console.error('❌ Error inicializando AuthProvider:', error);
        setUser(null);
        setRestaurantData(null);
      } finally {
        setLoading(false);
        setInitializing(false);
        console.log('✅ AuthProvider inicializado');
      }
    };

    inicializarAuth();

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Cambio de estado de auth:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        if (session.user.email_confirmed_at) {
          await obtenerDatosUsuario(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRestaurantData(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setRestaurantData(null);
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      toast.error('Error cerrando sesión');
    } finally {
      setLoading(false);
    }
  };

  const recargarDatosRestaurante = async () => {
    if (!user) return false;

    setLoading(true);
    try {
      const exito = await obtenerDatosUsuario(user.id);
      return exito;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    restaurantData,
    loading,
    initializing,
    logout,
    recargarDatosRestaurante
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
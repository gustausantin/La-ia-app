import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Flag para controlar si el efecto está en curso
  let isInitializing = false;
  // Flag para manejar desmontaje del componente
  let mounted = false;

  // Función para cargar datos del restaurante con manejo de errores
  const loadRestaurantData = useCallback(async (userId) => {
    if (!userId) {
      console.log('❌ No hay userId para cargar restaurante');
      return null;
    }

    try {
      console.log('🔍 Cargando datos del restaurante para user:', userId);

      // Primero intentar buscar por owner_id
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (restaurantError) {
        console.error('❌ Error buscando por owner_id:', restaurantError);

        // Si hay error, intentar buscar en user_restaurant_mapping
        const { data: mappingData, error: mappingError } = await supabase
          .from('user_restaurant_mapping')
          .select('restaurant_id, restaurants(*)')
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (mappingError) {
          console.error('❌ Error en mapping:', mappingError);
          return null;
        }

        if (mappingData?.restaurants) {
          console.log('✅ Restaurante encontrado via mapping:', mappingData.restaurants);
          return mappingData.restaurants;
        }

        return null;
      }

      if (restaurantData) {
        console.log('✅ Restaurante cargado por owner_id:', restaurantData);
        return restaurantData;
      }

      // Si no encuentra por owner_id, buscar en user_restaurant_mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .select('restaurant_id, restaurants(*)')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (mappingError) {
        console.error('❌ Error en mapping:', mappingError);
        return null;
      }

      if (mappingData?.restaurants) {
        console.log('✅ Restaurante encontrado via mapping:', mappingData.restaurants);
        return mappingData.restaurants;
      }

      console.log('ℹ️ Usuario sin restaurante configurado');
      return null;

    } catch (error) {
      console.error('❌ Error inesperado cargando restaurante:', error);
      return null;
    }
  }, []);

  // Función para manejar la inicialización de la autenticación
  const initializeAuth = useCallback(async () => {
    try {
      console.log('🚀 Inicializando AuthContext...');

      if (!mounted) return;

      // Verificar sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Error obteniendo sesión:', sessionError);
        if (mounted) {
          setError(sessionError.message);
        }
        return;
      }

      if (session?.user && mounted) {
        console.log('✅ Sesión encontrada:', session.user.email);
        setSession(session);
        setUser(session.user);

        // Cargar datos del restaurante
        try {
          const restaurantData = await loadRestaurantData(session.user.id);
          if (mounted) {
            setRestaurant(restaurantData);
          }
        } catch (restaurantError) {
          console.error('❌ Error cargando restaurante:', restaurantError);
          if (mounted) {
            setError('Error cargando datos del restaurante');
          }
        }
      } else {
        console.log('ℹ️ No hay sesión activa');
        if (mounted) {
          setSession(null);
          setUser(null);
          setRestaurant(null);
        }
      }

    } catch (error) {
      console.error('❌ Error en initializeAuth:', error);
      if (mounted) {
        setError(error?.message || 'Error de autenticación');
      }
    }
  }, [mounted, loadRestaurantData]); // Incluir mounted y loadRestaurantData en dependencias

  // Efecto principal para inicializar autenticación y escuchar cambios
  useEffect(() => {
    mounted = true; // Marcar el componente como montado

    console.log('🔄 AuthContext montado, inicializando...');

    // Inicializar autenticación
    const initialize = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('❌ Error en inicialización:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    initialize();

    // Configurar listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('🔄 Cambio de auth:', event);

        try {
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            setError(null);

            // Solo cargar restaurante si cambió el usuario
            if (!user || user.id !== newSession.user.id) {
              try {
                const restaurantData = await loadRestaurantData(newSession.user.id);
                if (mounted) {
                  setRestaurant(restaurantData);
                }
              } catch (restaurantError) {
                console.error('❌ Error cargando restaurante en auth change:', restaurantError);
                if (mounted) {
                  setRestaurant(null);
                }
              }
            }
          } else {
            setSession(null);
            setUser(null);
            setRestaurant(null);
            setError(null);
          }
        } catch (error) {
          console.error('❌ Error en onAuthStateChange:', error);
          if (mounted) {
            setError(error?.message || 'Error en autenticación');
          }
        }
      }
    );

    return () => {
      mounted = false; // Marcar el componente como desmontado
      console.log('🧹 AuthContext desmontado, limpiando listener...');
      subscription.unsubscribe();
    };
  }, [initializeAuth, loadRestaurantData, user]); // Incluir dependencias necesarias

  // Función para refrescar datos del restaurante
  const refreshRestaurant = useCallback(async () => {
    if (!user?.id) return null;

    try {
      setError(null);
      const restaurantData = await loadRestaurantData(user.id);
      setRestaurant(restaurantData);
      return restaurantData;
    } catch (error) {
      console.error('❌ Error refrescando restaurante:', error);
      setError(error.message);
      return null;
    }
  }, [user?.id, loadRestaurantData]);

  // Función de logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRestaurant(null);
      setError(null);
    } catch (error) {
      console.error('❌ Error en logout:', error);
      setError(error.message);
    }
  }, []);

  const value = {
    session,
    user,
    restaurant,
    restaurantId: restaurant?.id || null,
    isLoading,
    isReady,
    error,
    isAuthenticated: !!session,
    agentStatus: { active: true }, // TODO: Conectar con estado real del agente
    refreshRestaurant,
    logout,
    addNotification: (notification) => {
      // TODO: Implementar sistema de notificaciones
      console.log('📢 Notificación:', notification);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
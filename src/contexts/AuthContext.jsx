
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

  // Efecto principal para inicializar autenticación
  useEffect(() => {
    let mounted = true;
    let isInitializing = false;

    const initializeAuth = async () => {
      if (isInitializing) return;
      isInitializing = true;

      try {
        console.log('🚀 Inicializando AuthContext...');

        // Obtener sesión inicial
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError);
          if (mounted) {
            setError(sessionError.message);
            setSession(null);
            setUser(null);
            setRestaurant(null);
          }
          return;
        }

        if (!mounted) return;

        if (initialSession?.user) {
          console.log('✅ Sesión encontrada:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          setError(null);

          // Cargar datos del restaurante
          try {
            const restaurantData = await loadRestaurantData(initialSession.user.id);
            if (mounted) {
              setRestaurant(restaurantData);
            }
          } catch (restaurantError) {
            console.error('❌ Error cargando restaurante:', restaurantError);
            if (mounted) {
              setRestaurant(null);
            }
          }
        } else {
          console.log('ℹ️ No hay sesión activa');
          setSession(null);
          setUser(null);
          setRestaurant(null);
          setError(null);
        }

      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setRestaurant(null);
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
          console.log('✅ AuthContext inicializado');
        }
        isInitializing = false;
      }
    };

    // Ejecutar inicialización
    initializeAuth().catch((error) => {
      console.error('❌ Error en initializeAuth:', error);
      if (mounted) {
        setError(error.message);
        setIsLoading(false);
        setIsReady(true);
      }
    });

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
            setError(error.message);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Removed dependencies to prevent infinite loops

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
    isLoading,
    isReady,
    error,
    isAuthenticated: !!session,
    refreshRestaurant,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

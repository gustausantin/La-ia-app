
import { createContext, useContext, useEffect, useState } from 'react';
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

  // Función para cargar datos del restaurante
  const loadRestaurantData = async (userId) => {
    if (!userId) {
      console.log('❌ No hay userId para cargar restaurante');
      return null;
    }

    try {
      console.log('🔍 Cargando datos del restaurante para user:', userId);
      
      // Primero intentar buscar por owner_id
      let { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      // Si no encuentra por owner_id, buscar en user_restaurant_mapping
      if (!restaurantData && !restaurantError) {
        console.log('🔄 Buscando restaurante via mapping...');
        
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
          restaurantData = mappingData.restaurants;
        }
      } else if (restaurantError) {
        console.error('❌ Error buscando por owner_id:', restaurantError);
        return null;
      }

      if (restaurantData) {
        console.log('✅ Restaurante cargado:', restaurantData);
        return restaurantData;
      } else {
        console.log('ℹ️ Usuario sin restaurante configurado');
        return null;
      }

    } catch (error) {
      console.error('❌ Error cargando restaurante:', error);
      return null;
    }
  };

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
          throw sessionError;
        }

        if (!mounted) return;

        if (initialSession?.user) {
          console.log('✅ Sesión encontrada:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          setError(null);

          // Cargar datos del restaurante
          const restaurantData = await loadRestaurantData(initialSession.user.id);
          if (mounted) {
            setRestaurant(restaurantData);
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
    initializeAuth();

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
              const restaurantData = await loadRestaurantData(newSession.user.id);
              if (mounted) {
                setRestaurant(restaurantData);
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
  }, []);

  // Función para refrescar datos del restaurante
  const refreshRestaurant = async () => {
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
  };

  // Función de logout
  const logout = async () => {
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
  };

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

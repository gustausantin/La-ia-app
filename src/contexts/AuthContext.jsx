
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

  // Función para cargar datos del restaurante
  const loadRestaurantData = async (userId) => {
    if (!userId) {
      console.log('❌ No hay userId para cargar restaurante');
      return null;
    }

    try {
      console.log('🔍 Cargando datos del restaurante para user:', userId);
      
      // Buscar el restaurante del usuario
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (restaurantError) {
        if (restaurantError.code === 'PGRST116') {
          console.log('ℹ️ Usuario sin restaurante configurado');
          return null;
        }
        throw restaurantError;
      }

      console.log('✅ Restaurante cargado:', restaurantData);
      return restaurantData;

    } catch (error) {
      console.error('❌ Error cargando restaurante:', error);
      return null;
    }
  };

  // Función para obtener la sesión inicial
  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('❌ Error obteniendo sesión inicial:', error);
      return null;
    }
  };

  // Efecto principal para inicializar autenticación
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando AuthContext...');
        
        // Obtener sesión inicial
        const initialSession = await getInitialSession();
        
        if (!mounted) return;

        if (initialSession?.user) {
          console.log('✅ Sesión encontrada:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);

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
        }

      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setRestaurant(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
          console.log('✅ AuthContext inicializado');
        }
      }
    };

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

            // Cargar restaurante solo si no lo tenemos o cambió el usuario
            if (!restaurant || restaurant.owner_id !== newSession.user.id) {
              const restaurantData = await loadRestaurantData(newSession.user.id);
              if (mounted) {
                setRestaurant(restaurantData);
              }
            }
          } else {
            setSession(null);
            setUser(null);
            setRestaurant(null);
          }
        } catch (error) {
          console.error('❌ Error en onAuthStateChange:', error);
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
      const restaurantData = await loadRestaurantData(user.id);
      setRestaurant(restaurantData);
      return restaurantData;
    } catch (error) {
      console.error('❌ Error refrescando restaurante:', error);
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
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  const value = {
    session,
    user,
    restaurant,
    isLoading,
    isReady,
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

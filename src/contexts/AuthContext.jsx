import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para cargar información del restaurante
  const loadRestaurantInfo = async (userId) => {
    if (!userId) return null;

    try {
      setLoadingRestaurant(true);

      // Primero buscar el mapeo
      const { data: mapping, error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .select('restaurant_id')
        .eq('user_id', userId)
        .single();

      if (mappingError) {
        console.error('Error buscando mapeo:', mappingError);
        return null;
      }

      if (!mapping?.restaurant_id) {
        console.warn('No se encontró restaurante para el usuario');
        return null;
      }

      // Obtener información del restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', mapping.restaurant_id)
        .single();

      if (restaurantError) {
        console.error('Error cargando restaurante:', restaurantError);
        return null;
      }

      setRestaurantInfo(restaurant);
      return restaurant;

    } catch (error) {
      console.error('Error en loadRestaurantInfo:', error);
      return null;
    } finally {
      setLoadingRestaurant(false);
    }
  };

  // Función de login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);

        // Cargar restaurante
        await loadRestaurantInfo(data.user.id);

        toast.success('¡Bienvenido!');
        return { success: true };
      }

      return { success: false, error: 'Error desconocido' };
    } catch (error) {
      console.error('Error en signIn:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    }
  };

  // Función de logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setRestaurantInfo(null);
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Error en signOut:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  // Inicializar autenticación
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Obtener sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error obteniendo sesión:', error);
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          setIsAuthenticated(true);

          // Cargar restaurante para usuarios autenticados
          await loadRestaurantInfo(session.user.id);
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user);
              setIsAuthenticated(true);
              await loadRestaurantInfo(session.user.id);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setIsAuthenticated(false);
            setRestaurantInfo(null);
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setUser(session.user);
              setIsAuthenticated(true);
            }
            break;

          default:
            break;
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    restaurantInfo,
    loadingRestaurant,
    isAuthenticated,
    signIn,
    signOut,
    loadRestaurantInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
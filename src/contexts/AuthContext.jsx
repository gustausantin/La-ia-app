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
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Función para cargar info del restaurante
  const fetchRestaurantInfo = async (userId) => {
    try {
      console.log('🔍 Fetching restaurant info for user', userId);

      const { data: mappingData, error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .select(`
          role,
          permissions,
          restaurant:restaurant_id (
            id,
            name,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            timezone,
            currency,
            logo_url,
            website,
            active,
            trial_ends_at,
            subscription_status,
            agent_config,
            settings,
            created_at,
            updated_at,
            ui_cuisine_type
          )
        `)
        .eq('auth_user_id', userId)
        .single();

      if (mappingError?.code === 'PGRST116') {
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('*')
          .eq('auth_user_id', userId)
          .single();

        if (restaurantData) {
          setRestaurant(restaurantData);
          setRestaurantId(restaurantData.id);
        }
        return;
      }

      if (mappingData?.restaurant) {
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
    }
  };

  // UN SOLO useEffect que maneja TODO
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');

        // 1. Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            console.log('✅ Session found:', session.user.email);
            setUser(session.user);
            setIsAuthenticated(true);
            await fetchRestaurantInfo(session.user.id);
          } else {
            console.log('❌ No session found');
            setUser(null);
            setIsAuthenticated(false);
            setRestaurant(null);
            setRestaurantId(null);
          }

          // 2. SIEMPRE establecer como listo
          setLoading(false);
          setIsReady(true);
          console.log('✅ Auth ready!');
        }

      } catch (error) {
        console.error('❌ Error in auth init:', error);
        if (mounted) {
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    initializeAuth();

    // 3. Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔐 Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchRestaurantInfo(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // SOLO ejecutar UNA VEZ

  // Login
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('¡Bienvenido de vuelta!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      toast.success('Sesión cerrada correctamente');
      window.location.replace('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const value = {
    user,
    restaurant,
    restaurantId,
    restaurantInfo: restaurant,
    isAuthenticated,
    isReady,
    loading,
    login,
    logout,
    signOut: logout,
    fetchRestaurantInfo,
    // Función dummy para notificaciones
    addNotification: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
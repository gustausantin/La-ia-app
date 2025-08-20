
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

  // Función simple para cargar restaurante
  const loadRestaurant = async (userId) => {
    try {
      // Primero intentar user_restaurant_mapping
      const { data: mappingData } = await supabase
        .from('user_restaurant_mapping')
        .select(`
          restaurant:restaurant_id (
            id, name, email, phone, address, city, 
            postal_code, country, timezone, currency,
            active, trial_ends_at, subscription_status
          )
        `)
        .eq('auth_user_id', userId)
        .single();

      if (mappingData?.restaurant) {
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
        return;
      }

      // Si no, intentar tabla restaurants directa
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (restaurantData) {
        setRestaurant(restaurantData);
        setRestaurantId(restaurantData.id);
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
    }
  };

  // UN SOLO useEffect - SIN DEPENDENCIAS para evitar loops
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Init auth - SIMPLE VERSION');
        
        // Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (session?.user) {
            console.log('✅ User found:', session.user.email);
            setUser(session.user);
            setIsAuthenticated(true);
            await loadRestaurant(session.user.id);
          } else {
            console.log('❌ No user');
            setUser(null);
            setIsAuthenticated(false);
            setRestaurant(null);
            setRestaurantId(null);
          }
          
          // SIEMPRE marcar como listo
          setLoading(false);
          setIsReady(true);
          console.log('✅ Auth ready');
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
        if (isMounted) {
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    initAuth();

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔐 Auth changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadRestaurant(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // SIN DEPENDENCIAS - solo se ejecuta UNA VEZ

  // Login simple
  const login = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    }
  };

  // Logout simple
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sesión cerrada');
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    restaurant,
    restaurantId,
    isAuthenticated,
    isReady,
    loading,
    login,
    logout,
    // Funciones dummy para compatibilidad
    addNotification: () => {},
    agentStatus: { active: false },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

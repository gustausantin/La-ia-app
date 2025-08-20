
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

  // Cargar restaurante
  const loadRestaurant = async (userId) => {
    try {
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

  // EFECTO PRINCIPAL - SIN DEPENDENCIAS
  useEffect(() => {
    console.log('🚀 Initializing auth...');
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          console.log('✅ User signed in:', session.user.email);
          console.log('🔍 Fetching restaurant info for user', session.user.id);
          setUser(session.user);
          setIsAuthenticated(true);
          await loadRestaurant(session.user.id);
        } else {
          console.log('❌ No session found');
          setUser(null);
          setIsAuthenticated(false);
          setRestaurant(null);
          setRestaurantId(null);
        }
        
        setLoading(false);
        setIsReady(true);
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted) {
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    initAuth();

    // Listener de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in:', session.user.email);
        console.log('🔍 Fetching restaurant info for user', session.user.id);
        setUser(session.user);
        setIsAuthenticated(true);
        await loadRestaurant(session.user.id);
        setIsReady(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
        setIsReady(true);
      }
    });

    return () => {
      console.log('🔄 React application unmounting...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // SIN DEPENDENCIAS

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

  const logout = async () => {
    try {
      console.log('🚪 Cierre de sesión forzado...');
      await supabase.auth.signOut();
      
      // Reset inmediato
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      setIsReady(true);
      
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
    // Funciones dummy
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

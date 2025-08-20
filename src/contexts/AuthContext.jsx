
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
  const [isReady, setIsReady] = useState(false); // AQUÍ ESTÁ EL PROBLEMA
  const [loading, setLoading] = useState(false);

  // Efecto para manejar cambios de autenticación
  useEffect(() => {
    console.log('🚀 Initializing auth...');
    
    const initializeAuth = async () => {
      try {
        // Obtener sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (session?.user) {
          console.log('✅ User signed in:', session.user.email);
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Buscar información del restaurante
          console.log('🔍 Fetching restaurant info for user', session.user.id);
          const { data: mapping } = await supabase
            .from('user_restaurant_mapping')
            .select(`
              restaurant_id,
              restaurants (
                id,
                name,
                email,
                phone,
                city,
                plan,
                active
              )
            `)
            .eq('auth_user_id', session.user.id)
            .eq('active', true)
            .single();

          if (mapping?.restaurants) {
            setRestaurant(mapping.restaurants);
            setRestaurantId(mapping.restaurant_id);
          }
        } else {
          console.log('❌ No session found');
          setUser(null);
          setIsAuthenticated(false);
          setRestaurant(null);
          setRestaurantId(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        // ESTO ES LO MÁS IMPORTANTE - SIEMPRE PONER READY EN TRUE
        console.log('✅ Auth initialization complete - setting isReady to TRUE');
        setIsReady(true);
      }
    };

    initializeAuth();

    // Listener para cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        
        // Buscar información del restaurante
        console.log('🔍 Fetching restaurant info for user', session.user.id);
        try {
          const { data: mapping } = await supabase
            .from('user_restaurant_mapping')
            .select(`
              restaurant_id,
              restaurants (
                id,
                name,
                email,
                phone,
                city,
                plan,
                active
              )
            `)
            .eq('auth_user_id', session.user.id)
            .eq('active', true)
            .single();

          if (mapping?.restaurants) {
            setRestaurant(mapping.restaurants);
            setRestaurantId(mapping.restaurant_id);
          }
        } catch (error) {
          console.error('Error fetching restaurant info:', error);
        }
        
        // IMPORTANTE: Asegurar que isReady esté en true
        setIsReady(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
        setIsReady(true); // TAMBIÉN AQUÍ
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Los datos se actualizarán automáticamente por el listener
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Cerrando sesión...');
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.log('Error en logout (ignorado):', error);
    }

    // Los datos se limpiarán automáticamente por el listener
    toast.success('Sesión cerrada');
    window.location.replace('/login');
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

  console.log('🔍 AuthContext:', { isAuthenticated, isReady, loading, hasUser: !!user });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

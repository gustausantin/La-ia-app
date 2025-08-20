
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

  // Cargar restaurante - VERSIÓN ROBUSTA CON LOGS
  const loadRestaurant = async (userId) => {
    console.log('🔍 loadRestaurant START for user:', userId);
    
    try {
      // PASO 1: Buscar en mapping
      console.log('🔍 Step 1: Checking user_restaurant_mapping...');
      const { data: mappingData, error: mappingError } = await supabase
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

      if (mappingError) {
        console.log('⚠️ Mapping query error (normal if no mapping):', mappingError.message);
      }

      if (mappingData?.restaurant) {
        console.log('✅ Restaurant found via mapping:', mappingData.restaurant.name);
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
        console.log('✅ loadRestaurant COMPLETE via mapping');
        return;
      }

      // PASO 2: Buscar directo en restaurants
      console.log('🔍 Step 2: Checking restaurants table directly...');
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (restaurantError) {
        console.log('⚠️ Restaurant query error:', restaurantError.message);
      }

      if (restaurantData) {
        console.log('✅ Restaurant found directly:', restaurantData.name);
        setRestaurant(restaurantData);
        setRestaurantId(restaurantData.id);
        console.log('✅ loadRestaurant COMPLETE via direct');
        return;
      }

      // PASO 3: No encontrado
      console.log('⚠️ No restaurant found for user:', userId);
      setRestaurant(null);
      setRestaurantId(null);
      console.log('✅ loadRestaurant COMPLETE - no restaurant');
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in loadRestaurant:', error);
      setRestaurant(null);
      setRestaurantId(null);
    }
    
    console.log('🏁 loadRestaurant FINISHED');
  };

  // EFECTO PRINCIPAL - ULTRA SIMPLIFICADO
  useEffect(() => {
    console.log('🚀 Initializing auth FIXED VERSION...');
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          console.log('✅ User found:', session.user.email);
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
        
        // SIEMPRE marcar como listo
        setLoading(false);
        setIsReady(true);
        console.log('✅ Auth initialization complete - isReady: true');
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted) {
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    initAuth();

    // TIMEOUT DE SEGURIDAD - Si después de 5 segundos no se ha puesto isReady, forzarlo
    const safetyTimeout = setTimeout(() => {
      if (mounted && !isReady) {
        console.log('⚠️ SAFETY TIMEOUT - Forcing isReady=true');
        setIsReady(true);
        setLoading(false);
      }
    }, 5000);

    // Listener de auth - ARREGLADO DEFINITIVAMENTE
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in via listener:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        
        // Cargar restaurante Y luego marcar como listo
        console.log('🚀 Starting loadRestaurant in listener...');
        try {
          await loadRestaurant(session.user.id);
          console.log('🏆 Restaurant load attempt completed');
        } catch (error) {
          console.error('❌ CRITICAL ERROR in listener loadRestaurant:', error);
        }
        
        // GARANTIZAR que isReady se ponga true
        console.log('🎯 FORCING isReady=true and loading=false');
        setIsReady(true);
        setLoading(false);
        console.log('✅ Listener ABSOLUTELY GUARANTEED isReady: true');
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out via listener');
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
        setIsReady(true);
        setLoading(false);
        console.log('✅ Logout - isReady: true');
      }
    });

    return () => {
      console.log('🔄 Cleaning up auth context...');
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
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
      console.log('🚪 Logging out...');
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

  // FUNCIÓN DE LOGOUT ADMINISTRATIVO FORZADO
  const forceLogoutUser = async () => {
    console.log('🚨 LOGOUT ADMINISTRATIVO FORZADO para:', user?.email);
    
    try {
      // Forzar cierre en Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Error en signOut (ignorado):', error);
    }
    
    // Reset completo inmediato
    setUser(null);
    setIsAuthenticated(false);
    setRestaurant(null);
    setRestaurantId(null);
    setIsReady(true);
    setLoading(false);
    
    // Limpiar localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    toast.success('Sesión cerrada administrativamente');
    console.log('✅ Usuario desconectado forzadamente');
    
    // Redireccionar inmediatamente
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
    forceLogoutUser, // NUEVA FUNCIÓN ADMINISTRATIVA
    // Funciones dummy
    addNotification: () => {},
    agentStatus: { active: false },
  };

  console.log('🔍 AuthContext values:', { isAuthenticated, isReady, loading, hasUser: !!user });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


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
  const [notifications, setNotifications] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    active: true,
    activeConversations: 0,
    pendingActions: 0,
    channels: {
      vapi: true,
      whatsapp: true,
      email: true,
      instagram: false,
      facebook: false
    }
  });

  // ARREGLO DEFINITIVO: Helper timeout más corto
  const withTimeout = (p, ms = 8000, label = 'OP') =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT_${label}`)), ms))
    ]);

  const initSession = async () => {
    console.log('🚀 Initializing auth...');
    setLoading(true);
    
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        8000,
        'GET_SESSION'
      );
      
      if (error) throw error;

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        await loadUserData(session.user);
      } else {
        console.log('❌ No session found');
        // GARANTIZAR que isReady = true incluso sin sesión
        setIsReady(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error in initSession:', err?.message || err);
      // GARANTIZAR que isReady = true incluso con error
      setIsReady(true);
      setLoading(false);
    }
  };

  // SIMPLIFICADO: fetchRestaurantInfo más robusto
  const fetchRestaurantInfo = async (userId) => {
    console.log('🔍 Starting fetchRestaurantInfo for user:', userId);
    
    if (!userId) {
      console.warn('⚠️ No userId; setting defaults');
      setRestaurant(null);
      setRestaurantId(null);
      // GARANTIZAR que isReady = true
      setIsReady(true);
      console.log('✅ fetchRestaurantInfo COMPLETED (no user)');
      return;
    }

    try {
      // Buscar mapping
      const { data: mappingData, error: mappingError } = await withTimeout(
        supabase
          .from('user_restaurant_mapping')
          .select(`
            role,
            permissions,
            restaurant:restaurant_id (
              id, name, email, phone, address, city, postal_code, country,
              timezone, currency, logo_url, website, active, trial_end_at,
              subscription_status, agent_config, settings, created_at, updated_at,
              ui_cuisine_type
            )
          `)
          .eq('auth_user_id', userId)
          .single(),
        6000,
        'MAP_RESTAURANT'
      );

      if (!mappingError && mappingData?.restaurant) {
        console.log('✅ Restaurant via mapping:', mappingData.restaurant.name);
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
        setIsReady(true);
        console.log('✅ fetchRestaurantInfo COMPLETED (mapping)');
        return;
      }

      // Si no hay mapping o es PGRST116, buscar directo
      if (mappingError?.code === 'PGRST116' || !mappingData?.restaurant) {
        console.log('🏪 No mapping found, trying direct query');
        const { data: restaurantData, error: restaurantError } = await withTimeout(
          supabase.from('restaurants').select('*').eq('auth_user_id', userId).single(),
          6000,
          'DIRECT_RESTAURANT'
        );

        if (!restaurantError && restaurantData) {
          console.log('✅ Restaurant direct:', restaurantData.name);
          setRestaurant(restaurantData);
          setRestaurantId(restaurantData.id);
        } else {
          console.log('🏪 No restaurant found at all');
          setRestaurant(null);
          setRestaurantId(null);
        }
        
        setIsReady(true);
        console.log('✅ fetchRestaurantInfo COMPLETED (direct)');
        return;
      }

      // Cualquier otro error de mapping
      console.error('❌ Mapping error:', mappingError);
      setRestaurant(null);
      setRestaurantId(null);
      setIsReady(true);
      console.log('✅ fetchRestaurantInfo COMPLETED (error handled)');
      
    } catch (err) {
      console.error('❌ fetchRestaurantInfo catch error:', err?.message || err);
      setRestaurant(null);
      setRestaurantId(null);
      setIsReady(true);
      console.log('✅ fetchRestaurantInfo COMPLETED (catch)');
    }
  };

  const loadUserData = async (user) => {
    console.log('🔄 Loading user data for:', user.email);
    setUser(user);
    setIsAuthenticated(true);
    
    try {
      await fetchRestaurantInfo(user.id);
    } catch (err) {
      console.error('❌ Error in loadUserData:', err);
      // GARANTIZAR que isReady = true incluso con error
      setIsReady(true);
    } finally {
      setLoading(false);
      console.log('✅ loadUserData completed');
    }
  };

  // SIMPLIFICADO: Auth state listener sin loops
  useEffect(() => {
    let mounted = true;

    // 1. Initialize una sola vez
    if (mounted) {
      initSession();
    }

    // 2. Listen to auth changes - MÁS SIMPLE
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔐 Auth state changed:', event);

      // Ignorar token refresh para evitar loops
      if (event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        if (mounted) {
          await loadUserData(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setRestaurant(null);
          setRestaurantId(null);
          setLoading(false);
          setIsReady(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Login function
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

  // Register function
  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            restaurant_name: userData.restaurantName,
            owner_name: userData.ownerName,
          }
        }
      });

      if (error) throw error;

      if (data.user && !data.session) {
        toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        return { success: true, needsConfirmation: true };
      } else {
        toast.success('¡Cuenta creada exitosamente!');
        return { success: true, needsConfirmation: false };
      }
    } catch (error) {
      console.error('❌ Register error:', error);
      toast.error(error.message || 'Error en el registro');
      return { success: false, error: error.message };
    }
  };

  // ARREGLO: Logout más robusto
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Limpiar estado inmediatamente
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      setNotifications([]);
      setIsReady(true); // IMPORTANTE
      setLoading(false);
      
      // Limpiar storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Cerrar sesión de Supabase sin bloquear
      await supabase.auth.signOut();
      
      console.log('✅ Sesión cerrada correctamente');
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Error al cerrar sesión');
      // Aún así, garantizar redirect
      window.location.href = '/login';
    }
  };

  // NUEVO: Función de reinicio completo
  const restartApp = () => {
    console.log('🔄 REINICIO COMPLETO DE LA APLICACIÓN');
    
    // Limpiar todo el estado
    setUser(null);
    setIsAuthenticated(false);
    setRestaurant(null);
    setRestaurantId(null);
    setNotifications([]);
    setIsReady(false);
    setLoading(true);
    
    // Limpiar storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Cerrar sesión
    supabase.auth.signOut().catch(() => {});
    
    toast.success('Aplicación reiniciada');
    
    // Recargar página completa
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  // Add notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    user,
    restaurant,
    restaurantId,
    restaurantInfo: restaurant,
    isAuthenticated,
    isReady,
    loading,
    notifications,
    agentStatus,
    unreadCount,
    login,
    register,
    logout,
    signOut: logout,
    restartApp, // NUEVA FUNCIÓN
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead: clearNotifications,
    clearNotifications,
    fetchRestaurantInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

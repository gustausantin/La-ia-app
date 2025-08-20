
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

  // Función para verificar sesión inicial
  const initSession = async () => {
    try {
      console.log('🚀 Initializing auth...');
      setLoading(true);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error.message);
        setLoading(false);
        setIsReady(true);
        return;
      }

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        await loadUserData(session.user);
      } else {
        console.log('❌ No session found');
        setLoading(false);
        setIsReady(true);
      }
    } catch (error) {
      console.error('❌ Error in initSession:', error.message);
      setLoading(false);
      setIsReady(true);
    }
  };

  // Fetch restaurant information - DEFINITIVAMENTE ARREGLADO
  const fetchRestaurantInfo = async (userId) => {
    console.log('🔍 Starting fetchRestaurantInfo for user:', userId);
    
    try {
      // First try to get restaurant from user_restaurant_mapping
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
            trial_end_at,
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

      if (mappingError && mappingError.code === 'PGRST116') {
        console.log('🏪 No restaurant mapping found, trying direct restaurant query');

        // Try to find restaurant directly by auth_user_id
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('auth_user_id', userId)
          .single();

        if (restaurantError && restaurantError.code === 'PGRST116') {
          console.log('🏪 No restaurant found, will create when needed');
          setRestaurant(null);
          setRestaurantId(null);
        } else if (!restaurantError && restaurantData) {
          console.log('✅ Restaurant found directly:', restaurantData.name);
          setRestaurant(restaurantData);
          setRestaurantId(restaurantData.id);
        } else {
          console.error('❌ Database error fetching restaurant:', restaurantError);
          setRestaurant(null);
          setRestaurantId(null);
        }
      } else if (!mappingError && mappingData?.restaurant) {
        console.log('✅ Restaurant info fetched successfully:', mappingData.restaurant.name);
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
      } else {
        console.error('❌ Database error fetching restaurant mapping:', mappingError);
        setRestaurant(null);
        setRestaurantId(null);
      }
      
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      setRestaurant(null);
      setRestaurantId(null);
    }
    
    // CRÍTICO: SIEMPRE establecer isReady - sin falta
    console.log('🎯 Setting isReady = true after fetchRestaurantInfo');
    setIsReady(true);
    console.log('✅ fetchRestaurantInfo COMPLETED');
  };

  // Helper to load user data including restaurant information
  const loadUserData = async (user) => {
    console.log('🔄 Loading user data for:', user.email);
    setUser(user);
    setIsAuthenticated(true);
    setLoading(false);
    
    // Fetch restaurant info and wait for completion
    await fetchRestaurantInfo(user.id);
    console.log('✅ loadUserData completed');
  };

  // Auth state listener - SIMPLIFICADO Y ROBUSTO
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (!mounted) return;
      await initSession();
    };

    // 1. Initialize once
    initAuth();

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔐 Auth state changed:', event);

      // Skip token refresh to prevent loops
      if (event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_IN' && session) {
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
          setIsReady(true); // Importante: también establecer isReady en logout
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // EMPTY dependencies to prevent loops

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

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await supabase.auth.signOut();
      console.log('✅ Sesión cerrada correctamente');
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Error al cerrar sesión');
    }
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

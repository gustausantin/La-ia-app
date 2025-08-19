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

  // TIMEOUT DE SEGURIDAD - Forzar isReady después de 3 segundos
  useEffect(() => {
    const forceReadyTimeout = setTimeout(() => {
      console.log('⏰ TIMEOUT: Forzando isReady = true después de 3 segundos');
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(forceReadyTimeout);
  }, []); // Remove isReady dependency to prevent loop

  // Función para verificar sesión inicial
  const initSession = async () => {
    try {
      console.log('🚀 Initializing auth...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error.message);
        setIsReady(true);
        return;
      }

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        await loadUserData(session.user);
        console.log('✅ Setting isReady = true');
      } else {
        console.log('❌ No session found');
      }

      // SIEMPRE marcar como ready
      setIsReady(true);
    } catch (error) {
      console.error('❌ Error in initSession:', error.message);
      setIsReady(true);
    }
  };

  // Fetch restaurant information
  const fetchRestaurantInfo = async (userId) => {
    try {
      console.log('🔍 Fetching restaurant info for user', userId);

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

      if (mappingError) {
        if (mappingError.code === 'PGRST116') {
          console.log('🏪 No restaurant mapping found, trying direct restaurant query');

          // Try to find restaurant directly by auth_user_id
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('auth_user_id', userId)
            .single();

          if (restaurantError) {
            if (restaurantError.code === 'PGRST116') {
              console.log('🏪 No restaurant found, will create when needed');
              setRestaurant(null);
              setRestaurantId(null);
              return;
            }
            console.error('❌ Database error fetching restaurant:', restaurantError);
            setRestaurant(null);
            setRestaurantId(null);
            return;
          }

          if (restaurantData) {
            console.log('✅ Restaurant found directly:', restaurantData.name);
            setRestaurant(restaurantData);
            setRestaurantId(restaurantData.id);
          }
          return;
        }

        console.error('❌ Database error fetching restaurant mapping:', mappingError);
        setRestaurant(null);
        setRestaurantId(null);
        return;
      }

      if (mappingData && mappingData.restaurant) {
        console.log('✅ Restaurant info fetched successfully:', mappingData.restaurant.name);
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
      } else {
        console.log('Restaurant will be created when needed');
        setRestaurant(null);
        setRestaurantId(null);
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      setRestaurant(null);
      setRestaurantId(null);
    }
  };

  // Helper to load user data including restaurant information
  const loadUserData = async (user) => {
    setUser(user);
    setIsAuthenticated(true);
    await fetchRestaurantInfo(user.id);
  };


  // Auth state listener
  useEffect(() => {
    let isMounted = true;
    let sessionInitialized = false;

    // 1. PRIMERO configurar el listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);

        if (!isMounted) return;

        // Skip TOKEN_REFRESHED events to prevent loops
        if (event === 'TOKEN_REFRESHED') {
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in:', session.user.email);
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setIsAuthenticated(false);
          setRestaurant(null);
          setRestaurantId(null);
        }

        // Set ready only once after initial session
        if (!sessionInitialized) {
          console.log('🔧 Auth state changed - Setting isReady = true');
          setIsReady(true);
          sessionInitialized = true;
        }
      }
    );

    // 2. LUEGO inicializar la sesión
    initSession().then(() => {
      console.log('🎯 initSession completed');
      sessionInitialized = true;
    }).catch(error => {
      console.error('❌ initSession failed:', error);
      setIsReady(true);
      sessionInitialized = true;
    });

    return () => {
      isMounted = false;
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

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');

      // Limpiar estado ANTES del signOut
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      setNotifications([]);
      setAgentStatus({
        active: false,
        activeConversations: 0,
        pendingActions: 0,
        channels: {
          vapi: false,
          whatsapp: false,
          email: false,
          instagram: false,
          facebook: false
        }
      });

      // Limpiar localStorage
      localStorage.clear();
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();

      console.log('✅ Sesión cerrada correctamente');
      toast.success('Sesión cerrada correctamente');

      // Redirigir inmediatamente
      window.location.replace('/login');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Incluso si hay error, limpiar y redirigir
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      localStorage.clear();
      window.location.replace('/login');
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

  const value = {
    user,
    restaurant,
    restaurantId,
    restaurantInfo: restaurant, // Alias for compatibility
    isAuthenticated,
    isReady,
    notifications,
    agentStatus,
    unreadCount: notifications.filter(n => !n.read).length,
    login,
    register,
    logout,
    signOut: logout, // Alias para compatibilidad con Layout
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
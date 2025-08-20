
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
  const [loading, setLoading] = useState(true); // Para compatibilidad con ProtectedRoute
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
        return;
      }

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        await loadUserData(session.user);
      } else {
        console.log('❌ No session found');
      }
    } catch (error) {
      console.error('❌ Error in initSession:', error.message);
    } finally {
      setLoading(false);
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

  // Auth state listener - SIMPLIFICADO
  useEffect(() => {
    let isInitialized = false;

    // 1. Initialize session once
    const init = async () => {
      if (isInitialized) return;
      isInitialized = true;
      await initSession();
    };

    // 2. Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      // Skip token refresh events to prevent loops
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
    });

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // EMPTY dependency array to prevent loops

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

      // Clear state BEFORE signOut
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

      // Clear localStorage
      localStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();

      console.log('✅ Sesión cerrada correctamente');
      toast.success('Sesión cerrada correctamente');

      // Redirect immediately
      window.location.replace('/login');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if there's an error, clear and redirect
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      localStorage.clear();
      window.location.replace('/login');
    }
  };

  // Función para reinicio completo de la aplicación
  const restartApp = () => {
    try {
      console.log('🔄 Reiniciando aplicación completa...');
      
      // Limpiar todo el estado
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
      setIsReady(false);
      setLoading(true);

      // Limpiar almacenamiento local
      localStorage.clear();
      sessionStorage.clear();

      // Cerrar sesión de Supabase sin await para evitar bloqueos
      supabase.auth.signOut().catch(console.error);

      toast.success('Aplicación reiniciada');
      
      // Recargar página completamente
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error en reinicio:', error);
      // Forzar recarga si hay error
      window.location.reload();
    }
  };

  // Función para cierre de sesión forzado
  const forceLogout = () => {
    console.log('🚪 Cierre de sesión forzado...');
    
    // Limpiar todo inmediatamente
    setUser(null);
    setIsAuthenticated(false);
    setRestaurant(null);
    setRestaurantId(null);
    setNotifications([]);
    setIsReady(false);
    setLoading(false);
    
    // Limpiar almacenamiento
    localStorage.clear();
    sessionStorage.clear();
    
    // Cerrar sesión sin esperar respuesta
    supabase.auth.signOut().catch(() => {});
    
    toast.success('Sesión cerrada');
    
    // Redirigir inmediatamente
    window.location.replace('/login');
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
    restaurantInfo: restaurant, // Alias for compatibility
    isAuthenticated,
    isReady,
    loading, // Para compatibilidad con ProtectedRoute
    notifications,
    agentStatus,
    unreadCount,
    login,
    register,
    logout,
    signOut: logout, // Alias para compatibilidad con Layout
    restartApp, // Nueva función de reinicio
    forceLogout, // Nueva función de cierre forzado
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


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

  // Función para cargar info del restaurante
  const fetchRestaurantInfo = async (userId) => {
    try {
      console.log('🔍 Fetching restaurant info for user', userId);

      // Intentar obtener por mapping
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
        // Intentar búsqueda directa
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

  // Inicializar una sola vez
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          console.log('✅ Session found:', session.user.email);
          setUser(session.user);
          setIsAuthenticated(true);
          await fetchRestaurantInfo(session.user.id);
        } else {
          console.log('❌ No session found');
        }
      } catch (error) {
        console.error('❌ Error in initAuth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsReady(true);
          console.log('✅ Auth initialization complete, isReady=true');
        }
      }
    };

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔐 Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchRestaurantInfo(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
      }

      if (!isReady) {
        setIsReady(true);
        setLoading(false);
        console.log('✅ Auth state change complete, isReady=true');
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Solo ejecutar una vez

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

  // Register
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

  // Logout simple
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      setNotifications([]);
      toast.success('Sesión cerrada correctamente');
      window.location.replace('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Funciones de notificaciones
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

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

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

  // Initialize session
  const initSession = async () => {
    try {
      console.log('🚀 Initializing auth...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error);
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
        setIsReady(true);
        return;
      }

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);

        // Fetch restaurant info
        try {
          await fetchRestaurantInfo(session.user.id);
        } catch (restaurantError) {
          console.error('❌ Error fetching restaurant:', restaurantError);
          // Continue anyway, restaurant will be created when needed
        }
      } else {
        console.log('❌ No session found');
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
      }
    } catch (error) {
      console.error('❌ Error in initSession:', error);
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
    } finally {
      console.log('✅ Auth initialization complete, setting isReady = true');
      setIsReady(true);
    }
  };

  // Fetch restaurant information
  const fetchRestaurantInfo = async (userId) => {
    try {
      console.log('🔍 Fetching restaurant info for user', userId);

      // Use user_restaurant_mapping to get the restaurant
      const { data, error } = await supabase
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

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('🏪 No restaurant mapping found, will create when needed');
          setRestaurant(null);
          setRestaurantId(null);
          return;
        }
        console.error('❌ Database error fetching restaurant:', error);
        setRestaurant(null);
        setRestaurantId(null);
        return;
      }

      if (data && data.restaurant) {
        console.log('✅ Restaurant info fetched successfully:', data.restaurant.name);
        setRestaurant(data.restaurant);
        setRestaurantId(data.restaurant.id);
      } else {
        console.log('Restaurant will be created when needed');
        setRestaurant(null);
        setRestaurantId(null);
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      setRestaurant(null);
      setRestaurantId(null);
    } finally {
      // Always set ready to true after restaurant fetch
      console.log('✅ Restaurant fetch complete, setting isReady = true');
      setIsReady(true);
    }
  };

  // Auth state listener
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);

        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User is logged in:', session.user.email);
          setUser(session.user);
          setIsAuthenticated(true);
          try {
            await fetchRestaurantInfo(session.user.id);
          } catch (error) {
            console.error('❌ Error fetching restaurant after sign in:', error);
            setIsReady(true); // Set ready even on error
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setIsAuthenticated(false);
          setRestaurant(null);
          setRestaurantId(null);
          setIsReady(true); // Set ready after sign out
        } else if (event === 'INITIAL_SESSION') {
          // Don't set ready here, let initSession handle it
          console.log('Initial session event - not setting ready here');
        }
      }
    );

    // Initialize session only once on mount
    if (isMounted) {
      initSession();
    }

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      setNotifications([]);

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
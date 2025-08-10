import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(3);

  // Estados para notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Función para agregar notificación
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      priority: notification.priority || 'normal',
      read: false,
      created_at: new Date().toISOString(),
      metadata: notification.metadata || {},
      link: notification.link
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Función para marcar notificación como leída
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Función para marcar todas como leídas
  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Función para eliminar notificación
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Función para limpiar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  /** Intenta algo con reintentos exponenciales (red/latencia) */
  const withRetry = useCallback(async (fn, { tries = 3, baseMs = 300 } = {}) => {
    let lastErr;
    for (let i = 0; i < tries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i)));
      }
    }
    throw lastErr;
  }, []);

  /** Lee el mapping (usa auth_user_id) y devuelve el restaurante o null */
  const loadUserRestaurant = useCallback(async (authUserId) => {
    if (!authUserId) return null;

    const { data, error } = await supabase
      .from("user_restaurant_mapping")
      .select(`
        role,
        permissions,
        restaurant:restaurant_id (*)
      `)
      .eq("auth_user_id", authUserId)
      .single();

    // PGRST116 = no rows (PostgREST)
    if (error && error.code === "PGRST116") return null;
    if (error) throw error;

    return data?.restaurant || null;
  }, []);

  /** Crea (en el servidor) un restaurante por defecto para el usuario actual */
  const ensureRestaurantForCurrentUser = useCallback(async (name = "Mi Restaurante") => {
    const { data, error } = await supabase.rpc("create_restaurant_for_current_user", {
      p_name: name,
    });
    if (error) throw error;
    // data = { status: 'created'|'exists', restaurant: {...} }
    return data?.restaurant ?? null;
  }, []);

  /** Inicializa sesión + restaurante con fallback y reintentos */
  const initSession = useCallback(async () => {
    try {
      // 1) Usuario autenticado
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user ?? null;
      if (!user?.id) return { user: null, restaurant: null };

      // 2) Intentar leer restaurante existente
      let restaurant = await withRetry(() => loadUserRestaurant(user.id));

      // 3) Si no existe, crearlo vía RPC (transacción segura en DB)
      if (!restaurant) {
        restaurant = await withRetry(() => ensureRestaurantForCurrentUser("Mi Restaurante"));
      }

      return { user, restaurant };
    } catch (error) {
      console.error('❌ Error in initSession:', error);
      throw error;
    }
  }, [withRetry, loadUserRestaurant, ensureRestaurantForCurrentUser]);

  // Función para obtener información del restaurante con la nueva lógica robusta
  const fetchRestaurantInfo = useCallback(async (userId) => {
    if (!userId) {
      console.log('No userId provided to fetchRestaurantInfo');
      return null;
    }

    console.log(`🔍 Fetching restaurant info for user ${userId}`);
    setLoadingRestaurant(true);

    try {
      // Usar la nueva función robusta
      const result = await initSession();

      if (result.restaurant) {
        console.log('✅ Restaurant info fetched successfully:', result.restaurant.name);
        setRestaurantInfo(result.restaurant);
        setRetryAttempts(3); // Reset retry attempts on success
        return result.restaurant;
      } else {
        throw new Error('No restaurant found after all attempts');
      }

    } catch (error) {
      console.error(`❌ Error fetching restaurant:`, error);
      setRetryAttempts(0);
      toast.error('Error cargando el restaurante. Por favor, contacta con soporte.');
      return null;
    } finally {
      setLoadingRestaurant(false);
    }
  }, [initSession]);

  // Función para manejar cambios de sesión
  const handleAuthStateChange = useCallback(async (event, session) => {
    console.log('🔐 Auth state changed:', event, session?.user?.id);

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        const userData = {
          ...session.user,
          profile
        };

        setUser(userData);
        setIsAuthenticated(true);

        // Cargar información del restaurante usando la nueva lógica
        await fetchRestaurantInfo(session.user.id);
      }
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      setIsAuthenticated(false);
      setRestaurantInfo(null);
      setRetryAttempts(3);
    }

    setIsReady(true);
  }, [fetchUserProfile, fetchRestaurantInfo]);

  // Inicializar autenticación
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          if (session?.user) {
            await handleAuthStateChange('SIGNED_IN', session);
          } else {
            setIsReady(true);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    initializeAuth();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Función de login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('¡Bienvenido de vuelta!');
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error de conexión');
      return { success: false, error };
    }
  };

  // Función de registro
  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/confirm`
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return { success: false, error };
      }

      if (data?.user && !data?.user?.email_confirmed_at) {
        toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        return {
          success: true,
          data,
          needsConfirmation: true
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error };
    }
  };

  // Función de logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast.error('Error al cerrar sesión');
      } else {
        toast.success('¡Hasta pronto!');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error de conexión');
    }
  };

  // Función para inicialización externa (útil para testing o SSR)
  const initSession = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user || null;
    const restaurant = await loadUserRestaurant(user?.id); // Asegurarse de pasar el id del usuario
    return { user, restaurant };
  }, [loadUserRestaurant]);

  // Función para reintentar carga del restaurante
  const handleRetry = useCallback(() => {
    if (user?.id && retryAttempts > 0) {
      setRetryAttempts(prev => prev - 1);
      fetchRestaurantInfo(user.id);
    }
  }, [user?.id, retryAttempts, fetchRestaurantInfo]);

  const value = {
    user,
    isAuthenticated,
    isReady,
    restaurantInfo,
    restaurant: restaurantInfo, // Alias para compatibilidad
    loadingRestaurant,
    retryAttempts,
    signIn,
    signUp,
    signOut,
    handleRetry,
    initSession,
    restaurantId: restaurantInfo?.id,
    // Sistema de notificaciones
    notifications: notifications || [], // Fix para el error de filter
    unreadCount,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    // Estado del agente (mock por ahora)
    agentStatus: {
      active: true,
      connected: true,
      lastSeen: new Date()
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
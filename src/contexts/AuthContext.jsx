
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

/** Reintentos simples */
async function withRetry(fn, { tries = 3, baseMs = 300 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, baseMs * (2 ** i)));
    }
  }
  throw lastErr;
}

/** Lee mapping por auth_user_id y devuelve restaurante o null */
async function loadUserRestaurant(authUserId) {
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

  // PGRST116 = sin filas
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data?.restaurant ?? null;
}

/** Crea restaurante por defecto en el servidor (RPC) */
async function ensureRestaurantForCurrentUser(name = "Mi Restaurante") {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) throw new Error('Usuario no autenticado');
  
  const { error } = await supabase.rpc("create_default_restaurant", {
    p_auth_user_id: authData.user.id,
  });
  if (error) throw error;
  
  // Después de crear, cargar el restaurante
  return await loadUserRestaurant(authData.user.id);
}

/** ÚNICA función pública de inicialización */
async function initSession() {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const user = authData?.user ?? null;
  if (!user?.id) return { user: null, restaurant: null };

  let restaurant = await withRetry(() => loadUserRestaurant(user.id));
  if (!restaurant) {
    restaurant = await withRetry(() => ensureRestaurantForCurrentUser("Mi Restaurante"));
  }
  return { user, restaurant };
}

// No exportar initSession para evitar problemas con Fast Refresh

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

      // Si no existe el perfil (PGRST116), es normal, devolvemos null sin error
      if (error && error.code === 'PGRST116') {
        console.log('No profile found for user, using basic auth data');
        return null;
      }

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

  // Función para obtener información del restaurante con la nueva lógica robusta
  const fetchRestaurantInfo = useCallback(async (userId) => {
    if (!userId) {
      console.log('No userId provided to fetchRestaurantInfo');
      return null;
    }

    console.log(`🔍 Fetching restaurant info for user ${userId}`);
    setLoadingRestaurant(true);

    try {
      // Usar la función de inicialización interna
      const result = await initSession();

      if (result.restaurant) {
        console.log('✅ Restaurant info fetched successfully:', result.restaurant.name);
        setRestaurantInfo(result.restaurant);
        setRetryAttempts(3); // Reset retry attempts on success
        return result.restaurant;
      } else {
        console.log('⚠️ No restaurant found, but continuing with app load');
        setRestaurantInfo(null);
        return null;
      }

    } catch (error) {
      console.error(`❌ Error fetching restaurant:`, error);
      setRetryAttempts(prev => Math.max(0, prev - 1));
      // No mostrar error toast inmediatamente para no bloquear la carga
      console.log('Restaurant will be created when needed');
      return null;
    } finally {
      setLoadingRestaurant(false);
    }
  }, []);

  // Función para manejar cambios de sesión
  const handleAuthStateChange = async (event, session) => {
    console.log('🔐 Processing auth change:', event, session?.user?.id || 'no-user');

    try {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('✅ User signed in, loading profile and restaurant...');
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
        console.log('👋 User signed out');
        setUser(null);
        setIsAuthenticated(false);
        setRestaurantInfo(null);
        setRetryAttempts(3);
      } else if (event === 'INITIAL_SESSION') {
        console.log('🔄 Initial session check');
        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
          await fetchRestaurantInfo(session.user.id);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('❌ Error in handleAuthStateChange:', error);
    } finally {
      console.log('✅ Auth initialization complete, setting isReady to true');
      setIsReady(true);
    }
  };

  // Inicializar autenticación
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            console.log('✅ User is logged in:', session.user.email);
            setUser(session.user);
            setIsAuthenticated(true);
            
            // Cargar restaurante en background, pero no bloquear la carga
            fetchRestaurantInfo(session.user.id).catch(restError => {
              console.error('⚠️ Error loading restaurant, but app will continue:', restError);
            });
          } else {
            console.log('ℹ️ No user session');
            setUser(null);
            setIsAuthenticated(false);
            setRestaurantInfo(null);
          }
          
          // Establecer isReady inmediatamente después de procesar la sesión
          console.log('✅ Auth initialization complete, setting isReady = true');
          setIsReady(true);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          // Establecer isReady incluso si hay error para evitar pantalla en blanco
          setIsReady(true);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (mounted && event !== 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          // Cargar restaurante en background
          fetchRestaurantInfo(session.user.id).catch(restError => {
            console.error('⚠️ Error loading restaurant after auth change:', restError);
          });
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setRestaurantInfo(null);
        }
        
        // Asegurar que isReady está en true después de cualquier cambio de auth
        if (!isReady) {
          setIsReady(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchRestaurantInfo]);

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


import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import logger from '../utils/logger';

const AuthContext = createContext(null);
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider');
  return ctx;
};

const AuthProvider = ({ children }) => {
  const [status, setStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    active: true, activeConversations: 0, pendingActions: 0,
    channels: { vapi: true, whatsapp: true, email: true, instagram: false, facebook: false }
  });

  const bootedRef = useRef(false);
  const lastSignInRef = useRef(null);

  // Función SIMPLIFICADA que falla rápido
  const fetchRestaurantInfo = async (userId) => {
    logger.debug('Fetching restaurant info for user', { userId });
    
    if (!userId) { 
      logger.warn('No userId provided');
      setRestaurant(null); 
      setRestaurantId(null); 
      return; 
    }

    try {
      // Timeout AGRESIVO de 2 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Solo un intento - mapping table
      const { data: map, error: mapErr } = await supabase
        .from('user_restaurant_mapping')
        .select('restaurant:restaurant_id(id, name)')
        .eq('auth_user_id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (map?.restaurant) {
        logger.info('Restaurant found', { name: map.restaurant.name });
        setRestaurant(map.restaurant); 
        setRestaurantId(map.restaurant.id); 
      } else {
        logger.info('No restaurant found - app continues normally');
        setRestaurant(null); 
        setRestaurantId(null);
      }
      
    } catch (e) {
      if (e.name === 'AbortError') {
        logger.warn('fetchRestaurantInfo ABORTED - app continues');
      } else {
        logger.error('fetchRestaurantInfo error (ignored)', e?.message || e);
      }
      setRestaurant(null); 
      setRestaurantId(null);
    } finally {
      logger.debug('fetchRestaurantInfo FINISHED');
    }
  };

  // CORREGIDO: loadUserData carga usuario Y restaurant
  const loadUserData = async (u) => {
    logger.info('Loading user data for', { email: u.email });
    setUser(u);
    setStatus('signed_in');
    
    // CRÍTICO: Cargar restaurant para que todas las páginas funcionen
    logger.info('Loading restaurant info...');
    await fetchRestaurantInfo(u.id);
    logger.info('User and restaurant ready');
  };

  const initSession = async () => {
    logger.info('Initializing auth...');
    setStatus('checking');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        logger.info('Session found', { email: session.user.email });
        await loadUserData(session.user); // AHORA es async
      } else {
        logger.info('No session found');
        setUser(null); 
        setStatus('signed_out');
      }
    } catch (error) {
      logger.error('Error getting session', error);
      setStatus('signed_out');
    }
  };

  // ELIMINADO: Timeout de seguridad que causaba problemas

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // Inicializar inmediatamente
    initSession();
    
    // Escuchar evento personalizado de actualización de auth
    const handleAuthUpdate = () => {
      logger.info('Auth update event received, refreshing session...');
      setTimeout(() => {
        initSession();
      }, 500);
    };
    
    window.addEventListener('auth-updated', handleAuthUpdate);

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state changed', { event });

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

      if (event === 'SIGNED_IN' && session?.user) {
        if (lastSignInRef.current === session.user.id) {
          logger.debug('SIGNED_IN duplicado ignorado'); 
          return;
        }
        lastSignInRef.current = session.user.id;
        logger.info('User signed in', { email: session.user.email });
        await loadUserData(session.user); // AHORA es async
      } else if (event === 'SIGNED_OUT') {
        lastSignInRef.current = null;
        setUser(null); 
        setRestaurant(null); 
        setRestaurantId(null);
        setStatus('signed_out');
        logger.info('User signed out (status=signed_out)');
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, []);

  // Helpers auth
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast.success('¡Bienvenido de vuelta!');
      return { success: true };
    } catch (error) {
      logger.error('Login error', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email, 
        password: userData.password,
        options: { 
          data: { 
            restaurant_name: userData.restaurantName, 
            owner_name: userData.ownerName 
          } 
        }
      });
      if (error) throw error;
      if (data.user && !data.session) { 
        toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.'); 
        return { success: true, needsConfirmation: true }; 
      }
      toast.success('¡Cuenta creada exitosamente!'); 
      return { success: true, needsConfirmation: false };
    } catch (error) {
      logger.error('Register error', error);
      toast.error(error.message || 'Error en el registro');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try { 
      logger.info('Closing session...');
      await supabase.auth.signOut(); 
      logger.info('Session closed correctly');
      toast.success('Sesión cerrada correctamente'); 
    } catch (e) { 
      logger.error('Logout error', e); 
      toast.error('Error al cerrar sesión'); 
    }
  };

  const forceLogout = () => {
    try {
      logger.info('Force logout initiated');
      // Limpiar todo el estado local
      setUser(null);
      setRestaurant(null);
      setRestaurantId(null);
      setStatus('signed_out');
      setNotifications([]);
      
      // Limpiar localStorage
      localStorage.clear();
      
      // Forzar signout de Supabase sin esperar
      supabase.auth.signOut().catch(() => {}); // Ignore errors
      
      toast.success('Sesión cerrada forzadamente');
      
      // Redirigir inmediatamente
      window.location.replace('/login');
    } catch (error) {
      logger.error('Force logout error', error);
      // Aún así redirigir
      window.location.replace('/login');
    }
  };

  const restartApp = () => {
    try {
      logger.info('Restarting app');
      toast.success('Reiniciando aplicación...');
      
      // Limpiar todo
      localStorage.clear();
      sessionStorage.clear();
      
      // Recargar la página completamente
      window.location.reload();
    } catch (error) {
      logger.error('Restart app error', error);
      window.location.reload();
    }
  };

  // Notifs
  const addNotification = (n) => {
    const newN = { 
      id: Date.now() + Math.random(), 
      timestamp: new Date(), 
      read: false, 
      ...n 
    };
    setNotifications((p) => [newN, ...p].slice(0, 50));
  };
  
  const markNotificationAsRead = (id) => 
    setNotifications((p) => p.map(n => n.id === id ? { ...n, read: true } : n));
  
  const clearNotifications = () => setNotifications([]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    status,
    isAuthenticated: status === 'signed_in',
    isReady: true, // SIEMPRE true - la app está lista inmediatamente
    loading: false, // NUNCA loading - eliminamos el concepto de loading
    user, 
    restaurant, 
    restaurantId, 
    restaurantInfo: restaurant,
    notifications, 
    agentStatus, 
    unreadCount,
    login, 
    register, 
    logout, 
    signOut: logout,
    forceLogout,
    restartApp,
    addNotification, 
    markNotificationAsRead, 
    markAllNotificationsAsRead: clearNotifications, 
    clearNotifications,
    fetchRestaurantInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
export default AuthProvider;

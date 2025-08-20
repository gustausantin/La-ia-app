
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
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
    channels: { vapi: true, whatsapp: true, email: true, instagram: false, facebook: false }
  });

  // Timeout defensivo
  const withTimeout = (p, ms = 12000, label = 'OP') =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT_${label}`)), ms)),
    ]);

  // 1) Sesión inicial: SIEMPRE deja la app lista (isReady=true) en finally
  const initSession = async () => {
    console.log('🚀 Initializing auth...');
    setLoading(true);
    try {
      const { data: { session }, error } = await withTimeout(supabase.auth.getSession(), 12000, 'GET_SESSION');
      if (error) throw error;

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        await loadUserData(session.user); // isReady se fijará en su finally
        return;
      }

      console.log('❌ No session found');
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
    } catch (err) {
      console.error('❌ Error in initSession:', err?.message || err);
    } finally {
      setLoading(false);
      setIsReady(true); // PASE LO QUE PASE, la UI no queda colgada
      console.log('🎯 initSession: isReady = true');
    }
  };

  // 2) Datos de restaurante (NO toca isReady)
  const fetchRestaurantInfo = async (userId) => {
    console.log('🔍 Starting fetchRestaurantInfo for user:', userId);
    if (!userId) {
      console.warn('⚠️ No userId; skipping restaurant fetch');
      setRestaurant(null);
      setRestaurantId(null);
      return;
    }

    try {
      // mapping -> restaurant
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
        12000,
        'MAP_RESTAURANT'
      );

      if (!mappingError && mappingData?.restaurant) {
        console.log('✅ Restaurant via mapping:', mappingData.restaurant.name);
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
        return;
      }

      if (mappingError && mappingError.code === 'PGRST116') {
        console.log('🏪 No mapping; querying restaurants directly');
        const { data: restaurantData, error: restaurantError } = await withTimeout(
          supabase.from('restaurants').select('*').eq('auth_user_id', userId).single(),
          12000,
          'DIRECT_RESTAURANT'
        );

        if (!restaurantError && restaurantData) {
          console.log('✅ Restaurant direct:', restaurantData.name);
          setRestaurant(restaurantData);
          setRestaurantId(restaurantData.id);
        } else {
          console.log('🏪 No restaurant found');
          setRestaurant(null);
          setRestaurantId(null);
        }
        return;
      }

      if (mappingError) {
        console.error('❌ DB error (mapping):', mappingError);
        setRestaurant(null);
        setRestaurantId(null);
      }
    } catch (err) {
      console.error('❌ fetchRestaurantInfo error:', err?.message || err);
      setRestaurant(null);
      setRestaurantId(null);
    } finally {
      console.log('✅ fetchRestaurantInfo FINISHED'); // NO toca isReady
    }
  };

  // 3) Carga de usuario: controla loading/isReady de forma atómica
  const loadUserData = async (u) => {
    console.log('🔄 Loading user data for:', u.email);
    setIsReady(false);  // arranca flujo de carga atómico
    setLoading(true);
    setUser(u);
    setIsAuthenticated(true);
    try {
      await fetchRestaurantInfo(u.id);
    } catch (err) {
      console.error('❌ Error in loadUserData:', err);
    } finally {
      setLoading(false);
      setIsReady(true); // garantizado al final
      console.log('✅ loadUserData completed (isReady=true)');
    }
  };

  // 4) Listener de auth
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (!mounted) return;
      await initSession();
    };

    boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('🔐 Auth state changed:', event);

      if (event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
        setLoading(false);
        setIsReady(true); // listo aunque no haya sesión
        console.log('👋 Signed out (isReady=true)');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth helpers
  const login = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('¡Bienvenido de vuelta!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { restaurant_name: userData.restaurantName, owner_name: userData.ownerName } }
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

  // Notificaciones
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
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => setNotifications([]);
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
    fetchRestaurantInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

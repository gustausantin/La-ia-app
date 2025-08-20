
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
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

  // Función simplificada para obtener restaurante (SIN timeout wrapper)
  const fetchRestaurantInfo = async (userId) => {
    console.log('🔍 Fetching restaurant info for user:', userId);
    
    if (!userId) { 
      console.log('⚠️ No userId provided');
      setRestaurant(null); 
      setRestaurantId(null); 
      return; 
    }

    try {
      // Primer intento: mapping table
      const { data: map, error: mapErr } = await supabase
        .from('user_restaurant_mapping')
        .select(`
          role, permissions,
          restaurant:restaurant_id (
            id, name, email, phone, address, city, postal_code, country,
            timezone, currency, logo_url, website, active, trial_end_at,
            subscription_status, agent_config, settings, created_at, updated_at, ui_cuisine_type
          )
        `)
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (map?.restaurant) {
        console.log('✅ Restaurant via mapping:', map.restaurant.name);
        setRestaurant(map.restaurant); 
        setRestaurantId(map.restaurant.id); 
        return;
      }

      if (mapErr && mapErr.code !== 'PGRST116') {
        console.error('❌ DB mapping error:', mapErr);
      }

      // Segundo intento: direct
      console.log('📋 No mapping; trying direct...');
      const { data: direct, error: directErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (direct) { 
        console.log('✅ Restaurant direct:', direct.name);
        setRestaurant(direct); 
        setRestaurantId(direct.id); 
      } else {
        if (directErr && directErr.code !== 'PGRST116') {
          console.error('❌ DB direct error:', directErr);
        }
        console.log('🏪 No restaurant found');
        setRestaurant(null); 
        setRestaurantId(null);
      }
    } catch (e) {
      console.error('❌ fetchRestaurantInfo error:', e?.message || e);
      setRestaurant(null); 
      setRestaurantId(null);
    } finally {
      console.log('✅ fetchRestaurantInfo FINISHED');
    }
  };

  const loadUserData = async (u) => {
    console.log('🔄 Loading user data for:', u.email);
    try {
      setUser(u);
      await fetchRestaurantInfo(u.id);
    } catch (e) {
      console.error('❌ loadUserData error:', e?.message || e);
    } finally {
      setStatus('signed_in');
      console.log('✅ loadUserData completed (status=signed_in)');
    }
  };

  const initSession = async () => {
    console.log('🚀 Initializing auth...');
    setStatus('checking');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        await loadUserData(session.user);
      } else {
        console.log('❌ No session found');
        setUser(null); 
        setRestaurant(null); 
        setRestaurantId(null);
        setStatus('signed_out');
      }
    } catch (e) {
      console.error('❌ initSession error:', e?.message || e);
      setUser(null); 
      setRestaurant(null); 
      setRestaurantId(null);
      setStatus('signed_out');
    }
  };

  // Timeout de seguridad - más simple
  useEffect(() => {
    if (status !== 'checking') return;
    
    const timeout = setTimeout(() => {
      console.log('🚨 TIMEOUT FALLBACK: forcing signed_out');
      setStatus('signed_out');
    }, 10000); // 10 segundos
    
    return () => clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // Inicializar inmediatamente
    initSession();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

      if (event === 'SIGNED_IN' && session?.user) {
        if (lastSignInRef.current === session.user.id) {
          console.log('↩️ SIGNED_IN duplicado ignorado'); 
          return;
        }
        lastSignInRef.current = session.user.id;
        console.log('✅ User signed in:', session.user.email);
        setStatus('checking');
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        lastSignInRef.current = null;
        setUser(null); 
        setRestaurant(null); 
        setRestaurantId(null);
        setStatus('signed_out');
        console.log('👋 User signed out (status=signed_out)');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helpers auth
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
    } catch (e) { 
      console.error('❌ Logout error:', e); 
      toast.error('Error al cerrar sesión'); 
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
    isReady: status !== 'checking',
    loading: status === 'checking',
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
    addNotification, 
    markNotificationAsRead, 
    markAllNotificationsAsRead: clearNotifications, 
    clearNotifications,
    fetchRestaurantInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

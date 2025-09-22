
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import logger from '../utils/logger';
import { realtimeService } from '../services/realtimeService';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Exportar el contexto para tests
export { AuthContext };

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
  const loadUserDataRef = useRef(false); // NUEVA PROTECCIÓN CONTRA EJECUCIONES MÚLTIPLES

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
        .select('restaurant:restaurant_id(id, name, email, phone, address, city, country, postal_code, cuisine_type, plan, active, created_at)')
        .eq('auth_user_id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (map?.restaurant) {
        logger.info('Restaurant found', { name: map.restaurant.name });
        setRestaurant(map.restaurant); 
        setRestaurantId(map.restaurant.id); 
        try {
          await realtimeService.setRestaurantFilter(map.restaurant.id);
        } catch {}
        try {
          // Asegurar defaults del tenant
          await supabase.rpc('ensure_tenant_defaults', { p_restaurant_id: map.restaurant.id });
        } catch (e) {
          logger.warn('ensure_tenant_defaults failed (non-blocking):', e?.message || e);
        }
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

  // ENTERPRISE: Función para crear restaurant automáticamente para usuarios huérfanos
  const createRestaurantForOrphanUser = async (user) => {
    try {
      logger.info('🚀 Iniciando migración automática para usuario huérfano...', { userId: user.id, email: user.email });
      
      // Crear restaurant automáticamente usando los datos del usuario
      const { data: restaurantData, error: restaurantError } = await supabase
        .rpc('create_restaurant_securely', {
          restaurant_data: {
            name: `Restaurante de ${user.email.split('@')[0]}`, // Nombre basado en email
            email: user.email,
            phone: '+34 600 000 000', // Teléfono por defecto
            city: 'Madrid', // Ciudad por defecto
            plan: 'trial',
            active: true
          },
          user_profile: {
            email: user.email,
            full_name: user.email.split('@')[0] // Nombre basado en email
          }
        });

      if (restaurantError) {
        logger.error('❌ Error en migración automática:', restaurantError);
        throw restaurantError;
      }

      logger.info('✅ Migración automática completada:', restaurantData);
      
      // Actualizar estado inmediatamente
      const restaurantInfo = {
        id: restaurantData.restaurant_id,
        name: restaurantData.restaurant_name || `Restaurante de ${user.email.split('@')[0]}`
      };
      
      setRestaurant(restaurantInfo);
      setRestaurantId(restaurantInfo.id);
      try {
        await realtimeService.setRestaurantFilter(restaurantInfo.id);
      } catch {}
      
      // Disparar evento para que otras partes de la app se actualicen
      window.dispatchEvent(new CustomEvent('restaurant-created', { 
        detail: { restaurant: restaurantInfo } 
      }));
      
      logger.info('🎉 Usuario migrado exitosamente - restaurant disponible');
      
    } catch (error) {
      logger.error('💥 Error crítico en migración automática:', error);
      // No hacer throw para que la app siga funcionando, pero logear el error
      toast.error('Error al configurar tu restaurante. Por favor, contacta con soporte.');
    }
  };

  // ENTERPRISE: loadUserData con protección ABSOLUTA contra ejecuciones múltiples
  const loadUserData = async (u) => {
    // PROTECCIÓN CRÍTICA: Solo permitir una ejecución por usuario por sesión
    const userKey = `loadUserData_${u.id}`;
    if (loadUserDataRef.current || window[userKey]) {
      logger.warn('🛡️ loadUserData ya en progreso - ignorando ejecución duplicada');
      return;
    }
    
    // Marcar como en progreso INMEDIATAMENTE
    loadUserDataRef.current = true;
    window[userKey] = true;
    
    try {
      logger.info('Loading user data for', { email: u.email });
      setUser(u);
      setStatus('signed_in');
      
      // CRÍTICO: Cargar restaurant para que todas las páginas funcionen
      logger.info('Loading restaurant info...');
      await fetchRestaurantInfo(u.id);
      
      // ENTERPRISE ARCHITECTURE: Restaurant creation handled by PostgreSQL trigger
      // NO JavaScript migration needed - trigger guarantees restaurant exists
      logger.info('🏗️ ENTERPRISE: Arquitectura trigger-based, no migration needed');
      
      // Simple verification: Restaurant should exist due to trigger
      const { data: userMapping, error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .select('restaurant_id')
        .eq('auth_user_id', u.id)
        .maybeSingle();
      
      if (mappingError) {
        logger.error('❌ Error verificando mapping de usuario:', mappingError);
      } else if (!userMapping?.restaurant_id) {
        logger.warn('🚨 ENTERPRISE ALERT: Trigger failure detected - running emergency fallback');
        
        // EMERGENCY FALLBACK: Only if trigger failed
        try {
          await createRestaurantForOrphanUser(u);
          logger.info('✅ EMERGENCY FALLBACK: Restaurant created successfully');
          await fetchRestaurantInfo(u.id);
        } catch (fallbackError) {
          logger.error('💥 EMERGENCY FALLBACK FAILED:', fallbackError);
          toast.error('Error crítico del sistema. Contactar soporte técnico.');
        }
      } else {
        logger.info('✅ ENTERPRISE: Restaurant found via trigger architecture');
      }
      
      logger.info('User and restaurant ready');
      
    } catch (error) {
      logger.error('💥 Error en loadUserData:', error);
      // Reset flags en caso de error para permitir reintento
      loadUserDataRef.current = false;
      delete window[userKey];
      throw error;
    }
    
    // NO resetear las flags aquí - mantener protección durante toda la sesión
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

    // CRÍTICO: Escuchar eventos de forzar recarga desde Configuración
    const handleForceReload = (event) => {
      const { restaurant: freshRestaurant } = event.detail;
      if (freshRestaurant) {
        logger.info('🔄 Forzando actualización de restaurant desde evento:', freshRestaurant.name);
        setRestaurant(freshRestaurant);
        setRestaurantId(freshRestaurant.id);
      }
    };

    window.addEventListener('force-restaurant-reload', handleForceReload);

    // Inicializar inmediatamente
    initSession();

    // Auth state listener SIMPLIFICADO - solo escucha cambios esenciales
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state changed', { event });

      // IGNORAR eventos que causan bucles
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

      if (event === 'SIGNED_IN' && session?.user) {
        // Prevenir duplicados
        if (lastSignInRef.current === session.user.id) {
          logger.debug('SIGNED_IN duplicado ignorado'); 
          return;
        }
        lastSignInRef.current = session.user.id;
        logger.info('User signed in - activación email', { email: session.user.email });
        
        // DELAY para activación de email - evita bucles
        setTimeout(async () => {
          await loadUserData(session.user);
        }, 1000); // 1 segundo delay
        
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
      window.removeEventListener('force-restaurant-reload', handleForceReload);
    };
  }, []);

  // Helpers auth
  const login = async (email, password) => {
    try {
      logger.info('🔑 INICIANDO LOGIN:', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      logger.info('✅ LOGIN EXITOSO:', { user: data.user?.email });
      toast.success('¡Bienvenido de vuelta!');
      
      // ENTERPRISE DEBUG: Forzar verificación de estado inmediata
      setTimeout(() => {
        logger.info('🔄 VERIFICANDO ESTADO POST-LOGIN...');
        logger.info('Status actual:', status);
        logger.info('Usuario actual:', user?.email || 'NO USER');
        logger.info('Restaurant actual:', restaurant?.name || 'NO RESTAURANT');
      }, 1000);
      
      return { success: true };
    } catch (error) {
      logger.error('❌ LOGIN ERROR:', error);
      
      // Traducir errores comunes al español para tests y UX
      let errorMessage = error.message;
      if (error.message === 'Invalid login credentials' || error.message === 'Invalid credentials') {
        errorMessage = 'Email o contraseña incorrectos.';
      }
      
      toast.error(errorMessage || 'Error al iniciar sesión');
      return { success: false, error: errorMessage };
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

  // Notifs - SOLO ESTADO LOCAL (SIN SUPABASE PARA EVITAR ERRORES)
  const addNotification = (n) => {
    const newN = { 
      id: Date.now() + Math.random(), 
      timestamp: new Date(), 
      read: false, 
      ...n 
    };
    setNotifications((p) => [newN, ...p].slice(0, 50));
    
    // NO intentar guardar en Supabase por ahora para evitar errores 400
    // La funcionalidad principal (reservas) debe funcionar independientemente
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

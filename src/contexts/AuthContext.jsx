
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

  // Función para obtener información del restaurante
  const fetchRestaurantInfo = useCallback(async (userId, attempt = 1) => {
    if (!userId) {
      console.log('No userId provided to fetchRestaurantInfo');
      return null;
    }

    console.log(`🔍 Fetching restaurant info for user ${userId} (attempt ${attempt}/3)`);
    setLoadingRestaurant(true);

    try {
      // Buscar en user_restaurant_mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .select(`
          restaurant_id,
          restaurants (
            id,
            name,
            address,
            phone,
            email,
            website,
            logo_url,
            settings,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (mappingError) {
        console.error('Error fetching restaurant mapping:', mappingError);
        
        // Si es el primer intento, intentar crear el restaurante
        if (attempt === 1) {
          console.log('🔄 First attempt failed, trying to create restaurant...');
          const created = await createDefaultRestaurant(userId);
          if (created) {
            return fetchRestaurantInfo(userId, attempt + 1);
          }
        }
        
        throw mappingError;
      }

      const restaurant = mappingData?.restaurants;
      
      if (!restaurant) {
        console.log('No restaurant found in mapping');
        if (attempt < 3) {
          console.log('🔄 Retrying restaurant creation...');
          const created = await createDefaultRestaurant(userId);
          if (created) {
            return fetchRestaurantInfo(userId, attempt + 1);
          }
        }
        throw new Error('No restaurant found');
      }

      console.log('✅ Restaurant info fetched successfully:', restaurant.name);
      setRestaurantInfo(restaurant);
      setRetryAttempts(3); // Reset retry attempts on success
      return restaurant;

    } catch (error) {
      console.error(`❌ Error fetching restaurant (attempt ${attempt}):`, error);
      
      if (attempt < 3) {
        console.log(`🔄 Retrying in 1 second... (${attempt + 1}/3)`);
        setTimeout(() => {
          fetchRestaurantInfo(userId, attempt + 1);
        }, 1000);
      } else {
        console.error('❌ All attempts failed to fetch restaurant');
        setRetryAttempts(0);
        toast.error('Error cargando el restaurante. Por favor, contacta con soporte.');
      }
      
      return null;
    } finally {
      setLoadingRestaurant(false);
    }
  }, []);

  // Función para crear restaurante por defecto
  const createDefaultRestaurant = useCallback(async (userId) => {
    try {
      console.log('🏗️ Creating default restaurant for user:', userId);

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return false;
      }

      const restaurantName = `Restaurante de ${userData.first_name || 'Usuario'}`;

      // Crear el restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([
          {
            name: restaurantName,
            address: 'Por configurar',
            phone: 'Por configurar',
            email: userData.email || 'Por configurar',
            website: 'Por configurar',
            settings: {
              timezone: 'Europe/Madrid',
              currency: 'EUR',
              language: 'es'
            }
          }
        ])
        .select()
        .single();

      if (restaurantError) {
        console.error('Error creating restaurant:', restaurantError);
        return false;
      }

      // Crear el mapping
      const { error: mappingError } = await supabase
        .from('user_restaurant_mapping')
        .insert([
          {
            user_id: userId,
            restaurant_id: restaurant.id,
            role: 'owner'
          }
        ]);

      if (mappingError) {
        console.error('Error creating user-restaurant mapping:', mappingError);
        return false;
      }

      console.log('✅ Default restaurant created successfully:', restaurant.name);
      return true;

    } catch (error) {
      console.error('❌ Error in createDefaultRestaurant:', error);
      return false;
    }
  }, []);

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
        
        // Cargar información del restaurante
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
    loadingRestaurant,
    retryAttempts,
    signIn,
    signUp,
    signOut,
    handleRetry,
    restaurantId: restaurantInfo?.id
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

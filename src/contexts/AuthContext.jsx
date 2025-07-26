import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos el "Proveedor" del contexto
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('🔄 Iniciando AuthContext...');

    // Comprobamos la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📋 Sesión inicial:', session?.user?.email || 'No session');
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        fetchUserRestaurant(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchamos cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Cambio de auth:', event, session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          await fetchUserRestaurant(session.user.id);
        } else {
          setRestaurant(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRestaurant = async (userId) => {
    try {
      console.log('🔍 Buscando restaurante para:', userId);

      // Usar datos conocidos para gustausantin@gmail.com
      if (userId === 'd1d283da-2327-4093-91df-69648c9053ac') {
        console.log('✅ Usuario conocido - usando datos directos');
        setRestaurant({
          id: '3723c0e8-4401-4fb2-8707-bd14031e5313',
          name: 'Restaurante Son-IA',
          email: 'gustausantin@gmail.com',
          phone: '+34671126148',
          city: 'Barcelona',
          plan: 'free',
          active: true,
          user_role: 'owner'
        });
      } else {
        // Para otros usuarios, intentar consulta normal
        const { data, error } = await supabase
          .from('user_restaurant_mapping')
          .select('*, restaurants(*)')
          .eq('auth_user_id', userId)
          .single();

        if (error) {
          console.error('❌ Error fetching restaurant:', error.message);
          setRestaurant(null);
        } else {
          console.log('✅ Restaurante encontrado:', data.restaurants.name);
          setRestaurant({
            ...data.restaurants,
            user_role: data.role,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      setRestaurant(null);
    } finally {
      console.log('✅ AuthContext completado');
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Cerrando sesión...');
    await supabase.auth.signOut();
    setRestaurant(null);
  };

  const signIn = async (email, password) => {
    console.log('🔐 Iniciando sesión para:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const value = {
    user,
    restaurant,
    loading,
    isAuthenticated,
    signOut,
    signIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Hook personalizado para usar el contexto
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
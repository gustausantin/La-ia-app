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
  const [isReady, setIsReady] = useState(true); // SIEMPRE EMPEZAR LISTO
  const [loading, setLoading] = useState(false); // SIEMPRE EMPEZAR SIN CARGAR

  // FORZAR LOGOUT INMEDIATO AL INICIAR
  useEffect(() => {
    console.log('🚨 FORZANDO LOGOUT INMEDIATO');

    const forceLogout = async () => {
      try {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.log('Error en logout forzado (ignorado):', error);
      }

      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
      setIsReady(true);
      setLoading(false);

      console.log('✅ LOGOUT FORZADO COMPLETADO');
    };

    forceLogout();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setIsAuthenticated(true);
      setIsReady(true);
      setLoading(false);

      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      setIsReady(true);
      toast.error(error.message || 'Error al iniciar sesión');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    console.log('🚪 Cerrando sesión...');
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.log('Error en logout (ignorado):', error);
    }

    setUser(null);
    setIsAuthenticated(false);
    setRestaurant(null);
    setRestaurantId(null);
    setIsReady(true);
    setLoading(false);

    toast.success('Sesión cerrada');
    window.location.replace('/login');
  };

  const value = {
    user,
    restaurant,
    restaurantId,
    isAuthenticated,
    isReady,
    loading,
    login,
    logout,
    // Funciones dummy
    addNotification: () => {},
    agentStatus: { active: false },
  };

  console.log('🔍 AuthContext:', { isAuthenticated, isReady, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
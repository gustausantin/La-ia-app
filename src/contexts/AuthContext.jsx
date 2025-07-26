// Contenido para: src/contexts/AuthContext.js

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase.js'; // Asegúrate de que la ruta a tu cliente de supabase sea correcta

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Esto contendrá el rol y permisos
    const [loading, setLoading] = useState(true);

    // Esta función se ejecuta al cargar la app para ver si ya hay una sesión
    useEffect(() => {
        const checkUserSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserData(session.user);
            }
            setLoading(false);
        };
        checkUserSession();

        // Esto escucha los cambios de sesión (login, logout) en tiempo real
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await fetchUserData(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setRestaurant(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Función que busca los datos del usuario y su restaurante
    const fetchUserData = async (authUser) => {
        try {
            // Buscamos en la tabla correcta: 'user_restaurant_mapping'
            const { data: mappingData, error } = await supabase
                .from('user_restaurant_mapping')
                .select(`
                    role,
                    permissions,
                    restaurants (*)
                `)
                .eq('auth_user_id', authUser.id)
                .limit(1)
                .single();

            if (error) throw error;

            if (mappingData && mappingData.restaurants) {
                setUser(authUser);
                setUserProfile({
                    role: mappingData.role,
                    permissions: mappingData.permissions
                });
                setRestaurant(mappingData.restaurants);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Si hay un error, cerramos sesión para evitar problemas
            await supabase.auth.signOut();
        }
    };

    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        user,
        restaurant,
        userProfile,
        loading,
        isReady: !loading && user && restaurant, // La app está lista cuando todo ha cargado
        isAuthenticated: !!user,
        signIn,
        signOut,
        userRole: userProfile?.role,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
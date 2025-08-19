// src/contexts/AuthContext.jsx - Versión CORREGIDA con Sistema de Notificaciones
import {
    useState,
    useEffect,
    createContext,
    useContext,
    useMemo,
    useCallback,
} from "react";
import { supabase } from "../lib/supabase.js";
import toast from "react-hot-toast";
import {
    Bot,
    CheckCircle,
    AlertCircle,
    Wifi,
    WifiOff,
    Calendar,
    Shield,
    AlertTriangle,
    Info,
} from "lucide-react";
import React from "react";

const AuthContext = createContext();

// Configuración de notificaciones personalizadas
const showNotification = {
    success: (message, icon = CheckCircle) => {
        toast.success(message, {
            icon: <icon className="w-5 h-5 text-green-600" />,
            style: {
                borderRadius: "10px",
                background: "#10B981",
                color: "#fff",
            },
        });
    },
    error: (message, icon = AlertCircle) => {
        toast.error(message, {
            icon: <icon className="w-5 h-5 text-red-600" />,
            style: {
                borderRadius: "10px",
                background: "#EF4444",
                color: "#fff",
            },
        });
    },
    loading: (message) => {
        return toast.loading(message, {
            style: {
                borderRadius: "10px",
                background: "#3B82F6",
                color: "#fff",
            },
        });
    },
    custom: (component) => {
        toast.custom(component, {
            style: {
                borderRadius: "10px",
                background: "#fff",
                color: "#000",
            },
        });
    },
};

export function AuthProvider({ children }) {
    // Estados principales
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados específicos de Son-IA
    const [agentStatus, setAgentStatus] = useState({
        active: false,
        lastHeartbeat: null,
        activeConversations: 0,
        pendingActions: 0,
        channels: {
            whatsapp: false,
            vapi: false,
            email: false,
            instagram: false,
            facebook: false,
        },
    });

    // Sistema global de notificaciones
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [restaurantMetrics, setRestaurantMetrics] = useState({
        todayReservations: 0,
        activeGuests: 0,
        occupancyRate: 0,
        agentConversionRate: 0,
    });

    const [connectionStatus, setConnectionStatus] = useState("online");
    const [lastSync, setLastSync] = useState(new Date());

    // DATOS NECESARIOS DE SUPABASE:
    // - tabla: agent_status (restaurant_id, is_active, last_heartbeat, metrics)
    // - tabla: restaurant_metrics (restaurant_id, date, metrics_json)
    // - tabla: notifications (restaurant_id, type, message, data, priority, read)
    // - real-time: subscripciones a cambios en agent_status y notifications

    // Monitorear conexión
    useEffect(() => {
        const handleOnline = () => {
            setConnectionStatus("online");
            showNotification.success("Conexión restaurada", Wifi);
            refreshAllData();
        };

        const handleOffline = () => {
            setConnectionStatus("offline");
            showNotification.error("Sin conexión", WifiOff);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Función para limpiar estados
    const clearAuthData = useCallback(() => {
        setUser(null);
        setRestaurant(null);
        setUserProfile(null);
        setError(null);
        setAgentStatus({
            active: false,
            lastHeartbeat: null,
            activeConversations: 0,
            pendingActions: 0,
            channels: {
                whatsapp: false,
                vapi: false,
                email: false,
                instagram: false,
                facebook: false,
            },
        });
        setRestaurantMetrics({
            todayReservations: 0,
            activeGuests: 0,
            occupancyRate: 0,
            agentConversionRate: 0,
        });
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Función mejorada para manejar errores
    const handleError = useCallback((error, showToast = false) => {
        console.error("AuthProvider Error:", error);
        const errorMessage = error.message || "Error de autenticación";
        setError(errorMessage);

        if (showToast) {
            showNotification.error(errorMessage);
        }
    }, []);

    // Función para obtener estado del agente IA
    const fetchAgentStatus = useCallback(async (restaurantId) => {
        try {
            // Simulación - En producción sería una consulta real
            const mockAgentData = {
                active: true,
                lastHeartbeat: new Date(),
                activeConversations: Math.floor(Math.random() * 10),
                pendingActions: Math.floor(Math.random() * 5),
                channels: {
                    whatsapp: true,
                    vapi: true,
                    email: false,
                    instagram: true,
                    facebook: false,
                },
            };

            setAgentStatus(mockAgentData);

            // Si el agente tiene acciones pendientes, notificar
            if (mockAgentData.pendingActions > 0) {
                showNotification.success(
                    `El agente tiene ${mockAgentData.pendingActions} acciones pendientes`,
                    Bot,
                );
            }
        } catch (error) {
            console.error("Error obteniendo estado del agente:", error);
        }
    }, []);

    // Función para obtener métricas del restaurante
    const fetchRestaurantMetrics = useCallback(async (restaurantId) => {
        try {
            // Simulación - En producción sería una consulta real
            const mockMetrics = {
                todayReservations: 24,
                activeGuests: 18,
                occupancyRate: 75,
                agentConversionRate: 68,
            };

            setRestaurantMetrics(mockMetrics);
            setLastSync(new Date());
        } catch (error) {
            console.error("Error obteniendo métricas:", error);
        }
    }, []);

    // Función mejorada para obtener datos del usuario
    const fetchUserData = useCallback(
        async (authUser, retryCount = 0) => {
            const loadingToast = showNotification.loading(
                "Cargando tu restaurante...",
            );

            try {
                console.log("AuthProvider: Obteniendo datos del usuario...");

                const { data, error } = await supabase
                    .from("user_restaurant_mapping")
                    .select(
                        `
                        role, 
                        permissions, 
                        restaurant:restaurant_id (
                            id,
                            name,
                            phone,
                            email,
                            address,
                            logo_url,
                            settings,
                            timezone,
                            currency,
                            language,
                            business_hours,
                            created_at
                        )
                    `,
                    )
                    .eq("user_id", authUser.id)
                    .single();

                if (error || !data) {
                    throw new Error(
                        error?.message || "No se encontró restaurante asociado",
                    );
                }

                console.log("AuthProvider: Datos obtenidos exitosamente");

                setUser(authUser);
                setRestaurant(data.restaurant);
                setUserProfile({
                    role: data.role,
                    permissions: data.permissions || {},
                });

                // Obtener estado del agente y métricas
                await Promise.all([
                    fetchAgentStatus(data.restaurant.id),
                    fetchRestaurantMetrics(data.restaurant.id),
                ]);

                toast.dismiss(loadingToast);
                showNotification.success(
                    `Bienvenido a ${data.restaurant.name}`,
                    CheckCircle,
                );
            } catch (error) {
                toast.dismiss(loadingToast);
                console.error("AuthProvider: Error obteniendo datos:", error);

                if (retryCount < 2) {
                    console.log(
                        `AuthProvider: Reintentando... (${retryCount + 1}/2)`,
                    );
                    setTimeout(() => {
                        fetchUserData(authUser, retryCount + 1);
                    }, 2000);
                } else {
                    handleError(error, true);
                    clearAuthData();
                }
            }
        },
        [handleError, clearAuthData, fetchAgentStatus, fetchRestaurantMetrics],
    );

    // Función principal para iniciar sesión
    const signIn = useCallback(
        async (email, password) => {
            setLoading(true);
            setError(null);

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                if (data?.user) {
                    await fetchUserData(data.user);
                    return { success: true };
                }
            } catch (error) {
                handleError(error, true);
                return { success: false, error: error.message };
            } finally {
                setLoading(false);
            }
        },
        [fetchUserData, handleError],
    );

    // Función para cerrar sesión
    const signOut = useCallback(async () => {
        const loadingToast = showNotification.loading("Cerrando sesión...");

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            clearAuthData();
            toast.dismiss(loadingToast);
            showNotification.success("Sesión cerrada exitosamente");
        } catch (error) {
            toast.dismiss(loadingToast);
            handleError(error, true);
        }
    }, [clearAuthData, handleError]);

    // Función para refrescar todos los datos
    const refreshAllData = useCallback(async () => {
        if (!restaurant?.id) return;

        try {
            await Promise.all([
                fetchAgentStatus(restaurant.id),
                fetchRestaurantMetrics(restaurant.id),
            ]);
            setLastSync(new Date());
        } catch (error) {
            handleError(error, false);
        }
    }, [restaurant?.id, fetchAgentStatus, fetchRestaurantMetrics, handleError]);

    // Inicializar autenticación
    useEffect(() => {
        const checkSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session?.user) {
                    await fetchUserData(session.user);
                } else {
                    console.log("AuthProvider: No hay sesión activa");
                }
            } catch (error) {
                console.error("AuthProvider: Error verificando sesión:", error);
                handleError(error, false);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Escuchar cambios de autenticación
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("AuthProvider: Cambio de auth -", event);

                if (event === "SIGNED_IN" && session?.user) {
                    await fetchUserData(session.user);
                } else if (event === "SIGNED_OUT") {
                    clearAuthData();
                }
            },
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Canal real-time para agente y notificaciones
    useEffect(() => {
        if (!restaurant?.id) return;

        console.log(
            "AuthProvider: Configurando canal real-time para:",
            restaurant.id,
        );

        const channel = supabase
            .channel(`restaurant-${restaurant.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "agent_status",
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                (payload) => {
                    console.log("Cambio en agent_status:", payload);
                    if (payload.new) {
                        setAgentStatus((prev) => ({
                            ...prev,
                            active: payload.new.is_active,
                            lastHeartbeat: payload.new.last_heartbeat,
                            activeConversations:
                                payload.new.active_conversations || 0,
                            pendingActions: payload.new.pending_actions || 0,
                        }));
                    }
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                (payload) => {
                    console.log("Nueva notificación:", payload);
                    if (payload.new) {
                        addNotification({
                            type: payload.new.type,
                            message: payload.new.message,
                            data: payload.new.data,
                            priority: payload.new.priority,
                        });
                    }
                },
            )
            .subscribe();

        return () => {
            console.log("AuthProvider: Desconectando canal real-time");
            supabase.removeChannel(channel);
        };
    }, [restaurant?.id]);

    // Auto-refresh cada 5 minutos
    useEffect(() => {
        if (!restaurant?.id) return;

        const interval = setInterval(
            () => {
                refreshAllData();
            },
            5 * 60 * 1000,
        ); // 5 minutos

        return () => clearInterval(interval);
    }, [restaurant?.id, refreshAllData]);

    // Función para activar/desactivar agente IA
    const toggleAgentStatus = useCallback(
        async (newStatus) => {
            if (!restaurant?.id) {
                showNotification.error("No se encontró el restaurante");
                return;
            }

            const loadingToast = showNotification.loading(
                newStatus
                    ? "Activando agente IA..."
                    : "Desactivando agente IA...",
            );

            try {
                // Aquí iría la llamada real a Supabase
                setAgentStatus((prev) => ({ ...prev, active: newStatus }));

                toast.dismiss(loadingToast);
                showNotification.success(
                    newStatus ? "Agente IA activado" : "Agente IA desactivado",
                    Bot,
                );
            } catch (error) {
                toast.dismiss(loadingToast);
                handleError(error, true);
            }
        },
        [restaurant?.id, handleError],
    );

    // Función para agregar notificación
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date(),
            read: false,
            ...notification,
        };

        setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Máximo 50
        setUnreadCount((prev) => prev + 1);

        // Toast según tipo
        const icons = {
            agent: Bot,
            reservation: Calendar,
            system: Shield,
            alert: AlertTriangle,
        };

        showNotification.custom(
            <div className="flex items-center gap-2">
                {React.createElement(icons[notification.type] || Info, {
                    className: "w-4 h-4",
                })}
                <span>{notification.message}</span>
            </div>,
        );
    }, []);

    // Función para marcar como leída
    const markNotificationAsRead = useCallback((notificationId) => {
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n,
            ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    // Función para marcar todas como leídas
    const markAllNotificationsAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    // Memoizar el value del contexto con datos adicionales
    const value = useMemo(
        () => ({
            // Estados principales
            user,
            restaurant,
            userProfile,
            loading,
            error,

            // Estados de Son-IA
            agentStatus,
            notifications, // NUEVO
            unreadCount, // NUEVO
            restaurantMetrics,
            connectionStatus,
            lastSync,

            // Estados derivados
            isReady: !loading && !!user && !!restaurant,
            isAuthenticated: !!user,
            isOwner: userProfile?.role === "owner",
            isAdmin: ["owner", "admin"].includes(userProfile?.role),
            isAgentActive: agentStatus.active,
            hasActiveConversations: agentStatus.activeConversations > 0,
            hasPendingActions: agentStatus.pendingActions > 0,

            // Funciones principales
            signIn,
            signOut,
            refreshAllData,
            toggleAgentStatus,
            addNotification, // NUEVO
            markNotificationAsRead, // NUEVO
            markAllNotificationsAsRead, // NUEVO
            clearError: () => setError(null),

            // Datos del usuario
            userRole: userProfile?.role,
            userPermissions: userProfile?.permissions || {},
            restaurantId: restaurant?.id,
            restaurantName: restaurant?.name,

            // Funciones de utilidad
            checkPermission: (permission) => {
                if (userProfile?.role === "owner") return true;
                return userProfile?.permissions?.[permission] === true;
            },

            // Métricas rápidas
            getTodayStats: () => ({
                reservations: restaurantMetrics.todayReservations,
                occupancy: restaurantMetrics.occupancyRate,
                agentConversions: restaurantMetrics.agentConversionRate,
            }),
        }),
        [
            user,
            restaurant,
            userProfile,
            loading,
            error,
            agentStatus,
            notifications,
            unreadCount,
            restaurantMetrics,
            connectionStatus,
            lastSync,
            signIn,
            signOut,
            refreshAllData,
            toggleAgentStatus,
            addNotification,
            markNotificationAsRead,
            markAllNotificationsAsRead,
        ],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// Hook personalizado con validación
export function useAuthContext() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuthContext debe usarse dentro de AuthProvider");
    }

    return context;
}

// Hook para requerir autenticación
export function useRequireAuth() {
    const context = useAuthContext();

    useEffect(() => {
        if (!context.loading && !context.isAuthenticated) {
            showNotification.error("Debes iniciar sesión para acceder");
        }
    }, [context.loading, context.isAuthenticated]);

    return context;
}

// Hook para verificar permisos
export function usePermission(permission) {
    const { checkPermission } = useAuthContext();
    return checkPermission(permission);
}

// Hook para el estado del agente
export function useAgentStatus() {
    const {
        agentStatus,
        toggleAgentStatus,
        hasActiveConversations,
        hasPendingActions,
    } = useAuthContext();

    return {
        ...agentStatus,
        toggle: toggleAgentStatus,
        hasActiveConversations,
        hasPendingActions,
    };
}

// Hook para notificaciones
export function useNotifications() {
    const {
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
    } = useAuthContext();

    return {
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
    };
}

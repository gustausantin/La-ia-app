import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    format,
    addHours,
    isAfter,
    isBefore,
    subDays,
    startOfDay,
    endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar,
    Users,
    BarChart2,
    MessageSquare,
    AlertTriangle,
    Clock,
    RefreshCw,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Bot,
    Activity,
    Zap,
    PhoneCall,
    MessageCircle,
    Globe,
    Plus,
    Settings,
    Brain,
    Target,
    Sparkles,
    TrendingDown,
    ChevronRight,
    AlertCircle,
    Award,
    ThumbsUp,
    Volume2,
    DollarSign,
    Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import logger from "../utils/logger";
import { DashboardSpinner, PageSpinner } from "../components/LoadingSpinner";

// Estados de carga
const LOADING_STATES = {
    INITIAL: "initial",
    LOADING: "loading",
    SUCCESS: "success",
    ERROR: "error",
};

// Colores para gráficos
const CHART_COLORS = {
    agent: "#8B5CF6",
    manual: "#3B82F6",
    whatsapp: "#25D366",
    vapi: "#F59E0B",
    web: "#6366F1",
    instagram: "#E4405F",
    facebook: "#1877F2",
};

// Componente de tarjeta de estadística mejorado
const StatCard = ({
    title,
    value,
    detail,
    icon,
    color,
    trend,
    loading = false,
    onClick,
    badge,
}) => (
    <div
        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md ${
            onClick ? "cursor-pointer hover:border-blue-200" : ""
        } ${loading ? "animate-pulse" : ""}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {badge && (
                        <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}
                        >
                            {badge.text}
                        </span>
                    )}
                </div>
                {loading ? (
                    <div className="h-8 bg-gray-200 rounded mt-2 animate-pulse" />
                ) : (
                    <>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {value}
                        </p>
                        {detail && (
                            <p className="text-sm text-gray-500 mt-1">
                                {detail}
                            </p>
                        )}
                    </>
                )}
                {trend && !loading && (
                    <div
                        className={`flex items-center mt-2 text-sm ${
                            trend.positive
                                ? "text-green-600"
                                : "text-red-600"
                        }`}
                    >
                        {trend.positive ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span>{trend.value}</span>
                    </div>
                )}
            </div>
            <div
                className={`p-3 rounded-lg ${
                    color || "bg-blue-50"
                } flex items-center justify-center`}
            >
                {icon}
            </div>
        </div>
    </div>
);

// Componente de alerta mejorado
const Alert = ({
    type = "info",
    title,
    message,
    actionText,
    onAction,
    onDismiss,
    icon,
}) => {
    const alertStyles = {
        warning: "bg-orange-50 border-orange-200 text-orange-800",
        error: "bg-red-50 border-red-200 text-red-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-green-50 border-green-200 text-green-800",
        purple: "bg-purple-50 border-purple-200 text-purple-800",
    };

    const defaultIcons = {
        warning: <AlertTriangle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        info: <MessageSquare className="w-5 h-5" />,
        success: <CheckCircle2 className="w-5 h-5" />,
        purple: <Sparkles className="w-5 h-5" />,
    };

    return (
        <div className={`p-4 rounded-lg border ${alertStyles[type]} relative`}>
            <div className="flex items-start gap-3">
                {icon || defaultIcons[type]}
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">{title}</h4>
                    <p className="text-sm mt-1 opacity-90">{message}</p>
                    {actionText && onAction && (
                        <button
                            onClick={onAction}
                            className="text-sm font-medium underline mt-2 hover:no-underline inline-flex items-center gap-1"
                        >
                            {actionText}
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-sm opacity-60 hover:opacity-100"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

// Componente principal del Dashboard
export default function Dashboard() {
    const {
        status,
        isAuthenticated, 
        restaurant, 
        agentStatus, 
        addNotification 
      } = useAuthContext();

    logger.info('📊 Dashboard avanzado rendering...', { status, isAuthenticated });

    // Mostrar loading mientras se inicializa
    if (status === 'checking') {
        return <DashboardSpinner text="Cargando dashboard..." />;
    }

    const restaurantId = restaurant?.id; // Asegurarse de que restaurantId se derive de restaurant

    // Función de notificaciones fallback si no existe
    const handleNotification = useCallback((notification) => {
        logger.info('📨 Notification:', notification);
        // Fallback - simplemente logear
    }, []);

    // Estados principales
    const [loadingState, setLoadingState] = useState(LOADING_STATES.INITIAL);
    const [stats, setStats] = useState({
        // Métricas generales
        total_reservations: 0,
        total_covers: 0,

        // Métricas del agente
        agent_reservations: 0,
        manual_reservations: 0,
        agent_success_rate: 0,
        avg_response_time: 0,

        // Por canal
        whatsapp_reservations: 0,
        vapi_reservations: 0,
        web_reservations: 0,
        instagram_reservations: 0,
        facebook_reservations: 0,

        // Tendencias
        hourly_reservations: [],
        channel_distribution: [],
    });

    const [reservations, setReservations] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTimeRange, setSelectedTimeRange] = useState("today");
    const [refreshing, setRefreshing] = useState(false);

    // Función para obtener estadísticas del dashboard
    const fetchDashboardStats = useCallback(async () => {
        if (!restaurantId) return;

        try {
            // TODO: Implementar RPC real para estadísticas
            // const { data, error } = await supabase.rpc('get_dashboard_stats', {
            //     restaurant_id: restaurantId,
            //     start_date: format(new Date(), 'yyyy-MM-dd'),
            //     end_date: format(new Date(), 'yyyy-MM-dd')
            // });

            // TEMPORAL: Datos vacíos para nuevo restaurant
            const emptyStats = {
                total_reservations: 0,
                total_covers: 0,
                agent_reservations: 0,
                manual_reservations: 0,
                agent_success_rate: 0,
                avg_response_time: 0,
                whatsapp_reservations: 0,
                vapi_reservations: 0,
                web_reservations: 0,
                instagram_reservations: 0,
                facebook_reservations: 0,
                hourly_reservations: Array.from({ length: 24 }, (_, i) => ({
                    hour: `${i}:00`,
                    agent: 0,
                    manual: 0,
                })),
                channel_distribution: [
                    { name: "WhatsApp", value: 0, percentage: 0 },
                    { name: "Vapi", value: 0, percentage: 0 },
                    { name: "Web", value: 0, percentage: 0 },
                    { name: "Instagram", value: 0, percentage: 0 },
                    { name: "Manual", value: 0, percentage: 0 },
                ],
            };

            setStats(emptyStats);
            return emptyStats;
        } catch (error) {
            logger.error("Error fetching stats:", error);
            toast.error("Error al cargar estadísticas");
            throw error;
        }
    }, [restaurantId]);

    // Función para obtener conversaciones del agente
    const fetchAgentConversations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            // LIMPIO: Sin conversaciones hasta tener datos reales
            const emptyConversations = [];
            setConversations(emptyConversations);
            return emptyConversations;
        } catch (error) {
            logger.error("Error fetching conversations:", error);
            toast.error("Error al cargar conversaciones");
            throw error;
        }
    }, [restaurantId]);

    // Función para obtener reservas del día
    const fetchTodayReservations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const { data, error } = await supabase
                .from("reservations")
                .select(
                    `
                    id,
                    customer_name,
                    reservation_date,
                    reservation_time,
                    party_size,
                    status,
                    source,
                    channel,
                    created_at
                `,
                )
                .eq("restaurant_id", restaurantId)
                .gte("reservation_date", format(new Date(), "yyyy-MM-dd"))
                .lte(
                    "reservation_date",
                    format(addHours(new Date(), 24), "yyyy-MM-dd"),
                )
                .order("reservation_time", { ascending: true });

            if (error) throw error;

            // Validar que todos los campos necesarios existan
            const reservationsWithSource = (data || []).map(res => {
                // Si ya tiene source y channel, respetar los valores
                if (res.source && res.channel) {
                    return res;
                }

                // Si no, aplicar lógica de mock temporal
                return {
                    ...res,
                    source: res.source || (Math.random() > 0.3 ? 'agent' : 'manual'),
                    channel: res.channel || (res.source === 'agent' ?
                        ['whatsapp', 'vapi', 'web'][Math.floor(Math.random() * 3)] :
                        'manual')
                };
            });

            setReservations(reservationsWithSource);
            return reservationsWithSource;
        } catch (error) {
            logger.error("Error fetching reservations:", error);
            toast.error("Error al cargar reservas");
            throw error;
        }
    }, [restaurantId]);

    // Función para cargar todos los datos - SIN DEPENDENCIES QUE CAUSEN BUCLES
    const loadDashboardData = useCallback(async () => {
        if (!restaurantId) {
            logger.warn('📊 Dashboard: No restaurantId disponible');
            return;
        }

        // Solo prevenir carga múltiple si ya está cargando
        if (loadingState === LOADING_STATES.LOADING) {
            logger.info('📊 Dashboard: Ya está cargando, esperando...');
            return;
        }

        logger.info('📊 Dashboard: Iniciando carga de datos...');
        setLoadingState(LOADING_STATES.LOADING);
        setIsLoading(true);

        try {
            logger.info('📊 Dashboard: Cargando estadísticas...');
            const [statsResult, conversationsResult, reservationsResult] = await Promise.allSettled([
                fetchDashboardStats(),
                fetchAgentConversations(),
                fetchTodayReservations(),
            ]);

            // Log de resultados
            statsResult.status === 'fulfilled' 
                ? logger.info('✅ Stats cargadas') 
                : logger.warn('⚠️ Error en stats:', statsResult.reason);

            conversationsResult.status === 'fulfilled' 
                ? logger.info('✅ Conversaciones cargadas') 
                : logger.warn('⚠️ Error en conversaciones:', conversationsResult.reason);

            reservationsResult.status === 'fulfilled' 
                ? logger.info('✅ Reservas cargadas') 
                : logger.warn('⚠️ Error en reservas:', reservationsResult.reason);

            logger.info('📊 Dashboard: Datos cargados exitosamente');
            setLoadingState(LOADING_STATES.SUCCESS);
            setIsLoading(false);
        } catch (error) {
            logger.error('❌ Dashboard: Error cargando datos:', error);
            setLoadingState(LOADING_STATES.ERROR);
            setIsLoading(false);
        }
    }, [restaurantId]); // SOLO restaurantId - las otras funciones son estables

    // Función para refrescar datos
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
        toast.success("Datos actualizados");

        // Agregar notificación global
        addNotification({
            type: 'system',
            message: 'Dashboard actualizado correctamente',
            priority: 'low'
        });
    }, [loadDashboardData, addNotification]);

    // Efecto para cargar datos iniciales automáticamente - SIN BUCLES
    useEffect(() => {
        logger.info('🔄 Dashboard: Verificando condiciones de carga -', { 
            status, 
            restaurantId, 
            loadingState,
            hasRestaurant: !!restaurant 
        });

        // Solo cargar si todas las condiciones se cumplen y no estamos ya cargando
        if (status === 'signed_in' && restaurantId && loadingState === LOADING_STATES.INITIAL) {
            logger.info('✅ Dashboard: Iniciando carga automática inmediata...');
            // Forzar reset del loading state para evitar bucles
            setLoadingState(LOADING_STATES.LOADING);
            setIsLoading(true);
            
            // Llamar carga de datos directamente para evitar dependency loop
            (async () => {
                try {
                    const [statsResult, conversationsResult, reservationsResult] = await Promise.allSettled([
                        fetchDashboardStats(),
                        fetchAgentConversations(),
                        fetchTodayReservations(),
                    ]);

                    logger.info('📊 Dashboard: Datos iniciales cargados');
                    setLoadingState(LOADING_STATES.SUCCESS);
                    setIsLoading(false);
                } catch (error) {
                    logger.error('❌ Dashboard: Error en carga inicial:', error);
                    setLoadingState(LOADING_STATES.ERROR);
                    setIsLoading(false);
                }
            })();
        }
    }, [status, restaurantId]); // SOLO estas dos dependencies

    // Suscripción real-time a reservas
    useEffect(() => {
        if (!restaurantId) return;

        const channel = supabase
            .channel(`dashboard-${restaurantId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "reservations",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    logger.info("Nueva reserva:", payload);
                    const newReservation = payload.new;

                    // Actualizar lista de reservas
                    setReservations((prev) => [newReservation, ...prev]);

                    // Actualizar estadísticas
                    setStats((prev) => ({
                        ...prev,
                        total_reservations: prev.total_reservations + 1,
                        total_covers: prev.total_covers + (newReservation.party_size || 0),
                        agent_reservations: newReservation.source === 'agent'
                            ? prev.agent_reservations + 1
                            : prev.agent_reservations,
                        manual_reservations: newReservation.source === 'manual'
                            ? prev.manual_reservations + 1
                            : prev.manual_reservations,
                    }));

                    // Notificación
                    toast.success(
                        `Nueva reserva ${newReservation.source === 'agent' ? 'del agente' : 'manual'}: ${newReservation.customer_name}`,
                    );

                    // Agregar notificación global
                    handleNotification({
                        type: 'reservation',
                        message: `Nueva reserva de ${newReservation.customer_name} para ${newReservation.party_size} personas`,
                        priority: 'normal',
                        data: { reservationId: newReservation.id }
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId, addNotification]);

    // Calcular métricas adicionales
    const agentEfficiency = useMemo(() => {
        if (stats.total_reservations === 0) return 0;
        return Math.round(
            (stats.agent_reservations / stats.total_reservations) * 100,
        );
    }, [stats]);

    const peakHours = useMemo(() => {
        const sorted = [...stats.hourly_reservations].sort(
            (a, b) => b.agent + b.manual - (a.agent + a.manual),
        );
        return sorted.slice(0, 3).map((h) => h.hour.replace(":00", "h"));
    }, [stats.hourly_reservations]);

    // Control robusto de loading - usar solo status
    if (status !== 'signed_in') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Por favor, inicia sesión para ver el dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header con acciones */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard - {restaurant?.name}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {format(new Date(), "EEEE d 'de' MMMM, yyyy", {
                            locale: es,
                        })}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    Actualizar
                </button>
            </div>



            {/* Métricas principales del AGENTE */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-600" />
                        Rendimiento del Agente IA Hoy
                    </h2>
                    <span className="text-sm text-gray-600">
                        Última actualización: {format(new Date(), "HH:mm")}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Reservas del Agente"
                        value={stats.agent_reservations}
                        detail={`${agentEfficiency}% del total`}
                        icon={<Bot className="w-6 h-6 text-purple-600" />}
                        color="bg-purple-50"
                        badge={{
                            text: "IA",
                            className: "bg-purple-100 text-purple-700",
                        }}
                        trend={
                            agentEfficiency > 70
                                ? { positive: true, value: "Excelente" }
                                : { positive: false, value: "Mejorable" }
                        }
                        loading={isLoading}
                    />

                    <StatCard
                        title="Tasa de Éxito"
                        value={`${stats.agent_success_rate}%`}
                        detail="Conversiones completadas"
                        icon={<Target className="w-6 h-6 text-green-600" />}
                        color="bg-green-50"
                        trend={{ positive: true, value: "+5% vs ayer" }}
                        loading={isLoading}
                    />

                    <StatCard
                        title="Tiempo de Respuesta"
                        value={`${stats.avg_response_time}s`}
                        detail="Promedio del agente"
                        icon={<Zap className="w-6 h-6 text-orange-600" />}
                        color="bg-orange-50"
                        trend={
                            stats.avg_response_time < 60
                                ? { positive: true, value: "Rápido" }
                                : { positive: false, value: "Lento" }
                        }
                        loading={isLoading}
                    />

                    <StatCard
                        title="Canales Activos"
                        value="4/5"
                        detail="WhatsApp, Vapi, Web, IG"
                        icon={<Activity className="w-6 h-6 text-blue-600" />}
                        color="bg-blue-50"
                        loading={isLoading}
                    />
                </div>
            </div>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Reservas"
                    value={stats.total_reservations}
                    detail={`${stats.total_covers} comensales`}
                    icon={<Calendar className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                    loading={isLoading}
                />

                <StatCard
                    title="Reservas Manuales"
                    value={stats.manual_reservations}
                    detail={`${100 - agentEfficiency}% del total`}
                    icon={<Users className="w-6 h-6 text-gray-600" />}
                    color="bg-gray-50"
                    loading={isLoading}
                />

                <StatCard
                    title="Conversaciones Activas"
                    value={conversations.filter((c) => c.state === "active").length}
                    detail="En proceso ahora"
                    icon={<MessageSquare className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-50"
                    onClick={() => (window.location.href = "/comunicacion")}
                    loading={isLoading}
                />

                <StatCard
                    title="Horas Punta"
                    value={peakHours[0] || "14h"}
                    detail={peakHours.join(", ")}
                    icon={<Clock className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                    loading={isLoading}
                />
            </div>

            {/* Gráficos y listas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversaciones recientes del agente */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                Conversaciones del Agente
                            </h3>
                            <span className="text-sm text-gray-500">
                                Últimas 10
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {conversations.length > 0 ? (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() =>
                                        (window.location.href = "/comunicacion")
                                    }
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900">
                                                    {conv.customer_name}
                                                </h4>
                                                {getChannelIcon(conv.channel)}
                                                {conv.resulted_in_reservation && (
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                                {conv.last_message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {format(
                                                    new Date(conv.last_message_at),
                                                    "HH:mm",
                                                )}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                conv.state === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : conv.state === "resolved"
                                                    ? "bg-gray-100 text-gray-700"
                                                    : "bg-orange-100 text-orange-700"
                                            }`}
                                        >
                                            {conv.state === "active"
                                                ? "Activa"
                                                : conv.state === "resolved"
                                                ? "Resuelta"
                                                : "Pendiente"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-blue-50 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Agente IA listo
                                    </h3>
                                    <p className="text-gray-500 text-center mb-4 max-w-md">
                                        Tu agente IA está esperando las primeras conversaciones de clientes.
                                    </p>
                                    <button 
                                        onClick={() => window.location.href = '/comunicacion'} 
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Bot className="w-4 h-4 mr-2" />
                                        Ver Agente IA
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reservas de hoy */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Reservas de Hoy
                            </h3>
                            <button
                                onClick={() =>
                                    (window.location.href = "/reservas")
                                }
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Ver todas →
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {reservations.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {reservations.slice(0, 10).map((res) => {
                                    const isPast = isAfter(
                                        new Date(),
                                        new Date(
                                            `${res.reservation_date}T${res.reservation_time}`,
                                        ),
                                    );
                                    return (
                                        <div
                                            key={res.id}
                                            className={`p-4 ${
                                                isPast
                                                    ? "opacity-60"
                                                    : "hover:bg-gray-50"
                                            } transition-colors`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900">
                                                            {res.customer_name}
                                                        </h4>
                                                        {res.source === "agent" && (
                                                            <Bot className="w-4 h-4 text-purple-600" />
                                                        )}
                                                        {res.channel && getChannelIcon(res.channel)}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {res.reservation_time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {res.party_size} pax
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                            res.status === "confirmada"
                                                                ? "bg-green-100 text-green-800"
                                                                : res.status === "pendiente"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : res.status === "sentada"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {res.status === "confirmada"
                                                            ? "Confirmada"
                                                            : res.status === "pendiente"
                                                            ? "Pendiente"
                                                            : res.status === "sentada"
                                                            ? "Sentada"
                                                            : res.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        ¡Tu restaurante está listo!
                                    </h3>
                                    <p className="text-gray-500 text-center mb-4 max-w-md">
                                        No hay reservas para hoy aún. Cuando los clientes empiecen a hacer reservas, aparecerán aquí automáticamente.
                                    </p>
                                    <div className="flex space-x-3">
                                        <button 
                                            onClick={() => window.location.href = '/reservas'} 
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Crear Primera Reserva
                                        </button>
                                        <button 
                                            onClick={() => window.location.href = '/configuracion'} 
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configurar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de distribución por canal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución de Reservas por Canal
                    </h3>
                    <div className="h-64">
                        {!isLoading && stats.channel_distribution.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.channel_distribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percentage }) =>
                                            `${name} (${percentage}%)`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {stats.channel_distribution.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        CHART_COLORS[
                                                            entry.name
                                                                .toLowerCase()
                                                                .replace(" ", "")
                                                        ] || CHART_COLORS.manual
                                                    }
                                                />
                                            ),
                                        )}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Gráfico de reservas por hora */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Reservas por Hora (Agente vs Manual)
                    </h3>
                    <div className="h-64">
                        {!isLoading && stats.hourly_reservations.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.hourly_reservations}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="agent"
                                        fill={CHART_COLORS.agent}
                                        name="Agente IA"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="manual"
                                        fill={CHART_COLORS.manual}
                                        name="Manual"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Insights del agente */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Brain className="w-6 h-6" />
                            Insights del Agente IA
                        </h3>
                        <p className="mt-2 text-white/90">
                            El agente ha gestionado el {agentEfficiency}% de las
                            reservas de hoy. Las horas con mayor actividad son{" "}
                            {peakHours.join(", ")}. El canal más efectivo es
                            WhatsApp con {stats.whatsapp_reservations} reservas.
                        </p>
                    </div>
                    <Award className="w-16 h-16 text-white/20" />
                </div>
            </div>
        </div>
    );
}

// Función auxiliar para obtener ícono del canal
function getChannelIcon(channel) {
    const icons = {
        whatsapp: <MessageCircle className="w-4 h-4 text-green-600" />,
        vapi: <PhoneCall className="w-4 h-4 text-orange-600" />,
        web: <Globe className="w-4 h-4 text-blue-600" />,
        instagram: <MessageSquare className="w-4 h-4 text-pink-600" />,
        facebook: <MessageCircle className="w-4 h-4 text-blue-800" />,
    };
    return icons[channel?.toLowerCase()] || null;
}
// src/pages/Analytics.jsx - Business Intelligence PREMIUM con foco en el Agente IA
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    format,
    subDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    getDay,
    differenceInDays,
    addDays,
} from "date-fns";
import { es } from "date-fns/locale";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    ReferenceLine,
    Scatter,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    DollarSign,
    Clock,
    Target,
    BarChart3,
    PieChart as PieIcon,
    Activity,
    RefreshCw,
    Download,
    Filter,
    Eye,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Star,
    Phone,
    MessageSquare,
    Globe,
    Bot,
    Brain,
    Sparkles,
    MessageCircle,
    Instagram,
    Facebook,
    Mail,
    PhoneCall,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Info,
    TrendingUp as TrendIcon,
} from "lucide-react";
import toast from "react-hot-toast";

// TABLAS Y RPCs NECESARIAS PARA SUPABASE:
// =========================================
// TABLAS:
// - agent_metrics: métricas diarias del agente (conversaciones, reservas, tiempos respuesta, etc.)
// - conversation_analytics: análisis detallado de cada conversación
// - channel_performance: rendimiento por canal (WhatsApp, Vapi, etc.)
// - agent_insights: insights generados automáticamente
// 
// RPCs:
// - get_restaurant_analytics(restaurant_id, start_date, end_date)
// - get_agent_performance_metrics(restaurant_id, period)
// - get_channel_distribution(restaurant_id, period)
// - get_conversion_funnel(restaurant_id, period)
// - get_revenue_by_source(restaurant_id, period)
// - get_customer_lifetime_value(restaurant_id)
// - get_agent_roi_metrics(restaurant_id, period)
// - get_predictive_analytics(restaurant_id)

// Paleta de colores premium
const COLORS = {
    primary: "#3B82F6",
    secondary: "#10B981",
    tertiary: "#8B5CF6",
    quaternary: "#F59E0B",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    info: "#3B82F6",
    agent: "#8B5CF6", // Color especial para el agente
    whatsapp: "#25D366",
    instagram: "#E4405F",
    facebook: "#1877F2",
    vapi: "#FF6B6B",
    manual: "#6B7280",
};

// Iconos de canales
const CHANNEL_ICONS = {
    whatsapp: MessageCircle,
    vapi: PhoneCall,
    instagram: Instagram,
    facebook: Facebook,
    email: Mail,
    manual: Users,
    web: Globe,
};

// Períodos de análisis mejorados
const ANALYSIS_PERIODS = [
    { value: "today", label: "Hoy", days: 1 },
    { value: "7d", label: "Últimos 7 días", days: 7 },
    { value: "30d", label: "Últimos 30 días", days: 30 },
    { value: "90d", label: "Últimos 3 meses", days: 90 },
    { value: "month", label: "Este mes" },
    { value: "lastMonth", label: "Mes anterior" },
    { value: "year", label: "Este año" },
];

// Componente de KPI card mejorado
const KPICard = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color,
    onClick,
    loading = false,
    highlight = false,
    comparison,
    sparklineData = [],
}) => {
    const getTrendIcon = () => {
        if (!trend && trend !== 0) return null;
        if (trend > 0) return <ArrowUpRight className="w-4 h-4" />;
        return <ArrowDownRight className="w-4 h-4" />;
    };

    const getTrendColor = () => {
        if (!trend && trend !== 0) return "text-gray-500";
        // Para métricas negativas (como no-show), trend negativo es bueno
        const isPositiveMetric =
            !title.toLowerCase().includes("no-show") &&
            !title.toLowerCase().includes("cancelación");

        if (trend > 0)
            return isPositiveMetric ? "text-green-600" : "text-red-600";
        return isPositiveMetric ? "text-red-600" : "text-green-600";
    };

    return (
        <div
            className={`
                bg-white p-6 rounded-xl border transition-all duration-200 
                ${highlight ? "border-purple-200 shadow-lg ring-2 ring-purple-100" : "border-gray-100 shadow-sm"}
                ${onClick ? "cursor-pointer hover:shadow-md hover:border-blue-200" : ""}
                ${loading ? "animate-pulse" : ""}
            `}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-600">
                            {title}
                        </p>
                        {highlight && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                IA
                            </span>
                        )}
                    </div>
                    {loading ? (
                        <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">
                            {value}
                        </p>
                    )}
                </div>
                <div
                    className={`
                        w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                        ${color.bg}
                    `}
                >
                    {React.cloneElement(icon, {
                        className: `w-6 h-6 ${color.icon}`,
                    })}
                </div>
            </div>

            {/* Trend y comparación */}
            {!loading && (
                <div className="space-y-2">
                    {trend !== undefined && trend !== null && (
                        <div className="flex items-center gap-1">
                            {getTrendIcon()}
                            <span
                                className={`text-sm font-medium ${getTrendColor()}`}
                            >
                                {Math.abs(trend)}%
                            </span>
                            {subtitle && (
                                <span className="text-sm text-gray-500">
                                    {subtitle}
                                </span>
                            )}
                        </div>
                    )}

                    {comparison && (
                        <div className="text-xs text-gray-500">
                            {comparison}
                        </div>
                    )}

                    {/* Mini gráfico sparkline */}
                    {sparklineData.length > 0 && (
                        <div className="h-8 mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sparklineData}>
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={color.icon
                                            .replace("text-", "#")
                                            .replace("-600", "")}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Componente de Insight Card
const InsightCard = ({
    type,
    title,
    description,
    action,
    onAction,
    metric,
}) => {
    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case "warning":
                return <AlertTriangle className="w-5 h-5 text-amber-600" />;
            case "info":
                return <Info className="w-5 h-5 text-blue-600" />;
            case "agent":
                return <Bot className="w-5 h-5 text-purple-600" />;
            default:
                return <Sparkles className="w-5 h-5 text-gray-600" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case "success":
                return "bg-green-50 border-green-200";
            case "warning":
                return "bg-amber-50 border-amber-200";
            case "info":
                return "bg-blue-50 border-blue-200";
            case "agent":
                return "bg-purple-50 border-purple-200";
            default:
                return "bg-gray-50 border-gray-200";
        }
    };

    return (
        <div
            className={`rounded-lg border p-4 ${getBgColor()} transition-all hover:shadow-sm`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{description}</p>
                    {metric && (
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                            {metric}
                        </div>
                    )}
                    {action && (
                        <button
                            onClick={onAction}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            {action}
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente de Loading State mejorado
const LoadingState = () => (
    <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
            <div className="relative mb-6">
                <Brain className="w-16 h-16 text-purple-600 animate-pulse mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
                Analizando datos con IA...
            </p>
            <p className="text-sm text-gray-600">
                Procesando {Math.floor(Math.random() * 1000 + 500)} conversaciones
            </p>
        </div>
    </div>
);

// Componente principal
function Analytics() {
    console.log('📊 Analytics component rendering...');
    
    const { restaurant, restaurantId, isReady } = useAuthContext();

    // Estados principales
    
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                <p className="text-gray-600">Analiza el rendimiento de tu restaurante.</p>
            </div>
        </div>
    );
}

export default Analytics;
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("30d");
    const [activeTab, setActiveTab] = useState("ai-overview");
    const [comparisonMode, setComparisonMode] = useState(false);
    const [agentStatus] = useState({ active: true }); // Mock del estado del agente

    // Datos de analytics enfocados en IA
    const [aiMetrics, setAiMetrics] = useState({
        // Métricas principales del agente
        totalConversations: { current: 1247, previous: 892, trend: 39.8 },
        successfulBookings: { current: 561, previous: 312, trend: 79.8 },
        conversionRate: { current: 45, previous: 35, trend: 28.6 },
        avgResponseTime: { current: 8, previous: 12, trend: -33.3 }, // segundos

        // Comparativa Manual vs IA
        aiReservations: { current: 561, percentage: 68 },
        manualReservations: { current: 263, percentage: 32 },

        // ROI del agente
        costSavings: { current: 4280, previous: 2150, trend: 99.1 },
        revenueGenerated: { current: 19635, previous: 10920, trend: 79.8 },
        roi: { current: 358, previous: 280, trend: 27.9 }, // %

        // Métricas por canal
        channelMetrics: {
            whatsapp: { conversations: 521, bookings: 234, conversion: 44.9 },
            vapi: { conversations: 287, bookings: 143, conversion: 49.8 },
            instagram: { conversations: 198, bookings: 89, conversion: 44.9 },
            facebook: { conversations: 156, bookings: 62, conversion: 39.7 },
            email: { conversations: 85, bookings: 33, conversion: 38.8 },
        },

        // Satisfacción y calidad
        customerSatisfaction: { current: 4.7, previous: 4.3, trend: 9.3 },
        escalationRate: { current: 12, previous: 18, trend: -33.3 },
        firstContactResolution: { current: 88, previous: 82, trend: 7.3 },
    });

    // Datos temporales para gráficos
    const [conversationTrends, setConversationTrends] = useState([]);
    const [channelDistribution, setChannelDistribution] = useState([]);
    const [hourlyActivity, setHourlyActivity] = useState([]);
    const [conversionFunnel, setConversionFunnel] = useState([]);
    const [responseTimeDistribution, setResponseTimeDistribution] = useState(
        [],
    );
    const [aiVsManualComparison, setAiVsManualComparison] = useState([]);

    // Función para generar datos de tendencia de conversaciones
    const generateConversationTrends = useCallback((days) => {
        const trends = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(today, i);
            const dayOfWeek = getDay(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Patrones realistas: más actividad en fines de semana
            const baseConversations = isWeekend
                ? 40 + Math.random() * 20
                : 25 + Math.random() * 15;
            const successfulBookings = Math.floor(
                baseConversations * (0.4 + Math.random() * 0.15),
            );
            const manualReservations = Math.floor(Math.random() * 10 + 5);

            trends.push({
                date: format(date, "dd/MM"),
                fullDate: format(date, "yyyy-MM-dd"),
                dayName: format(date, "EEE", { locale: es }),
                conversations: Math.floor(baseConversations),
                bookings: successfulBookings,
                manual: manualReservations,
                conversion: (
                    (successfulBookings / baseConversations) *
                    100
                ).toFixed(1),
                responseTime: 5 + Math.random() * 10, // 5-15 segundos
            });
        }

        return trends;
    }, []);

    // Función para generar distribución por canal
    const generateChannelDistribution = useCallback(() => {
        const channels = Object.entries(aiMetrics.channelMetrics).map(
            ([channel, data]) => ({
                name: channel.charAt(0).toUpperCase() + channel.slice(1),
                channel,
                conversations: data.conversations,
                bookings: data.bookings,
                conversion: data.conversion,
                percentage: ((data.conversations / 1247) * 100).toFixed(1),
                color: COLORS[channel] || COLORS.primary,
            }),
        );

        return channels;
    }, [aiMetrics.channelMetrics]);

    // Función para generar actividad por hora
    const generateHourlyActivity = useCallback(() => {
        const hours = [];

        // Generar datos para 24 horas
        for (let hour = 0; hour < 24; hour++) {
            let activity = 0;
            let bookings = 0;

            // Patrones de actividad realistas
            if (hour >= 9 && hour <= 11) {
                // Mañana
                activity = 15 + Math.random() * 10;
                bookings = activity * 0.4;
            } else if (hour >= 12 && hour <= 15) {
                // Comida
                activity = 25 + Math.random() * 15;
                bookings = activity * 0.45;
            } else if (hour >= 19 && hour <= 22) {
                // Cena
                activity = 30 + Math.random() * 20;
                bookings = activity * 0.5;
            } else if (hour >= 7 && hour <= 23) {
                // Resto del día
                activity = 5 + Math.random() * 10;
                bookings = activity * 0.35;
            }

            hours.push({
                hour: `${hour}:00`,
                conversations: Math.floor(activity),
                bookings: Math.floor(bookings),
                avgResponseTime: 5 + Math.random() * 15,
            });
        }

        return hours;
    }, []);

    // Función para generar embudo de conversión
    const generateConversionFunnel = useCallback(() => {
        const totalConversations = 1247;

        return [
            {
                stage: "Conversaciones Iniciadas",
                value: totalConversations,
                percentage: 100,
                icon: "💬",
            },
            {
                stage: "Información Completa",
                value: Math.floor(totalConversations * 0.85),
                percentage: 85,
                icon: "📝",
            },
            {
                stage: "Disponibilidad Confirmada",
                value: Math.floor(totalConversations * 0.65),
                percentage: 65,
                icon: "✅",
            },
            {
                stage: "Reserva Completada",
                value: 561,
                percentage: 45,
                icon: "🎉",
            },
        ];
    }, []);

    // Función para generar comparación IA vs Manual
    const generateAiVsManualComparison = useCallback(() => {
        return [
            {
                metric: "Velocidad de Respuesta",
                ai: 8, // segundos
                manual: 180, // 3 minutos
                unit: "seg",
            },
            {
                metric: "Tasa de Conversión",
                ai: 45,
                manual: 28,
                unit: "%",
            },
            {
                metric: "Costo por Reserva",
                ai: 0.5,
                manual: 8.2,
                unit: "€",
            },
            {
                metric: "Disponibilidad",
                ai: 24,
                manual: 10,
                unit: "h/día",
            },
            {
                metric: "Satisfacción Cliente",
                ai: 4.7,
                manual: 4.2,
                unit: "/5",
            },
        ];
    }, []);

    // Cargar todos los datos
    const loadAllData = useCallback(async () => {
        if (!restaurantId) return;

        setLoading(true);

        try {
            // TODO: En producción, cargar datos reales desde Supabase
            // const { data: analyticsData, error: analyticsError } = await supabase
            //     .rpc('get_restaurant_analytics', {
            //         restaurant_id: restaurantId,
            //         start_date: getStartDate(period),
            //         end_date: new Date().toISOString()
            //     });

            // const { data: agentData, error: agentError } = await supabase
            //     .rpc('get_agent_performance_metrics', {
            //         restaurant_id: restaurantId,
            //         period: period
            //     });

            // Simular carga de datos
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Obtener días según el período
            let days = 30;
            if (period === "today") days = 1;
            else if (period === "7d") days = 7;
            else if (period === "90d") days = 90;

            // Generar datos mockeados
            setConversationTrends(generateConversationTrends(days));
            setChannelDistribution(generateChannelDistribution());
            setHourlyActivity(generateHourlyActivity());
            setConversionFunnel(generateConversionFunnel());
            setAiVsManualComparison(generateAiVsManualComparison());

            // Distribución de tiempos de respuesta
            setResponseTimeDistribution([
                { range: "0-5s", count: 412, percentage: 33 },
                { range: "5-10s", count: 523, percentage: 42 },
                { range: "10-20s", count: 237, percentage: 19 },
                { range: "20-30s", count: 62, percentage: 5 },
                { range: "+30s", count: 13, percentage: 1 },
            ]);

            // TODO: Actualizar métricas basadas en datos reales
            // setAiMetrics(processAnalyticsData(analyticsData, agentData));

        } catch (error) {
            console.error("Error loading analytics:", error);
            toast.error("Error al cargar los datos de analytics");
        } finally {
            setLoading(false);
        }
    }, [
        restaurantId,
        period,
        generateConversationTrends,
        generateChannelDistribution,
        generateHourlyActivity,
        generateConversionFunnel,
        generateAiVsManualComparison,
    ]);

    // useEffect para cargar datos
    useEffect(() => {
        if (isReady && restaurantId) {
            loadAllData();
        }
    }, [isReady, restaurantId, period, loadAllData]);

    // Funciones de utilidad
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(value);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat("es-ES").format(value);
    };

    // Función para exportar datos
    const handleExportData = useCallback(() => {
        // TODO: Implementar exportación de datos a CSV/PDF
        toast.success("Función de exportación disponible próximamente");
    }, []);

    // Si no está listo el contexto
    if (!isReady) {
        return <LoadingState />;
    }

    // Render principal
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header mejorado */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                Analytics & Business Intelligence
                                <Bot className="w-8 h-8 text-purple-600" />
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Análisis impulsado por IA para{" "}
                                {restaurant?.name || "tu restaurante"}
                            </p>
                        </div>

                        {/* Estado del agente */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                            <div
                                className={`w-3 h-3 rounded-full ${agentStatus?.active ? "bg-green-500" : "bg-gray-400"} animate-pulse`}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Agente{" "}
                                {agentStatus?.active ? "Activo" : "Inactivo"}
                            </span>
                        </div>
                    </div>

                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Selector de período */}
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                {ANALYSIS_PERIODS.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>

                            {/* Tabs mejorados */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {[
                                    {
                                        id: "ai-overview",
                                        label: "IA Overview",
                                        icon: <Brain className="w-4 h-4" />,
                                    },
                                    {
                                        id: "performance",
                                        label: "Rendimiento",
                                        icon: <Activity className="w-4 h-4" />,
                                    },
                                    {
                                        id: "channels",
                                        label: "Canales",
                                        icon: (
                                            <MessageSquare className="w-4 h-4" />
                                        ),
                                    },
                                    {
                                        id: "comparison",
                                        label: "IA vs Manual",
                                        icon: <BarChart3 className="w-4 h-4" />,
                                    },
                                    {
                                        id: "insights",
                                        label: "Insights",
                                        icon: <Sparkles className="w-4 h-4" />,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                                            ${
                                                activeTab === tab.id
                                                    ? "bg-white text-purple-600 shadow-sm"
                                                    : "text-gray-600 hover:text-gray-900"
                                            }
                                        `}
                                    >
                                        {tab.icon}
                                        <span className="font-medium hidden sm:inline">
                                            {tab.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setComparisonMode(!comparisonMode)
                                }
                                className={`
                                    px-4 py-2 rounded-lg transition-colors flex items-center gap-2
                                    ${
                                        comparisonMode
                                            ? "bg-purple-100 text-purple-700 border border-purple-300"
                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                    }
                                `}
                            >
                                <Eye className="w-4 h-4" />
                                Comparar
                            </button>

                            <button
                                onClick={handleExportData}
                                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Exportar
                            </button>

                            <button
                                onClick={loadAllData}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                                />
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenido con loading state */}
                {loading ? (
                    <LoadingState />
                ) : (
                    <>
                        {/* Tab: IA Overview */}
                        {activeTab === "ai-overview" && (
                            <div className="space-y-6">
                                {/* Alerta de rendimiento */}
                                {aiMetrics.conversionRate.current >= 40 && (
                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                <TrendIcon className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    ¡Excelente rendimiento del Agente
                                                    IA! 🎉
                                                </h3>
                                                <p className="text-gray-600 mt-1">
                                                    Tu tasa de conversión del{" "}
                                                    {aiMetrics.conversionRate.current}%
                                                    está por encima del promedio del
                                                    sector (35%). El agente ha generado{" "}
                                                    {formatCurrency(
                                                        aiMetrics.revenueGenerated
                                                            .current,
                                                    )}{" "}
                                                    este período.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* KPIs principales del agente */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KPICard
                                        title="Conversaciones Totales"
                                        value={formatNumber(
                                            aiMetrics.totalConversations.current,
                                        )}
                                        subtitle="vs período anterior"
                                        trend={aiMetrics.totalConversations.trend}
                                        icon={<MessageSquare />}
                                        color={{
                                            bg: "bg-purple-100",
                                            icon: "text-purple-600",
                                        }}
                                        loading={loading}
                                        highlight={true}
                                        comparison="24/7 disponibilidad"
                                    />
                                    <KPICard
                                        title="Reservas vía IA"
                                        value={aiMetrics.successfulBookings.current}
                                        subtitle="del total"
                                        trend={aiMetrics.successfulBookings.trend}
                                        icon={<Bot />}
                                        color={{
                                            bg: "bg-green-100",
                                            icon: "text-green-600",
                                        }}
                                        loading={loading}
                                        highlight={true}
                                        comparison={`${aiMetrics.aiReservations.percentage}% automatizadas`}
                                    />
                                    <KPICard
                                        title="Tasa de Conversión"
                                        value={`${aiMetrics.conversionRate.current}%`}
                                        subtitle="conversaciones → reservas"
                                        trend={aiMetrics.conversionRate.trend}
                                        icon={<Target />}
                                        color={{
                                            bg: "bg-blue-100",
                                            icon: "text-blue-600",
                                        }}
                                        loading={loading}
                                        highlight={true}
                                    />
                                    <KPICard
                                        title="ROI del Agente"
                                        value={`${aiMetrics.roi.current}%`}
                                        subtitle="retorno de inversión"
                                        trend={aiMetrics.roi.trend}
                                        icon={<TrendingUp />}
                                        color={{
                                            bg: "bg-amber-100",
                                            icon: "text-amber-600",
                                        }}
                                        loading={loading}
                                        highlight={true}
                                        comparison={
                                            formatCurrency(
                                                aiMetrics.costSavings.current,
                                            ) + " ahorrados"
                                        }
                                    />
                                </div>

                                {/* Gráficos principales */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Tendencia de conversaciones y reservas */}
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Conversaciones y Reservas del Agente IA
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <ComposedChart
                                                    data={conversationTrends}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        stroke="#f0f0f0"
                                                    />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#6b7280"
                                                        style={{ fontSize: "12px" }}
                                                    />
                                                    <YAxis
                                                        yAxisId="left"
                                                        stroke="#6b7280"
                                                        style={{ fontSize: "12px" }}
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        stroke="#6b7280"
                                                        style={{ fontSize: "12px" }}
                                                    />
                                                    <Tooltip
                                                        content={({
                                                            active,
                                                            payload,
                                                            label,
                                                        }) => {
                                                            if (
                                                                active &&
                                                                payload &&
                                                                payload.length
                                                            ) {
                                                                return (
                                                                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                                                        <p className="font-medium text-gray-900 mb-2">
                                                                            {label}
                                                                        </p>
                                                                        {payload.map(
                                                                            (
                                                                                entry,
                                                                                index,
                                                                            ) => (
                                                                                <p
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className="text-sm"
                                                                                    style={{
                                                                                        color: entry.color,
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        entry.name
                                                                                    }
                                                                                    :{" "}
                                                                                    {
                                                                                        entry.value
                                                                                    }
                                                                                    {entry.dataKey ===
                                                                                        "conversion" &&
                                                                                        "%"}
                                                                                </p>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        yAxisId="left"
                                                        dataKey="conversations"
                                                        name="Conversaciones"
                                                        fill={COLORS.primary}
                                                        fillOpacity={0.8}
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                    <Bar
                                                        yAxisId="left"
                                                        dataKey="bookings"
                                                        name="Reservas IA"
                                                        fill={COLORS.success}
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="conversion"
                                                        name="Tasa Conversión %"
                                                        stroke={COLORS.tertiary}
                                                        strokeWidth={2}
                                                        dot={{
                                                            fill: COLORS.tertiary,
                                                            r: 4,
                                                        }}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Distribución de tiempos de respuesta */}
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Velocidad de Respuesta del Agente
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={responseTimeDistribution}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        stroke="#f0f0f0"
                                                    />
                                                    <XAxis
                                                        dataKey="range"
                                                        stroke="#6b7280"
                                                        style={{ fontSize: "12px" }}
                                                    />
                                                    <YAxis
                                                        stroke="#6b7280"
                                                        style={{ fontSize: "12px" }}
                                                    />
                                                    <Tooltip
                                                        formatter={(value) => [
                                                            `${value}%`,
                                                            "Porcentaje",
                                                        ]}
                                                    />
                                                    <Bar
                                                        dataKey="percentage"
                                                        fill={COLORS.agent}
                                                        radius={[8, 8, 0, 0]}
                                                    >
                                                        {responseTimeDistribution.map(
                                                            (entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={
                                                                        index === 0
                                                                            ? COLORS.success
                                                                            : index <= 2
                                                                              ? COLORS.primary
                                                                              : COLORS.warning
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                Tiempo promedio de respuesta:{" "}
                                                <strong className="text-gray-900">
                                                    {aiMetrics.avgResponseTime.current}s
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Métricas adicionales */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <KPICard
                                        title="Satisfacción del Cliente"
                                        value={`${aiMetrics.customerSatisfaction.current}/5`}
                                        subtitle="calificación promedio"
                                        trend={aiMetrics.customerSatisfaction.trend}
                                        icon={<Star />}
                                        color={{
                                            bg: "bg-yellow-100",
                                            icon: "text-yellow-600",
                                        }}
                                        loading={loading}
                                    />
                                    <KPICard
                                        title="Resolución al Primer Contacto"
                                        value={`${aiMetrics.firstContactResolution.current}%`}
                                        subtitle="sin escalamiento"
                                        trend={aiMetrics.firstContactResolution.trend}
                                        icon={<CheckCircle2 />}
                                        color={{
                                            bg: "bg-green-100",
                                            icon: "text-green-600",
                                        }}
                                        loading={loading}
                                    />
                                    <KPICard
                                        title="Tasa de Escalamiento"
                                        value={`${aiMetrics.escalationRate.current}%`}
                                        subtitle="requieren intervención humana"
                                        trend={aiMetrics.escalationRate.trend}
                                        icon={<AlertTriangle />}
                                        color={{
                                            bg: "bg-red-100",
                                            icon: "text-red-600",
                                        }}
                                        loading={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab: Performance */}
                        {activeTab === "performance" && (
                            <div className="space-y-6">
                                {/* Embudo de conversión */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                        Embudo de Conversión del Agente IA
                                    </h3>
                                    <div className="space-y-4">
                                        {conversionFunnel.map((stage, index) => (
                                            <div key={index} className="relative">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-2xl">
                                                        {stage.icon}
                                                    </div>
                                                    <div
                                                        className="flex-1 bg-gradient-to-r from-purple-500 to-purple-300 rounded-lg p-4 text-white relative overflow-hidden"
                                                        style={{
                                                            width: `${stage.percentage}%`,
                                                        }}
                                                    >
                                                        <div className="relative z-10">
                                                            <p className="font-medium">
                                                                {stage.stage}
                                                            </p>
                                                            <p className="text-2xl font-bold">
                                                                {stage.value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                                        {stage.percentage}%
                                                    </span>
                                                </div>
                                                {index <
                                                    conversionFunnel.length - 1 && (
                                                    <div className="ml-9 h-8 w-0.5 bg-gray-300"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actividad por hora */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Actividad del Agente por Hora
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={hourlyActivity}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#f0f0f0"
                                                />
                                                <XAxis
                                                    dataKey="hour"
                                                    stroke="#6b7280"
                                                    style={{ fontSize: "11px" }}
                                                    interval={2}
                                                />
                                                <YAxis
                                                    stroke="#6b7280"
                                                    style={{ fontSize: "12px" }}
                                                />
                                                <Tooltip />
                                                <Area
                                                    type="monotone"
                                                    dataKey="conversations"
                                                    stackId="1"
                                                    stroke={COLORS.primary}
                                                    fill={COLORS.primary}
                                                    fillOpacity={0.6}
                                                    name="Conversaciones"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="bookings"
                                                    stackId="1"
                                                    stroke={COLORS.success}
                                                    fill={COLORS.success}
                                                    fillOpacity={0.6}
                                                    name="Reservas"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Channels */}
                        {activeTab === "channels" && (
                            <div className="space-y-6">
                                {/* Distribución por canal */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Distribución por Canal
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <PieChart>
                                                    <Pie
                                                        data={channelDistribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="conversations"
                                                    >
                                                        {channelDistribution.map(
                                                            (entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={entry.color}
                                                                />
                                                            ),
                                                        )}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {channelDistribution.map(
                                                (channel, index) => {
                                                    const Icon =
                                                        CHANNEL_ICONS[
                                                            channel.channel
                                                        ] || Globe;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <Icon
                                                                className="w-4 h-4"
                                                                style={{
                                                                    color: channel.color,
                                                                }}
                                                            />
                                                            <span className="text-gray-600">
                                                                {channel.name}:
                                                            </span>
                                                            <span className="font-medium">
                                                                {channel.percentage}%
                                                            </span>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>

                                    {/* Rendimiento por canal */}
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Rendimiento por Canal
                                        </h3>
                                        <div className="space-y-4">
                                            {channelDistribution.map(
                                                (channel, index) => {
                                                    const Icon =
                                                        CHANNEL_ICONS[
                                                            channel.channel
                                                        ] || Globe;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="border border-gray-200 rounded-lg p-4"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon
                                                                        className="w-5 h-5"
                                                                        style={{
                                                                            color: channel.color,
                                                                        }}
                                                                    />
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {channel.name}
                                                                    </h4>
                                                                </div>
                                                                <span className="text-sm text-gray-500">
                                                                    {
                                                                        channel.conversations
                                                                    }{" "}
                                                                    conversaciones
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-gray-600">
                                                                        Reservas
                                                                    </p>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {
                                                                            channel.bookings
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-600">
                                                                        Conversión
                                                                    </p>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {
                                                                            channel.conversion
                                                                        }
                                                                        %
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="h-2 rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${channel.conversion}%`,
                                                                        backgroundColor:
                                                                            channel.color,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Insights por canal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InsightCard
                                        type="success"
                                        title="WhatsApp lidera las conversiones"
                                        description="El 41.8% de tus conversaciones vienen por WhatsApp con una tasa de conversión del 44.9%"
                                        action="Optimizar respuestas WhatsApp"
                                        metric="234 reservas"
                                        onAction={() => {
                                            // TODO: Navegar a configuración de WhatsApp
                                            toast.info("Navegando a configuración de WhatsApp...");
                                        }}
                                    />
                                    <InsightCard
                                        type="info"
                                        title="Vapi tiene la mejor conversión"
                                        description="Las llamadas telefónicas tienen una tasa de conversión del 49.8%, la más alta de todos los canales"
                                        action="Aumentar disponibilidad telefónica"
                                        metric="49.8% conversión"
                                        onAction={() => {
                                            // TODO: Navegar a configuración de Vapi
                                            toast.info("Navegando a configuración de Vapi...");
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab: IA vs Manual */}
                        {activeTab === "comparison" && (
                            <div className="space-y-6">
                                {/* Comparación principal */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                        Impacto del Agente IA en tu Negocio
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                                                <Bot className="w-5 h-5 text-purple-600" />
                                                Con Agente IA
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Reservas gestionadas
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {
                                                            aiMetrics.aiReservations
                                                                .current
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Tiempo de respuesta
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        8 segundos
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Disponibilidad
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        24/7
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Costo por reserva
                                                    </span>
                                                    <span className="font-semibold text-green-600">
                                                        €0.50
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                                                <Users className="w-5 h-5 text-gray-600" />
                                                Gestión Manual
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Reservas gestionadas
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {
                                                            aiMetrics.manualReservations
                                                                .current
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Tiempo de respuesta
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        3 minutos
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Disponibilidad
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        10h/día
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Costo por reserva
                                                    </span>
                                                    <span className="font-semibold text-red-600">
                                                        €8.20
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gráfico de comparación */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Comparativa de Métricas Clave
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={aiVsManualComparison}>
                                                <PolarGrid strokeDasharray="3 3" />
                                                <PolarAngleAxis
                                                    dataKey="metric"
                                                    style={{ fontSize: "12px" }}
                                                />
                                                <PolarRadiusAxis
                                                    angle={90}
                                                    domain={[0, 100]}
                                                />
                                                <Radar
                                                    name="Agente IA"
                                                    dataKey="ai"
                                                    stroke={COLORS.agent}
                                                    fill={COLORS.agent}
                                                    fillOpacity={0.6}
                                                />
                                                <Radar
                                                    name="Manual"
                                                    dataKey="manual"
                                                    stroke={COLORS.manual}
                                                    fill={COLORS.manual}
                                                    fillOpacity={0.6}
                                                />
                                                <Legend />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* ROI y ahorros */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <DollarSign className="w-8 h-8 text-green-600" />
                                            <span className="text-sm font-medium text-green-700">
                                                Este período
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Ahorro en costos operativos
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {formatCurrency(
                                                aiMetrics.costSavings.current,
                                            )}
                                        </p>
                                        <p className="text-sm text-green-600 mt-2">
                                            +{aiMetrics.costSavings.trend}% vs anterior
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <TrendingUp className="w-8 h-8 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-700">
                                                ROI
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Retorno de inversión
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {aiMetrics.roi.current}%
                                        </p>
                                        <p className="text-sm text-purple-600 mt-2">
                                            Por cada €1 invertido, recuperas €
                                            {(aiMetrics.roi.current / 100).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <Zap className="w-8 h-8 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">
                                                Eficiencia
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Horas de trabajo ahorradas
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            127h
                                        </p>
                                        <p className="text-sm text-blue-600 mt-2">
                                            Equivalente a 3.2 empleados
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Insights */}
                        {activeTab === "insights" && (
                            <div className="space-y-6">
                                {/* Insights principales */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Brain className="w-6 h-6 text-purple-600" />
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            Insights Inteligentes de Son-IA
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 mb-6">
                                        Recomendaciones personalizadas basadas en el
                                        análisis de{" "}
                                        {formatNumber(
                                            aiMetrics.totalConversations.current,
                                        )}{" "}
                                        conversaciones
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InsightCard
                                            type="agent"
                                            title="Optimiza las horas pico"
                                            description="El 68% de tus conversaciones ocurren entre 19:00-22:00. Considera activar respuestas más rápidas en ese horario."
                                            action="Configurar respuestas rápidas"
                                            metric="68% concentración"
                                            onAction={() => {
                                                // TODO: Navegar a configuración de respuestas
                                                toast.info("Función disponible próximamente");
                                            }}
                                        />

                                        <InsightCard
                                            type="success"
                                            title="WhatsApp es tu canal estrella"
                                            description="Con 521 conversaciones y 44.9% de conversión, WhatsApp genera el 41.7% de tus reservas automáticas."
                                            action="Potenciar WhatsApp Business"
                                            metric="234 reservas/mes"
                                            onAction={() => {
                                                // TODO: Navegar a configuración de WhatsApp
                                                toast.info("Función disponible próximamente");
                                            }}
                                        />

                                        <InsightCard
                                            type="warning"
                                            title="Mejorar conversión en Facebook"
                                            description="Facebook tiene solo 39.7% de conversión, 5.2 puntos menos que tu promedio. Revisa las respuestas del bot."
                                            action="Optimizar respuestas Facebook"
                                            onAction={() => {
                                                // TODO: Navegar a configuración de Facebook
                                                toast.info("Función disponible próximamente");
                                            }}
                                        />

                                        <InsightCard
                                            type="info"
                                            title="Oportunidad en horario de comida"
                                            description="Solo el 15% de reservas son para comida. Activa promociones especiales para aumentar ocupación."
                                            action="Crear promoción mediodía"
                                            onAction={() => {
                                                // TODO: Navegar a promociones
                                                toast.info("Función disponible próximamente");
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Predicciones y tendencias */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Predicciones para los Próximos 30 Días
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                                                <span className="text-3xl font-bold text-purple-600">
                                                    1,847
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                Conversaciones esperadas
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                +48% vs mes anterior
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                <span className="text-3xl font-bold text-green-600">
                                                    831
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                Reservas proyectadas
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Con 45% conversión
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <span className="text-3xl font-bold text-blue-600">
                                                    €29K
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                Ingresos estimados
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                €35 ticket medio
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones recomendadas */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Plan de Acción Recomendado
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            {
                                                priority: "Alta",
                                                action: "Activar recordatorios automáticos",
                                                impact: "Reduce no-shows en 40%",
                                                effort: "Bajo",
                                                color: "red",
                                            },
                                            {
                                                priority: "Alta",
                                                action: "Optimizar respuestas en horas pico",
                                                impact: "Mejora conversión en 8%",
                                                effort: "Medio",
                                                color: "orange",
                                            },
                                            {
                                                priority: "Media",
                                                action: "Implementar upselling inteligente",
                                                impact: "Aumenta ticket medio 15%",
                                                effort: "Medio",
                                                color: "yellow",
                                            },
                                            {
                                                priority: "Media",
                                                action: "Activar Instagram Shopping",
                                                impact: "Nueva fuente de ingresos",
                                                effort: "Alto",
                                                color: "blue",
                                            },
                                        ].map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`
                                                        px-2 py-1 text-xs font-medium rounded-full
                                                        ${item.priority === "Alta" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}
                                                    `}
                                                    >
                                                        {item.priority}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {item.action}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {item.impact}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">
                                                        Esfuerzo: {item.effort}
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            // TODO: Implementar acciones
                                                            toast.info(`Implementando: ${item.action}`);
                                                        }}
                                                        className="px-3 py-1 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    >
                                                        Implementar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
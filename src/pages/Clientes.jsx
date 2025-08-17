// Clientes.jsx - CRM PREMIUM con IA predictiva y segmentación automática
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    format,
    parseISO,
    differenceInDays,
    subDays,
    addMonths,
    isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Legend,
} from "recharts";
import {
    Search,
    Plus,
    Filter,
    Users,
    Calendar,
    Star,
    TrendingUp,
    TrendingDown,
    Phone,
    Mail,
    MessageSquare,
    Eye,
    Edit,
    MoreVertical,
    RefreshCw,
    Download,
    Gift,
    AlertTriangle,
    Clock,
    MapPin,
    Target,
    Bot,
    Brain,
    Sparkles,
    MessageCircle,
    Instagram,
    Facebook,
    PhoneCall,
    Globe,
    Zap,
    UserCheck,
    UserX,
    Heart,
    DollarSign,
    Activity,
    Send,
    BellRing,
    Coffee,
    Award,
    ChevronRight,
    BarChart3,
    PieChart as PieIcon,
    Info,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

// TABLAS Y RPCs NECESARIAS PARA SUPABASE:
// =========================================
// TABLAS:
// - customers: tabla principal con campos adicionales:
//   - acquisition_channel (whatsapp, vapi, instagram, facebook, web, manual)
//   - ai_score (puntuación predictiva del cliente)
//   - predicted_ltv (valor de vida predicho)
//   - churn_risk_score (riesgo de abandono)
//   - preferred_channel (canal preferido de comunicación)
//   - ai_segment (segmento asignado por IA)
//
// - customer_interactions: historial de interacciones con el agente
//   - customer_id, type, channel, message, response, created_at
//
// - customer_preferences_ai: preferencias detectadas por IA
//   - customer_id, preference_type, value, confidence_score
//
// - customer_campaigns: campañas enviadas a clientes
//   - customer_id, campaign_id, sent_at, opened_at, converted_at
//
// RPCs:
// - get_customer_analytics(restaurant_id)
// - get_customer_predictions(customer_id)
// - get_customer_lifetime_value(customer_id)
// - get_segmentation_insights(restaurant_id)
// - launch_ai_campaign(restaurant_id, segment, message, channel)
//
// Segmentación mejorada con IA
const CUSTOMER_SEGMENTS = {
    new: {
        label: "Nuevo",
        description: "Primera visita (1 reserva)",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "🌟",
        aiAction: "Enviar bienvenida personalizada",
        criteria: (customer) => customer.total_reservations === 1,
    },
    occasional: {
        label: "Ocasional",
        description: "2-4 visitas",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "👤",
        aiAction: "Incentivar frecuencia",
        criteria: (customer) =>
            customer.total_reservations >= 2 &&
            customer.total_reservations <= 4,
    },
    regular: {
        label: "Regular",
        description: "5-9 visitas",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "⭐",
        aiAction: "Fidelizar con beneficios",
        criteria: (customer) =>
            customer.total_reservations >= 5 &&
            customer.total_reservations <= 9,
    },
    loyal: {
        label: "Fiel",
        description: "10+ visitas",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: "💎",
        aiAction: "Mantener satisfacción",
        criteria: (customer) =>
            customer.total_reservations >= 10 && !customer.vip_status,
    },
    vip: {
        label: "VIP",
        description: "Cliente VIP premium",
        color: "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border-orange-300",
        icon: "👑",
        aiAction: "Experiencias exclusivas",
        criteria: (customer) => customer.vip_status,
    },
    inactive: {
        label: "Inactivo",
        description: "Sin visitas >60 días",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "😴",
        aiAction: "Campaña de reactivación",
        criteria: (customer) => {
            if (!customer.last_visit) return false;
            const daysSinceLastVisit = differenceInDays(
                new Date(),
                parseISO(customer.last_visit),
            );
            return daysSinceLastVisit > 60;
        },
    },
    risk: {
        label: "En Riesgo",
        description: "Alto ratio de no-shows",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "⚠️",
        aiAction: "Intervención preventiva",
        criteria: (customer) => {
            if (customer.total_reservations === 0) return false;
            const noShowRate =
                (customer.total_no_shows || 0) / customer.total_reservations;
            return noShowRate > 0.3;
        },
    },
    birthday: {
        label: "Cumpleaños",
        description: "Cumpleaños este mes",
        color: "bg-pink-100 text-pink-800 border-pink-200",
        icon: "🎂",
        aiAction: "Oferta de cumpleaños",
        criteria: (customer) => {
            if (!customer.birthday) return false;
            const birthday = parseISO(customer.birthday);
            const thisMonth = new Date().getMonth();
            return birthday.getMonth() === thisMonth;
        },
    },
};

// Colores para gráficos
const CHART_COLORS = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
];

// Componente de estadística mejorado
const CustomerStatsCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
    trend,
    onClick,
    isAI = false,
}) => (
    <div
        onClick={onClick}
        className={`
            bg-white p-6 rounded-xl shadow-sm border transition-all
            ${onClick ? "cursor-pointer hover:shadow-md hover:border-purple-200" : "border-gray-100"}
            ${isAI ? "bg-gradient-to-br from-purple-50 to-white" : ""}
        `}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {isAI && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            IA
                        </span>
                    )}
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {subtitle && (
                    <div className="flex items-center gap-1 mt-1">
                        {trend &&
                            (trend > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                            ))}
                        <p
                            className={`text-sm ${color?.text || "text-gray-600"}`}
                        >
                            {subtitle}
                        </p>
                    </div>
                )}
            </div>
            <div
                className={`
                w-12 h-12 rounded-lg flex items-center justify-center
                ${color?.bg || "bg-gray-100"}
            `}
            >
                {React.cloneElement(icon, {
                    className: `w-6 h-6 ${color?.icon || "text-gray-600"}`,
                })}
            </div>
        </div>
    </div>
);

// Componente de tarjeta de cliente mejorado con IA
const CustomerCard = ({ customer, onAction }) => {
    const [showActions, setShowActions] = useState(false);
    const [showAIInsights, setShowAIInsights] = useState(false);

    // Determinar segmento del cliente
    const segment =
        Object.entries(CUSTOMER_SEGMENTS).find(([key, seg]) =>
            seg.criteria(customer),
        )?.[1] || CUSTOMER_SEGMENTS.occasional;

    // Simular datos de IA
    const aiData = {
        source: customer.acquisition_channel || "manual",
        predictedLTV: Math.round(
            (customer.total_reservations || 0) * 62.5 * 1.8,
        ),
        churnRisk:
            customer.total_reservations > 0 && !customer.last_visit
                ? "high"
                : differenceInDays(
                        new Date(),
                        parseISO(customer.last_visit || new Date()),
                    ) > 45
                  ? "medium"
                  : "low",
        nextVisitProbability:
            customer.total_reservations > 5
                ? 85
                : customer.total_reservations > 2
                  ? 65
                  : 40,
        preferredChannel: customer.preferred_channel || "whatsapp",
        lastAIInteraction: customer.last_ai_interaction || null,
    };

    const formatLastVisit = (lastVisit) => {
        if (!lastVisit) return "Nunca";
        const days = differenceInDays(new Date(), parseISO(lastVisit));
        if (days === 0) return "Hoy";
        if (days === 1) return "Ayer";
        if (days < 7) return `Hace ${days} días`;
        if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
        return `Hace ${Math.floor(days / 30)} meses`;
    };

    const getSourceIcon = (source) => {
        const icons = {
            whatsapp: MessageCircle,
            vapi: PhoneCall,
            instagram: Instagram,
            facebook: Facebook,
            web: Globe,
            manual: UserCheck,
            email: Mail,
        };
        return icons[source] || Users;
    };

    const SourceIcon = getSourceIcon(aiData.source);

    return (
        <div
            className={`
            bg-white border rounded-xl p-6 transition-all duration-200
            ${showAIInsights ? "border-purple-300 shadow-lg" : "border-gray-200 hover:shadow-md"}
        `}
        >
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Avatar con indicador de origen */}
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            {aiData.source !== "manual" && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Bot className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Información principal */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                    {customer.name}
                                </h4>
                                <span
                                    className={`
                                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                                    ${segment.color}
                                `}
                                >
                                    <span className="mr-1">{segment.icon}</span>
                                    {segment.label}
                                </span>
                                {customer.vip_status && (
                                    <Award className="w-5 h-5 text-orange-500" />
                                )}
                            </div>

                            {/* Contacto y métricas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{customer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        Última:{" "}
                                        {formatLastVisit(customer.last_visit)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <SourceIcon className="w-4 h-4 text-purple-600" />
                                    <span>Origen: {aiData.source}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    <span>LTV: €{aiData.predictedLTV}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menú de acciones */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showActions && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-20 min-w-[200px]">
                                <button
                                    onClick={() => {
                                        onAction("view", customer);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver perfil completo
                                </button>

                                <button
                                    onClick={() => {
                                        onAction("aiChat", customer);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center gap-2 text-purple-600"
                                >
                                    <Bot className="w-4 h-4" />
                                    Enviar mensaje IA
                                </button>

                                <button
                                    onClick={() => {
                                        onAction("whatsapp", customer);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-green-600"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    WhatsApp manual
                                </button>

                                <hr className="my-1" />

                                <button
                                    onClick={() => {
                                        onAction("createReservation", customer);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Nueva reserva
                                </button>

                                <button
                                    onClick={() => {
                                        onAction("edit", customer);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar información
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Métricas rápidas */}
                <div className="flex items-center gap-6 text-center">
                    <div>
                        <div className="text-lg font-bold text-gray-900">
                            {customer.total_reservations || 0}
                        </div>
                        <div className="text-xs text-gray-500">Reservas</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-green-600">
                            {customer.total_reservations > 0
                                ? Math.round(
                                      (1 -
                                          (customer.total_no_shows || 0) /
                                              customer.total_reservations) *
                                          100,
                                  )
                                : 100}
                            %
                        </div>
                        <div className="text-xs text-gray-500">Fiabilidad</div>
                    </div>
                    <div>
                        <div
                            className={`
                            text-lg font-bold
                            ${
                                aiData.churnRisk === "high"
                                    ? "text-red-600"
                                    : aiData.churnRisk === "medium"
                                      ? "text-yellow-600"
                                      : "text-green-600"
                            }
                        `}
                        >
                            {aiData.churnRisk === "high"
                                ? "Alto"
                                : aiData.churnRisk === "medium"
                                  ? "Medio"
                                  : "Bajo"}
                        </div>
                        <div className="text-xs text-gray-500">
                            Riesgo churn
                        </div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-purple-600">
                            {aiData.nextVisitProbability}%
                        </div>
                        <div className="text-xs text-gray-500">
                            Prob. retorno
                        </div>
                    </div>
                </div>

                {/* Toggle de insights IA */}
                <button
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    className={`
                        w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all
                        ${
                            showAIInsights
                                ? "bg-purple-100 text-purple-700 border border-purple-300"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }
                    `}
                >
                    <Brain className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        {showAIInsights ? "Ocultar" : "Ver"} Insights IA
                    </span>
                    <ChevronRight
                        className={`
                        w-4 h-4 transition-transform
                        ${showAIInsights ? "rotate-90" : ""}
                    `}
                    />
                </button>

                {/* Panel de insights IA */}
                {showAIInsights && (
                    <div className="space-y-3 pt-2 animate-fade-in">
                        {/* Recomendación principal */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 mb-1">
                                        Acción recomendada: {segment.aiAction}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {aiData.churnRisk === "high"
                                            ? `Cliente en riesgo alto de abandono. Última visita hace ${differenceInDays(new Date(), parseISO(customer.last_visit || new Date()))} días. Enviar oferta especial urgente.`
                                            : aiData.nextVisitProbability > 70
                                              ? "Cliente con alta probabilidad de retorno. Mantener comunicación regular."
                                              : "Incentivar próxima visita con descuento o experiencia especial."}
                                    </p>
                                    <button className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700">
                                        Ejecutar acción →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preferencias detectadas */}
                        {customer.ai_preferences && (
                            <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-900 mb-1">
                                    Preferencias detectadas por IA:
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[
                                        "Mesa tranquila",
                                        "Vino tinto",
                                        "Menú vegano",
                                    ].map((pref, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                        >
                                            {pref}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Historial IA */}
                        {aiData.lastAIInteraction && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                Última interacción IA:{" "}
                                {formatLastVisit(aiData.lastAIInteraction)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Loading state mejorado
const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <div className="relative mb-6">
                <Brain className="w-16 h-16 text-purple-600 animate-pulse mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
                Cargando CRM inteligente...
            </p>
            <p className="text-sm text-gray-600">
                Analizando {Math.floor(Math.random() * 200 + 100)} perfiles de
                clientes
            </p>
        </div>
    </div>
);

// Componente principal
function Clientes() {
    console.log('👥 Clientes component rendering...');

    const { restaurant, restaurantId, isReady, agentStatus, addNotification } = useAuthContext();

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({});
    const [activeView, setActiveView] = useState("list"); // list, insights, campaigns

    // Estados de filtros
    const [filters, setFilters] = useState({
        search: "",
        segment: "all",
        source: "all",
        vipOnly: false,
        riskOnly: false,
        sortBy: "recent",
    });

    // Estados de modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAICampaignModal, setShowAICampaignModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedSegment, setSelectedSegment] = useState(null);

    // Datos simulados para gráficos
    const [analyticsData, setAnalyticsData] = useState({
        acquisitionTrend: [],
        segmentDistribution: [],
        channelPerformance: [],
        retentionCohorts: [],
        lifetimeValueDistribution: [],
    });

    // Generar datos de analytics
    const generateAnalyticsData = useCallback((customersData) => {
        // Tendencia de adquisición (últimos 6 meses)
        const acquisitionTrend = [];
        for (let i = 5; i >= 0; i--) {
            const month = subDays(new Date(), i * 30);
            acquisitionTrend.push({
                month: format(month, "MMM", { locale: es }),
                manual: Math.floor(Math.random() * 20) + 10,
                ai: Math.floor(Math.random() * 40) + 20,
                total: 0,
            });
            acquisitionTrend[acquisitionTrend.length - 1].total =
                acquisitionTrend[acquisitionTrend.length - 1].manual +
                acquisitionTrend[acquisitionTrend.length - 1].ai;
        }

        // Distribución por segmento
        const segmentDistribution = Object.entries(CUSTOMER_SEGMENTS).map(
            ([key, segment]) => ({
                name: segment.label,
                value: customersData.filter((c) => segment.criteria(c)).length,
                percentage: 0,
            }),
        );
        const totalCustomers = segmentDistribution.reduce(
            (sum, s) => sum + s.value,
            0,
        );
        segmentDistribution.forEach((s) => {
            s.percentage =
                totalCustomers > 0
                    ? Math.round((s.value / totalCustomers) * 100)
                    : 0;
        });

        // Rendimiento por canal
        const channels = [
            "whatsapp",
            "vapi",
            "instagram",
            "facebook",
            "web",
            "manual",
        ];
        const channelPerformance = channels.map((channel) => ({
            channel: channel.charAt(0).toUpperCase() + channel.slice(1),
            customers: Math.floor(Math.random() * 100) + 20,
            conversion: Math.floor(Math.random() * 30) + 40,
            ltv: Math.floor(Math.random() * 50) + 80,
        }));

        // Cohortes de retención
        const retentionCohorts = [
            { month: "1 mes", retention: 85 },
            { month: "3 meses", retention: 72 },
            { month: "6 meses", retention: 58 },
            { month: "12 meses", retention: 42 },
        ];

        // Distribución de valor de vida
        const lifetimeValueDistribution = [
            { range: "€0-50", count: 120 },
            { range: "€50-100", count: 180 },
            { range: "€100-200", count: 220 },
            { range: "€200-500", count: 150 },
            { range: "€500+", count: 80 },
        ];

        setAnalyticsData({
            acquisitionTrend,
            segmentDistribution,
            channelPerformance,
            retentionCohorts,
            lifetimeValueDistribution,
        });
    }, []);

    // Función para cargar clientes
    const loadCustomers = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            // TODO: En producción, cargar datos reales desde Supabase
            // const { data: customersData, error } = await supabase
            //     .from("customers")
            //     .select(`
            //         *,
            //         customer_interactions (count),
            //         customer_preferences_ai (*)
            //     `)
            //     .eq("restaurant_id", restaurantId)
            //     .order("created_at", { ascending: false });

            // Simular carga con datos enriquecidos
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const mockCustomers = [
                {
                    id: 1,
                    restaurant_id: restaurantId,
                    name: "María García",
                    phone: "+34 600 123 456",
                    email: "maria@email.com",
                    birthday: "1985-03-15",
                    total_reservations: 28,
                    total_no_shows: 1,
                    last_visit: format(subDays(new Date(), 5), "yyyy-MM-dd"),
                    vip_status: true,
                    acquisition_channel: "whatsapp",
                    preferred_channel: "whatsapp",
                    ai_preferences: [
                        "Mesa tranquila",
                        "Vino tinto",
                        "Menú degustación",
                    ],
                    last_ai_interaction: format(
                        subDays(new Date(), 2),
                        "yyyy-MM-dd",
                    ),
                    created_at: "2023-01-15",
                    preferences: "Mesa junto a la ventana",
                    dietary_restrictions: "Sin gluten",
                    notes: "Cliente muy fiel, celebra todos los cumpleaños aquí",
                },
                {
                    id: 2,
                    restaurant_id: restaurantId,
                    name: "Carlos Rodríguez",
                    phone: "+34 611 234 567",
                    email: "carlos@email.com",
                    total_reservations: 15,
                    total_no_shows: 2,
                    last_visit: format(subDays(new Date(), 12), "yyyy-MM-dd"),
                    vip_status: false,
                    acquisition_channel: "vapi",
                    preferred_channel: "phone",
                    ai_preferences: ["Menú ejecutivo", "Mesa rápida"],
                    last_ai_interaction: format(
                        subDays(new Date(), 10),
                        "yyyy-MM-dd",
                    ),
                    created_at: "2023-06-20",
                },
                {
                    id: 3,
                    restaurant_id: restaurantId,
                    name: "Ana Martínez",
                    phone: "+34 622 345 678",
                    email: "ana@email.com",
                    birthday: "1990-07-22",
                    total_reservations: 3,
                    total_no_shows: 0,
                    last_visit: format(subDays(new Date(), 25), "yyyy-MM-dd"),
                    vip_status: false,
                    acquisition_channel: "instagram",
                    preferred_channel: "instagram",
                    ai_preferences: ["Platos veganos", "Terraza"],
                    created_at: "2024-01-10",
                },
                {
                    id: 4,
                    restaurant_id: restaurantId,
                    name: "Javier López",
                    phone: "+34 633 456 789",
                    total_reservations: 1,
                    total_no_shows: 0,
                    last_visit: format(subDays(new Date(), 3), "yyyy-MM-dd"),
                    vip_status: false,
                    acquisition_channel: "manual",
                    created_at: format(subDays(new Date(), 3), "yyyy-MM-dd"),
                },
                {
                    id: 5,
                    restaurant_id: restaurantId,
                    name: "Laura Sánchez",
                    phone: "+34 644 567 890",
                    email: "laura@email.com",
                    total_reservations: 8,
                    total_no_shows: 4,
                    last_visit: format(subDays(new Date(), 70), "yyyy-MM-dd"),
                    vip_status: false,
                    acquisition_channel: "facebook",
                    preferred_channel: "email",
                    created_at: "2023-09-05",
                    notes: "Alto ratio de no-shows, necesita recordatorios",
                },
            ];

            setCustomers(mockCustomers);
            calculateStats(mockCustomers);
            generateAnalyticsData(mockCustomers);
        } catch (error) {
            console.error("Error loading customers:", error);
            toast.error("Error al cargar los clientes");
        } finally {
            setLoading(false);
        }
    }, [restaurantId, generateAnalyticsData]);

    // Función para calcular estadísticas mejoradas
    const calculateStats = useCallback((customersData) => {
        const total = customersData.length;
        const thisMonth = subDays(new Date(), 30);

        const newThisMonth = customersData.filter(
            (c) => parseISO(c.created_at) >= thisMonth,
        ).length;

        const vipCustomers = customersData.filter((c) => c.vip_status).length;

        // Estadísticas por origen
        const aiCustomers = customersData.filter(
            (c) => c.acquisition_channel !== "manual",
        ).length;
        const manualCustomers = customersData.filter(
            (c) => c.acquisition_channel === "manual",
        ).length;

        // Clientes en riesgo
        const atRiskCustomers = customersData.filter((c) => {
            if (!c.last_visit) return false;
            const daysSince = differenceInDays(
                new Date(),
                parseISO(c.last_visit),
            );
            return (
                daysSince > 45 ||
                (c.total_no_shows > 0 &&
                    c.total_no_shows / c.total_reservations > 0.3)
            );
        }).length;

        // Valor total y promedio
        const totalVisits = customersData.reduce(
            (sum, c) => sum + (c.total_reservations || 0),
            0,
        );
        const avgTicket = 35; // Euros promedio
        const avgPartySize = 2.5;
        const totalValue = Math.round(totalVisits * avgTicket * avgPartySize);
        const avgCustomerValue = total > 0 ? Math.round(totalValue / total) : 0;

        // Tasa de retención
        const returningCustomers = customersData.filter(
            (c) => (c.total_reservations || 0) > 1,
        ).length;
        const retentionRate =
            total > 0 ? Math.round((returningCustomers / total) * 100) : 0;

        // Segmentación
        const segments = {};
        Object.keys(CUSTOMER_SEGMENTS).forEach((segmentKey) => {
            segments[segmentKey] = customersData.filter((c) =>
                CUSTOMER_SEGMENTS[segmentKey].criteria(c),
            ).length;
        });

        setStats({
            total,
            newThisMonth,
            vipCustomers,
            aiCustomers,
            manualCustomers,
            atRiskCustomers,
            totalValue,
            avgCustomerValue,
            retentionRate,
            segments,
            aiPercentage:
                total > 0 ? Math.round((aiCustomers / total) * 100) : 0,
        });
    }, []);

    // Cargar datos inicial
    useEffect(() => {
        if (isReady && restaurantId) {
            loadCustomers();
        }
    }, [isReady, restaurantId, loadCustomers]);

    // Filtrar y ordenar clientes
    const filteredAndSortedCustomers = useMemo(() => {
        let filtered = customers || [];

        // Filtro por búsqueda
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(searchTerm) ||
                    customer.phone.includes(searchTerm) ||
                    (customer.email &&
                        customer.email.toLowerCase().includes(searchTerm)),
            );
        }

        // Filtro por segmento
        if (filters.segment !== "all") {
            const segmentCriteria =
                CUSTOMER_SEGMENTS[filters.segment]?.criteria;
            if (segmentCriteria) {
                filtered = filtered.filter(segmentCriteria);
            }
        }

        // Filtro por origen
        if (filters.source !== "all") {
            if (filters.source === "ai") {
                filtered = filtered.filter(
                    (c) => c.acquisition_channel !== "manual",
                );
            } else if (filters.source === "manual") {
                filtered = filtered.filter(
                    (c) => c.acquisition_channel === "manual",
                );
            } else {
                filtered = filtered.filter(
                    (c) => c.acquisition_channel === filters.source,
                );
            }
        }

        // Filtros adicionales
        if (filters.vipOnly) {
            filtered = filtered.filter((c) => c.vip_status);
        }

        if (filters.riskOnly) {
            filtered = filtered.filter((c) => {
                const noShowRate =
                    c.total_reservations > 0
                        ? (c.total_no_shows || 0) / c.total_reservations
                        : 0;
                const daysSinceLastVisit = c.last_visit
                    ? differenceInDays(new Date(), parseISO(c.last_visit))
                    : Infinity;
                return noShowRate > 0.3 || daysSinceLastVisit > 60;
            });
        }

        // Ordenar
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "visits":
                    return (
                        (b.total_reservations || 0) -
                        (a.total_reservations || 0)
                    );
                case "value":
                    const valueA = (a.total_reservations || 0) * 87.5;
                    const valueB = (b.total_reservations || 0) * 87.5;
                    return valueB - valueA;
                case "recent":
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        return filtered;
    }, [customers, filters]);

    // Funciones de acciones
    const handleCustomerAction = useCallback(
        async (action, customer) => {
            switch (action) {
                case "view":
                    setSelectedCustomer(customer);
                    setShowDetailModal(true);
                    break;

                case "edit":
                    // TODO: Implementar edición de cliente
                    toast.info("Función de edición disponible próximamente");
                    addNotification({
                        type: 'system',
                        message: 'Editor de clientes en desarrollo',
                        priority: 'low'
                    });
                    break;

                case "aiChat":
                    // TODO: Implementar envío real de mensaje por IA
                    toast.loading("Generando mensaje personalizado...", {
                        duration: 2000,
                    });
                    setTimeout(() => {
                        toast.success(
                            `Mensaje IA enviado a ${customer.name} por ${customer.preferred_channel || "WhatsApp"}`,
                        );
                        addNotification({
                            type: 'agent',
                            message: `Mensaje IA enviado a ${customer.name}`,
                            priority: 'normal'
                        });
                    }, 2000);
                    break;

                case "whatsapp":
                    const phone = customer.phone.replace(/\D/g, "");
                    const message = `¡Hola ${customer.name}! Te escribimos desde ${restaurant?.name || "el restaurante"}. ¿Cómo estás?`;
                    window.open(
                        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                        "_blank",
                    );
                    addNotification({
                        type: 'system',
                        message: `Abriendo WhatsApp para ${customer.name}`,
                        priority: 'normal'
                    });
                    break;

                case "createReservation":
                    // TODO: Navegar a página de reservas con cliente preseleccionado
                    toast.info("Navegando a nueva reserva...");
                    addNotification({
                        type: 'system',
                        message: `Creando reserva para ${customer.name}`,
                        priority: 'normal'
                    });
                    break;

                default:
                    break;
            }
        },
        [restaurant, addNotification],
    );

    // Función para iniciar campaña IA
    const handleAICampaign = useCallback((segment) => {
        setSelectedSegment(segment);
        setShowAICampaignModal(true);
    }, []);

    // Función para crear nuevo cliente
    const handleCreateCustomer = useCallback(() => {
        // TODO: Implementar creación de cliente
        setShowCreateModal(true);
        toast.info("Función disponible próximamente");
        addNotification({
            type: 'system',
            message: 'Formulario de cliente en desarrollo',
            priority: 'low'
        });
    }, [addNotification]);

    // Función para exportar datos
    const handleExportData = useCallback(() => {
        // TODO: Implementar exportación a CSV
        toast.info("Exportación disponible próximamente");
        addNotification({
            type: 'system',
            message: 'Preparando exportación de datos',
            priority: 'normal'
        });
    }, [addNotification]);

    // Función para activar campaña automática
    const activateAutoCampaign = async (type) => {
        const campaigns = {
            birthday: {
                name: "Cumpleaños",
                message: "Activando campaña automática de cumpleaños...",
            },
            retention: {
                name: "Retención",
                message: "Configurando campañas de retención automáticas...",
            },
            welcome: {
                name: "Bienvenida",
                message: "Preparando secuencia de bienvenida...",
            },
        };

        const campaign = campaigns[type];
        if (!campaign) return;

        toast.info(campaign.message);
        addNotification({
            type: 'agent',
            message: `Campaña ${campaign.name} activada`,
            priority: 'normal'
        });

        // TODO: Implementar activación real
    };

    if (!isReady) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header mejorado */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                CRM Inteligente
                                <Brain className="w-8 h-8 text-purple-600" />
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestión de clientes potenciada por IA •{" "}
                                {stats.total || 0} clientes •{" "}
                                {stats.aiPercentage || 0}% captados por IA
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Estado del agente */}
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                                <Bot className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium">
                                    Agente{" "}
                                    {agentStatus?.active
                                        ? "Activo"
                                        : "Inactivo"}
                                </span>
                                <div
                                    className={`w-2 h-2 rounded-full ${agentStatus?.active ? "bg-green-500" : "bg-gray-400"}`}
                                />
                            </div>

                            <button
                                onClick={loadCustomers}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                                />
                                Actualizar
                            </button>

                            <button
                                onClick={handleCreateCustomer}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Cliente
                            </button>
                        </div>
                    </div>

                    {/* Tabs de vista */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mt-6 w-fit">
                        {[
                            {
                                id: "list",
                                label: "Lista de Clientes",
                                icon: Users,
                            },
                            {
                                id: "insights",
                                label: "Insights IA",
                                icon: Brain,
                            },
                            { id: "campaigns", label: "Campañas", icon: Send },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md transition-all
                                    ${
                                        activeView === tab.id
                                            ? "bg-white text-purple-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vista: Lista de clientes */}
                {activeView === "list" && (
                    <>
                        {/* Estadísticas principales mejoradas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <CustomerStatsCard
                                title="Total Clientes"
                                value={stats.total || 0}
                                subtitle={`+${stats.newThisMonth || 0} este mes`}
                                icon={<Users />}
                                color={{
                                    bg: "bg-blue-100",
                                    icon: "text-blue-600",
                                    text: "text-blue-600",
                                }}
                                trend={stats.newThisMonth > 0 ? 1 : 0}
                            />

                            <CustomerStatsCard
                                title="Captados por IA"
                                value={`${stats.aiPercentage || 0}%`}
                                subtitle={`${stats.aiCustomers || 0} clientes`}
                                icon={<Bot />}
                                color={{
                                    bg: "bg-purple-100",
                                    icon: "text-purple-600",
                                    text: "text-purple-600",
                                }}
                                isAI={true}
                            />

                            <CustomerStatsCard
                                title="Clientes VIP"
                                value={stats.vipCustomers || 0}
                                subtitle="Alto valor"
                                icon={<Award />}
                                color={{
                                    bg: "bg-orange-100",
                                    icon: "text-orange-600",
                                }}
                            />

                            <CustomerStatsCard
                                title="En Riesgo"
                                value={stats.atRiskCustomers || 0}
                                subtitle="Necesitan atención"
                                icon={<AlertTriangle />}
                                color={{
                                    bg: "bg-red-100",
                                    icon: "text-red-600",
                                }}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        riskOnly: true,
                                    }))
                                }
                            />
                        </div>

                        {/* Segmentación inteligente */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Segmentación Inteligente
                                </h3>
                                <button
                                    onClick={() => setActiveView("insights")}
                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    Ver análisis detallado →
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                                {Object.entries(CUSTOMER_SEGMENTS).map(
                                    ([key, segment]) => (
                                        <button
                                            key={key}
                                            onClick={() =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    segment:
                                                        prev.segment === key
                                                            ? "all"
                                                            : key,
                                                }))
                                            }
                                            className={`
                                            relative p-3 rounded-lg border transition-all group
                                            ${
                                                filters.segment === key
                                                    ? segment.color +
                                                      " border-current shadow-md"
                                                    : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                                            }
                                        `}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">
                                                    {segment.icon}
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {segment.label}
                                                </div>
                                                <div className="text-lg font-bold mt-1">
                                                    {stats.segments?.[key] || 0}
                                                </div>
                                            </div>

                                            {/* Botón de acción IA */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAICampaign(key);
                                                }}
                                                className={`
                                                absolute -top-2 -right-2 w-6 h-6 bg-purple-600 text-white
                                                rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                                                flex items-center justify-center shadow-lg
                                            `}
                                                title={`Campaña IA: ${segment.aiAction}`}
                                            >
                                                <Zap className="w-3 h-3" />
                                            </button>
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Filtros mejorados */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Búsqueda */}
                                <div className="flex-1 relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={20}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, teléfono o email..."
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                search: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Filtros adicionales */}
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={filters.source}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                source: e.target.value,
                                            }))
                                        }
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="all">
                                            Todos los orígenes
                                        </option>
                                        <option value="ai">Solo IA</option>
                                        <option value="manual">
                                            Solo manual
                                        </option>
                                        <option value="whatsapp">
                                            WhatsApp
                                        </option>
                                        <option value="vapi">Llamadas</option>
                                        <option value="instagram">
                                            Instagram
                                        </option>
                                    </select>

                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                sortBy: e.target.value,
                                            }))
                                        }
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="recent">
                                            Más recientes
                                        </option>
                                        <option value="name">Por nombre</option>
                                        <option value="visits">
                                            Por visitas
                                        </option>
                                        <option value="value">Por valor</option>
                                    </select>

                                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.vipOnly}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    vipOnly: e.target.checked,
                                                }))
                                            }
                                            className="rounded text-orange-600"
                                        />
                                        <Star className="w-4 h-4 text-orange-600" />
                                        <span className="text-sm">VIP</span>
                                    </label>

                                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.riskOnly}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    riskOnly: e.target.checked,
                                                }))
                                            }
                                            className="rounded text-red-600"
                                        />
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                        <span className="text-sm">
                                            En riesgo
                                        </span>
                                    </label>

                                    <button
                                        onClick={handleExportData}
                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="text-sm">
                                            Exportar
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de clientes */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredAndSortedCustomers.length > 0 ? (
                                filteredAndSortedCustomers.map((customer) => (
                                    <CustomerCard
                                        key={customer.id}
                                        customer={customer}
                                        onAction={handleCustomerAction}
                                    />
                                ))
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No hay clientes
                                    </h3>
                                    <p className="text-gray-600">
                                        {filters.search ||
                                        filters.segment !== "all" ||
                                        filters.source !== "all"
                                            ? "No se encontraron clientes con los filtros aplicados"
                                            : "Aún no tienes clientes registrados"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Vista: Insights IA */}
                {activeView === "insights" && (
                    <div className="space-y-6">
                        {/* KPIs predictivos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <Brain className="w-8 h-8 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">
                                        Predicción IA
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {stats.total
                                        ? Math.round(stats.total * 0.15)
                                        : 0}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Clientes en riesgo próximo mes
                                </p>
                                <button
                                    onClick={() => {
                                        setFilters((prev) => ({
                                            ...prev,
                                            riskOnly: true,
                                        }));
                                        setActiveView("list");
                                    }}
                                    className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700"
                                >
                                    Ver detalles →
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">
                                        Oportunidad
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    €
                                    {stats.avgCustomerValue
                                        ? stats.avgCustomerValue * 3
                                        : 0}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Potencial de upselling detectado
                                </p>
                                <button
                                    onClick={() => setActiveView("campaigns")}
                                    className="mt-4 text-sm font-medium text-green-600 hover:text-green-700"
                                >
                                    Activar campaña →
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                                <div className="flex items-center justify-between mb-4">
                                    <Gift className="w-8 h-8 text-amber-600" />
                                    <span className="text-sm font-medium text-amber-700">
                                        Este mes
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {stats.segments?.birthday || 0}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Cumpleaños detectados
                                </p>
                                <button
                                    onClick={() => handleAICampaign("birthday")}
                                    className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700"
                                >
                                    Enviar felicitaciones →
                                </button>
                            </div>
                        </div>

                        {/* Gráficos de análisis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Tendencia de adquisición */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Adquisición: IA vs Manual
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart
                                            data={
                                                analyticsData.acquisitionTrend
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f0f0f0"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#6b7280"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <YAxis
                                                stroke="#6b7280"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="ai"
                                                name="Agente IA"
                                                stroke="#8B5CF6"
                                                strokeWidth={2}
                                                dot={{ fill: "#8B5CF6", r: 4 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="manual"
                                                name="Manual"
                                                stroke="#6B7280"
                                                strokeWidth={2}
                                                dot={{ fill: "#6B7280", r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Valor por canal */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Rendimiento por Canal de Captación
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={
                                                analyticsData.channelPerformance
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f0f0f0"
                                            />
                                            <XAxis
                                                dataKey="channel"
                                                stroke="#6b7280"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <YAxis
                                                stroke="#6b7280"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <Tooltip />
                                            <Bar
                                                dataKey="ltv"
                                                name="LTV medio (€)"
                                                fill="#8B5CF6"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Análisis de cohortes */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Análisis de Retención por Cohortes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {analyticsData.retentionCohorts.map(
                                    (cohort, idx) => (
                                        <div key={idx} className="text-center">
                                            <div
                                                className={`
                                            w-24 h-24 mx-auto rounded-full flex items-center justify-center
                                            ${
                                                cohort.retention > 70
                                                    ? "bg-green-100"
                                                    : cohort.retention > 50
                                                      ? "bg-yellow-100"
                                                      : "bg-red-100"
                                            }
                                        `}
                                            >
                                                <span
                                                    className={`
                                                text-2xl font-bold
                                                ${
                                                    cohort.retention > 70
                                                        ? "text-green-600"
                                                        : cohort.retention > 50
                                                          ? "text-yellow-600"
                                                          : "text-red-600"
                                                }
                                            `}
                                                >
                                                    {cohort.retention}%
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm font-medium text-gray-900">
                                                {cohort.month}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-900">
                                    <Info className="w-4 h-4 inline mr-1" />
                                    La retención mejora un 23% cuando los
                                    clientes interactúan con el agente IA en su
                                    primera visita.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vista: Campañas */}
                {activeView === "campaigns" && (
                    <div className="space-y-6">
                        {/* Campañas activas */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Campañas Automatizadas Activas
                                </h3>
                                <button
                                    onClick={() => {
                                        // TODO: Implementar nueva campaña
                                        toast.info(
                                            "Creador de campañas disponible próximamente",
                                        );
                                        addNotification({
                                            type: 'system',
                                            message: 'Editor de campañas en desarrollo',
                                            priority: 'low'
                                        });
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva Campaña
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        name: "Reactivación de inactivos",
                                        segment:
                                            "Clientes sin visitar >60 días",
                                        status: "active",
                                        sent: 45,
                                        opened: 32,
                                        conversions: 8,
                                        channel: "whatsapp",
                                    },
                                    {
                                        name: "Cumpleaños del mes",
                                        segment: "Cumpleaños en febrero",
                                        status: "scheduled",
                                        sent: 0,
                                        opened: 0,
                                        conversions: 0,
                                        channel: "email",
                                    },
                                    {
                                        name: "Fidelización VIP",
                                        segment: "Clientes VIP",
                                        status: "completed",
                                        sent: 23,
                                        opened: 21,
                                        conversions: 15,
                                        channel: "whatsapp",
                                    },
                                ].map((campaign, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {campaign.name}
                                                    </h4>
                                                    <span
                                                        className={`
                                                        px-2 py-1 text-xs font-medium rounded-full
                                                        ${
                                                            campaign.status ===
                                                            "active"
                                                                ? "bg-green-100 text-green-700"
                                                                : campaign.status ===
                                                                    "scheduled"
                                                                      ? "bg-blue-100 text-blue-700"
                                                                      : "bg-gray-100 text-gray-700"
                                                        }
                                                    `}
                                                    >
                                                        {campaign.status ===
                                                        "active"
                                                            ? "Activa"
                                                            : campaign.status ===
                                                                "scheduled"
                                                                  ? "Programada"
                                                                  : "Completada"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {campaign.segment}
                                                </p>

                                                {campaign.sent > 0 && (
                                                    <div className="flex items-center gap-6 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Enviados:
                                                            </span>
                                                            <span className="ml-1 font-medium">
                                                                {campaign.sent}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Abiertos:
                                                            </span>
                                                            <span className="ml-1 font-medium text-blue-600">
                                                                {
                                                                    campaign.opened
                                                                }{" "}
                                                                (
                                                                {Math.round(
                                                                    (campaign.opened /
                                                                        campaign.sent) *
                                                                        100,
                                                                )}
                                                                %)
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Conversiones:
                                                            </span>
                                                            <span className="ml-1 font-medium text-green-600">
                                                                {
                                                                    campaign.conversions
                                                                }{" "}
                                                                (
                                                                {Math.round(
                                                                    (campaign.conversions /
                                                                        campaign.sent) *
                                                                        100,
                                                                )}
                                                                %)
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Plantillas sugeridas */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Campañas Sugeridas por IA
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-4 border border-purple-200">
                                    <Zap className="w-8 h-8 text-purple-600 mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Flash Sale Martes
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Detectamos baja ocupación los martes.
                                        Ofrece 20% dto.
                                    </p>
                                    <button
                                        onClick={() => {
                                            activateAutoCampaign('flash');
                                        }}
                                        className="text-sm font-medium text-purple-600 hover:text-purple-700"
                                    >
                                        Activar campaña →
                                    </button>
                                </div>

                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <Heart className="w-8 h-8 text-green-600 mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Win-back Automático
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        15 clientes no visitan hace 45+ días.
                                        Enviar incentivo.
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleAICampaign("inactive")
                                        }
                                        className="text-sm font-medium text-green-600 hover:text-green-700"
                                    >
                                        Configurar →
                                    </button>
                                </div>

                                <div className="bg-white rounded-lg p-4 border border-blue-200">
                                    <Award className="w-8 h-8 text-blue-600 mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Programa VIP
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Invita a tus mejores clientes a un
                                        evento exclusivo.
                                    </p>
                                    <button
                                        onClick={() => handleAICampaign("vip")}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Crear evento →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de detalle del cliente */}
            {showDetailModal && selectedCustomer && (
                <CustomerDetailModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedCustomer(null);
                    }}
                    onAction={handleCustomerAction}
                />
            )}

            {/* Modal de campaña IA */}
            {showAICampaignModal && (
                <AICampaignModal
                    segment={selectedSegment}
                    segmentData={CUSTOMER_SEGMENTS[selectedSegment]}
                    customerCount={stats.segments?.[selectedSegment] || 0}
                    onClose={() => {
                        setShowAICampaignModal(false);
                        setSelectedSegment(null);
                    }}
                    onLaunch={(campaignData) => {
                        // TODO: Implementar lanzamiento real de campaña
                        // await supabase.rpc('launch_ai_campaign', { ... })
                        toast.success(
                            `Campaña "${campaignData.name}" lanzada con éxito`,
                        );
                        addNotification({
                            type: 'agent',
                            message: `Campaña "${campaignData.name}" activada para ${stats.segments?.[selectedSegment] || 0} clientes`,
                            priority: 'high'
                        });
                        setShowAICampaignModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Modal de detalle del cliente mejorado
const CustomerDetailModal = ({ customer, onClose, onAction }) => {
    const [activeTab, setActiveTab] = useState("profile");

    // Datos simulados de historial
    const aiInteractions = [
        {
            date: format(subDays(new Date(), 2), "yyyy-MM-dd"),
            channel: "whatsapp",
            type: "reservation_reminder",
            message: "Recordatorio de reserva enviado",
            response: "Confirmado",
        },
        {
            date: format(subDays(new Date(), 10), "yyyy-MM-dd"),
            channel: "whatsapp",
            type: "welcome",
            message: "Mensaje de bienvenida",
            response: "Gracias!",
        },
    ];

    const customerScore = {
        frequency: 85,
        recency: 92,
        monetary: 78,
        engagement: 88,
        overall: 86,
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {customer.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-purple-200">
                                        Cliente desde{" "}
                                        {format(
                                            parseISO(customer.created_at),
                                            "MMMM yyyy",
                                            { locale: es },
                                        )}
                                    </span>
                                    {customer.vip_status && (
                                        <span className="px-2 py-1 bg-orange-400 text-white text-xs font-medium rounded-full">
                                            VIP
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Score general */}
                    <div className="mt-6 flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold">
                                {customerScore.overall}
                            </div>
                            <div className="text-sm text-purple-200">
                                Score general
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4">
                            {Object.entries(customerScore)
                                .filter(([key]) => key !== "overall")
                                .map(([key, value]) => (
                                    <div key={key} className="text-center">
                                        <div className="text-xl font-semibold">
                                            {value}
                                        </div>
                                        <div className="text-xs text-purple-200 capitalize">
                                            {key}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        {[
                            { id: "profile", label: "Perfil", icon: Users },
                            {
                                id: "ai-insights",
                                label: "Insights IA",
                                icon: Brain,
                            },
                            { id: "history", label: "Historial", icon: Clock },
                            {
                                id: "preferences",
                                label: "Preferencias",
                                icon: Heart,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 font-medium transition-colors
                                    ${
                                        activeTab === tab.id
                                            ? "text-purple-600 border-b-2 border-purple-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    {activeTab === "profile" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">
                                    Información de contacto
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{customer.phone}</span>
                                    </div>
                                    {customer.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span>{customer.email}</span>
                                        </div>
                                    )}
                                    {customer.birthday && (
                                        <div className="flex items-center gap-3">
                                            <Gift className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {format(
                                                    parseISO(customer.birthday),
                                                    "d MMMM",
                                                    { locale: es },
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">
                                    Métricas clave
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Total reservas:
                                        </span>
                                        <span className="font-semibold">
                                            {customer.total_reservations || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Valor estimado:
                                        </span>
                                        <span className="font-semibold">
                                            €
                                            {(customer.total_reservations ||
                                                0) * 87.5}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Canal preferido:
                                        </span>
                                        <span className="font-semibold capitalize">
                                            {customer.preferred_channel ||
                                                "WhatsApp"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "ai-insights" && (
                        <div className="space-y-6">
                            {/* Predicciones */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    Predicciones IA
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            85%
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Prob. próxima visita (30 días)
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            €125
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Ticket medio proyectado
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            3.2x
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Potencial de LTV
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interacciones IA */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">
                                    Historial de interacciones IA
                                </h4>
                                <div className="space-y-3">
                                    {aiInteractions.map((interaction, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <MessageCircle className="w-4 h-4 text-purple-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {interaction.message}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {format(
                                                            parseISO(
                                                                interaction.date,
                                                            ),
                                                            "d MMM",
                                                            { locale: es },
                                                        )}{" "}
                                                        • {interaction.channel}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm text-green-600">
                                                {interaction.response}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-4 flex justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAction("aiChat", customer)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <Bot className="w-4 h-4" />
                            Mensaje IA
                        </button>
                        <button
                            onClick={() => onAction("whatsapp", customer)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <MessageSquare className="w-4 h-4" />
                            WhatsApp
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal de campaña IA
const AICampaignModal = ({
    segment,
    segmentData,
    customerCount,
    onClose,
    onLaunch,
}) => {
    const [campaignData, setCampaignData] = useState({
        name: `Campaña ${segmentData?.label || ""}`,
        message: "",
        channel: "whatsapp",
        schedule: "now",
    });

    const suggestedMessages = {
        new: "¡Hola {nombre}! 🌟 Gracias por visitarnos. Como agradecimiento, te ofrecemos un 15% de descuento en tu próxima visita. ¿Te gustaría reservar?",
        inactive:
            "¡{nombre}, te echamos de menos! 😊 Han pasado algunos días desde tu última visita. Te invitamos con una copa de bienvenida. ¿Volvemos a verte pronto?",
        vip: "Estimado/a {nombre} 👑, como cliente VIP, te invitamos a una cena exclusiva de maridaje el próximo viernes. Plazas limitadas. ¿Te interesa?",
        birthday:
            "¡Feliz cumpleaños {nombre}! 🎂 Celebra con nosotros y disfruta de un postre especial cortesía de la casa. ¿Reservamos mesa?",
    };

    useEffect(() => {
        if (segment && suggestedMessages[segment]) {
            setCampaignData((prev) => ({
                ...prev,
                message: suggestedMessages[segment],
            }));
        }
    }, [segment]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-600" />
                        Lanzar Campaña IA: {segmentData?.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Alcanzarás a {customerCount} clientes con esta campaña
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Nombre de campaña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la campaña
                        </label>
                        <input
                            type="text"
                            value={campaignData.name}
                            onChange={(e) =>
                                setCampaignData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Mensaje */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mensaje personalizado
                        </label>
                        <textarea
                            value={campaignData.message}
                            onChange={(e) =>
                                setCampaignData((prev) => ({
                                    ...prev,
                                    message: e.target.value,
                                }))
                            }
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="El agente IA personalizará este mensaje para cada cliente..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Usa {"{nombre}"} para personalización automática
                        </p>
                    </div>

                    {/* Canal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Canal de envío
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    id: "whatsapp",
                                    label: "WhatsApp",
                                    icon: MessageCircle,
                                },
                                { id: "email", label: "Email", icon: Mail },
                                { id: "sms", label: "SMS", icon: Phone },
                            ].map((channel) => (
                                <button
                                    key={channel.id}
                                    onClick={() =>
                                        setCampaignData((prev) => ({
                                            ...prev,
                                            channel: channel.id,
                                        }))
                                    }
                                    className={`
                                        flex items-center justify-center gap-2 p-3 rounded-lg border transition-all
                                        ${
                                            campaignData.channel === channel.id
                                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                                : "border-gray-300 hover:border-purple-300"
                                        }
                                    `}
                                >
                                    <channel.icon className="w-4 h-4" />
                                    {channel.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Programación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ¿Cuándo enviar?
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() =>
                                    setCampaignData((prev) => ({
                                        ...prev,
                                        schedule: "now",
                                    }))
                                }
                                className={`
                                    flex-1 p-3 rounded-lg border transition-all
                                    ${
                                        campaignData.schedule === "now"
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-300 hover:border-purple-300"
                                    }
                                `}
                            >
                                Ahora mismo
                            </button>
                            <button
                                onClick={() =>
                                    setCampaignData((prev) => ({
                                        ...prev,
                                        schedule: "optimal",
                                    }))
                                }
                                className={`
                                    flex-1 p-3 rounded-lg border transition-all
                                    ${
                                        campaignData.schedule === "optimal"
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-300 hover:border-purple-300"
                                    }
                                `}
                            >
                                Horario óptimo (IA decide)
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Vista previa:
                        </p>
                        <div className="bg-white rounded-lg p-3 text-sm">
                            {campaignData.message.replace(
                                "{nombre}",
                                "María García",
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onLaunch(campaignData)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Lanzar Campaña
                    </button>
                </div>
            </div>
        </div>
    );
};
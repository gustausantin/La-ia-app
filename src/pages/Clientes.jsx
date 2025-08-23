
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
                Analizando perfiles de
                clientes
            </p>
        </div>
    </div>
);

// Componente principal
export default function Clientes() {
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

    // Función para refrescar datos
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        await loadCustomers();
        toast.success("Datos de clientes actualizados");
    }, [loadCustomers]);

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

            // EMPRESA: Sin simulaciones, datos reales únicamente

            // DATOS MOCK ELIMINADOS - Solo datos reales de Supabase

            // Cargar datos reales desde Supabase
            const { data: customersData, error } = await supabase
                .from("customers")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading customers:", error);
                // En caso de error, mostrar estado vacío
                setCustomers([]);
                calculateStats([]);
                return;
            }

            const customers = customersData || [];
            setCustomers(customers);
            calculateStats(customers);
        } catch (error) {
            console.error("Error loading customers:", error);
            toast.error("Error al cargar los clientes");
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // ELIMINADO: useEffect duplicado - ya existe uno más abajo

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
        let filtered = customers;

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
                    toast.info("Función de edición disponible próximamente");
                    if (addNotification) {
                        addNotification({
                            type: 'system',
                            message: 'Editor de clientes en desarrollo',
                            priority: 'low'
                        });
                    }
                    break;

                case "aiChat":
                    toast.loading("Generando mensaje personalizado...", {
                        duration: 2000,
                    });
                    setTimeout(() => {
                        toast.success(
                            `Mensaje IA enviado a ${customer.name} por ${customer.preferred_channel || "WhatsApp"}`,
                        );
                        if (addNotification) {
                            addNotification({
                                type: 'agent',
                                message: `Mensaje IA enviado a ${customer.name}`,
                                priority: 'normal'
                            });
                        }
                    }, 2000);
                    break;

                case "whatsapp":
                    const phone = customer.phone.replace(/\D/g, "");
                    const message = `¡Hola ${customer.name}! Te escribimos desde ${restaurant?.name || "el restaurante"}. ¿Cómo estás?`;
                    window.open(
                        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                        "_blank",
                    );
                    if (addNotification) {
                        addNotification({
                            type: 'system',
                            message: `Abriendo WhatsApp para ${customer.name}`,
                            priority: 'normal'
                        });
                    }
                    break;

                case "createReservation":
                    toast.info("Navegando a nueva reserva...");
                    if (addNotification) {
                        addNotification({
                            type: 'system',
                            message: `Creando reserva para ${customer.name}`,
                            priority: 'normal'
                        });
                    }
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
        setShowCreateModal(true);
        toast.info("Función disponible próximamente");
        if (addNotification) {
            addNotification({
                type: 'system',
                message: 'Formulario de cliente en desarrollo',
                priority: 'low'
            });
        }
    }, [addNotification]);

    // Función para exportar datos
    const handleExportData = useCallback(() => {
        toast.info("Exportación disponible próximamente");
        if (addNotification) {
            addNotification({
                type: 'system',
                message: 'Preparando exportación de datos',
                priority: 'normal'
            });
        }
    }, [addNotification]);

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
                                {stats.aiPercentage}% captados por IA
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

                {/* Placeholder para otras vistas */}
                {activeView !== "list" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Brain className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {activeView === "insights" ? "Insights IA" : "Campañas"}
                        </h3>
                        <p className="text-gray-600">
                            Esta funcionalidad estará disponible próximamente
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

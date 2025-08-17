// Reservas.jsx - Sistema COMPLETO de Gestión de Reservas con Agente IA para Son-IA

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Search,
    Plus,
    Filter,
    Calendar as CalendarIcon,
    Clock,
    Users,
    Phone,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Edit,
    MessageSquare,
    RefreshCw,
    Bot,
    TrendingUp,
    Sparkles,
    Brain,
    Zap,
    BarChart3,
    Target,
    Award,
    PhoneCall,
    Globe,
    Mail,
    MessageCircle,
    Shield,
    DollarSign,
    Eye,
    CheckSquare,
    Square,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

// DATOS NECESARIOS DE SUPABASE:
// - tabla: reservations (con campos 'source' y 'channel')
// - tabla: customers
// - tabla: tables
// - tabla: agent_reservation_insights (insights del agente)
// - RPC: get_reservation_stats_by_source(restaurant_id, start_date, end_date)
// - RPC: get_agent_conversion_stats(restaurant_id)
// - real-time: suscripción a cambios en reservations

// Estados de reserva con colores y acciones
const RESERVATION_STATES = {
    pendiente: {
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        actions: ["confirm", "cancel", "edit"],
        icon: <AlertCircle className="w-4 h-4" />,
    },
    confirmada: {
        label: "Confirmada",
        color: "bg-green-100 text-green-800 border-green-200",
        actions: ["seat", "cancel", "edit"],
        icon: <CheckCircle2 className="w-4 h-4" />,
    },
    sentada: {
        label: "Sentada",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        actions: ["complete", "edit"],
        icon: <Users className="w-4 h-4" />,
    },
    completada: {
        label: "Completada",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        actions: ["view"],
        icon: <CheckSquare className="w-4 h-4" />,
    },
    cancelada: {
        label: "Cancelada",
        color: "bg-red-100 text-red-800 border-red-200",
        actions: ["view"],
        icon: <XCircle className="w-4 h-4" />,
    },
    no_show: {
        label: "No Show",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        actions: ["view"],
        icon: <AlertCircle className="w-4 h-4" />,
    },
};

// Canales disponibles
const CHANNELS = {
    whatsapp: {
        label: "WhatsApp",
        icon: <MessageCircle className="w-4 h-4 text-green-600" />,
        color: "text-green-600",
    },
    vapi: {
        label: "Llamada IA",
        icon: <PhoneCall className="w-4 h-4 text-orange-600" />,
        color: "text-orange-600",
    },
    web: {
        label: "Web",
        icon: <Globe className="w-4 h-4 text-blue-600" />,
        color: "text-blue-600",
    },
    instagram: {
        label: "Instagram",
        icon: <MessageSquare className="w-4 h-4 text-pink-600" />,
        color: "text-pink-600",
    },
    facebook: {
        label: "Facebook",
        icon: <MessageCircle className="w-4 h-4 text-blue-800" />,
        color: "text-blue-800",
    },
    manual: {
        label: "Manual",
        icon: <Edit className="w-4 h-4 text-gray-600" />,
        color: "text-gray-600",
    },
};

// Componente de estadísticas del agente
const AgentStatsPanel = ({ stats, insights }) => {
    return (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Rendimiento del Agente IA
                </h3>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    En línea
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                    <p className="text-2xl font-bold">
                        {stats.agentReservations || 0}
                    </p>
                    <p className="text-sm text-purple-100">Reservas IA</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.conversionRate || 0}%
                    </p>
                    <p className="text-sm text-purple-100">Conversión</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.avgResponseTime || "0s"}
                    </p>
                    <p className="text-sm text-purple-100">Tiempo respuesta</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.peakChannel || "WhatsApp"}
                    </p>
                    <p className="text-sm text-purple-100">Canal principal</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.satisfaction || 0}%
                    </p>
                    <p className="text-sm text-purple-100">Satisfacción</p>
                </div>
            </div>

            {insights && insights.length > 0 && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Insights del día
                    </p>
                    <ul className="space-y-1 text-sm text-purple-100">
                        {insights.slice(0, 2).map((insight, idx) => (
                            <li key={idx}>• {insight}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Componente de tarjeta de reserva mejorado
const ReservationCard = ({ reservation, onAction, onSelect, isSelected }) => {
    const [showActions, setShowActions] = useState(false);
    const state =
        RESERVATION_STATES[reservation.status] || RESERVATION_STATES.pendiente;
    const channel =
        CHANNELS[reservation.channel || "manual"] || CHANNELS.manual;
    const isAgentReservation = reservation.source === "agent"; // CORREGIDO - sin fallback

    const formatTime = (timeString) => {
        return timeString ? timeString.slice(0, 5) : "00:00";
    };

    return (
        <div
            className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                isSelected
                    ? "ring-2 ring-blue-500 border-blue-200"
                    : "border-gray-200"
            } ${isAgentReservation ? "border-l-4 border-l-purple-500" : ""}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                            onSelect(reservation.id, e.target.checked)
                        }
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                    />

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                                {reservation.customer_name}
                            </h4>
                            {isAgentReservation && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                    <Bot className="w-3 h-3" />
                                    <span>IA</span>
                                </div>
                            )}
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${state.color} flex items-center gap-1`}
                            >
                                {state.icon}
                                <span>{state.label}</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(reservation.time)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{reservation.party_size} personas</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{reservation.customer_phone}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {channel.icon}
                                <span>{channel.label}</span>
                            </div>
                        </div>

                        {reservation.special_requests && (
                            <div className="mt-2 text-sm text-gray-500 italic">
                                "{reservation.special_requests}"
                            </div>
                        )}

                        {reservation.tables?.name && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">
                                    Mesa: {reservation.tables.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(!showActions);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {showActions && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                            <button
                                onClick={() => {
                                    onAction("view", reservation);
                                    setShowActions(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                                <Eye className="w-4 h-4" />
                                Ver detalles
                            </button>

                            {state.actions.includes("edit") && (
                                <button
                                    onClick={() => {
                                        onAction("edit", reservation);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </button>
                            )}

                            {state.actions.includes("confirm") && (
                                <button
                                    onClick={() => {
                                        onAction("confirm", reservation);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirmar
                                </button>
                            )}

                            {state.actions.includes("seat") && (
                                <button
                                    onClick={() => {
                                        onAction("seat", reservation);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                    <Users className="w-4 h-4" />
                                    Sentar
                                </button>
                            )}

                            {state.actions.includes("complete") && (
                                <button
                                    onClick={() => {
                                        onAction("complete", reservation);
                                        setShowActions(false);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                                >
                                    <CheckSquare className="w-4 h-4" />
                                    Completar
                                </button>
                            )}

                            {state.actions.includes("cancel") && (
                                <>
                                    <hr className="my-1" />
                                    <button
                                        onClick={() => {
                                            onAction("cancel", reservation);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente principal
function Reservas() {
    console.log('📅 Reservas component rendering...');
    
    const { restaurant, restaurantId, isReady, addNotification } =
        useAuthContext();

    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [selectedReservations, setSelectedReservations] = useState(new Set());
    const [tables, setTables] = useState([]);
    const [agentStats, setAgentStats] = useState({
        agentReservations: 0,
        conversionRate: 0,
        avgResponseTime: "0s",
        peakChannel: "WhatsApp",
        satisfaction: 95,
    });
    const [agentInsights, setAgentInsights] = useState([]);

    const [filters, setFilters] = useState({
        search: "",
        status: "",
        channel: "",
        source: "", // nuevo filtro
        period: "today",
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);

    // Subscription de real-time
    const [realtimeSubscription, setRealtimeSubscription] = useState(null);

    // Calcular rango de fechas
    const calculateDateRange = useCallback((period) => {
        const today = new Date();

        switch (period) {
            case "today":
                return {
                    start: format(today, "yyyy-MM-dd"),
                    end: format(today, "yyyy-MM-dd"),
                };
            case "tomorrow":
                const tomorrow = addDays(today, 1);
                return {
                    start: format(tomorrow, "yyyy-MM-dd"),
                    end: format(tomorrow, "yyyy-MM-dd"),
                };
            case "week":
                const endOfWeek = addDays(today, 7);
                return {
                    start: format(today, "yyyy-MM-dd"),
                    end: format(endOfWeek, "yyyy-MM-dd"),
                };
            case "month":
                const endOfMonth = addDays(today, 30);
                return {
                    start: format(today, "yyyy-MM-dd"),
                    end: format(endOfMonth, "yyyy-MM-dd"),
                };
            default:
                return {
                    start: format(today, "yyyy-MM-dd"),
                    end: format(today, "yyyy-MM-dd"),
                };
        }
    }, []);

    // Cargar reservas
    const loadReservations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            const dateRange = calculateDateRange(filters.period);

            let query = supabase
                .from("reservations")
                .select(
                    `
                    *,
                    customers (name, email),
                    tables (name, zone)
                `,
                )
                .eq("restaurant_id", restaurantId)
                .gte("date", dateRange.start)
                .lte("date", dateRange.end)
                .order("date", { ascending: true })
                .order("time", { ascending: true });

            if (filters.status) {
                query = query.eq("status", filters.status);
            }

            if (filters.channel) {
                query = query.eq("channel", filters.channel);
            }

            if (filters.source) {
                query = query.eq("source", filters.source);
            }

            const { data, error } = await query;

            if (error) throw error;

            setReservations(data || []);

            // Calcular estadísticas del agente - CORREGIDO
            const agentReservations = (data || []).filter(
                (r) => r.source === "agent", // Ya no necesitamos el fallback
            );
            setAgentStats((prev) => ({
                ...prev,
                agentReservations: agentReservations.length,
                conversionRate: agentReservations.length > 0 ? 85 : 0, // Simulado por ahora
            }));
        } catch (error) {
            console.error("Error loading reservations:", error);
            toast.error("Error al cargar las reservas");
        } finally {
            setLoading(false);
        }
    }, [
        restaurantId,
        filters.status,
        filters.channel,
        filters.source,
        filters.period,
        calculateDateRange,
    ]);

    // Cargar mesas
    const loadTables = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const { data, error } = await supabase
                .from("tables")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .eq("status", "active")
                .order("zone")
                .order("table_number");

            if (error) throw error;
            setTables(data || []);
        } catch (error) {
            console.error("Error loading tables:", error);
        }
    }, [restaurantId]);

    // Cargar insights del agente
    const loadAgentInsights = useCallback(async () => {
        if (!restaurantId) return;

        try {
            // Simular insights por ahora
            // TODO: Reemplazar con datos reales cuando exista la tabla agent_reservation_insights
            const mockInsights = [
                "El 80% de las reservas de WhatsApp son para 2 personas",
                "Los viernes a las 21:00 es la hora más solicitada",
                "Las reservas con solicitudes especiales tienen 95% de asistencia",
                "El tiempo promedio de respuesta mejora un 40% después de las 18:00",
            ];

            setAgentInsights(mockInsights);

            // Simular estadísticas adicionales
            setAgentStats((prev) => ({
                ...prev,
                avgResponseTime: "3.2s",
                peakChannel: "WhatsApp",
                satisfaction: 94,
            }));
        } catch (error) {
            console.error("Error loading agent insights:", error);
        }
    }, [restaurantId]);

    // Configurar real-time subscriptions
    useEffect(() => {
        if (!restaurantId) return;

        // Suscribirse a cambios en tiempo real
        const subscription = supabase
            .channel("reservations-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "reservations",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    console.log("Cambio en reservations:", payload);

                    // Notificar si el agente creó una reserva
                    if (
                        payload.eventType === "INSERT" &&
                        payload.new.source === "agent"
                    ) {
                        toast.success(
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                <span>Nueva reserva creada por el agente!</span>
                            </div>,
                        );

                        // Agregar notificación global
                        addNotification({
                            type: "agent",
                            message: `Nueva reserva de ${payload.new.customer_name} para ${payload.new.party_size} personas`,
                            priority: "normal",
                            data: { reservationId: payload.new.id },
                        });
                    }

                    loadReservations();
                },
            )
            .subscribe();

        setRealtimeSubscription(subscription);

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [restaurantId, loadReservations, addNotification]);

    // Filtrar reservas
    const filteredReservations = useMemo(() => {
        let filtered = reservations;

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(
                (res) =>
                    res.customer_name.toLowerCase().includes(searchTerm) ||
                    res.customer_phone.includes(searchTerm) ||
                    (res.customer_email &&
                        res.customer_email.toLowerCase().includes(searchTerm)),
            );
        }

        // Aplicar filtro por source con validación
        if (filters.source) {
            filtered = filtered.filter((r) => r.source === filters.source);
        }

        // Aplicar filtro por channel con validación
        if (filters.channel) {
            filtered = filtered.filter((r) => r.channel === filters.channel);
        }

        return filtered;
    }, [reservations, filters]);

    // Cargar datos inicial
    useEffect(() => {
        if (isReady) {
            Promise.all([
                loadReservations(),
                loadTables(),
                loadAgentInsights(),
            ]);
        }
    }, [isReady, loadReservations, loadTables, loadAgentInsights]);

    // Recargar cuando cambien los filtros
    useEffect(() => {
        if (isReady) {
            loadReservations();
        }
    }, [
        isReady,
        loadReservations,
        filters.period,
        filters.status,
        filters.channel,
        filters.source,
    ]);

    // Funciones de selección
    const handleSelectReservation = useCallback((id, selected) => {
        setSelectedReservations((prev) => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(
        (selected) => {
            if (selected) {
                setSelectedReservations(
                    new Set(filteredReservations.map((r) => r.id)),
                );
            } else {
                setSelectedReservations(new Set());
            }
        },
        [filteredReservations],
    );

    // Manejar acciones de reservas
    const handleReservationAction = useCallback(
        async (action, reservation) => {
            try {
                let newStatus;
                let message;

                switch (action) {
                    case "confirm":
                        newStatus = "confirmada";
                        message = "Reserva confirmada";
                        break;
                    case "seat":
                        newStatus = "sentada";
                        message = "Mesa ocupada";
                        break;
                    case "complete":
                        newStatus = "completada";
                        message = "Reserva completada";
                        break;
                    case "cancel":
                        if (
                            !window.confirm(
                                "¿Estás seguro de cancelar esta reserva?",
                            )
                        ) {
                            return;
                        }
                        newStatus = "cancelada";
                        message = "Reserva cancelada";
                        break;
                    case "edit":
                        setEditingReservation(reservation);
                        setShowEditModal(true);
                        return;
                    case "view":
                        // TODO: Implementar vista detallada
                        toast.info("Vista detallada disponible próximamente");
                        return;
                    default:
                        return;
                }

                const { error } = await supabase
                    .from("reservations")
                    .update({
                        status: newStatus,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", reservation.id);

                if (error) throw error;

                toast.success(message);
                addNotification({
                    type: "system",
                    message: `${message}: ${reservation.customer_name}`,
                    priority: "low",
                });
                loadReservations();
            } catch (error) {
                console.error("Error updating reservation:", error);
                toast.error("Error al actualizar la reserva");
            }
        },
        [loadReservations, addNotification],
    );

    // Manejar acciones masivas
    const handleBulkAction = useCallback(
        async (action) => {
            if (selectedReservations.size === 0) {
                toast.error("Selecciona al menos una reserva");
                return;
            }

            if (
                !window.confirm(
                    `¿Confirmar acción en ${selectedReservations.size} reservas?`,
                )
            ) {
                return;
            }

            try {
                const reservationIds = Array.from(selectedReservations);
                let newStatus;
                let message;

                switch (action) {
                    case "confirm":
                        newStatus = "confirmada";
                        message = `${reservationIds.length} reservas confirmadas`;
                        break;
                    case "cancel":
                        newStatus = "cancelada";
                        message = `${reservationIds.length} reservas canceladas`;
                        break;
                    default:
                        return;
                }

                const { error } = await supabase
                    .from("reservations")
                    .update({
                        status: newStatus,
                        updated_at: new Date().toISOString(),
                    })
                    .in("id", reservationIds);

                if (error) throw error;

                toast.success(message);
                addNotification({
                    type: "system",
                    message: message,
                    priority: "normal",
                });
                setSelectedReservations(new Set());
                loadReservations();
            } catch (error) {
                console.error("Error with bulk action:", error);
                toast.error("Error al actualizar las reservas");
            }
        },
        [selectedReservations, loadReservations, addNotification],
    );

    // Calcular estadísticas
    const stats = useMemo(() => {
        const total = filteredReservations.length;
        const confirmed = filteredReservations.filter(
            (r) => r.status === "confirmada",
        ).length;
        const pending = filteredReservations.filter(
            (r) => r.status === "pendiente",
        ).length;
        const covers = filteredReservations.reduce(
            (sum, r) => sum + r.party_size,
            0,
        );
        const agentCount = filteredReservations.filter(
            (r) => r.source === "agent",
        ).length;
        const manualCount = filteredReservations.filter(
            (r) => r.source !== "agent",
        ).length;

        return { total, confirmed, pending, covers, agentCount, manualCount };
    }, [filteredReservations]);

    if (!isReady) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando reservas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header con estadísticas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Gestión de Reservas
                            <Bot className="w-6 h-6 text-purple-600" />
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {format(new Date(), "EEEE d 'de' MMMM, yyyy", {
                                locale: es,
                            })}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowInsightsModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                        >
                            <Brain className="w-4 h-4" />
                            Insights IA
                        </button>

                        <button
                            onClick={() => {
                                loadReservations();
                                loadAgentInsights();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Reserva
                        </button>
                    </div>
                </div>
            </div>

            {/* Panel de insights del agente */}
            <AgentStatsPanel stats={agentStats} insights={agentInsights} />

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            <option value="">Todos los orígenes</option>
                            <option value="agent">🤖 Agente IA</option>
                            <option value="manual">✏️ Manual</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(RESERVATION_STATES).map(
                                ([key, state]) => (
                                    <option key={key} value={key}>
                                        {state.label}
                                    </option>
                                ),
                            )}
                        </select>

                        <select
                            value={filters.channel}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    channel: e.target.value,
                                }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos los canales</option>
                            {Object.entries(CHANNELS).map(([key, channel]) => (
                                <option key={key} value={key}>
                                    {channel.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.period}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    period: e.target.value,
                                }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="today">Hoy</option>
                            <option value="tomorrow">Mañana</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Estadísticas mejoradas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.total}
                            </p>
                        </div>
                        <CalendarIcon className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Por IA</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.agentCount}
                            </p>
                        </div>
                        <Bot className="w-8 h-8 text-purple-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Manual</p>
                            <p className="text-2xl font-bold text-gray-600">
                                {stats.manualCount}
                            </p>
                        </div>
                        <Edit className="w-8 h-8 text-gray-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Confirmadas</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.confirmed}
                            </p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.pending}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Comensales</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.covers}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Controles de selección */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={
                                selectedReservations.size ===
                                    filteredReservations.length &&
                                filteredReservations.length > 0
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">
                            Seleccionar todas ({filteredReservations.length})
                        </span>
                    </div>

                    {/* Leyenda de orígenes */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-4 bg-purple-500 rounded"></div>
                            <Bot className="w-3 h-3 text-purple-600" />
                            <span className="text-gray-600">Agente IA</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Edit className="w-3 h-3 text-gray-600" />
                            <span className="text-gray-600">Manual</span>
                        </div>
                    </div>
                </div>

                {/* Acciones masivas */}
                {selectedReservations.size > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkAction("confirm")}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmar ({selectedReservations.size})
                        </button>
                        <button
                            onClick={() => handleBulkAction("cancel")}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancelar ({selectedReservations.size})
                        </button>
                    </div>
                )}
            </div>

            {/* Lista de reservas */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredReservations.length > 0 ? (
                    filteredReservations.map((reservation) => (
                        <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onAction={handleReservationAction}
                            onSelect={handleSelectReservation}
                            isSelected={selectedReservations.has(
                                reservation.id,
                            )}
                        />
                    ))
                ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay reservas
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {filters.search ||
                            filters.status ||
                            filters.channel ||
                            filters.source
                                ? "No se encontraron reservas que coincidan con los filtros aplicados"
                                : "No hay reservas para el período seleccionado"}
                        </p>
                        {!filters.search &&
                            !filters.status &&
                            !filters.channel &&
                            !filters.source && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear primera reserva
                                </button>
                            )}
                    </div>
                )}
            </div>

            {/* Modal de nueva reserva mejorado */}
            {showCreateModal && (
                <ReservationFormModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSave={() => {
                        setShowCreateModal(false);
                        loadReservations();
                        toast.success("Reserva creada correctamente");
                        addNotification({
                            type: "system",
                            message: "Nueva reserva manual creada",
                            priority: "low",
                        });
                    }}
                    tables={tables}
                    restaurantId={restaurantId}
                />
            )}

            {/* Modal de edición */}
            {showEditModal && editingReservation && (
                <ReservationFormModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingReservation(null);
                    }}
                    onSave={() => {
                        setShowEditModal(false);
                        setEditingReservation(null);
                        loadReservations();
                        toast.success("Reserva actualizada correctamente");
                        addNotification({
                            type: "system",
                            message: "Reserva actualizada",
                            priority: "low",
                        });
                    }}
                    reservation={editingReservation}
                    tables={tables}
                    restaurantId={restaurantId}
                />
            )}

            {/* Modal de insights */}
            {showInsightsModal && (
                <InsightsModal
                    isOpen={showInsightsModal}
                    onClose={() => setShowInsightsModal(false)}
                    insights={agentInsights}
                    stats={agentStats}
                />
            )}
        </div>
    );
}

// Modal para crear/editar reserva
const ReservationFormModal = ({
    isOpen,
    onClose,
    onSave,
    reservation = null,
    tables = [],
    restaurantId,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: reservation?.customer_name || "",
        customer_phone: reservation?.customer_phone || "",
        customer_email: reservation?.customer_email || "",
        date: reservation?.date || format(new Date(), "yyyy-MM-dd"),
        time: reservation?.time || "",
        party_size: reservation?.party_size || 2,
        table_id: reservation?.table_id || "",
        special_requests: reservation?.special_requests || "",
        status: reservation?.status || "confirmada",
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.customer_name.trim()) {
            newErrors.customer_name = "El nombre es obligatorio";
        }

        if (!formData.customer_phone.trim()) {
            newErrors.customer_phone = "El teléfono es obligatorio";
        }

        if (!formData.time) {
            newErrors.time = "La hora es obligatoria";
        }

        if (!formData.party_size || formData.party_size < 1) {
            newErrors.party_size = "Número de personas inválido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const reservationData = {
                ...formData,
                restaurant_id: restaurantId,
                party_size: parseInt(formData.party_size),
                source: "manual", // Siempre manual desde el formulario
                channel: "manual",
                created_by: "user",
            };

            if (reservation) {
                // Actualizar
                const { error } = await supabase
                    .from("reservations")
                    .update(reservationData)
                    .eq("id", reservation.id);

                if (error) throw error;
            } else {
                // Crear
                const { error } = await supabase
                    .from("reservations")
                    .insert([reservationData]);

                if (error) throw error;
            }

            onSave();
        } catch (error) {
            console.error("Error saving reservation:", error);
            toast.error("Error al guardar la reserva");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {reservation
                            ? "Editar Reserva"
                            : "Nueva Reserva Manual"}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Información del cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del cliente
                            </label>
                            <input
                                type="text"
                                value={formData.customer_name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        customer_name: e.target.value,
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.customer_name
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.customer_name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.customer_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={formData.customer_phone}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        customer_phone: e.target.value,
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.customer_phone
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.customer_phone && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.customer_phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email (opcional)
                        </label>
                        <input
                            type="email"
                            value={formData.customer_email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    customer_email: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Detalles de la reserva */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        date: e.target.value,
                                    })
                                }
                                min={format(new Date(), "yyyy-MM-dd")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hora
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        time: e.target.value,
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.time
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.time && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.time}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Personas
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={formData.party_size}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        party_size:
                                            parseInt(e.target.value) || 1,
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.party_size
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.party_size && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.party_size}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Mesa y estado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mesa (opcional)
                            </label>
                            <select
                                value={formData.table_id}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        table_id: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Sin asignar</option>
                                {tables.map((table) => (
                                    <option key={table.id} value={table.id}>
                                        {table.name} - {table.zone} (
                                        {table.min_capacity}-
                                        {table.max_capacity} pax)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        status: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="confirmada">Confirmada</option>
                            </select>
                        </div>
                    </div>

                    {/* Solicitudes especiales */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Solicitudes especiales (opcional)
                        </label>
                        <textarea
                            value={formData.special_requests}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    special_requests: e.target.value,
                                })
                            }
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Alergias, preferencias, celebraciones..."
                        />
                    </div>

                    {/* Indicador de origen */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Esta reserva se marcará como creada manualmente
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            )}
                            {reservation ? "Actualizar" : "Crear"} Reserva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal de insights del agente
const InsightsModal = ({ isOpen, onClose, insights, stats }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-600" />
                        Insights del Agente IA
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* Estadísticas destacadas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <Bot className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-900">
                                {stats.agentReservations}
                            </p>
                            <p className="text-sm text-purple-700">
                                Reservas gestionadas hoy
                            </p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-900">
                                {stats.conversionRate}%
                            </p>
                            <p className="text-sm text-green-700">
                                Tasa de conversión
                            </p>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-orange-900">
                                {stats.avgResponseTime}
                            </p>
                            <p className="text-sm text-orange-700">
                                Tiempo promedio
                            </p>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-900">
                                {stats.satisfaction}%
                            </p>
                            <p className="text-sm text-blue-700">
                                Satisfacción
                            </p>
                        </div>
                    </div>

                    {/* Insights detallados */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Patrones Detectados
                        </h4>
                        <div className="space-y-3">
                            {insights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-purple-600">
                                            {idx + 1}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        {insight}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recomendaciones */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Recomendaciones para optimizar
                        </h4>
                        <ul className="space-y-2 text-sm text-purple-800">
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 mt-0.5" />
                                <span>
                                    Considera activar el canal de Instagram -
                                    potencial de +15% más reservas
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 mt-0.5" />
                                <span>
                                    Los viernes a las 21:00 tienen alta demanda
                                    - sugiere mesas alternativas
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 mt-0.5" />
                                <span>
                                    El agente resuelve mejor las consultas
                                    después de las 18:00
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Distribución por canal */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                            Rendimiento por Canal
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(CHANNELS)
                                .filter(([key]) => key !== "manual")
                                .map(([key, channel]) => {
                                    const percentage =
                                        key === "whatsapp"
                                            ? 65
                                            : key === "vapi"
                                              ? 20
                                              : key === "web"
                                                ? 10
                                                : key === "instagram"
                                                  ? 5
                                                  : 0;
                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-10">
                                                {channel.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {channel.label}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-600 h-2 rounded-full"
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

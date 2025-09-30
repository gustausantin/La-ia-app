
// Mesas.jsx - Sistema COMPLETO de Gestión de Mesas con Agente IA para Son-IA

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import {
    Grid3X3,
    List,
    Plus,
    Search,
    Filter,
    MapPin,
    Edit,
    Trash2,
    Eye,
    Users,
    Clock,
    Bot,
    Target,
    Brain,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    BarChart3,
    RefreshCw,
    Activity,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    Coffee,
    Wine,
    DollarSign,
    Shield,
    Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import ConflictDetectionService from '../services/ConflictDetectionService';
import ConflictWarning from '../components/ConflictWarning';
import { useAvailabilityChangeDetection } from '../hooks/useAvailabilityChangeDetection';
import { useRegenerationModal } from '../hooks/useRegenerationModal';
import RegenerationRequiredModal from '../components/RegenerationRequiredModal';

// DATOS NECESARIOS DE SUPABASE:
// - tabla: tables (id, restaurant_id, table_number, name, zone, min_capacity, max_capacity, status, notes)
// - tabla: reservations (con campos 'source' y 'channel' para identificar origen)
// - tabla: agent_table_preferences (table_id, score, reason, updated_at)
// - RPC: get_table_statistics(table_id, date_range)
// - RPC: get_agent_table_insights(restaurant_id)
// - real-time: suscripción a cambios en tables y reservations

// Estados de mesa con iconos y colores mejorados
const TABLE_STATES = {
    available: {
        label: "Disponible",
        icon: "✅", // Mesa activa = check verde
        color: "border-green-400",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
    },
    reserved: {
        label: "Reservada",
        icon: "📅",
        color: "border-yellow-400",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
    },
    occupied: {
        label: "Ocupada",
        icon: "🍽️",
        color: "border-blue-400",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
    },
    inactive: {
        label: "Inactiva",
        icon: "❌", // Mesa inactiva = X roja
        color: "border-gray-400",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
    },

};

// Componente de estadísticas del agente
const AgentInsightsPanel = ({ stats, suggestions }) => {
    return (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Optimización IA de Mesas
                </h3>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    Agente Activo
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p className="text-2xl font-bold">
                        {stats.agentAssignments || 0}
                    </p>
                    <p className="text-sm text-purple-100">Asignaciones hoy</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.efficiency || 0}%
                    </p>
                    <p className="text-sm text-purple-100">Eficiencia</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.avgTurnover || "0h"}
                    </p>
                    <p className="text-sm text-purple-100">Rotación promedio</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">
                        {stats.optimization || 0}%
                    </p>
                    <p className="text-sm text-purple-100">
                        Optimización espacial
                    </p>
                </div>
            </div>

            {suggestions && suggestions.length > 0 && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Sugerencias actuales
                    </p>
                    <ul className="space-y-1 text-sm">
                        {suggestions.slice(0, 3).map((sug, idx) => (
                            <li key={idx} className="text-purple-100">
                                • {sug.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Badge de sugerencia del agente
const AgentSuggestionBadge = ({ suggestion }) => {
    if (!suggestion) return null;

    const getBadgeColor = (score) => {
        if (score >= 90) return "bg-purple-100 text-purple-700";
        if (score >= 70) return "bg-blue-100 text-blue-700";
        if (score >= 50) return "bg-yellow-100 text-yellow-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getBadgeColor(
                suggestion.score,
            )}`}
        >
            <Bot className="w-3 h-3" />
            <span>{suggestion.score}%</span>
        </div>
    );
};

// Componente de tarjeta de mesa visual mejorado
const TableCard = ({
    table,
    reservation,
    onAction,
    viewMode = "grid",
    agentPreference,
}) => {
    const [showActions, setShowActions] = useState(false);

    // Determinar el estado de la mesa
    const getTableStatus = () => {
        // Verificar primero si la mesa está activa (is_active = true)
        const isActive = table.is_active !== false;
        
        if (!isActive) {
            return "inactive";
        }



        if (!reservation) return "available";

        // 🔧 CORRECCIÓN: BD usa estados en inglés, no español
        if (reservation.status === "seated") return "occupied";
        if (reservation.status === "confirmed") return "reserved";

        return "available";
    };

    const status = getTableStatus();
    const stateInfo = TABLE_STATES[status];

    const formatTime = (timeString) => {
        return timeString ? timeString.slice(0, 5) : "";
    };

    // Indicador de si fue asignada por el agente
    const isAgentAssigned = reservation?.source === "agent";

    if (viewMode === "list") {
        return (
            <div
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${stateInfo.color} ${
                    agentPreference && agentPreference.score > 80
                        ? "ring-2 ring-purple-400"
                        : ""
                }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-12 h-12 ${stateInfo.bgColor} rounded-lg flex items-center justify-center text-2xl border relative`}
                        >
                            {stateInfo.icon}
                            {isAgentAssigned && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Bot className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">
                                    {table.name} ({table.table_number})
                                </h4>
                                {agentPreference && (
                                    <AgentSuggestionBadge
                                        suggestion={agentPreference}
                                    />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                {table.zone} • {table.capacity} personas
                            </p>

                            {reservation && (
                                <div className="mt-1 text-sm">
                                    <p className="font-medium text-gray-800">
                                        {reservation.customer_name} -{" "}
                                        {formatTime(reservation.time)}
                                    </p>
                                    <p className="text-gray-600">
                                        {reservation.party_size} personas •{" "}
                                        {reservation.customer_phone}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${stateInfo.bgColor} ${stateInfo.textColor}`}
                        >
                            {stateInfo.label}
                        </span>

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
                                            onAction("edit", table);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar mesa
                                    </button>

                                    <button
                                        onClick={() => {
                                            onAction("viewStats", table);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-purple-600"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Ver estadísticas
                                    </button>

                                    {reservation && (
                                        <button
                                            onClick={() => {
                                                onAction(
                                                    "viewReservation",
                                                    reservation,
                                                );
                                                setShowActions(false);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Ver reserva
                                        </button>
                                    )}

                                    <hr className="my-1" />

                                    <button
                                        onClick={() => {
                                            onAction("delete", table);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Vista de grid (tarjetas cuadradas)
    return (
        <div
            className={`relative bg-white border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${stateInfo.color} ${
                agentPreference && agentPreference.score > 80
                    ? "ring-2 ring-purple-400"
                    : ""
            }`}
            onClick={() => {
                if (reservation) {
                    onAction("viewReservation", reservation);
                } else {
                    onAction("edit", table);
                }
            }}
        >
            {/* Badge del agente */}
            {isAgentAssigned && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Preferencia del agente */}
            {agentPreference && (
                <div className="absolute top-2 left-2">
                    <AgentSuggestionBadge suggestion={agentPreference} />
                </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-3">
                <div
                    className={`w-16 h-16 ${stateInfo.bgColor} rounded-full flex items-center justify-center text-3xl`}
                >
                    {stateInfo.icon}
                </div>

                <div className="text-center">
                    <h4 className="font-bold text-gray-900">{table.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{table.zone}</p>
                    <p className="text-xs text-gray-500">
                        {table.capacity} pax
                    </p>
                </div>

                {reservation && (
                    <div className="text-center border-t pt-2 w-full">
                        <p className="text-xs font-medium text-gray-800 truncate">
                            {reservation.customer_name}
                        </p>
                        <p className="text-xs text-gray-600">
                            {formatTime(reservation.time)} •{" "}
                            {reservation.party_size}p
                        </p>
                    </div>
                )}

                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${stateInfo.bgColor} ${stateInfo.textColor}`}
                >
                    {stateInfo.label}
                </span>
            </div>

            {/* Botón de acciones */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                }}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <MoreVertical className="w-3 h-3 text-gray-600" />
            </button>

            {showActions && (
                <div className="absolute right-2 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction("edit", table);
                            setShowActions(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"
                    >
                        <Edit className="w-3 h-3" />
                        Editar
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction("viewStats", table);
                            setShowActions(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs text-purple-600"
                    >
                        <BarChart3 className="w-3 h-3" />
                        Stats
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction("delete", table);
                            setShowActions(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs text-red-600"
                    >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

// Componente principal
export default function Mesas() {
    const { restaurant, restaurantId, isReady, addNotification } =
        useAuthContext();
    const changeDetection = useAvailabilityChangeDetection(restaurantId);
    const { isModalOpen, modalChangeReason, modalChangeDetails, showRegenerationModal, closeModal } = useRegenerationModal();

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [zones, setZones] = useState([]);
    const [agentStats, setAgentStats] = useState({
        agentAssignments: 0,
        efficiency: 0,
        avgTurnover: "0h",
        optimization: 0,
    });
    const [agentSuggestions, setAgentSuggestions] = useState([]);
    const [tablePreferences, setTablePreferences] = useState({});

    // Estados de filtros y vista
    const [selectedZone, setSelectedZone] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
    const [showAgentView, setShowAgentView] = useState(false);

    // Estados de modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedReservation, setSelectedReservation] = useState(null);
    
    // Estados de conflictos
    const [conflictData, setConflictData] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    // Subscription de real-time
    const [realtimeSubscription, setRealtimeSubscription] = useState(null);

    // Función para refrescar datos
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadTables(), loadTodayReservations()]);
        toast.success("Datos de mesas actualizados");
    }, []);

    // Función para cargar mesas
    const loadTables = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("tables")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .order("zone")
                .order("table_number");

            if (error) throw error;

            setTables(data || []);

            // Extraer zonas únicas
            const uniqueZones = [
                ...new Set((data || []).map((table) => table.zone)),
            ].filter(Boolean);
            setZones(uniqueZones);
        } catch (error) {
            toast.error("Error al cargar las mesas");
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Función para cargar reservas de hoy
    const loadTodayReservations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const today = new Date().toISOString().split("T")[0];

            const { data, error } = await supabase
                .from("reservations")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .eq("reservation_date", today)
                .in("status", ["confirmada", "sentada"]);

            if (error) throw error;
            setReservations(data || []);

            // Calcular estadísticas del agente
            const agentReservations = (data || []).filter(
                (r) => r.source === "agent",
            );
            setAgentStats((prev) => ({
                ...prev,
                agentAssignments: agentReservations.length,
            }));

        } catch (error) {
            toast.error("Error al cargar las reservas");
        }
    }, [restaurantId]);

    // Función para calcular métricas reales del agente
    const loadAgentPreferences = useCallback(async () => {
        if (!restaurantId) return;

        try {
            // Calcular preferencias reales basadas en datos
            const preferences = {};
            const realSuggestions = [];
            
            tables.forEach(table => {
                // Reservas para esta mesa
                const tableReservations = reservations.filter(r => 
                    r.table_id === table.id || r.table_number === table.table_number
                );
                
                // Solo calcular score si hay datos reales
                if (tableReservations.length > 0) {
                    const score = Math.min(95, 50 + (tableReservations.length * 10));
                    
                    let reason = "";
                    if (tableReservations.length >= 3) {
                        reason = "Alta rotación, muy solicitada";
                    } else if (tableReservations.length >= 1) {
                        reason = "Rotación moderada, buena ubicación";
                    }
                    
                    preferences[table.id] = { score, reason };
                } 
                // NO mostrar porcentaje si no hay datos - es confuso y no aporta valor
            });

            setTablePreferences(preferences);

            // REGLAS CLARAS DE SUGERENCIAS IA - LÓGICA COHERENTE
            const zoneOccupancy = {};
            const zoneCapacity = {};
            
            // Calcular ocupación y capacidad por zona
            tables.forEach(table => {
                if (table.is_active !== false) {
                    const zone = table.zone;
                    zoneCapacity[zone] = (zoneCapacity[zone] || 0) + 1;
                }
            });
            
            reservations.forEach(r => {
                const table = tables.find(t => t.id === r.table_id || t.table_number === r.table_number);
                if (table && table.is_active !== false) {
                    zoneOccupancy[table.zone] = (zoneOccupancy[table.zone] || 0) + 1;
                }
            });

            // REGLA 1: Balanceamiento de zonas (si ocupación > 80% en una zona)
            Object.entries(zoneOccupancy).forEach(([zone, occupied]) => {
                const capacity = zoneCapacity[zone] || 1;
                const occupancyRate = (occupied / capacity) * 100;
                
                if (occupancyRate >= 80) {
                    realSuggestions.push({
                        message: `Zona ${zone} al ${Math.round(occupancyRate)}% de ocupación. Considera optimizar distribución`,
                        type: "balance",
                    });
                }
            });

            // REGLA 2: Análisis de capacidad vs demanda
            const avgPartySize = reservations.length > 0 ? 
                reservations.reduce((sum, r) => sum + (r.party_size || 2), 0) / reservations.length : 0;
            
            if (avgPartySize > 0) {
                const tablesOptimal = tables.filter(t => 
                    t.is_active !== false && 
                    Math.abs(t.capacity - avgPartySize) <= 1
                ).length;
                
                const totalActiveTables = tables.filter(t => t.is_active !== false).length;
                const optimalPercentage = totalActiveTables > 0 ? (tablesOptimal / totalActiveTables) * 100 : 0;
                
                if (optimalPercentage < 50) {
                    realSuggestions.push({
                        message: `Solo ${Math.round(optimalPercentage)}% de mesas son óptimas para grupos de ${Math.round(avgPartySize)} personas (promedio)`,
                        type: "optimization",
                    });
                } else {
                    realSuggestions.push({
                        message: `Configuración óptima: ${Math.round(optimalPercentage)}% de mesas adecuadas para demanda actual`,
                        type: "insight",
                    });
                }
            }

            // REGLA 3: Detectar mesas infrautilizadas
            const underutilizedTables = tables.filter(table => {
                if (table.is_active === false) return false;
                const tableReservations = reservations.filter(r => 
                    r.table_id === table.id || r.table_number === table.table_number
                );
                return tableReservations.length === 0 && tables.length > 1;
            });

            if (underutilizedTables.length > 0 && reservations.length > 0) {
                realSuggestions.push({
                    message: `${underutilizedTables.length} mesa(s) sin reservas hoy. Considera promociones específicas`,
                    type: "optimization",
                });
            }

            setAgentSuggestions(realSuggestions);

            // ESTADÍSTICAS REALES DEL AGENTE - CÁLCULOS COHERENTES
            const activeTables = tables.filter(t => t.is_active !== false).length;
            const occupiedTables = reservations.length;
            
            // Eficiencia: % de mesas activas con reservas
            const efficiency = activeTables > 0 ? Math.round((occupiedTables / activeTables) * 100) : 0;
            
            // Rotación promedio: estimación basada en reservas por mesa
            const avgTurnover = activeTables > 0 ? 
                `${Math.round(1.5 + (occupiedTables / activeTables))}h` : "0h";

            // Optimización: balance de zonas + utilización
            let optimization = 100;
            
            // Penalizar si hay desbalance de zonas (>30% diferencia)
            if (Object.keys(zoneOccupancy).length > 1) {
                const occupancyRates = Object.entries(zoneOccupancy).map(([zone, occupied]) => {
                    const capacity = zoneCapacity[zone] || 1;
                    return (occupied / capacity) * 100;
                });
                
                if (occupancyRates.length > 0) {
                    const maxRate = Math.max(...occupancyRates);
                    const minRate = Math.min(...occupancyRates);
                    const balanceScore = Math.max(0, 100 - (maxRate - minRate));
                    optimization = Math.round((optimization + balanceScore) / 2);
                }
            }
            
            // Penalizar si hay mesas inactivas innecesarias
            const inactiveTables = tables.filter(t => t.is_active === false).length;
            if (inactiveTables > 0 && occupiedTables > activeTables * 0.8) {
                optimization = Math.max(0, optimization - (inactiveTables * 10));
            }

            setAgentStats((prev) => ({
                ...prev,
                efficiency: Math.min(100, Math.max(0, efficiency)),
                avgTurnover,
                optimization: Math.min(100, Math.max(0, optimization)),
            }));
        } catch (error) {
            console.error("Error calculating agent metrics:", error);
        }
    }, [restaurantId, tables, reservations]);

    // Configurar real-time subscriptions
    useEffect(() => {
        if (!restaurantId) return;

        // Suscribirse a cambios en tiempo real
        const subscription = supabase
            .channel("tables-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tables",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    loadTables();
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "reservations",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    // Notificar si el agente asignó una mesa
                    if (
                        payload.eventType === "INSERT" &&
                        payload.new.source === "agent"
                    ) {
                        toast.success(
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                <span>
                                    El agente asignó mesa{" "}
                                    {payload.new.table_number}!
                                </span>
                            </div>,
                        );

                        // Agregar notificación global
                        if (addNotification) {
                            addNotification({
                                type: "agent",
                                message: `Mesa ${payload.new.table_number} asignada por el agente`,
                                priority: "normal",
                            });
                        }
                    }

                    loadTodayReservations();
                },
            )
            .subscribe();

        setRealtimeSubscription(subscription);

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [restaurantId, addNotification]); // SIN funciones de carga en dependencies

    // Cargar datos inicial - SIN DEPENDENCY LOOPS
    useEffect(() => {
        if (isReady && restaurantId) {
            setLoading(true);
            Promise.all([
                loadTables(),
                loadTodayReservations(),
            ]).finally(() => setLoading(false));
        }
    }, [isReady, restaurantId]); // SOLO dependencies estables

    // Recalcular métricas del agente cuando cambien datos
    useEffect(() => {
        if (tables.length > 0 || reservations.length > 0) {
            loadAgentPreferences();
        }
    }, [tables, reservations, loadAgentPreferences]);

    // Función para obtener reserva de una mesa
    const getTableReservation = useCallback(
        (tableId) => {
            return reservations.find((r) => r.table_id === tableId) || null;
        },
        [reservations],
    );

    // Filtrar mesas
    const filteredTables = useMemo(() => {
        let filtered = tables;

        // Filtro por zona
        if (selectedZone !== "all") {
            filtered = filtered.filter((table) => table.zone === selectedZone);
        }

                        // Filtro por estado
                if (selectedStatus !== "all") {
                    filtered = filtered.filter((table) => {
                        const reservation = getTableReservation(table.id);
                        const isActive = table.is_active !== false;

                        if (selectedStatus === "available") {
                            return isActive && !reservation;
                        }
                        if (selectedStatus === "reserved") {
                            return isActive && reservation && reservation.status === "confirmed";
                        }
                        if (selectedStatus === "occupied") {
                            return isActive && reservation && reservation.status === "seated";
                        }
                        if (selectedStatus === "inactive") {
                            return !isActive;
                        }


                        return true;
                    });
                }

        // Filtro por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (table) =>
                    table.name.toLowerCase().includes(term) ||
                    table.table_number.toLowerCase().includes(term) ||
                    table.zone.toLowerCase().includes(term),
            );
        }

        // Si está activada la vista del agente, ordenar por preferencia
        if (showAgentView) {
            filtered = filtered.sort((a, b) => {
                const prefA = tablePreferences[a.id]?.score || 0;
                const prefB = tablePreferences[b.id]?.score || 0;
                return prefB - prefA;
            });
        }

        return filtered;
    }, [
        tables,
        selectedZone,
        selectedStatus,
        searchTerm,
        getTableReservation,
        showAgentView,
        tablePreferences,
    ]);

    // Agrupar mesas por zona para vista de grid
    const tablesByZone = useMemo(() => {
        const grouped = {};

        filteredTables.forEach((table) => {
            const zone = table.zone || "Sin zona";
            if (!grouped[zone]) {
                grouped[zone] = [];
            }
            grouped[zone].push(table);
        });

        return grouped;
    }, [filteredTables]);

    // Calcular estadísticas - CORREGIDO lógica real mejorada
    const stats = useMemo(() => {
        const total = tables.length;
        
        // Activas: mesas que están operativas (no inactivas)
        const active = tables.filter((t) => 
            t.is_active !== false
        ).length;
        
        const reserved = reservations.filter(
            (r) => r.status === "confirmed",
        ).length;
        const occupied = reservations.filter(
            (r) => r.status === "seated",
        ).length;
        
        // Disponibles: mesas activas SIN reservas (ni por table_id ni por table_number)
        const tablesWithReservations = new Set([
            ...reservations.map(r => r.table_id).filter(Boolean),
            ...reservations.map(r => r.table_number).filter(Boolean)
        ]);
        
        const available = tables.filter(t => {
            // Debe estar activa y operativa
            const isActive = t.is_active !== false;
            

            
            // No debe tener reservas asignadas
            const hasNoReservations = !tablesWithReservations.has(t.id) && 
                                     !tablesWithReservations.has(t.table_number);
            
            return isActive && hasNoReservations;
        }).length;

        return { total, active, available, reserved, occupied };
    }, [tables, reservations]);

    // Funciones de acciones
    const handleTableAction = useCallback((action, data) => {
        switch (action) {
            case "edit":
                setSelectedTable(data);
                setShowEditModal(true);
                break;
            case "delete":
                handleDeleteTableWithValidation(data);
                break;
            case "viewReservation":
                setSelectedReservation(data);
                setShowReservationModal(true);
                break;
            case "viewStats":
                setSelectedTable(data);
                setShowStatsModal(true);
                break;
            default:
                break;
        }
    }, []);

    // Función para validar eliminación de mesa
    const handleDeleteTableWithValidation = useCallback(async (table) => {
        try {
            // Detectar conflictos antes de eliminar
            const conflicts = await ConflictDetectionService.detectTableConflicts(
                restaurantId,
                table.id,
                'DELETE'
            );
            
            if (conflicts.hasConflicts) {
                // Mostrar modal de conflictos
                setConflictData(conflicts);
                setPendingAction({
                    type: 'DELETE_TABLE',
                    data: table
                });
            } else {
                // No hay conflictos, eliminar directamente
                if (window.confirm(`¿Estás seguro de que quieres eliminar la mesa "${table.name}"?`)) {
                    await deleteTable(table.id);
                }
            }
        } catch (error) {
            console.error('Error validando eliminación de mesa:', error);
            toast.error('Error al validar la eliminación');
        }
    }, [restaurantId]);

    // Función para eliminar mesa (sin validación)
    const deleteTable = useCallback(
        async (tableId) => {
            try {
                const { error } = await supabase
                    .from("tables")
                    .delete()
                    .eq("id", tableId);

                if (error) throw error;

                // Guardar referencia ANTES de actualizar
                const deletedTable = tables.find(t => t.id === tableId);
                const tableName = deletedTable?.name || 'Mesa';
                
                toast.success("Mesa eliminada correctamente");
                if (addNotification) {
                    addNotification({
                        type: "system",
                        message: "Mesa eliminada del sistema",
                        priority: "low",
                    });
                }

                loadTables();
                
                // 🚨 VERIFICAR SLOTS Y MOSTRAR MODAL
                console.log('🔍 Verificando slots después de eliminar mesa...');
                const slotsExist = await changeDetection.checkExistingSlots();
                console.log('🔍 ¿Existen slots?', slotsExist);
                
                if (slotsExist) {
                    console.log('🚨 HAY SLOTS - Guardando estado y mostrando modal...');
                    
                    // 🎯 GUARDAR ESTADO EN LOCALSTORAGE (igual que Calendario)
                    await changeDetection.onTableChange('removed', {
                        id: tableId,
                        name: tableName
                    });
                    
                    // Mostrar modal
                    setTimeout(() => {
                        showRegenerationModal('table_deleted', `Mesa "${tableName}" eliminada`);
                    }, 500);
                } else {
                    console.log('✅ No hay slots - No se muestra modal');
                }
            } catch (error) {
                toast.error("Error al eliminar la mesa");
            }
        },
        [loadTables, addNotification, tables, changeDetection, showRegenerationModal],
    );

    // Función para confirmar acción con conflictos
    const handleConfirmWithConflicts = useCallback(async () => {
        if (!pendingAction) return;
        
        try {
            switch (pendingAction.type) {
                case 'DELETE_TABLE':
                    await deleteTable(pendingAction.data.id);
                    toast.warning('⚠️ Mesa eliminada a pesar de tener reservas. Contacta a los clientes afectados.');
                    break;
            }
        } catch (error) {
            toast.error('Error ejecutando la acción');
        } finally {
            setConflictData(null);
            setPendingAction(null);
        }
    }, [pendingAction, deleteTable]);

    // Función para cancelar acción con conflictos
    const handleCancelConflictAction = useCallback(() => {
        setConflictData(null);
        setPendingAction(null);
    }, []);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header mejorado con estadísticas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Gestión de Mesas
                            <Bot className="w-6 h-6 text-purple-600" />
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {stats.total} mesas • {stats.active} activas •{" "}
                            {stats.available} disponibles
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowAgentView(!showAgentView)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                showAgentView
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            <Brain className="w-4 h-4" />
                            Vista IA
                        </button>

                        <button
                            onClick={() => {
                                loadTables();
                                loadTodayReservations();
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
                            Nueva Mesa
                        </button>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.available}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Disponibles
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.reserved}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Reservadas
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.occupied}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Ocupadas
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {agentStats.agentAssignments}
                                </p>
                                <p className="text-sm text-gray-600">Por IA</p>
                            </div>
                            <Bot className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.active > 0
                                        ? Math.round(
                                              ((stats.occupied +
                                                  stats.reserved) /
                                                  stats.active) *
                                                  100,
                                          )
                                        : 0}
                                    %
                                </p>
                                <p className="text-sm text-gray-600">
                                    Ocupación
                                </p>
                            </div>
                            <Activity className="w-8 h-8 text-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de insights del agente */}
            {showAgentView && (
                <AgentInsightsPanel
                    stats={agentStats}
                    suggestions={agentSuggestions}
                />
            )}

            {/* Filtros y controles */}
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
                            placeholder="Buscar mesa por nombre, número o zona..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas las zonas</option>
                            {zones.map((zone) => (
                                <option key={zone} value={zone}>
                                    {zone}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="available">Disponibles</option>
                            <option value="reserved">Reservadas</option>
                            <option value="occupied">Ocupadas</option>
                            <option value="inactive">Inactivas</option>

                        </select>

                        {/* Toggle vista */}
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-2 flex items-center gap-2 ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-2 flex items-center gap-2 border-l border-gray-300 ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                                <List className="w-4 h-4" />
                                Lista
                            </button>
                        </div>
                    </div>
                </div>

                {/* Leyenda de estados */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-sm">
                    {Object.entries(TABLE_STATES).map(([key, state]) => (
                        <div key={key} className="flex items-center gap-2">
                            <span className="text-lg">{state.icon}</span>
                            <span className="text-gray-600">{state.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 ml-auto">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600">Asignada por IA</span>
                    </div>
                </div>
            </div>

            {/* Vista de mesas */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="h-16 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : viewMode === "grid" ? (
                <div className="space-y-8">
                    {Object.keys(tablesByZone).length > 0 ? (
                        Object.entries(tablesByZone).map(
                            ([zone, zoneTables]) => (
                                <div key={zone}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {zone}
                                        </h3>
                                        <span className="text-sm text-gray-500">
                                            ({zoneTables.length} mesas)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {zoneTables.map((table) => (
                                            <TableCard
                                                key={table.id}
                                                table={table}
                                                reservation={getTableReservation(
                                                    table.id,
                                                )}
                                                onAction={handleTableAction}
                                                viewMode="grid"
                                                agentPreference={
                                                    tablePreferences[table.id]
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            ),
                        )
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                            <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay mesas
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm ||
                                selectedZone !== "all" ||
                                selectedStatus !== "all"
                                    ? "No se encontraron mesas con los filtros aplicados"
                                    : "Comienza creando tu primera mesa"}
                            </p>
                            {!searchTerm &&
                                selectedZone === "all" &&
                                selectedStatus === "all" && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Crear primera mesa
                                    </button>
                                )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTables.length > 0 ? (
                        filteredTables.map((table) => (
                            <TableCard
                                key={table.id}
                                table={table}
                                reservation={getTableReservation(table.id)}
                                onAction={handleTableAction}
                                viewMode="list"
                                agentPreference={tablePreferences[table.id]}
                            />
                        ))
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay mesas para mostrar
                            </h3>
                            <p className="text-gray-600">
                                Intenta ajustar los filtros o crear una nueva
                                mesa
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de crear/editar mesa */}
            {(showCreateModal || showEditModal) && (
                <TableModal
                    isOpen={showCreateModal || showEditModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setSelectedTable(null);
                    }}
                    onSave={(savedTable) => {
                        // 🚨 MOSTRAR MODAL BLOQUEANTE DE REGENERACIÓN (solo si existen slots)
                        const isNew = !selectedTable;
                        
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setSelectedTable(null);
                        loadTables();
                        
                        // Verificar si existen slots antes de mostrar modal
                        changeDetection.checkExistingSlots().then(slotsExist => {
                            if (slotsExist) {
                                if (isNew) {
                                    changeDetection.onTableChange('added', savedTable || { name: 'Nueva mesa' });
                                    showRegenerationModal('table_created', `Mesa "${savedTable?.name || 'nueva'}" creada`);
                                } else {
                                    changeDetection.onTableChange('modified', selectedTable);
                                    showRegenerationModal('table_modified', `Mesa "${selectedTable?.name}" modificada`);
                                }
                            } else {
                                console.log('✅ No se muestra aviso: usuario está configurando el sistema por primera vez');
                            }
                        });
                        toast.success(
                            selectedTable
                                ? "Mesa actualizada correctamente"
                                : "Mesa creada correctamente",
                        );
                        if (addNotification) {
                            addNotification({
                                type: "system",
                                message: selectedTable
                                    ? "Mesa actualizada"
                                    : "Nueva mesa creada",
                                priority: "low",
                            });
                        }
                    }}
                    restaurantId={restaurantId}
                    table={selectedTable}
                />
            )}

            {/* Modal de vista de reserva */}
            {showReservationModal && selectedReservation && (
                <ReservationModal
                    isOpen={showReservationModal}
                    onClose={() => {
                        setShowReservationModal(false);
                        setSelectedReservation(null);
                    }}
                    reservation={selectedReservation}
                />
            )}

            {/* Modal de conflictos */}
            {conflictData && (
                <ConflictWarning
                    conflicts={conflictData}
                    onConfirm={handleConfirmWithConflicts}
                    onCancel={handleCancelConflictAction}
                    title="⚠️ No se puede eliminar la mesa"
                    confirmText="Eliminar de todas formas"
                    cancelText="Cancelar eliminación"
                />
            )}

            {/* Modal de estadísticas de mesa */}
            {showStatsModal && selectedTable && (
                <TableStatsModal
                    isOpen={showStatsModal}
                    onClose={() => {
                        setShowStatsModal(false);
                        setSelectedTable(null);
                    }}
                    table={selectedTable}
                    restaurantId={restaurantId}
                />
            )}

            {/* 🚨 MODAL BLOQUEANTE DE REGENERACIÓN */}
            <RegenerationRequiredModal
                isOpen={isModalOpen}
                onClose={closeModal}
                changeReason={modalChangeReason}
                changeDetails={modalChangeDetails}
            />
        </div>
    );
}

// Componente modal para crear/editar mesas
const TableModal = ({
    isOpen,
    onClose,
    onSave,
    restaurantId,
    table = null,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        table_number: table?.table_number || "",
        name: table?.name || "",
        zone: table?.zone || "",
        capacity: table?.capacity || 4,
        status: table ? (table.is_active === false ? "inactive" : "available") : "available",
        notes: table?.notes || "",
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.table_number.trim()) {
            newErrors.table_number = "El número de mesa es obligatorio";
        }

        if (!formData.name.trim()) {
            newErrors.name = "El nombre de la mesa es obligatorio";
        }

        if (!formData.zone.trim()) {
            newErrors.zone = "La zona es obligatoria";
        }

        if (!formData.capacity || formData.capacity < 1) {
            newErrors.capacity = "La capacidad debe ser al menos 1";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // 🔍 VALIDACIÓN CAPACIDAD MÁXIMA (COHERENCIA CON CONFIGURACIÓN)
            if (!table) { // Solo validar al crear nueva mesa
                // Obtener capacidad máxima configurada
                const { data: restaurantData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                
                const maxCapacity = restaurantData?.settings?.capacity_total || 0;
                
                if (maxCapacity > 0) {
                    // Calcular capacidad actual de todas las mesas
                    const { data: existingTables } = await supabase
                        .from("tables")
                        .select("capacity")
                        .eq("restaurant_id", restaurantId)
                        .eq("is_active", true);
                    
                    const currentCapacity = existingTables?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 0;
                    const newCapacity = currentCapacity + parseInt(formData.capacity);
                    
                    if (newCapacity > maxCapacity) {
                        throw new Error(`⚠️ Capacidad máxima excedida: ${newCapacity}/${maxCapacity} comensales. Ajusta la capacidad máxima en Configuración → General o reduce la capacidad de esta mesa.`);
                    }
                    
                    // Mostrar advertencia si está cerca del límite
                    if (newCapacity > maxCapacity * 0.9) {
                        toast(`⚠️ Cerca del límite: ${newCapacity}/${maxCapacity} comensales`, {
                            icon: "🚨",
                            duration: 4000
                        });
                    }
                }
            }

            const tableData = {
                table_number: formData.table_number,
                name: formData.name,
                zone: formData.zone,
                capacity: parseInt(formData.capacity),
                notes: formData.notes,
                restaurant_id: restaurantId,
                is_active: formData.status !== "inactive",
                status: "available",
            };

            if (table) {
                // Actualizar
                const { error } = await supabase
                    .from("tables")
                    .update(tableData)
                    .eq("id", table.id);

                if (error) throw error;
            } else {
                // Crear
                const { error } = await supabase
                    .from("tables")
                    .insert([tableData]);

                if (error) throw error;
            }

            onSave();
            // Toast movido al componente principal para evitar duplicados
        } catch (error) {
            console.error("Error saving table:", error);
            toast.error(`Error al guardar la mesa: ${error.message || error.hint || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {table ? "Editar Mesa" : "Nueva Mesa"}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número de Mesa
                            </label>
                            <input
                                type="text"
                                value={formData.table_number}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        table_number: e.target.value,
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.table_number
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="T1, M01, etc."
                            />
                            {errors.table_number && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.table_number}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.name
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="Mesa 1, Terraza 2, etc."
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zona
                        </label>
                        <select
                            value={formData.zone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    zone: e.target.value,
                                })
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.zone
                                    ? "border-red-300"
                                    : "border-gray-300"
                            }`}
                        >
                            <option value="">Seleccionar zona...</option>
                            <option value="Salón principal">Salón principal</option>
                            <option value="Salón secundario">Salón secundario</option>
                            <option value="Terraza">Terraza</option>
                            <option value="Privado">Privado</option>
                            <option value="Exterior">Exterior</option>
                            <option value="Barra">Barra</option>
                            <option value="VIP">Zona VIP</option>
                            <option value="Otros">Otros</option>
                        </select>
                        {errors.zone && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors.zone}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacidad (personas)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={formData.capacity}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    capacity: parseInt(e.target.value) || 1,
                                })
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.capacity
                                    ? "border-red-300"
                                    : "border-gray-300"
                            }`}
                            placeholder="Ej: 4 personas"
                        />
                        {errors.capacity && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors.capacity}
                            </p>
                        )}
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
                            <option value="available">Activa</option>
                            <option value="inactive">Inactiva</option>

                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas (opcional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    notes: e.target.value,
                                })
                            }
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Información adicional sobre la mesa..."
                        />
                    </div>

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
                            {table ? "Actualizar" : "Crear"} Mesa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente modal para ver reserva
const ReservationModal = ({ isOpen, onClose, reservation }) => {
    if (!isOpen || !reservation) return null;

    const formatTime = (timeString) => {
        return timeString ? timeString.slice(0, 5) : "";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        Detalles de la Reserva
                        {reservation.source === "agent" && (
                            <Bot className="w-5 h-5 text-purple-600" />
                        )}
                    </h3>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Cliente</p>
                            <p className="font-medium text-gray-900">
                                {reservation.customer_name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Teléfono</p>
                            <p className="font-medium text-gray-900">
                                {reservation.customer_phone}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Fecha</p>
                            <p className="font-medium text-gray-900">
                                {format(
                                    new Date(reservation.date),
                                    "dd/MM/yyyy",
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Hora</p>
                            <p className="font-medium text-gray-900">
                                {formatTime(reservation.time)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Personas</p>
                            <p className="font-medium text-gray-900">
                                {reservation.party_size}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Estado</p>
                            <p className="font-medium text-gray-900">
                                {reservation.status === "confirmed"
                                    ? "Confirmada"
                                    : reservation.status === "seated"
                                      ? "Sentada"
                                      : reservation.status === "pending"
                                      ? "Pendiente"
                                      : reservation.status === "cancelled"
                                      ? "Cancelada"
                                      : reservation.status}
                            </p>
                        </div>
                    </div>

                    {reservation.special_requests && (
                        <div>
                            <p className="text-sm text-gray-600">
                                Solicitudes especiales
                            </p>
                            <p className="font-medium text-gray-900">
                                {reservation.special_requests}
                            </p>
                        </div>
                    )}

                    {reservation.source === "agent" && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-sm font-medium text-purple-900">
                                Reserva creada por el Agente IA
                            </p>
                            {reservation.channel && (
                                <p className="text-xs text-purple-700 mt-1">
                                    Canal: {reservation.channel}
                                </p>
                            )}
                        </div>
                    )}
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

// Componente modal para estadísticas de mesa
const TableStatsModal = ({ isOpen, onClose, table, restaurantId }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (isOpen && table) {
            loadTableStats();
        }
    }, [isOpen, table]);

    const loadTableStats = async () => {
        setLoading(true);
        try {
            // LIMPIO: Estadísticas vacías hasta tener datos reales
            const emptyStats = {
                totalReservations: 0,
                avgOccupancy: 0,
                avgTurnover: "0h 0min",
                peakHours: [],
                avgPartySize: 0,
                revenue: 0,
                agentAssignments: 0,
                agentPercentage: 0,
            };

            setStats(emptyStats);
        } catch (error) {
            toast.error("Error al cargar estadísticas");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !table) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Estadísticas de {table.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Últimos 30 días
                    </p>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-24 bg-gray-200 rounded-lg animate-pulse"
                                />
                            ))}
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Métricas principales */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {stats.totalReservations}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Reservas totales
                                            </p>
                                        </div>
                                        <Calendar className="w-8 h-8 text-blue-500" />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {stats.avgOccupancy}%
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Ocupación promedio
                                            </p>
                                        </div>
                                        <Activity className="w-8 h-8 text-green-500" />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {stats.avgTurnover}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Rotación promedio
                                            </p>
                                        </div>
                                        <Clock className="w-8 h-8 text-orange-500" />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                €{stats.revenue}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Ingresos estimados
                                            </p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-yellow-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas del agente */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-purple-600" />
                                    Rendimiento del Agente IA
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {stats.agentAssignments}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Asignaciones IA
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {stats.agentPercentage}%
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Tasa de IA
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {stats.avgPartySize}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Tamaño promedio
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Horas punta */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">
                                    Horas de Mayor Demanda
                                </h4>
                                <div className="flex gap-2">
                                    {stats.peakHours.map((hour, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                        >
                                            {hour}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Recomendación del agente */}
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-purple-900">
                                            Recomendación del Agente IA
                                        </p>
                                        <p className="text-sm text-purple-700 mt-1">
                                            Esta mesa tiene un excelente
                                            rendimiento. Considera promocionarla
                                            para horarios no punta (15:00-17:00)
                                            para maximizar su uso.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">
                                No se pudieron cargar las estadísticas
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
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

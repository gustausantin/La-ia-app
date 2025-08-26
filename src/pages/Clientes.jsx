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
    UserPlus,
    Download,
    Target,
    Zap,
    Brain,
    Award,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Percent,
    BarChart3,
    PieChart,
    Activity,
    Sparkles,
    Heart,
    Gift,
    Coffee,
    MapPin,
    Calendar as CalendarIcon,
    Bot,
    Crown,
    Send,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Info,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

// Segmentación mejorada con IA - DEFINIDO AL PRINCIPIO DEL ARCHIVO
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
        description: "2-5 reservas",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "👥",
        aiAction: "Incentivar segunda visita",
        criteria: (customer) =>
            customer.total_reservations >= 2 && customer.total_reservations <= 5,
    },
    regular: {
        label: "Regular",
        description: "6-15 reservas",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: "⭐",
        aiAction: "Programa de fidelización",
        criteria: (customer) =>
            customer.total_reservations >= 6 && customer.total_reservations <= 15,
    },
    vip: {
        label: "VIP",
        description: "Más de 15 reservas",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "👑",
        aiAction: "Atención premium personalizada",
        criteria: (customer) => customer.total_reservations > 15,
    },
    inactive: {
        label: "Inactivo",
        description: "Sin actividad >90 días",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "💤",
        aiAction: "Campaña de reactivación",
        criteria: (customer) => {
            if (!customer.last_visit) return true;
            const daysSince = differenceInDays(new Date(), parseISO(customer.last_visit));
            return daysSince > 90;
        },
    },
    at_risk: {
        label: "En Riesgo",
        description: "30-90 días sin visitar",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: "⚠️",
        aiAction: "Oferta especial de reactivación",
        criteria: (customer) => {
            if (!customer.last_visit) return false;
            const daysSince = differenceInDays(new Date(), parseISO(customer.last_visit));
            return daysSince >= 30 && daysSince <= 90;
        },
    },
    high_value: {
        label: "Alto Valor",
        description: "Gasto promedio alto",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "💎",
        aiAction: "Experiencias exclusivas",
        criteria: (customer) => {
            const noShowRate = customer.total_reservations > 0 
                ? (customer.no_shows || 0) / customer.total_reservations 
                : 0;
            return customer.total_reservations >= 3 && noShowRate < 0.1;
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

// Loading State Component
const LoadingState = () => (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando clientes...</p>
        </div>
    </div>
);

// Empty State Component
const EmptyState = ({ onCreateCustomer }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay clientes registrados
        </h3>
        <p className="text-gray-600 mb-6">
            Comienza creando tu primer cliente o permite que el agente IA los registre automáticamente.
        </p>
        <button
            onClick={onCreateCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
            <Plus className="w-4 h-4" />
            Crear primer cliente
        </button>
    </div>
);

// Main Component
export default function Clientes() {
    const { restaurant, restaurantId, isReady } = useAuthContext();

    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({});

    const [filters, setFilters] = useState({
        search: "",
        segment: "",
        sortBy: "recent", // recent, name, value, visits
    });

    const [showCreateModal, setShowCreateModal] = useState(false);

    // Load customers
    const loadCustomers = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            // Por ahora, devolver lista vacía - sin datos mock
            const customers = [];

            setCustomers(customers);
        } catch (error) {
            toast.error("Error al cargar los clientes");
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Calculate stats
    const calculateStats = useCallback((customersData) => {
        const total = customersData.length;
        const newThisMonth = 0;
        const vipCustomers = 0;
        const atRiskCustomers = 0;
        const totalValue = 0;
        const avgCustomerValue = 0;
        const retentionRate = 0;

        const segments = {};
        Object.keys(CUSTOMER_SEGMENTS).forEach((segmentKey) => {
            segments[segmentKey] = 0;
        });

        return {
            total,
            newThisMonth,
            vipCustomers,
            atRiskCustomers,
            totalValue,
            avgCustomerValue,
            retentionRate,
            segments,
        };
    }, []);

    // Filter and sort customers
    const filteredAndSortedCustomers = useMemo(() => {
        let filtered = customers;

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(searchTerm) ||
                    customer.email?.toLowerCase().includes(searchTerm) ||
                    customer.phone?.includes(searchTerm)
            );
        }

        if (filters.segment) {
            const segmentCriteria = CUSTOMER_SEGMENTS[filters.segment]?.criteria;
            if (segmentCriteria) {
                filtered = filtered.filter(segmentCriteria);
            }
        }

        // Sort
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "value":
                    const valueA = (a.total_reservations || 0) * 87.5;
                    const valueB = (b.total_reservations || 0) * 87.5;
                    return valueB - valueA;
                case "visits":
                    return (b.total_reservations || 0) - (a.total_reservations || 0);
                case "recent":
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        return filtered;
    }, [customers, filters]);

    // Load data on mount
    useEffect(() => {
        if (isReady && restaurantId) {
            loadCustomers();
        }
    }, [isReady, restaurantId, loadCustomers]);

    // Calculate stats when customers change
    useEffect(() => {
        setStats(calculateStats(customers));
    }, [customers, calculateStats]);

    if (!isReady) {
        return <LoadingState />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Gestión de Clientes
                            <Brain className="w-6 h-6 text-purple-600" />
                        </h1>
                        <p className="text-gray-600 mt-1">
                            CRM inteligente con segmentación automática
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={loadCustomers}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Cliente
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.total || 0}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Nuevos</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.newThisMonth || 0}
                            </p>
                        </div>
                        <UserPlus className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">VIP</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.vipCustomers || 0}
                            </p>
                        </div>
                        <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">En Riesgo</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {stats.atRiskCustomers || 0}
                            </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
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

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.segment}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    segment: e.target.value,
                                }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Todos los segmentos</option>
                            {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => (
                                <option key={key} value={key}>
                                    {segment.icon} {segment.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.sortBy}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    sortBy: e.target.value,
                                }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="recent">Más recientes</option>
                            <option value="name">Por nombre</option>
                            <option value="value">Por valor</option>
                            <option value="visits">Por visitas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="space-y-4">
                {loading ? (
                    <LoadingState />
                ) : filteredAndSortedCustomers.length > 0 ? (
                    filteredAndSortedCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {customer.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {customer.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                        {customer.total_reservations || 0} reservas
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState onCreateCustomer={() => setShowCreateModal(true)} />
                )}
            </div>
        </div>
    );
}
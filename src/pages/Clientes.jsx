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
import { recomputeCustomerStats, recomputeSegment, getCRMStats } from "../services/CRMService";

// Segmentación automática con IA - REGLAS DE NEGOCIO DEFINIDAS
const CUSTOMER_SEGMENTS = {
    nuevo: {
        label: "Nuevo",
        description: "Cliente recién registrado (0 reservas confirmadas)",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "🌟",
        aiAction: "Enviar bienvenida personalizada",
        criteria: (customer) => customer.visits_count === 0,
    },
    ocasional: {
        label: "Ocasional",
        description: "1-2 reservas confirmadas",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "👥",
        aiAction: "Incentivar más visitas",
        criteria: (customer) =>
            customer.visits_count >= 1 && customer.visits_count <= 2,
    },
    regular: {
        label: "Regular",
        description: "3-4 reservas confirmadas",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: "⭐",
        aiAction: "Programa de fidelización",
        criteria: (customer) =>
            customer.visits_count >= 3 && customer.visits_count <= 4,
    },
    vip: {
        label: "VIP",
        description: "≥ 5 reservas o gasto > 500€",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "👑",
        aiAction: "Atención premium personalizada",
        criteria: (customer) => customer.visits_count >= 5 || customer.total_spent >= 500,
    },
    inactivo: {
        label: "Inactivo",
        description: "Sin reservas en los últimos 6 meses (180 días)",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "💤",
        aiAction: "Campaña de reactivación",
        criteria: (customer) => customer.days_since_last_visit > 60,
    },
    en_riesgo: {
        label: "En Riesgo",
        description: "Era frecuente, ahora 3+ meses sin actividad",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: "⚠️",
        aiAction: "Oferta especial de reactivación",
        criteria: (customer) => customer.days_since_last_visit > 30 && customer.visits_count > 2,
    },
    alto_valor: {
        label: "Alto Valor",
        description: "Gasto promedio alto",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "💎",
        aiAction: "Experiencias exclusivas",
        criteria: (customer) => {
            const noShowRate = customer.visits_count > 0 
                ? (customer.no_shows || 0) / customer.visits_count 
                : 0;
            return customer.visits_count >= 3 && noShowRate < 0.1;
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
        try {
            setLoading(true);

            // TEMPORAL: Funcionar sin restaurantId hasta que se cree automáticamente
            if (!restaurantId) {
                console.log('📋 Clientes: Sin restaurantId, mostrando estado vacío');
                setCustomers([]);
                setLoading(false);
                return;
            }

            // CORREGIDO: Cargar clientes reales desde Supabase con nuevos campos CRM
            const { data: customers, error } = await supabase
                .from("customers")
                .select(`
                    *,
                    reservations:reservations!customer_id(
                        id,
                        status,
                        party_size,
                        reservation_date,
                        spend_amount,
                        created_at
                    )
                `)
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading customers:", error);
                throw error;
            }

            // Procesar datos usando los campos CRM reales
            const processedCustomers = (customers || []).map(customer => {
                // Calcular días desde última visita
                const daysSinceLastVisit = customer.last_visit_at ? 
                    differenceInDays(new Date(), parseISO(customer.last_visit_at)) : 999;

                // Usar segment_manual si existe, sino usar segment_auto
                const finalSegment = customer.segment_manual || customer.segment_auto || 'nuevo';

                return {
                    ...customer,
                    // Usar campos CRM nativos
                    visits_count: customer.visits_count || 0,
                    total_spent: customer.total_spent || 0,
                    last_visit: customer.last_visit_at,
                    days_since_last_visit: daysSinceLastVisit,
                    ai_segment: finalSegment,
                    // Campos adicionales calculados
                    churn_risk: customer.churn_risk_score || 0,
                    predicted_ltv: customer.predicted_ltv || 0
                };
            });

            setCustomers(processedCustomers);
        } catch (error) {
            console.error("Error loading customers:", error);
            toast.error("Error al cargar los clientes");
            setCustomers([]); // Fallback a lista vacía
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Calculate stats - CÁLCULOS REALES BASADOS EN DATOS
    const calculateStats = useCallback((customersData) => {
        const total = customersData.length;
        
        // Calcular clientes nuevos este mes
        const thirtyDaysAgo = subDays(new Date(), 30);
        const newThisMonth = customersData.filter(customer => 
            new Date(customer.created_at) >= thirtyDaysAgo
        ).length;

        // Calcular por segmentos automáticamente
        const vipCustomers = customersData.filter(c => c.ai_segment === 'vip').length;
        const atRiskCustomers = customersData.filter(c => c.ai_segment === 'at_risk').length;
        
        // Calcular valores totales
        const totalValue = customersData.reduce((sum, c) => sum + (c.total_spent || 0), 0);
        const avgCustomerValue = total > 0 ? totalValue / total : 0;
        
        // Tasa de retención (clientes con más de 1 reserva)
        const returningCustomers = customersData.filter(c => c.visits_count > 1).length;
        const retentionRate = total > 0 ? (returningCustomers / total) * 100 : 0;

        // Contar por cada segmento
        const segments = {};
        Object.keys(CUSTOMER_SEGMENTS).forEach((segmentKey) => {
            segments[segmentKey] = customersData.filter(c => c.ai_segment === segmentKey).length;
        });

        return {
            total,
            newThisMonth,
            vipCustomers,
            atRiskCustomers,
            totalValue,
            avgCustomerValue: Math.round(avgCustomerValue),
            retentionRate: Math.round(retentionRate),
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

        // Sort - CRITERIOS COHERENTES CON REGLAS DE NEGOCIO
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case "name":
                    // Alfabético por nombre
                    return a.name.localeCompare(b.name);
                case "value":
                    // Por gasto acumulado total (calculado desde reservas)
                    return (b.total_spent || 0) - (a.total_spent || 0);
                case "visits":
                    // Por número total de reservas confirmadas
                    return (b.visits_count || 0) - (a.visits_count || 0);
                case "recent":
                default:
                    // Por fecha de última reserva (no de creación)
                    if (!a.last_visit && !b.last_visit) {
                        return new Date(b.created_at) - new Date(a.created_at);
                    }
                    if (!a.last_visit) return 1;
                    if (!b.last_visit) return -1;
                    return new Date(b.last_visit) - new Date(a.last_visit);
            }
        });

        return filtered;
    }, [customers, filters]);

    // Load data on mount
    useEffect(() => {
        if (isReady) {
            // TEMPORAL: Cargar aunque no haya restaurantId para evitar bucle infinito
            loadCustomers();
        }
    }, [isReady, loadCustomers]);

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
                                        {customer.visits_count || 0} reservas
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState onCreateCustomer={() => setShowCreateModal(true)} />
                )}
            </div>

            {/* Modal de crear cliente */}
            {showCreateModal && (
                <CustomerModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSave={loadCustomers}
                    restaurantId={restaurantId}
                />
            )}
        </div>
    );
}

// Modal de crear/editar cliente
const CustomerModal = ({ isOpen, onClose, onSave, restaurantId, customer = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Campos básicos editables
        first_name: customer?.name?.split(' ')[0] || "",
        last_name_1: customer?.name?.split(' ')[1] || "",
        last_name_2: customer?.name?.split(' ')[2] || "",
        email: customer?.email || "",
        phone: customer?.phone || "",
        notes: customer?.notes || "",
        // Segmento manual (se guardará en preferences.segment)
        segment: customer?.preferences?.segment || "nuevo",
        // Stats automáticos (solo para mostrar, no editar)
        visits_count: customer?.visits_count || 0,
        last_visit: customer?.last_visit || null,
        total_spent: customer?.total_spent || 0,
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = "El nombre es obligatorio";
        }

        if (!formData.last_name_1.trim()) {
            newErrors.last_name_1 = "El primer apellido es obligatorio";
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email no válido";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "El teléfono es obligatorio";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Construir nombre completo y datos según esquema real
            const fullName = `${formData.first_name} ${formData.last_name_1} ${formData.last_name_2}`.trim();
            
            const customerData = {
                name: fullName,
                email: formData.email || null,
                phone: formData.phone,
                notes: formData.notes || null,
                restaurant_id: restaurantId,
                // Guardar segmento en preferences (JSONB)
                preferences: {
                    segment: formData.segment,
                    created_manually: true
                },
                // Stats se mantienen automáticos si es edición
                ...(customer && {
                    visits_count: customer.visits_count,
                    total_spent: customer.total_spent,
                    last_visit: customer.last_visit
                })
            };

            if (customer) {
                // Actualizar
                const { error } = await supabase
                    .from("customers")
                    .update(customerData)
                    .eq("id", customer.id);

                if (error) throw error;
            } else {
                // Crear
                const { error } = await supabase
                    .from("customers")
                    .insert([customerData]);

                if (error) throw error;
            }

            onSave();
            onClose();
            toast.success(customer ? "Cliente actualizado correctamente" : "Cliente creado correctamente");
        } catch (error) {
            console.error("Error saving customer:", error);
            toast.error(`Error al guardar el cliente: ${error.message || error.hint || 'Error desconocido'}`);
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
                        {customer ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre y Apellidos separados */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.first_name ? "border-red-300" : "border-gray-300"
                                }`}
                                placeholder="Juan"
                            />
                            {errors.first_name && (
                                <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                1º Apellido *
                            </label>
                            <input
                                type="text"
                                value={formData.last_name_1}
                                onChange={(e) => setFormData({ ...formData, last_name_1: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.last_name_1 ? "border-red-300" : "border-gray-300"
                                }`}
                                placeholder="García"
                            />
                            {errors.last_name_1 && (
                                <p className="text-xs text-red-600 mt-1">{errors.last_name_1}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                2º Apellido
                            </label>
                            <input
                                type="text"
                                value={formData.last_name_2}
                                onChange={(e) => setFormData({ ...formData, last_name_2: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="López"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.email ? "border-red-300" : "border-gray-300"
                            }`}
                            placeholder="juan@ejemplo.com"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.phone ? "border-red-300" : "border-gray-300"
                            }`}
                            placeholder="123 456 789"
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Preferencias, alergias, etc..."
                        />
                    </div>

                    {/* Sección de segmento manual */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Segmentación</h4>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Segmento del Cliente
                            </label>
                            <select
                                value={formData.segment}
                                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => (
                                    <option key={key} value={key}>
                                        {segment.icon} {segment.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Puedes cambiarlo manualmente. Se actualizará automáticamente según las reservas.
                            </p>
                        </div>
                    </div>

                    {/* Stats automáticos (solo mostrar si es edición) */}
                    {customer && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Estadísticas (Automáticas)</h4>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600">Nº de Visitas</p>
                                    <p className="text-lg font-semibold text-gray-900">{formData.visits_count}</p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600">Última Visita</p>
                                    <p className="text-sm text-gray-900">
                                        {formData.last_visit 
                                            ? new Date(formData.last_visit).toLocaleDateString('es-ES')
                                            : 'Sin visitas'
                                        }
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600">Valor Acumulado</p>
                                    <p className="text-lg font-semibold text-gray-900">€{formData.total_spent?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Estos valores se actualizan automáticamente según las reservas del cliente.
                            </p>
                        </div>
                    )}

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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Guardando..." : customer ? "Actualizar" : "Crear"} Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// Clientes.jsx - CRM con funcionalidad básica
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import {
    Search, Plus, Users, Mail, Phone, Edit2, X, 
    AlertTriangle, RefreshCw, Settings, Crown,
    Clock, DollarSign, TrendingUp, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import CustomerModal from "../components/CustomerModal";

// SEGMENTACIÓN INTELIGENTE - TODOS LOS SEGMENTOS REALES
const CUSTOMER_SEGMENTS = {
    nuevo: { 
        label: "Nuevo", 
        icon: "👋", 
        color: "blue",
        description: "Cliente recién registrado",
        priority: 1
    },
    regular: { 
        label: "Regular", 
        icon: "⭐", 
        color: "green",
        description: "Cliente con visitas regulares",
        priority: 2
    },
    vip: { 
        label: "VIP", 
        icon: "👑", 
        color: "purple",
        description: "Very Important Person - Cliente prioritario",
        priority: 5
    },
    ocasional: { 
        label: "Ocasional", 
        icon: "🕐", 
        color: "yellow",
        description: "Cliente con visitas esporádicas",
        priority: 3
    },
    inactivo: { 
        label: "Inactivo", 
        icon: "😴", 
        color: "gray",
        description: "Sin visitas recientes",
        priority: 4
    },
    en_riesgo: { 
        label: "En Riesgo", 
        icon: "⚠️", 
        color: "orange",
        description: "Cliente que puede perderse",
        priority: 6
    },
    alto_valor: { 
        label: "Alto Valor", 
        icon: "💎", 
        color: "indigo",
        description: "Cliente de alto valor económico",
        priority: 7
    }
};

// FUNCIÓN PARA CALCULAR SEGMENTO EN TIEMPO REAL
const calculateRealTimeSegment = (customer) => {
    if (!customer) return 'nuevo';
    
    const visitsCount = customer.visits_count || 0;
    const totalSpent = customer.total_spent || 0;
    const daysSinceLastVisit = customer.last_visit_at 
        ? Math.floor((new Date() - new Date(customer.last_visit_at)) / (1000 * 60 * 60 * 24))
        : 999;
    
    // 1. Nuevo: 0-1 visitas
    if (visitsCount <= 1) return 'nuevo';
    
    // 2. VIP: 10+ visitas O gasto alto
    if (visitsCount >= 10 || totalSpent >= 500) return 'vip';
    
    // 3. Alto valor: Gasto elevado pero pocas visitas
    if (totalSpent >= 300 && visitsCount < 10) return 'alto_valor';
    
    // 4. Regular: 2-9 visitas y activo
    if (visitsCount >= 2 && visitsCount < 10 && daysSinceLastVisit <= 60) return 'regular';
    
    // 5. Ocasional: Pocas visitas, irregular
    if (visitsCount >= 2 && visitsCount < 5) return 'ocasional';
    
    // 6. Inactivo: No viene hace 90+ días
    if (daysSinceLastVisit >= 90) return 'inactivo';
    
    // 7. En riesgo: Entre 60-90 días sin venir
    if (daysSinceLastVisit >= 60 && daysSinceLastVisit < 90) return 'en_riesgo';
    
    return 'nuevo';
};

// Componente principal
export default function Clientes() {
    const navigate = useNavigate();
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'
    const [filters, setFilters] = useState({ 
        search: "", 
        segment: "", 
        vip: "", 
        visitCount: "",
        spentRange: ""
    });

    // Cargar clientes
    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            
            if (!restaurantId) {
                console.log('📋 Clientes: Sin restaurantId');
                setCustomers([]);
                setLoading(false);
                return;
            }

            const { data: customers, error } = await supabase
                .from("customers")
                .select(`
                    id, restaurant_id, name, email, phone, first_name, last_name1, last_name2, birthday,
                    segment_auto, segment_manual, visits_count, last_visit_at, total_spent, avg_ticket,
                    churn_risk_score, predicted_ltv, consent_email, consent_sms, consent_whatsapp,
                    preferences, tags, notes, created_at, updated_at
                `)
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Procesar clientes con segmentación automática EN TIEMPO REAL
            const processedCustomers = customers?.map(customer => {
                const daysSinceLastVisit = customer.last_visit_at 
                    ? Math.floor((new Date() - new Date(customer.last_visit_at)) / (1000 * 60 * 60 * 24))
                    : null;
                
                return {
                    ...customer,
                    // ✅ Calcular segmento en tiempo real basado en visits_count
                    segment: customer.segment_manual || calculateRealTimeSegment(customer),
                    daysSinceLastVisit
                };
            }) || [];

            console.log("✅ Clientes procesados:", processedCustomers.length);
            setCustomers(processedCustomers);

        } catch (error) {
            console.error("❌ Error cargando clientes:", error);
            toast.error("Error al cargar los clientes");
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Editar cliente
    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setModalMode('edit');
        setShowCustomerModal(true);
    };

    // Crear nuevo cliente
    const handleCreateCustomer = () => {
        setSelectedCustomer(null);
        setModalMode('create');
        setShowCustomerModal(true);
    };

    // Ver cliente
    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setModalMode('view');
        setShowCustomerModal(true);
    };

    // Filtrar clientes con filtros avanzados
    const filteredCustomers = customers.filter(customer => {
        // Filtro por búsqueda de texto
        if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
            const matchesSearch = (
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.phone?.includes(searchTerm)
        );
            if (!matchesSearch) return false;
        }

        // Filtro por segmento (usa el ya calculado)
        if (filters.segment) {
            if (customer.segment !== filters.segment) return false;
        }

        // Filtro por VIP
        if (filters.vip) {
            // 🔒 REGLA ORO #2: Usar criterio VIP REAL del sistema CRM
            // VIP = ≥5 visitas en 90 días O gasto total ≥€500
            const recentVisits = customer.visits_count || 0;
            const totalSpent = customer.total_spent || 0;
            const isVip = recentVisits >= 5 || totalSpent >= 500;
            if (filters.vip === 'vip' && !isVip) return false;
            if (filters.vip === 'regular' && isVip) return false;
        }

        // Filtro por número de visitas
        if (filters.visitCount) {
            const visits = customer.visits_count || 0;
            if (filters.visitCount === 'new' && visits > 1) return false;
            if (filters.visitCount === 'frequent' && visits < 3) return false; // 🔒 REGLA ORO #2: Criterio más realista
            if (filters.visitCount === 'loyal' && visits < 10) return false;
        }

        // Filtro por rango de gasto
        if (filters.spentRange) {
            const spent = customer.total_spent || 0;
            if (filters.spentRange === 'low' && spent >= 100) return false;
            if (filters.spentRange === 'medium' && (spent < 100 || spent >= 500)) return false;
            if (filters.spentRange === 'high' && spent < 500) return false;
        }

        return true;
    });

    // Effects
    useEffect(() => {
        if (isReady && restaurantId) {
            loadCustomers();
        }
    }, [isReady, restaurantId, loadCustomers]);

    // Pantallas de carga y error
    if (!isReady) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Cargando información del restaurante...
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    if (!restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Configuración Pendiente
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Para gestionar clientes necesitas completar la configuración de tu restaurante.
                        </p>
                        <button
                            onClick={() => navigate('/configuracion')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Settings className="w-4 h-4" />
                            Ir a Configuración
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header con gradiente corporativo */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">Gestión de Clientes</h1>
                                <p className="text-purple-100">Sistema CRM inteligente · {filteredCustomers.length} clientes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadCustomers}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Actualizar
                            </button>
                            <button
                                onClick={handleCreateCustomer}
                                className="flex items-center gap-2 px-5 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                Nuevo Cliente
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard de Clientes - Métricas por Segmento */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Estado de la Base de Clientes</h2>
                    </div>

                    {/* Desglose por segmentos con porcentajes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => {
                            const count = customers.filter(c => c.segment === key).length;
                            const percentage = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
                            
                            const colorClasses = {
                                blue: 'from-blue-400 to-blue-600 border-blue-300 bg-blue-50',
                                green: 'from-green-400 to-green-600 border-green-300 bg-green-50',
                                purple: 'from-purple-400 to-purple-600 border-purple-300 bg-purple-50',
                                yellow: 'from-yellow-400 to-yellow-600 border-yellow-300 bg-yellow-50',
                                gray: 'from-gray-400 to-gray-600 border-gray-300 bg-gray-50',
                                orange: 'from-orange-400 to-orange-600 border-orange-300 bg-orange-50',
                                indigo: 'from-indigo-400 to-indigo-600 border-indigo-300 bg-indigo-50'
                            };
                            
                            return (
                                <div 
                                    key={key} 
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                                        filters.segment === key 
                                            ? `${colorClasses[segment.color]} border-2` 
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                    onClick={() => setFilters({...filters, segment: filters.segment === key ? '' : key})}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">{segment.icon}</div>
                                        <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                                        <div className="text-xs font-semibold text-gray-700 mb-2">
                                            {segment.label}
                                        </div>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${colorClasses[segment.color]} text-white`}>
                                            {percentage}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Indicador de salud general - COMPACTO */}
                    <div className="mt-6 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                            {/* Estado de salud */}
                            <div className="flex-shrink-0">
                                <div className="text-sm text-gray-600">Salud de la Base de Clientes</div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {(() => {
                                        const regularCount = customers.filter(c => c.segment === 'regular').length;
                                        const activePercentage = customers.length > 0 ? (regularCount / customers.length) * 100 : 0;
                                        
                                        if (activePercentage >= 60) return "🟢 Excelente";
                                        if (activePercentage >= 40) return "🟡 Buena";
                                        if (activePercentage >= 20) return "🟠 Regular";
                                        return "🔴 Necesita atención";
                                    })()}
                                </div>
                            </div>
                            
                            {/* Análisis compacto */}
                            <div className="flex-1 text-sm text-gray-700">
                                {(() => {
                                    const regularCount = customers.filter(c => c.segment === 'regular').length;
                                    const riskCount = customers.filter(c => c.segment === 'en_riesgo').length;
                                    const inactiveCount = customers.filter(c => c.segment === 'inactivo').length;
                                    const newCount = customers.filter(c => c.segment === 'nuevo').length;
                                    const activePercentage = customers.length > 0 ? (regularCount / customers.length) * 100 : 0;
                                    const riskPercentage = customers.length > 0 ? (riskCount / customers.length) * 100 : 0;
                                    const inactivePercentage = customers.length > 0 ? (inactiveCount / customers.length) * 100 : 0;
                                    
                                    const issues = [];
                                    const recommendations = [];
                                    
                                    // Reglas de análisis
                                    if (activePercentage < 20) {
                                        issues.push(`Muy pocos clientes activos (${activePercentage.toFixed(0)}%)`);
                                        recommendations.push("Implementar estrategias de reactivación");
                                    }
                                    
                                    if (riskPercentage > 30) {
                                        issues.push(`Muchos clientes en riesgo (${riskPercentage.toFixed(0)}%)`);
                                        recommendations.push("Contactar clientes en riesgo urgentemente");
                                    }
                                    
                                    if (inactivePercentage > 40) {
                                        issues.push(`Demasiados clientes inactivos (${inactivePercentage.toFixed(0)}%)`);
                                        recommendations.push("Crear campañas de recuperación");
                                    }
                                    
                                    if (newCount > regularCount && customers.length > 5) {
                                        issues.push("Los clientes nuevos no se están fidelizando");
                                        recommendations.push("Mejorar experiencia de primeras visitas");
                                    }
                                    
                                    if (customers.length < 10) {
                                        issues.push("Base de clientes muy pequeña");
                                        recommendations.push("Enfocar en captación de nuevos clientes");
                                    }
                                    
                                    // Mostrar resultado COMPACTO
                                    if (issues.length === 0) {
                                        return (
                                            <div className="text-green-700">
                                                <span className="font-medium">✅ Excelente estado</span> - {activePercentage.toFixed(0)}% clientes activos
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                            <div>
                                                <div className="font-medium text-orange-700 mb-2">⚠️ Problemas detectados:</div>
                                                <div className="space-y-1">
                                                    {issues.slice(0, 3).map((issue, index) => (
                                                        <div key={index} className="text-xs text-gray-700">• {issue}</div>
                                                    ))}
                                                    {issues.length > 3 && (
                                                        <div className="text-xs text-gray-500 italic">
                                                            y {issues.length - 3} problema{issues.length - 3 > 1 ? 's' : ''} adicional{issues.length - 3 > 1 ? 'es' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-blue-700 mb-2">💡 Recomendaciones:</div>
                                                <div className="space-y-1">
                                                    {recommendations.slice(0, 3).map((rec, index) => (
                                                        <div key={index} className="text-xs text-gray-700">• {rec}</div>
                                                    ))}
                                                    {recommendations.length > 3 && (
                                                        <div className="text-xs text-gray-500 italic">
                                                            y {recommendations.length - 3} acción{recommendations.length - 3 > 1 ? 'es' : ''} adicional{recommendations.length - 3 > 1 ? 'es' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros Avanzados */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="space-y-5">
                        {/* Búsqueda por texto */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={22} />
                        <input
                            type="text"
                            placeholder="🔍 Buscar por nombre, email o teléfono..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-lg font-medium bg-white shadow-sm"
                        />
                        </div>

                        {/* Filtros adicionales */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Filtro por VIP */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-purple-500" />
                                    Tipo de Cliente
                                </label>
                                <select
                                    value={filters.vip}
                                    onChange={(e) => setFilters({ ...filters, vip: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 font-medium bg-white"
                                >
                                    <option value="">Todos</option>
                                    <option value="vip">👑 VIP (€500+)</option>
                                    <option value="regular">Regular</option>
                                </select>
                            </div>

                            {/* Filtro por frecuencia de visitas */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    Frecuencia
                                </label>
                                <select
                                    value={filters.visitCount}
                                    onChange={(e) => setFilters({ ...filters, visitCount: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium bg-white"
                                >
                                    <option value="">Todas</option>
                                    <option value="new">👋 Nuevos (1 visita)</option>
                                    <option value="frequent">🔄 Frecuentes (5+)</option>
                                    <option value="loyal">⭐ Fieles (10+)</option>
                                </select>
                            </div>

                            {/* Filtro por rango de gasto */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    Gasto Total
                                </label>
                                <select
                                    value={filters.spentRange}
                                    onChange={(e) => setFilters({ ...filters, spentRange: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 font-medium bg-white"
                                >
                                    <option value="">Todos</option>
                                    <option value="low">💚 Bajo (&lt;€100)</option>
                                    <option value="medium">💛 Medio (€100-€500)</option>
                                    <option value="high">💜 Alto (€500+)</option>
                                </select>
                            </div>

                            {/* Botón limpiar filtros */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ search: "", segment: "", vip: "", visitCount: "", spentRange: "" })}
                                    className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-4 h-4 mx-auto" />
                                </button>
                            </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                                Mostrando {filteredCustomers.length} de {customers.length} clientes
                                {(filters.search || filters.segment || filters.vip || filters.visitCount || filters.spentRange) && 
                                    " (filtrados)"
                                }
                            </span>
                            {filters.segment && (
                                <span className="text-blue-600 font-medium">
                                    Filtro activo: {CUSTOMER_SEGMENTS[filters.segment]?.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de clientes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="p-8 text-center">
                            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                            <p className="text-gray-600">Cargando clientes...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                            <h3 className="text-sm font-medium text-gray-900 mb-2">
                                {customers.length === 0 ? "No hay clientes registrados" : "No se encontraron clientes"}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {customers.length === 0 
                                    ? "Comienza creando tu primer cliente"
                                    : "Prueba con un término de búsqueda diferente"
                                }
                            </p>
                            {customers.length === 0 && (
                                <button
                                    onClick={handleCreateCustomer}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear primer cliente
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCustomers.map((customer) => {
                                const segmentColor = CUSTOMER_SEGMENTS[customer.segment]?.color || 'gray';
                                const colorGradients = {
                                    blue: 'from-blue-500 to-blue-600',
                                    green: 'from-green-500 to-green-600',
                                    purple: 'from-purple-500 to-purple-600',
                                    yellow: 'from-yellow-500 to-yellow-600',
                                    gray: 'from-gray-500 to-gray-600',
                                    orange: 'from-orange-500 to-orange-600',
                                    indigo: 'from-indigo-500 to-indigo-600'
                                };
                                
                                return (
                                <div
                                    key={customer.id}
                                    className="p-5 bg-white rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg cursor-pointer transition-all duration-300"
                                    onClick={() => handleViewCustomer(customer)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar con inicial - MÁS GRANDE */}
                                                <div className={`w-14 h-14 bg-gradient-to-br ${colorGradients[segmentColor]} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-bold text-gray-900 truncate">
                                                            {customer.name}
                                                        </h3>
                                                        {/* Etiqueta de segmento - CALCULADA EN TIEMPO REAL */}
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${colorGradients[segmentColor]} text-white shadow-md`}>
                                                            {CUSTOMER_SEGMENTS[customer.segment]?.icon} {CUSTOMER_SEGMENTS[customer.segment]?.label || 'Cliente'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {customer.email && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {customer.email}
                                                            </p>
                                                        )}
                                                        {customer.phone && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {customer.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* Visitas */}
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                <Clock className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-900">{customer.visits_count || 0}</p>
                                                    <p className="text-xs text-blue-700 font-medium">Visitas</p>
                                                </div>
                                            </div>
                                            
                                            {/* Total gastado */}
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                <DollarSign className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-green-900">€{(customer.total_spent || 0).toFixed(0)}</p>
                                                    <p className="text-xs text-green-700 font-medium">Gastado</p>
                                                </div>
                                            </div>
                                            
                                            {/* Días desde última visita */}
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-purple-900">
                                                        {customer.daysSinceLastVisit !== null ? `${customer.daysSinceLastVisit}d` : 'Nuevo'}
                                                    </p>
                                                    <p className="text-xs text-purple-700 font-medium">Última</p>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCustomer(customer);
                                                }}
                                                className="p-3 text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-600 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-purple-500"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Unificado de Cliente */}
                <CustomerModal
                customer={selectedCustomer}
                isOpen={showCustomerModal}
                restaurantId={restaurantId}
                mode={modalMode}
                    onClose={() => {
                    setShowCustomerModal(false);
                    setSelectedCustomer(null);
                    setModalMode('view');
                }}
                onDelete={(customerId) => {
                    // Eliminar cliente de la lista
                    setCustomers(prev => prev.filter(c => c.id !== customerId));
                }}
                onSave={(updatedCustomer) => {
                    try {
                        // Actualizar cliente en la lista
                        setCustomers(prev => {
                            if (modalMode === 'create') {
                                return [...prev, updatedCustomer];
                            } else {
                                return prev.map(c => 
                                    c.id === updatedCustomer.id ? updatedCustomer : c
                                );
                            }
                        });
                        // NO recargar datos - ya tenemos los datos actualizados
                        console.log('Cliente actualizado en la lista local');
                    } catch (error) {
                        console.error('Error actualizando lista de clientes:', error);
                        // Si hay error, intentar recargar datos
                        setTimeout(() => {
                            loadCustomers();
                        }, 1000);
                    }
                }}
            />
        </div>
    );
};


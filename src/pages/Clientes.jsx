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

// FUNCIÓN PARA DETERMINAR SEGMENTO DEL CLIENTE - **ELIMINADA**
// La lógica ahora reside 100% en la base de datos a través de `segment_auto`

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
                    id, restaurant_id, name, email, phone, first_name, last_name1, last_name2,
                    segment_auto, segment_manual, visits_count, last_visit_at, total_spent, avg_ticket,
                    churn_risk_score, predicted_ltv, consent_email, consent_sms, consent_whatsapp,
                    preferences, tags, notes, created_at, updated_at
                `)
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Procesar clientes con segmentación automática
            const processedCustomers = customers?.map(customer => ({
                ...customer,
                // Usar directamente el segmento calculado por la BD
                segment: customer.segment_manual || customer.segment_auto || 'nuevo',
                daysSinceLastVisit: customer.last_visit_at 
                    ? Math.floor((new Date() - new Date(customer.last_visit_at)) / (1000 * 60 * 60 * 24))
                    : null
            })) || [];

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

        // Filtro por segmento
        if (filters.segment) {
            const customerSegment = customer.segment_manual || customer.segment_auto || 'nuevo';
            if (customerSegment !== filters.segment) return false;
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
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Gestión de Clientes</h1>
                        <p className="text-gray-600">Sistema CRM para tu restaurante</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadCustomers}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                        <button
                            onClick={handleCreateCustomer}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Cliente
                        </button>
                    </div>
                </div>

                {/* Dashboard de Clientes - Métricas por Segmento */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-2">Estado de la Base de Clientes</h2>

                    {/* Desglose por segmentos con porcentajes */}
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                        {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => {
                            const count = customers.filter(c => (c.segment_manual || c.segment_auto) === key).length;
                            const percentage = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
                            
                            return (
                                <div 
                                    key={key} 
                                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                        filters.segment === key 
                                            ? `border-${segment.color}-500 bg-${segment.color}-50` 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setFilters({...filters, segment: filters.segment === key ? '' : key})}
                                >
                                    <div className="text-center">
                                        <div className="text-base mb-1">{segment.icon}</div>
                                        <div className="text-sm font-bold text-gray-900">{count}</div>
                                        <div className={`text-xs font-medium text-${segment.color}-700`}>
                                            {segment.label}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {percentage}% del total
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
                                        const activeCount = customers.filter(c => (c.segment_manual || c.segment_auto) === 'activo').length;
                                        const activePercentage = customers.length > 0 ? (activeCount / customers.length) * 100 : 0;
                                        
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
                                    const activeCount = customers.filter(c => (c.segment_manual || c.segment_auto) === 'activo').length;
                                    const riskCount = customers.filter(c => (c.segment_manual || c.segment_auto) === 'riesgo').length;
                                    const inactiveCount = customers.filter(c => (c.segment_manual || c.segment_auto) === 'inactivo').length;
                                    const newCount = customers.filter(c => (c.segment_manual || c.segment_auto) === 'nuevo').length;
                                    const activePercentage = customers.length > 0 ? (activeCount / customers.length) * 100 : 0;
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
                                    
                                    if (newCount > activeCount && customers.length > 5) {
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                    <div className="space-y-4">
                        {/* Búsqueda por texto */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        </div>

                        {/* Filtros adicionales */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            {/* Filtro por VIP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                                <select
                                    value={filters.vip}
                                    onChange={(e) => setFilters({ ...filters, vip: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="vip">👑 VIP (€500+)</option>
                                    <option value="regular">Regular</option>
                                </select>
                            </div>

                            {/* Filtro por frecuencia de visitas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                                <select
                                    value={filters.visitCount}
                                    onChange={(e) => setFilters({ ...filters, visitCount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todas</option>
                                    <option value="new">👋 Nuevos (1 visita)</option>
                                    <option value="frequent">🔄 Frecuentes (5+)</option>
                                    <option value="loyal">⭐ Fieles (10+)</option>
                                </select>
                            </div>

                            {/* Filtro por rango de gasto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gasto Total</label>
                                <select
                                    value={filters.spentRange}
                                    onChange={(e) => setFilters({ ...filters, spentRange: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        <div className="divide-y divide-gray-200">
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => handleViewCustomer(customer)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {/* Avatar con inicial */}
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                
                                                {/* Icono de segmento - NUEVA FUNCIONALIDAD */}
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                                    {CUSTOMER_SEGMENTS[customer.segment_manual || customer.segment_auto]?.icon || "👤"}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                                            {customer.name}
                                                        </h3>
                                                        {/* Etiqueta de segmento - NUEVA FUNCIONALIDAD */}
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${CUSTOMER_SEGMENTS[customer.segment_manual || customer.segment_auto]?.color || 'gray'}-100 text-${CUSTOMER_SEGMENTS[customer.segment_manual || customer.segment_auto]?.color || 'gray'}-800`}>
                                                            {CUSTOMER_SEGMENTS[customer.segment_manual || customer.segment_auto]?.label || 'Cliente'}
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
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            {/* Visitas */}
                                            <div className="text-center">
                                                <p className="font-medium text-gray-900">{customer.visits_count || 0}</p>
                                                <p className="text-xs">Visitas</p>
                                            </div>
                                            
                                            {/* Total gastado */}
                                            <div className="text-center">
                                                <p className="font-medium text-gray-900">€{(customer.total_spent || 0).toFixed(2)}</p>
                                                <p className="text-xs">Gastado</p>
                                            </div>
                                            
                                            {/* Días desde última visita - NUEVA FUNCIONALIDAD */}
                                            <div className="text-center">
                                                <p className="font-medium text-gray-900">
                                                    {customer.daysSinceLastVisit !== null ? `${customer.daysSinceLastVisit}d` : 'Nueva'}
                                                </p>
                                                <p className="text-xs">Última</p>
                                            </div>
                                            
                                            {/* Fecha última visita */}
                                            {customer.last_visit_at && (
                                                <div className="text-center">
                                                    <p className="font-medium text-gray-900">
                                                        {format(parseISO(customer.last_visit_at), 'dd/MM')}
                                                    </p>
                                                    <p className="text-xs">Fecha</p>
                                                </div>
                                            )}
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCustomer(customer);
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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


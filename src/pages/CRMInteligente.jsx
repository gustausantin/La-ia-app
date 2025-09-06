// CRMInteligente.jsx - CRM CORAZÓN DE LA APLICACIÓN
import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, differenceInDays, subDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Users, Settings, Brain, Crown, Clock, Mail, Phone, MessageSquare,
    TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Plus, Send,
    Filter, Search, Eye, Edit2, Trash2, Calendar, DollarSign,
    Target, Zap, Award, Heart, Coffee, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

// SEGMENTACIÓN INTELIGENTE - CORAZÓN DEL CRM
const CUSTOMER_SEGMENTS = {
    nuevo: { 
        label: "Nuevo", 
        icon: "👋", 
        color: "blue",
        description: "Cliente recién registrado (< 7 días)",
        priority: 1
    },
    activo: { 
        label: "Activo", 
        icon: "⭐", 
        color: "green",
        description: "Cliente con visitas regulares (< 30 días)",
        priority: 2
    },
    vip: { 
        label: "VIP", 
        icon: "👑", 
        color: "purple",
        description: "Cliente frecuente y alto valor",
        priority: 5
    },
    inactivo: { 
        label: "Inactivo", 
        icon: "😴", 
        color: "gray",
        description: "Sin visitas por más de 60 días",
        priority: 3
    },
    riesgo: { 
        label: "En Riesgo", 
        icon: "⚠️", 
        color: "orange",
        description: "Cliente que puede perderse",
        priority: 4
    }
};

// PLANTILLAS INTELIGENTES
const SMART_TEMPLATES = {
    reactivacion: {
        title: "Reactivación de Inactivos",
        subject: "Te echamos de menos en {restaurant_name}",
        content: `Hola {customer_name},

¡Hace tiempo que no te vemos por {restaurant_name}! 

Tenemos nuevos platos que creemos te van a encantar, y hemos mejorado nuestra experiencia especialmente para clientes como tú.

¿Qué te parece si reservas una mesa para esta semana? Te garantizamos una experiencia excepcional.

¡Esperamos verte pronto!

El equipo de {restaurant_name}`,
        variables: ["restaurant_name", "customer_name", "last_visit_date"]
    },
    bienvenida: {
        title: "Bienvenida Nuevos Clientes",
        subject: "¡Bienvenido a {restaurant_name}!",
        content: `¡Hola {customer_name}!

Gracias por visitarnos por primera vez. Esperamos que hayas disfrutado de tu experiencia en {restaurant_name}.

Como nuevo cliente, queremos asegurarnos de que tengas la mejor experiencia posible. Si tienes alguna sugerencia o comentario, no dudes en contactarnos.

¡Esperamos verte pronto de nuevo!

Un saludo,
El equipo de {restaurant_name}`,
        variables: ["restaurant_name", "customer_name", "visit_date"]
    },
    vip: {
        title: "Promoción a VIP",
        subject: "¡Felicidades! Ahora eres cliente VIP de {restaurant_name}",
        content: `¡Hola {customer_name}!

Nos complace informarte que ahora formas parte de nuestro programa VIP en {restaurant_name}.

Como cliente VIP, disfrutarás de:
• Reservas prioritarias
• Descuentos especiales
• Invitaciones a eventos exclusivos
• Atención personalizada

¡Gracias por tu fidelidad!

El equipo de {restaurant_name}`,
        variables: ["restaurant_name", "customer_name", "vip_benefits"]
    }
};

export default function CRMInteligente() {
    const { restaurant, restaurantId } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("clientes");
    
    // Estados principales
    const [customers, setCustomers] = useState([]);
    const [segments, setSegments] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [crmConfig, setCrmConfig] = useState({});
    
    // Estados de filtros y búsqueda
    const [filters, setFilters] = useState({
        search: "",
        segment: "all",
        status: "all"
    });

    // CARGAR DATOS PRINCIPALES
    const loadCRMData = useCallback(async () => {
        if (!restaurantId) return;
        
        try {
            setLoading(true);
            
            // Cargar clientes con segmentación automática
            const { data: customersData, error: customersError } = await supabase
                .from("customers")
                .select(`
                    id, restaurant_id, name, email, phone, first_name, last_name1,
                    segment_auto, visits_count, last_visit_at, total_spent, avg_ticket,
                    churn_risk_score, predicted_ltv, consent_email, consent_sms, consent_whatsapp,
                    preferences, tags, notes, created_at, updated_at
                `)
                .eq("restaurant_id", restaurantId)
                .order("last_visit_at", { ascending: false });

            if (customersError) throw customersError;
            
            // Procesar y segmentar clientes automáticamente
            const processedCustomers = customersData?.map(customer => ({
                ...customer,
                segment: determineCustomerSegment(customer),
                daysSinceLastVisit: customer.last_visit_at 
                    ? differenceInDays(new Date(), parseISO(customer.last_visit_at))
                    : null
            })) || [];

            setCustomers(processedCustomers);
            
            // Calcular estadísticas por segmento
            const segmentStats = calculateSegmentStats(processedCustomers);
            setSegments(segmentStats);
            
            // Generar sugerencias IA
            const aiSuggestions = generateAISuggestions(processedCustomers);
            setSuggestions(aiSuggestions);
            
            // Cargar configuración CRM
            const { data: restaurantData } = await supabase
                .from("restaurants")
                .select("settings")
                .eq("id", restaurantId)
                .single();
                
            setCrmConfig(restaurantData?.settings?.crm || {});
            
        } catch (error) {
            console.error("Error cargando datos CRM:", error);
            toast.error("Error al cargar los datos del CRM");
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // DETERMINAR SEGMENTO DE CLIENTE AUTOMÁTICAMENTE
    const determineCustomerSegment = (customer) => {
        const now = new Date();
        const createdAt = parseISO(customer.created_at);
        const lastVisit = customer.last_visit_at ? parseISO(customer.last_visit_at) : null;
        
        const daysSinceCreated = differenceInDays(now, createdAt);
        const daysSinceLastVisit = lastVisit ? differenceInDays(now, lastVisit) : 999;
        
        // Lógica de segmentación inteligente
        if (daysSinceCreated <= 7) {
            return 'nuevo';
        } else if (customer.visits_count >= 10 && customer.total_spent >= 500) {
            return 'vip';
        } else if (daysSinceLastVisit > 60) {
            return 'inactivo';
        } else if (daysSinceLastVisit > 30 && customer.churn_risk_score > 70) {
            return 'riesgo';
        } else if (daysSinceLastVisit <= 30) {
            return 'activo';
        } else {
            return 'inactivo';
        }
    };

    // CALCULAR ESTADÍSTICAS POR SEGMENTO
    const calculateSegmentStats = (customers) => {
        const stats = {};
        
        Object.keys(CUSTOMER_SEGMENTS).forEach(segment => {
            const segmentCustomers = customers.filter(c => c.segment === segment);
            stats[segment] = {
                count: segmentCustomers.length,
                totalValue: segmentCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
                avgTicket: segmentCustomers.length > 0 
                    ? segmentCustomers.reduce((sum, c) => sum + (c.avg_ticket || 0), 0) / segmentCustomers.length 
                    : 0
            };
        });
        
        return stats;
    };

    // GENERAR SUGERENCIAS IA
    const generateAISuggestions = (customers) => {
        const suggestions = [];
        
        // Sugerencias para clientes inactivos
        const inactiveCustomers = customers.filter(c => c.segment === 'inactivo');
        if (inactiveCustomers.length > 0) {
            suggestions.push({
                id: 'reactivate_inactive',
                type: 'reactivacion',
                priority: 'high',
                title: `Reactivar ${inactiveCustomers.length} clientes inactivos`,
                description: `${inactiveCustomers.length} clientes llevan más de 60 días sin visitar`,
                customers: inactiveCustomers.slice(0, 5), // Mostrar solo los primeros 5
                template: 'reactivacion',
                estimatedImpact: inactiveCustomers.length * 45 // Estimación de ingresos
            });
        }
        
        // Sugerencias para clientes nuevos
        const newCustomers = customers.filter(c => c.segment === 'nuevo');
        if (newCustomers.length > 0) {
            suggestions.push({
                id: 'welcome_new',
                type: 'bienvenida',
                priority: 'medium',
                title: `Dar bienvenida a ${newCustomers.length} clientes nuevos`,
                description: `${newCustomers.length} clientes nuevos necesitan mensaje de bienvenida`,
                customers: newCustomers,
                template: 'bienvenida',
                estimatedImpact: newCustomers.length * 25
            });
        }
        
        // Sugerencias para promoción a VIP
        const potentialVIPs = customers.filter(c => 
            c.segment === 'activo' && 
            c.visits_count >= 8 && 
            c.total_spent >= 300
        );
        if (potentialVIPs.length > 0) {
            suggestions.push({
                id: 'promote_vip',
                type: 'vip',
                priority: 'high',
                title: `Promover ${potentialVIPs.length} clientes a VIP`,
                description: `${potentialVIPs.length} clientes califican para ser VIP`,
                customers: potentialVIPs,
                template: 'vip',
                estimatedImpact: potentialVIPs.length * 75
            });
        }
        
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    };

    // Cargar datos al montar
    useEffect(() => {
        loadCRMData();
    }, [loadCRMData]);

    // FILTRAR CLIENTES
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = !filters.search || 
            customer.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            customer.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
            customer.phone?.includes(filters.search);
            
        const matchesSegment = filters.segment === 'all' || customer.segment === filters.segment;
        
        return matchesSearch && matchesSegment;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando CRM Inteligente...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Principal */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Brain className="w-8 h-8 text-purple-600 mr-3" />
                                CRM Inteligente
                            </h1>
                            <p className="text-gray-600 mt-1">
                                El corazón de tu restaurante - Gestión automática de clientes con IA
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveTab("configuracion")}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Configuración
                        </button>
                    </div>
                </div>

                {/* Métricas Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => {
                        const stats = segments[key] || { count: 0, totalValue: 0 };
                        return (
                            <div key={key} className={`bg-white rounded-xl p-6 border-l-4 border-${segment.color}-500 shadow-sm`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{segment.label}</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.count}</p>
                                    </div>
                                    <div className="text-3xl">{segment.icon}</div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    €{stats.totalValue.toFixed(0)} total
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Sugerencias IA */}
                {suggestions.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8">
                        <div className="flex items-center mb-4">
                            <Sparkles className="w-6 h-6 mr-2" />
                            <h3 className="text-xl font-bold">Sugerencias Inteligentes</h3>
                        </div>
                        <div className="space-y-3">
                            {suggestions.slice(0, 3).map(suggestion => (
                                <div key={suggestion.id} className="bg-white/10 backdrop-blur rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">{suggestion.title}</h4>
                                            <p className="text-sm text-purple-100">{suggestion.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm bg-white/20 px-2 py-1 rounded">
                                                +€{suggestion.estimatedImpact}
                                            </span>
                                            <button className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-purple-50">
                                                Ejecutar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs de Navegación */}
                <div className="bg-white rounded-lg shadow-sm mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { id: "clientes", label: "Clientes", icon: Users },
                                { id: "mensajes", label: "Mensajes", icon: MessageSquare },
                                { id: "plantillas", label: "Plantillas", icon: Mail },
                                { id: "configuracion", label: "Configuración", icon: Settings }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? "border-purple-500 text-purple-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Contenido de Tabs */}
                    <div className="p-6">
                        {activeTab === "clientes" && (
                            <div className="space-y-6">
                                {/* Filtros y Búsqueda */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Buscar clientes..."
                                                value={filters.search}
                                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                    <select
                                        value={filters.segment}
                                        onChange={(e) => setFilters(prev => ({ ...prev, segment: e.target.value }))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="all">Todos los segmentos</option>
                                        {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => (
                                            <option key={key} value={key}>{segment.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Lista de Clientes */}
                                <div className="space-y-3">
                                    {filteredCustomers.map(customer => {
                                        const segment = CUSTOMER_SEGMENTS[customer.segment] || CUSTOMER_SEGMENTS.activo;
                                        return (
                                            <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                                                            {segment.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{customer.name}</h3>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                {customer.email && (
                                                                    <span className="flex items-center">
                                                                        <Mail className="w-3 h-3 mr-1" />
                                                                        {customer.email}
                                                                    </span>
                                                                )}
                                                                {customer.phone && (
                                                                    <span className="flex items-center">
                                                                        <Phone className="w-3 h-3 mr-1" />
                                                                        {customer.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${segment.color}-100 text-${segment.color}-800`}>
                                                            {segment.label}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {customer.visits_count} visitas • €{customer.total_spent || 0}
                                                        </div>
                                                        {customer.last_visit_at && (
                                                            <div className="text-xs text-gray-400">
                                                                Última visita: {format(parseISO(customer.last_visit_at), "dd/MM/yyyy", { locale: es })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === "configuracion" && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 rounded-xl text-white">
                                    <h3 className="text-xl font-bold mb-2">Configuración CRM Inteligente</h3>
                                    <p className="text-purple-100">
                                        Configura los parámetros de segmentación automática y plantillas inteligentes
                                    </p>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <Brain className="w-5 h-5 text-blue-600 mr-2" />
                                        <p className="text-blue-800 font-medium">
                                            Configuración CRM integrada desde la página principal
                                        </p>
                                    </div>
                                    <p className="text-blue-600 text-sm mt-1">
                                        Todas las configuraciones se centralizan aquí para evitar dispersión de información
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

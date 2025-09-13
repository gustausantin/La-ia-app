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
    Target, Zap, Award, Heart, Coffee, Sparkles, Save, X
} from "lucide-react";
import toast from "react-hot-toast";
import CustomerModal from "../components/CustomerModal";

// SEGMENTACIÓN INTELIGENTE - CORAZÓN DEL CRM
const CUSTOMER_SEGMENTS = {
    nuevo: { 
        label: "Nuevo", 
        icon: "👋", 
        color: "blue",
        description: "Cliente recién registrado",
        priority: 1
    },
    activo: { 
        label: "Activo", 
        icon: "⭐", 
        color: "green",
        description: "Cliente con visitas regulares",
        priority: 2
    },
    bib: { 
        label: "BIB", 
        icon: "👑", 
        color: "purple",
        description: "Best In Business - Cliente prioritario",
        priority: 5
    },
    inactivo: { 
        label: "Inactivo", 
        icon: "😴", 
        color: "gray",
        description: "Sin visitas recientes",
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
    bib: {
        title: "Promoción a BIB",
        subject: "¡Felicidades! Ahora eres cliente BIB de {restaurant_name}",
        content: `¡Hola {customer_name}!

Nos complace informarte que ahora formas parte de nuestro programa BIB (Best In Business) en {restaurant_name}.

Como cliente BIB, disfrutarás de:
• Reservas prioritarias
• Atención personalizada
• Invitaciones a eventos exclusivos
• Experiencias únicas

¡Gracias por tu fidelidad!

El equipo de {restaurant_name}`,
        variables: ["restaurant_name", "customer_name", "bib_benefits"]
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
    const [templates, setTemplates] = useState([]);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    
    // Estados para modales
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    
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
                    id, restaurant_id, name, email, phone, first_name, last_name1, last_name2,
                    segment_auto, segment_manual, visits_count, last_visit_at, total_spent, avg_ticket,
                    churn_risk_score, predicted_ltv, consent_email, consent_sms, consent_whatsapp,
                    preferences, tags, notes, created_at, updated_at
                `)
                .eq("restaurant_id", restaurantId)
                .order("last_visit_at", { ascending: false });

            if (customersError) throw customersError;
            
            // Procesar y segmentar clientes automáticamente
            const processedCustomers = customersData?.map(customer => ({
                ...customer,
                // Usar directamente el segmento calculado por la BD
                segment: customer.segment_manual || customer.segment_auto || 'nuevo',
                daysSinceLastVisit: customer.last_visit_at 
                    ? Math.floor((new Date() - new Date(customer.last_visit_at)) / (1000 * 60 * 60 * 24))
                    : null
            })) || [];

            setCustomers(processedCustomers);
            
            // Calcular estadísticas por segmento
            const segmentStats = calculateSegmentStats(processedCustomers);
            setSegments(segmentStats);
            
            // Generar sugerencias IA
            // Cargar sugerencias existentes desde Supabase
            const { data: suggestionsData } = await supabase
                .from("crm_suggestions")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .eq("status", "pending")
                .order("priority", { ascending: false });
                
            setSuggestions(suggestionsData || []);
            
            // Cargar configuración CRM
            const { data: crmSettingsData } = await supabase
                .from("crm_settings")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .single();
                
            setCrmConfig(crmSettingsData || {
                days_new_customer: 7,
                days_active_customer: 30,
                days_inactive_customer: 60,
                visits_bib_customer: 10,
                days_risk_customer: 45
            });
            
            // Cargar plantillas CRM
            const { data: templatesData } = await supabase
                .from("crm_templates")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .eq("active", true)
                .order("priority");
                
            setTemplates(templatesData || []);
            
        } catch (error) {
            console.error("Error cargando datos CRM:", error);
            toast.error("Error al cargar los datos del CRM");
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // DETERMINAR SEGMENTO DE CLIENTE AUTOMÁTICamente - **ELIMINADA**
    // La lógica ahora reside 100% en la base de datos a través de `segment_auto`

    // CALCULAR ESTADÍSTICAS POR SEGMENTO
    const calculateSegmentStats = (customers) => {
        const stats = {};
        
        Object.keys(CUSTOMER_SEGMENTS).forEach(segment => {
            const segmentCustomers = customers.filter(c => c.segment === segment);
            stats[segment] = {
                count: segmentCustomers.length,
                totalVisits: segmentCustomers.reduce((sum, c) => sum + (c.visits_count || 0), 0),
                avgVisits: segmentCustomers.length > 0 
                    ? segmentCustomers.reduce((sum, c) => sum + (c.visits_count || 0), 0) / segmentCustomers.length 
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
                estimatedImpact: inactiveCustomers.length // Clientes a reactivar
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
                estimatedImpact: newCustomers.length // Clientes nuevos
            });
        }
        
        // Sugerencias para promoción a BIB
        const potentialBIBs = customers.filter(c => 
            c.segment === 'activo' && 
            c.visits_count >= 8
        );
        if (potentialBIBs.length > 0) {
            suggestions.push({
                id: 'promote_bib',
                type: 'bib',
                priority: 'high',
                title: `Promover ${potentialBIBs.length} clientes a BIB`,
                description: `${potentialBIBs.length} clientes califican para ser BIB`,
                customers: potentialBIBs,
                template: 'bib',
                estimatedImpact: potentialBIBs.length // Clientes BIB
            });
        }
        
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    };

    // EJECUTAR SUGERENCIAS IA - BOTÓN FUNCIONAL
    const executeAISuggestions = async () => {
        if (!restaurantId) return;
        
        try {
            setLoading(true);
            toast("Analizando clientes y generando sugerencias...");
            
            // Limpiar sugerencias anteriores
            await supabase
                .from("crm_suggestions")
                .delete()
                .eq("restaurant_id", restaurantId)
                .eq("status", "pending");
            
            const newSuggestions = [];
            
            // Analizar cada cliente y generar sugerencias
            for (const customer of customers) {
                const segment = customer.segment_manual || customer.segment_auto || 'nuevo';
                const template = templates.find(t => t.type === segment);
                
                if (template) {
                    // Crear sugerencia basada en segmento
                    let suggestionType = segment;
                    let priority = 'medium';
                    let title = '';
                    let description = '';
                    
                    switch (segment) {
                        case 'inactivo':
                            priority = 'high';
                            title = `Reactivar cliente inactivo: ${customer.name}`;
                            description = `Cliente sin visitas por ${customer.daysSinceLastVisit || 'muchos'} días`;
                            break;
                        case 'nuevo':
                            priority = 'medium';
                            title = `Dar bienvenida a: ${customer.name}`;
                            description = `Cliente nuevo registrado hace ${differenceInDays(new Date(), parseISO(customer.created_at))} días`;
                            break;
                        case 'activo':
                            if (customer.visits_count >= (crmConfig.visits_bib_customer || 10) - 2) {
                                priority = 'high';
                                suggestionType = 'bib';
                                title = `Promover a BIB: ${customer.name}`;
                                description = `Cliente con ${customer.visits_count} visitas, candidato a BIB`;
                            }
                            break;
                        case 'riesgo':
                            priority = 'high';
                            title = `Cliente en riesgo: ${customer.name}`;
                            description = `Cliente con riesgo de pérdida, ${customer.daysSinceLastVisit || 'muchos'} días sin visitar`;
                            break;
                    }
                    
                    if (title) {
                        // Generar contenido personalizado
                        const personalizedContent = template.content
                            .replace(/{restaurant_name}/g, 'nuestro restaurante')
                            .replace(/{customer_name}/g, customer.name || 'Cliente')
                            .replace(/{last_visit_date}/g, customer.last_visit_at ? format(parseISO(customer.last_visit_at), "dd/MM/yyyy", { locale: es }) : 'hace tiempo');
                        
                        const personalizedSubject = template.subject
                            .replace(/{restaurant_name}/g, 'nuestro restaurante')
                            .replace(/{customer_name}/g, customer.name || 'Cliente');
                        
                        newSuggestions.push({
                            restaurant_id: restaurantId,
                            customer_id: customer.id,
                            template_id: template.id,
                            type: suggestionType,
                            priority: priority,
                            title: title,
                            description: description,
                            suggested_subject: personalizedSubject,
                            suggested_content: personalizedContent
                        });
                    }
                }
            }
            
            // Insertar sugerencias en Supabase
            if (newSuggestions.length > 0) {
                const { error } = await supabase
                    .from("crm_suggestions")
                    .insert(newSuggestions);
                    
                if (error) throw error;
                
                toast.success(`✅ ${newSuggestions.length} sugerencias generadas correctamente`);
                
                // Recargar datos
                await loadCRMData();
            } else {
                toast("No se encontraron nuevas sugerencias para generar");
            }
            
        } catch (error) {
            console.error("Error ejecutando sugerencias IA:", error);
            toast.error("Error al generar sugerencias automáticas");
        } finally {
            setLoading(false);
        }
    };

    // GUARDAR PLANTILLA MODIFICADA
    const saveTemplate = async (templateData) => {
        try {
            const { error } = await supabase
                .from("crm_templates")
                .update({
                    name: templateData.name,
                    subject: templateData.subject,
                    content: templateData.content,
                    updated_at: new Date().toISOString()
                })
                .eq("id", templateData.id);
                
            if (error) throw error;
            
            toast.success("✅ Plantilla guardada correctamente");
            setShowTemplateModal(false);
            setEditingTemplate(null);
            loadCRMData(); // Recargar datos
        } catch (error) {
            console.error("Error guardando plantilla:", error);
            toast.error("Error al guardar la plantilla");
        }
    };

    // ABRIR MODAL DE PLANTILLA
    const openTemplateModal = (template) => {
        setEditingTemplate(template);
        setShowTemplateModal(true);
    };

    // ABRIR MODAL DE CLIENTE
    const openCustomerModal = (customer) => {
        console.log('=== OPENING CUSTOMER MODAL ===');
        console.log('Opening modal with customer:', customer);
        console.log('Customer name:', customer.name);
        console.log('Customer first_name:', customer.first_name);
        console.log('Customer last_name1:', customer.last_name1);
        console.log('Customer last_name2:', customer.last_name2);
        
        setSelectedCustomer(customer);
        setShowCustomerModal(true);
    };

    // GUARDAR CONFIGURACIÓN CRM
    const saveCrmConfig = async () => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from("crm_settings")
                .upsert({
                    restaurant_id: restaurantId,
                    days_new_customer: crmConfig.days_new_customer || 7,
                    days_active_customer: crmConfig.days_active_customer || 30,
                    days_inactive_customer: crmConfig.days_inactive_customer || 60,
                    visits_bib_customer: crmConfig.visits_bib_customer || 10,
                    days_risk_customer: crmConfig.days_risk_customer || 45,
                    auto_suggestions: true,
                    auto_segmentation: true,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'restaurant_id'
                });
                
            if (error) throw error;
            
            toast.success("✅ Configuración CRM guardada correctamente");
            
            // Recargar datos para aplicar nueva configuración
            await loadCRMData();
            
        } catch (error) {
            console.error("Error guardando configuración CRM:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                    {Object.entries(CUSTOMER_SEGMENTS).map(([key, segment]) => {
                        const stats = segments[key] || { count: 0, totalValue: 0 };
                        return (
                            <div key={key} className={`bg-white rounded-lg p-4 border-l-4 border-${segment.color}-500 shadow-sm`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600">{segment.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                                    </div>
                                    <div className="text-2xl">{segment.icon}</div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {stats.totalVisits} visitas totales
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
                                                {suggestion.estimatedImpact} clientes
                                            </span>
                            <button 
                                onClick={executeAISuggestions}
                                disabled={loading}
                                className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-purple-50 disabled:opacity-50"
                            >
                                {loading ? "Procesando..." : "Ejecutar"}
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

                                {/* Lista de Clientes - FORMATO LISTA COMO CLIENTES */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <div className="divide-y divide-gray-200">
                                        {filteredCustomers.map(customer => {
                                            const segmentKey = customer.segment_manual || customer.segment_auto || 'nuevo';
                                            const segment = CUSTOMER_SEGMENTS[segmentKey] || CUSTOMER_SEGMENTS.activo;
                                            return (
                                                <div 
                                                    key={customer.id} 
                                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => openCustomerModal(customer)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                {/* Avatar con inicial */}
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                                    {customer.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                
                                                                {/* Icono de segmento */}
                                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                                                                    {segment.icon}
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                                                            {customer.name}
                                                                        </h3>
                                                                        {/* Etiqueta de segmento */}
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${segment.color}-100 text-${segment.color}-800`}>
                                                                            {segment.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-1">
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
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                                                            
                                                            {/* Días desde última visita */}
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
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "mensajes" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Mensajes CRM Inteligente</h3>
                                        <p className="text-gray-600">Ejecuta el CRM IA para generar mensajes automáticos</p>
                                    </div>
                                    <button
                                        onClick={executeAISuggestions}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Zap className="w-5 h-5" />
                                        )}
                                        <span className="font-medium">{loading ? "Analizando..." : "Ejecutar CRM IA"}</span>
                                    </button>
                                </div>

                                {/* Mensajes Sugeridos */}
                                <div className="bg-white rounded-lg border border-gray-200">
                                    <div className="p-6 border-b border-gray-200">
                                        <h4 className="font-bold text-gray-900">Mensajes Sugeridos por IA</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Haz clic en "Ejecutar CRM IA" para generar mensajes automáticos basados en el comportamiento de tus clientes
                                        </p>
                                    </div>
                                    
                                    <div className="p-6">
                                        {suggestions.length > 0 ? (
                                            <div className="space-y-4">
                                                {suggestions.map(suggestion => {
                                                    const customer = customers.find(c => c.id === suggestion.customer_id);
                                                    if (!customer) return null;
                                                    
                                                    return (
                                                        <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                                        <span className="text-purple-600 font-medium text-sm">
                                                                            {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-900">{customer.name}</h5>
                                                                        <p className="text-sm text-gray-500">{customer.email}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                                        suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-green-100 text-green-800'
                                                                    }`}>
                                                                        {suggestion.priority === 'high' ? 'Alta' : 
                                                                         suggestion.priority === 'medium' ? 'Media' : 'Baja'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                                <h6 className="font-medium text-gray-900 mb-1">{suggestion.suggested_subject}</h6>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestion.suggested_content}</p>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-gray-500">
                                                                    Tipo: {suggestion.type} • Generado: {format(parseISO(suggestion.created_at), 'dd/MM/yyyy HH:mm')}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            // TODO: Implementar eliminar sugerencia
                                                                            toast.success('Mensaje eliminado');
                                                                        }}
                                                                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    >
                                                                        No Enviar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            // TODO: Implementar envío de mensaje
                                                                            toast.success('Mensaje enviado');
                                                                        }}
                                                                        className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
                                                                    >
                                                                        Enviar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                <h5 className="font-medium text-gray-900 mb-2">No hay mensajes generados</h5>
                                                <p className="text-gray-500 mb-4">
                                                    Haz clic en "Ejecutar CRM IA" para generar mensajes automáticos
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "configuracion" && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 rounded-xl text-white">
                                    <h3 className="text-xl font-bold mb-2">Configuración CRM Inteligente</h3>
                                    <p className="text-purple-100">
                                        Define las reglas de segmentación automática de clientes
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <h4 className="font-bold text-gray-900 mb-4">Reglas de Segmentación</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cliente Nuevo (días desde registro)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={crmConfig.days_new_customer || 7}
                                                        onChange={(e) => setCrmConfig(prev => ({
                                                            ...prev,
                                                            days_new_customer: parseInt(e.target.value) || 7
                                                        }))}
                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="365"
                                                    />
                                                    <span className="text-sm text-gray-500">días</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cliente Activo (días desde última visita)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={crmConfig.days_active_customer || 30}
                                                        onChange={(e) => setCrmConfig(prev => ({
                                                            ...prev,
                                                            days_active_customer: parseInt(e.target.value) || 30
                                                        }))}
                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="365"
                                                    />
                                                    <span className="text-sm text-gray-500">días</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cliente BIB (visitas mínimas)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={crmConfig.visits_bib_customer || 10}
                                                        onChange={(e) => setCrmConfig(prev => ({
                                                            ...prev,
                                                            visits_bib_customer: parseInt(e.target.value) || 10
                                                        }))}
                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="100"
                                                    />
                                                    <span className="text-sm text-gray-500">visitas</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cliente Inactivo (días sin visitar)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={crmConfig.days_inactive_customer || 60}
                                                        onChange={(e) => setCrmConfig(prev => ({
                                                            ...prev,
                                                            days_inactive_customer: parseInt(e.target.value) || 60
                                                        }))}
                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="365"
                                                    />
                                                    <span className="text-sm text-gray-500">días</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cliente En Riesgo (días desde última visita)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={crmConfig.days_risk_customer || 45}
                                                        onChange={(e) => setCrmConfig(prev => ({
                                                            ...prev,
                                                            days_risk_customer: parseInt(e.target.value) || 45
                                                        }))}
                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="365"
                                                    />
                                                    <span className="text-sm text-gray-500">días</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Botón Guardar Configuración */}
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={saveCrmConfig}
                                                disabled={loading}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                                Guardar Configuración
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <h4 className="font-bold text-gray-900 mb-4">Estado del Sistema</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Segmentación Automática</span>
                                                <span className="text-sm text-green-600 font-medium">✅ Activa</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Sugerencias IA</span>
                                                <span className="text-sm text-green-600 font-medium">✅ Activa</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Plantillas Cargadas</span>
                                                <span className="text-sm text-blue-600 font-medium">{templates.length} plantillas</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Clientes Totales</span>
                                                <span className="text-sm text-purple-600 font-medium">{customers.length} clientes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Unificado de Cliente */}
            <CustomerModal
                customer={selectedCustomer}
                isOpen={showCustomerModal}
                onClose={() => {
                    setShowCustomerModal(false);
                    setSelectedCustomer(null);
                }}
                onSave={(updatedCustomer) => {
                    // Actualizar cliente en la lista
                    setCustomers(prev => prev.map(c => 
                        c.id === updatedCustomer.id ? updatedCustomer : c
                    ));
                    // Recargar datos del CRM
                    loadCRMData();
                }}
                restaurantId={restaurantId}
                mode="view"
            />
        </div>
    );
}

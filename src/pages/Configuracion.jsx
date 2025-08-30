// Configuracion.jsx - CONFIGURACIÓN COMPLETA RESTAURADA
import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import {
    Settings,
    Building2,
    Bot,
    MessageSquare,
    Users,
    Clock,
    Save,
    Check,
    X,
    AlertCircle,
    Zap,
    Phone,
    Mail,
    Globe,
    RefreshCw,
    Sparkles,
    Brain,
    Target,
    Activity,
    Timer,
    Code,
    Database,
    Shield,
    Palette,
    Bell
} from "lucide-react";

// Componentes especializados
import AgentConfiguration from "../components/configuracion/AgentConfiguration";
import RestaurantSettings from "../components/configuracion/RestaurantSettings";

// Spinner de carga
const LoadingSpinner = ({ text = "Cargando..." }) => (
    <div className="flex items-center justify-center p-8">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">{text}</p>
                </div>
    </div>
);

// Configuración de canales disponibles
const AVAILABLE_CHANNELS = {
    whatsapp: {
        name: "WhatsApp Business",
        icon: MessageSquare,
        color: "green",
        description: "Conecta con WhatsApp Business API para mensajes automáticos",
        fields: [
            { key: "phone_number", label: "Número de WhatsApp", type: "text", placeholder: "+34 600 000 000" },
            { key: "api_key", label: "Token API", type: "password", placeholder: "Token de WhatsApp Business" },
            { key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://..." }
        ]
    },
    vapi: {
        name: "Llamadas (VAPI)",
        icon: Phone,
        color: "blue", 
        description: "Sistema de llamadas con IA para atención telefónica 24/7",
        fields: [
            { key: "api_key", label: "VAPI API Key", type: "password", placeholder: "vapi_key_..." },
            { key: "phone_number", label: "Número de teléfono", type: "text", placeholder: "+34 900 000 000" },
            { key: "voice_id", label: "ID de voz", type: "text", placeholder: "voice_id" }
        ]
    },
    email: {
        name: "Email SMTP",
        icon: Mail,
        color: "orange",
        description: "Configurar servidor SMTP para emails automáticos",
        fields: [
            { key: "smtp_host", label: "Servidor SMTP", type: "text", placeholder: "smtp.gmail.com" },
            { key: "smtp_port", label: "Puerto", type: "number", placeholder: "587" },
            { key: "smtp_user", label: "Usuario", type: "email", placeholder: "email@ejemplo.com" },
            { key: "smtp_password", label: "Contraseña", type: "password", placeholder: "Contraseña SMTP" },
            { key: "from_email", label: "Email origen", type: "email", placeholder: "noreply@restaurante.com" }
        ]
    },
    web_chat: {
        name: "Web Chat",
        icon: Globe,
        color: "purple",
        description: "Chat integrado en tu página web",
        fields: [
            { key: "widget_color", label: "Color del widget", type: "color", placeholder: "#6366f1" },
            { key: "position", label: "Posición", type: "select", options: ["bottom-right", "bottom-left"], placeholder: "bottom-right" }
        ]
    },
    facebook: {
        name: "Facebook Messenger",
        icon: Users,
        color: "blue",
        description: "Conecta con Facebook Messenger para tu página",
        fields: [
            { key: "page_id", label: "ID de página", type: "text", placeholder: "123456789" },
            { key: "access_token", label: "Token de acceso", type: "password", placeholder: "Token de Facebook" }
        ]
    },
    instagram: {
        name: "Instagram Direct",
        icon: Users,
        color: "pink",
        description: "Mensajes directos de Instagram Business",
        fields: [
            { key: "page_id", label: "ID de perfil", type: "text", placeholder: "instagram_id" },
            { key: "access_token", label: "Token de acceso", type: "password", placeholder: "Token de Instagram" }
        ]
    }
};

// Componente principal
export default function Configuracion() {
    const { restaurant, restaurantId } = useAuthContext();
    
    // Estados básicos
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("restaurant");
    const [validationErrors, setValidationErrors] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Leer parámetro URL para abrir pestaña específica
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab && ['restaurant', 'agent', 'channels', 'advanced'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    // Estados de configuración completa
    const [restaurantConfig, setRestaurantConfig] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "España",
        postal_code: "",
        cuisine_type: "",
        description: "",
        website: "",
        social_media: {
        instagram: "",
        facebook: "",
            tripadvisor: ""
        }
    });

    const [agentConfig, setAgentConfig] = useState({
        personality: {
            name: "Sofia",
            tone: "friendly",
            language_style: "casual",
            empathy_level: 8,
            proactivity: 7,
            formality: 3
        },
        capabilities: {
            can_make_reservations: true,
            can_modify_reservations: true,
            can_cancel_reservations: true,
            can_provide_menu_info: true,
            can_suggest_alternatives: true,
            can_handle_complaints: true,
            can_upsell: true,
            can_collect_feedback: true
        },
        response_settings: {
            max_response_time: 30,
            use_typing_indicator: true,
            response_length: "medium",
            include_emojis: true,
            personalization_level: "high"
        },
        escalation_rules: {
            complex_requests: true,
            customer_frustration: true,
            technical_issues: true,
            special_occasions: true,
            vip_customers: true,
            after_hours: false
        }
    });

    const [channelsConfig, setChannelsConfig] = useState({});
    const [businessHours, setBusinessHours] = useState({
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "09:00", close: "22:00", closed: false },
        sunday: { open: "09:00", close: "22:00", closed: true }
    });

    const [advancedSettings, setAdvancedSettings] = useState({
        integrations: {
            n8n_webhook: "",
            zapier_webhook: "",
            custom_api_endpoint: ""
        },
        database: {
            backup_frequency: "daily",
            retention_days: 30,
            auto_cleanup: true
        },
        security: {
            two_factor_auth: false,
            session_timeout: 24,
            ip_whitelist: ""
        },
        notifications: {
            email_notifications: true,
            sms_notifications: false,
            push_notifications: true
        }
    });

    // Función de validación profesional
    const validateConfiguration = useCallback(() => {
        const errors = {};
        
        // Validar restaurante
        if (!restaurantConfig.name?.trim()) {
            errors.restaurant_name = "El nombre del restaurante es obligatorio";
        }
        if (restaurantConfig.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(restaurantConfig.email)) {
            errors.restaurant_email = "Email inválido";
        }
        if (restaurantConfig.phone && !/^(\+34|0034|34)?[6789]\d{8}$/.test(restaurantConfig.phone.replace(/\s/g, ''))) {
            errors.restaurant_phone = "Teléfono español inválido";
        }

        // Validar agente IA
        if (!agentConfig.personality.name?.trim()) {
            errors.agent_name = "El agente debe tener un nombre";
        }

        // Validar canales activos
        const activeChannels = Object.values(channelsConfig).filter(ch => ch.enabled);
        if (activeChannels.length === 0) {
            errors.channels = "Debe tener al menos un canal activo";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [restaurantConfig, agentConfig, channelsConfig]);

    // Detectar cambios no guardados
    const markAsChanged = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    // Cargar configuración completa
    const loadConfiguration = useCallback(async () => {
        if (!restaurantId) return;

            setLoading(true);
                try {
            // Cargar datos del restaurante
                    const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', restaurantId)
                .single();

            if (!restaurantError && restaurantData) {
                setRestaurantConfig({
                    name: restaurantData.name || "",
                    email: restaurantData.email || "",
                    phone: restaurantData.phone || "",
                    address: restaurantData.address || "",
                    city: restaurantData.city || "",
                    country: restaurantData.country || "España",
                    postal_code: restaurantData.postal_code || "",
                    cuisine_type: restaurantData.cuisine_type || "",
                    description: restaurantData.settings?.description || "",
                    website: restaurantData.settings?.website || "",
                    social_media: restaurantData.settings?.social_media || {
                        instagram: "",
                        facebook: "",
                        tripadvisor: ""
                    }
                });

                // Cargar horarios
                if (restaurantData.business_hours) {
                    setBusinessHours(restaurantData.business_hours);
                }

                // Cargar configuración del agente
                if (restaurantData.agent_config) {
                    setAgentConfig(prev => ({
                        ...prev,
                        ...restaurantData.agent_config
                    }));
                }

                // Cargar configuraciones avanzadas
                if (restaurantData.settings?.advanced) {
                    setAdvancedSettings(prev => ({
                ...prev,
                        ...restaurantData.settings.advanced
                    }));
                }
            }

            // Cargar configuración de canales
            const { data: channelsData, error: channelsError } = await supabase
                .from('channel_credentials')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (!channelsError && channelsData) {
                const channelsMap = {};
                channelsData.forEach(channel => {
                    channelsMap[channel.channel] = {
                        enabled: channel.is_active,
                        credentials: channel.credentials || {},
                        config: channel.config || {}
                    };
                });
                setChannelsConfig(channelsMap);
            }

        } catch (error) {
            console.error('Error cargando configuración:', error);
            toast.error('Error cargando configuración');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Guardar configuración del restaurante - PROFESIONAL
    const saveRestaurantConfig = useCallback(async () => {
        if (!restaurantId) return;

        // Validar antes de guardar
        if (!validateConfiguration()) {
            toast.error('Por favor, corrige los errores antes de guardar');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('restaurants')
            .update({
                    name: restaurantConfig.name,
                    email: restaurantConfig.email,
                    phone: restaurantConfig.phone,
                    address: restaurantConfig.address,
                    city: restaurantConfig.city,
                    country: restaurantConfig.country,
                    postal_code: restaurantConfig.postal_code,
                    cuisine_type: restaurantConfig.cuisine_type,
                    business_hours: businessHours,
                    agent_config: agentConfig,
                    settings: {
                        description: restaurantConfig.description,
                        website: restaurantConfig.website,
                        social_media: restaurantConfig.social_media,
                        advanced: advancedSettings
                    },
                updated_at: new Date().toISOString()
            })
                .eq('id', restaurantId);

        if (error) {
            throw error;
        }
        
            toast.success('✅ Configuración guardada exitosamente');
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error guardando configuración:', error);
            toast.error('❌ Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    }, [restaurantId, restaurantConfig, businessHours, agentConfig, advancedSettings, validateConfiguration]);

    // Habilitar/deshabilitar canal
    const toggleChannel = useCallback(async (channelType, enabled) => {
        try {
            if (enabled) {
        const { error } = await supabase
                    .from('channel_credentials')
                    .upsert({
                        restaurant_id: restaurantId,
                        channel: channelType,
                        is_active: true,
                        credentials: channelsConfig[channelType]?.credentials || {},
                        config: channelsConfig[channelType]?.config || {}
                    });

        if (error) throw error;
            } else {
        const { error } = await supabase
                    .from('channel_credentials')
                    .update({ is_active: false })
                    .eq('restaurant_id', restaurantId)
                    .eq('channel', channelType);

        if (error) throw error;
            }

            setChannelsConfig(prev => ({
                ...prev,
                [channelType]: {
                    ...prev[channelType],
                    enabled: enabled
                }
            }));

            toast.success(`Canal ${channelType} ${enabled ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error('Error toggling channel:', error);
            toast.error('Error al cambiar estado del canal');
        }
    }, [restaurantId, channelsConfig]);

    // Actualizar credenciales de canal
    const updateChannelCredentials = useCallback(async (channelType, credentials) => {
        try {
            const { error } = await supabase
                .from('channel_credentials')
                .upsert({
                    restaurant_id: restaurantId,
                    channel: channelType,
                    is_active: channelsConfig[channelType]?.enabled || false,
                    credentials: credentials,
                    config: channelsConfig[channelType]?.config || {}
                });

            if (error) throw error;

            setChannelsConfig(prev => ({
                    ...prev,
                [channelType]: {
                    ...prev[channelType],
                    credentials: credentials
                }
            }));

            toast.success(`Credenciales de ${channelType} actualizadas`);
        } catch (error) {
            console.error('Error updating channel credentials:', error);
            toast.error('Error al actualizar credenciales');
        }
    }, [restaurantId, channelsConfig]);

    // Cargar datos al inicializar
    useEffect(() => {
        if (restaurantId) {
            loadConfiguration();
        }
    }, [restaurantId, loadConfiguration]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <LoadingSpinner text="Cargando configuración completa..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
                {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Centro de Control LA-IA
                    </h1>
                            <p className="text-gray-600 mt-1">
                                Panel de configuración profesional • La mejor gestión de restaurantes del mundo
                    </p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-600 font-medium">Sistema operativo</span>
                                <span className="text-xs text-gray-500">• {restaurant?.name || 'Tu Restaurante'}</span>
                </div>
                        </div>
                </div>
                    <div className="flex items-center gap-3">
                                <button
                            onClick={loadConfiguration}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                                </button>
                        <button
                            onClick={saveRestaurantConfig}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Guardando..." : "Guardar Todo"}
                                    </button>
                        </div>
                </div>

                {/* Navegación de pestañas PROFESIONAL */}
                <div className="flex gap-2 mt-6 overflow-x-auto">
                    {[
                        { 
                            id: "restaurant", 
                            label: "Restaurante", 
                            icon: Building2, 
                            desc: "Información, horarios y configuración básica",
                            color: "blue"
                        },
                        { 
                            id: "agent", 
                            label: "Agente IA", 
                            icon: Bot, 
                            desc: "Personalidad, capacidades y comportamiento",
                            color: "purple"
                        },
                        { 
                            id: "channels", 
                            label: "Canales", 
                            icon: MessageSquare, 
                            desc: "WhatsApp, llamadas, email, redes sociales",
                            color: "green"
                        },
                        { 
                            id: "advanced", 
                            label: "Avanzado", 
                            icon: Settings, 
                            desc: "Integraciones, seguridad y configuración técnica",
                            color: "orange"
                        }
                    ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 min-w-[200px] ${
                                activeTab === tab.id
                                    ? `bg-${tab.color}-100 text-${tab.color}-700 border-2 border-${tab.color}-200 shadow-lg transform scale-105`
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${
                                activeTab === tab.id ? `bg-${tab.color}-200` : "bg-gray-200"
                            }`}>
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-semibold">{tab.label}</div>
                                <div className="text-xs opacity-75 mt-1">{tab.desc}</div>
                            </div>
                            {activeTab === tab.id && (
                                <div className={`w-2 h-2 rounded-full bg-${tab.color}-500 animate-pulse`}></div>
                            )}
                                </button>
                            ))}
                            </div>
                        </div>

            <div className="p-6">
                {/* PESTAÑA RESTAURANTE - WORLD CLASS */}
                {activeTab === "restaurant" && (
                    <div className="space-y-8">
                        {/* Header de sección */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-xl">
                                    <Building2 className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Configuración del Restaurante</h2>
                                    <p className="text-gray-600 mt-1">Información esencial para el funcionamiento de tu negocio</p>
                                                </div>
                                            </div>
                                        </div>

                        {/* Información básica */}
                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-600" />
                                Información Básica
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del restaurante *
                                            </label>
                                            <input
                                                type="text"
                                        value={restaurantConfig.name}
                                        onChange={(e) => {
                                            setRestaurantConfig(prev => ({ ...prev, name: e.target.value }));
                                            markAsChanged();
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                                            validationErrors.restaurant_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Nombre del restaurante"
                                        required
                                            />
                                            {validationErrors.restaurant_name && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {validationErrors.restaurant_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de cocina
                                            </label>
                                            <select
                                        value={restaurantConfig.cuisine_type}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, cuisine_type: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        <option value="mediterranea">Mediterránea</option>
                                        <option value="italiana">Italiana</option>
                                        <option value="japonesa">Japonesa</option>
                                        <option value="mexicana">Mexicana</option>
                                        <option value="china">China</option>
                                        <option value="india">India</option>
                                        <option value="francesa">Francesa</option>
                                        <option value="americana">Americana</option>
                                        <option value="vegetariana">Vegetariana</option>
                                        <option value="fusion">Fusión</option>
                                        <option value="tradicional">Tradicional</option>
                                        <option value="otro">Otro</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email de contacto
                                            </label>
                                            <input
                                                type="email"
                                        value={restaurantConfig.email}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="email@restaurante.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                        value={restaurantConfig.phone}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="+34 600 000 000"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ciudad
                                            </label>
                                            <input
                                        type="text"
                                        value={restaurantConfig.city}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Madrid"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código postal
                                            </label>
                                            <input
                                                type="text"
                                        value={restaurantConfig.postal_code}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, postal_code: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="28001"
                                            />
                                        </div>

                                <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dirección completa
                                            </label>
                                            <input
                                                type="text"
                                        value={restaurantConfig.address}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Calle Principal, 123"
                                            />
                                        </div>

                                <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción del restaurante
                                            </label>
                                    <textarea
                                        value={restaurantConfig.description}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Describe tu restaurante, ambiente, especialidades..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Página web
                                            </label>
                                            <input
                                        type="url"
                                        value={restaurantConfig.website}
                                        onChange={(e) => setRestaurantConfig(prev => ({ ...prev, website: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="https://mirestaurante.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Instagram
                                            </label>
                                            <input
                                                type="text"
                                        value={restaurantConfig.social_media.instagram}
                                        onChange={(e) => setRestaurantConfig(prev => ({ 
                                            ...prev, 
                                            social_media: { ...prev.social_media, instagram: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="@mirestaurante"
                                            />
                                        </div>
                                    </div>
                                    </div>

                        {/* Horarios de atención - PROFESIONAL */}
                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    Horarios de Atención
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Activity className="w-4 h-4" />
                                    <span>Agente IA activo en horarios configurados</span>
                            </div>
                            </div>
                            
                                <div className="space-y-4">
                                {Object.entries(businessHours).map(([day, hours]) => {
                                    const dayNames = {
                                        monday: "Lunes",
                                        tuesday: "Martes", 
                                        wednesday: "Miércoles",
                                        thursday: "Jueves",
                                        friday: "Viernes",
                                        saturday: "Sábado",
                                        sunday: "Domingo"
                                    };

                                        return (
                                        <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                            <div className="w-28">
                                                <span className="font-medium text-gray-900">{dayNames[day]}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!hours.closed}
                                                    onChange={(e) => setBusinessHours(prev => ({
                                                        ...prev,
                                                        [day]: { ...prev[day], closed: !e.target.checked }
                                                    }))}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-sm text-gray-600">Abierto</span>
                                            </div>
                                            
                                            {!hours.closed && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) => setBusinessHours(prev => ({
                                                                ...prev,
                                                            [day]: { ...prev[day], open: e.target.value }
                                                        }))}
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                    />
                                                    <span className="text-gray-500">a</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) => setBusinessHours(prev => ({
                                                                ...prev,
                                                            [day]: { ...prev[day], close: e.target.value }
                                                        }))}
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                    />
                                                </>
                                            )}
                                            
                                            {hours.closed && (
                                                <span className="text-gray-500 italic">Cerrado</span>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                                </div>
                                        </div>
                )}

                                {/* PESTAÑA AGENTE IA - WORLD CLASS */}
                        {activeTab === "agent" && (
                    <div className="space-y-8">
                        {/* Header de sección IA */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                                    <Bot className="w-8 h-8 text-white" />
                                                </div>
                                        <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Agente IA {agentConfig.personality.name}</h2>
                                    <p className="text-gray-600 mt-1">Configura la personalidad y capacidades de tu asistente virtual 24/7</p>
                                        </div>
                                <div className="ml-auto">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 rounded-lg">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium text-purple-700">IA Activa</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Configuración del Agente IA
                            </h3>
                            
                            {/* Personalidad */}
                            <div className="mb-8">
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Personalidad del Agente
                                </h3>
                                
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del agente
                                                    </label>
                                                    <input
                                            type="text"
                                            value={agentConfig.personality.name}
                                            onChange={(e) => setAgentConfig(prev => ({
                                                            ...prev,
                                                personality: { ...prev.personality, name: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Sofia"
                                            />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tono de comunicación
                                                    </label>
                                            <select
                                            value={agentConfig.personality.tone}
                                            onChange={(e) => setAgentConfig(prev => ({
                                                            ...prev,
                                                personality: { ...prev.personality, tone: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="friendly">Amigable</option>
                                            <option value="professional">Profesional</option>
                                            <option value="casual">Casual</option>
                                            <option value="warm">Cálido</option>
                                            <option value="enthusiastic">Entusiasta</option>
                                            </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nivel de empatía (1-10)
                                                    </label>
                                                    <input
                                            type="range"
                                                min="1"
                                            max="10"
                                            value={agentConfig.personality.empathy_level}
                                            onChange={(e) => setAgentConfig(prev => ({
                                                            ...prev,
                                                personality: { ...prev.personality, empathy_level: parseInt(e.target.value) }
                                            }))}
                                            className="w-full"
                                        />
                                        <div className="text-center text-sm text-gray-600 mt-1">
                                            {agentConfig.personality.empathy_level}/10
                                        </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Proactividad (1-10)
                                                    </label>
                                                    <input
                                                                type="range"
                                            min="1"
                                            max="10"
                                            value={agentConfig.personality.proactivity}
                                            onChange={(e) => setAgentConfig(prev => ({
                                                            ...prev,
                                                personality: { ...prev.personality, proactivity: parseInt(e.target.value) }
                                            }))}
                                                                className="w-full"
                                                            />
                                        <div className="text-center text-sm text-gray-600 mt-1">
                                            {agentConfig.personality.proactivity}/10
                                                                </div>
                                                </div>
                                            </div>
                                        </div>

                            {/* Capacidades */}
                            <div className="mb-8">
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Capacidades del Agente
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(agentConfig.capabilities).map(([key, value]) => {
                                        const labels = {
                                            can_make_reservations: "Crear reservas",
                                            can_modify_reservations: "Modificar reservas",
                                            can_cancel_reservations: "Cancelar reservas",
                                            can_provide_menu_info: "Información del menú",
                                            can_suggest_alternatives: "Sugerir alternativas",
                                            can_handle_complaints: "Gestionar quejas",
                                            can_upsell: "Venta adicional",
                                            can_collect_feedback: "Recoger feedback"
                                        };

                                        return (
                                            <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                            <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setAgentConfig(prev => ({
                                                                    ...prev,
                                                        capabilities: { ...prev.capabilities, [key]: e.target.checked }
                                                    }))}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {labels[key]}
                                                </span>
                                                    </label>
                                        );
                                    })}
                                                </div>
                                                        </div>

                            {/* Reglas de escalamiento */}
                                                        <div>
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Reglas de Escalamiento
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(agentConfig.escalation_rules).map(([key, value]) => {
                                        const labels = {
                                            complex_requests: "Solicitudes complejas",
                                            customer_frustration: "Frustración del cliente",
                                            technical_issues: "Problemas técnicos",
                                            special_occasions: "Ocasiones especiales",
                                            vip_customers: "Clientes VIP",
                                            after_hours: "Fuera de horario"
                                        };

                                        return (
                                            <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                            <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setAgentConfig(prev => ({
                                                                    ...prev,
                                                        escalation_rules: { ...prev.escalation_rules, [key]: e.target.checked }
                                                    }))}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {labels[key]}
                                                </span>
                                                            </label>
                                        );
                                    })}
                                                        </div>
                                                    </div>
                                            </div>
                                        </div>
                )}

                {/* PESTAÑA CANALES - WORLD CLASS */}
                {activeTab === "channels" && (
                    <div className="space-y-8">
                        {/* Header de sección Canales */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                                    <MessageSquare className="w-8 h-8 text-white" />
                                </div>
                                        <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Canales de Comunicación</h2>
                                    <p className="text-gray-600 mt-1">Centro de control omnicanal • Conecta todos tus canales de atención</p>
                                                    </div>
                                <div className="ml-auto">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">
                                            {Object.values(channelsConfig).filter(ch => ch.enabled).length}/6
                                                    </div>
                                        <div className="text-sm text-gray-600">Canales activos</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-green-600" />
                                    Configuración de Canales
                                </h3>
                                <div className="text-sm text-gray-500">
                                    Aquí se gestionan TODOS los canales • Fuente única de verdad
                                    </div>
                            </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(AVAILABLE_CHANNELS).map(([channelType, channel]) => {
                                const isEnabled = channelsConfig[channelType]?.enabled || false;
                                const credentials = channelsConfig[channelType]?.credentials || {};
                                const IconComponent = channel.icon;
                                
                                return (
                                    <div
                                        key={channelType}
                                        className={`border-2 rounded-lg p-6 transition-colors ${
                                            isEnabled
                                                ? "border-green-200 bg-green-50"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                <IconComponent className={`w-6 h-6 text-${channel.color}-600`} />
                                                    <div>
                                                    <h3 className="font-medium text-gray-900">{channel.name}</h3>
                                                    <p className="text-sm text-gray-600">{channel.description}</p>
                                                    </div>
                                                </div>
                                                    <button
                                                onClick={() => toggleChannel(channelType, !isEnabled)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    isEnabled ? "bg-green-600" : "bg-gray-300"
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        isEnabled ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                                />
                                                    </button>
                                                </div>
                                        
                                        {isEnabled && channel.fields && (
                                            <div className="mt-4 space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                                                <h4 className="font-medium text-gray-900">Configuración</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {channel.fields.map((field) => (
                                                        <div key={field.key}>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {field.label}
                                                            </label>
                                                            {field.type === 'select' ? (
                                                                <select
                                                                    value={credentials[field.key] || field.placeholder || ''}
                                                                    onChange={(e) => updateChannelCredentials(channelType, {
                                                                        ...credentials,
                                                                        [field.key]: e.target.value
                                                                    })}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                                >
                                                                    {field.options?.map(option => (
                                                                        <option key={option} value={option}>{option}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                            <input
                                                                    type={field.type}
                                                                    value={credentials[field.key] || ''}
                                                                    onChange={(e) => updateChannelCredentials(channelType, {
                                                                        ...credentials,
                                                                        [field.key]: e.target.value
                                                                    })}
                                                                    placeholder={field.placeholder}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                        
                                        <div className="flex items-center gap-2 mt-4">
                                            {isEnabled ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <Check className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Conectado</span>
                                                    </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <X className="w-4 h-4" />
                                                    <span className="text-sm">No conectado</span>
                                                </div>
                                            )}
                                                </div>
                                            </div>
                                );
                            })}
                                                    </div>
                                                </div>
                                            )}

                {/* PESTAÑA AVANZADO - ENTERPRISE LEVEL */}
                {activeTab === "advanced" && (
                    <div className="space-y-8">
                        {/* Header de sección Avanzado */}
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl">
                                    <Settings className="w-8 h-8 text-white" />
                                                    </div>
                                                    <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Configuración Avanzada</h2>
                                    <p className="text-gray-600 mt-1">Integraciones enterprise, seguridad y configuración técnica avanzada</p>
                                                    </div>
                                <div className="ml-auto">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
                                        <Shield className="w-4 h-4 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-700">Enterprise</span>
                                                    </div>
                                                </div>
                            </div>
                                        </div>

                        {/* Integraciones */}
                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Code className="w-5 h-5 text-orange-600" />
                                Integraciones con Terceros
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Webhook N8N
                                                        </label>
                                                        <input
                                        type="url"
                                        value={advancedSettings.integrations.n8n_webhook}
                                        onChange={(e) => setAdvancedSettings(prev => ({
                                                                    ...prev,
                                            integrations: { ...prev.integrations, n8n_webhook: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="https://n8n.ejemplo.com/webhook/..."
                                                        />
                                                    </div>

                                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Webhook Zapier
                                                        </label>
                                                        <input
                                        type="url"
                                        value={advancedSettings.integrations.zapier_webhook}
                                        onChange={(e) => setAdvancedSettings(prev => ({
                                                                    ...prev,
                                            integrations: { ...prev.integrations, zapier_webhook: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                                                        />
                                                    </div>
                                                </div>
                                        </div>

                        {/* Seguridad */}
                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-orange-600" />
                                    Configuración de Seguridad
                                </h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Seguro</span>
                                                    </div>
                                                </div>
                            
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                        <input
                                        type="checkbox"
                                        checked={advancedSettings.security.two_factor_auth}
                                        onChange={(e) => setAdvancedSettings(prev => ({
                                                                    ...prev,
                                            security: { ...prev.security, two_factor_auth: e.target.checked }
                                        }))}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Autenticación de dos factores
                                    </span>
                                </label>

                                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timeout de sesión (horas)
                                                        </label>
                                                        <input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={advancedSettings.security.session_timeout}
                                        onChange={(e) => setAdvancedSettings(prev => ({
                                                                    ...prev,
                                            security: { ...prev.security, session_timeout: parseInt(e.target.value) }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                        </div>
                                    </div>

                        {/* Notificaciones */}
                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-orange-600" />
                                    Preferencias de Notificaciones
                                </h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                                    <Activity className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Tiempo real</span>
                                    </div>
                            </div>

                                        <div className="space-y-4">
                                {Object.entries(advancedSettings.notifications).map(([key, value]) => {
                                    const labels = {
                                        email_notifications: "Notificaciones por email",
                                        sms_notifications: "Notificaciones por SMS",
                                        push_notifications: "Notificaciones push"
                                    };

                                    return (
                                        <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                    <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setAdvancedSettings(prev => ({
                                                                ...prev,
                                                    notifications: { ...prev.notifications, [key]: e.target.checked }
                                                }))}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                {labels[key]}
                                            </span>
                                                    </label>
                                    );
                                })}
                                                                            </div>
                                                </div>
                                            </div>
                                        )}

                {/* Footer profesional con acciones */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-gray-600">
                                    Última actualización: {new Date().toLocaleString()}
                                </span>
                                    </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-green-600 font-medium">
                                    Configuración sincronizada
                                </span>
                                </div>
                        </div>
                        <div className="flex items-center gap-3">
                                    <button
                                onClick={loadConfiguration}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Recargar
                            </button>
                            <button
                                onClick={saveRestaurantConfig}
                                        disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 font-medium shadow-lg transition-all"
                                    >
                                <Save className="w-5 h-5" />
                                        {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                        ) : (
                                    "Guardar Configuración"
                                        )}
                                    </button>
                                </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

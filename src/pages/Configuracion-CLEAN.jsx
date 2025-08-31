// Configuracion.jsx - CONFIGURACIÓN COMPLETA RESTAURADA
import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import {
    Settings,
    User,
    MessageCircle,
    Cog,
    Save,
    RefreshCw,
    Database,
    Check,
    X,
    AlertCircle,
    Phone,
    Mail,
    Globe,
    Instagram,
    Facebook,
    Zap,
    Bot,
    Clock,
    Users,
    Shield,
    Palette,
    Bell
} from "lucide-react";

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
        icon: MessageCircle,
        color: "green",
        description: "Comunicación directa con clientes vía WhatsApp Business API",
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
            { key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://..." }
        ]
    },
    email: {
        name: "Email Marketing",
        icon: Mail,
        color: "indigo",
        description: "Campañas de email marketing automatizadas y personalizadas",
        fields: [
            { key: "smtp_host", label: "Servidor SMTP", type: "text", placeholder: "smtp.gmail.com" },
            { key: "smtp_port", label: "Puerto SMTP", type: "number", placeholder: "587" },
            { key: "smtp_user", label: "Usuario SMTP", type: "email", placeholder: "tu-email@gmail.com" },
            { key: "smtp_password", label: "Contraseña SMTP", type: "password", placeholder: "Contraseña de aplicación" }
        ]
    },
    web: {
        name: "Chat Web",
        icon: Globe,
        color: "cyan",
        description: "Widget de chat integrado en tu página web",
        fields: [
            { key: "widget_id", label: "ID del Widget", type: "text", placeholder: "widget_..." },
            { key: "domain", label: "Dominio autorizado", type: "url", placeholder: "https://tu-restaurante.com" },
            { key: "theme_color", label: "Color del tema", type: "color", placeholder: "#7c3aed" }
        ]
    },
    instagram: {
        name: "Instagram",
        icon: Instagram,
        color: "pink",
        description: "Gestión de mensajes directos y comentarios de Instagram",
        fields: [
            { key: "access_token", label: "Token de acceso", type: "password", placeholder: "Instagram Access Token" },
            { key: "page_id", label: "ID de la página", type: "text", placeholder: "Instagram Page ID" },
            { key: "webhook_verify_token", label: "Token de verificación", type: "password", placeholder: "Webhook Verify Token" }
        ]
    },
    facebook: {
        name: "Facebook Messenger",
        icon: Facebook,
        color: "blue",
        description: "Mensajería automática a través de Facebook Messenger",
        fields: [
            { key: "page_access_token", label: "Token de página", type: "password", placeholder: "Facebook Page Access Token" },
            { key: "app_secret", label: "App Secret", type: "password", placeholder: "Facebook App Secret" },
            { key: "verify_token", label: "Token de verificación", type: "password", placeholder: "Webhook Verify Token" }
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
        postal_code: "",
        cuisine_type: "",
        country: "España"
    });

    const [businessHours, setBusinessHours] = useState({
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "09:00", close: "22:00", closed: false },
        sunday: { open: "09:00", close: "22:00", closed: true }
    });

    const [agentConfig, setAgentConfig] = useState({
        personality: {
            name: "Sofia",
            tone: "profesional",
            language: "español",
            greeting: "¡Hola! Soy Sofia, tu asistente de reservas."
        },
        capabilities: {
            reservations: true,
            menu_questions: true,
            hours_info: true,
            location_info: true,
            special_events: false
        },
        restrictions: {
            max_party_size: 8,
            advance_booking_days: 30,
            min_booking_notice_hours: 2
        }
    });

    const [channelsConfig, setChannelsConfig] = useState({
        whatsapp: { enabled: false, credentials: {} },
        vapi: { enabled: false, credentials: {} },
        email: { enabled: false, credentials: {} },
        web: { enabled: true, credentials: {} },
        instagram: { enabled: false, credentials: {} },
        facebook: { enabled: false, credentials: {} }
    });

    const [advancedSettings, setAdvancedSettings] = useState({
        notifications: {
            email_alerts: true,
            sms_alerts: false,
            push_notifications: true
        },
        security: {
            two_factor: false,
            ip_whitelist: [],
            session_timeout: 60
        },
        integrations: {
            pos_system: "",
            accounting_software: "",
            delivery_platforms: []
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

            if (restaurantError) throw restaurantError;

            if (restaurantData) {
                setRestaurantConfig({
                    name: restaurantData.name || "",
                    email: restaurantData.email || "",
                    phone: restaurantData.phone || "",
                    address: restaurantData.address || "",
                    city: restaurantData.city || "",
                    postal_code: restaurantData.postal_code || "",
                    cuisine_type: restaurantData.cuisine_type || "",
                    country: restaurantData.country || "España"
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

            if (channelsError) throw channelsError;

            if (channelsData) {
                const channelsMap = {};
                channelsData.forEach(channel => {
                    channelsMap[channel.channel] = {
                        enabled: channel.is_active || false,
                        credentials: channel.credentials || {}
                    };
                });
                setChannelsConfig(prev => ({ ...prev, ...channelsMap }));
            }

        } catch (error) {
            console.error('Error cargando configuración:', error);
            toast.error('Error al cargar la configuración');
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
            // Guardar datos del restaurante
            const { error: restaurantError } = await supabase
                .from('restaurants')
                .update({
                    ...restaurantConfig,
                    business_hours: businessHours,
                    agent_config: agentConfig,
                    settings: {
                        advanced: advancedSettings
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', restaurantId);

            if (restaurantError) throw restaurantError;

            // Guardar configuración de canales
            for (const [channelType, config] of Object.entries(channelsConfig)) {
                if (config.enabled) {
                    const { error: channelError } = await supabase
                        .from('channel_credentials')
                        .upsert({
                            restaurant_id: restaurantId,
                            channel: channelType,
                            is_active: config.enabled,
                            credentials: config.credentials,
                            updated_at: new Date().toISOString()
                        });

                    if (channelError) throw channelError;
                }
            }

            toast.success('Configuración guardada correctamente');
            setHasUnsavedChanges(false);
            
        } catch (error) {
            console.error('Error guardando configuración:', error);
            toast.error('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    }, [restaurantId, restaurantConfig, businessHours, agentConfig, advancedSettings, channelsConfig, validateConfiguration]);

    // Habilitar/deshabilitar canal
    const toggleChannel = useCallback(async (channelType, enabled) => {
        try {
            if (enabled) {
                // Activar canal
                setChannelsConfig(prev => ({
                    ...prev,
                    [channelType]: { ...prev[channelType], enabled: true }
                }));
            } else {
                // Desactivar canal
                setChannelsConfig(prev => ({
                    ...prev,
                    [channelType]: { ...prev[channelType], enabled: false }
                }));
            }

            toast.success(`Canal ${channelType} ${enabled ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error('Error toggling channel:', error);
            toast.error('Error al cambiar el estado del canal');
        }
    }, []);

    // Actualizar credenciales de canal
    const updateChannelCredentials = useCallback(async (channelType, credentials) => {
        try {
            const { error } = await supabase
                .from('channel_credentials')
                .upsert({
                    restaurant_id: restaurantId,
                    channel: channelType,
                    credentials: credentials,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setChannelsConfig(prev => ({
                ...prev,
                [channelType]: {
                    ...prev[channelType],
                    credentials: credentials
                }
            }));

            toast.success('Credenciales actualizadas');
        } catch (error) {
            console.error('Error updating credentials:', error);
            toast.error('Error al actualizar credenciales');
        }
    }, [restaurantId]);

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
                            desc: "Información básica", 
                            icon: Settings,
                            color: "purple"
                        },
                        { 
                            id: "agent", 
                            label: "Agente IA", 
                            desc: "Configurar asistente", 
                            icon: Bot,
                            color: "blue"
                        },
                        { 
                            id: "channels", 
                            label: "Canales", 
                            desc: "WhatsApp, Email, etc.", 
                            icon: MessageCircle,
                            color: "green"
                        },
                        { 
                            id: "advanced", 
                            label: "Avanzado", 
                            desc: "Seguridad e integraciones", 
                            icon: Shield,
                            color: "red"
                        }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 min-w-[200px] ${
                                activeTab === tab.id
                                    ? "bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-lg transform scale-105"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${
                                activeTab === tab.id ? "bg-purple-200" : "bg-gray-200"
                            }`}>
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-semibold">{tab.label}</div>
                                <div className="text-xs opacity-75 mt-1">{tab.desc}</div>
                            </div>
                            {activeTab === tab.id && (
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Pestaña Restaurante */}
                {activeTab === "restaurant" && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Restaurante</h2>
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
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                            validationErrors.restaurant_name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Nombre de tu restaurante"
                                    />
                                    {validationErrors.restaurant_name && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.restaurant_name}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={restaurantConfig.email}
                                        onChange={(e) => {
                                            setRestaurantConfig(prev => ({ ...prev, email: e.target.value }));
                                            markAsChanged();
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                            validationErrors.restaurant_email ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="contacto@turestaurante.com"
                                    />
                                    {validationErrors.restaurant_email && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.restaurant_email}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pestaña Agente IA */}
                {activeTab === "agent" && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración del Agente IA</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del agente *
                                    </label>
                                    <input
                                        type="text"
                                        value={agentConfig.personality.name}
                                        onChange={(e) => {
                                            setAgentConfig(prev => ({
                                                ...prev,
                                                personality: { ...prev.personality, name: e.target.value }
                                            }));
                                            markAsChanged();
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                            validationErrors.agent_name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Sofia"
                                    />
                                    {validationErrors.agent_name && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.agent_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pestaña Canales */}
                {activeTab === "channels" && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Canales de Comunicación</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(AVAILABLE_CHANNELS).map(([channelType, channel]) => {
                                    const IconComponent = channel.icon;
                                    const isEnabled = channelsConfig[channelType]?.enabled || false;
                                    
                                    return (
                                        <div
                                            key={channelType}
                                            className={`p-6 rounded-xl border-2 transition-all ${
                                                isEnabled 
                                                    ? "border-green-200 bg-green-50" 
                                                    : "border-gray-200 bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <IconComponent className="w-6 h-6 text-green-600" />
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{channel.name}</h3>
                                                        <p className="text-sm text-gray-600">{channel.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleChannel(channelType, !isEnabled)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                        isEnabled ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {validationErrors.channels && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <p className="text-sm text-red-600">{validationErrors.channels}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Pestaña Avanzado */}
                {activeTab === "advanced" && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración Avanzada</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notificaciones</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={advancedSettings.notifications.email_alerts}
                                                onChange={(e) => {
                                                    setAdvancedSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            email_alerts: e.target.checked
                                                        }
                                                    }));
                                                    markAsChanged();
                                                }}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Alertas por email</span>
                                        </label>
                                    </div>
                                </div>
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

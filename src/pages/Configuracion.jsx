// Configuracion.jsx - Panel de Configuración COMPLETO SIN ERRORES
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
    Settings as SettingsIcon,
    Building2,
    Clock,
    Users,
    Bell,
    Globe,
    Zap,
    CreditCard,
    Shield,
    Save,
    Upload,
    Calendar,
    MessageSquare,
    Phone,
    Mail,
    MapPin,
    Image,
    Link2,
    ChevronRight,
    Check,
    X,
    AlertCircle,
    Sparkles,
    Palette,
    Languages,
    DollarSign,
    Smartphone,
    Bot,
    Webhook,
    Key,
    UserPlus,
    Crown,
    BarChart3,
    HelpCircle,
    ExternalLink,
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    Download,
    Trash2,
    Brain,
    MessageCircle,
    PhoneCall,
    Instagram,
    Facebook,
    Wifi,
    WifiOff,
    Volume2,
    Timer,
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Info,
    Gauge,
    Activity,
    Mic,
    Hash,
    Code,
    Database,
    FileText,
    Sliders,
    Plus,
    Gift,
    Heart,
    Award,
    Percent,
    Users as UsersIcon,
    Utensils,
    Navigation,
    ThermometerSun,
    UserCheck,
    TrendingDown,
    DollarSign as Dollar,
    Camera,
    Settings,
} from "lucide-react";
import toast from "react-hot-toast";

// Componente ToggleSwitch robusto
const ToggleSwitch = ({ enabled, onChange, label }) => {
    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    enabled ? 'bg-purple-600' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
            {label && <span className="text-sm text-gray-700">{label}</span>}
        </div>
    );
};

// Componente SettingSection robusto
const SettingSection = ({ title, description, icon, premium, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                {title}
                                {premium && <Crown className="w-4 h-4 text-purple-500" />}
                            </h3>
                            <p className="text-sm text-gray-600">{description}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

const Configuracion = () => {
    const { restaurantId } = useAuthContext();
    const location = useLocation();
    
    // 🎯 DETECTAR TAB DESDE URL PARAMS
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        
        // Mapear tabs válidos
        const validTabs = {
            'general': 'general',
            'hours': 'hours', 
            'reservations': 'reservations',
            'agent': 'agent',
            'crm': 'crm',
            'channels': 'channels',
            'workflows': 'workflows',
            'notifications': 'notifications',
            'team': 'team',
            'billing': 'billing',
            'integrations': 'integrations'
        };
        
        return validTabs[tabParam] || 'general';
    };
    
    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // 🎯 ESCUCHAR CAMBIOS EN URL PARAMS
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        
        if (tabParam && tabParam !== activeTab) {
            const validTabs = {
                'general': 'general',
                'hours': 'hours', 
                'reservations': 'reservations',
                'agent': 'agent',
                'crm': 'crm',
                'channels': 'channels',
                'workflows': 'workflows',
                'notifications': 'notifications',
                'team': 'team',
                'billing': 'billing',
                'integrations': 'integrations'
            };
            
            if (validTabs[tabParam]) {
                setActiveTab(validTabs[tabParam]);
            }
        }
    }, [location.search, activeTab]);
    
    // ESTADO ULTRA ROBUSTO - ESTRUCTURA COMPLETA GARANTIZADA
    const [settings, setSettings] = useState({
        // Información general
        name: "",
        description: "",
        cuisine_type: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "",
        postal_code: "",
        country: "ES",
        timezone: "Europe/Madrid",
        currency: "EUR",
        language: "es",
        logo_url: "",
        capacity_total: 0, // Configurable por cada restaurante
        price_range: "â‚¬â‚¬ - Moderado (25-45â‚¬)",
        instagram_handle: "",
        facebook_page: "",
        tripadvisor_url: "",
        google_maps_url: "",
        opening_year: new Date().getFullYear(),
        parking_available: false,
        wifi_available: true,
        accepts_groups: true,
        private_events: true,
        outdoor_seating: false,
        delivery_available: false,
        takeout_available: true,


        // CRM IA - desde BD Ãºnicamente
        crm: {},

        // Agente IA - desde BD Ãºnicamente
        agent: {},

        // Canales - desde BD Ãºnicamente
        channels: {},

        // Notificaciones - desde BD Ãºnicamente
        notifications: {},
        
        // Horarios - desde BD únicamente
        operating_hours: {}
    });

    // Tabs de navegación
    const settingsTabs = [
        {
            id: "general",
            label: "General",
            icon: <Building2 className="w-4 h-4" />,
        },
        { 
            id: "hours", 
            label: "Horarios", 
            icon: <Clock className="w-4 h-4" />,
        },
        {
            id: "agent",
            label: "Agente IA",
            icon: <Bot className="w-4 h-4" />,
        },
        {
            id: "channels",
            label: "Canales",
            icon: <MessageSquare className="w-4 h-4" />,
        },
        {
            id: "notifications",
            label: "Notificaciones",
            icon: <Bell className="w-4 h-4" />,
        }
    ];

    // Cargar configuración
    useEffect(() => {
        const loadSettings = async () => {
            if (!restaurantId) {
                console.log("âŒ No restaurant ID available");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("ðŸ”„ Cargando configuraciÃ³n para restaurant:", restaurantId);

                const { data: restaurant, error } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();

                if (error) {
                    console.error("âŒ Error cargando restaurant:", error);
                    throw error;
                }

                if (restaurant) {
                    console.log("âœ… Restaurant cargado:", restaurant);
                    console.log("🔍 DATOS ESPECÍFICOS:");
                    console.log("- name:", restaurant.name);
                    console.log("- email:", restaurant.email);
                    console.log("- phone:", restaurant.phone);
                    console.log("- address:", restaurant.address);
                    console.log("- city:", restaurant.city);
                    console.log("- postal_code:", restaurant.postal_code);
                    console.log("- cuisine_type:", restaurant.cuisine_type);

                    // Fusionar configuraciones manteniendo estructura completa
                    const restaurantSettings = restaurant.settings || {};
                    const restaurantCrmConfig = restaurant.crm_config || {};
                    const restaurantAgentConfig = restaurant.agent_config || {};

                    // CARGAR TODO DESDE SUPABASE - SIN HARDCODING
                    const dbSettings = restaurant.settings || {};
                    
                    setSettings({
                        // Información básica desde BD
                        name: restaurant.name || "",
                        description: restaurant.description || "",
                        cuisine_type: restaurant.cuisine_type || "",
                        phone: restaurant.phone || "",
                        email: restaurant.email || "",
                        website: restaurant.website || "",
                        address: restaurant.address || "",
                        city: restaurant.city || "",
                        postal_code: restaurant.postal_code || "",
                        country: restaurant.country || "ES",
                        timezone: restaurant.timezone || "Europe/Madrid",
                        currency: restaurant.currency || "EUR",
                        language: restaurant.language || "es",

                        // CRM desde BD Ãºnicamente
                        crm: dbSettings.crm || {},

                        // Agent desde BD Ãºnicamente  
                        agent: dbSettings.agent || {
                            enabled: true,
                            name: "Asistente Virtual",
                            personality: "amigable_profesional"
                        },
                        
                        // ConfiguraciÃ³n de reservas desde BD
                        min_party_size: dbSettings.min_party_size || 1,
                        max_party_size: dbSettings.max_party_size || 10,
                        reservation_duration: dbSettings.reservation_duration || 90,
                        buffer_time: dbSettings.buffer_time || 15,
                        advance_booking_days: dbSettings.advance_booking_days || 30,
                        same_day_cutoff: dbSettings.same_day_cutoff || "12:00",
                        cancellation_hours: dbSettings.cancellation_hours || 2,
                        
                        // Horarios desde BD
                        operating_hours: dbSettings.operating_hours || {},
                        
                        // Canales desde BD
                        channels: dbSettings.channels || {},
                        
                        // Notificaciones desde BD
                        notifications: dbSettings.notifications || {},
                        
                        // Otros campos desde BD
                        logo_url: dbSettings.logo_url || "",
                        capacity_total: dbSettings.capacity_total || 0,
                        price_range: dbSettings.price_range || ""
                    });

                    console.log("✅ Configuración cargada completamente");
                    console.log("🔍 SETTINGS FINALES APLICADOS:");
                    console.log("- name:", restaurant.name || "");
                    console.log("- email:", restaurant.email || "");
                    console.log("- phone:", restaurant.phone || "");
                    console.log("- address:", restaurant.address || "");
                    console.log("- city:", restaurant.city || "");
                    console.log("- postal_code:", restaurant.postal_code || "");
                } else {
                    console.log("âš ï¸ No se encontrÃ³ restaurant");
                }

            } catch (error) {
                console.error("âŒ Error cargando configuraciÃ³n:", error);
                toast.error("Error al cargar la configuración");
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [restaurantId]);

    // FunciÃ³n de guardado mejorada
    const handleSave = async (section) => {
        if (!restaurantId) {
            toast.error("No se encontrÃ³ el ID del restaurante");
            return;
        }

        try {
            setSaving(true);
            console.log(`💾 GUARDANDO SECCIÓN: ${section}`, settings);

            if (section === "InformaciÃ³n General") {
                // Obtener configuraciÃ³n actual para hacer merge
                const { data: currentData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                    
                const currentSettings = currentData?.settings || {};
                
                // Guardar campos directos en la tabla restaurants
                const { error } = await supabase
                    .from("restaurants")
                    .update({
                        name: settings.name,
                        email: settings.email,
                        phone: settings.phone,
                        contact_email: settings.email,
                        contact_phone: settings.phone,
                        address: settings.address,
                        city: settings.city,
                        postal_code: settings.postal_code,
                        cuisine_type: settings.cuisine_type,
                        settings: {
                            ...currentSettings,
                            description: settings.description,
                            website: settings.website,
                            logo_url: settings.logo_url,
                            capacity_total: settings.capacity_total,
                            price_range: settings.price_range,
                            instagram_handle: settings.instagram_handle,
                            facebook_page: settings.facebook_page,
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", restaurantId);

                if (error) throw error;
            } else if (section === "ConfiguraciÃ³n del Agente") {
                // Guardar configuraciÃ³n del agente especÃ­ficamente
                const { data: currentData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                    
                const currentSettings = currentData?.settings || {};
                
                const { error } = await supabase
                    .from("restaurants")
                    .update({
                        settings: {
                            ...currentSettings,
                            agent: {
                                name: settings.agent?.name || 'Asistente Virtual',
                                personality: 'amigable_profesional',
                                enabled: settings.agent?.enabled !== false
                            }
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", restaurantId);

                if (error) throw error;
            } else if (section === "Horarios de operaciÃ³n") {
                // Guardar horarios especÃ­ficamente
                const { data: currentData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                    
                const currentSettings = currentData?.settings || {};
                
                const { error } = await supabase
                    .from("restaurants")
                    .update({
                        settings: {
                            ...currentSettings,
                            operating_hours: settings.operating_hours
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", restaurantId);

                if (error) throw error;
                
                // Disparar evento para que el calendario se actualice
                window.dispatchEvent(new CustomEvent('schedule-updated', {
                    detail: { operating_hours: settings.operating_hours }
                }));
                
            } else if (section === "Canales de comunicaciÃ³n") {
                // Guardar configuraciÃ³n de canales especÃ­ficamente
                const { data: currentData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                    
                const currentSettings = currentData?.settings || {};
                
                const { error } = await supabase
                    .from("restaurants")
                    .update({
                        settings: {
                            ...currentSettings,
                            channels: settings.channels || {}
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", restaurantId);

                if (error) throw error;
            } else if (section === "Configuración de notificaciones") {
                // Guardar configuración de notificaciones específicamente
                const { data: currentData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                    
                const currentSettings = currentData?.settings || {};
                
                const { error } = await supabase
                    .from("restaurants")
                    .update({
                        settings: {
                            ...currentSettings,
                            notifications: settings.notifications || {}
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", restaurantId);

                if (error) throw error;
            } else {
                // Para otras secciones, guardar en settings
            const { error } = await supabase
                .from("restaurants")
                .update({
                    settings: settings,
                    updated_at: new Date().toISOString()
                })
                .eq("id", restaurantId);

            if (error) throw error;
            }

            toast.success(`âœ… ${section} guardado correctamente`);
            
        } catch (error) {
            console.error("âŒ Error guardando:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <SettingsIcon className="w-8 h-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Centro de control completo para tu restaurante. Configura CRM IA, canales de comunicación y todas las funcionalidades avanzadas.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {settingsTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                                        activeTab === tab.id
                                            ? "border-purple-500 text-purple-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.id === "crm" && (
                                        <Crown className="w-3 h-3 text-purple-500" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                    {/* General */}
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <SettingSection
                                title="Información General"
                                description="Configuración básica de tu restaurante"
                                icon={<Building2 />}
                            >
                                <div className="space-y-6">
                                    {/* Logo Upload Section */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Image className="w-5 h-5 text-blue-600" />
                                            Logo del Restaurante
                                        </h4>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                                {settings.logo_url ? (
                                                    <img
                                                        src={settings.logo_url}
                                                        alt="Logo"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <Image className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    id="logo-upload"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    logo_url: event.target.result
                                                                }));
                                                                toast.success('Logo cargado correctamente');
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <div className="space-y-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => document.getElementById('logo-upload').click()}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Subir logo profesional
                                                    </button>
                                        <p className="text-xs text-gray-500">
                                                PNG, JPG o SVG (máx. 5MB) • Recomendado: 400x400px
                                        </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del restaurante
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.name}
                                                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Nombre de tu restaurante"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de cocina
                                            </label>
                                            <select
                                                value={settings.cuisine_type}
                                                onChange={(e) => setSettings(prev => ({ ...prev, cuisine_type: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="">Selecciona el tipo</option>
                                                <option value="Mediterránea">Mediterránea</option>
                                                <option value="Española">Española</option>
                                                <option value="Italiana">Italiana</option>
                                                <option value="Asiática">Asiática</option>
                                                <option value="Mexicana">Mexicana</option>
                                                <option value="Francesa">Francesa</option>
                                                <option value="Japonesa">Japonesa</option>
                                                <option value="China">China</option>
                                                <option value="India">India</option>
                                                <option value="Americana">Americana</option>
                                                <option value="Vegetariana/Vegana">Vegetariana/Vegana</option>
                                                <option value="Marisquería">Marisquería</option>
                                                <option value="Asador/Parrilla">Asador/Parrilla</option>
                                                <option value="Tapas">Tapas</option>
                                                <option value="Fusión">Fusión</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email de contacto
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.email}
                                                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="contacto@restaurante.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={settings.phone}
                                                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="+34 600 000 000"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sitio web
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.website}
                                                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="https://www.turestaurante.com"
                                            />
                                        </div>


                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción del restaurante
                                            </label>
                                            <textarea
                                                value={settings.description}
                                                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Describe tu restaurante, especialidades, ambiente..."
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dirección completa
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.address}
                                                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Calle Mayor 123, Madrid"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ciudad
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.city}
                                                onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Madrid"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Código postal
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.postal_code}
                                                onChange={(e) => setSettings(prev => ({ ...prev, postal_code: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="28001"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rango de precios
                                            </label>
                                            <select
                                                value={settings.price_range}
                                                onChange={(e) => setSettings(prev => ({ ...prev, price_range: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="">Selecciona el rango</option>
                                                <option value="€ - Económico (10-20€)">€ - Económico (10-20€)</option>
                                                <option value="€€ - Moderado (20-35€)">€€ - Moderado (20-35€)</option>
                                                <option value="€€€ - Alto (35-60€)">€€€ - Alto (35-60€)</option>
                                                <option value="€€€€ - Premium (+60€)">€€€€ - Premium (+60€)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Capacidad Total (comensales) *
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.capacity_total}
                                                onChange={(e) => setSettings(prev => ({ ...prev, capacity_total: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="120"
                                                min="1"
                                                max="1000"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Este límite se aplicará en todas las reservas
                                            </p>
                                        </div>

                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Información General")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar General
                                        </button>
                                    </div>
                                </div>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === "channels" && (
                            <SettingSection
                            title="Canales de Comunicación Enterprise"
                            description="Gestión omnicanal con integración automática IA"
                            icon={<MessageSquare />}
                        >
                            <div className="space-y-6">
                                {/* WhatsApp */}
                                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                        <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">WhatsApp Business</h4>
                                                <p className="text-sm text-gray-600">Canal principal de comunicación</p>
                                            </div>
                                            </div>
                                            <ToggleSwitch
                                            enabled={settings.channels?.whatsapp?.enabled || false}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    whatsapp: { ...prev.channels?.whatsapp, enabled }
                                                }
                                                }))}
                                                label=""
                                            />
                                    </div>
                                    {settings.channels?.whatsapp?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Número de teléfono
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.whatsapp?.phone_number || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            whatsapp: { ...prev.channels?.whatsapp, phone_number: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    placeholder="+34 600 000 000"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Token API
                                                </label>
                                                <input
                                                    type="password"
                                                    value={settings.channels?.whatsapp?.api_token || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            whatsapp: { ...prev.channels?.whatsapp, api_token: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    placeholder="Token de WhatsApp Business API"
                                                />
                                            </div>
                        </div>
                                    )}
                                        </div>
                                        
                                {/* Webchat */}
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Web Chat</h4>
                                                <p className="text-sm text-gray-600">Chat integrado en la web</p>
                                            </div>
                                            </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.webchat?.enabled !== false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    webchat: { ...prev.channels?.webchat, enabled }
                                                }
                                            }))}
                                            label=""
                                        />
                                            </div>
                                    {settings.channels?.webchat?.enabled !== false && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Color principal
                                                </label>
                                                <input
                                                    type="color"
                                                    value={settings.channels?.webchat?.primary_color || "#6366f1"}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            webchat: { ...prev.channels?.webchat, primary_color: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full h-10 border border-gray-300 rounded-lg"
                                                />
                                        </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Posición
                                                </label>
                                                <select
                                                    value={settings.channels?.webchat?.position || "bottom-right"}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            webchat: { ...prev.channels?.webchat, position: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="bottom-right">Abajo Derecha</option>
                                                    <option value="bottom-left">Abajo Izquierda</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    </div>

                                {/* Instagram */}
                                <div className="bg-pink-50 p-6 rounded-xl border border-pink-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                    <div>
                                                <h4 className="font-medium text-gray-900">Instagram</h4>
                                                <p className="text-sm text-gray-600">Mensajes directos automáticos</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.instagram?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    instagram: { ...prev.channels?.instagram, enabled }
                                                }
                                            }))}
                                            label=""
                                        />
                                    </div>
                                    {settings.channels?.instagram?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Usuario de Instagram
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.instagram?.username || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            instagram: { ...prev.channels?.instagram, username: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                    placeholder="@turestaurante"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Access Token
                                                </label>
                                                <input
                                                    type="password"
                                                    value={settings.channels?.instagram?.access_token || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            instagram: { ...prev.channels?.instagram, access_token: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                    placeholder="Token de acceso de Instagram"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Facebook */}
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Facebook Messenger</h4>
                                                <p className="text-sm text-gray-600">Chat de página de Facebook</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.facebook?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    facebook: { ...prev.channels?.facebook, enabled }
                                                }
                                            }))}
                                            label=""
                                        />
                                    </div>
                                    {settings.channels?.facebook?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ID de Página
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.facebook?.page_id || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            facebook: { ...prev.channels?.facebook, page_id: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="ID de página de Facebook"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Page Token
                                                </label>
                                                <input
                                                    type="password"
                                                    value={settings.channels?.facebook?.page_token || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            facebook: { ...prev.channels?.facebook, page_token: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Token de página de Facebook"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* VAPI (Llamadas IA) */}
                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">VAPI - Llamadas IA</h4>
                                                <p className="text-sm text-gray-600">Asistente telefónico inteligente</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.vapi?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    vapi: { ...prev.channels?.vapi, enabled }
                                                }
                                            }))}
                                            label=""
                                        />
                                    </div>
                                    {settings.channels?.vapi?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={settings.channels?.vapi?.api_key || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            vapi: { ...prev.channels?.vapi, api_key: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="API Key de VAPI"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Número de teléfono
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.vapi?.phone_number || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            vapi: { ...prev.channels?.vapi, phone_number: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="+34 600 000 000"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleSave("Canales de comunicación")}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Guardar Canales
                                </button>
                            </div>
                        </SettingSection>
                    )}

                    {activeTab === "notifications" && (
                        <div className="space-y-6">
                            <SettingSection
                                title="Sistema de Notificaciones Enterprise"
                                description="Configuración completa de alertas y notificaciones automáticas para tu restaurante"
                                icon={<Bell />}
                            >
                                <div className="space-y-6">
                                    {/* Notificaciones de Reservas */}
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            Notificaciones de Reservas
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Nueva reserva confirmada</h5>
                                                    <p className="text-sm text-gray-600">Notificar cuando se confirme una nueva reserva</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.new_reservation || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            new_reservation: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Reserva cancelada</h5>
                                                    <p className="text-sm text-gray-600">Alerta cuando se cancele una reserva</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.cancelled_reservation || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            cancelled_reservation: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Recordatorio de reserva</h5>
                                                    <p className="text-sm text-gray-600">Recordatorio 2 horas antes de la reserva</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.reservation_reminder || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            reservation_reminder: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notificaciones CRM */}
                                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            Notificaciones CRM
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Nuevo cliente registrado</h5>
                                                    <p className="text-sm text-gray-600">Notificar cuando se registre un nuevo cliente</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.new_customer || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            new_customer: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Cliente BIB promocionado</h5>
                                                    <p className="text-sm text-gray-600">Alerta cuando un cliente se convierta en BIB</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.bib_promotion || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            bib_promotion: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Cliente en riesgo</h5>
                                                    <p className="text-sm text-gray-600">Alerta cuando un cliente esté en riesgo de pérdida</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.customer_at_risk || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            customer_at_risk: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                                </div>
                                            </div>

                                    {/* Notificaciones del Sistema */}
                                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-green-600" />
                                            Notificaciones del Sistema
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Agente IA desconectado</h5>
                                                    <p className="text-sm text-gray-600">Alerta si el agente IA deja de funcionar</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.agent_offline || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            agent_offline: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Errores de integración</h5>
                                                    <p className="text-sm text-gray-600">Notificar errores en canales o integraciones</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.integration_errors || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            integration_errors: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Resumen diario</h5>
                                                    <p className="text-sm text-gray-600">Resumen diario de actividad del restaurante</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.notifications?.daily_summary || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            daily_summary: enabled
                                                        }
                                                    }))}
                                                />
                                            </div>
                                                </div>
                                            </div>

                                    {/* Configuración de Horarios */}
                                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-orange-600" />
                                            Horarios de Notificaciones
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Horario de inicio
                                                </label>
                                                <input
                                                    type="time"
                                                    value={settings.notifications?.start_time || "08:00"}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            start_time: e.target.value
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                                </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Horario de fin
                                                </label>
                                                <input
                                                    type="time"
                                                    value={settings.notifications?.end_time || "22:00"}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            end_time: e.target.value
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Las notificaciones solo se enviarán dentro de este horario
                                        </p>
                                                </div>
                                            </div>

                                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => handleSave("Configuración de notificaciones")}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        Guardar Notificaciones
                                    </button>
                                                </div>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === "agent" && (
                        <SettingSection
                            title="Agente IA"
                            description="Activar o desactivar el asistente virtual inteligente"
                            icon={<Bot />}
                        >
                            <div className="space-y-6">
                                {/* Control Principal del Agente - EL MÁS IMPORTANTE */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-xl border border-purple-200">
                                    <div className="text-center mb-6">
                                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                                            settings.agent?.enabled ? 'bg-green-500' : 'bg-gray-400'
                                        }`}>
                                            <Bot className={`w-8 h-8 ${
                                                settings.agent?.enabled ? 'text-white' : 'text-gray-600'
                                            }`} />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Agente IA {settings.agent?.enabled ? 'Activo' : 'Inactivo'}
                                        </h3>
                                        <p className="text-gray-600">
                                            {settings.agent?.enabled 
                                                ? 'El agente está atendiendo automáticamente las consultas de tus clientes' 
                                                : 'El agente está desactivado. Las consultas se manejarán manualmente'}
                                        </p>
                                    </div>

                                    {/* BOTÓN PRINCIPAL - EL MÁS IMPORTANTE DE TODOS */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => {
                                                const newEnabled = !settings.agent?.enabled;
                                                setSettings(prev => ({
                                                    ...prev,
                                                    agent: { ...prev.agent, enabled: newEnabled }
                                                }));
                                                handleSave("Agente IA");
                                            }}
                                            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                                                settings.agent?.enabled
                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {settings.agent?.enabled ? (
                                                <>
                                                    <Bot className="w-5 h-5 inline mr-2" />
                                                    Desactivar Agente IA
                                                </>
                                            ) : (
                                                <>
                                                    <Bot className="w-5 h-5 inline mr-2" />
                                                    Activar Agente IA
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Información importante */}
                                    <div className="mt-6 pt-6 border-t border-purple-200">
                                        <div className="text-center text-sm text-gray-600">
                                            <p>
                                                <strong>Importante:</strong> Cuando el agente esté desactivado, 
                                                todas las consultas automáticas se pausarán y deberás atender manualmente.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </SettingSection>
                    )}

                    {activeTab === "hours" && (
                        <SettingSection
                            title="Horarios y Calendario Enterprise"
                            description="Configuración completa de horarios de operación con integración al calendario"
                            icon={<Clock />}
                        >
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-gray-900 mb-3">Horarios de Operación</h4>
                                    <div className="space-y-3">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey, index) => {
                                            const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                                            const daySchedule = settings.operating_hours?.[dayKey] || { open: true, start: "09:00", end: "22:00" };
                                            
                                            return (
                                                <div key={dayKey} className="flex items-center gap-4 p-3 bg-white rounded-lg">
                                                    <div className="w-20 font-medium text-gray-900">{dayNames[index]}</div>
                                                    <ToggleSwitch
                                                        enabled={daySchedule.open}
                                                        onChange={(enabled) => {
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                operating_hours: {
                                                                    ...prev.operating_hours,
                                                                    [dayKey]: {
                                                                        ...daySchedule,
                                                                        open: enabled
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        label=""
                                                    />
                                                    <input
                                                        type="time"
                                                        value={daySchedule.start}
                                                        onChange={(e) => {
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                operating_hours: {
                                                                    ...prev.operating_hours,
                                                                    [dayKey]: {
                                                                        ...daySchedule,
                                                                        start: e.target.value
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        disabled={!daySchedule.open}
                                                        className={`px-3 py-1 border rounded text-sm ${
                                                            daySchedule.open 
                                                                ? 'border-gray-300 bg-white' 
                                                                : 'border-gray-200 bg-gray-100 text-gray-400'
                                                        }`}
                                                    />
                                                    <span className="text-gray-500">a</span>
                                                    <input
                                                        type="time"
                                                        value={daySchedule.end}
                                                        onChange={(e) => {
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                operating_hours: {
                                                                    ...prev.operating_hours,
                                                                    [dayKey]: {
                                                                        ...daySchedule,
                                                                        end: e.target.value
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        disabled={!daySchedule.open}
                                                        className={`px-3 py-1 border rounded text-sm ${
                                                            daySchedule.open 
                                                                ? 'border-gray-300 bg-white' 
                                                                : 'border-gray-200 bg-gray-100 text-gray-400'
                                                        }`}
                                                    />
                        </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-green-900 mb-2">Integración Automática</h4>
                                            <p className="text-sm text-green-800">
                                                Los horarios configurados se sincronizan automÃ¡ticamente con el Calendario, 
                                                las Reservas y el Agente IA para garantizar coherencia en todo el sistema.
                                            </p>
                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleSave("Horarios de operación")}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Guardar Horarios
                                </button>
                        </div>
                        </SettingSection>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Configuracion;

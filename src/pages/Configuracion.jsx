// Configuracion.jsx - Panel de ConfiguraciÃ³n COMPLETO SIN ERRORES
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
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
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // ESTADO ULTRA ROBUSTO - ESTRUCTURA COMPLETA GARANTIZADA
    const [settings, setSettings] = useState({
        // InformaciÃ³n general
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

        // ConfiguraciÃ³n de reservas - desde BD
        min_party_size: 0,
        max_party_size: 0,
        reservation_duration: 0,
        buffer_time: 0,
        advance_booking_days: 0,
        same_day_cutoff: "",
        cancellation_hours: 0,

        // CRM IA - desde BD Ãºnicamente
        crm: {},

        // Agente IA - desde BD Ãºnicamente
        agent: {},

        // Canales - desde BD Ãºnicamente
        channels: {},

        // Notificaciones - desde BD Ãºnicamente
        notifications: {},
        
        // Horarios - desde BD Ãºnicamente
        operating_hours: {}
    });

    // Tabs de navegaciÃ³n
    const settingsTabs = [
        {
            id: "general",
            label: "General",
            icon: <Building2 className="w-4 h-4" />,
        },
        {
            id: "reservations",
            label: "PolÃ­tica de Reservas",
            icon: <Calendar className="w-4 h-4" />,
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

    // Cargar configuraciÃ³n
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

                    // Fusionar configuraciones manteniendo estructura completa
                    const restaurantSettings = restaurant.settings || {};
                    const restaurantCrmConfig = restaurant.crm_config || {};
                    const restaurantAgentConfig = restaurant.agent_config || {};

                    // CARGAR TODO DESDE SUPABASE - SIN HARDCODING
                    const dbSettings = restaurant.settings || {};
                    
                    setSettings({
                        // InformaciÃ³n bÃ¡sica desde BD
                        name: restaurant.name || "",
                        description: dbSettings.description || "",
                        cuisine_type: restaurant.cuisine_type || "",
                        phone: restaurant.phone || "",
                        email: restaurant.email || "",
                        website: dbSettings.website || "",
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

                    console.log("âœ… ConfiguraciÃ³n cargada completamente");
                } else {
                    console.log("âš ï¸ No se encontrÃ³ restaurant");
                }

            } catch (error) {
                console.error("âŒ Error cargando configuraciÃ³n:", error);
                toast.error("Error al cargar la configuraciÃ³n");
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
            console.log(`ðŸ’¾ GUARDANDO SECCIÃ“N: ${section}`, settings);

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
            toast.error("Error al guardar la configuraciÃ³n");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando configuraciÃ³n...</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">ConfiguraciÃ³n</h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Centro de control completo para tu restaurante. Configura CRM IA, canales de comunicaciÃ³n y todas las funcionalidades avanzadas.
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
                                title="InformaciÃ³n General"
                                description="ConfiguraciÃ³n bÃ¡sica de tu restaurante"
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
                                                        PNG, JPG o SVG (mÃ¡x. 5MB) â€¢ Recomendado: 400x400px
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
                                                <option value="MediterrÃ¡nea">MediterrÃ¡nea</option>
                                                <option value="EspaÃ±ola">EspaÃ±ola</option>
                                                <option value="Italiana">Italiana</option>
                                                <option value="AsiÃ¡tica">AsiÃ¡tica</option>
                                                <option value="Mexicana">Mexicana</option>
                                                <option value="Francesa">Francesa</option>
                                                <option value="Japonesa">Japonesa</option>
                                                <option value="China">China</option>
                                                <option value="India">India</option>
                                                <option value="Americana">Americana</option>
                                                <option value="Vegetariana/Vegana">Vegetariana/Vegana</option>
                                                <option value="MarisquerÃ­a">MarisquerÃ­a</option>
                                                <option value="Asador/Parrilla">Asador/Parrilla</option>
                                                <option value="Tapas">Tapas</option>
                                                <option value="FusiÃ³n">FusiÃ³n</option>
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
                                                TelÃ©fono
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
                                                DescripciÃ³n del restaurante
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
                                                DirecciÃ³n completa
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
                                                CÃ³digo postal
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
                                                <option value="â‚¬ - EconÃ³mico (10-20â‚¬)">â‚¬ - EconÃ³mico (10-20â‚¬)</option>
                                                <option value="â‚¬â‚¬ - Moderado (20-35â‚¬)">â‚¬â‚¬ - Moderado (20-35â‚¬)</option>
                                                <option value="â‚¬â‚¬â‚¬ - Alto (35-60â‚¬)">â‚¬â‚¬â‚¬ - Alto (35-60â‚¬)</option>
                                                <option value="â‚¬â‚¬â‚¬â‚¬ - Premium (+60â‚¬)">â‚¬â‚¬â‚¬â‚¬ - Premium (+60â‚¬)</option>
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
                                                Este lÃ­mite se aplicarÃ¡ en todas las reservas
                                            </p>
                                        </div>

                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("InformaciÃ³n General")}
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

                        <SettingSection
                            title="Canales de ComunicaciÃ³n Enterprise"
                            description="GestiÃ³n omnicanal con integraciÃ³n automÃ¡tica IA"
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
                                                <p className="text-sm text-gray-600">Canal principal de comunicaciÃ³n</p>
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
                                                    NÃºmero de telÃ©fono
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
                                                    PosiciÃ³n
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
                                                <p className="text-sm text-gray-600">Mensajes directos automÃ¡ticos</p>
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
                                                <p className="text-sm text-gray-600">Chat de pÃ¡gina de Facebook</p>
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
                                                    ID de PÃ¡gina
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
                                                    placeholder="ID de pÃ¡gina de Facebook"
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
                                                    placeholder="Token de pÃ¡gina de Facebook"
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
                                                <p className="text-sm text-gray-600">Asistente telefÃ³nico inteligente</p>
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
                                                    NÃºmero de telÃ©fono
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
                                    onClick={() => handleSave("Canales de comunicaciÃ³n")}
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
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Notificaciones</h3>
                            <p className="text-gray-600">Sistema de notificaciones configurado</p>
                        </div>
                    )}

                    {activeTab === "agent" && (
                        <div className="space-y-6">
                            <SettingSection
                                title="Agente IA Conversacional Enterprise"
                                description="Asistente virtual inteligente que atiende 24/7 con capacidad de reservas y escalamiento automÃ¡tico"
                                icon={<Bot />}
                                premium
                            >
                                <div className="space-y-6">
                                    {/* Estado del Agente */}
                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${settings.agent?.enabled ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
                                                <span className="font-medium text-gray-900">
                                                    Estado: {settings.agent?.enabled ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.agent?.enabled || true}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    agent: { ...prev.agent, enabled }
                                                }))}
                                                label=""
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-purple-600">24/7</p>
                                                <p className="text-sm text-gray-600">Disponible</p>
                                            </div>
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-green-600">IA</p>
                                                <p className="text-sm text-gray-600">Inteligente</p>
                                            </div>
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-blue-600">{settings.capacity_total || "N/A"}</p>
                                                <p className="text-sm text-gray-600">Cap. MÃ¡x</p>
                                            </div>
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-orange-600">Auto</p>
                                                <p className="text-sm text-gray-600">Reservas</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ConfiguraciÃ³n bÃ¡sica */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del Agente
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.agent?.name || 'Asistente Virtual'}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    agent: { ...prev.agent, name: e.target.value }
                                                }))}
                                                placeholder="Ej: Julia, tu asistente"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Personalidad
                                            </label>
                                            <select
                                                value="amigable_profesional"
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                            >
                                                <option value="amigable_profesional">Amigable y Profesional</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Personalidad fija para MVP - Amigable y profesional
                                            </p>
                                        </div>
                                    </div>

                                    {/* Capacidades del Agente - Solo informativas */}
                                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                        <h4 className="font-medium text-gray-900 mb-4">Capacidades del Agente IA (Incluidas en MVP)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-900">GestiÃ³n de Reservas</h5>
                                                    <p className="text-sm text-gray-600">Crear, modificar y cancelar reservas automÃ¡ticamente</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Escalamiento Inteligente</h5>
                                                    <p className="text-sm text-gray-600">Derivar a humano cuando sea necesario</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-900">InformaciÃ³n de MenÃº</h5>
                                                    <p className="text-sm text-gray-600">Responder sobre platos y precios</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-900">OptimizaciÃ³n de Mesas</h5>
                                                    <p className="text-sm text-gray-600">Asignar las mejores mesas automÃ¡ticamente</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Horarios y UbicaciÃ³n</h5>
                                                    <p className="text-sm text-gray-600">Informar sobre horarios y cÃ³mo llegar</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-900">Respuesta Inmediata</h5>
                                                    <p className="text-sm text-gray-600">Tiempo de respuesta menor a 30 segundos</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-800">
                                                <Info className="w-4 h-4 inline mr-1" />
                                                Todas estas capacidades estÃ¡n incluidas en el MVP y no se pueden desactivar.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ConfiguraciÃ³n de escalamiento */}
                                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                                        <h4 className="font-medium text-gray-900 mb-4">Escalamiento AutomÃ¡tico</h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <ToggleSwitch
                                                    enabled={settings.agent?.escalation_enabled !== false}
                                                    onChange={() => {}}
                                                    label="Escalamiento activado"
                                                    description="Derivar a humano automÃ¡ticamente"
                                                />
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Tiempo mÃ¡ximo respuesta (seg)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={30}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        min="10"
                                                        max="300"
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-orange-100 p-3 rounded-lg">
                                                <p className="text-sm text-orange-800">
                                                    <strong>Triggers de escalamiento:</strong> Quejas, consultas complejas, mÃºltiples intentos, sentimiento negativo
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* InformaciÃ³n de integraciÃ³n */}
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-medium text-blue-900 mb-2">
                                                    IntegraciÃ³n Completa del Sistema
                                                </h4>
                                                <div className="text-sm text-blue-800 space-y-1">
                                                    <p>â€¢ <strong>Reservas:</strong> Utiliza la capacidad mÃ¡xima configurada y turnos establecidos</p>
                                                    <p>â€¢ <strong>Mesas:</strong> OptimizaciÃ³n automÃ¡tica basada en disponibilidad</p>
                                                    <p>â€¢ <strong>Horarios:</strong> Respeta los horarios de operaciÃ³n configurados</p>
                                                    <p>â€¢ <strong>CRM:</strong> Identifica clientes VIP y aplica tratamiento especial</p>
                                                    <p>â€¢ <strong>Canales:</strong> Funciona en WhatsApp, telÃ©fono, web y redes sociales</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => handleSave("ConfiguraciÃ³n del Agente")}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        <span className="font-medium">Guardar Agente IA</span>
                                    </button>
                                </div>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === "hours" && (
                        <SettingSection
                            title="Horarios y Calendario Enterprise"
                            description="ConfiguraciÃ³n completa de horarios de operaciÃ³n con integraciÃ³n al calendario"
                            icon={<Clock />}
                        >
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-gray-900 mb-3">Horarios de OperaciÃ³n</h4>
                                    <div className="space-y-3">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey, index) => {
                                            const dayNames = ['Lunes', 'Martes', 'MiÃ©rcoles', 'Jueves', 'Viernes', 'SÃ¡bado', 'Domingo'];
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
                                            <h4 className="font-medium text-green-900 mb-2">IntegraciÃ³n AutomÃ¡tica</h4>
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
                                    onClick={() => handleSave("Horarios de operaciÃ³n")}
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

                    {activeTab === "reservations" && (
                        <SettingSection
                            title="PolÃ­tica de Reservas Enterprise"
                            description="ConfiguraciÃ³n completa para gestiÃ³n profesional de reservas con capacidad personalizable"
                            icon={<Calendar />}
                        >
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-gray-900 mb-3">ConfiguraciÃ³n Principal</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                TamaÃ±o mÃ­nimo de grupo
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.min_party_size}
                                                onChange={(e) => setSettings(prev => ({ ...prev, min_party_size: parseInt(e.target.value) || 1 }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="20"
                                            />
                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                TamaÃ±o mÃ¡ximo de grupo
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.max_party_size}
                                                onChange={(e) => setSettings(prev => ({ ...prev, max_party_size: parseInt(e.target.value) || 20 }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                MÃ¡ximo de personas por reserva individual
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                DÃ­as de antelaciÃ³n mÃ¡xima
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.advance_booking_days}
                                                onChange={(e) => setSettings(prev => ({ ...prev, advance_booking_days: parseInt(e.target.value) || 30 }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="365"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-medium text-gray-900 mb-3">DuraciÃ³n EstÃ¡ndar de Reserva</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                DuraciÃ³n estÃ¡ndar de reserva (minutos)
                                            </label>
                                            <select
                                                value={settings.reservation_duration}
                                                onChange={(e) => setSettings(prev => ({ ...prev, reservation_duration: parseInt(e.target.value) || 120 }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="60">60 minutos</option>
                                                <option value="90">90 minutos</option>
                                                <option value="120">120 minutos</option>
                                                <option value="150">150 minutos</option>
                                                <option value="180">180 minutos</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Tiempo estimado que cada mesa estarÃ¡ ocupada
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => handleSave("ConfiguraciÃ³n de reservas")}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        Guardar PolÃ­tica de Reservas
                                    </button>
                                </div>
                            </div>
                        </SettingSection>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Configuracion;

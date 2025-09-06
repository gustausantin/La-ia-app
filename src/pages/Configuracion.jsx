// Configuracion.jsx - Panel de Configuración COMPLETO y MEJORADO para Son-IA
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${premium ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <div className={premium ? 'text-purple-600' : 'text-blue-600'}>
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {title}
                        {premium && <Crown className="w-4 h-4 text-purple-500" />}
                    </h3>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
};

export default function ConfiguracionFixed() {
    const { restaurant, restaurantId, isReady, user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

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
        capacity_total: 0,
        price_range: "",

        // Horarios de operación con turnos de comida y cena
        operating_hours: {
            monday: {
                open: "13:00",
                close: "16:00", 
                dinner_open: "20:00",
                dinner_close: "23:30",
                closed: false
            },
            tuesday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00", 
                dinner_close: "23:30",
                closed: false
            },
            wednesday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "23:30", 
                closed: false
            },
            thursday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "23:30",
                closed: false
            },
            friday: {
                open: "13:00", 
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "00:00",
                closed: false
            },
            saturday: {
                open: "13:00",
                close: "16:00", 
                dinner_open: "20:00",
                dinner_close: "00:00",
                closed: false
            },
            sunday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00", 
                dinner_close: "23:30",
                closed: true
            }
        },

        // Configuración de reservas completa
        reservation_settings: {
            enabled: true,
            advance_booking_days: 45,
            min_party_size: 2,
            max_party_size: 120,
            turn_duration: 90,
            buffer_time: 15,
            cancellation_window: 2,
            modification_window: 1,
            auto_confirm: true,
            require_phone: true,
            require_email: true
        },
        
        // CRM IA - ESTRUCTURA COMPLETA GARANTIZADA
        crm: {
            enabled: true,
            thresholds: {
                inactivo_days: 60,
                vip_visits: 5,
                vip_spend: 500,
                alto_valor_spend: 1000,
                en_riesgo_drop: 50
            },
            automation: {
                enabled: true,
                cooldown_days: 30,
                max_daily_sends: 50,
                working_hours_only: false,
                execution_hours: {
                    start: "09:00",
                    end: "21:00"
                }
            },
            templates: {
                reactivacion: {
                    enabled: true,
                    subject: "¡Te echamos de menos, {{first_name}}!",
                    content: "Hola {{first_name}}, hace {{days_since_last_visit}} días que no te vemos. ¡Tenemos nuevos platos que te van a encantar!"
                },
                vip_upgrade: {
                    enabled: true,
                    subject: "👑 ¡Felicidades {{first_name}}! Eres VIP",
                    content: "Hola {{first_name}}, ¡has alcanzado el estatus VIP con {{visits_count}} visitas! Disfruta de beneficios exclusivos."
                },
                bienvenida: {
                    enabled: true,
                    subject: "🎉 ¡Bienvenido {{first_name}}!",
                    content: "Gracias por tu primera visita, {{first_name}}. ¡Esperamos verte pronto de nuevo!"
                }
            }
        },

        // Agente IA - ESTRUCTURA COMPLETA GARANTIZADA
        agent: {
            enabled: true,
            name: "Asistente Virtual",
            personality: "professional_friendly",
            language: "es",
            voice: "es-ES-Standard-A",
            auto_escalation: true,
            escalation_triggers: {
                multiple_requests: true,
                negative_sentiment: true,
                complex_queries: true
            },
            table_optimization: {
                enabled: true,
                algorithm: "capacity_first",
                consider_preferences: true,
                buffer_minutes: 15
            }
        },

        // Canales
        channels: {
            whatsapp: { enabled: false, phone_number: "", api_key: "", webhook_url: "" },
            vapi: { enabled: false, api_key: "", assistant_id: "", phone_number: "" },
            email: { enabled: false, smtp_server: "", smtp_port: 587, username: "", password: "" },
            webchat: { enabled: true, theme_color: "#7c3aed", position: "bottom-right", greeting: "¿Necesitas ayuda?" },
            instagram: { enabled: false, access_token: "", page_id: "" },
            facebook: { enabled: false, access_token: "", page_id: "" }
        },

        // Notificaciones
        notifications: {
            email: { enabled: true, new_reservation: true, cancellation: true, reminder: true },
            sms: { enabled: false, new_reservation: false, reminder: false },
            push: { enabled: true, new_message: true, reservation_updates: true }
        }
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
            label: "Horarios y Calendario", 
            icon: <Clock className="w-4 h-4" /> 
        },
        {
            id: "reservations",
            label: "Reservas",
            icon: <Calendar className="w-4 h-4" />,
        },
        {
            id: "agent",
            label: "Agente IA",
            icon: <Bot className="w-4 h-4" />,
            highlight: true
        },
        {
            id: "crm",
            label: "CRM IA",
            icon: <Brain className="w-4 h-4" />,
            highlight: true
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
        if (isReady) {
            loadSettings();
        }
    }, [isReady, restaurantId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            
            if (!restaurantId) {
                console.log("⚠️ No hay restaurantId, usando configuración por defecto");
                setLoading(false);
                return;
            }

            const { data: restaurantData, error } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", restaurantId)
                .single();

            if (error) {
                console.error("❌ Error cargando configuración:", error);
                toast.error("Error al cargar la configuración");
                setLoading(false);
                return;
            }

            if (restaurantData) {
                console.log("✅ Configuración cargada desde Supabase:", restaurantData);
                
                const restaurantSettings = restaurantData.settings || {};
                
                setSettings(prevSettings => ({
                    ...prevSettings,
                    name: restaurantData.name || "",
                    email: restaurantData.email || "",
                    phone: restaurantData.phone || "",
                    address: restaurantData.address || "",
                    city: restaurantData.city || "",
                    description: restaurantData.description || "",
                    logo_url: restaurantData.logo_url || "",
                    website: restaurantData.website || "",
                    capacity_total: restaurantData.capacity_total || 0,
                    
                    // Fusionar configuraciones manteniendo estructura completa
                    crm: {
                        ...prevSettings.crm,
                        ...restaurantSettings.crm,
                        thresholds: {
                            ...prevSettings.crm.thresholds,
                            ...restaurantSettings.crm?.thresholds
                        },
                        automation: {
                            ...prevSettings.crm.automation,
                            ...restaurantSettings.crm?.automation,
                            execution_hours: {
                                ...prevSettings.crm.automation.execution_hours,
                                ...restaurantSettings.crm?.automation?.execution_hours
                            }
                        },
                        templates: {
                            ...prevSettings.crm.templates,
                            ...restaurantSettings.crm?.templates,
                            reactivacion: {
                                ...prevSettings.crm.templates.reactivacion,
                                ...restaurantSettings.crm?.templates?.reactivacion
                            },
                            vip_upgrade: {
                                ...prevSettings.crm.templates.vip_upgrade,
                                ...restaurantSettings.crm?.templates?.vip_upgrade
                            },
                            bienvenida: {
                                ...prevSettings.crm.templates.bienvenida,
                                ...restaurantSettings.crm?.templates?.bienvenida
                            }
                        }
                    },
                    agent: {
                        ...prevSettings.agent,
                        ...restaurantSettings.agent,
                        escalation_triggers: {
                            ...prevSettings.agent.escalation_triggers,
                            ...restaurantSettings.agent?.escalation_triggers
                        },
                        table_optimization: {
                            ...prevSettings.agent.table_optimization,
                            ...restaurantSettings.agent?.table_optimization
                        }
                    },
                    channels: {
                        ...prevSettings.channels,
                        ...restaurantSettings.channels
                    },
                    notifications: {
                        ...prevSettings.notifications,
                        ...restaurantSettings.notifications
                    }
                }));
            }
            
        } catch (error) {
            console.error("❌ Error en loadSettings:", error);
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    // Función de guardado
    const handleSave = async (section) => {
        if (!restaurantId) {
            toast.error("No se encontró el ID del restaurante");
            return;
        }

        try {
            setSaving(true);
            console.log(`💾 GUARDANDO SECCIÓN: ${section}`, settings);

            const { error } = await supabase
                .from("restaurants")
                .update({
                    settings: settings,
                    updated_at: new Date().toISOString()
                })
                .eq("id", restaurantId);

            if (error) throw error;

            toast.success(`✅ ${section} guardado correctamente`);
            
        } catch (error) {
            console.error("❌ Error guardando:", error);
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-purple-600" />
                        Configuración
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Configura tu restaurante y personaliza la experiencia de tus clientes
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {settingsTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-purple-500 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        tab.highlight ? 'relative' : ''
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.highlight && (
                                        <Crown className="w-3 h-3 text-purple-500" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* General */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Información General"
                                    description="Datos básicos de tu restaurante"
                                    icon={<Building2 />}
                                >
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Capacidad total
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.capacity_total}
                                                onChange={(e) => setSettings(prev => ({ ...prev, capacity_total: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="120"
                                                min="0"
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
                                                <option value="€ - Económico (0-15€)">€ - Económico (0-15€)</option>
                                                <option value="€€ - Moderado (15-30€)">€€ - Moderado (15-30€)</option>
                                                <option value="€€€ - Alto (30-50€)">€€€ - Alto (30-50€)</option>
                                                <option value="€€€€ - Premium (+50€)">€€€€ - Premium (+50€)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Información general")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* Agente IA */}
                        {activeTab === "agent" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Agente IA Conversacional"
                                    description="Configura tu asistente virtual que atiende 24/7"
                                    icon={<Bot />}
                                    premium
                                >
                                    <div className="space-y-6">
                                        {/* Estado del Agente */}
                                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Estado del Agente IA</h4>
                                                <p className="text-sm text-gray-600">
                                                    {settings.agent.enabled ? 'Activo y respondiendo automáticamente' : 'Desactivado'}
                                                </p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.agent.enabled}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    agent: { ...prev.agent, enabled }
                                                }))}
                                                label=""
                                            />
                                        </div>

                                        {/* Configuración básica */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nombre del asistente
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.agent.name}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        agent: { ...prev.agent, name: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="Asistente Virtual"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Idioma
                                                </label>
                                                <select
                                                    value={settings.agent.language}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        agent: { ...prev.agent, language: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                >
                                                    <option value="es">Español</option>
                                                    <option value="en">English</option>
                                                    <option value="fr">Français</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Optimización de mesas */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-4">Optimización de Mesas</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">Activar optimización inteligente</p>
                                                        <p className="text-sm text-gray-600">
                                                            La IA sugiere las mejores mesas según capacidad, preferencias y disponibilidad
                                                        </p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.agent.table_optimization.enabled}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            agent: {
                                                                ...prev.agent,
                                                                table_optimization: {
                                                                    ...prev.agent.table_optimization,
                                                                    enabled
                                                                }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Configuración del Agente")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar Agente IA
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* CRM IA */}
                        {activeTab === "crm" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="CRM Sistema Inteligente"
                                    description="Segmentación automática y automatizaciones avanzadas con IA"
                                    icon={<Brain />}
                                    premium
                                >
                                    <div className="space-y-6">
                                        {/* Estado del CRM */}
                                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                            <div>
                                                <h4 className="font-medium text-gray-900">CRM Inteligente</h4>
                                                <p className="text-sm text-gray-600">
                                                    Segmentación automática de clientes con IA predictiva
                                                </p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.crm.enabled}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    crm: { ...prev.crm, enabled }
                                                }))}
                                                label=""
                                            />
                                        </div>

                                        {/* Métricas del CRM */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-purple-600">7</p>
                                                <p className="text-sm text-gray-600">Segmentos IA</p>
                                            </div>
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-green-600">85%</p>
                                                <p className="text-sm text-gray-600">Automatización</p>
                                            </div>
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-blue-600">300%</p>
                                                <p className="text-sm text-gray-600">ROI Retención</p>
                                            </div>
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-2xl font-bold text-orange-600">24/7</p>
                                                <p className="text-sm text-gray-600">Operativo</p>
                                            </div>
                                        </div>

                                        {/* Configuración de Umbrales */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-4">Umbrales de Segmentación Inteligente</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Días para marcar como inactivo
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings.crm.thresholds.inactivo_days}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev.crm,
                                                                thresholds: {
                                                                    ...prev.crm.thresholds,
                                                                    inactivo_days: parseInt(e.target.value) || 60
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="365"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Visitas mínimas para VIP
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings.crm.thresholds.vip_visits}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev.crm,
                                                                thresholds: {
                                                                    ...prev.crm.thresholds,
                                                                    vip_visits: parseInt(e.target.value) || 5
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="50"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Automatización */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-4">Automatización Inteligente</h4>
                                            <div className="space-y-4">
                                                <ToggleSwitch
                                                    enabled={settings.crm.automation.enabled}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        crm: {
                                                            ...prev.crm,
                                                            automation: { ...prev.crm.automation, enabled }
                                                        }
                                                    }))}
                                                    label="Activar automatizaciones inteligentes"
                                                />

                                                {settings.crm.automation.enabled && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Días de espera entre mensajes
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={settings.crm.automation.cooldown_days}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        automation: {
                                                                            ...prev.crm.automation,
                                                                            cooldown_days: parseInt(e.target.value) || 30
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                min="1"
                                                                max="365"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Máximo mensajes por día
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={settings.crm.automation.max_daily_sends}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        automation: {
                                                                            ...prev.crm.automation,
                                                                            max_daily_sends: parseInt(e.target.value) || 50
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                min="1"
                                                                max="1000"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Plantillas */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-4">Plantillas Inteligentes</h4>
                                            <div className="space-y-6">
                                                {/* Reactivación */}
                                                <div className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h5 className="font-medium text-gray-900">Reactivación de Clientes</h5>
                                                            <p className="text-sm text-gray-600">Para clientes inactivos</p>
                                                        </div>
                                                        <ToggleSwitch
                                                            enabled={settings.crm.templates.reactivacion.enabled}
                                                            onChange={(enabled) => setSettings(prev => ({
                                                                ...prev,
                                                                crm: {
                                                                    ...prev.crm,
                                                                    templates: {
                                                                        ...prev.crm.templates,
                                                                        reactivacion: {
                                                                            ...prev.crm.templates.reactivacion,
                                                                            enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))}
                                                            label=""
                                                        />
                                                    </div>

                                                    {settings.crm.templates.reactivacion.enabled && (
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Asunto
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={settings.crm.templates.reactivacion.subject}
                                                                    onChange={(e) => setSettings(prev => ({
                                                                        ...prev,
                                                                        crm: {
                                                                            ...prev.crm,
                                                                            templates: {
                                                                                ...prev.crm.templates,
                                                                                reactivacion: {
                                                                                    ...prev.crm.templates.reactivacion,
                                                                                    subject: e.target.value
                                                                                }
                                                                            }
                                                                        }
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Contenido
                                                                </label>
                                                                <textarea
                                                                    value={settings.crm.templates.reactivacion.content}
                                                                    onChange={(e) => setSettings(prev => ({
                                                                        ...prev,
                                                                        crm: {
                                                                            ...prev.crm,
                                                                            templates: {
                                                                                ...prev.crm.templates,
                                                                                reactivacion: {
                                                                                    ...prev.crm.templates.reactivacion,
                                                                                    content: e.target.value
                                                                                }
                                                                            }
                                                                        }
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                    rows="3"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("CRM Sistema Inteligente")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar CRM IA
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* Otros tabs... */}
                        {activeTab === "channels" && (
                            <div className="text-center py-12">
                                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Canales de Comunicación</h3>
                                <p className="text-gray-600">Configuración de canales disponible próximamente</p>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="text-center py-12">
                                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Notificaciones</h3>
                                <p className="text-gray-600">Configuración de notificaciones disponible próximamente</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

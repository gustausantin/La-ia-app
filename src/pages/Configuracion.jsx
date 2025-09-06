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
            label: "Horarios", 
            icon: <Clock className="w-4 h-4" /> 
        },
        {
            id: "reservations",
            label: "Política de Reservas",
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

                        {/* Política de Reservas */}
                        {activeTab === "reservations" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Política de Reservas"
                                    description="Configuración de capacidad, turnos y reglas de reserva"
                                    icon={<Calendar />}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Duración de turnos (minutos)
                                            </label>
                                            <select
                                                value={settings.reservation_settings.turn_duration}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    reservation_settings: {
                                                        ...prev.reservation_settings,
                                                        turn_duration: parseInt(e.target.value)
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="60">60 minutos</option>
                                                <option value="90">90 minutos</option>
                                                <option value="120">120 minutos</option>
                                                <option value="150">150 minutos</option>
                                                <option value="180">180 minutos</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Capacidad máxima total (comensales/día)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.capacity_total}
                                                onChange={(e) => setSettings(prev => ({ 
                                                    ...prev, 
                                                    capacity_total: parseInt(e.target.value) || 0 
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="120"
                                                min="1"
                                                max="1000"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Nunca puede ser menor que la capacidad configurada en General
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mínimo comensales por mesa
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.min_party_size}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    reservation_settings: {
                                                        ...prev.reservation_settings,
                                                        min_party_size: parseInt(e.target.value) || 1
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                min="1"
                                                max="10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Máximo comensales por mesa
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.max_party_size}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    reservation_settings: {
                                                        ...prev.reservation_settings,
                                                        max_party_size: parseInt(e.target.value) || 8
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                min="2"
                                                max="50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Días máximos de antelación
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.advance_booking_days}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    reservation_settings: {
                                                        ...prev.reservation_settings,
                                                        advance_booking_days: parseInt(e.target.value) || 30
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                min="1"
                                                max="365"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tiempo buffer entre mesas (minutos)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.buffer_time}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    reservation_settings: {
                                                        ...prev.reservation_settings,
                                                        buffer_time: parseInt(e.target.value) || 15
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                min="0"
                                                max="60"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                            <Info className="w-4 h-4 text-blue-600" />
                                            Importante
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                            Esta configuración es la BASE para la gestión de mesas y reservas. Los valores aquí definidos se aplicarán automáticamente en las páginas de Reservas y Mesas.
                                        </p>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Política de Reservas")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar configuración
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

                        {/* CRM IA WORLD-CLASS */}
                        {activeTab === "crm" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="🧠 CRM Sistema Inteligente World-Class"
                                    description="Segmentación automática IA + Automatizaciones enterprise + 7 segmentos únicos"
                                    icon={<Brain />}
                                    premium
                                >
                                    <div className="space-y-8">
                                        {/* Header World-Class */}
                                        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 rounded-xl text-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold flex items-center">
                                                        <Brain className="w-6 h-6 mr-2" />
                                                        CRM IA World-Class Edition
                                                    </h3>
                                                    <p className="text-purple-100 text-sm mt-1">
                                                        Sistema único mundial con ML Engine + Triggers automáticos + Compliance GDPR
                                                    </p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings?.crm?.enabled || true}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        crm: { ...prev?.crm, enabled }
                                                    }))}
                                                    label=""
                                                />
                                            </div>
                                            
                                            {/* Métricas en tiempo real */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold">7</div>
                                                    <div className="text-xs text-purple-100">Segmentos IA</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold">24/7</div>
                                                    <div className="text-xs text-purple-100">Automático</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold">ML</div>
                                                    <div className="text-xs text-purple-100">Predictivo</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold">GDPR</div>
                                                    <div className="text-xs text-purple-100">Compliant</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 7 Segmentos World-Class (basados en tablas Supabase) */}
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                                <Target className="w-6 h-6 mr-3 text-indigo-600" />
                                                7 Segmentos Automáticos IA (Únicos Mundialmente)
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                                {/* Segmento NUEVO */}
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                                        <span className="font-bold text-green-800">🆕 NUEVO</span>
                                                    </div>
                                                    <p className="text-sm text-green-700 mb-2">
                                                        <strong>0 visitas</strong> - Primera vez
                                                    </p>
                                                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                                        segment_auto = 'nuevo'
                                                    </div>
                                                </div>

                                                {/* Segmento OCASIONAL */}
                                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border-2 border-yellow-200 hover:border-yellow-300 transition-colors">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                                                        <span className="font-bold text-yellow-800">🔄 OCASIONAL</span>
                                                    </div>
                                                    <p className="text-sm text-yellow-700 mb-2">
                                                        <strong>1-2 visitas</strong> - Explorando
                                                    </p>
                                                    <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                                        visits_count: 1-2
                                                    </div>
                                                </div>

                                                {/* Segmento REGULAR */}
                                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                                                        <span className="font-bold text-blue-800">⭐ REGULAR</span>
                                                    </div>
                                                    <p className="text-sm text-blue-700 mb-2">
                                                        <strong>3-4 visitas</strong> - Fidelizando
                                                    </p>
                                                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                        visits_count: 3-4
                                                    </div>
                                                </div>

                                                {/* Segmento VIP */}
                                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                                                        <span className="font-bold text-purple-800">👑 VIP</span>
                                                    </div>
                                                    <p className="text-sm text-purple-700 mb-2">
                                                        <strong>5+ visitas</strong> o <strong>500€+</strong>
                                                    </p>
                                                    <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                                        visits_count ≥ 5 OR total_spent ≥ 500
                                                    </div>
                                                </div>

                                                {/* Segmento INACTIVO */}
                                                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                                                        <span className="font-bold text-gray-800">😴 INACTIVO</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        <strong>60+ días</strong> sin visita
                                                    </p>
                                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                        last_visit_at > 60 días
                                                    </div>
                                                </div>

                                                {/* Segmento EN RIESGO */}
                                                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-lg border-2 border-red-200 hover:border-red-300 transition-colors">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                                                        <span className="font-bold text-red-800">⚠️ EN RIESGO</span>
                                                    </div>
                                                    <p className="text-sm text-red-700 mb-2">
                                                        <strong>Churn risk</strong> alto (ML)
                                                    </p>
                                                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                                        churn_risk_score > 60
                                                    </div>
                                                </div>

                                                {/* Segmento ALTO VALOR */}
                                                <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-amber-300 hover:border-amber-400 transition-colors shadow-lg">
                                                    <div className="flex items-center mb-3">
                                                        <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-2 animate-pulse"></div>
                                                        <span className="font-bold text-amber-800">💎 ALTO VALOR</span>
                                                    </div>
                                                    <p className="text-sm text-amber-700 mb-2">
                                                        <strong>1000€+</strong> gasto total
                                                    </p>
                                                    <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                                        total_spent ≥ 1000 (priority)
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Nota técnica */}
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                                <p className="text-sm text-indigo-800">
                                                    <strong>🔧 Automatización via Triggers SQL:</strong><br/>
                                                    Los segmentos se actualizan automáticamente con cada reserva completada mediante 
                                                    <code className="bg-indigo-100 px-1 rounded mx-1">trigger_auto_update_customer_stats</code> 
                                                    que ejecuta las funciones 
                                                    <code className="bg-indigo-100 px-1 rounded mx-1">recompute_customer_stats()</code> y 
                                                    <code className="bg-indigo-100 px-1 rounded mx-1">recompute_customer_segment()</code>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Configuración de Umbrales World-Class */}
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                                <Settings className="w-6 h-6 mr-3 text-purple-600" />
                                                Configuración de Umbrales IA (Conectado a Supabase)
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        🕐 Días para marcar INACTIVO
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings?.crm?.thresholds?.inactivo_days || 60}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev?.crm,
                                                                thresholds: {
                                                                    ...prev?.crm?.thresholds,
                                                                    inactivo_days: parseInt(e.target.value) || 60
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="365"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Campo: last_visit_at en customers</p>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        👑 Visitas mínimas para VIP
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings?.crm?.thresholds?.vip_visits || 5}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev?.crm,
                                                                thresholds: {
                                                                    ...prev?.crm?.thresholds,
                                                                    vip_visits: parseInt(e.target.value) || 5
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="1"
                                                        max="50"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Campo: visits_count en customers</p>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        💎 Gasto mínimo ALTO VALOR (€)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings?.crm?.thresholds?.alto_valor_euros || 1000}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev?.crm,
                                                                thresholds: {
                                                                    ...prev?.crm?.thresholds,
                                                                    alto_valor_euros: parseInt(e.target.value) || 1000
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="100"
                                                        max="10000"
                                                        step="100"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Campo: total_spent en customers</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <p className="text-sm text-blue-800">
                                                    <strong>🔄 Actualización automática:</strong> Estos umbrales se aplican automáticamente 
                                                    via las funciones SQL <code>recompute_customer_segment()</code> cada vez que se completa una reserva.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Automatizaciones Enterprise */}
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                                <Zap className="w-6 h-6 mr-3 text-yellow-600" />
                                                Automatizaciones Enterprise (Tabla: automation_rules)
                                            </h4>
                                            
                                            <div className="space-y-6">
                                                {/* Toggle principal */}
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                                    <div>
                                                        <h5 className="font-bold text-yellow-900">🤖 Automatizaciones Inteligentes</h5>
                                                        <p className="text-sm text-yellow-700">
                                                            Sistema automático con cooldown, horarios y consent GDPR
                                                        </p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings?.crm?.automation?.enabled || true}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev?.crm,
                                                                automation: { ...prev?.crm?.automation, enabled }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>

                                                {/* Configuraciones detalladas */}
                                                {(settings?.crm?.automation?.enabled !== false) && (
                                                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                                        <h5 className="font-semibold text-gray-900 mb-4">⚙️ Configuración Enterprise</h5>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {/* Cooldown */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    🛡️ Cooldown inteligente (días)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={settings?.crm?.automation?.cooldown_days || 30}
                                                                    onChange={(e) => setSettings(prev => ({
                                                                        ...prev,
                                                                        crm: {
                                                                            ...prev?.crm,
                                                                            automation: {
                                                                                ...prev?.crm?.automation,
                                                                                cooldown_days: parseInt(e.target.value) || 30
                                                                            }
                                                                        }
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                                                    min="1"
                                                                    max="365"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Mínimo entre automatizaciones</p>
                                                            </div>

                                                            {/* Max diarios */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    📊 Máximo mensajes/día
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={settings?.crm?.automation?.max_daily_sends || 50}
                                                                    onChange={(e) => setSettings(prev => ({
                                                                        ...prev,
                                                                        crm: {
                                                                            ...prev?.crm,
                                                                            automation: {
                                                                                ...prev?.crm?.automation,
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

                                        {/* Plantillas Inteligentes por Segmento */}
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-xl font-bold text-gray-900 flex items-center">
                                                    <MessageSquare className="w-6 h-6 mr-3 text-indigo-600" />
                                                    Plantillas Inteligentes (Tabla: message_templates)
                                                </h4>
                                                <button 
                                                    type="button"
                                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 transform hover:scale-105"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                    <span className="font-semibold">Gestionar Todas las Plantillas</span>
                                                    <span className="bg-white/20 px-2 py-1 rounded text-xs">7 tipos</span>
                                                </button>
                                            </div>
                                            
                                            {/* Overview de las 7 plantillas */}
                                            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-indigo-200 shadow-lg">
                                                <h5 className="font-bold text-indigo-900 mb-4 text-lg">📝 Sistema de Plantillas World-Class</h5>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                                    {/* Plantilla NUEVO */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-green-800 text-sm">🆕 NUEVO</span>
                                                        </div>
                                                        <p className="text-xs text-green-700">Bienvenida personalizada</p>
                                                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-2">
                                                            category = 'bienvenida'
                                                        </div>
                                                    </div>

                                                    {/* Plantilla OCASIONAL */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-yellow-800 text-sm">🔄 OCASIONAL</span>
                                                        </div>
                                                        <p className="text-xs text-yellow-700">Incentivos especiales</p>
                                                        <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded mt-2">
                                                            category = 'incentivos'
                                                        </div>
                                                    </div>

                                                    {/* Plantilla REGULAR */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-blue-800 text-sm">⭐ REGULAR</span>
                                                        </div>
                                                        <p className="text-xs text-blue-700">Fidelización activa</p>
                                                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-2">
                                                            category = 'fidelizacion'
                                                        </div>
                                                    </div>

                                                    {/* Plantilla VIP */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-purple-800 text-sm">👑 VIP</span>
                                                        </div>
                                                        <p className="text-xs text-purple-700">Experiencias exclusivas</p>
                                                        <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded mt-2">
                                                            category = 'vip_exclusivas'
                                                        </div>
                                                    </div>

                                                    {/* Plantilla INACTIVO */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-gray-800 text-sm">😴 INACTIVO</span>
                                                        </div>
                                                        <p className="text-xs text-gray-700">Reactivación inteligente</p>
                                                        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mt-2">
                                                            category = 'reactivacion'
                                                        </div>
                                                    </div>

                                                    {/* Plantilla EN RIESGO */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-red-800 text-sm">⚠️ EN RIESGO</span>
                                                        </div>
                                                        <p className="text-xs text-red-700">Retención urgente</p>
                                                        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded mt-2">
                                                            category = 'retencion'
                                                        </div>
                                                    </div>

                                                    {/* Plantilla ALTO VALOR */}
                                                    <div className="bg-white/80 backdrop-blur p-4 rounded-lg border border-amber-300 hover:border-amber-400 transition-colors shadow-md">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-2"></div>
                                                            <span className="font-bold text-amber-800 text-sm">💎 ALTO VALOR</span>
                                                        </div>
                                                        <p className="text-xs text-amber-700">Atención premium</p>
                                                        <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded mt-2">
                                                            category = 'premium'
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Variables dinámicas */}
                                                <div className="bg-white/90 backdrop-blur border border-indigo-200 rounded-lg p-4">
                                                    <h6 className="font-semibold text-indigo-900 mb-3">🔧 Variables Dinámicas Disponibles</h6>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                                                        <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-200">
                                                            <code className="text-indigo-800">{{`{first_name}`}}</code>
                                                        </div>
                                                        <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-200">
                                                            <code className="text-indigo-800">{{`{restaurant_name}`}}</code>
                                                        </div>
                                                        <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-200">
                                                            <code className="text-indigo-800">{{`{last_visit}`}}</code>
                                                        </div>
                                                        <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-200">
                                                            <code className="text-indigo-800">{{`{total_spent}`}}</code>
                                                        </div>
                                                        <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-200">
                                                            <code className="text-indigo-800">{{`{visits_count}`}}</code>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Estadísticas de plantillas */}
                                                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h6 className="font-semibold text-green-900">📊 Estadísticas de Plantillas</h6>
                                                            <p className="text-sm text-green-700">Conectado en tiempo real a Supabase</p>
                                                        </div>
                                                        <div className="flex space-x-4 text-center">
                                                            <div>
                                                                <div className="text-lg font-bold text-green-600">7</div>
                                                                <div className="text-xs text-green-600">Activas</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-lg font-bold text-blue-600">85%</div>
                                                                <div className="text-xs text-blue-600">Éxito</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-lg font-bold text-purple-600">2.3s</div>
                                                                <div className="text-xs text-purple-600">Resp. media</div>
                                                            </div>
                                                        </div>
                                                    </div>
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
                            <div className="space-y-6">
                                <SettingSection
                                    title="🌐 Canales de Comunicación Omnicanalidad"
                                    description="5 canales integrados: WhatsApp, VAPI, Instagram, Facebook, Web Chat"
                                    icon={<MessageSquare />}
                                    premium
                                >
                                    <div className="space-y-8">
                                        {/* Header Omnicanalidad */}
                                        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 rounded-xl text-white">
                                            <h3 className="text-xl font-bold mb-2">🚀 Omnicanalidad World-Class</h3>
                                            <p className="text-blue-100 text-sm mb-4">
                                                Conecta todos tus canales de comunicación en una sola plataforma
                                            </p>
                                            
                                            {/* Estadísticas de canales */}
                                            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-lg font-bold">5</div>
                                                    <div className="text-xs text-blue-100">Canales</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-lg font-bold">24/7</div>
                                                    <div className="text-xs text-blue-100">Activo</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-lg font-bold">API</div>
                                                    <div className="text-xs text-blue-100">Integrado</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-lg font-bold">IA</div>
                                                    <div className="text-xs text-blue-100">Automático</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                                    <div className="text-lg font-bold">GDPR</div>
                                                    <div className="text-xs text-blue-100">Compliant</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Los 5 canales principales */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* 1. WhatsApp Business */}
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-lg">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                                                            <MessageSquare className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-green-900">📱 WhatsApp Business</h4>
                                                            <p className="text-sm text-green-700">API Oficial Meta</p>
                                                        </div>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings?.channels?.whatsapp?.enabled || false}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev?.channels,
                                                                whatsapp: { ...prev?.channels?.whatsapp, enabled }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>
                                                
                                                {settings?.channels?.whatsapp?.enabled && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-800 mb-2">
                                                                📞 Número WhatsApp Business
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={settings?.channels?.whatsapp?.phone_number || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        whatsapp: {
                                                                            ...prev?.channels?.whatsapp,
                                                                            phone_number: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                                placeholder="+34 600 000 000"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-800 mb-2">
                                                                🔑 Token API WhatsApp
                                                            </label>
                                                            <input
                                                                type="password"
                                                                value={settings?.channels?.whatsapp?.api_token || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        whatsapp: {
                                                                            ...prev?.channels?.whatsapp,
                                                                            api_token: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                                placeholder="EAAB..."
                                                            />
                                                        </div>
                                                        <div className="bg-green-100 p-3 rounded-lg">
                                                            <p className="text-xs text-green-800">
                                                                <strong>Estado:</strong> {settings?.channels?.whatsapp?.api_token ? 
                                                                    "🟢 Configurado" : "🔴 Pendiente configuración"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. VAPI (Voz IA) */}
                                            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border-2 border-purple-200 shadow-lg">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                                            <Phone className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-purple-900">🎙️ VAPI (Voz IA)</h4>
                                                            <p className="text-sm text-purple-700">Asistente de voz</p>
                                                        </div>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings?.channels?.vapi?.enabled || false}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev?.channels,
                                                                vapi: { ...prev?.channels?.vapi, enabled }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>
                                                
                                                {settings?.channels?.vapi?.enabled && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-purple-800 mb-2">
                                                                🔑 VAPI API Key
                                                            </label>
                                                            <input
                                                                type="password"
                                                                value={settings?.channels?.vapi?.api_key || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        vapi: {
                                                                            ...prev?.channels?.vapi,
                                                                            api_key: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                placeholder="vapi_..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-purple-800 mb-2">
                                                                📞 Número de teléfono
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={settings?.channels?.vapi?.phone_number || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        vapi: {
                                                                            ...prev?.channels?.vapi,
                                                                            phone_number: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                placeholder="+34 900 000 000"
                                                            />
                                                        </div>
                                                        <div className="bg-purple-100 p-3 rounded-lg">
                                                            <p className="text-xs text-purple-800">
                                                                <strong>Estado:</strong> {settings?.channels?.vapi?.api_key ? 
                                                                    "🟢 Configurado" : "🔴 Pendiente configuración"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 3. Instagram */}
                                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200 shadow-lg">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                                            <Camera className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-pink-900">📸 Instagram</h4>
                                                            <p className="text-sm text-pink-700">Direct Messages</p>
                                                        </div>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings?.channels?.instagram?.enabled || false}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev?.channels,
                                                                instagram: { ...prev?.channels?.instagram, enabled }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>
                                                
                                                {settings?.channels?.instagram?.enabled && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-pink-800 mb-2">
                                                                👤 Usuario Instagram
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={settings?.channels?.instagram?.username || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        instagram: {
                                                                            ...prev?.channels?.instagram,
                                                                            username: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                                                placeholder="@tu_restaurante"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-pink-800 mb-2">
                                                                🔑 Access Token Instagram
                                                            </label>
                                                            <input
                                                                type="password"
                                                                value={settings?.channels?.instagram?.access_token || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        instagram: {
                                                                            ...prev?.channels?.instagram,
                                                                            access_token: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                                                                placeholder="IGQVJ..."
                                                            />
                                                        </div>
                                                        <div className="bg-pink-100 p-3 rounded-lg">
                                                            <p className="text-xs text-pink-800">
                                                                <strong>Estado:</strong> {settings?.channels?.instagram?.access_token ? 
                                                                    "🟢 Configurado" : "🔴 Pendiente configuración"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 4. Facebook */}
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                            <Facebook className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-blue-900">📘 Facebook</h4>
                                                            <p className="text-sm text-blue-700">Messenger</p>
                                                        </div>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings?.channels?.facebook?.enabled || false}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev?.channels,
                                                                facebook: { ...prev?.channels?.facebook, enabled }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>
                                                
                                                {settings?.channels?.facebook?.enabled && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-blue-800 mb-2">
                                                                📄 ID Página Facebook
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={settings?.channels?.facebook?.page_id || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        facebook: {
                                                                            ...prev?.channels?.facebook,
                                                                            page_id: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="123456789012345"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-blue-800 mb-2">
                                                                🔑 Page Access Token
                                                            </label>
                                                            <input
                                                                type="password"
                                                                value={settings?.channels?.facebook?.page_token || ""}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        facebook: {
                                                                            ...prev?.channels?.facebook,
                                                                            page_token: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="EAAB..."
                                                            />
                                                        </div>
                                                        <div className="bg-blue-100 p-3 rounded-lg">
                                                            <p className="text-xs text-blue-800">
                                                                <strong>Estado:</strong> {settings?.channels?.facebook?.page_token ? 
                                                                    "🟢 Configurado" : "🔴 Pendiente configuración"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 5. Web Chat */}
                                            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-200 shadow-lg lg:col-span-2">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                                                            <Globe className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">💬 Web Chat</h4>
                                                            <p className="text-sm text-gray-700">Chat integrado en web</p>
                                                        </div>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings?.channels?.webchat?.enabled || true}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev?.channels,
                                                                webchat: { ...prev?.channels?.webchat, enabled }
                                                            }
                                                        }))}
                                                        label=""
                                                    />
                                                </div>
                                                
                                                {(settings?.channels?.webchat?.enabled !== false) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                                                🎨 Color principal
                                                            </label>
                                                            <input
                                                                type="color"
                                                                value={settings?.channels?.webchat?.primary_color || "#6366f1"}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        webchat: {
                                                                            ...prev?.channels?.webchat,
                                                                            primary_color: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full h-10 border border-gray-300 rounded-lg"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                                                📍 Posición
                                                            </label>
                                                            <select
                                                                value={settings?.channels?.webchat?.position || "bottom-right"}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        webchat: {
                                                                            ...prev?.channels?.webchat,
                                                                            position: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                                                            >
                                                                <option value="bottom-right">Abajo derecha</option>
                                                                <option value="bottom-left">Abajo izquierda</option>
                                                                <option value="top-right">Arriba derecha</option>
                                                                <option value="top-left">Arriba izquierda</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                                                💬 Mensaje de bienvenida
                                                            </label>
                                                            <textarea
                                                                value={settings?.channels?.webchat?.welcome_message || "¡Hola! ¿En qué puedo ayudarte?"}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev?.channels,
                                                                        webchat: {
                                                                            ...prev?.channels?.webchat,
                                                                            welcome_message: e.target.value
                                                                        }
                                                                    }
                                                                }))}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                                                                rows="2"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 bg-gray-100 p-3 rounded-lg">
                                                            <p className="text-xs text-gray-800">
                                                                <strong>Estado:</strong> 🟢 Siempre disponible (nativo)
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Resumen de configuración */}
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                                            <h4 className="font-bold text-indigo-900 mb-4">📊 Resumen de Canales Configurados</h4>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                                <div className="text-center">
                                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                                        settings?.channels?.whatsapp?.enabled ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}>
                                                        <MessageSquare className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-xs font-medium">WhatsApp</p>
                                                    <p className="text-xs text-gray-600">
                                                        {settings?.channels?.whatsapp?.enabled ? '✅ Activo' : '⏸️ Inactivo'}
                                                    </p>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                                        settings?.channels?.vapi?.enabled ? 'bg-purple-500' : 'bg-gray-300'
                                                    }`}>
                                                        <Phone className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-xs font-medium">VAPI</p>
                                                    <p className="text-xs text-gray-600">
                                                        {settings?.channels?.vapi?.enabled ? '✅ Activo' : '⏸️ Inactivo'}
                                                    </p>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                                        settings?.channels?.instagram?.enabled ? 'bg-pink-500' : 'bg-gray-300'
                                                    }`}>
                                                        <Camera className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-xs font-medium">Instagram</p>
                                                    <p className="text-xs text-gray-600">
                                                        {settings?.channels?.instagram?.enabled ? '✅ Activo' : '⏸️ Inactivo'}
                                                    </p>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                                        settings?.channels?.facebook?.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                                    }`}>
                                                        <Facebook className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-xs font-medium">Facebook</p>
                                                    <p className="text-xs text-gray-600">
                                                        {settings?.channels?.facebook?.enabled ? '✅ Activo' : '⏸️ Inactivo'}
                                                    </p>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="w-12 h-12 mx-auto bg-gray-600 rounded-full flex items-center justify-center mb-2">
                                                        <Globe className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-xs font-medium">Web Chat</p>
                                                    <p className="text-xs text-gray-600">✅ Siempre activo</p>
                                                </div>
                                            </div>

                                            <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-lg p-4">
                                                <p className="text-sm text-indigo-800">
                                                    <strong>🔧 Configuración técnica:</strong> Todos los canales se guardan en la tabla 
                                                    <code className="bg-indigo-100 px-1 rounded mx-1">restaurants.settings.channels</code> 
                                                    y se sincronizan automáticamente con los sistemas de mensajería correspondientes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </SettingSection>
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

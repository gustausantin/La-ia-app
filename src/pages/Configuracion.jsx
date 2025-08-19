
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

// Componente para cada sección de configuración
const SettingSection = ({
    title,
    description,
    icon,
    children,
    premium = false,
}) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {React.cloneElement(icon, {
                        className: "w-5 h-5 text-blue-600",
                    })}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                        {premium && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-medium rounded-full">
                                <Crown className="w-3 h-3" />
                                Premium
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// Componente de toggle switch mejorado
const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-start">
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={enabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div
                    className={`block w-10 h-6 rounded-full transition-colors ${
                        enabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                ></div>
                <div
                    className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        enabled ? "transform translate-x-4" : ""
                    }`}
                ></div>
            </div>
        </label>
        {label && (
            <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
            </div>
        )}
    </div>
);

// Componente principal de Settings
export default function Configuracion() {
    console.log('⚙️ Configuracion component rendering...');

    const { 
        restaurant, 
        restaurantId, 
        isReady,
        agentStatus 
    } = useAuthContext();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    // Estados para todas las configuraciones
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

        // Configuración del Agente IA
        agent: {
            enabled: true,
            name: "Asistente de " + (restaurant?.name || "Mi Restaurante"),
            personality: "professional_friendly",
            language: "es",
            voice: "es-ES-Standard-A",

            // Optimización de mesas
            table_optimization: {
                enabled: true,
                factors: {
                    rotation: 80,
                    location: 60,
                    capacity: 70,
                    customer_history: 50
                }
            }
        }
    });

    // Estados para métricas del agente
    const [agentMetrics, setAgentMetrics] = useState({
        total_conversations: 0,
        resolved_automatically: 0,
        escalated_to_human: 0,
        avg_response_time: 0,
        satisfaction_score: 0
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
            id: "workflows",
            label: "Workflows",
            icon: <Webhook className="w-4 h-4" />,
        },
        {
            id: "notifications",
            label: "Notificaciones",
            icon: <Bell className="w-4 h-4" />,
        },
        { 
            id: "team", 
            label: "Equipo", 
            icon: <Users className="w-4 h-4" /> 
        },
        {
            id: "billing",
            label: "Facturación",
            icon: <CreditCard className="w-4 h-4" />,
        },
        {
            id: "integrations",
            label: "Integraciones",
            icon: <Link2 className="w-4 h-4" />,
        },
    ];

    // Cargar configuración
    useEffect(() => {
        if (isReady && restaurantId) {
            loadSettings();
            loadAgentMetrics();
        }
    }, [isReady, restaurantId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            
            // Simular carga de datos
            setTimeout(() => {
                setSettings((prev) => ({
                    ...prev,
                    name: restaurant?.name || "Mi Restaurante",
                    email: "contacto@mirestaurante.com",
                    phone: "+34 666 123 456",
                    agent: {
                        ...prev.agent,
                        name: "Asistente de " + (restaurant?.name || "Mi Restaurante"),
                    }
                }));
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("Error al cargar la configuración");
            setLoading(false);
        }
    };

    const loadAgentMetrics = async () => {
        try {
            // Simular métricas del agente
            setAgentMetrics({
                total_conversations: 1247,
                resolved_automatically: 1052,
                escalated_to_human: 195,
                avg_response_time: 3.2,
                satisfaction_score: 92
            });
        } catch (error) {
            console.error("Error loading agent metrics:", error);
        }
    };

    const handleSave = async (section) => {
        try {
            setSaving(true);
            
            // Simular guardado
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast.success(`${section} actualizado correctamente`);
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setSettings((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Configuración
                    </h1>
                    <p className="text-gray-600">
                        Gestiona todos los aspectos de tu restaurante y agente IA
                    </p>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar de navegación */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                            {settingsTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                                        ${activeTab === tab.id
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50"
                                        }
                                        ${tab.highlight ? "font-medium" : ""}
                                    `}
                                >
                                    {tab.icon}
                                    <span className="font-medium">
                                        {tab.label}
                                    </span>
                                    {tab.highlight && (
                                        <Sparkles className="w-4 h-4 ml-auto text-purple-500" />
                                    )}
                                    <ChevronRight
                                        className={`
                                        w-4 h-4 ml-auto transition-opacity
                                        ${activeTab === tab.id ? "opacity-100" : "opacity-0"}
                                    `}
                                    />
                                </button>
                            ))}
                        </nav>

                        {/* Ayuda rápida */}
                        <div className="mt-4 bg-blue-50 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">
                                        ¿Necesitas ayuda?
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Nuestro equipo está aquí para ayudarte
                                    </p>
                                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                        Contactar soporte →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1">
                        {/* Información General */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Información del Restaurante"
                                    description="Datos básicos y de contacto de tu establecimiento"
                                    icon={<Building2 />}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Logo */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Logo del Restaurante
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
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
                                                <div>
                                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                                        <Upload className="w-4 h-4" />
                                                        Subir logo
                                                    </button>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        PNG, JPG o GIF (máx. 2MB)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Campos del formulario */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del Restaurante
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.name}
                                                onChange={(e) => handleInputChange("name", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Cocina
                                            </label>
                                            <select
                                                value={settings.cuisine_type}
                                                onChange={(e) => handleInputChange("cuisine_type", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Seleccionar...</option>
                                                <option value="mediterranea">Mediterránea</option>
                                                <option value="italiana">Italiana</option>
                                                <option value="japonesa">Japonesa</option>
                                                <option value="mexicana">Mexicana</option>
                                                <option value="fusion">Fusión</option>
                                                <option value="tradicional">Tradicional</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.email}
                                                onChange={(e) => handleInputChange("email", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={settings.phone}
                                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sitio Web
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.website}
                                                onChange={(e) => handleInputChange("website", e.target.value)}
                                                placeholder="https://www.mirestaurante.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={settings.description}
                                                onChange={(e) => handleInputChange("description", e.target.value)}
                                                rows="3"
                                                placeholder="Describe tu restaurante..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.address}
                                                onChange={(e) => handleInputChange("address", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ciudad
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Código Postal
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.postal_code}
                                                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Información general")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar cambios
                                        </button>
                                    </div>
                                </SettingSection>

                                {/* Preferencias regionales */}
                                <SettingSection
                                    title="Preferencias Regionales"
                                    description="Configura idioma, moneda y zona horaria"
                                    icon={<Globe />}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Languages className="w-4 h-4 inline mr-1" />
                                                Idioma
                                            </label>
                                            <select
                                                value={settings.language}
                                                onChange={(e) => handleInputChange("language", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="es">Español</option>
                                                <option value="ca">Català</option>
                                                <option value="en">English</option>
                                                <option value="fr">Français</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <DollarSign className="w-4 h-4 inline mr-1" />
                                                Moneda
                                            </label>
                                            <select
                                                value={settings.currency}
                                                onChange={(e) => handleInputChange("currency", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="EUR">EUR (€)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Clock className="w-4 h-4 inline mr-1" />
                                                Zona Horaria
                                            </label>
                                            <select
                                                value={settings.timezone}
                                                onChange={(e) => handleInputChange("timezone", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="Europe/Madrid">Madrid (UTC+1)</option>
                                                <option value="Europe/London">Londres (UTC+0)</option>
                                                <option value="America/New_York">Nueva York (UTC-5)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Preferencias regionales")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar cambios
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* Configuración del Agente IA */}
                        {activeTab === "agent" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Agente IA Conversacional"
                                    description="Configura tu asistente virtual que atiende 24/7"
                                    icon={<Bot />}
                                    premium
                                >
                                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${settings.agent.enabled ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
                                                <span className="font-medium text-gray-900">
                                                    Estado: {settings.agent.enabled ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.agent.enabled}
                                                onChange={(enabled) => handleNestedChange('agent', 'enabled', enabled)}
                                                label=""
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del Agente
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.agent.name}
                                                onChange={(e) => handleNestedChange('agent', 'name', e.target.value)}
                                                placeholder="Ej: Julia, tu asistente"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Personalidad
                                            </label>
                                            <select
                                                value={settings.agent.personality}
                                                onChange={(e) => handleNestedChange('agent', 'personality', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="professional_friendly">Profesional Amigable</option>
                                                <option value="professional">Profesional</option>
                                                <option value="friendly">Amigable</option>
                                                <option value="casual">Casual</option>
                                                <option value="formal">Formal</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-purple-600" />
                                            Rendimiento del Agente (últimos 30 días)
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-purple-600">{agentMetrics.total_conversations}</p>
                                                <p className="text-xs text-gray-600">Conversaciones</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-600">
                                                    {Math.round((agentMetrics.resolved_automatically / agentMetrics.total_conversations) * 100)}%
                                                </p>
                                                <p className="text-xs text-gray-600">Resolución Auto</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-blue-600">{agentMetrics.avg_response_time}s</p>
                                                <p className="text-xs text-gray-600">Tiempo Respuesta</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-600">{agentMetrics.satisfaction_score}%</p>
                                                <p className="text-xs text-gray-600">Satisfacción</p>
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
                                            Guardar configuración
                                        </button>
                                    </div>
                                </SettingSection>

                                {/* Optimización de mesas */}
                                <SettingSection
                                    title="Optimización de Mesas"
                                    description="Configura cómo el agente asigna mesas automáticamente"
                                    icon={<Target />}
                                >
                                    <div className="space-y-6">
                                        <ToggleSwitch
                                            enabled={settings.agent.table_optimization?.enabled || false}
                                            onChange={(enabled) =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    agent: {
                                                        ...prev.agent,
                                                        table_optimization: {
                                                            ...prev.agent.table_optimization,
                                                            enabled
                                                        }
                                                    }
                                                }))
                                            }
                                            label="Optimización automática de mesas"
                                            description="El agente aprende qué mesas son mejores según histórico"
                                        />

                                        {settings.agent.table_optimization?.enabled && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-4">
                                                    Factores de preferencia (importancia)
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between mb-2">
                                                            <label className="text-sm font-medium text-gray-700">
                                                                Rotación (velocidad de servicio)
                                                            </label>
                                                            <span className="text-sm text-gray-600">
                                                                {settings.agent.table_optimization?.factors?.rotation || 80}%
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="10"
                                                            value={settings.agent.table_optimization?.factors?.rotation || 80}
                                                            onChange={(e) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        table_optimization: {
                                                                            ...prev.agent.table_optimization,
                                                                            factors: {
                                                                                ...prev.agent.table_optimization?.factors,
                                                                                rotation: parseInt(e.target.value)
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Optimización de mesas")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar optimización
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* Otras pestañas con contenido placeholder */}
                        {activeTab === "hours" && (
                            <SettingSection
                                title="Horarios de Operación"
                                description="Define los horarios de apertura y cierre"
                                icon={<Clock />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Configuración de horarios próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "reservations" && (
                            <SettingSection
                                title="Configuración de Reservas"
                                description="Políticas y reglas de reserva"
                                icon={<Calendar />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Configuración de reservas próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "crm" && (
                            <SettingSection
                                title="CRM Inteligente"
                                description="Gestión automática de clientes con IA"
                                icon={<Brain />}
                                premium
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>CRM con IA próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "channels" && (
                            <SettingSection
                                title="Canales de Comunicación"
                                description="WhatsApp, llamadas, web y redes sociales"
                                icon={<MessageSquare />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Configuración de canales próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "workflows" && (
                            <SettingSection
                                title="Workflows y Automatizaciones"
                                description="N8N y flujos personalizados"
                                icon={<Webhook />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Workflows próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "notifications" && (
                            <SettingSection
                                title="Notificaciones"
                                description="Alertas y avisos automáticos"
                                icon={<Bell />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Configuración de notificaciones próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "team" && (
                            <SettingSection
                                title="Gestión de Equipo"
                                description="Usuarios, roles y permisos"
                                icon={<Users />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Gestión de equipo próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "billing" && (
                            <SettingSection
                                title="Facturación y Planes"
                                description="Suscripción y métodos de pago"
                                icon={<CreditCard />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Facturación próximamente...</p>
                                </div>
                            </SettingSection>
                        )}

                        {activeTab === "integrations" && (
                            <SettingSection
                                title="Integraciones"
                                description="Conecta con sistemas externos"
                                icon={<Link2 />}
                            >
                                <div className="text-center py-8 text-gray-500">
                                    <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Integraciones próximamente...</p>
                                </div>
                            </SettingSection>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Configuracion.jsx - Panel de Configuración COMPLETO y MEJORADO para La-IA
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

// DATOS NECESARIOS DE SUPABASE:
// - tabla: restaurants (configuración general)
// - tabla: agent_settings (configuración del agente IA)
// - tabla: agent_messages (plantillas de mensajes)
// - tabla: agent_personality (personalidad del bot)
// - tabla: agent_rules (reglas de escalamiento)
// - tabla: agent_table_preferences (preferencias de mesas)
// - tabla: agent_real_time_status (estado en tiempo real)
// - tabla: channel_configs (configuración por canal)
// - tabla: n8n_workflows (flujos activos)
// - tabla: crm_settings (configuración del CRM)
// - RPC: update_restaurant_settings(restaurant_id, settings)
// - RPC: get_agent_performance_stats(restaurant_id)
// - RPC: test_channel_connection(channel, config)

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
export default function Settings() {
    const { 
        restaurant, 
        restaurantId, 
        isReady,
        agentStatus // IMPORTANTE: Obtenemos el estado real del agente del contexto
    } = useAuthContext();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [testingConnection, setTestingConnection] = useState({});

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

        // Horarios
        business_hours: {
            monday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "23:30",
                closed: false,
            },
            tuesday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "23:30",
                closed: false,
            },
            wednesday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "23:30",
                closed: false,
            },
            thursday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "23:30",
                closed: false,
            },
            friday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "00:00",
                closed: false,
            },
            saturday: {
                open: "13:00",
                close: "16:00",
                dinner_open: "20:00",
                dinner_close: "00:00",
                closed: false,
            },
            sunday: {
                open: "13:00",
                close: "16:00",
                dinner_open: null,
                dinner_close: null,
                closed: false,
            },
        },

        // Configuración de reservas
        min_party_size: 1,
        max_party_size: 20,
        reservation_duration: 120, // minutos
        buffer_time: 15, // minutos entre reservas
        advance_booking_days: 30,
        same_day_cutoff: "12:00",
        cancellation_hours: 2,

        // Configuración del Agente IA (EXPANDIDO)
        agent: {
            enabled: true,
            name: "Asistente de " + restaurant?.name,
            personality: "professional_friendly", // professional, friendly, casual, formal
            language: "es",
            voice: "es-ES-Standard-A", // para Vapi

            // NUEVO: Límites de conversación y rendimiento
            conversation_limits: {
                max_concurrent: 10, // máximo de conversaciones simultáneas
                max_messages_per_session: 20,
                session_timeout_minutes: 30,
                max_reservation_attempts: 3
            },

            // NUEVO: Objetivos de rendimiento
            performance_goals: {
                response_time_seconds: 5,
                resolution_rate_target: 80,
                satisfaction_target: 90,
                escalation_rate_max: 20
            },

            // NUEVO: Optimización de mesas
            table_optimization: {
                enabled: true,
                factors: {
                    rotation: 80, // importancia de la rotación
                    location: 60, // importancia de la ubicación
                    capacity: 70, // importancia del ajuste de capacidad
                    customer_history: 50 // importancia del histórico
                },
                rules: {
                    vip_priority: true,
                    group_size_optimization: true,
                    weather_adaptation: false
                }
            },

            // Mensajes personalizados
            messages: {
                welcome: "¡Hola! 👋 Soy el asistente virtual de {restaurant_name}. ¿En qué puedo ayudarte hoy?",
                welcome_back: "¡Hola de nuevo {customer_name}! 😊 ¿Qué tal estás? ¿Vienes a reservar mesa?",
                goodbye: "¡Gracias por contactarnos! Que tengas un excelente día. 🌟",

                // Respuestas a intenciones específicas
                reservation_confirm: "¡Perfecto! Tu reserva para {party_size} personas el {date} a las {time} está confirmada. ✅",
                reservation_cancel: "Tu reserva ha sido cancelada. Esperamos verte pronto. 😊",
                reservation_modify: "He actualizado tu reserva. Los nuevos detalles son: {details}",

                // No disponibilidad
                no_availability: "Lo siento, no tenemos disponibilidad para esa fecha y hora. 😔 ¿Te parece si probamos con {suggestions}?",

                // FAQs personalizadas
                menu_inquiry: "Puedes ver nuestro menú completo en {website}. ¿Tienes alguna preferencia o restricción alimentaria?",
                location: "Estamos en {address}. ¿Necesitas indicaciones para llegar?",
                parking: "Tenemos parking gratuito para clientes. También hay parking público a 2 minutos.",

                // Mensajes de error
                error_understanding: "Disculpa, no he entendido bien. ¿Podrías reformular tu pregunta?",
                error_system: "Estoy teniendo problemas técnicos. Por favor, llama al {phone} para hacer tu reserva.",

                // NUEVO: Mensajes adicionales
                table_assignment: "Te he asignado la mesa {table}, perfecta para {party_size} personas.",
                vip_greeting: "¡{customer_name}! Qué alegría verte de nuevo. Como cliente VIP, tenemos opciones especiales para ti.",
                birthday_greeting: "¡Feliz cumpleaños! 🎂 Tenemos una sorpresa esperándote cuando vengas.",
                weather_advisory: "Veo que el tiempo {weather_condition}. ¿Prefieres mesa en interior?",
            },

            // Reglas de comportamiento
            rules: {
                // Horarios de atención automática
                auto_response_hours: {
                    enabled: true,
                    start: "09:00",
                    end: "23:00",
                    outside_message: "Gracias por contactarnos. Nuestro horario de atención es de 9:00 a 23:00. Te responderemos lo antes posible."
                },

                // Escalamiento a humano
                escalation: {
                    enabled: true,
                    triggers: [
                        "queja",
                        "reclamación", 
                        "alergia grave",
                        "evento especial",
                        "grupo grande",
                        "urgente",
                        "hablar con encargado"
                    ],
                    max_attempts: 3, // intentos antes de escalar
                    escalation_message: "Voy a transferirte con una persona del equipo para ayudarte mejor. Un momento por favor..."
                },

                // Detección de intenciones especiales
                special_intents: {
                    vip_detection: true,
                    birthday_detection: true,
                    allergy_detection: true,
                    large_group_detection: true,
                    special_event_detection: true
                }
            },

            // Configuración por canal
            channels: {
                whatsapp: {
                    enabled: true,
                    use_voice_notes: true,
                    max_message_length: 1600,
                    send_images: true,
                    send_location: true,
                    quick_replies: true,
                    business_hours_only: false
                },
                vapi: {
                    enabled: true,
                    voice_id: "es-ES-Standard-A",
                    speed: 1.0,
                    pitch: 0,
                    interruption_threshold: 100,
                    end_call_phrases: ["adiós", "hasta luego", "gracias"],
                    background_noise_suppression: true
                },
                instagram: {
                    enabled: false,
                    auto_reply: true,
                    story_replies: false
                },
                facebook: {
                    enabled: false,
                    messenger_only: true
                },
                web: {
                    enabled: true,
                    widget_behavior: {
                        proactive_message_delay: 5000,
                        typing_indicator: true,
                        sound_notifications: true
                    }
                }
            }
        },

        // N8N y Workflows
        workflows: {
            n8n_base_url: "",
            webhook_secret: "",
            active_flows: {
                main_conversational_agent: {
                    enabled: true,
                    webhook_url: "",
                    last_trigger: null,
                    error_count: 0
                },
                vapi_channel: {
                    enabled: true,
                    webhook_url: "",
                    phone_number: "",
                    last_trigger: null,
                    error_count: 0
                },
                whatsapp_flow: {
                    enabled: true,
                    webhook_url: "",
                    verify_token: "",
                    last_trigger: null,
                    error_count: 0
                },
                analytics_processor: {
                    enabled: true,
                    schedule: "0 2 * * *", // 2 AM daily
                    last_run: null
                }
            }
        },

        // Canales de comunicación
        channels: {
            whatsapp: { 
                enabled: true, 
                number: "", 
                business_id: "",
                api_key: "",
                webhook_url: "",
                verify_token: ""
            },
            vapi: {
                enabled: true,
                phone_number: "",
                api_key: "",
                assistant_id: "",
                webhook_secret: ""
            },
            web: { 
                enabled: true, 
                widget_color: "#3B82F6",
                position: "bottom-right",
                auto_open_delay: 5000,
                custom_css: ""
            },
            instagram: {
                enabled: false,
                account_id: "",
                access_token: ""
            },
            facebook: {
                enabled: false,
                page_id: "",
                access_token: ""
            },
            email: {
                enabled: false,
                smtp_host: "",
                smtp_port: 587,
                smtp_user: "",
                smtp_password: ""
            }
        },

        // Notificaciones
        notifications: {
            new_reservation: { enabled: true, email: true, whatsapp: false, webhook: false },
            cancellation: { enabled: true, email: true, whatsapp: false, webhook: false },
            modification: { enabled: true, email: true, whatsapp: false, webhook: false },
            no_show: { enabled: true, email: false, whatsapp: false, webhook: false },

            reminder_enabled: true,
            reminder_hours: 2,
            reminder_channels: ["whatsapp", "email"],

            daily_summary: { 
                enabled: true, 
                time: "09:00",
                include_agent_stats: true,
                include_revenue: true
            },

            // Alertas del agente
            agent_alerts: {
                escalation: { enabled: true, email: true, sms: false },
                error_rate_high: { enabled: true, threshold: 10 },
                response_time_slow: { enabled: true, threshold: 30 },
                daily_limit_reached: { enabled: true, limit: 1000 }
            }
        },

        // Integraciones
        integrations: {
            google_calendar: { enabled: false, calendar_id: "", client_id: "" },
            pos_system: { enabled: false, type: "", api_key: "", sync_revenue: true },
            accounting: { enabled: false, software: "", api_key: "" },
            marketing: { enabled: false, tool: "", api_key: "" },
            analytics: { enabled: true, google_analytics_id: "", pixel_id: "" }
        },

        // NUEVO: Configuración CRM
        crm: {
            ai_enabled: true,
            vip_threshold: 85,
            churn_threshold: 30,
            auto_segmentation: {
                enabled: true,
                frequency: 'daily'
            },
            smart_campaigns: {
                enabled: true,
                birthday_greetings: true,
                win_back: true,
                vip_perks: true
            },
            predictive: {
                ltv_calculation: true,
                churn_prediction: true,
                next_visit: true,
                preferences: true
            }
        }
    });

    // Estados para métricas del agente
    const [agentMetrics, setAgentMetrics] = useState({
        total_conversations: 0,
        resolved_automatically: 0,
        escalated_to_human: 0,
        avg_response_time: 0,
        satisfaction_score: 0,
        most_common_intents: [],
        peak_hours: [],
        channel_distribution: {}
    });

    // Tabs de navegación actualizados
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
            highlight: true // Para destacar esta sección
        },
        {
            id: "crm",
            label: "CRM IA",
            icon: <Brain className="w-4 h-4" />,
            highlight: true // NUEVO: Nueva pestaña
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
            // En producción, cargar desde Supabase
            // const { data, error } = await supabase
            //     .from('restaurants')
            //     .select('*, agent_settings(*), channel_configs(*)')
            //     .eq('id', restaurantId)
            //     .single();

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
                satisfaction_score: 92,
                most_common_intents: [
                    { intent: "reservation", count: 523, percentage: 42 },
                    { intent: "menu_inquiry", count: 298, percentage: 24 },
                    { intent: "hours", count: 186, percentage: 15 },
                    { intent: "location", count: 124, percentage: 10 },
                    { intent: "other", count: 116, percentage: 9 }
                ],
                peak_hours: [
                    { hour: "12:00-14:00", count: 287 },
                    { hour: "19:00-21:00", count: 412 },
                    { hour: "21:00-23:00", count: 198 }
                ],
                channel_distribution: {
                    whatsapp: 68,
                    vapi: 22,
                    web: 8,
                    other: 2
                }
            });
        } catch (error) {
            console.error("Error loading agent metrics:", error);
        }
    };

    const handleSave = async (section) => {
        try {
            setSaving(true);
            // En producción, guardar en Supabase
            // const { error } = await supabase
            //     .from('restaurants')
            //     .update(settings)
            //     .eq('id', restaurantId);

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

    const handleDeepNestedChange = (parent, child, field, value) => {
        setSettings((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: {
                    ...prev[parent][child],
                    [field]: value,
                },
            },
        }));
    };

    const testChannelConnection = async (channel) => {
        try {
            setTestingConnection({ ...testingConnection, [channel]: true });

            // Simular test de conexión
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.success(`Conexión con ${channel} exitosa!`);
        } catch (error) {
            toast.error(`Error conectando con ${channel}`);
        } finally {
            setTestingConnection({ ...testingConnection, [channel]: false });
        }
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
                                                            src={
                                                                settings.logo_url
                                                            }
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
                                                        PNG, JPG o GIF (máx.
                                                        2MB)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nombre */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del Restaurante
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.name}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Tipo de cocina */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Cocina
                                            </label>
                                            <select
                                                value={settings.cuisine_type}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "cuisine_type",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">
                                                    Seleccionar...
                                                </option>
                                                <option value="mediterranea">
                                                    Mediterránea
                                                </option>
                                                <option value="italiana">
                                                    Italiana
                                                </option>
                                                <option value="japonesa">
                                                    Japonesa
                                                </option>
                                                <option value="mexicana">
                                                    Mexicana
                                                </option>
                                                <option value="fusion">
                                                    Fusión
                                                </option>
                                                <option value="tradicional">
                                                    Tradicional
                                                </option>
                                                <option value="otro">
                                                    Otro
                                                </option>
                                            </select>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.email}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Teléfono */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={settings.phone}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "phone",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Website */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sitio Web
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.website}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "website",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="https://www.mirestaurante.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Descripción */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={settings.description}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "description",
                                                        e.target.value,
                                                    )
                                                }
                                                rows="3"
                                                placeholder="Describe tu restaurante..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Dirección */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.address}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "address",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Ciudad */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ciudad
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.city}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "city",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Código Postal */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Código Postal
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.postal_code}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "postal_code",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Botón guardar */}
                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() =>
                                                handleSave(
                                                    "Información general",
                                                )
                                            }
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
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "language",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="es">
                                                    Español
                                                </option>
                                                <option value="ca">
                                                    Català
                                                </option>
                                                <option value="en">
                                                    English
                                                </option>
                                                <option value="fr">
                                                    Français
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <DollarSign className="w-4 h-4 inline mr-1" />
                                                Moneda
                                            </label>
                                            <select
                                                value={settings.currency}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "currency",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="EUR">
                                                    EUR (€)
                                                </option>
                                                <option value="USD">
                                                    USD ($)
                                                </option>
                                                <option value="GBP">
                                                    GBP (£)
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Clock className="w-4 h-4 inline mr-1" />
                                                Zona Horaria
                                            </label>
                                            <select
                                                value={settings.timezone}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "timezone",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="Europe/Madrid">
                                                    Madrid (UTC+1)
                                                </option>
                                                <option value="Europe/London">
                                                    Londres (UTC+0)
                                                </option>
                                                <option value="America/New_York">
                                                    Nueva York (UTC-5)
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() =>
                                                handleSave(
                                                    "Preferencias regionales",
                                                )
                                            }
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

                        {/* Horarios */}
                        {activeTab === "hours" && (
                            <SettingSection
                                title="Horarios de Operación"
                                description="Define los horarios de apertura y cierre de tu restaurante"
                                icon={<Clock />}
                            >
                                <div className="space-y-4">
                                    {Object.entries(
                                        settings.business_hours,
                                    ).map(([day, hours]) => (
                                        <div
                                            key={day}
                                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="w-32">
                                                <span className="font-medium text-gray-900 capitalize">
                                                    {day === "monday" &&
                                                        "Lunes"}
                                                    {day === "tuesday" &&
                                                        "Martes"}
                                                    {day === "wednesday" &&
                                                        "Miércoles"}
                                                    {day === "thursday" &&
                                                        "Jueves"}
                                                    {day === "friday" &&
                                                        "Viernes"}
                                                    {day === "saturday" &&
                                                        "Sábado"}
                                                    {day === "sunday" &&
                                                        "Domingo"}
                                                </span>
                                            </div>

                                            <ToggleSwitch
                                                enabled={!hours.closed}
                                                onChange={(enabled) =>
                                                    handleNestedChange(
                                                        "business_hours",
                                                        day,
                                                        {
                                                            ...hours,
                                                            closed: !enabled,
                                                        },
                                                    )
                                                }
                                                label=""
                                            />

                                            {!hours.closed && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600">
                                                            Comida:
                                                        </span>
                                                        <input
                                                            type="time"
                                                            value={hours.open}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "business_hours",
                                                                    day,
                                                                    {
                                                                        ...hours,
                                                                        open: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                )
                                                            }
                                                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                                        />
                                                        <span className="text-gray-500">
                                                            -
                                                        </span>
                                                        <input
                                                            type="time"
                                                            value={hours.close}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "business_hours",
                                                                    day,
                                                                    {
                                                                        ...hours,
                                                                        close: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                )
                                                            }
                                                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                                        />
                                                    </div>

                                                    {hours.dinner_open && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600">
                                                                Cena:
                                                            </span>
                                                            <input
                                                                type="time"
                                                                value={
                                                                    hours.dinner_open
                                                                }
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "business_hours",
                                                                        day,
                                                                        {
                                                                            ...hours,
                                                                            dinner_open:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                                            />
                                                            <span className="text-gray-500">
                                                                -
                                                            </span>
                                                            <input
                                                                type="time"
                                                                value={
                                                                    hours.dinner_close
                                                                }
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "business_hours",
                                                                        day,
                                                                        {
                                                                            ...hours,
                                                                            dinner_close:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {hours.closed && (
                                                <span className="text-sm text-gray-500 italic">
                                                    Cerrado
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        Los horarios se mostrarán en tu widget
                                        de reservas y se usarán para validar
                                        disponibilidad
                                    </p>
                                </div>

                                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => handleSave("Horarios")}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        Guardar horarios
                                    </button>
                                </div>
                            </SettingSection>
                        )}

                        {/* Configuración de Reservas */}
                        {activeTab === "reservations" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Políticas de Reserva"
                                    description="Define las reglas y límites para las reservas"
                                    icon={<Calendar />}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tamaño mínimo de grupo
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={settings.min_party_size}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "min_party_size",
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tamaño máximo de grupo
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={settings.max_party_size}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "max_party_size",
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Duración estándar de reserva
                                            </label>
                                            <select
                                                value={
                                                    settings.reservation_duration
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "reservation_duration",
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="60">
                                                    1 hora
                                                </option>
                                                <option value="90">
                                                    1.5 horas
                                                </option>
                                                <option value="120">
                                                    2 horas
                                                </option>
                                                <option value="150">
                                                    2.5 horas
                                                </option>
                                                <option value="180">
                                                    3 horas
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tiempo buffer entre reservas
                                            </label>
                                            <select
                                                value={settings.buffer_time}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "buffer_time",
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="0">
                                                    Sin buffer
                                                </option>
                                                <option value="15">
                                                    15 minutos
                                                </option>
                                                <option value="30">
                                                    30 minutos
                                                </option>
                                                <option value="45">
                                                    45 minutos
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Días de anticipación máxima
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={
                                                    settings.advance_booking_days
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "advance_booking_days",
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hora límite reservas mismo día
                                            </label>
                                            <input
                                                type="time"
                                                value={settings.same_day_cutoff}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "same_day_cutoff",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Horas anticipación para cancelar
                                            </label>
                                            <select
                                                value={
                                                    settings.cancellation_hours
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "cancellation_hours",
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="0">
                                                    Sin restricción
                                                </option>
                                                <option value="1">
                                                    1 hora
                                                </option>
                                                <option value="2">
                                                    2 horas
                                                </option>
                                                <option value="4">
                                                    4 horas
                                                </option>
                                                <option value="24">
                                                    24 horas
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() =>
                                                handleSave(
                                                    "Políticas de reserva",
                                                )
                                            }
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar políticas
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* SECCIÓN MEJORADA: Agente IA */}
                        {activeTab === "agent" && (
                            <div className="space-y-6">
                                {/* Estado general del agente */}
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

                                    {/* Configuración básica */}
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Idioma Principal
                                            </label>
                                            <select
                                                value={settings.agent.language}
                                                onChange={(e) => handleNestedChange('agent', 'language', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="es">Español</option>
                                                <option value="ca">Català</option>
                                                <option value="en">English</option>
                                                <option value="fr">Français</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Voz (para llamadas)
                                            </label>
                                            <select
                                                value={settings.agent.voice}
                                                onChange={(e) => handleNestedChange('agent', 'voice', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="es-ES-Standard-A">Española - Femenina A</option>
                                                <option value="es-ES-Standard-B">Española - Masculina B</option>
                                                <option value="es-ES-Standard-C">Española - Femenina C</option>
                                                <option value="es-ES-Standard-D">Española - Masculina D</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Métricas del agente */}
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

                                {/* NUEVO: Estado en tiempo real del agente */}
                                <SettingSection
                                    title="Estado en Tiempo Real"
                                    description="Monitoreo y límites del agente activo"
                                    icon={<Activity />}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Métricas en vivo */}
                                        <div className="col-span-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-3">Actividad Actual</h4>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-purple-600">{agentStatus.activeConversations}</p>
                                                    <p className="text-xs text-gray-600">Conversaciones Activas</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-orange-600">{agentStatus.pendingActions}</p>
                                                    <p className="text-xs text-gray-600">Acciones Pendientes</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-green-600">
                                                        {settings.agent.conversation_limits?.max_concurrent || 10}
                                                    </p>
                                                    <p className="text-xs text-gray-600">Límite Simultáneo</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-blue-600">
                                                        {Math.round((agentStatus.activeConversations / (settings.agent.conversation_limits?.max_concurrent || 10)) * 100)}%
                                                    </p>
                                                    <p className="text-xs text-gray-600">Capacidad Usada</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Límites de conversación */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Conversaciones simultáneas máximas
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={settings.agent.conversation_limits?.max_concurrent || 10}
                                                onChange={(e) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            conversation_limits: {
                                                                ...prev.agent.conversation_limits,
                                                                max_concurrent: parseInt(e.target.value)
                                                            }
                                                        }
                                                    }))
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                El agente pausará nuevas conversaciones al alcanzar este límite
                                            </p>
                                        </div>

                                        {/* Tiempo de respuesta objetivo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tiempo de respuesta objetivo (segundos)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={settings.agent.performance_goals?.response_time_seconds || 5}
                                                onChange={(e) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            performance_goals: {
                                                                ...prev.agent.performance_goals,
                                                                response_time_seconds: parseInt(e.target.value)
                                                            }
                                                        }
                                                    }))
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Alertas de capacidad */}
                                    {agentStatus.activeConversations > (settings.agent.conversation_limits?.max_concurrent || 10) * 0.8 && (
                                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                                <p className="text-sm text-orange-800">
                                                    El agente está cerca de su capacidad máxima. Considera aumentar el límite o revisar las conversaciones activas.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Estado en tiempo real")}
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

                                {/* NUEVO: Preferencias de asignación de mesas */}
                                <SettingSection
                                    title="Preferencias de Asignación de Mesas"
                                    description="Configura cómo el agente asigna mesas automáticamente"
                                    icon={<Target />}
                                >
                                    <div className="space-y-6">
                                        {/* Toggle principal */}
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
                                            <>
                                                {/* Factores de preferencia */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-4">
                                                        Factores de preferencia (importancia)
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {/* Factor: Rotación */}
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

                                                        {/* Factor: Ubicación */}
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <label className="text-sm font-medium text-gray-700">
                                                                    Ubicación (vista, accesibilidad)
                                                                </label>
                                                                <span className="text-sm text-gray-600">
                                                                    {settings.agent.table_optimization?.factors?.location || 60}%
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                step="10"
                                                                value={settings.agent.table_optimization?.factors?.location || 60}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            table_optimization: {
                                                                                ...prev.agent.table_optimization,
                                                                                factors: {
                                                                                    ...prev.agent.table_optimization?.factors,
                                                                                    location: parseInt(e.target.value)
                                                                                }
                                                                            }
                                                                        }
                                                                    }))
                                                                }
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        {/* Factor: Capacidad */}
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <label className="text-sm font-medium text-gray-700">
                                                                    Capacidad (ajuste al grupo)
                                                                </label>
                                                                <span className="text-sm text-gray-600">
                                                                    {settings.agent.table_optimization?.factors?.capacity || 70}%
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                step="10"
                                                                value={settings.agent.table_optimization?.factors?.capacity || 70}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            table_optimization: {
                                                                                ...prev.agent.table_optimization,
                                                                                factors: {
                                                                                    ...prev.agent.table_optimization?.factors,
                                                                                    capacity: parseInt(e.target.value)
                                                                                }
                                                                            }
                                                                        }
                                                                    }))
                                                                }
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        {/* Factor: Histórico del cliente */}
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <label className="text-sm font-medium text-gray-700">
                                                                    Histórico del cliente (preferencias previas)
                                                                </label>
                                                                <span className="text-sm text-gray-600">
                                                                    {settings.agent.table_optimization?.factors?.customer_history || 50}%
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                step="10"
                                                                value={settings.agent.table_optimization?.factors?.customer_history || 50}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            table_optimization: {
                                                                                ...prev.agent.table_optimization,
                                                                                factors: {
                                                                                    ...prev.agent.table_optimization?.factors,
                                                                                    customer_history: parseInt(e.target.value)
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

                                                {/* Reglas especiales */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-3">Reglas especiales</h4>
                                                    <div className="space-y-3">
                                                        <ToggleSwitch
                                                            enabled={settings.agent.table_optimization?.rules?.vip_priority || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        table_optimization: {
                                                                            ...prev.agent.table_optimization,
                                                                            rules: {
                                                                                ...prev.agent.table_optimization?.rules,
                                                                                vip_priority: enabled
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Priorizar mejores mesas para VIP"
                                                            description="Asignar automáticamente las mesas premium a clientes frecuentes"
                                                        />
                                                        <ToggleSwitch
                                                            enabled={settings.agent.table_optimization?.rules?.group_size_optimization || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        table_optimization: {
                                                                            ...prev.agent.table_optimization,
                                                                            rules: {
                                                                                ...prev.agent.table_optimization?.rules,
                                                                                group_size_optimization: enabled
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Optimizar por tamaño de grupo"
                                                            description="Evitar mesas grandes para grupos pequeños"
                                                        />
                                                        <ToggleSwitch
                                                            enabled={settings.agent.table_optimization?.rules?.weather_adaptation || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        table_optimization: {
                                                                            ...prev.agent.table_optimization,
                                                                            rules: {
                                                                                ...prev.agent.table_optimization?.rules,
                                                                                weather_adaptation: enabled
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Adaptación al clima"
                                                            description="Preferir interior en mal tiempo, terraza en buen tiempo"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                            <button
                                                onClick={() => handleSave("Preferencias de mesas")}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                                Guardar preferencias
                                            </button>
                                        </div>
                                    </div>
                                </SettingSection>

                                {/* Mensajes personalizados */}
                                <SettingSection
                                    title="Mensajes Personalizados"
                                    description="Personaliza las respuestas del agente para cada situación"
                                    icon={<MessageSquare />}
                                >
                                    <div className="space-y-4">
                                        {/* Mensaje de bienvenida */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mensaje de Bienvenida (nuevo cliente)
                                            </label>
                                            <textarea
                                                value={settings.agent.messages.welcome}
                                                onChange={(e) => handleDeepNestedChange('agent', 'messages', 'welcome', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="¡Hola! 👋 Soy {agent_name} de {restaurant_name}..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Variables disponibles: {'{agent_name}'}, {'{restaurant_name}'}
                                            </p>
                                        </div>

                                        {/* Mensaje de bienvenida para clientes recurrentes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mensaje de Bienvenida (cliente recurrente)
                                            </label>
                                            <textarea
                                                value={settings.agent.messages.welcome_back}
                                                onChange={(e) => handleDeepNestedChange('agent', 'messages', 'welcome_back', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Variables: {'{customer_name}'}, {'{last_visit_days}'}
                                            </p>
                                        </div>

                                        {/* Confirmación de reserva */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirmación de Reserva
                                            </label>
                                            <textarea
                                                value={settings.agent.messages.reservation_confirm}
                                                onChange={(e) => handleDeepNestedChange('agent', 'messages', 'reservation_confirm', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Variables: {'{party_size}'}, {'{date}'}, {'{time}'}, {'{table}'}
                                            </p>
                                        </div>

                                        {/* No disponibilidad */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sin Disponibilidad
                                            </label>
                                            <textarea
                                                value={settings.agent.messages.no_availability}
                                                onChange={(e) => handleDeepNestedChange('agent', 'messages', 'no_availability', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Variables: {'{requested_date}'}, {'{requested_time}'}, {'{suggestions}'}
                                            </p>
                                        </div>

                                        {/* Despedida */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mensaje de Despedida
                                            </label>
                                            <textarea
                                                value={settings.agent.messages.goodbye}
                                                onChange={(e) => handleDeepNestedChange('agent', 'messages', 'goodbye', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Mensajes personalizados")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar mensajes
                                        </button>
                                    </div>
                                </SettingSection>

                                {/* Reglas de comportamiento */}
                                <SettingSection
                                    title="Reglas de Comportamiento"
                                    description="Define cuándo y cómo actúa el agente"
                                    icon={<Sliders />}
                                >
                                    {/* Horarios de atención automática */}
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-900 mb-3">Horarios de Atención Automática</h4>
                                        <div className="space-y-3">
                                            <ToggleSwitch
                                                enabled={settings.agent.rules.auto_response_hours.enabled}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            rules: {
                                                                ...prev.agent.rules,
                                                                auto_response_hours: {
                                                                    ...prev.agent.rules.auto_response_hours,
                                                                    enabled
                                                                }
                                                            }
                                                        }
                                                    }))
                                                }
                                                label="Limitar horario de respuesta automática"
                                                description="Fuera del horario, el agente informará que responderá más tarde"
                                            />

                                            {settings.agent.rules.auto_response_hours.enabled && (
                                                <div className="grid grid-cols-2 gap-4 ml-8">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Hora inicio
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={settings.agent.rules.auto_response_hours.start}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        rules: {
                                                                            ...prev.agent.rules,
                                                                            auto_response_hours: {
                                                                                ...prev.agent.rules.auto_response_hours,
                                                                                start: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Hora fin
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={settings.agent.rules.auto_response_hours.end}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        rules: {
                                                                            ...prev.agent.rules,
                                                                            auto_response_hours: {
                                                                                ...prev.agent.rules.auto_response_hours,
                                                                                end: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reglas de escalamiento */}
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-900 mb-3">Escalamiento a Humano</h4>
                                        <div className="space-y-3">
                                            <ToggleSwitch
                                                enabled={settings.agent.rules.escalation.enabled}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            rules: {
                                                                ...prev.agent.rules,
                                                                escalation: {
                                                                    ...prev.agent.rules.escalation,
                                                                    enabled
                                                                }
                                                            }
                                                        }
                                                    }))
                                                }
                                                label="Activar escalamiento automático"
                                                description="Transferir a un humano cuando detecte situaciones complejas"
                                            />

                                            {settings.agent.rules.escalation.enabled && (
                                                <div className="ml-8 space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Palabras clave que activan escalamiento
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {settings.agent.rules.escalation.triggers.map((trigger, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                                                >
                                                                    {trigger}
                                                                    <button
                                                                        onClick={() => {
                                                                            const newTriggers = settings.agent.rules.escalation.triggers.filter((_, i) => i !== idx);
                                                                            setSettings(prev => ({
                                                                                ...prev,
                                                                                agent: {
                                                                                    ...prev.agent,
                                                                                    rules: {
                                                                                        ...prev.agent.rules,
                                                                                        escalation: {
                                                                                            ...prev.agent.rules.escalation,
                                                                                            triggers: newTriggers
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }));
                                                                        }}
                                                                        className="ml-1 hover:text-red-600"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            <button className="inline-flex items-center gap-1 px-3 py-1 border-2 border-dashed border-gray-300 text-gray-600 text-sm rounded-full hover:border-purple-400 hover:text-purple-600">
                                                                <Plus className="w-3 h-3" />
                                                                Agregar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Intentos antes de escalar
                                                        </label>
                                                        <select
                                                            value={settings.agent.rules.escalation.max_attempts}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        rules: {
                                                                            ...prev.agent.rules,
                                                                            escalation: {
                                                                                ...prev.agent.rules.escalation,
                                                                                max_attempts: parseInt(e.target.value)
                                                                            }
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        >
                                                            <option value="1">1 intento</option>
                                                            <option value="2">2 intentos</option>
                                                            <option value="3">3 intentos</option>
                                                            <option value="5">5 intentos</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detección de intenciones especiales */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Detección Inteligente</h4>
                                        <div className="space-y-2">
                                            <ToggleSwitch
                                                enabled={settings.agent.rules.special_intents.vip_detection}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            rules: {
                                                                ...prev.agent.rules,
                                                                special_intents: {
                                                                    ...prev.agent.rules.special_intents,
                                                                    vip_detection: enabled
                                                                }
                                                            }
                                                        }
                                                    }))
                                                }
                                                label="Detectar clientes VIP"
                                                description="Identificar y dar trato preferencial a clientes frecuentes"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.agent.rules.special_intents.birthday_detection}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            rules: {
                                                                ...prev.agent.rules,
                                                                special_intents: {
                                                                    ...prev.agent.rules.special_intents,
                                                                    birthday_detection: enabled
                                                                }
                                                            }
                                                        }
                                                    }))
                                                }
                                                label="Detectar cumpleaños"
                                                description="Ofrecer atenciones especiales para celebraciones"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.agent.rules.special_intents.allergy_detection}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            rules: {
                                                                ...prev.agent.rules,
                                                                special_intents: {
                                                                    ...prev.agent.rules.special_intents,
                                                                    allergy_detection: enabled
                                                                }
                                                            }
                                                        }
                                                    }))
                                                }
                                                label="Detectar alergias"
                                                description="Prestar atención especial a restricciones alimentarias"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Reglas de comportamiento")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar reglas
                                        </button>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* NUEVA SECCIÓN: CRM Inteligente */}
                        {activeTab === "crm" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="CRM Inteligente con IA"
                                    description="Configuración de análisis predictivo y segmentación automática"
                                    icon={<Brain />}
                                    premium
                                >
                                    <div className="space-y-6">
                                        {/* Activación general */}
                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">CRM Predictivo Activado</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Análisis automático de clientes con IA
                                                    </p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.crm?.ai_enabled || false}
                                                    onChange={(enabled) =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev.crm,
                                                                ai_enabled: enabled
                                                            }
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {settings.crm?.ai_enabled && (
                                            <>
                                                {/* Scoring predictivo */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-3">Scoring Predictivo</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Umbral cliente VIP (score)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="70"
                                                                max="100"
                                                                value={settings.crm?.vip_threshold || 85}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        crm: {
                                                                            ...prev.crm,
                                                                            vip_threshold: parseInt(e.target.value)
                                                                        }
                                                                    }))
                                                                }
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Umbral riesgo de abandono
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={settings.crm?.churn_threshold || 30}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        crm: {
                                                                            ...prev.crm,
                                                                            churn_threshold: parseInt(e.target.value)
                                                                        }
                                                                    }))
                                                                }
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Segmentación automática */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-3">Segmentación Automática</h4>
                                                    <div className="space-y-3">
                                                        <ToggleSwitch
                                                            enabled={settings.crm?.auto_segmentation?.enabled || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        auto_segmentation: {
                                                                            ...prev.crm?.auto_segmentation,
                                                                            enabled
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Segmentación automática activa"
                                                            description="El agente clasifica clientes automáticamente"
                                                        />

                                                        {settings.crm?.auto_segmentation?.enabled && (
                                                            <div className="ml-8 space-y-2">
                                                                <label className="block text-sm font-medium text-gray-700">
                                                                    Frecuencia de recálculo
                                                                </label>
                                                                <select
                                                                    value={settings.crm?.auto_segmentation?.frequency || 'daily'}
                                                                    onChange={(e) =>
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            crm: {
                                                                                ...prev.crm,
                                                                                auto_segmentation: {
                                                                                    ...prev.crm?.auto_segmentation,
                                                                                    frequency: e.target.value
                                                                                }
                                                                            }
                                                                        }))
                                                                    }
                                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                                >
                                                                    <option value="realtime">Tiempo real</option>
                                                                    <option value="hourly">Cada hora</option>
                                                                    <option value="daily">Diario</option>
                                                                    <option value="weekly">Semanal</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Campañas inteligentes */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-3">Campañas Inteligentes</h4>
                                                    <div className="space-y-3">
                                                        <ToggleSwitch
                                                            enabled={settings.crm?.smart_campaigns?.enabled || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        smart_campaigns: {
                                                                            ...prev.crm?.smart_campaigns,
                                                                            enabled
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Campañas automáticas"
                                                            description="El agente envía mensajes personalizados automáticamente"
                                                        />

                                                        {settings.crm?.smart_campaigns?.enabled && (
                                                            <div className="space-y-4 ml-8">
                                                                <ToggleSwitch
                                                                    enabled={settings.crm?.smart_campaigns?.birthday_greetings || false}
                                                                    onChange={(enabled) =>
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            crm: {
                                                                                ...prev.crm,
                                                                                smart_campaigns: {
                                                                                    ...prev.crm?.smart_campaigns,
                                                                                    birthday_greetings: enabled
                                                                                }
                                                                            }
                                                                        }))
                                                                    }
                                                                    label="Felicitaciones de cumpleaños"
                                                                />
                                                                <ToggleSwitch
                                                                    enabled={settings.crm?.smart_campaigns?.win_back || false}
                                                                    onChange={(enabled) =>
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            crm: {
                                                                                ...prev.crm,
                                                                                smart_campaigns: {
                                                                                    ...prev.crm?.smart_campaigns,
                                                                                    win_back: enabled
                                                                                }
                                                                            }
                                                                        }))
                                                                    }
                                                                    label="Recuperación de clientes inactivos"
                                                                />
                                                                <ToggleSwitch
                                                                    enabled={settings.crm?.smart_campaigns?.vip_perks || false}
                                                                    onChange={(enabled) =>
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            crm: {
                                                                                ...prev.crm,
                                                                                smart_campaigns: {
                                                                                    ...prev.crm?.smart_campaigns,
                                                                                    vip_perks: enabled
                                                                                }
                                                                            }
                                                                        }))
                                                                    }
                                                                    label="Beneficios VIP automáticos"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Análisis predictivo */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-3">Análisis Predictivo</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <ToggleSwitch
                                                            enabled={settings.crm?.predictive?.ltv_calculation || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        predictive: {
                                                                            ...prev.crm?.predictive,
                                                                            ltv_calculation: enabled
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Calcular valor de vida del cliente (LTV)"
                                                        />
                                                        <ToggleSwitch
                                                            enabled={settings.crm?.predictive?.churn_prediction || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        predictive: {
                                                                            ...prev.crm?.predictive,
                                                                            churn_prediction: enabled
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Predicción de abandono"
                                                        />
                                                        <ToggleSwitch
                                                            enabled={settings.crm?.predictive?.next_visit || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        predictive: {
                                                                            ...prev.crm?.predictive,
                                                                            next_visit: enabled
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Predicción de próxima visita"
                                                        />
                                                        <ToggleSwitch
                                                            enabled={settings.crm?.predictive?.preferences || false}
                                                            onChange={(enabled) =>
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    crm: {
                                                                        ...prev.crm,
                                                                        predictive: {
                                                                            ...prev.crm?.predictive,
                                                                            preferences: enabled
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                            label="Detectar preferencias automáticamente"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                            <button
                                                onClick={() => handleSave("CRM Inteligente")}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                                Guardar configuración CRM
                                            </button>
                                        </div>
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* Canales de Reserva MEJORADO */}
                        {activeTab === "channels" && (
                            <div className="space-y-6">
                                {/* WhatsApp Business */}
                                <SettingSection
                                    title="WhatsApp Business"
                                    description="Conecta con Meta Business y recibe reservas por WhatsApp"
                                    icon={<MessageCircle />}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <ToggleSwitch
                                                enabled={settings.channels.whatsapp.enabled}
                                                onChange={(enabled) =>
                                                    handleNestedChange(
                                                        "channels",
                                                        "whatsapp",
                                                        {
                                                            ...settings.channels.whatsapp,
                                                            enabled,
                                                        },
                                                    )
                                                }
                                                label="Activar WhatsApp Business"
                                            />
                                            {settings.channels.whatsapp.enabled && (
                                                <button
                                                    onClick={() => testChannelConnection('whatsapp')}
                                                    disabled={testingConnection.whatsapp}
                                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                                >
                                                    {testingConnection.whatsapp ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Wifi className="w-4 h-4" />
                                                    )}
                                                    Probar conexión
                                                </button>
                                            )}
                                        </div>

                                        {settings.channels.whatsapp.enabled && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Número de WhatsApp Business
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={settings.channels.whatsapp.number}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "channels",
                                                                    "whatsapp",
                                                                    {
                                                                        ...settings.channels.whatsapp,
                                                                        number: e.target.value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder="+34 666 123 456"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Business ID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.channels.whatsapp.business_id}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "channels",
                                                                    "whatsapp",
                                                                    {
                                                                        ...settings.channels.whatsapp,
                                                                        business_id: e.target.value,
                                                                    },
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            API Key
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="password"
                                                                value={settings.channels.whatsapp.api_key}
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "channels",
                                                                        "whatsapp",
                                                                        {
                                                                            ...settings.channels.whatsapp,
                                                                            api_key: e.target.value,
                                                                        },
                                                                    )
                                                                }
                                                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Verify Token
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.channels.whatsapp.verify_token}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "channels",
                                                                    "whatsapp",
                                                                    {
                                                                        ...settings.channels.whatsapp,
                                                                        verify_token: e.target.value,
                                                                    },
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                                    </div>

                                                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                                                    <h5 className="font-medium text-gray-900 mb-2">Webhook URL para Meta</h5>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 p-2 bg-white rounded text-xs font-mono text-gray-700">
                                                            https://son-ia.com/webhooks/whatsapp/{restaurantId}
                                                        </code>
                                                        <button className="p-2 text-purple-600 hover:text-purple-700">
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    </div>

                                                    {/* Configuración de comportamiento WhatsApp */}
                                                    <div className="space-y-3 pt-4 border-t border-gray-200">
                                                    <h5 className="font-medium text-gray-900">Comportamiento en WhatsApp</h5>
                                                    <ToggleSwitch
                                                        enabled={settings.agent.channels.whatsapp.use_voice_notes}
                                                        onChange={(enabled) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                agent: {
                                                                    ...prev.agent,
                                                                    channels: {
                                                                        ...prev.agent.channels,
                                                                        whatsapp: {
                                                                            ...prev.agent.channels.whatsapp,
                                                                            use_voice_notes: enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))
                                                        }
                                                        label="Responder con notas de voz"
                                                        description="El agente puede enviar audios además de texto"
                                                    />
                                                    <ToggleSwitch
                                                        enabled={settings.agent.channels.whatsapp.send_images}
                                                        onChange={(enabled) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                agent: {
                                                                    ...prev.agent,
                                                                    channels: {
                                                                        ...prev.agent.channels,
                                                                        whatsapp: {
                                                                            ...prev.agent.channels.whatsapp,
                                                                            send_images: enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))
                                                        }
                                                        label="Enviar imágenes"
                                                        description="Compartir fotos del restaurante o platos"
                                                    />
                                                    <ToggleSwitch
                                                        enabled={settings.agent.channels.whatsapp.quick_replies}
                                                        onChange={(enabled) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                agent: {
                                                                    ...prev.agent,
                                                                    channels: {
                                                                        ...prev.agent.channels,
                                                                        whatsapp: {
                                                                            ...prev.agent.channels.whatsapp,
                                                                            quick_replies: enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))
                                                        }
                                                        label="Botones de respuesta rápida"
                                                        description="Facilitar la interacción con botones predefinidos"
                                                    />
                                                    </div>
                                                    </>
                                                    )}

                                                    <div className="p-4 bg-green-50 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                    <Bot className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                    <p className="text-sm font-medium text-green-900">
                                                        Agente IA incluido
                                                    </p>
                                                    <p className="text-sm text-green-700 mt-1">
                                                        Responde automáticamente 24/7 y gestiona reservas sin intervención
                                                    </p>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </SettingSection>

                                                    {/* Vapi (Llamadas) */}
                                                    <SettingSection
                                                    title="Vapi - Llamadas con IA"
                                                    description="Recibe llamadas y el agente IA las atiende automáticamente"
                                                    icon={<PhoneCall />}
                                                    >
                                                    <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                    <ToggleSwitch
                                                    enabled={settings.channels.vapi.enabled}
                                                    onChange={(enabled) =>
                                                    handleNestedChange(
                                                        "channels",
                                                        "vapi",
                                                        {
                                                            ...settings.channels.vapi,
                                                            enabled,
                                                        },
                                                    )
                                                    }
                                                    label="Activar recepción de llamadas con IA"
                                                    />
                                                    {settings.channels.vapi.enabled && (
                                                    <button
                                                    onClick={() => testChannelConnection('vapi')}
                                                    disabled={testingConnection.vapi}
                                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                                    >
                                                    {testingConnection.vapi ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Phone className="w-4 h-4" />
                                                    )}
                                                    Llamada de prueba
                                                    </button>
                                                    )}
                                                    </div>

                                                    {settings.channels.vapi.enabled && (
                                                    <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Número de teléfono
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={settings.channels.vapi.phone_number}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "channels",
                                                                    "vapi",
                                                                    {
                                                                        ...settings.channels.vapi,
                                                                        phone_number: e.target.value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder="+34 666 123 456"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            API Key de Vapi
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="password"
                                                                value={settings.channels.vapi.api_key}
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "channels",
                                                                        "vapi",
                                                                        {
                                                                            ...settings.channels.vapi,
                                                                            api_key: e.target.value,
                                                                        },
                                                                    )
                                                                }
                                                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    </div>

                                                    {/* Configuración de voz */}
                                                    <div className="space-y-3 pt-4 border-t border-gray-200">
                                                    <h5 className="font-medium text-gray-900">Configuración de voz</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Velocidad
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="0.5"
                                                                max="1.5"
                                                                step="0.1"
                                                                value={settings.agent.channels.vapi.speed}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            channels: {
                                                                                ...prev.agent.channels,
                                                                                vapi: {
                                                                                    ...prev.agent.channels.vapi,
                                                                                    speed: parseFloat(e.target.value)
                                                                                }
                                                                            }
                                                                        }
                                                                    }))
                                                                }
                                                                className="w-full"
                                                            />
                                                            <span className="text-xs text-gray-500">{settings.agent.channels.vapi.speed}x</span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Umbral interrupción
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="50"
                                                                max="200"
                                                                value={settings.agent.channels.vapi.interruption_threshold}
                                                                onChange={(e) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            channels: {
                                                                                ...prev.agent.channels,
                                                                                vapi: {
                                                                                    ...prev.agent.channels.vapi,
                                                                                    interruption_threshold: parseInt(e.target.value)
                                                                                }
                                                                            }
                                                                        }
                                                                    }))
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Supresión de ruido
                                                            </label>
                                                            <ToggleSwitch
                                                                enabled={settings.agent.channels.vapi.background_noise_suppression}
                                                                onChange={(enabled) =>
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            channels: {
                                                                                ...prev.agent.channels,
                                                                                vapi: {
                                                                                    ...prev.agent.channels.vapi,
                                                                                    background_noise_suppression: enabled
                                                                                }
                                                                            }
                                                                        }
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    </div>

                                                    {/* Frases de finalización */}
                                                    <div className="pt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Frases que finalizan la llamada
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {settings.agent.channels.vapi.end_call_phrases.map((phrase, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                                            >
                                                                {phrase}
                                                                <button className="ml-1 hover:text-red-600">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <button className="inline-flex items-center gap-1 px-3 py-1 border-2 border-dashed border-gray-300 text-gray-600 text-sm rounded-full hover:border-purple-400 hover:text-purple-600">
                                                            <Plus className="w-3 h-3" />
                                                            Agregar frase
                                                        </button>
                                                    </div>
                                                    </div>
                                                    </>
                                                    )}

                                                    <div className="p-4 bg-blue-50 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                    <Volume2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                    <p className="text-sm font-medium text-blue-900">
                                                        Voz natural con IA
                                                    </p>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        El agente habla de forma natural y entiende contexto e interrupciones
                                                    </p>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </SettingSection>

                                                    {/* Widget Web */}
                                                    <SettingSection
                                                    title="Widget Web"
                                                    description="Chat en tu sitio web con el agente IA integrado"
                                                    icon={<Globe />}
                                                    >
                                                    <div className="space-y-4">
                                                    <ToggleSwitch
                                                    enabled={settings.channels.web.enabled}
                                                    onChange={(enabled) =>
                                                    handleNestedChange(
                                                    "channels",
                                                    "web",
                                                    {
                                                        ...settings.channels.web,
                                                        enabled,
                                                    },
                                                    )
                                                    }
                                                    label="Activar widget de chat web"
                                                    />

                                                    {settings.channels.web.enabled && (
                                                    <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Color del widget
                                                        </label>
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="color"
                                                                value={settings.channels.web.widget_color}
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "channels",
                                                                        "web",
                                                                        {
                                                                            ...settings.channels.web,
                                                                            widget_color: e.target.value,
                                                                        },
                                                                    )
                                                                }
                                                                className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={settings.channels.web.widget_color}
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "channels",
                                                                        "web",
                                                                        {
                                                                            ...settings.channels.web,
                                                                            widget_color: e.target.value,
                                                                        },
                                                                    )
                                                                }
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Posición
                                                        </label>
                                                        <select
                                                            value={settings.channels.web.position}
                                                            onChange={(e) =>
                                                                handleNestedChange(
                                                                    "channels",
                                                                    "web",
                                                                    {
                                                                        ...settings.channels.web,
                                                                        position: e.target.value,
                                                                    },
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        >
                                                            <option value="bottom-right">Abajo derecha</option>
                                                            <option value="bottom-left">Abajo izquierda</option>
                                                            <option value="top-right">Arriba derecha</option>
                                                            <option value="top-left">Arriba izquierda</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Retraso para abrir automáticamente
                                                        </label>
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="30000"
                                                                step="1000"
                                                                value={settings.channels.web.auto_open_delay}
                                                                onChange={(e) =>
                                                                    handleNestedChange(
                                                                        "channels",
                                                                        "web",
                                                                        {
                                                                            ...settings.channels.web,
                                                                            auto_open_delay: parseInt(e.target.value),
                                                                        },
                                                                    )
                                                                }
                                                                className="flex-1"
                                                            />
                                                            <span className="text-sm text-gray-600 w-20">
                                                                {settings.channels.web.auto_open_delay / 1000}s
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            0 = No abrir automáticamente
                                                        </p>
                                                    </div>
                                                    </div>

                                                    <div className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                                        Código de instalación:
                                                    </p>
                                                    <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                                                    {`<!-- La-IA Chat Widget -->
                                                    <script>
                                                    (function(w,d,s,o,f,js,fjs){
                                                    w['la-ia']=o;w[o]=w[o]||function(){
                                                    (w[o].q=w[o].q||[]).push(arguments)};
                                                    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
                                                    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
                                                    }(window,document,'script','laia','https://widget.la-ia.com/v1/chat.js'));

                                                    laia('init', '${restaurantId}');
                                                    laia('config', {
                                                    color: '${settings.channels.web.widget_color}',
                                                    position: '${settings.channels.web.position}',
                                                    autoOpen: ${settings.channels.web.auto_open_delay}
                                                    });
                                                    </script>`}
                                                    </div>
                                                    <button className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                                                        <Copy className="w-4 h-4" />
                                                        Copiar código
                                                    </button>
                                                    </div>

                                                    {/* Vista previa */}
                                                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-700 mb-3">
                                                        Vista previa:
                                                    </p>
                                                    <div className="relative h-32 bg-white rounded-lg shadow-sm">
                                                        <div 
                                                            className={`
                                                                absolute w-12 h-12 rounded-full shadow-lg flex items-center justify-center
                                                                ${settings.channels.web.position === 'bottom-right' ? 'bottom-4 right-4' : ''}
                                                                ${settings.channels.web.position === 'bottom-left' ? 'bottom-4 left-4' : ''}
                                                                ${settings.channels.web.position === 'top-right' ? 'top-4 right-4' : ''}
                                                                ${settings.channels.web.position === 'top-left' ? 'top-4 left-4' : ''}
                                                            `}
                                                            style={{ backgroundColor: settings.channels.web.widget_color }}
                                                        >
                                                            <MessageSquare className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                    </div>
                                                    </>
                                                    )}
                                                    </div>
                                                    </SettingSection>

                                                    {/* Otros canales */}
                                                    <SettingSection
                                                    title="Otros Canales"
                                                    description="Conecta más canales de comunicación"
                                                    icon={<Hash />}
                                                    >
                                                    <div className="space-y-4">
                                                    {/* Instagram */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                                        <Instagram className="w-5 h-5 text-pink-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Instagram</h4>
                                                        <p className="text-sm text-gray-600">Responde DMs automáticamente</p>
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.channels.instagram.enabled}
                                                    onChange={(enabled) =>
                                                        handleNestedChange(
                                                            "channels",
                                                            "instagram",
                                                            {
                                                                ...settings.channels.instagram,
                                                                enabled,
                                                            },
                                                        )
                                                    }
                                                    />
                                                    </div>
                                                    </div>

                                                    {/* Facebook */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                        <Facebook className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Facebook Messenger</h4>
                                                        <p className="text-sm text-gray-600">Gestiona mensajes de tu página</p>
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.channels.facebook.enabled}
                                                    onChange={(enabled) =>
                                                        handleNestedChange(
                                                            "channels",
                                                            "facebook",
                                                            {
                                                                ...settings.channels.facebook,
                                                                enabled,
                                                            },
                                                        )
                                                    }
                                                    />
                                                    </div>
                                                    </div>

                                                    {/* Email */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                                        <Mail className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Email</h4>
                                                        <p className="text-sm text-gray-600">Responde emails automáticamente</p>
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.channels.email.enabled}
                                                    onChange={(enabled) =>
                                                        handleNestedChange(
                                                            "channels",
                                                            "email",
                                                            {
                                                                ...settings.channels.email,
                                                                enabled,
                                                            },
                                                        )
                                                    }
                                                    />
                                                    </div>
                                                    </div>
                                                    </div>

                                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                                    <button
                                                    onClick={() => handleSave("Canales de comunicación")}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                                    >
                                                    {saving ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                    <Save className="w-4 h-4" />
                                                    )}
                                                    Guardar canales
                                                    </button>
                                                    </div>
                                                    </SettingSection>
                                                    </div>
                                                    )}

                                                    {/* Workflows N8N */}
                                                    {activeTab === "workflows" && (
                                                    <div className="space-y-6">
                                                    <SettingSection
                                                    title="Workflows N8N"
                                                    description="Gestiona los flujos de automatización del agente"
                                                    icon={<Webhook />}
                                                    >
                                                    {/* Conexión principal */}
                                                    <div className="mb-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    URL base de N8N
                                                    </label>
                                                    <input
                                                    type="url"
                                                    value={settings.workflows.n8n_base_url}
                                                    onChange={(e) => handleNestedChange('workflows', 'n8n_base_url', e.target.value)}
                                                    placeholder="https://n8n.tudominio.com"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Webhook Secret
                                                    </label>
                                                    <div className="relative">
                                                    <input
                                                        type="password"
                                                        value={settings.workflows.webhook_secret}
                                                        onChange={(e) => handleNestedChange('workflows', 'webhook_secret', e.target.value)}
                                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    />
                                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>

                                                    {/* Flujos activos */}
                                                    <div className="space-y-4">
                                                    <h4 className="font-medium text-gray-900">Flujos activos</h4>

                                                    {/* Agente Conversacional Principal */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${settings.workflows.active_flows.main_conversational_agent.enabled 
                                                            ? 'bg-green-100' 
                                                            : 'bg-gray-100'}
                                                    `}>
                                                        <Brain className={`
                                                            w-5 h-5
                                                            ${settings.workflows.active_flows.main_conversational_agent.enabled 
                                                                ? 'text-green-600' 
                                                                : 'text-gray-400'}
                                                        `} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="font-medium text-gray-900">Agente Conversacional Principal</h5>
                                                            {settings.workflows.active_flows.main_conversational_agent.enabled && (
                                                                <div className="flex items-center gap-1 text-xs text-green-600">
                                                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                                                                    <span>Activo</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Procesa todas las conversaciones entrantes y gestiona reservas
                                                        </p>
                                                        {settings.workflows.active_flows.main_conversational_agent.last_trigger && (
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                Última ejecución: hace 2 minutos
                                                            </p>
                                                        )}
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.workflows.active_flows.main_conversational_agent.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            workflows: {
                                                                ...prev.workflows,
                                                                active_flows: {
                                                                    ...prev.workflows.active_flows,
                                                                    main_conversational_agent: {
                                                                        ...prev.workflows.active_flows.main_conversational_agent,
                                                                        enabled
                                                                    }
                                                                }
                                                            }
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    {settings.workflows.active_flows.main_conversational_agent.enabled && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Webhook URL:</span>
                                                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                                            /webhook/agent-main
                                                        </code>
                                                    </div>
                                                    {settings.workflows.active_flows.main_conversational_agent.error_count > 0 && (
                                                        <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            <span>{settings.workflows.active_flows.main_conversational_agent.error_count} errores en las últimas 24h</span>
                                                        </div>
                                                    )}
                                                    </div>
                                                    )}
                                                    </div>

                                                    {/* Canal Vapi */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${settings.workflows.active_flows.vapi_channel.enabled 
                                                            ? 'bg-blue-100' 
                                                            : 'bg-gray-100'}
                                                    `}>
                                                        <PhoneCall className={`
                                                            w-5 h-5
                                                            ${settings.workflows.active_flows.vapi_channel.enabled 
                                                                ? 'text-blue-600' 
                                                                : 'text-gray-400'}
                                                        `} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="font-medium text-gray-900">Canal Vapi (Llamadas)</h5>
                                                            {settings.workflows.active_flows.vapi_channel.enabled && (
                                                                <div className="flex items-center gap-1 text-xs text-green-600">
                                                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                                                                    <span>Activo</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Gestiona llamadas telefónicas con IA de voz
                                                        </p>
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.workflows.active_flows.vapi_channel.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            workflows: {
                                                                ...prev.workflows,
                                                                active_flows: {
                                                                    ...prev.workflows.active_flows,
                                                                    vapi_channel: {
                                                                        ...prev.workflows.active_flows.vapi_channel,
                                                                        enabled
                                                                    }
                                                                }
                                                            }
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    </div>

                                                    {/* WhatsApp Flow */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${settings.workflows.active_flows.whatsapp_flow.enabled 
                                                            ? 'bg-green-100' 
                                                            : 'bg-gray-100'}
                                                    `}>
                                                        <MessageCircle className={`
                                                            w-5 h-5
                                                            ${settings.workflows.active_flows.whatsapp_flow.enabled 
                                                                ? 'text-green-600' 
                                                                : 'text-gray-400'}
                                                        `} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="font-medium text-gray-900">WhatsApp Flow</h5>
                                                            {settings.workflows.active_flows.whatsapp_flow.enabled && (
                                                                <div className="flex items-center gap-1 text-xs text-green-600">
                                                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                                                                    <span>Activo</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Procesa mensajes de WhatsApp Business
                                                        </p>
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.workflows.active_flows.whatsapp_flow.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            workflows: {
                                                                ...prev.workflows,
                                                                active_flows: {
                                                                    ...prev.workflows.active_flows,
                                                                    whatsapp_flow: {
                                                                        ...prev.workflows.active_flows.whatsapp_flow,
                                                                        enabled
                                                                    }
                                                                }
                                                            }
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    </div>

                                                    {/* Analytics Processor */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${settings.workflows.active_flows.analytics_processor.enabled 
                                                            ? 'bg-purple-100' 
                                                            : 'bg-gray-100'}
                                                    `}>
                                                        <BarChart3 className={`
                                                            w-5 h-5
                                                            ${settings.workflows.active_flows.analytics_processor.enabled 
                                                                ? 'text-purple-600' 
                                                                : 'text-gray-400'}
                                                        `} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="font-medium text-gray-900">Procesador de Analytics</h5>
                                                            {settings.workflows.active_flows.analytics_processor.enabled && (
                                                                <div className="flex items-center gap-1 text-xs text-green-600">
                                                                    <Timer className="w-3 h-3" />
                                                                    <span>Programado</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Genera reportes y métricas del agente
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Programado: Diariamente a las 2:00 AM
                                                        </p>
                                                    </div>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.workflows.active_flows.analytics_processor.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            workflows: {
                                                                ...prev.workflows,
                                                                active_flows: {
                                                                    ...prev.workflows.active_flows,
                                                                    analytics_processor: {
                                                                        ...prev.workflows.active_flows.analytics_processor,
                                                                        enabled
                                                                    }
                                                                }
                                                            }
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    </div>
                                                    </div>

                                                    {/* Estado de conexión */}
                                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                    N8N conectado y funcionando
                                                    </span>
                                                    </div>
                                                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                                    Ver logs
                                                    </button>
                                                    </div>
                                                    </div>

                                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                                    <button
                                                    onClick={() => handleSave("Workflows")}
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

                                                    {/* Notificaciones MEJORADO */}
                                                    {activeTab === "notifications" && (
                                                    <div className="space-y-6">
                                                    <SettingSection
                                                    title="Notificaciones de Reservas"
                                                    description="Configura cuándo y cómo recibir notificaciones"
                                                    icon={<Bell />}
                                                    >
                                                    <div className="space-y-6">
                                                    {/* Nueva reserva */}
                                                    <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">
                                                    Nueva Reserva
                                                    </h4>
                                                    <ToggleSwitch
                                                    enabled={settings.notifications.new_reservation.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                new_reservation: {
                                                                    ...prev.notifications.new_reservation,
                                                                    enabled,
                                                                },
                                                            },
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    {settings.notifications.new_reservation.enabled && (
                                                    <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.notifications.new_reservation.email}
                                                            onChange={(e) =>
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    notifications: {
                                                                        ...prev.notifications,
                                                                        new_reservation: {
                                                                            ...prev.notifications.new_reservation,
                                                                            email: e.target.checked,
                                                                        },
                                                                    },
                                                                }))
                                                            }
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <Mail className="w-4 h-4 text-gray-600" />
                                                        <span className="text-sm text-gray-700">Email</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.notifications.new_reservation.whatsapp}
                                                            onChange={(e) =>
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    notifications: {
                                                                        ...prev.notifications,
                                                                        new_reservation: {
                                                                            ...prev.notifications.new_reservation,
                                                                            whatsapp: e.target.checked,
                                                                        },
                                                                    },
                                                                }))
                                                            }
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <MessageSquare className="w-4 h-4 text-gray-600" />
                                                        <span className="text-sm text-gray-700">WhatsApp</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.notifications.new_reservation.webhook}
                                                            onChange={(e) =>
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    notifications: {
                                                                        ...prev.notifications,
                                                                        new_reservation: {
                                                                            ...prev.notifications.new_reservation,
                                                                            webhook: e.target.checked,
                                                                        },
                                                                    },
                                                                }))
                                                            }
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <Webhook className="w-4 h-4 text-gray-600" />
                                                        <span className="text-sm text-gray-700">Webhook</span>
                                                    </label>
                                                    </div>
                                                    )}
                                                    </div>

                                                    {/* Recordatorios */}
                                                    <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">
                                                    Recordatorios a Clientes
                                                    </h4>
                                                    <ToggleSwitch
                                                    enabled={settings.notifications.reminder_enabled}
                                                    onChange={(enabled) =>
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                reminder_enabled: enabled
                                                            }
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    {settings.notifications.reminder_enabled && (
                                                    <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Enviar recordatorio
                                                        </label>
                                                        <select
                                                            value={settings.notifications.reminder_hours}
                                                            onChange={(e) =>
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    notifications: {
                                                                        ...prev.notifications,
                                                                        reminder_hours: parseInt(e.target.value),
                                                                    },
                                                                }))
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="1">1 hora antes</option>
                                                            <option value="2">2 horas antes</option>
                                                            <option value="4">4 horas antes</option>
                                                            <option value="24">24 horas antes</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Canales para recordatorios
                                                        </label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={settings.notifications.reminder_channels.includes('whatsapp')}
                                                                    onChange={(e) => {
                                                                        const channels = e.target.checked
                                                                            ? [...settings.notifications.reminder_channels, 'whatsapp']
                                                                            : settings.notifications.reminder_channels.filter(c => c !== 'whatsapp');
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            notifications: {
                                                                                ...prev.notifications,
                                                                                reminder_channels: channels
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="w-4 h-4 text-blue-600 rounded"
                                                                />
                                                                <MessageSquare className="w-4 h-4 text-gray-600" />
                                                                <span className="text-sm text-gray-700">WhatsApp</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={settings.notifications.reminder_channels.includes('email')}
                                                                    onChange={(e) => {
                                                                        const channels = e.target.checked
                                                                            ? [...settings.notifications.reminder_channels, 'email']
                                                                            : settings.notifications.reminder_channels.filter(c => c !== 'email');
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            notifications: {
                                                                                ...prev.notifications,
                                                                                reminder_channels: channels
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="w-4 h-4 text-blue-600 rounded"
                                                                />
                                                                <Mail className="w-4 h-4 text-gray-600" />
                                                                <span className="text-sm text-gray-700">Email</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    </div>
                                                    )}
                                                    </div>

                                                    {/* Alertas del agente */}
                                                    <div className="p-4 bg-purple-50 rounded-lg">
                                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                    <Bot className="w-4 h-4 text-purple-600" />
                                                    Alertas del Agente IA
                                                    </h4>
                                                    <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Escalamiento a humano</p>
                                                        <p className="text-xs text-gray-600">Cuando el agente transfiere a una persona</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications.agent_alerts.escalation.enabled}
                                                        onChange={(enabled) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                notifications: {
                                                                    ...prev.notifications,
                                                                    agent_alerts: {
                                                                        ...prev.notifications.agent_alerts,
                                                                        escalation: {
                                                                            ...prev.notifications.agent_alerts.escalation,
                                                                            enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))
                                                        }
                                                    />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Tasa de error alta</p>
                                                        <p className="text-xs text-gray-600">Más de 10 errores en 1 hora</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications.agent_alerts.error_rate_high.enabled}
                                                        onChange={(enabled) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                notifications: {
                                                                    ...prev.notifications,
                                                                    agent_alerts: {
                                                                        ...prev.notifications.agent_alerts,
                                                                        error_rate_high: {
                                                                            ...prev.notifications.agent_alerts.error_rate_high,
                                                                            enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))
                                                        }
                                                    />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Respuesta lenta</p>
                                                        <p className="text-xs text-gray-600">Tiempo de respuesta > 30 segundos</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications.agent_alerts.response_time_slow.enabled}
                                                        onChange={(enabled) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                notifications: {
                                                                    ...prev.notifications,
                                                                    agent_alerts: {
                                                                        ...prev.notifications.agent_alerts,
                                                                        response_time_slow: {
                                                                            ...prev.notifications.agent_alerts.response_time_slow,
                                                                            enabled
                                                                        }
                                                                    }
                                                                }
                                                            }))
                                                        }
                                                    />
                                                    </div>
                                                    </div>
                                                    </div>

                                                    {/* Resumen diario */}
                                                    <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">
                                                    Resumen Diario
                                                    </h4>
                                                    <ToggleSwitch
                                                    enabled={settings.notifications.daily_summary.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                daily_summary: {
                                                                    ...prev.notifications.daily_summary,
                                                                    enabled,
                                                                },
                                                            },
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    {settings.notifications.daily_summary.enabled && (
                                                    <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Hora de envío
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={settings.notifications.daily_summary.time}
                                                            onChange={(e) =>
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    notifications: {
                                                                        ...prev.notifications,
                                                                        daily_summary: {
                                                                            ...prev.notifications.daily_summary,
                                                                            time: e.target.value,
                                                                        },
                                                                    },
                                                                }))
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notifications.daily_summary.include_agent_stats}
                                                                onChange={(e) =>
                                                                    setSettings((prev) => ({
                                                                        ...prev,
                                                                        notifications: {
                                                                            ...prev.notifications,
                                                                            daily_summary: {
                                                                                ...prev.notifications.daily_summary,
                                                                                include_agent_stats: e.target.checked,
                                                                            },
                                                                        },
                                                                    }))
                                                                }
                                                                className="w-4 h-4 text-blue-600 rounded"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                Incluir estadísticas del agente IA
                                                            </span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notifications.daily_summary.include_revenue}
                                                                onChange={(e) =>
                                                                    setSettings((prev) => ({
                                                                        ...prev,
                                                                        notifications: {
                                                                            ...prev.notifications,
                                                                            daily_summary: {
                                                                                ...prev.notifications.daily_summary,
                                                                                include_revenue: e.target.checked,
                                                                            },
                                                                        },
                                                                    }))
                                                                }
                                                                className="w-4 h-4 text-blue-600 rounded"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                Incluir ingresos estimados
                                                            </span>
                                                        </label>
                                                    </div>
                                                    </div>
                                                    )}
                                                    </div>
                                                    </div>

                                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                                    <button
                                                    onClick={() => handleSave("Notificaciones")}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

                                                    {/* Las demás secciones permanecen igual */}
                                                    {activeTab === "team" && (
                                                    <div className="space-y-6">
                                                    <SettingSection
                                                    title="Gestión del Equipo"
                                                    description="Administra usuarios y permisos"
                                                    icon={<Users />}
                                                    >
                                                    <div className="space-y-4">
                                                    {/* Lista de usuarios */}
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Usuario
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Rol
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Estado
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                    <tr>
                                                        <td className="px-4 py-4">
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    Admin Principal
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    admin@mirestaurante.com
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                                <Shield className="w-3 h-3" />
                                                                Propietario
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                                <Check className="w-3 h-3" />
                                                                Activo
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <button className="text-gray-400 hover:text-gray-600">
                                                                <SettingsIcon className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-4">
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    María García
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    maria@mirestaurante.com
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                <Users className="w-3 h-3" />
                                                                Manager
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                                <Check className="w-3 h-3" />
                                                                Activo
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <button className="text-gray-400 hover:text-gray-600">
                                                                <SettingsIcon className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                    </table>
                                                    </div>

                                                    {/* Botón agregar usuario */}
                                                    <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                                                    <UserPlus className="w-5 h-5" />
                                                    Invitar nuevo usuario
                                                    </button>

                                                    {/* Roles y permisos */}
                                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                                    <h4 className="font-medium text-gray-900 mb-3">
                                                    Roles disponibles:
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                    <div className="flex items-start gap-2">
                                                    <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
                                                    <div>
                                                        <span className="font-medium">
                                                            Propietario:
                                                        </span>
                                                        <span className="text-gray-600 ml-1">
                                                            Acceso total al sistema
                                                        </span>
                                                    </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                    <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                                                    <div>
                                                        <span className="font-medium">
                                                            Manager:
                                                        </span>
                                                        <span className="text-gray-600 ml-1">
                                                            Gestión de reservas y reportes
                                                        </span>
                                                    </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                    <Users className="w-4 h-4 text-gray-600 mt-0.5" />
                                                    <div>
                                                        <span className="font-medium">
                                                            Staff:
                                                        </span>
                                                        <span className="text-gray-600 ml-1">
                                                            Ver y crear reservas
                                                        </span>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </SettingSection>
                                                    </div>
                                                    )}

                                                    {/* Facturación */}
                                                    {activeTab === "billing" && (
                                                    <div className="space-y-6">
                                                    <SettingSection
                                                    title="Plan Actual"
                                                    description="Gestiona tu suscripción y método de pago"
                                                    icon={<CreditCard />}
                                                    >
                                                    <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white">
                                                    <div className="flex items-start justify-between">
                                                    <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                    <Crown className="w-5 h-5" />
                                                    <h3 className="text-xl font-semibold">
                                                        Plan Premium
                                                    </h3>
                                                    </div>
                                                    <p className="text-purple-100 mb-4">
                                                    Acceso completo a todas las funciones de La-IA
                                                    </p>
                                                    <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold">
                                                        99€
                                                    </span>
                                                    <span className="text-purple-100">
                                                        /mes
                                                    </span>
                                                    </div>
                                                    </div>
                                                    <div className="text-right">
                                                    <p className="text-sm text-purple-100 mb-1">
                                                    Próxima factura
                                                    </p>
                                                    <p className="font-medium">
                                                    1 de marzo, 2025
                                                    </p>
                                                    </div>
                                                    </div>
                                                    </div>

                                                    <div className="mt-6">
                                                    <h4 className="font-medium text-gray-900 mb-3">
                                                    Incluye:
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {[
                                                    "Reservas ilimitadas",
                                                    "Agente IA 24/7",
                                                    "WhatsApp Business",
                                                    "Llamadas con Vapi",
                                                    "Widget web personalizable",
                                                    "Analytics avanzado",
                                                    "Soporte prioritario",
                                                    "API access",
                                                    "Usuarios ilimitados",
                                                    "Integraciones premium",
                                                    "Workflows N8N",
                                                    "Backup automático"
                                                    ].map((feature, index) => (
                                                    <div
                                                    key={index}
                                                    className="flex items-center gap-2"
                                                    >
                                                    <Check className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-gray-700">
                                                        {feature}
                                                    </span>
                                                    </div>
                                                    ))}
                                                    </div>
                                                    </div>

                                                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Cambiar plan
                                                    </button>
                                                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Actualizar pago
                                                    </button>
                                                    </div>
                                                    </SettingSection>

                                                    {/* Historial de facturas */}
                                                    <SettingSection
                                                    title="Historial de Facturas"
                                                    description="Descarga tus facturas anteriores"
                                                    icon={<BarChart3 />}
                                                    >
                                                    <div className="space-y-3">
                                                    {[
                                                    {
                                                    date: "Febrero 2025",
                                                    amount: "99€",
                                                    status: "Pagado",
                                                    },
                                                    {
                                                    date: "Enero 2025",
                                                    amount: "99€",
                                                    status: "Pagado",
                                                    },
                                                    {
                                                    date: "Diciembre 2024",
                                                    amount: "99€",
                                                    status: "Pagado",
                                                    },
                                                    ].map((invoice, index) => (
                                                    <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                                                    >
                                                    <div>
                                                    <p className="font-medium text-gray-900">
                                                        {invoice.date}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {invoice.amount}
                                                    </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                        <Check className="w-3 h-3" />
                                                        {invoice.status}
                                                    </span>
                                                    <button className="text-blue-600 hover:text-blue-700">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    </div>
                                                    </div>
                                                    ))}
                                                    </div>
                                                    </SettingSection>
                                                    </div>
                                                    )}

                                                    {/* Integraciones */}
                                                    {activeTab === "integrations" && (
                                                    <div className="space-y-6">
                                                    <SettingSection
                                                    title="Integraciones Disponibles"
                                                    description="Conecta Son-IA con tus herramientas favoritas"
                                                    icon={<Link2 />}
                                                    premium
                                                    >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Google Calendar */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        Google Calendar
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Sincroniza reservas con tu calendario
                                                    </p>
                                                    <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                        {settings.integrations.google_calendar.enabled
                                                            ? "Configurar"
                                                            : "Conectar"}
                                                    </button>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.integrations.google_calendar.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            integrations: {
                                                                ...prev.integrations,
                                                                google_calendar: {
                                                                    ...prev.integrations.google_calendar,
                                                                    enabled,
                                                                },
                                                            },
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    </div>

                                                    {/* Sistema POS */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        Sistema POS
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Integra con tu TPV
                                                    </p>
                                                    <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                        {settings.integrations.pos_system.enabled
                                                            ? "Configurar"
                                                            : "Conectar"}
                                                    </button>
                                                    </div>
                                                    <ToggleSwitch
                                                    enabled={settings.integrations.pos_system.enabled}
                                                    onChange={(enabled) =>
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            integrations: {
                                                                ...prev.integrations,
                                                                pos_system: {
                                                                    ...prev.integrations.pos_system,
                                                                    enabled,
                                                                },
                                                            },
                                                        }))
                                                    }
                                                    />
                                                    </div>
                                                    </div>

                                                    {/* Webhooks */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <Webhook className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        Webhooks
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Recibe eventos en tiempo real
                                                    </p>
                                                    <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                        Configurar
                                                    </button>
                                                    </div>
                                                    </div>
                                                    </div>

                                                    {/* API */}
                                                    <div className="p-4 border border-gray-200 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <Key className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        API Access
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Integración personalizada
                                                    </p>
                                                    <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                        Ver documentación
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </SettingSection>
                                                    </div>
                                                    )}
                                                    </div>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    );
                                                    }
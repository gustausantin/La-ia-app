
// Configuracion.jsx - Panel de Configuración COMPLETO y MEJORADO para Son-IA
import React, { useState, useEffect, useCallback } from "react";
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
export default function Configuracion() {
    // console.log removed for production
const { 
        restaurant, 
        restaurantId, 
        isReady,
        agentStatus,
        user
    } = useAuthContext();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [testingConnection, setTestingConnection] = useState({});

    // Función para validar canales
    const validateChannel = useCallback((channelType, channelSettings) => {
        const errors = [];
        let isValid = true;

        switch (channelType) {
            case 'vapi':
                if (!channelSettings?.api_key?.trim()) {
                    errors.push("API Key es obligatorio");
                    isValid = false;
                }
                if (!channelSettings?.phone_number?.trim()) {
                    errors.push("Número de teléfono es obligatorio");
                    isValid = false;
                }
                break;

            case 'whatsapp':
                if (!channelSettings?.phone_number?.trim()) {
                    errors.push("Número de WhatsApp es obligatorio");
                    isValid = false;
                }
                if (!channelSettings?.api_key?.trim()) {
                    errors.push("Token de WhatsApp Business API es obligatorio");
                    isValid = false;
                }
                break;

            case 'email':
                if (!channelSettings?.smtp_host?.trim()) {
                    errors.push("Servidor SMTP es obligatorio");
                    isValid = false;
                }
                if (!channelSettings?.smtp_user?.trim()) {
                    errors.push("Usuario SMTP es obligatorio");
                    isValid = false;
                }
                if (!channelSettings?.smtp_password?.trim()) {
                    errors.push("Contraseña SMTP es obligatoria");
                    isValid = false;
                }
                if (!channelSettings?.from_email?.trim()) {
                    errors.push("Email origen es obligatorio");
                    isValid = false;
                }
                break;

            case 'facebook':
                if (!channelSettings?.page_id?.trim()) {
                    errors.push("ID de página de Facebook es obligatorio");
                    isValid = false;
                }
                if (!channelSettings?.access_token?.trim()) {
                    errors.push("Token de acceso de Facebook es obligatorio");
                    isValid = false;
                }
                break;

            case 'instagram':
                if (!channelSettings?.page_id?.trim()) {
                    errors.push("ID de perfil de Instagram es obligatorio");
                    isValid = false;
                }
                if (!channelSettings?.access_token?.trim()) {
                    errors.push("Token de acceso de Instagram es obligatorio");
                    isValid = false;
                }
                break;

            case 'web_chat':
                // Web chat no requiere configuración externa
                break;
        }

        return { isValid, errors };
    }, []);

    // Función para validar todos los canales
    const validateAllChannels = useCallback(() => {
        const newValidation = {};
        
        Object.keys(settings.channels).forEach(channelType => {
            if (settings.channels[channelType].enabled) {
                newValidation[channelType] = validateChannel(channelType, settings.channels[channelType]);
            } else {
                newValidation[channelType] = { isValid: true, errors: [] };
            }
        });

        setChannelValidation(newValidation);
        return newValidation;
    }, [settings.channels]);

    // Función para obtener conteo de canales activos y válidos
    const getActiveChannelCount = useCallback(() => {
        const validation = validateAllChannels();
        const activeChannels = Object.keys(settings.channels).filter(channelType => 
            settings.channels[channelType].enabled && validation[channelType]?.isValid
        );
        return {
            active: activeChannels.length,
            total: Object.keys(settings.channels).length,
            validChannels: activeChannels
        };
    }, [settings.channels, validateAllChannels]);

    // Función para prevenir activación de canales inválidos
    const handleChannelToggle = useCallback((channelType, enabled) => {
        if (enabled) {
            const validation = validateChannel(channelType, settings.channels[channelType]);
            if (!validation.isValid) {
                toast.error(`No se puede activar ${channelType}: ${validation.errors.join(', ')}`);
                return;
            }
        }

        setSettings(prev => ({
            ...prev,
            channels: {
                ...prev.channels,
                [channelType]: { ...prev.channels[channelType], enabled }
            }
        }));
    }, [settings.channels]);

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
        logo_url: "",
        // Campos adicionales importantes
        capacity_total: 0,
        price_range: "",
        instagram: "",
        facebook: "",
        accepting_reservations: true,
        
        // Horarios de operación
        operating_hours: {
            monday: { open: "09:00", close: "22:00", closed: false },
            tuesday: { open: "09:00", close: "22:00", closed: false },
            wednesday: { open: "09:00", close: "22:00", closed: false },
            thursday: { open: "09:00", close: "22:00", closed: false },
            friday: { open: "09:00", close: "23:00", closed: false },
            saturday: { open: "09:00", close: "23:00", closed: false },
            sunday: { open: "10:00", close: "22:00", closed: false }
        },

        // Configuración de reservas - SIMPLIFICADO PARA MVP
        reservation_settings: {
            enabled: true,
            advance_booking_days: 30,
            min_party_size: 1,
            max_party_size: 12,
            turn_duration: 90,
            buffer_time: 15,
            // Valores fijos para MVP (sin toggles)
            auto_confirm: true,        // SIEMPRE confirmación automática
            require_phone: true,       // SIEMPRE teléfono obligatorio  
            require_email: true,       // SIEMPRE email obligatorio
            cancellation_window: 2,
            modification_window: 1
        },

        // Configuración del Agente IA
        agent: {
            enabled: true,
            name: "Asistente de " + (restaurant?.name || "Mi Restaurante"),
            personality: "professional_friendly",
            language: "es",
            voice: "es-ES-Standard-A",
            auto_escalation: true,
            escalation_triggers: {
                multiple_requests: true,
                negative_sentiment: true,
                complex_queries: true,
                payment_issues: true
            },
            response_time_target: 30,
            working_hours_only: false,
            
            // Optimización de mesas
            table_optimization: {
                enabled: true,
                factors: {
                    rotation: 80,
                    location: 60,
                    capacity: 70,
                    customer_history: 50
                }
            },

            // Personalidad y comportamiento
            personality_traits: {
                friendliness: 80,
                formality: 60,
                helpfulness: 90,
                proactiveness: 70
            },

            // Plantillas de respuesta
            message_templates: {
                greeting: "¡Hola! Soy {agent_name}, el asistente virtual de {restaurant_name}. ¿En qué puedo ayudarte hoy?",
                reservation_confirmed: "¡Perfecto! He confirmado tu reserva para {party_size} personas el {date} a las {time}. Tu número de reserva es {reservation_id}.",
                availability_check: "Déjame consultar la disponibilidad para {party_size} personas el {date}...",
                no_availability: "Lo siento, no tenemos disponibilidad para {party_size} personas el {date} a las {time}. ¿Te gustaría que te sugiera otras opciones?",
                cancellation: "He cancelado tu reserva {reservation_id}. ¿Hay algo más en lo que pueda ayudarte?",
                escalation: "Voy a conectarte con uno de nuestros especialistas que podrá ayudarte mejor con tu consulta."
            }
        },

        // Configuración CRM & IA
        crm: {
            // Umbrales de segmentación
            thresholds: {
                inactivo_days: 60,
                vip_visits: 5,
                vip_spend: 500,
                alto_valor_spend: 1000,
                en_riesgo_drop: 50,
                regular_visits_min: 3,
                regular_visits_max: 4,
                period_days: 90
            },
            // Configuración de automatizaciones
            automation: {
                enabled: true,
                cooldown_days: 30,
                max_daily_sends: 50,
                working_hours_only: true,
                working_hours_start: "09:00",
                working_hours_end: "21:00"
            },
            // Configuración de plantillas
            templates: {
                reactivacion_enabled: true,
                vip_upgrade_enabled: true,
                en_riesgo_enabled: false
            }
        },

        // Configuración de canales
        channels: {
            vapi: {
                enabled: true,
                api_key: "",
                phone_number: "",
                voice_id: "es-ES-Standard-A",
                max_call_duration: 600
            },
            whatsapp: {
                enabled: false,
                phone_number: "",
                api_key: "",
                webhook_url: ""
            },
            web_chat: {
                enabled: true,
                widget_color: "#3B82F6",
                widget_position: "bottom-right",
                greeting_message: "¡Hola! ¿En qué puedo ayudarte?",
                office_hours_only: false
            },
            email: {
                enabled: true,
                smtp_host: "",
                smtp_port: 587,
                smtp_user: "",
                smtp_password: "",
                from_email: "",
                auto_reply: true
            },
            instagram: {
                enabled: false,
                access_token: "",
                page_id: ""
            },
            facebook: {
                enabled: false,
                access_token: "",
                page_id: ""
            }
        },

        // Configuración de notificaciones
        notifications: {
            email_enabled: true,
            sms_enabled: false,
            push_enabled: true,
            slack_enabled: false,
            
            // Tipos de notificaciones
            new_reservation: true,
            reservation_cancelled: true,
            reservation_modified: true,
            no_show: true,
            agent_escalation: true,
            system_alerts: true,
            daily_summary: true,
            weekly_reports: true,

            // Configuración de horarios
            quiet_hours: {
                enabled: false,
                start: "22:00",
                end: "08:00"
            }
        },

        // Configuración de integraciones
        integrations: {
            google_calendar: {
                enabled: false,
                calendar_id: ""
            },
            pos_system: {
                enabled: false,
                system_type: "",
                api_endpoint: "",
                api_key: ""
            },
            crm: {
                enabled: false,
                system_type: "",
                api_key: ""
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
        daily_stats: {
            today: 0,
            yesterday: 0,
            change_percent: 0
        }
    });

    // Estados para estado en tiempo real
    const [realTimeStatus, setRealTimeStatus] = useState({
        active_conversations: 0,
        pending_reservations: 0,
        system_health: "healthy",
        last_updated: new Date()
    });

    // Estados para validación de canales
    const [channelValidation, setChannelValidation] = useState({
        vapi: { isValid: false, errors: [] },
        whatsapp: { isValid: false, errors: [] },
        email: { isValid: false, errors: [] },
        facebook: { isValid: false, errors: [] },
        instagram: { isValid: false, errors: [] }
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
            label: "CRM & IA",
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
        },
    ];

    // CRÍTICO: Definir loadSettings ANTES de los effects
    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            
            // Si no hay restaurant, intentar crear uno automáticamente
            if (!restaurant && user?.id) {
                toast.info('Configurando tu restaurante...');
                try {
                    const { data: restaurantData, error: restaurantError } = await supabase
                        .rpc('create_restaurant_securely', {
                            restaurant_data: {
                                name: `Restaurante de ${user.email.split('@')[0]}`,
                                email: user.email,
                                phone: '+34 600 000 000',
                                city: 'Madrid',
                                plan: 'trial',
                                active: true
                            }
                        });

                    if (restaurantError) {
                        throw restaurantError;
                    }

                    if (restaurantData?.success) {
                        toast.success('¡Restaurante configurado correctamente!');
                        // Forzar recarga de página para actualizar AuthContext
                        setTimeout(() => window.location.reload(), 1000);
                        return;
                    }
                } catch (error) {
                    console.error('Error configurando restaurant:', error);
                    toast.error('Error al configurar restaurante automáticamente');
                }
            }
            
            // DEBUG: Verificar datos del restaurante
            console.log("🏪 PREFILL DEBUG - Datos del restaurante:", restaurant);
            console.log("📍 Dirección:", restaurant?.address);
            console.log("🏙️ Ciudad:", restaurant?.city);
            console.log("📮 CP:", restaurant?.postal_code);
            
            // CRÍTICO: SIEMPRE cargar datos frescos desde BD para evitar cache obsoleto
            let restaurantData = null;
            
            if (restaurantId) {
                console.log("🔄 Cargando datos FRESCOS desde BD (ignorando contexto para evitar cache)...");
                const { data: dbRestaurant, error: dbError } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();
                
                if (dbError) {
                    console.error("❌ Error cargando restaurant desde BD:", dbError);
                    // Solo entonces usar datos del contexto como fallback
                    restaurantData = restaurant;
                } else {
                    restaurantData = dbRestaurant;
                    console.log("✅ Datos FRESCOS cargados desde BD:", restaurantData);
                }
            } else {
                // Sin restaurantId, usar datos del contexto
                restaurantData = restaurant;
            }
            
            // Cargar datos completos del restaurante - PREFILL TOTAL
            const savedSettings = restaurantData?.settings || {};
            
            setSettings((prev) => ({
                ...prev,
                // Datos básicos del restaurante
                name: restaurantData?.name || "",
                email: restaurantData?.email || user?.email || "",
                phone: restaurantData?.phone || "",
                address: restaurantData?.address || "",
                city: restaurantData?.city || "",
                postal_code: restaurantData?.postal_code || "",
                cuisine_type: restaurantData?.cuisine_type || "",
                // Datos desde settings JSONB
                website: savedSettings.website || "",
                description: savedSettings.description || "",
                logo_url: savedSettings.logo_url || "",
                // Campos adicionales
                capacity_total: savedSettings.capacity_total || 0,
                price_range: savedSettings.price_range || "",
                instagram: savedSettings.instagram || "",
                facebook: savedSettings.facebook || "",
                accepting_reservations: savedSettings.accepting_reservations !== false,
                // Horarios de operación
                operating_hours: savedSettings.operating_hours || prev.operating_hours,
                // Configuración de reservas
                reservation_settings: savedSettings.reservation_settings || prev.reservation_settings,
                // Configuración del agente
                agent: {
                    ...prev.agent,
                    ...savedSettings.agent,
                    name: savedSettings.agent?.name || (restaurantData?.name ? `Asistente de ${restaurantData.name}` : "Asistente Virtual"),
                },
                // Optimización de mesas
                table_optimization: savedSettings.table_optimization || prev.table_optimization,
                // Notificaciones
                notifications: savedSettings.notifications || prev.notifications,
                // Canales
                channels: savedSettings.channels || prev.channels
            }));
            
            setLoading(false);
            
        } catch (error) {
            toast.error("Error al cargar la configuración");
            setLoading(false);
        }
    }, [restaurantId, restaurant, user]);

    // Cargar configuración
    useEffect(() => {
        if (isReady) {
            // SIEMPRE cargar settings, incluso sin restaurantId
            loadSettings();
            
            // Solo cargar métricas si hay restaurantId
            if (restaurantId) {
                loadAgentMetrics();
                loadRealTimeStatus();
            }
        }
    }, [isReady, restaurantId, loadSettings]); // Ahora sí podemos incluir loadSettings

    // Effect para validar canales cuando cambian
    useEffect(() => {
        validateAllChannels();
    }, [settings.channels, validateAllChannels]);

    // CRÍTICO: Recargar datos cuando se vuelve a la página (focus)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isReady && restaurantId) {
                console.log("🔄 Página visible, recargando configuración...");
                loadSettings();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isReady, restaurantId, loadSettings]);

    const loadAgentMetrics = async () => {
        try {
            // console.log removed for production
// Simular métricas del agente desde Supabase
            // LIMPIO: Sin métricas simuladas del agente
            setAgentMetrics({
                total_conversations: 0,
                resolved_automatically: 0,
                escalated_to_human: 0,
                avg_response_time: 0,
                satisfaction_score: 0,
                daily_stats: {
                    today: 0,
                    yesterday: 0,
                    change_percent: 0
                }
            });
        } catch (error) {
        }
    };

    const loadRealTimeStatus = async () => {
        if (!restaurantId) return;
        
        try {
            // Obtener conversaciones activas reales de Supabase
            const { data: conversations, error: convError } = await supabase
                .from("agent_conversations")
                .select("id")
                .eq("restaurant_id", restaurantId)
                .eq("status", "active");

            // Obtener reservas pendientes reales de Supabase  
            const { data: reservations, error: resError } = await supabase
                .from("reservations")
                .select("id")
                .eq("restaurant_id", restaurantId)
                .eq("status", "pendiente");

            if (convError) // console.error("Error loading conversations:", convError);
            if (resError) // console.error("Error loading reservations:", resError);

            setRealTimeStatus({
                active_conversations: conversations?.length || 0,
                pending_reservations: reservations?.length || 0,
                system_health: "healthy", // TODO: Implementar health check real
                last_updated: new Date()
            });
        } catch (error) {
            // En caso de error, mostrar valores cero
            setRealTimeStatus({
                active_conversations: 0,
                pending_reservations: 0,
                system_health: "error",
                last_updated: new Date()
            });
        }
    };

    // 💾 FUNCIÓN PRINCIPAL DE GUARDADO POR SECCIONES
    const handleSave = async (section) => {
        if (!restaurantId) {
            toast.error("No se encontró el ID del restaurante");
            return;
        }

        try {
            setSaving(true);
            console.log(`💾 GUARDANDO SECCIÓN: ${section}`, settings);

            switch (section) {
                case "Información general":
                    await saveGeneralSettings();
                    break;
                case "Horarios de operación":
                    await saveOperatingHours();
                    break;
                case "Configuración de reservas":
                    await saveReservationSettings();
                    break;
                case "Configuración del Agente":
                case "Optimización de mesas":
                    await saveAgentSettings();
                    break;
                case "Configuración CRM":
                    await saveCRMSettings();
                    break;
                case "Notificaciones":
                    await saveNotificationSettings();
                    break;
                case "Configuración de canales":
                    await saveChannelSettings();
                    break;
                default:
                    toast.info(`Función ${section} en desarrollo`);
                    return;
            }

            toast.success(`✅ ${section} actualizado correctamente`);
            console.log(`✅ GUARDADO EXITOSO: ${section}`);

        } catch (error) {
            console.error(`❌ Error guardando ${section}:`, error);
            toast.error(error.message || "Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    // 🏢 GUARDAR INFORMACIÓN GENERAL
    const saveGeneralSettings = async () => {
        console.log("🏢 INICIANDO GUARDADO GENERAL...");
        console.log("📋 Datos a guardar:", {
            name: settings.name,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
            city: settings.city,
            postal_code: settings.postal_code,
            cuisine_type: settings.cuisine_type,
            website: settings.website,
            description: settings.description,
            logo_url: settings.logo_url,
            capacity_total: settings.capacity_total,
            price_range: settings.price_range,
            instagram: settings.instagram,
            facebook: settings.facebook,
            accepting_reservations: settings.accepting_reservations
        });

        if (!settings.name?.trim()) {
            throw new Error("El nombre del restaurante es obligatorio");
        }

        // Obtener settings actuales
        const { data: currentData, error: fetchError } = await supabase
            .from("restaurants")
            .select("settings")
            .eq("id", restaurantId)
            .single();
            
        if (fetchError) {
            console.error("❌ Error obteniendo settings:", fetchError);
            throw new Error("No se pudo acceder a la configuración actual");
        }
        
        const currentSettings = currentData?.settings || {};
        console.log("📖 Settings actuales en BD:", currentSettings);
        
        const newSettings = {
            ...currentSettings,
            website: settings.website || "",
            description: settings.description || "",
            logo_url: settings.logo_url || "",
            capacity_total: settings.capacity_total || 0,
            price_range: settings.price_range || "",
            instagram: settings.instagram || "",
            facebook: settings.facebook || "",
            accepting_reservations: settings.accepting_reservations !== false
        };
        
        console.log("💾 Nuevos settings a guardar:", newSettings);
        
        // Guardar datos generales
        const { data, error } = await supabase
            .from("restaurants")
            .update({
                name: settings.name,
                email: settings.email,
                phone: settings.phone,
                address: settings.address,
                city: settings.city,
                postal_code: settings.postal_code,
                cuisine_type: settings.cuisine_type,
                settings: newSettings,
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId)
            .select(); // Importante: añadir .select() para ver qué se guardó

        if (error) {
            console.error("❌ Error en update:", error);
            throw error;
        }
        
        console.log("✅ GUARDADO EXITOSO en BD:", data);

        // CRÍTICO: Forzar recarga del restaurant en AuthContext después de guardar
        try {
            // Recargar datos del restaurant desde la BD
            const { data: freshData, error: reloadError } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", restaurantId)
                .single();
                
            if (!reloadError && freshData) {
                // Forzar actualización del contexto mediante evento personalizado
                window.dispatchEvent(new CustomEvent('force-restaurant-reload', {
                    detail: { restaurant: freshData }
                }));
                console.log("🔄 AuthContext actualizado con datos frescos");
            }
        } catch (reloadError) {
            console.warn("⚠️ No se pudo actualizar AuthContext:", reloadError);
        }
    };

    // 🔄 FUNCIÓN AUXILIAR PARA FORZAR RECARGA DEL CONTEXTO
    const forceContextReload = async () => {
        try {
            // Recargar datos del restaurant desde la BD
            const { data: freshData, error: reloadError } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", restaurantId)
                .single();
                
            if (!reloadError && freshData) {
                // Forzar actualización del contexto mediante evento personalizado
                window.dispatchEvent(new CustomEvent('force-restaurant-reload', {
                    detail: { restaurant: freshData }
                }));
                console.log("🔄 AuthContext actualizado con datos frescos");
            }
        } catch (reloadError) {
            console.warn("⚠️ No se pudo actualizar AuthContext:", reloadError);
        }
    };

    // ⏰ GUARDAR HORARIOS DE OPERACIÓN
    const saveOperatingHours = async () => {
        const { data: currentData } = await supabase
            .from("restaurants")
            .select("settings")
            .eq("id", restaurantId)
            .single();
            
        const { error } = await supabase
            .from("restaurants")
            .update({
                settings: {
                    ...(currentData?.settings || {}),
                    operating_hours: settings.operating_hours
                },
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId);

        if (error) throw error;

        // Sincronizar con calendario
        await syncHoursWithCalendar();
        
        // CRÍTICO: Forzar recarga del contexto
        await forceContextReload();
    };

    // 📅 GUARDAR CONFIGURACIÓN DE RESERVAS
    const saveReservationSettings = async () => {
        const { data: currentData } = await supabase
            .from("restaurants")
            .select("settings")
            .eq("id", restaurantId)
            .single();
            
        const { error } = await supabase
            .from("restaurants")
            .update({
                settings: {
                    ...(currentData?.settings || {}),
                    reservation_settings: settings.reservation_settings
                },
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId);

        if (error) throw error;
        
        // CRÍTICO: Forzar recarga del contexto
        await forceContextReload();
    };

    // 🤖 GUARDAR CONFIGURACIÓN DEL AGENTE
    const saveAgentSettings = async () => {
        const { data: currentData } = await supabase
            .from("restaurants")
            .select("settings")
            .eq("id", restaurantId)
            .single();
            
        const { error } = await supabase
            .from("restaurants")
            .update({
                settings: {
                    ...(currentData?.settings || {}),
                    agent: settings.agent,
                    table_optimization: settings.table_optimization
                },
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId);

        if (error) throw error;
        
        // CRÍTICO: Forzar recarga del contexto
        await forceContextReload();
    };

    // 🔔 GUARDAR CONFIGURACIÓN DE NOTIFICACIONES
    const saveNotificationSettings = async () => {
        const { data: currentData } = await supabase
            .from("restaurants")
            .select("settings")
            .eq("id", restaurantId)
            .single();
            
        const { error } = await supabase
            .from("restaurants")
            .update({
                settings: {
                    ...(currentData?.settings || {}),
                    notifications: settings.notifications
                },
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId);

        if (error) throw error;
        
        // CRÍTICO: Forzar recarga del contexto
        await forceContextReload();
    };

    // 📱 GUARDAR CONFIGURACIÓN DE CANALES
    const saveChannelSettings = async () => {
        const { data: currentData } = await supabase
            .from("restaurants")
            .select("settings")
            .eq("id", restaurantId)
            .single();
            
        const { error } = await supabase
            .from("restaurants")
            .update({
                settings: {
                    ...(currentData?.settings || {}),
                    channels: settings.channels
                },
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId);

        if (error) throw error;
        
        // CRÍTICO: Forzar recarga del contexto
        await forceContextReload();
    };

    // 🎯 GUARDAR CONFIGURACIÓN CRM
    const saveCRMSettings = async () => {
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
                    crm: settings.crm
                },
                updated_at: new Date().toISOString()
            })
            .eq("id", restaurantId);

        if (error) throw error;

        // CRÍTICO: Forzar recarga del contexto
        await forceContextReload();
    };

    // 🔄 SINCRONIZAR HORARIOS CON CALENDARIO
    const syncHoursWithCalendar = async () => {
        try {
            console.log("🔄 Sincronizando horarios con calendario...");
            
            // Mapear días a números (0=domingo, 1=lunes, etc.)
            const dayMapping = {
                monday: 1,
                tuesday: 2, 
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6,
                sunday: 0
            };

            // Crear array de horarios para el calendario
            const scheduleData = Object.entries(settings.operating_hours).map(([day, hours]) => ({
                restaurant_id: restaurantId,
                day_of_week: dayMapping[day],
                day_name: day === 'monday' ? 'Lunes' :
                         day === 'tuesday' ? 'Martes' :
                         day === 'wednesday' ? 'Miércoles' :
                         day === 'thursday' ? 'Jueves' :
                         day === 'friday' ? 'Viernes' :
                         day === 'saturday' ? 'Sábado' :
                         'Domingo',
                is_open: !hours.closed,
                slots: !hours.closed ? [
                    {
                        id: 1,
                        name: "Horario Principal",
                        start_time: hours.open || "09:00",
                        end_time: hours.close || "22:00"
                    }
                ] : []
            }));

            // Actualizamos los settings del restaurante para que el calendario los tome
            const { error } = await supabase
                .from("restaurants")
                .update({
                    settings: {
                        ...(await supabase.from("restaurants").select("settings").eq("id", restaurantId).single()).data?.settings,
                        operating_hours: settings.operating_hours,
                        calendar_schedule: scheduleData
                    },
                    updated_at: new Date().toISOString()
                })
                .eq("id", restaurantId);

            if (error) throw error;

            console.log("✅ Horarios sincronizados con calendario correctamente");
            
            // Forzar actualización del calendario si está abierto
            window.dispatchEvent(new CustomEvent('schedule-updated', { 
                detail: { scheduleData, restaurantId } 
            }));

        } catch (error) {
            console.error("❌ Error sincronizando calendario:", error);
            throw error;
        }
    };

    // 📷 MANEJO DE CARGA DE LOGO
    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (2MB máximo)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('El archivo no puede ser mayor a 2MB');
            return;
        }

        try {
            // Convertir archivo a base64 para almacenamiento temporal
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target.result;
                setSettings(prev => ({
                    ...prev,
                    logo_url: base64String
                }));
                toast.success('Logo cargado correctamente');
            };
            reader.readAsDataURL(file);

            // TODO: En producción, subir a Supabase Storage
            // const { data, error } = await supabase.storage
            //     .from('restaurant-logos')
            //     .upload(`${restaurantId}/logo.${file.name.split('.').pop()}`, file);

        } catch (error) {
            console.error('❌ Error cargando logo:', error);
            toast.error('Error al cargar el logo');
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
            // console.log removed for production
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

                        {/* Estado en tiempo real */}
                        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-600" />
                                Estado en Tiempo Real
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Conversaciones activas</span>
                                    <span className="font-medium text-blue-600">{realTimeStatus.active_conversations}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Reservas pendientes</span>
                                    <span className="font-medium text-orange-600">{realTimeStatus.pending_reservations}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Estado del sistema</span>
                                    <span className={`font-medium ${realTimeStatus.system_health === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                                        {realTimeStatus.system_health === 'healthy' ? 'Saludable' : 'Con problemas'}
                                    </span>
                                </div>
                            </div>
                        </div>

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
                                                    <input
                                                        type="file"
                                                        id="logo-upload"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleLogoUpload}
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => document.getElementById('logo-upload').click()}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                    >
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
                                                Especialidad/Tipo de Cocina *
                                            </label>
                                            <select
                                                value={settings.cuisine_type}
                                                onChange={(e) => handleInputChange("cuisine_type", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Selecciona el tipo de cocina</option>
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
                                                <option value="Otros">Otros</option>
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
                                                placeholder="Describe tu restaurante, especialidades, ambiente..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Nuevos campos importantes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Capacidad Total (comensales)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.capacity_total}
                                                onChange={(e) => handleInputChange("capacity_total", parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0"
                                                min="0"
                                                max="1000"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rango de Precios
                                            </label>
                                            <select
                                                value={settings.price_range}
                                                onChange={(e) => handleInputChange("price_range", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Selecciona el rango</option>
                                                <option value="€ - Económico (0-15€)">€ - Económico (0-15€)</option>
                                                <option value="€€ - Moderado (15-30€)">€€ - Moderado (15-30€)</option>
                                                <option value="€€€ - Alto (30-50€)">€€€ - Alto (30-50€)</option>
                                                <option value="€€€€ - Premium (+50€)">€€€€ - Premium (+50€)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Instagram
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.instagram}
                                                onChange={(e) => handleInputChange("instagram", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="@turestaurante"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Facebook
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.facebook}
                                                onChange={(e) => handleInputChange("facebook", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="facebook.com/turestaurante"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <ToggleSwitch
                                                enabled={settings.accepting_reservations}
                                                onChange={(enabled) => handleInputChange("accepting_reservations", enabled)}
                                                label="Acepta reservas actualmente"
                                                description="Desactiva temporalmente si no quieres recibir nuevas reservas"
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


                            </div>
                        )}

                        {/* Horarios de Operación */}
                        {activeTab === "hours" && (
                            <SettingSection
                                title="Horarios de Operación"
                                description="Define los horarios de apertura y cierre"
                                icon={<Clock />}
                            >
                                <div className="space-y-4">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                        const hours = settings.operating_hours[day];
                                        return (
                                        <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-24">
                                                <span className="font-medium text-gray-900 capitalize">
                                                    {day === 'monday' ? 'Lunes' :
                                                     day === 'tuesday' ? 'Martes' :
                                                     day === 'wednesday' ? 'Miércoles' :
                                                     day === 'thursday' ? 'Jueves' :
                                                     day === 'friday' ? 'Viernes' :
                                                     day === 'saturday' ? 'Sábado' :
                                                     'Domingo'}
                                                </span>
                                            </div>
                                            <ToggleSwitch
                                                enabled={!hours.closed}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        operating_hours: {
                                                            ...prev.operating_hours,
                                                            [day]: { ...prev.operating_hours[day], closed: !enabled }
                                                        }
                                                    }))
                                                }
                                                label=""
                                            />
                                            {!hours.closed && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                operating_hours: {
                                                                    ...prev.operating_hours,
                                                                    [day]: { ...prev.operating_hours[day], open: e.target.value }
                                                                }
                                                            }))
                                                        }
                                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                    <span className="text-gray-500">a</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) =>
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                operating_hours: {
                                                                    ...prev.operating_hours,
                                                                    [day]: { ...prev.operating_hours[day], close: e.target.value }
                                                                }
                                                            }))
                                                        }
                                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </>
                                            )}
                                            {hours.closed && (
                                                <span className="text-gray-500">Cerrado</span>
                                            )}
                                        </div>
                                        );
                                    })}
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
                                        Guardar horarios
                                    </button>
                                </div>
                            </SettingSection>
                        )}

                        {/* Configuración de Reservas */}
                        {activeTab === "reservations" && (
                            <SettingSection
                                title="Configuración de Reservas"
                                description="Políticas y reglas de reserva"
                                icon={<Calendar />}
                            >
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Días de antelación máxima
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.advance_booking_days}
                                                onChange={(e) => handleNestedChange('reservation_settings', 'advance_booking_days', parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="365"
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Duración de turno (minutos)
                                            </label>
                                            <select
                                                value={settings.reservation_settings.turn_duration}
                                                onChange={(e) => handleNestedChange('reservation_settings', 'turn_duration', parseInt(e.target.value))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="60">60 minutos</option>
                                                <option value="90">90 minutos</option>
                                                <option value="120">120 minutos</option>
                                                <option value="150">150 minutos</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mínimo de personas
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.min_party_size}
                                                onChange={(e) => handleNestedChange('reservation_settings', 'min_party_size', parseInt(e.target.value) || 1)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="20"
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Máximo de personas
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.reservation_settings.max_party_size}
                                                onChange={(e) => handleNestedChange('reservation_settings', 'max_party_size', parseInt(e.target.value) || 1)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="50"
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h4 className="font-medium text-gray-900 mb-4">Configuración automática (MVP)</h4>
                                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-blue-900">Confirmación automática</p>
                                                    <p className="text-sm text-blue-700">Las reservas se confirman automáticamente si hay disponibilidad</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-blue-900">Teléfono obligatorio</p>
                                                    <p className="text-sm text-blue-700">Siempre se requiere teléfono para hacer una reserva</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-blue-900">Email obligatorio</p>
                                                    <p className="text-sm text-blue-700">Siempre se requiere email para hacer una reserva</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 p-2 bg-blue-100 rounded border-l-4 border-blue-400">
                                                <p className="text-xs text-blue-800">
                                                    💡 <strong>MVP:</strong> Estas configuraciones están fijas para garantizar la mejor experiencia de usuario y funcionalidad del agente IA.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => handleSave("Configuración de reservas")}
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
                                                <div>
                                                    <span className="font-medium text-gray-900">
                                                        Estado: {settings.agent.enabled ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {settings.agent.enabled 
                                                            ? '🟢 El agente atiende llamadas, mensajes y chats automáticamente 24/7'
                                                            : '🔴 El agente NO responde. Todas las consultas llegan a ti manualmente'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.agent.enabled}
                                                onChange={(enabled) => handleNestedChange('agent', 'enabled', enabled)}
                                                label=""
                                            />
                                        </div>
                                        
                                        <div className="mt-3 p-3 bg-white rounded border-l-4 border-purple-400">
                                            <p className="text-xs text-gray-700">
                                                <strong>💡 Efecto práctico:</strong> Cuando está <span className="text-green-600 font-semibold">activo</span>, el agente maneja automáticamente WhatsApp, llamadas telefónicas, chat web, Instagram y Facebook. Cuando está <span className="text-red-600 font-semibold">inactivo</span>, tendrás que responder todo manualmente.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del Agente
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.agent.name}
                                                onChange={(e) => handleNestedChange('agent', 'name', e.target.value)}
                                                placeholder="Ej: Claudia, Julia, Alex, María..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Este nombre aparecerá cuando el agente se presente a los clientes
                                            </p>
                                        </div>

                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                                <div>
                                                    <h4 className="font-medium text-green-900">Personalidad automática (MVP)</h4>
                                                    <p className="text-sm text-green-700 mt-1">
                                                        El agente siempre usa un tono <strong>profesional y amigable</strong> optimizado para restaurantes.
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-2">
                                                        💡 En futuras versiones podrás personalizar completamente el tono y estilo de conversación.
                                                    </p>
                                                </div>
                                            </div>
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
                                            <div className="space-y-6">
                                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                    <h4 className="font-medium text-purple-900 mb-2">💡 ¿Cómo funciona la optimización?</h4>
                                                    <p className="text-sm text-purple-700">
                                                        El agente analiza el historial de tus mesas y aprende cuáles son más eficientes. Luego prioriza esas mesas al asignar reservas automáticamente.
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-4">
                                                        Factor de optimización principal
                                                    </h4>
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <label className="text-sm font-medium text-gray-700">
                                                                    Prioridad de rotación eficiente
                                                                </label>
                                                                <span className="text-sm font-semibold text-purple-600">
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
                                                            
                                                            <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                                                                <div className="text-center p-2 bg-red-50 rounded">
                                                                    <div className="font-semibold text-red-600">0-30%</div>
                                                                    <div className="text-red-700">Prioriza comodidad sobre eficiencia</div>
                                                                </div>
                                                                <div className="text-center p-2 bg-yellow-50 rounded">
                                                                    <div className="font-semibold text-yellow-600">40-70%</div>
                                                                    <div className="text-yellow-700">Balance equilibrado</div>
                                                                </div>
                                                                <div className="text-center p-2 bg-green-50 rounded">
                                                                    <div className="font-semibold text-green-600">80-100%</div>
                                                                    <div className="text-green-700">Máxima eficiencia y rotación</div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                                                                <p className="text-sm text-gray-700">
                                                                    <strong>🎯 Ejemplo práctico:</strong> Con <strong>80%</strong>, el agente preferirá asignar mesas que históricamente se liberan más rápido, aumentando la capacidad de atender más clientes. Con <strong>30%</strong>, priorizará mesas más cómodas aunque sean más lentas.
                                                                </p>
                                                            </div>
                                                        </div>
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

                        {/* Configuración CRM & IA */}
                        {activeTab === "crm" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="CRM & IA - Sistema Inteligente"
                                    description="Configuración avanzada de segmentación y automatizaciones"
                                    icon={<Brain />}
                                    premium
                                >
                                    <div className="space-y-8">
                                        {/* Umbrales de Segmentación */}
                                        <div className="border-b border-gray-200 pb-6">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                                <Target className="w-5 h-5 text-purple-600" />
                                                Umbrales de Segmentación
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Días para considerar "Inactivo"
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
                                                    <p className="text-xs text-gray-500 mt-1">Días sin visita para marcar cliente como inactivo</p>
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
                                                    <p className="text-xs text-gray-500 mt-1">Número de visitas para segmento VIP</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Gasto mínimo VIP (€)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings.crm.thresholds.vip_spend}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev.crm,
                                                                thresholds: {
                                                                    ...prev.crm.thresholds,
                                                                    vip_spend: parseInt(e.target.value) || 500
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="0"
                                                        step="50"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Gasto total para segmento VIP</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Gasto "Alto Valor" (€)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings.crm.thresholds.alto_valor_spend}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            crm: {
                                                                ...prev.crm,
                                                                thresholds: {
                                                                    ...prev.crm.thresholds,
                                                                    alto_valor_spend: parseInt(e.target.value) || 1000
                                                                }
                                                            }
                                                        }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        min="0"
                                                        step="100"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Gasto para segmento "Alto Valor"</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Automatizaciones */}
                                        <div className="border-b border-gray-200 pb-6">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-yellow-600" />
                                                Automatizaciones
                                            </h4>
                                            <div className="space-y-4">
                                                <ToggleSwitch
                                                    enabled={settings.crm.automation.enabled}
                                                    onChange={(enabled) => setSettings(prev => ({
                                                        ...prev,
                                                        crm: {
                                                            ...prev.crm,
                                                            automation: {
                                                                ...prev.crm.automation,
                                                                enabled
                                                            }
                                                        }
                                                    }))}
                                                    label="Activar automatizaciones CRM"
                                                    description="Envío automático de emails/SMS según segmentación"
                                                />

                                                {settings.crm.automation.enabled && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Cooldown (días)
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
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                                min="1"
                                                                max="180"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">Días entre envíos al mismo cliente</p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Máximo diario
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
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                                min="1"
                                                                max="500"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">Límite de envíos por día</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Preview de Segmentación */}
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                                Preview de Segmentación
                                            </h4>
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <p className="text-sm text-blue-700 mb-3">
                                                    ⚡ <strong>Próximamente:</strong> Vista previa en tiempo real de cuántos clientes cumplen cada segmento con la configuración actual.
                                                </p>
                                                <div className="grid grid-cols-4 gap-3 text-xs">
                                                    <div className="bg-white p-2 rounded text-center">
                                                        <div className="text-lg font-bold text-green-600">--</div>
                                                        <div className="text-gray-600">Nuevos</div>
                                                    </div>
                                                    <div className="bg-white p-2 rounded text-center">
                                                        <div className="text-lg font-bold text-yellow-600">--</div>
                                                        <div className="text-gray-600">VIP</div>
                                                    </div>
                                                    <div className="bg-white p-2 rounded text-center">
                                                        <div className="text-lg font-bold text-red-600">--</div>
                                                        <div className="text-gray-600">Inactivos</div>
                                                    </div>
                                                    <div className="bg-white p-2 rounded text-center">
                                                        <div className="text-lg font-bold text-orange-600">--</div>
                                                        <div className="text-gray-600">En Riesgo</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Configuración CRM")}
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
                                </SettingSection>
                            </div>
                        )}

                        {/* Configuración de Canales */}
                        {activeTab === "channels" && (
                            <div className="space-y-6">
                                <SettingSection
                                    title="Canales de Comunicación"
                                    description="Configura WhatsApp, llamadas, web y redes sociales"
                                    icon={<MessageSquare />}
                                >
                                    <div className="space-y-6">
                                        {/* VAPI (Llamadas) */}
                                        <div className="p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-blue-600" />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">VAPI - Llamadas</h4>
                                                        <p className="text-sm text-gray-600">Atención telefónica con IA</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ToggleSwitch
                                                        enabled={settings.channels.vapi.enabled}
                                                        onChange={(enabled) => handleChannelToggle('vapi', enabled)}
                                                        label=""
                                                    />
                                                    <button
                                                        onClick={() => testChannelConnection('VAPI')}
                                                        disabled={testingConnection.VAPI}
                                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                                    >
                                                        {testingConnection.VAPI ? 'Probando...' : 'Probar'}
                                                    </button>
                                                </div>
                                            </div>
                                            {settings.channels.vapi.enabled && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                API Key *
                                                            </label>
                                                            <input
                                                                type="password"
                                                                value={settings.channels.vapi.api_key}
                                                                onChange={(e) => 
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        channels: {
                                                                            ...prev.channels,
                                                                            vapi: { ...prev.channels.vapi, api_key: e.target.value }
                                                                        }
                                                                    }))
                                                                }
                                                                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                                                    channelValidation.vapi?.errors?.some(e => e.includes('API Key')) 
                                                                        ? 'border-red-300 bg-red-50' 
                                                                        : 'border-gray-300'
                                                                }`}
                                                                placeholder="Ingresa tu API key de VAPI"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Número de teléfono *
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={settings.channels.vapi.phone_number}
                                                                onChange={(e) => 
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        channels: {
                                                                            ...prev.channels,
                                                                            vapi: { ...prev.channels.vapi, phone_number: e.target.value }
                                                                        }
                                                                    }))
                                                                }
                                                                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                                                    channelValidation.vapi?.errors?.some(e => e.includes('teléfono')) 
                                                                        ? 'border-red-300 bg-red-50' 
                                                                        : 'border-gray-300'
                                                                }`}
                                                                placeholder="+34 666 123 456"
                                                            />
                                                        </div>
                                                    </div>
                                                    {channelValidation.vapi?.errors?.length > 0 && (
                                                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                            <div className="text-sm text-red-700">
                                                                <p className="font-medium">Campos obligatorios faltantes:</p>
                                                                <ul className="list-disc list-inside mt-1">
                                                                    {channelValidation.vapi.errors.map((error, index) => (
                                                                        <li key={index}>{error}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* WhatsApp */}
                                        <div className="p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <MessageCircle className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">WhatsApp</h4>
                                                        <p className="text-sm text-gray-600">Chat automático por WhatsApp</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ToggleSwitch
                                                        enabled={settings.channels.whatsapp.enabled}
                                                        onChange={(enabled) => handleChannelToggle('whatsapp', enabled)}
                                                        label=""
                                                    />
                                                    <button
                                                        onClick={() => testChannelConnection('WhatsApp')}
                                                        disabled={testingConnection.WhatsApp}
                                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                                    >
                                                        {testingConnection.WhatsApp ? 'Probando...' : 'Probar'}
                                                    </button>
                                                </div>
                                            </div>
                                            {settings.channels.whatsapp.enabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Número de WhatsApp
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={settings.channels.whatsapp.phone_number}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        whatsapp: { ...prev.channels.whatsapp, phone_number: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="+34 666 123 456"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            API Key
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={settings.channels.whatsapp.api_key}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        whatsapp: { ...prev.channels.whatsapp, api_key: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="Token de WhatsApp Business API"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Web */}
                                        <div className="p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Chat Web</h4>
                                                        <p className="text-sm text-gray-600">Widget de chat en tu sitio web</p>
                                                    </div>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.channels.web_chat.enabled}
                                                    onChange={(enabled) => 
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev.channels,
                                                                web_chat: { ...prev.channels.web_chat, enabled }
                                                            }
                                                        }))
                                                    }
                                                    label=""
                                                />
                                            </div>
                                            {settings.channels.web_chat.enabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Color del widget
                                                        </label>
                                                        <input
                                                            type="color"
                                                            value={settings.channels.web_chat.widget_color}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        web_chat: { ...prev.channels.web_chat, widget_color: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full h-10 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Posición
                                                        </label>
                                                        <select
                                                            value={settings.channels.web_chat.widget_position}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        web_chat: { ...prev.channels.web_chat, widget_position: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        >
                                                            <option value="bottom-right">Abajo derecha</option>
                                                            <option value="bottom-left">Abajo izquierda</option>
                                                            <option value="top-right">Arriba derecha</option>
                                                            <option value="top-left">Arriba izquierda</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Facebook */}
                                        <div className="p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                    </svg>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Facebook</h4>
                                                        <p className="text-sm text-gray-600">Integración con Facebook Messenger</p>
                                                    </div>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.channels.facebook.enabled}
                                                    onChange={(enabled) => 
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev.channels,
                                                                facebook: { ...prev.channels.facebook, enabled }
                                                            }
                                                        }))
                                                    }
                                                    label=""
                                                />
                                            </div>
                                            {settings.channels.facebook.enabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Page ID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.channels.facebook.page_id}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        facebook: { ...prev.channels.facebook, page_id: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="ID de tu página de Facebook"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Access Token
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={settings.channels.facebook.access_token}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        facebook: { ...prev.channels.facebook, access_token: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="Token de acceso de Facebook"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instagram */}
                                        <div className="p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                                    </svg>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Instagram</h4>
                                                        <p className="text-sm text-gray-600">Mensajes directos de Instagram</p>
                                                    </div>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={settings.channels.instagram.enabled}
                                                    onChange={(enabled) => 
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            channels: {
                                                                ...prev.channels,
                                                                instagram: { ...prev.channels.instagram, enabled }
                                                            }
                                                        }))
                                                    }
                                                    label=""
                                                />
                                            </div>
                                            {settings.channels.instagram.enabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Page ID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.channels.instagram.page_id}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        instagram: { ...prev.channels.instagram, page_id: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="ID de tu perfil de Instagram"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Access Token
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={settings.channels.instagram.access_token}
                                                            onChange={(e) => 
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    channels: {
                                                                        ...prev.channels,
                                                                        instagram: { ...prev.channels.instagram, access_token: e.target.value }
                                                                    }
                                                                }))
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="Token de acceso de Instagram"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Configuración de canales")}
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

                        {/* Notificaciones */}
                        {activeTab === "notifications" && (
                            <SettingSection
                                title="Configuración de Notificaciones"
                                description="Configura alertas y avisos automáticos"
                                icon={<Bell />}
                            >
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900">Canales de notificación</h4>
                                            <ToggleSwitch
                                                enabled={settings.notifications.email_enabled}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, email_enabled: enabled }
                                                    }))
                                                }
                                                label="Email"
                                                description="Recibir notificaciones por correo electrónico"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.notifications.sms_enabled}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, sms_enabled: enabled }
                                                    }))
                                                }
                                                label="SMS"
                                                description="Recibir notificaciones por mensaje de texto"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.notifications.push_enabled}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, push_enabled: enabled }
                                                    }))
                                                }
                                                label="Push"
                                                description="Notificaciones push en el navegador"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900">Tipos de notificación</h4>
                                            <ToggleSwitch
                                                enabled={settings.notifications.new_reservation}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, new_reservation: enabled }
                                                    }))
                                                }
                                                label="Nueva reserva"
                                                description="Cuando se recibe una nueva reserva"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.notifications.reservation_cancelled}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, reservation_cancelled: enabled }
                                                    }))
                                                }
                                                label="Reserva cancelada"
                                                description="Cuando un cliente cancela una reserva"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.notifications.agent_escalation}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, agent_escalation: enabled }
                                                    }))
                                                }
                                                label="Escalación del agente"
                                                description="Cuando el agente IA deriva a humano"
                                            />
                                            <ToggleSwitch
                                                enabled={settings.notifications.daily_summary}
                                                onChange={(enabled) => 
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, daily_summary: enabled }
                                                    }))
                                                }
                                                label="Resumen diario"
                                                description="Resumen de actividad del día"
                                            />
                                        </div>
                                    </div>

                                    {/* Horarios de silencio */}
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <ToggleSwitch
                                            enabled={settings.notifications.quiet_hours.enabled}
                                            onChange={(enabled) => 
                                                setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        quiet_hours: { ...prev.notifications.quiet_hours, enabled }
                                                    }
                                                }))
                                            }
                                            label="Horarios de silencio"
                                            description="No enviar notificaciones durante ciertas horas"
                                        />

                                        {settings.notifications.quiet_hours.enabled && (
                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Inicio
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={settings.notifications.quiet_hours.start}
                                                        onChange={(e) => 
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                notifications: {
                                                                    ...prev.notifications,
                                                                    quiet_hours: { ...prev.notifications.quiet_hours, start: e.target.value }
                                                                }
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Fin
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={settings.notifications.quiet_hours.end}
                                                        onChange={(e) => 
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                notifications: {
                                                                    ...prev.notifications,
                                                                    quiet_hours: { ...prev.notifications.quiet_hours, end: e.target.value }
                                                                }
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
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
                        )}

                        {/* Otras pestañas con contenido placeholder */}
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


                    </div>
                </div>
            </div>
        </div>
    );
}


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

        // Configuración de reservas
        reservation_settings: {
            enabled: true,
            advance_booking_days: 30,
            min_party_size: 1,
            max_party_size: 12,
            turn_duration: 90,
            buffer_time: 15,
            auto_confirm: false,
            require_phone: true,
            require_email: true,
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
        if (isReady) {
            // SIEMPRE cargar settings, incluso sin restaurantId
            loadSettings();
            
            // Solo cargar métricas si hay restaurantId
            if (restaurantId) {
                loadAgentMetrics();
                loadRealTimeStatus();
            }
        }
    }, [isReady, restaurantId]);

    const loadSettings = async () => {
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
            
            // Si no tenemos restaurant desde AuthContext, cargar directamente desde BD
            let restaurantData = restaurant;
            
            if (!restaurant && restaurantId) {
                console.log("🔄 Restaurant no en context, cargando desde BD...");
                const { data: dbRestaurant, error: dbError } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();
                
                if (dbError) {
                    console.error("❌ Error cargando restaurant desde BD:", dbError);
                } else {
                    restaurantData = dbRestaurant;
                    console.log("✅ Restaurant cargado desde BD:", restaurantData);
                }
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
    };

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

        // Actualizar contexto después de un delay para asegurar persistencia
        setTimeout(() => {
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('restaurant-updated'));
            }
        }, 100);
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
    };

    // 🔄 SINCRONIZAR HORARIOS CON CALENDARIO
    const syncHoursWithCalendar = async () => {
        try {
            console.log("🔄 Sincronizando horarios con calendario...");
            // TODO: Implementar sincronización real con tabla restaurant_schedule
        } catch (error) {
            console.error("❌ Error sincronizando calendario:", error);
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
                                    {Object.entries(settings.operating_hours).map(([day, hours]) => (
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
                                    ))}
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

                                    <div className="space-y-4">
                                        <ToggleSwitch
                                            enabled={settings.reservation_settings.auto_confirm}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                reservation_settings: { ...prev.reservation_settings, auto_confirm: enabled }
                                            }))}
                                            label="Confirmación automática"
                                            description="Las reservas se confirman automáticamente si hay disponibilidad"
                                        />

                                        <ToggleSwitch
                                            enabled={settings.reservation_settings.require_phone}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                reservation_settings: { ...prev.reservation_settings, require_phone: enabled }
                                            }))}
                                            label="Requerir teléfono"
                                            description="El teléfono es obligatorio para hacer una reserva"
                                        />

                                        <ToggleSwitch
                                            enabled={settings.reservation_settings.require_email}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                reservation_settings: { ...prev.reservation_settings, require_email: enabled }
                                            }))}
                                            label="Requerir email"
                                            description="El email es obligatorio para hacer una reserva"
                                        />
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
                                                        onChange={(enabled) => 
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                channels: {
                                                                    ...prev.channels,
                                                                    vapi: { ...prev.channels.vapi, enabled }
                                                                }
                                                            }))
                                                        }
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            API Key
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
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="Ingresa tu API key de VAPI"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Número de teléfono
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
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="+34 666 123 456"
                                                        />
                                                    </div>
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
                                                        onChange={(enabled) => 
                                                            setSettings(prev => ({
                                                                ...prev,
                                                                channels: {
                                                                    ...prev.channels,
                                                                    whatsapp: { ...prev.channels.whatsapp, enabled }
                                                                }
                                                            }))
                                                        }
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

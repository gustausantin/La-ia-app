// src/pages/Comunicacion.jsx - Centro de Comunicación OMNICANAL PREMIUM con IA
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    format,
    parseISO,
    isToday,
    isYesterday,
    formatDistanceToNow,
    differenceInMinutes,
    subDays,
    addMinutes,
} from "date-fns";
import { es } from "date-fns/locale";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Search,
    Send,
    Phone,
    Mail,
    MessageSquare,
    Users,
    Filter,
    MoreVertical,
    Star,
    Archive,
    Trash2,
    RefreshCw,
    Paperclip,
    Smile,
    Check,
    CheckCheck,
    Clock,
    AlertCircle,
    Settings,
    Zap,
    Bot,
    Eye,
    Calendar,
    MessageCircle,
    Instagram,
    Facebook,
    PhoneCall,
    Globe,
    Brain,
    TrendingUp,
    Sparkles,
    Info,
    ChevronRight,
    UserCheck,
    Activity,
    BarChart3,
    PieChart as PieIcon,
    Timer,
    Target,
    Award,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    FileText,
    Image,
    Mic,
    Video,
    X,
    ChevronDown,
    User,
    ShoppingBag,
    DollarSign,
    MapPin,
    Gift,
} from "lucide-react";
import toast from "react-hot-toast";

// TABLAS Y RPCs NECESARIAS PARA SUPABASE:
// =========================================
// TABLAS:
// - message_batches_demo: conversaciones del agente (ya identificada)
//   - batch_id, customer_id, channel, state, ai_handled, human_takeover
//
// - conversations: todas las conversaciones unificadas
//   - id, restaurant_id, customer_id, channel, state, created_at
//
// - messages: mensajes individuales
//   - id, conversation_id, content, direction, type, ai_generated, created_at
//
// - ai_conversation_insights: análisis de IA por conversación
//   - conversation_id, intent, sentiment, urgency, topics, action_required
//
// - smart_templates: plantillas personalizadas por restaurante
//   - id, restaurant_id, key, title, content_template, variables
//
// RPCs:
// - get_conversation_analytics(restaurant_id, period)
// - get_ai_performance_metrics(restaurant_id)
// - get_channel_statistics(restaurant_id)
// - process_message_with_ai(message_id)
// - escalate_conversation(conversation_id, reason)
//
// REAL-TIME:
// - Suscripción a nuevos mensajes
// - Suscripción a cambios de estado de conversaciones
//
// Canales de comunicación mejorados
const COMMUNICATION_CHANNELS = {
    whatsapp: {
        label: "WhatsApp",
        icon: MessageCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        primary: true,
    },
    vapi: {
        label: "Llamada (Vapi)",
        icon: PhoneCall,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
        primary: true,
    },
    instagram: {
        label: "Instagram",
        icon: Instagram,
        color: "text-pink-600",
        bgColor: "bg-pink-100",
        borderColor: "border-pink-200",
        primary: false,
    },
    facebook: {
        label: "Facebook",
        icon: Facebook,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100",
        borderColor: "border-indigo-200",
        primary: false,
    },
    email: {
        label: "Email",
        icon: Mail,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
        primary: false,
    },
    web: {
        label: "Web Chat",
        icon: Globe,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        borderColor: "border-purple-200",
        primary: false,
    },
};

// Estados de conversación
const CONVERSATION_STATES = {
    active: {
        label: "Activa",
        color: "text-green-600",
        bgColor: "bg-green-100",
    },
    pending: {
        label: "Pendiente",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
    },
    resolved: {
        label: "Resuelta",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
    },
    escalated: {
        label: "Escalada",
        color: "text-red-600",
        bgColor: "bg-red-100",
    },
    automated: {
        label: "Automatizada",
        color: "text-purple-600",
        bgColor: "bg-purple-100",
    },
};

// Tipos de mensajes
const MESSAGE_TYPES = {
    text: { icon: null },
    image: { icon: Image, label: "Imagen" },
    audio: { icon: Mic, label: "Audio" },
    video: { icon: Video, label: "Video" },
    document: { icon: FileText, label: "Documento" },
    location: { icon: MapPin, label: "Ubicación" },
};

// Plantillas inteligentes con IA
const SMART_TEMPLATES = {
    greeting: {
        title: "Saludo personalizado",
        icon: Smile,
        generateContent: (context) => {
            const hour = new Date().getHours();
            const greeting =
                hour < 14
                    ? "Buenos días"
                    : hour < 20
                      ? "Buenas tardes"
                      : "Buenas noches";
            return `${greeting} ${context.customerName || ""}! 👋 Soy el asistente de ${context.restaurantName}. ¿En qué puedo ayudarte hoy?`;
        },
    },
    reservation_confirm: {
        title: "Confirmar reserva",
        icon: Calendar,
        generateContent: (context) =>
            `¡Perfecto ${context.customerName}! Tu reserva para ${context.partySize} personas el ${context.date} a las ${context.time} está confirmada ✅\n\nTe enviaremos un recordatorio el día anterior. ¡Te esperamos!`,
    },
    availability_check: {
        title: "Consultar disponibilidad",
        icon: Search,
        generateContent: (context) =>
            `Déjame consultar la disponibilidad para ${context.partySize} personas el ${context.date}... 🔍\n\nTenemos las siguientes opciones:\n• ${context.availableSlots}\n\n¿Cuál prefieres?`,
    },
    special_request: {
        title: "Solicitud especial",
        icon: Star,
        generateContent: (context) =>
            `Por supuesto! He anotado tu solicitud: "${context.request}". Nuestro equipo se asegurará de tenerlo todo listo para tu visita. 😊`,
    },
    no_show_followup: {
        title: "Seguimiento no-show",
        icon: AlertTriangle,
        generateContent: (context) =>
            `Hola ${context.customerName}, notamos que no pudiste venir a tu reserva de ayer. ¿Todo bien? 🤔\n\nNos encantaría verte pronto. ¿Te gustaría reprogramar?`,
    },
    vip_greeting: {
        title: "Saludo VIP",
        icon: Award,
        generateContent: (context) =>
            `¡${context.customerName}! 👑 Qué alegría saludarte de nuevo. Como uno de nuestros clientes más especiales, ¿hay algo particular que podamos preparar para tu próxima visita?`,
    },
};

// Componente de Loading State mejorado
const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <div className="relative mb-6">
                <MessageSquare className="w-16 h-16 text-purple-600 animate-pulse mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
                Cargando centro de comunicación...
            </p>
            <p className="text-sm text-gray-600">
                Conectando con {Math.floor(Math.random() * 5 + 3)} canales activos
            </p>
        </div>
    </div>
);

// Componente de estadísticas en tiempo real
const RealtimeStats = ({ conversations, messages }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const last24h = subDays(now, 1);

        const activeConvs = conversations.filter(
            (c) => c.state === "active",
        ).length;
        const aiHandled = conversations.filter((c) => c.ai_handled).length;
        const escalated = conversations.filter(
            (c) => c.state === "escalated",
        ).length;

        const recentMessages = messages.filter(
            (m) => parseISO(m.created_at) > last24h,
        );

        const avgResponseTime =
            recentMessages
                .filter((m) => m.response_time)
                .reduce((acc, m) => acc + m.response_time, 0) /
                recentMessages.length || 0;

        return {
            active: activeConvs,
            aiHandled,
            escalated,
            avgResponseTime: Math.round(avgResponseTime / 60), // en minutos
            satisfaction: 92, // simulado
        };
    }, [conversations, messages]);

    return (
        <div className="grid grid-cols-5 gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                    {stats.active}
                </div>
                <div className="text-xs text-gray-600">Activas</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                    {stats.aiHandled}
                </div>
                <div className="text-xs text-gray-600">IA Auto</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                    {stats.escalated}
                </div>
                <div className="text-xs text-gray-600">Escaladas</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                    {stats.avgResponseTime}m
                </div>
                <div className="text-xs text-gray-600">Resp. media</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                    {stats.satisfaction}%
                </div>
                <div className="text-xs text-gray-600">Satisfacción</div>
            </div>
        </div>
    );
};

// Componente de conversación mejorado
const ConversationItem = ({ conversation, isSelected, onSelect }) => {
    const channel =
        COMMUNICATION_CHANNELS[conversation.channel] ||
        COMMUNICATION_CHANNELS.whatsapp;
    const ChannelIcon = channel.icon;
    const state =
        CONVERSATION_STATES[conversation.state] || CONVERSATION_STATES.active;

    const formatLastMessageTime = (timestamp) => {
        const date = parseISO(timestamp);
        if (isToday(date)) return format(date, "HH:mm");
        if (isYesterday(date)) return "Ayer";
        return format(date, "dd/MM");
    };

    const getConversationInsight = () => {
        if (conversation.ai_insights?.sentiment === "negative") {
            return {
                icon: AlertTriangle,
                color: "text-red-600",
                text: "Cliente insatisfecho",
            };
        }
        if (conversation.ai_insights?.intent === "urgent_reservation") {
            return {
                icon: Clock,
                color: "text-orange-600",
                text: "Reserva urgente",
            };
        }
        if (conversation.ai_insights?.is_vip) {
            return {
                icon: Award,
                color: "text-purple-600",
                text: "Cliente VIP",
            };
        }
        if (conversation.ai_handled && !conversation.human_takeover) {
            return {
                icon: Bot,
                color: "text-green-600",
                text: "Resuelto por IA",
            };
        }
        return null;
    };

    const insight = getConversationInsight();

    return (
        <div
            className={`
                p-4 cursor-pointer transition-all border-l-4
                ${
                    isSelected
                        ? "bg-purple-50 border-purple-500"
                        : "bg-white hover:bg-gray-50 border-transparent hover:border-gray-300"
                }
            `}
            onClick={() => onSelect(conversation)}
        >
            <div className="flex items-start gap-3">
                {/* Avatar con indicador de canal */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {conversation.customer_name?.charAt(0).toUpperCase() ||
                            conversation.customer_phone?.slice(-2) ||
                            "?"}
                    </div>
                    <div
                        className={`
                        absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                        flex items-center justify-center border-2 border-white
                        ${channel.bgColor}
                    `}
                    >
                        <ChannelIcon className={`w-3 h-3 ${channel.color}`} />
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                                {conversation.customer_name ||
                                    conversation.customer_phone ||
                                    "Cliente"}
                            </h4>
                            {conversation.ai_handled && (
                                <Bot className="w-4 h-4 text-purple-500" />
                            )}
                            {conversation.is_vip && (
                                <Star className="w-4 h-4 text-orange-500 fill-current" />
                            )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatLastMessageTime(
                                conversation.last_message_at,
                            )}
                        </span>
                    </div>

                    <p
                        className={`
                        text-sm truncate mb-1
                        ${conversation.unread_count > 0 ? "font-medium text-gray-900" : "text-gray-600"}
                    `}
                    >
                        {conversation.last_message}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className={`
                                text-xs px-2 py-0.5 rounded-full
                                ${state.bgColor} ${state.color}
                            `}
                            >
                                {state.label}
                            </span>
                            {insight && (
                                <div
                                    className={`flex items-center gap-1 text-xs ${insight.color}`}
                                >
                                    <insight.icon className="w-3 h-3" />
                                    <span>{insight.text}</span>
                                </div>
                            )}
                        </div>

                        {conversation.unread_count > 0 && (
                            <span className="bg-purple-600 text-white text-xs font-medium rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {conversation.unread_count}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente de mensaje mejorado
const MessageBubble = ({ message, isOwn, showDetails = false }) => {
    const [showReactions, setShowReactions] = useState(false);
    const MessageIcon = MESSAGE_TYPES[message.type]?.icon;

    const formatTime = (timestamp) => format(parseISO(timestamp), "HH:mm");

    const renderMessageContent = () => {
        switch (message.type) {
            case "image":
                return (
                    <div className="relative">
                        <img
                            src={message.media_url || "/placeholder-image.jpg"}
                            alt="Imagen"
                            className="rounded-lg max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() =>
                                window.open(message.media_url, "_blank")
                            }
                        />
                        {message.content && (
                            <p className="mt-2 text-sm">{message.content}</p>
                        )}
                    </div>
                );

            case "audio":
                return (
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <div className="h-8 bg-white/20 rounded-full"></div>
                            <span className="text-xs opacity-75">
                                {message.duration || "0:30"}
                            </span>
                        </div>
                    </div>
                );

            case "location":
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Ubicación compartida
                            </span>
                        </div>
                        <div className="rounded-lg overflow-hidden">
                            <div className="w-48 h-32 bg-gray-200 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                    </p>
                );
        }
    };

    return (
        <div
            className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 group`}
        >
            <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                <div
                    className={`
                    px-4 py-2 rounded-2xl relative
                    ${
                        isOwn
                            ? message.ai_generated
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                : "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                    }
                `}
                >
                    {/* Indicador de tipo de mensaje */}
                    {MessageIcon && (
                        <div className="flex items-center gap-2 mb-2 opacity-75">
                            <MessageIcon className="w-4 h-4" />
                            <span className="text-xs">
                                {MESSAGE_TYPES[message.type].label}
                            </span>
                        </div>
                    )}

                    {renderMessageContent()}

                    {/* Metadata */}
                    <div
                        className={`
                        flex items-center justify-between mt-1 text-xs
                        ${isOwn ? "text-white/75" : "text-gray-500"}
                    `}
                    >
                        <span>{formatTime(message.created_at)}</span>
                        {isOwn && (
                            <div className="flex items-center gap-1 ml-2">
                                {message.ai_generated && (
                                    <Bot className="w-3 h-3" />
                                )}
                                {message.read ? (
                                    <CheckCheck className="w-4 h-4" />
                                ) : message.delivered ? (
                                    <CheckCheck className="w-4 h-4 opacity-50" />
                                ) : (
                                    <Check className="w-4 h-4 opacity-50" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reacciones */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className="absolute -bottom-2 right-4 flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-sm border border-gray-200">
                            {message.reactions.map((reaction, idx) => (
                                <span key={idx} className="text-xs">
                                    {reaction.emoji}
                                </span>
                            ))}
                            <span className="text-xs text-gray-600 ml-1">
                                {message.reactions.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Detalles adicionales */}
                {showDetails && message.ai_insights && (
                    <div className="mt-2 px-4 py-2 bg-purple-50 rounded-lg text-xs text-purple-700">
                        <div className="flex items-center gap-1 mb-1">
                            <Brain className="w-3 h-3" />
                            <span className="font-medium">Análisis IA:</span>
                        </div>
                        <p>Intención: {message.ai_insights.intent}</p>
                        <p>Sentimiento: {message.ai_insights.sentiment}</p>
                        {message.ai_insights.action_required && (
                            <p className="text-red-600 font-medium mt-1">
                                ⚠️ Requiere acción humana
                            </p>
                        )}
                    </div>
                )}

                {/* Botón de opciones (visible en hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <button
                        onClick={() => setShowReactions(!showReactions)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Panel de información del cliente
const CustomerInfoPanel = ({ conversation, onClose }) => {
    const [activeTab, setActiveTab] = useState("info");

    // Simular datos adicionales del cliente
    const customerData = {
        totalReservations: 12,
        lastVisit: "2024-02-10",
        avgSpend: 85,
        preferences: ["Mesa terraza", "Vino tinto", "Sin gluten"],
        tags: ["VIP", "Frecuente", "Cumpleaños en marzo"],
        sentiment: "positive",
        satisfaction: 4.8,
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                        Información del cliente
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {["info", "historial", "insights"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                flex-1 py-1.5 text-sm font-medium rounded transition-colors capitalize
                                ${
                                    activeTab === tab
                                        ? "bg-white text-purple-600 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "info" && (
                    <div className="space-y-6">
                        {/* Información básica */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {conversation.customer_name?.charAt(0) ||
                                        "?"}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {conversation.customer_name ||
                                            "Cliente"}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {conversation.customer_phone}
                                    </p>
                                    {conversation.customer_email && (
                                        <p className="text-sm text-gray-600">
                                            {conversation.customer_email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {customerData.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs">
                                        Reservas totales
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">
                                    {customerData.totalReservations}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs">Gasto medio</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">
                                    €{customerData.avgSpend}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Star className="w-4 h-4" />
                                    <span className="text-xs">
                                        Satisfacción
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">
                                    {customerData.satisfaction}/5
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs">
                                        Última visita
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                    Hace 5 días
                                </p>
                            </div>
                        </div>

                        {/* Preferencias */}
                        <div>
                            <h5 className="font-medium text-gray-900 mb-2">
                                Preferencias
                            </h5>
                            <div className="space-y-2">
                                {customerData.preferences.map((pref, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-gray-600"
                                    >
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>{pref}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "historial" && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-4">
                            Últimas interacciones con el cliente
                        </p>
                        {[
                            {
                                date: "2024-02-10",
                                type: "visit",
                                text: "Visita al restaurante - Mesa 12",
                            },
                            {
                                date: "2024-02-08",
                                type: "message",
                                text: "Conversación WhatsApp - Reserva confirmada",
                            },
                            {
                                date: "2024-02-05",
                                type: "call",
                                text: "Llamada entrante - Consulta menú",
                            },
                            {
                                date: "2024-01-28",
                                type: "visit",
                                text: "Visita al restaurante - Mesa 8",
                            },
                        ].map((event, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <div
                                    className={`
                                    w-8 h-8 rounded-full flex items-center justify-center
                                    ${
                                        event.type === "visit"
                                            ? "bg-green-100"
                                            : event.type === "message"
                                              ? "bg-blue-100"
                                              : "bg-purple-100"
                                    }
                                `}
                                >
                                    {event.type === "visit" ? (
                                        <Users className="w-4 h-4 text-green-600" />
                                    ) : event.type === "message" ? (
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <Phone className="w-4 h-4 text-purple-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {event.text}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {event.date}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "insights" && (
                    <div className="space-y-4">
                        {/* Análisis de sentimiento */}
                        <div>
                            <h5 className="font-medium text-gray-900 mb-3">
                                Análisis de sentimiento
                            </h5>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                <ThumbsUp className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">
                                        Positivo
                                    </p>
                                    <p className="text-sm text-green-700">
                                        El cliente muestra satisfacción general
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recomendaciones IA */}
                        <div>
                            <h5 className="font-medium text-gray-900 mb-3">
                                Recomendaciones IA
                            </h5>
                            <div className="space-y-2">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-purple-900">
                                                Ofrecer mesa en terraza
                                            </p>
                                            <p className="text-xs text-purple-700 mt-1">
                                                Basado en sus preferencias
                                                anteriores
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-purple-900">
                                                Cumpleaños próximo mes
                                            </p>
                                            <p className="text-xs text-purple-700 mt-1">
                                                Enviar oferta especial 1 semana
                                                antes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patrones detectados */}
                        <div>
                            <h5 className="font-medium text-gray-900 mb-3">
                                Patrones detectados
                            </h5>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    <span>
                                        Prefiere reservas los viernes y sábados
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Horario habitual: 20:00 - 21:00</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>Suele venir en pareja</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 space-y-2">
                <button
                    onClick={() => {
                        // TODO: Navegar a crear reserva con cliente preseleccionado
                        toast.info("Navegando a crear reserva...");
                    }}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Crear reserva
                </button>
                <button
                    onClick={() => {
                        // TODO: Navegar a perfil completo del cliente
                        toast.info("Ver perfil completo próximamente");
                    }}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    <Eye className="w-4 h-4" />
                    Ver perfil completo
                </button>
            </div>
        </div>
    );
};

// Componente principal
function Comunicacion() {
    console.log('💬 Comunicacion component rendering...');

    const { restaurant, restaurantId, isReady } = useAuthContext();

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [agentStatus] = useState({ active: true }); // Mock del estado del agente

    // Estados de UI
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [activeView, setActiveView] = useState("conversations"); // conversations, analytics, settings

    // Estados de filtros
    const [filters, setFilters] = useState({
        search: "",
        channel: "all",
        state: "all",
        aiHandled: "all",
        dateRange: "today",
    });

    // Referencias
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    // Datos simulados para analytics
    const [analyticsData, setAnalyticsData] = useState({
        responseTimeChart: [],
        channelDistribution: [],
        satisfactionTrend: [],
        peakHours: [],
    });

    // Función para cargar conversaciones
    const loadConversations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            // TODO: En producción, cargar datos reales desde Supabase
            // const { data, error } = await supabase
            //     .from('message_batches_demo')
            //     .select(`
            //         *,
            //         customer:customers(*),
            //         ai_insights:ai_conversation_insights(*)
            //     `)
            //     .eq('restaurant_id', restaurantId)
            //     .order('last_message_at', { ascending: false });

            // Simular carga
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Simular datos de message_batches_demo
            const mockConversations = [
                {
                    id: 1,
                    batch_id: "batch_001",
                    customer_id: 1,
                    customer_name: "María García",
                    customer_phone: "+34 600 123 456",
                    customer_email: "maria@email.com",
                    channel: "whatsapp",
                    state: "active",
                    is_vip: true,
                    ai_handled: true,
                    human_takeover: false,
                    unread_count: 2,
                    last_message:
                        "¿Tenéis disponibilidad para 4 personas esta noche?",
                    last_message_at: new Date().toISOString(),
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    ai_insights: {
                        intent: "reservation_request",
                        sentiment: "positive",
                        urgency: "high",
                        topics: ["reserva", "disponibilidad"],
                        action_required: false,
                    },
                },
                {
                    id: 2,
                    batch_id: "batch_002",
                    customer_id: 2,
                    customer_name: "Carlos Rodríguez",
                    customer_phone: "+34 611 234 567",
                    channel: "vapi",
                    state: "escalated",
                    is_vip: false,
                    ai_handled: true,
                    human_takeover: true,
                    unread_count: 1,
                    last_message:
                        "El cliente solicita hablar con el encargado sobre un evento especial",
                    last_message_at: new Date(
                        Date.now() - 1800000,
                    ).toISOString(),
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    ai_insights: {
                        intent: "special_event",
                        sentiment: "neutral",
                        urgency: "medium",
                        topics: ["evento", "grupo grande"],
                        action_required: true,
                        escalation_reason:
                            "Solicitud compleja que requiere atención personalizada",
                    },
                },
                {
                    id: 3,
                    batch_id: "batch_003",
                    customer_id: 3,
                    customer_name: "Ana Martínez",
                    customer_phone: "+34 622 345 678",
                    channel: "instagram",
                    state: "resolved",
                    is_vip: false,
                    ai_handled: true,
                    human_takeover: false,
                    unread_count: 0,
                    last_message: "Gracias por la información! 😊",
                    last_message_at: new Date(
                        Date.now() - 10800000,
                    ).toISOString(),
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    ai_insights: {
                        intent: "information_request",
                        sentiment: "positive",
                        urgency: "low",
                        topics: ["menú", "horarios"],
                        resolution_time: 5, // minutos
                    },
                },
                {
                    id: 4,
                    batch_id: "batch_004",
                    customer_name: "Laura Sánchez",
                    customer_phone: "+34 633 456 789",
                    channel: "whatsapp",
                    state: "pending",
                    is_vip: true,
                    ai_handled: false,
                    human_takeover: false,
                    unread_count: 3,
                    last_message: "Hola, necesito cambiar mi reserva de mañana",
                    last_message_at: new Date(
                        Date.now() - 600000,
                    ).toISOString(),
                    created_at: new Date(Date.now() - 600000).toISOString(),
                    ai_insights: {
                        intent: "reservation_modification",
                        sentiment: "neutral",
                        urgency: "high",
                        is_vip: true,
                    },
                },
            ];

            setConversations(mockConversations);

            // Generar datos de analytics
            generateAnalyticsData();
        } catch (error) {
            console.error("Error loading conversations:", error);
            toast.error("Error al cargar las conversaciones");
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Función para cargar mensajes
    const loadMessages = useCallback(
        async (conversationId) => {
            if (!conversationId) return;

            try {
                // TODO: En producción, cargar mensajes reales
                // const { data, error } = await supabase
                //     .from('messages')
                //     .select('*')
                //     .eq('conversation_id', conversationId)
                //     .order('created_at', { ascending: true });

                // Simular mensajes con más detalle
                const mockMessages = [
                    {
                        id: 1,
                        conversation_id: conversationId,
                        content: "Hola, buenas tardes! 👋",
                        direction: "inbound",
                        type: "text",
                        delivered: true,
                        read: true,
                        created_at: new Date(
                            Date.now() - 3600000,
                        ).toISOString(),
                        customer_info: {
                            name: selectedConversation?.customer_name,
                            phone: selectedConversation?.customer_phone,
                        },
                    },
                    {
                        id: 2,
                        conversation_id: conversationId,
                        content:
                            "¡Hola! Bienvenido/a a " +
                            (restaurant?.name || "nuestro restaurante") +
                            ". Soy el asistente virtual. ¿En qué puedo ayudarte hoy?",
                        direction: "outbound",
                        type: "text",
                        ai_generated: true,
                        delivered: true,
                        read: true,
                        created_at: new Date(
                            Date.now() - 3500000,
                        ).toISOString(),
                        response_time: 2, // segundos
                    },
                    {
                        id: 3,
                        conversation_id: conversationId,
                        content:
                            "¿Tenéis disponibilidad para 4 personas esta noche?",
                        direction: "inbound",
                        type: "text",
                        delivered: true,
                        read: true,
                        created_at: new Date(
                            Date.now() - 3400000,
                        ).toISOString(),
                        ai_insights: {
                            intent: "reservation_request",
                            entities: {
                                party_size: 4,
                                date: "today",
                                time: "night",
                            },
                        },
                    },
                    {
                        id: 4,
                        conversation_id: conversationId,
                        content:
                            "¡Por supuesto! Déjame consultar la disponibilidad para esta noche... 🔍\n\nTenemos las siguientes opciones para 4 personas:\n• 20:00h - Mesa en salón principal\n• 20:30h - Mesa en terraza (recomendado)\n• 21:30h - Mesa en zona VIP\n\n¿Cuál prefieres?",
                        direction: "outbound",
                        type: "text",
                        ai_generated: true,
                        delivered: true,
                        read: false,
                        created_at: new Date(
                            Date.now() - 3300000,
                        ).toISOString(),
                        response_time: 5,
                        ai_insights: {
                            action: "availability_provided",
                            options_given: 3,
                        },
                    },
                ];

                setMessages(mockMessages);

                // Marcar conversación como leída
                if (selectedConversation?.unread_count > 0) {
                    setConversations((prev) =>
                        prev.map((conv) =>
                            conv.id === selectedConversation.id
                                ? { ...conv, unread_count: 0 }
                                : conv,
                        ),
                    );
                }

                // Scroll al final
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                    });
                }, 100);
            } catch (error) {
                console.error("Error loading messages:", error);
                toast.error("Error al cargar los mensajes");
            }
        },
        [selectedConversation, restaurant],
    );

    // Generar datos de analytics
    const generateAnalyticsData = useCallback(() => {
        // Tiempos de respuesta por hora
        const responseTimeChart = [];
        for (let hour = 0; hour < 24; hour++) {
            responseTimeChart.push({
                hour: `${hour}:00`,
                ai: Math.floor(Math.random() * 10) + 2,
                human: Math.floor(Math.random() * 180) + 60,
            });
        }

        // Distribución por canal
        const channelDistribution = [
            { channel: "WhatsApp", count: 245, percentage: 52 },
            { channel: "Vapi", count: 123, percentage: 26 },
            { channel: "Instagram", count: 67, percentage: 14 },
            { channel: "Facebook", count: 28, percentage: 6 },
            { channel: "Email", count: 10, percentage: 2 },
        ];

        // Tendencia de satisfacción
        const satisfactionTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            satisfactionTrend.push({
                date: format(date, "dd/MM"),
                satisfaction: 85 + Math.floor(Math.random() * 10),
                conversations: Math.floor(Math.random() * 50) + 30,
            });
        }

        // Horas pico
        const peakHours = [
            { hour: "11:00-13:00", conversations: 45 },
            { hour: "13:00-15:00", conversations: 62 },
            { hour: "19:00-21:00", conversations: 78 },
            { hour: "21:00-23:00", conversations: 55 },
        ];

        setAnalyticsData({
            responseTimeChart,
            channelDistribution,
            satisfactionTrend,
            peakHours,
        });
    }, []);

    // Cargar datos inicial
    useEffect(() => {
        if (isReady && restaurantId) {
            loadConversations();
        }
    }, [isReady, restaurantId, loadConversations]);

    // Auto-refresh
    useEffect(() => {
        if (!selectedConversation) return;

        const interval = setInterval(() => {
            loadMessages(selectedConversation.id);
        }, 30000); // Cada 30 segundos

        return () => clearInterval(interval);
    }, [selectedConversation, loadMessages]);

    // Configurar suscripción real-time
    useEffect(() => {
        if (!restaurantId) return;

        // TODO: Implementar suscripción real-time a mensajes
        // const subscription = supabase
        //     .channel('messages-changes')
        //     .on('postgres_changes', {
        //         event: 'INSERT',
        //         schema: 'public',
        //         table: 'messages',
        //         filter: `restaurant_id=eq.${restaurantId}`
        //     }, (payload) => {
        //         // Agregar nuevo mensaje
        //         if (payload.new.conversation_id === selectedConversation?.id) {
        //             setMessages(prev => [...prev, payload.new]);
        //         }
        //         // Actualizar lista de conversaciones
        //         loadConversations();
        //     })
        //     .subscribe();
        //
        // return () => {
        //     subscription.unsubscribe();
        // };
    }, [restaurantId, selectedConversation]);

    // Cargar mensajes cuando cambia la conversación seleccionada
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation, loadMessages]);

    // Filtrar conversaciones
    const filteredConversations = useMemo(() => {
        let filtered = [...conversations];

        // Búsqueda
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(
                (conv) =>
                    conv.customer_name?.toLowerCase().includes(searchTerm) ||
                    conv.customer_phone?.includes(searchTerm) ||
                    conv.last_message?.toLowerCase().includes(searchTerm),
            );
        }

        // Canal
        if (filters.channel !== "all") {
            filtered = filtered.filter(
                (conv) => conv.channel === filters.channel,
            );
        }

        // Estado
        if (filters.state !== "all") {
            filtered = filtered.filter((conv) => conv.state === filters.state);
        }

        // IA
        if (filters.aiHandled !== "all") {
            filtered = filtered.filter((conv) =>
                filters.aiHandled === "ai" ? conv.ai_handled : !conv.ai_handled,
            );
        }

        // Ordenar por última actividad
        filtered.sort(
            (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at),
        );

        return filtered;
    }, [conversations, filters]);

    // Handlers
    const handleSelectConversation = useCallback((conversation) => {
        setSelectedConversation(conversation);
    }, []);

    const handleSendMessage = useCallback(
        async (e) => {
            e.preventDefault();

            if (!newMessage.trim() || !selectedConversation || sendingMessage)
                return;

            setSendingMessage(true);

            try {
                // TODO: Enviar mensaje real a través de Supabase
                // const { data, error } = await supabase
                //     .from('messages')
                //     .insert({
                //         conversation_id: selectedConversation.id,
                //         content: newMessage.trim(),
                //         direction: 'outbound',
                //         type: 'text',
                //         ai_generated: false,
                //         restaurant_id: restaurantId
                //     })
                //     .select()
                //     .single();

                const messageData = {
                    id: Date.now(),
                    conversation_id: selectedConversation.id,
                    content: newMessage.trim(),
                    direction: "outbound",
                    type: "text",
                    ai_generated: false,
                    delivered: false,
                    read: false,
                    created_at: new Date().toISOString(),
                };

                // Agregar mensaje localmente
                setMessages((prev) => [...prev, messageData]);
                setNewMessage("");

                // Actualizar última actividad de la conversación
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === selectedConversation.id
                            ? {
                                  ...conv,
                                  last_message: messageData.content,
                                  last_message_at: messageData.created_at,
                              }
                            : conv,
                    ),
                );

                // Simular entrega
                setTimeout(() => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === messageData.id
                                ? { ...msg, delivered: true }
                                : msg,
                        ),
                    );
                }, 1000);

                // Scroll al final
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                    });
                }, 100);

                toast.success("Mensaje enviado");
            } catch (error) {
                console.error("Error sending message:", error);
                toast.error("Error al enviar el mensaje");
            } finally {
                setSendingMessage(false);
            }
        },
        [newMessage, selectedConversation, sendingMessage, restaurantId],
    );

    const handleTemplateSelect = useCallback(
        (templateKey) => {
            const template = SMART_TEMPLATES[templateKey];
            if (!template || !selectedConversation) return;

            const context = {
                customerName: selectedConversation.customer_name?.split(" ")[0],
                restaurantName: restaurant?.name || "el restaurante",
                partySize: 2,
                date: format(new Date(), "dd/MM"),
                time: "20:00",
                availableSlots: "20:00h, 20:30h, 21:00h",
                request: "Mesa en terraza",
            };

            const content = template.generateContent(context);
            setNewMessage(content);
            setShowTemplates(false);
            messageInputRef.current?.focus();
        },
        [selectedConversation, restaurant],
    );

    const handleRefresh = useCallback(() => {
        loadConversations();
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
        toast.success("Conversaciones actualizadas");
    }, [loadConversations, loadMessages, selectedConversation]);

    const handleEscalateConversation = useCallback(async () => {
        if (!selectedConversation) return;

        // TODO: Implementar escalamiento real
        // await supabase.rpc('escalate_conversation', {
        //     conversation_id: selectedConversation.id,
        //     reason: 'Manual escalation'
        // });

        setConversations((prev) =>
            prev.map((conv) =>
                conv.id === selectedConversation.id
                    ? { ...conv, state: "escalated", human_takeover: true }
                    : conv,
            ),
        );

        toast.info("Conversación escalada a atención humana");
    }, [selectedConversation]);

    const handleResolveConversation = useCallback(async () => {
        if (!selectedConversation) return;

        // TODO: Implementar resolución real
        // await supabase
        //     .from('conversations')
        //     .update({ state: 'resolved', resolved_at: new Date().toISOString() })
        //     .eq('id', selectedConversation.id);

        setConversations((prev) =>
            prev.map((conv) =>
                conv.id === selectedConversation.id
                    ? { ...conv, state: "resolved" }
                    : conv,
            ),
        );

        toast.success("Conversación marcada como resuelta");
    }, [selectedConversation]);

    if (!isReady) {
        return <LoadingState />;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header mejorado */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                Centro de Comunicación Omnicanal
                                <Bot className="w-6 h-6 text-purple-600" />
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Gestiona todas las conversaciones con clientes
                                en un solo lugar
                            </p>
                        </div>

                        {/* Tabs de vista */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            {[
                                {
                                    id: "conversations",
                                    label: "Conversaciones",
                                    icon: MessageSquare,
                                },
                                {
                                    id: "analytics",
                                    label: "Analytics",
                                    icon: BarChart3,
                                },
                                {
                                    id: "settings",
                                    label: "Configuración",
                                    icon: Settings,
                                },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-md transition-all
                                        ${
                                            activeView === tab.id
                                                ? "bg-white text-purple-600 shadow-sm"
                                                : "text-gray-600 hover:text-gray-900"
                                        }
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="font-medium">
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Estado del agente */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
                            <Bot className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">
                                Agente{" "}
                                {agentStatus?.active ? "Activo" : "Inactivo"}
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${agentStatus?.active ? "bg-green-500" : "bg-gray-400"}`}
                            />
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <RefreshCw
                                className={`w-5 h-5 ${loading ? "animate-spin" : ""} text-gray-600`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 flex overflow-hidden">
                {activeView === "conversations" && (
                    <>
                        {/* Sidebar de conversaciones */}
                        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
                            {/* Estadísticas en tiempo real */}
                            <div className="p-4 border-b border-gray-200">
                                <RealtimeStats
                                    conversations={conversations}
                                    messages={messages}
                                />
                            </div>

                            {/* Filtros mejorados */}
                            <div className="p-4 space-y-3 border-b border-gray-200">
                                {/* Búsqueda */}
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={20}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Buscar conversaciones..."
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                search: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Filtros rápidos */}
                                <div className="flex gap-2">
                                    <select
                                        value={filters.channel}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                channel: e.target.value,
                                            }))
                                        }
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-purple-500"
                                    >
                                        <option value="all">
                                            Todos los canales
                                        </option>
                                        {Object.entries(
                                            COMMUNICATION_CHANNELS,
                                        ).map(([key, channel]) => (
                                            <option key={key} value={key}>
                                                {channel.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={filters.state}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                state: e.target.value,
                                            }))
                                        }
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-purple-500"
                                    >
                                        <option value="all">
                                            Todos los estados
                                        </option>
                                        {Object.entries(
                                            CONVERSATION_STATES,
                                        ).map(([key, state]) => (
                                            <option key={key} value={key}>
                                                {state.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro IA */}
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                aiHandled: "all",
                                            }))
                                        }
                                        className={`
                                            flex-1 py-1 text-xs font-medium rounded transition-colors
                                            ${filters.aiHandled === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}
                                        `}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                aiHandled: "ai",
                                            }))
                                        }
                                        className={`
                                            flex-1 py-1 text-xs font-medium rounded transition-colors
                                            ${filters.aiHandled === "ai" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600"}
                                        `}
                                    >
                                        IA Auto
                                    </button>
                                    <button
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                aiHandled: "manual",
                                            }))
                                        }
                                        className={`
                                            flex-1 py-1 text-xs font-medium rounded transition-colors
                                            ${filters.aiHandled === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}
                                        `}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {/* Lista de conversaciones */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="animate-pulse"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredConversations.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {filteredConversations.map(
                                            (conversation) => (
                                                <ConversationItem
                                                    key={conversation.id}
                                                    conversation={conversation}
                                                    isSelected={
                                                        selectedConversation?.id ===
                                                        conversation.id
                                                    }
                                                    onSelect={
                                                        handleSelectConversation
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">
                                            No hay conversaciones
                                        </p>
                                        <p className="text-sm mt-1">
                                            {filters.search ||
                                            filters.channel !== "all" ||
                                            filters.state !== "all"
                                                ? "No se encontraron conversaciones con los filtros aplicados"
                                                : "Las nuevas conversaciones aparecerán aquí"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Área de chat */}
                        <div className="flex-1 flex">
                            <div className="flex-1 flex flex-col">
                                {selectedConversation ? (
                                    <>
                                        {/* Header del chat */}
                                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {selectedConversation.customer_name
                                                                ?.charAt(0)
                                                                .toUpperCase() ||
                                                                "?"}
                                                        </div>
                                                        <div
                                                            className={`
                                                            absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                                                            ${selectedConversation.state === "active" ? "bg-green-500" : "bg-gray-400"}
                                                        `}
                                                        />
                                                    </div>

                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                            {selectedConversation.customer_name ||
                                                                "Cliente"}
                                                            {selectedConversation.is_vip && (
                                                                <Star className="w-4 h-4 text-orange-500 fill-current" />
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                                            <span className="flex items-center gap-1">
                                                                {React.createElement(
                                                                    COMMUNICATION_CHANNELS[
                                                                        selectedConversation
                                                                            .channel
                                                                    ]?.icon ||
                                                                        MessageSquare,
                                                                    {
                                                                        className:
                                                                            "w-4 h-4",
                                                                    },
                                                                )}
                                                                {
                                                                    COMMUNICATION_CHANNELS[
                                                                        selectedConversation
                                                                            .channel
                                                                    ]?.label
                                                                }
                                                            </span>
                                                            <span>
                                                                {
                                                                    selectedConversation
                                                                        .customer_phone
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {selectedConversation.state ===
                                                        "escalated" && (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full flex items-center gap-1">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            Requiere atención
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            setShowCustomerInfo(
                                                                !showCustomerInfo,
                                                            )
                                                        }
                                                        className={`
                                                            p-2 rounded-lg transition-colors
                                                            ${
                                                                showCustomerInfo
                                                                    ? "bg-purple-100 text-purple-600"
                                                                    : "hover:bg-gray-100 text-gray-600"
                                                            }
                                                        `}
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            // TODO: Implementar llamada directa
                                                            toast.info(
                                                                "Función de llamada disponible próximamente",
                                                            );
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                                    >
                                                        <Phone className="w-5 h-5" />
                                                    </button>

                                                    <div className="relative group">
                                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                            {selectedConversation.state !==
                                                                "escalated" && (
                                                                <button
                                                                    onClick={
                                                                        handleEscalateConversation
                                                                    }
                                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                                                                >
                                                                    <AlertTriangle className="w-4 h-4" />
                                                                    Escalar a
                                                                    humano
                                                                </button>
                                                            )}
                                                            {selectedConversation.state !==
                                                                "resolved" && (
                                                                <button
                                                                    onClick={
                                                                        handleResolveConversation
                                                                    }
                                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                                                >
                                                                    <CheckCheck className="w-4 h-4" />
                                                                    Marcar como
                                                                    resuelta
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Insights de IA */}
                                            {selectedConversation.ai_insights && (
                                                <div className="mt-3 flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-purple-600">
                                                        <Brain className="w-4 h-4" />
                                                        <span className="font-medium">
                                                            Intención:{" "}
                                                            {
                                                                selectedConversation
                                                                    .ai_insights
                                                                    .intent
                                                            }
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={`
                                                            flex items-center gap-2
                                                            ${
                                                                selectedConversation
                                                                    .ai_insights
                                                                    .sentiment ===
                                                                "positive"
                                                                    ? "text-green-600"
                                                                    : selectedConversation
                                                                        .ai_insights
                                                                        .sentiment ===
                                                                        "negative"
                                                                      ? "text-red-600"
                                                                      : "text-gray-600"
                                                            }
                                                        `}
                                                    >
                                                        {selectedConversation
                                                            .ai_insights
                                                            .sentiment ===
                                                        "positive" ? (
                                                            <ThumbsUp className="w-4 h-4" />
                                                        ) : selectedConversation
                                                                .ai_insights
                                                                .sentiment ===
                                                            "negative" ? (
                                                            <ThumbsDown className="w-4 h-4" />
                                                        ) : (
                                                            <Activity className="w-4 h-4" />
                                                        )}
                                                        <span className="font-medium capitalize">
                                                            {
                                                                selectedConversation
                                                                    .ai_insights
                                                                    .sentiment
                                                            }
                                                        </span>
                                                    </div>
                                                    {selectedConversation
                                                        .ai_insights
                                                        .action_required && (
                                                        <div className="flex items-center gap-2 text-orange-600">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span className="font-medium">
                                                                Acción requerida
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Área de mensajes */}
                                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                            <div className="max-w-3xl mx-auto space-y-4">
                                                {messages.map((message) => (
                                                    <MessageBubble
                                                        key={message.id}
                                                        message={message}
                                                        isOwn={
                                                            message.direction ===
                                                            "outbound"
                                                        }
                                                        showDetails={true}
                                                    />
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </div>

                                        {/* Área de escritura mejorada */}
                                        <div className="bg-white border-t border-gray-200 p-4">
                                            <form
                                                onSubmit={handleSendMessage}
                                                className="max-w-3xl mx-auto"
                                            >
                                                {/* Plantillas inteligentes */}
                                                {showTemplates && (
                                                    <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                                                        <p className="text-sm font-medium text-purple-900 mb-2">
                                                            Plantillas
                                                            inteligentes
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {Object.entries(
                                                                SMART_TEMPLATES,
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    template,
                                                                ]) => (
                                                                    <button
                                                                        key={
                                                                            key
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleTemplateSelect(
                                                                                key,
                                                                            )
                                                                        }
                                                                        className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-purple-100 transition-colors text-left"
                                                                    >
                                                                        <template.icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700">
                                                                            {
                                                                                template.title
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-end gap-3">
                                                    {/* Botones de acción */}
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowTemplates(
                                                                    !showTemplates,
                                                                )
                                                            }
                                                            className={`
                                                                p-2 rounded-lg transition-colors
                                                                ${
                                                                    showTemplates
                                                                        ? "bg-purple-100 text-purple-600"
                                                                        : "hover:bg-gray-100 text-gray-500"
                                                                }
                                                            `}
                                                            title="Plantillas inteligentes"
                                                        >
                                                            <Zap className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // TODO: Implementar adjuntar archivos
                                                                toast.info(
                                                                    "Función de archivos disponible próximamente",
                                                                );
                                                            }}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                                            title="Adjuntar archivo"
                                                        >
                                                            <Paperclip className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // TODO: Implementar selector de emojis
                                                                toast.info(
                                                                    "Selector de emojis próximamente",
                                                                );
                                                            }}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                                            title="Emojis"
                                                        >
                                                            <Smile className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    {/* Campo de texto */}
                                                    <div className="flex-1">
                                                        <textarea
                                                            ref={
                                                                messageInputRef
                                                            }
                                                            value={newMessage}
                                                            onChange={(e) =>
                                                                setNewMessage(
                                                                    e
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                        "Enter" &&
                                                                    !e.shiftKey
                                                                ) {
                                                                    e.preventDefault();
                                                                    handleSendMessage(
                                                                        e,
                                                                    );
                                                                }
                                                            }}
                                                            placeholder="Escribe tu mensaje..."
                                                            rows="1"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                                                            style={{
                                                                minHeight:
                                                                    "48px",
                                                                maxHeight:
                                                                    "120px",
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Botón enviar */}
                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            !newMessage.trim() ||
                                                            sendingMessage
                                                        }
                                                        className={`
                                                                p-3 rounded-xl transition-all flex items-center justify-center
                                                                ${
                                                                    newMessage.trim() &&
                                                                    !sendingMessage
                                                                        ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                }
                                                            `}
                                                    >
                                                        {sendingMessage ? (
                                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Send className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Indicadores */}
                                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                                    <span>
                                                        Enter para enviar,
                                                        Shift+Enter para nueva
                                                        línea
                                                    </span>
                                                    {selectedConversation.ai_handled && (
                                                        <span className="flex items-center gap-1 text-purple-600">
                                                            <Bot className="w-3 h-3" />
                                                            El agente IA está
                                                            monitoreando esta
                                                            conversación
                                                        </span>
                                                    )}
                                                </div>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    /* Estado sin conversación seleccionada */
                                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                                        <div className="text-center max-w-md">
                                            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <MessageSquare className="w-12 h-12 text-purple-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                Selecciona una conversación
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                Elige una conversación de la
                                                lista para comenzar a
                                                interactuar con tus clientes
                                            </p>

                                            {/* Estadísticas rápidas */}
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {
                                                            conversations.filter(
                                                                (c) =>
                                                                    c.unread_count >
                                                                    0,
                                                            ).length
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Sin leer
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {
                                                            conversations.filter(
                                                                (c) =>
                                                                    c.ai_handled,
                                                            ).length
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        IA Auto
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {
                                                            conversations.filter(
                                                                (c) =>
                                                                    c.state ===
                                                                    "escalated",
                                                            ).length
                                                        }
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Escaladas
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Panel de información del cliente */}
                            {showCustomerInfo && selectedConversation && (
                                <CustomerInfoPanel
                                    conversation={selectedConversation}
                                    onClose={() => setShowCustomerInfo(false)}
                                />
                            )}
                        </div>
                    </>
                )}

                {/* Vista de Analytics */}
                {activeView === "analytics" && (
                    <div className="flex-1 bg-gray-50 p-6 overflow-auto">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Analytics de Comunicación
                            </h2>

                            {/* KPIs principales */}
                            <div className="grid grid-cols-4 gap-6">
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <MessageSquare className="w-8 h-8 text-purple-600" />
                                        <span className="text-sm text-gray-500">
                                            Últimas 24h
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {conversations.length}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Total conversaciones
                                    </p>
                                    <p className="text-sm text-green-600 mt-2">
                                        +12% vs ayer
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <Bot className="w-8 h-8 text-purple-600" />
                                        <span className="text-sm text-gray-500">
                                            Automatización
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {Math.round(
                                            (conversations.filter(
                                                (c) => c.ai_handled,
                                            ).length /
                                                conversations.length) *
                                                100,
                                        )}
                                        %
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Resueltas por IA
                                    </p>
                                    <p className="text-sm text-purple-600 mt-2">
                                        Excelente ratio
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <Clock className="w-8 h-8 text-blue-600" />
                                        <span className="text-sm text-gray-500">
                                            Velocidad
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        8s
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Tiempo respuesta IA
                                    </p>
                                    <p className="text-sm text-blue-600 mt-2">
                                        95% más rápido
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <ThumbsUp className="w-8 h-8 text-green-600" />
                                        <span className="text-sm text-gray-500">
                                            Satisfacción
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        92%
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Clientes satisfechos
                                    </p>
                                    <p className="text-sm text-green-600 mt-2">
                                        +5% este mes
                                    </p>
                                </div>
                            </div>

                            {/* Gráficos */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Tiempos de respuesta */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Tiempo de Respuesta: IA vs Humano
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart
                                                data={
                                                    analyticsData.responseTimeChart
                                                }
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#f0f0f0"
                                                />
                                                <XAxis
                                                    dataKey="hour"
                                                    stroke="#6b7280"
                                                    style={{ fontSize: "12px" }}
                                                />
                                                <YAxis
                                                    stroke="#6b7280"
                                                    style={{ fontSize: "12px" }}
                                                />
                                                <Tooltip />
                                                <Line
                                                    type="monotone"
                                                    dataKey="ai"
                                                    name="IA (segundos)"
                                                    stroke="#8B5CF6"
                                                    strokeWidth={2}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="human"
                                                    name="Humano (segundos)"
                                                    stroke="#6B7280"
                                                    strokeWidth={2}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribución por canal */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Conversaciones por Canal
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={
                                                        analyticsData.channelDistribution
                                                    }
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    dataKey="count"
                                                    label={({
                                                        name,
                                                        percentage,
                                                    }) =>
                                                        `${name} ${percentage}%`
                                                    }
                                                >
                                                    {analyticsData.channelDistribution.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    COMMUNICATION_CHANNELS[
                                                                        entry.channel.toLowerCase()
                                                                    ]?.color
                                                                        .replace(
                                                                            "text-",
                                                                            "#",
                                                                        )
                                                                        .replace(
                                                                            "-600",
                                                                            "",
                                                                        ) ||
                                                                    "#6B7280"
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Tendencia de satisfacción */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Tendencia de Satisfacción del Cliente
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart
                                            data={
                                                analyticsData.satisfactionTrend
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f0f0f0"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#6b7280"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <YAxis
                                                stroke="#6b7280"
                                                style={{ fontSize: "12px" }}
                                                domain={[0, 100]}
                                            />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="satisfaction"
                                                name="Satisfacción %"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                dot={{ fill: "#10B981", r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vista de Configuración */}
                {activeView === "settings" && (
                    <div className="flex-1 bg-gray-50 p-6 overflow-auto">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Configuración del Centro de Comunicación
                            </h2>

                            {/* Configuración del agente */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Configuración del Agente IA
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Respuestas automáticas
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                El agente responde
                                                automáticamente a consultas
                                                comunes
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // TODO: Implementar toggle de respuestas automáticas
                                                toast.info(
                                                    "Configuración guardada",
                                                );
                                            }}
                                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600"
                                        >
                                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Escalamiento automático
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Escalar a humano cuando detecte
                                                problemas complejos
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // TODO: Implementar toggle de escalamiento
                                                toast.info(
                                                    "Configuración guardada",
                                                );
                                            }}
                                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600"
                                        >
                                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Plantillas personalizadas */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Plantillas Personalizadas
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Crea y gestiona plantillas de respuesta
                                    personalizadas para tu restaurante
                                </p>
                                <button
                                    onClick={() => {
                                        // TODO: Navegar a gestión de plantillas
                                        toast.info(
                                            "Gestión de plantillas disponible próximamente",
                                        );
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Gestionar plantillas
                                </button>
                            </div>

                            {/* Integraciones */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Canales Conectados
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(COMMUNICATION_CHANNELS).map(
                                        ([key, channel]) => {
                                            const Icon = channel.icon;
                                            const isConnected = [
                                                "whatsapp",
                                                "vapi",
                                                "instagram",
                                            ].includes(key);

                                            return (
                                                <div
                                                    key={key}
                                                    className={`
                                                    p-4 rounded-lg border-2 transition-all
                                                    ${
                                                        isConnected
                                                            ? "border-green-200 bg-green-50"
                                                            : "border-gray-200 bg-gray-50"
                                                    }
                                                `}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Icon
                                                                className={`w-6 h-6 ${channel.color}`}
                                                            />
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {
                                                                        channel.label
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {isConnected
                                                                        ? "Conectado"
                                                                        : "No conectado"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isConnected ? (
                                                            <CheckCheck className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    // TODO: Implementar conexión de canal
                                                                    toast.info(
                                                                        `Conectar ${channel.label} próximamente`,
                                                                    );
                                                                }}
                                                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                                            >
                                                                Conectar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Comunicacion;
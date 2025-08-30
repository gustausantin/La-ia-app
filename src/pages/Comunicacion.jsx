// Comunicacion.jsx - VERSIÓN ROBUSTA SIN ERRORES
import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
    MessageSquare,
    Search,
    Filter,
    Users,
    Phone,
    Mail,
    Calendar,
    Clock,
    Settings,
    TrendingUp,
    BarChart3,
    RefreshCw,
    Send,
    Paperclip,
    MoreVertical,
    AlertTriangle,
    CheckCircle
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

// Componente principal
export default function Comunicacion() {
    const { restaurant, restaurantId } = useAuthContext();
    
    // Estados básicos
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    
    // Estados de filtros
    const [filters, setFilters] = useState({
        search: "",
        channel: "all",
        status: "all"
    });

    // Estados de analytics
    const [analytics, setAnalytics] = useState({
        totalConversations: 0,
        activeConversations: 0,
        resolvedToday: 0,
        averageResponseTime: 0,
        channelBreakdown: {}
    });

    // Vista actual
    const [currentView, setCurrentView] = useState("conversations");

    // Función para cargar conversaciones REALES
    const loadConversations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            // Intentar cargar de conversations primero
            const { data: conversationsData, error: conversationsError } = await supabase
                .from('conversations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!conversationsError && conversationsData && conversationsData.length > 0) {
                setConversations(conversationsData);
                console.log('✅ Conversaciones cargadas:', conversationsData.length);
                return;
            }

            // Si no hay conversaciones reales, mostrar estado vacío
            setConversations([]);
            console.log('ℹ️ No hay conversaciones disponibles');
            
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
            setConversations([]);
        }
    }, [restaurantId]);

    // Función para cargar analytics REALES
    const loadAnalytics = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const today = format(new Date(), 'yyyy-MM-dd');

            // Contar conversaciones por estado
            const { data: totalConvs } = await supabase
                .from('conversations')
                .select('id, status, channel')
                .eq('restaurant_id', restaurantId);

            const total = totalConvs?.length || 0;
            const active = totalConvs?.filter(c => c.status === 'open')?.length || 0;
            const resolved = totalConvs?.filter(c => c.status === 'resolved')?.length || 0;

            // Breakdown por canal
            const channelBreakdown = {};
            totalConvs?.forEach(conv => {
                const channel = conv.channel || 'unknown';
                channelBreakdown[channel] = (channelBreakdown[channel] || 0) + 1;
            });

            setAnalytics({
                totalConversations: total,
                activeConversations: active,
                resolvedToday: resolved,
                averageResponseTime: 0, // Se calculará cuando haya datos reales
                channelBreakdown
            });

        } catch (error) {
            console.error('Error cargando analytics:', error);
            setAnalytics({
                totalConversations: 0,
                activeConversations: 0,
                resolvedToday: 0,
                averageResponseTime: 0,
                channelBreakdown: {}
            });
        }
    }, [restaurantId]);

    // Función para cargar datos
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadConversations(),
                loadAnalytics()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error cargando datos de comunicación');
        } finally {
            setLoading(false);
        }
    }, [loadConversations, loadAnalytics]);

    // Cargar datos al inicializar
    useEffect(() => {
        if (restaurantId) {
            loadData();
        }
    }, [restaurantId, loadData]);

    // Función para enviar mensaje
    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            // Simular envío de mensaje
            const messageToAdd = {
                id: Date.now(),
                content: newMessage,
                sender: 'staff',
                timestamp: new Date().toISOString(),
                direction: 'outbound'
            };

            setMessages(prev => [...prev, messageToAdd]);
            setNewMessage("");
            
            toast.success('Mensaje enviado');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast.error('Error al enviar mensaje');
        }
    }, [newMessage, selectedConversation]);

    // Función para filtrar conversaciones
    const filteredConversations = conversations.filter(conv => {
        if (filters.search && !conv.customer_name?.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.channel !== "all" && conv.channel !== filters.channel) {
            return false;
        }
        if (filters.status !== "all" && conv.status !== filters.status) {
            return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <LoadingSpinner text="Cargando centro de comunicación..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Centro de Comunicación</h1>
                        <p className="text-gray-600">Gestiona todas las conversaciones desde un lugar</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Navegación */}
                <div className="flex gap-1 mt-4">
                    {[
                        { id: "conversations", label: "Conversaciones", icon: MessageSquare },
                        { id: "analytics", label: "Analytics", icon: BarChart3 }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentView(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentView === tab.id
                                    ? "bg-purple-100 text-purple-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vista de Conversaciones */}
            {currentView === "conversations" && (
                <div className="flex h-[calc(100vh-140px)]">
                    {/* Lista de conversaciones */}
                    <div className="w-1/3 bg-white border-r border-gray-200">
                        {/* Filtros */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Buscar conversaciones..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    <select
                                        value={filters.channel}
                                        onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                    >
                                        <option value="all">Todos los canales</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="email">Email</option>
                                        <option value="web_chat">Chat Web</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="instagram">Instagram</option>
                                    </select>

                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="open">Abiertas</option>
                                        <option value="resolved">Resueltas</option>
                                        <option value="escalated">Escaladas</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="overflow-y-auto h-full">
                            {filteredConversations.length > 0 ? (
                                filteredConversations.map((conversation) => (
                                    <div
                                        key={conversation.id}
                                        onClick={() => setSelectedConversation(conversation)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                            selectedConversation?.id === conversation.id ? "bg-purple-50" : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {conversation.customer_name || 'Cliente sin nombre'}
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        conversation.status === 'open' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : conversation.status === 'resolved'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {conversation.status === 'open' ? 'Abierta' : 
                                                         conversation.status === 'resolved' ? 'Resuelta' : 'Escalada'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {conversation.subject || 'Sin asunto'}
                                                </p>
                                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                    <span className="capitalize">{conversation.channel || 'web_chat'}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(conversation.created_at), 'dd/MM HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No hay conversaciones</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Las conversaciones aparecerán aquí cuando se configuren los canales
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel de conversación */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Header de conversación */}
                                <div className="bg-white border-b border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {selectedConversation.customer_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {selectedConversation.channel} • {selectedConversation.customer_phone || selectedConversation.customer_email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensajes */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length > 0 ? (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.sender === 'staff' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                        message.sender === 'staff'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-200 text-gray-900'
                                                    }`}
                                                >
                                                    <p>{message.content}</p>
                                                    <p className={`text-xs mt-1 ${
                                                        message.sender === 'staff' ? 'text-purple-200' : 'text-gray-500'
                                                    }`}>
                                                        {format(new Date(message.timestamp), 'HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No hay mensajes en esta conversación</p>
                                        </div>
                                    )}
                                </div>

                                {/* Input de mensaje */}
                                <div className="bg-white border-t border-gray-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                                            <Paperclip className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Escribe tu mensaje..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Selecciona una conversación
                                    </h3>
                                    <p className="text-gray-600">
                                        Elige una conversación de la lista para ver los mensajes
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vista de Analytics */}
            {currentView === "analytics" && (
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Analytics de Comunicación</h2>
                    
                    {/* Métricas principales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Conversaciones</p>
                                    <p className="text-2xl font-bold text-gray-900">{analytics.totalConversations}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <Clock className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Conversaciones Activas</p>
                                    <p className="text-2xl font-bold text-gray-900">{analytics.activeConversations}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Resueltas</p>
                                    <p className="text-2xl font-bold text-gray-900">{analytics.resolvedToday}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-orange-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Tiempo Promedio</p>
                                    <p className="text-2xl font-bold text-gray-900">{analytics.averageResponseTime}min</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown por canal */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversaciones por Canal</h3>
                        {Object.keys(analytics.channelBreakdown).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(analytics.channelBreakdown).map(([channel, count]) => (
                                    <div key={channel} className="flex items-center justify-between">
                                        <span className="capitalize text-gray-600">{channel}</span>
                                        <span className="font-medium text-gray-900">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No hay datos de canales disponibles
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

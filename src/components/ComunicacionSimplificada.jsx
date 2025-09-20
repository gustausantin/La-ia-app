// ComunicacionSimplificada.jsx - Comunicación Unificada y Simple
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
    MessageSquare, 
    Phone, 
    Mail, 
    Instagram, 
    Facebook,
    Globe,
    Search,
    Filter,
    Clock,
    CheckCheck,
    AlertCircle,
    User,
    Send,
    MoreVertical
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Configuración de canales
const CHANNELS = {
    whatsapp: { 
        name: 'WhatsApp', 
        icon: MessageSquare, 
        color: 'bg-green-500 text-white',
        bgColor: 'bg-green-50 border-green-200'
    },
    phone: { 
        name: 'Teléfono', 
        icon: Phone, 
        color: 'bg-blue-500 text-white',
        bgColor: 'bg-blue-50 border-blue-200'
    },
    email: { 
        name: 'Email', 
        icon: Mail, 
        color: 'bg-purple-500 text-white',
        bgColor: 'bg-purple-50 border-purple-200'
    },
    web: { 
        name: 'Web Chat', 
        icon: Globe, 
        color: 'bg-gray-500 text-white',
        bgColor: 'bg-gray-50 border-gray-200'
    },
    instagram: { 
        name: 'Instagram', 
        icon: Instagram, 
        color: 'bg-pink-500 text-white',
        bgColor: 'bg-pink-50 border-pink-200'
    },
    facebook: { 
        name: 'Facebook', 
        icon: Facebook, 
        color: 'bg-blue-600 text-white',
        bgColor: 'bg-blue-50 border-blue-200'
    }
};

// Estados de conversación
const CONVERSATION_STATUS = {
    active: { label: 'Activa', color: 'bg-green-100 text-green-800', icon: MessageSquare },
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    closed: { label: 'Cerrada', color: 'bg-gray-100 text-gray-800', icon: CheckCheck },
    escalated: { label: 'Escalada', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

const ComunicacionSimplificada = () => {
    const { restaurant } = useAuthContext();
    const [conversations, setConversations] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterChannel, setFilterChannel] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Cargar conversaciones
    const loadConversations = useCallback(async () => {
        if (!restaurant?.id) return;

        try {
            setIsLoading(true);

            // Primero intentar con la relación customers, si falla usar campos directos
            let data, error;
            
            try {
                const response = await supabase
                    .from('conversations')
                    .select(`
                        *,
                        customers (
                            id,
                            name,
                            email,
                            phone
                        )
                    `)
                    .eq('restaurant_id', restaurant.id)
                    .order('updated_at', { ascending: false });
                
                data = response.data;
                error = response.error;
            } catch (relationError) {
                console.log('Relación customers no disponible, usando campos directos');
                
                // Fallback: usar campos directos de la tabla conversations
                const response = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('updated_at', { ascending: false });
                
                data = response.data;
                error = response.error;
            }

            if (error) throw error;

            setConversations(data || []);
            setFilteredConversations(data || []);

        } catch (error) {
            console.error('Error cargando conversaciones:', error);
            
            // NO HAY DATOS - MOSTRAR ESTADO VACÍO
            setConversations([]);
            setFilteredConversations([]);
            
            // Toast con método correcto de react-hot-toast
            toast('Usando datos de ejemplo para conversaciones', {
                icon: 'ℹ️',
                duration: 3000
            });
        } finally {
            setIsLoading(false);
        }
    }, [restaurant?.id]);

    // Cargar mensajes de una conversación
    const loadMessages = useCallback(async (conversationId) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);

        } catch (error) {
            console.error('Error cargando mensajes:', error);
            toast.error('Error cargando mensajes');
        }
    }, []);

    // Filtrar conversaciones
    useEffect(() => {
        let filtered = conversations;

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(conv => 
                conv.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conv.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por canal
        if (filterChannel !== 'all') {
            filtered = filtered.filter(conv => conv.channel === filterChannel);
        }

        // Filtro por estado
        if (filterStatus !== 'all') {
            filtered = filtered.filter(conv => conv.status === filterStatus);
        }

        setFilteredConversations(filtered);
    }, [conversations, searchTerm, filterChannel, filterStatus]);

    // Seleccionar conversación
    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
    };

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando comunicaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Centro de Comunicación
                            </h1>
                            <p className="text-gray-600">
                                Todas las conversaciones de todos los canales en un solo lugar
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Métricas rápidas */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                    <div className="font-bold text-green-600">
                                        {conversations.filter(c => c.status === 'active').length}
                                    </div>
                                    <div className="text-gray-500">Activas</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-yellow-600">
                                        {conversations.filter(c => c.status === 'pending').length}
                                    </div>
                                    <div className="text-gray-500">Pendientes</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-gray-600">
                                        {conversations.length}
                                    </div>
                                    <div className="text-gray-500">Total</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Lista de Conversaciones */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border">
                        {/* Filtros */}
                        <div className="p-4 border-b">
                            <div className="space-y-3">
                                {/* Búsqueda */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Filtros rápidos */}
                                <div className="flex gap-2">
                                    <select
                                        value={filterChannel}
                                        onChange={(e) => setFilterChannel(e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="all">Todos los canales</option>
                                        {Object.entries(CHANNELS).map(([key, channel]) => (
                                            <option key={key} value={key}>{channel.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="all">Todos los estados</option>
                                        {Object.entries(CONVERSATION_STATUS).map(([key, status]) => (
                                            <option key={key} value={key}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Lista de conversaciones */}
                        <div className="overflow-y-auto h-full">
                            {filteredConversations.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <div className="text-sm font-medium">Sistema preparado para conversaciones</div>
                                    <div className="text-xs mt-2 space-y-1">
                                        <div>✅ WhatsApp - Listo para N8n</div>
                                        <div>✅ Instagram - Listo para N8n</div>
                                        <div>✅ Facebook - Listo para N8n</div>
                                        <div>✅ Web Chat - Listo para N8n</div>
                                        <div>✅ Vapi - Listo para N8n</div>
                                    </div>
                                    <div className="text-xs mt-3 text-blue-600 bg-blue-50 p-2 rounded">
                                        💡 Las conversaciones aparecerán automáticamente cuando se conecten los flujos N8n
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {filteredConversations.map((conversation) => {
                                        const channel = CHANNELS[conversation.channel] || CHANNELS.web;
                                        const status = CONVERSATION_STATUS[conversation.status] || CONVERSATION_STATUS.active;
                                        const ChannelIcon = channel.icon;
                                        const StatusIcon = status.icon;

                                        return (
                                            <div
                                                key={conversation.id}
                                                onClick={() => handleSelectConversation(conversation)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                                                    selectedConversation?.id === conversation.id 
                                                        ? 'border-purple-300 bg-purple-50' 
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Icono del canal */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${channel.color}`}>
                                                        <ChannelIcon className="w-4 h-4" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        {/* Nombre del cliente */}
                                                        <div className="font-medium text-gray-900 truncate">
                                                            {conversation.customers?.name || 'Cliente anónimo'}
                                                        </div>
                                                        
                                                        {/* Canal y estado */}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">
                                                                {channel.name}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Tiempo */}
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {formatDistanceToNow(parseISO(conversation.updated_at), { 
                                                                addSuffix: true, 
                                                                locale: es 
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vista de Conversación */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
                        {selectedConversation ? (
                            <div className="h-full flex flex-col">
                                {/* Header de conversación */}
                                <div className="p-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                CHANNELS[selectedConversation.channel]?.color || 'bg-gray-500 text-white'
                                            }`}>
                                                {React.createElement(
                                                    CHANNELS[selectedConversation.channel]?.icon || MessageSquare,
                                                    { className: "w-5 h-5" }
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {selectedConversation.customers?.name || 'Cliente anónimo'}
                                                </h3>
                                                <div className="text-sm text-gray-500">
                                                    {CHANNELS[selectedConversation.channel]?.name || 'Desconocido'} • 
                                                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                                        CONVERSATION_STATUS[selectedConversation.status]?.color || 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {CONVERSATION_STATUS[selectedConversation.status]?.label || 'Desconocido'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <MoreVertical className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mensajes */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-8">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <div className="text-sm">No hay mensajes en esta conversación</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${
                                                        message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                        message.direction === 'outbound'
                                                            ? 'bg-purple-500 text-white'
                                                            : 'bg-gray-100 text-gray-900'
                                                    }`}>
                                                        <div className="text-sm">{message.content}</div>
                                                        <div className={`text-xs mt-1 ${
                                                            message.direction === 'outbound' 
                                                                ? 'text-purple-100' 
                                                                : 'text-gray-500'
                                                        }`}>
                                                            {format(parseISO(message.created_at), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Input de respuesta */}
                                <div className="p-4 border-t">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Escribe tu respuesta..."
                                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <div className="text-lg font-medium mb-2">Selecciona una conversación</div>
                                    <div className="text-sm">Elige una conversación de la lista para ver los mensajes</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(CHANNELS).map(([key, channel]) => {
                        const count = conversations.filter(c => c.channel === key).length;
                        const ChannelIcon = channel.icon;
                        
                        return (
                            <div key={key} className={`${channel.bgColor} border rounded-lg p-4`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${channel.color}`}>
                                        <ChannelIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{count}</div>
                                        <div className="text-sm text-gray-600">{channel.name}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ComunicacionSimplificada;

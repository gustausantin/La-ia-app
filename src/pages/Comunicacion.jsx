// CENTRO DE COMUNICACIÓN - DISEÑO MODERNO Y COMPACTO V3
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    MessageSquare, Phone, Search, User, AlertCircle, 
    RefreshCw, Instagram, Facebook, Globe, Bot, X, Send, Clock, 
    ExternalLink, MessageCircle, Users, CheckCheck,
    AlertTriangle, Shield, Check, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CHANNELS = {
    whatsapp: { name: 'WhatsApp', icon: MessageSquare, bgClass: 'bg-green-50', iconClass: 'text-green-600', borderClass: 'border-green-200' },
    phone: { name: 'Teléfono', icon: Phone, bgClass: 'bg-purple-50', iconClass: 'text-purple-600', borderClass: 'border-purple-200' },
    instagram: { name: 'Instagram', icon: Instagram, bgClass: 'bg-pink-50', iconClass: 'text-pink-600', borderClass: 'border-pink-200' },
    facebook: { name: 'Facebook', icon: Facebook, bgClass: 'bg-blue-50', iconClass: 'text-blue-600', borderClass: 'border-blue-200' },
    webchat: { name: 'Web Chat', icon: Globe, bgClass: 'bg-gray-50', iconClass: 'text-gray-600', borderClass: 'border-gray-200' }
};

const STATUS_CONFIG = {
    active: { label: 'Activa', icon: MessageCircle, bgClass: 'bg-green-100', textClass: 'text-green-700', borderClass: 'border-green-300' },
    resolved: { label: 'Resuelta', icon: CheckCheck, bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderClass: 'border-blue-300' },
    abandoned: { label: 'Abandonada', icon: AlertTriangle, bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300' }
};

// Helper para determinar el tipo basado en outcome
const getConversationType = (conv) => {
    if (conv.outcome === 'reservation_created') {
        return { label: 'Reserva', bgClass: 'bg-green-100', textClass: 'text-green-700', borderClass: 'border-green-300' };
    }
    if (conv.outcome === 'reservation_modified') {
        return { label: 'Modificación', bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderClass: 'border-blue-300' };
    }
    if (conv.outcome === 'reservation_cancelled') {
        return { label: 'Cancelación', bgClass: 'bg-red-100', textClass: 'text-red-700', borderClass: 'border-red-300' };
    }
    // Si no hay outcome o es inquiry
    return { label: 'Consulta', bgClass: 'bg-purple-100', textClass: 'text-purple-700', borderClass: 'border-purple-300' };
};

// Helper para determinar completitud
const getCompletionStatus = (conv) => {
    if (conv.outcome && ['reservation_created', 'reservation_modified', 'inquiry_answered'].includes(conv.outcome)) {
        return { label: 'Completada', icon: Check, bgClass: 'bg-green-50', textClass: 'text-green-600', borderClass: 'border-green-200' };
    }
    return { label: 'Pendiente', icon: HelpCircle, bgClass: 'bg-orange-50', textClass: 'text-orange-600', borderClass: 'border-orange-200' };
};

export default function Comunicacion() {
    const { restaurant } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterChannel, setFilterChannel] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [newMessage, setNewMessage] = useState('');
    const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, abandoned: 0 });

    const loadConversations = useCallback(async () => {
        if (!restaurant?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('agent_conversations')
                .select(`*, customers(id, name, email, phone), reservations(id, reservation_date, reservation_time, party_size)`)
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });
            if (error) throw error;
            setConversations(data || []);
            setStats({
                total: (data || []).length,
                active: (data || []).filter(c => c.status === 'active').length,
                resolved: (data || []).filter(c => c.status === 'resolved').length,
                abandoned: (data || []).filter(c => c.status === 'abandoned').length
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar conversaciones');
        } finally {
            setLoading(false);
        }
    }, [restaurant?.id]);

    const loadMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        try {
            const { data, error } = await supabase
                .from('agent_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('timestamp', { ascending: true });
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar mensajes');
        }
    }, []);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;
        try {
            const { data, error } = await supabase.from('agent_messages').insert({
                conversation_id: selectedConversation.id,
                restaurant_id: restaurant.id,
                direction: 'outbound',
                sender: 'agent',
                message_text: newMessage.trim(),
                timestamp: new Date().toISOString()
            }).select().single();
            if (error) throw error;
            setMessages([...messages, data]);
            setNewMessage('');
            toast.success('Mensaje enviado');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al enviar mensaje');
        }
    };

    const getFilteredConversations = useCallback(() => {
        let filtered = conversations;
        if (searchTerm) {
            filtered = filtered.filter(c => 
                c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.customer_phone?.includes(searchTerm) || 
                c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterChannel !== 'all') filtered = filtered.filter(c => c.source_channel === filterChannel);
        if (filterStatus !== 'all') filtered = filtered.filter(c => c.status === filterStatus);
        return filtered;
    }, [conversations, searchTerm, filterChannel, filterStatus]);

    useEffect(() => { loadConversations(); }, [loadConversations]);
    useEffect(() => { if (selectedConversation) loadMessages(selectedConversation.id); }, [selectedConversation, loadMessages]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <div className="text-center">
                    <RefreshCw className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-gray-700">Cargando conversaciones...</p>
                    <p className="text-sm text-gray-500 mt-2">Conectando con el sistema IA</p>
                </div>
            </div>
        );
    }

    const filteredConversations = getFilteredConversations();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            {/* HEADER SIN SOMBRA */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    {/* Título + Badge */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                Centro de Comunicación
                                <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                    IA Activa
                                </span>
                            </h1>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Todas las conversaciones gestionadas por tu asistente inteligente
                            </p>
                        </div>
                    </div>

                    {/* Panel Informativo COMPACTO */}
                    <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-xs text-gray-900 mb-1">
                                    ¿Qué es el Centro de Comunicación?
                                </h3>
                                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                                    Aquí ves <strong>todas las conversaciones</strong> que tu asistente IA mantiene con clientes. 
                                    Se agrupan en ventanas de <strong>10 minutos</strong>. Color <strong className="text-purple-600">lila</strong> = agente, <strong>blanco</strong> = cliente.
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-white p-1.5 rounded border border-green-200">
                                        <span className="font-semibold text-green-900">🟢 Activa:</span> En curso
                                    </div>
                                    <div className="bg-white p-1.5 rounded border border-blue-200">
                                        <span className="font-semibold text-blue-900">🔵 Resuelta:</span> Cerrada (auto 10min)
                                    </div>
                                    <div className="bg-white p-1.5 rounded border border-gray-200">
                                        <span className="font-semibold text-gray-900">⚪ Abandonada:</span> Sin respuesta
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas MÁS COMPACTAS (mitad de ancho) */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded-lg border border-gray-200 hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600 uppercase">Total</p>
                                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <Users className="w-6 h-6 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg border border-green-200 hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-green-700 uppercase">Activas</p>
                                    <p className="text-xl font-bold text-green-900">{stats.active}</p>
                                </div>
                                <MessageCircle className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200 hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-blue-700 uppercase">Resueltas</p>
                                    <p className="text-xl font-bold text-blue-900">{stats.resolved}</p>
                                </div>
                                <CheckCheck className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded-lg border border-gray-200 hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600 uppercase">Abandonadas</p>
                                    <p className="text-xl font-bold text-gray-900">{stats.abandoned}</p>
                                </div>
                                <AlertTriangle className="w-6 h-6 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL - SIN LÍNEA DIVISORIA */}
            <div className="max-w-7xl mx-auto p-6 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-380px)]">
                    {/* LISTA DE CONVERSACIONES - MODERNIZADA */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                        {/* Filtros Modernos */}
                        <div className="p-3 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente, teléfono..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                                    />
                                </div>
                                <select
                                    value={filterChannel}
                                    onChange={(e) => setFilterChannel(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white font-medium cursor-pointer hover:border-purple-400 transition-colors"
                                >
                                    <option value="all">📱 Todos los canales</option>
                                    {Object.entries(CHANNELS).map(([key, ch]) => (
                                        <option key={key} value={key}>{ch.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white font-medium cursor-pointer hover:border-purple-400 transition-colors"
                                >
                                    <option value="all">🔍 Todos los estados</option>
                                    <option value="active">✅ Activas</option>
                                    <option value="resolved">✔️ Resueltas</option>
                                    <option value="abandoned">❌ Abandonadas</option>
                                </select>
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                    <p className="font-semibold">No hay conversaciones</p>
                                    <p className="text-sm mt-1">Las conversaciones aparecerán aquí</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const channel = CHANNELS[conv.source_channel] || CHANNELS.webchat;
                                    const status = STATUS_CONFIG[conv.status] || STATUS_CONFIG.abandoned;
                                    const Icon = channel.icon;
                                    const StatusIcon = status.icon;
                                    const isSelected = selectedConversation?.id === conv.id;
                                    
                                    // Determinar tipo y completitud dinámicamente
                                    const conversationType = getConversationType(conv);
                                    const completionStatus = getCompletionStatus(conv);
                                    const CompletionIcon = completionStatus.icon;

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                                                isSelected
                                                    ? 'bg-purple-50 border-purple-500 shadow-md'
                                                    : 'bg-white border-gray-300 hover:border-purple-400'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icono de canal */}
                                                <div className={`p-2 rounded-lg ${channel.bgClass} border ${channel.borderClass}`}>
                                                    <Icon className={`w-4 h-4 ${channel.iconClass}`} />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Nombre + Tiempo */}
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-bold text-sm text-gray-900 truncate">
                                                            {conv.customer_name || 'Sin nombre'}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                            {formatDistanceToNow(parseISO(conv.created_at), { addSuffix: true, locale: es })}
                                                        </span>
                                                    </div>

                                                    {/* Teléfono */}
                                                    <p className="text-xs text-gray-600 mb-2">{conv.customer_phone}</p>

                                                    {/* Badges */}
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {/* Estado (Activa/Resuelta) */}
                                                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${status.bgClass} ${status.textClass} border ${status.borderClass}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {status.label}
                                                        </span>

                                                        {/* Tipo (Reserva/Consulta/etc) */}
                                                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${conversationType.bgClass} ${conversationType.textClass} border ${conversationType.borderClass}`}>
                                                            {conversationType.label}
                                                        </span>

                                                        {/* Completitud (Completada/Pendiente) */}
                                                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${completionStatus.bgClass} ${completionStatus.textClass} border ${completionStatus.borderClass}`}>
                                                            <CompletionIcon className="w-3 h-3" />
                                                            {completionStatus.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* PANEL DE MENSAJES */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                        {selectedConversation ? (
                            <>
                                {/* Header del chat */}
                                <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-sm text-gray-900 truncate">
                                                    {selectedConversation.customer_name || 'Sin nombre'}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate">{selectedConversation.customer_phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedConversation.reservation_id && (
                                                <button
                                                    onClick={() => window.open(`/reservas?id=${selectedConversation.reservation_id}`, '_blank')}
                                                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow hover:shadow-md transition-all"
                                                >
                                                    <ExternalLink className="w-3 h-3 inline mr-1" />
                                                    Ver reserva
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedConversation(null)}
                                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta información */}
                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                                Iniciada {format(parseISO(selectedConversation.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        {selectedConversation.resolved_at && (
                                            <div className="flex items-center gap-1">
                                                <CheckCheck className="w-3 h-3 text-green-600" />
                                                <span>Resuelta en {Math.round(selectedConversation.resolution_time_seconds / 60)} min</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mensajes */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-gray-50 to-white">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 py-12">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="font-semibold">No hay mensajes</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] rounded-xl px-4 py-2 shadow ${
                                                        msg.direction === 'outbound'
                                                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                                                            : 'bg-white border border-gray-200 text-gray-900'
                                                    }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                        {msg.message_text}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1 gap-2">
                                                        <p
                                                            className={`text-xs font-medium ${
                                                                msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-500'
                                                            }`}
                                                        >
                                                            {format(parseISO(msg.timestamp), 'HH:mm')}
                                                        </p>
                                                        {msg.sender === 'agent' && (
                                                            <Bot className={`w-3 h-3 ${msg.direction === 'outbound' ? 'text-white opacity-60' : 'text-purple-600'}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input de mensaje */}
                                <div className="p-3 border-t bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder="Escribe un mensaje..."
                                            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-semibold shadow hover:shadow-md transition-all disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Presiona Enter para enviar</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                                <div className="text-center">
                                    <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-10" />
                                    <p className="font-bold text-xl text-gray-900">Selecciona una conversación</p>
                                    <p className="text-gray-500 mt-2">Elige una conversación de la lista para ver los mensajes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

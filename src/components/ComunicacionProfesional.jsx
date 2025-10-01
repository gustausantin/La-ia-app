// CENTRO DE COMUNICACIÓN - 100% DATOS REALES
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Phone, Search, User, CheckCircle2, AlertCircle, RefreshCw, Instagram, Facebook, Globe, Bot, X, Send, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const CHANNELS = {
    whatsapp: { name: 'WhatsApp', icon: MessageSquare, bgClass: 'bg-green-100', iconClass: 'text-green-600' },
    phone: { name: 'Teléfono', icon: Phone, bgClass: 'bg-purple-100', iconClass: 'text-purple-600' },
    instagram: { name: 'Instagram', icon: Instagram, bgClass: 'bg-pink-100', iconClass: 'text-pink-600' },
    facebook: { name: 'Facebook', icon: Facebook, bgClass: 'bg-blue-100', iconClass: 'text-blue-600' },
    webchat: { name: 'Web Chat', icon: Globe, bgClass: 'bg-gray-100', iconClass: 'text-gray-600' }
};

const INTERACTION_TYPES = {
    reservation: 'Reserva', modification: 'Modificación', cancellation: 'Cancelación',
    inquiry: 'Consulta', complaint: 'Queja', other: 'Otro'
};

const OUTCOMES = {
    reservation_created: { label: 'Reserva creada', icon: CheckCircle2 },
    reservation_modified: { label: 'Reserva modificada', icon: CheckCircle2 },
    reservation_cancelled: { label: 'Reserva cancelada', icon: AlertCircle },
    inquiry_answered: { label: 'Consulta respondida', icon: CheckCircle2 },
    no_action: { label: 'Sin acción', icon: AlertCircle },
    escalated: { label: 'Escalado', icon: TrendingUp }
};

export default function ComunicacionProfesional() {
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
            const { data, error } = await supabase.from('agent_messages').select('*').eq('conversation_id', conversationId).order('timestamp', { ascending: true });
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
        if (searchTerm) filtered = filtered.filter(c => c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.customer_phone?.includes(searchTerm) || c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filterChannel !== 'all') filtered = filtered.filter(c => c.source_channel === filterChannel);
        if (filterStatus !== 'all') filtered = filtered.filter(c => c.status === filterStatus);
        return filtered;
    }, [conversations, searchTerm, filterChannel, filterStatus]);

    const markAsResolved = async (conversationId) => {
        try {
            const { error } = await supabase.from('agent_conversations').update({ status: 'resolved' }).eq('id', conversationId);
            if (error) throw error;
            toast.success('Conversación marcada como resuelta');
            loadConversations();
            if (selectedConversation?.id === conversationId) setSelectedConversation({ ...selectedConversation, status: 'resolved' });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar estado');
        }
    };

    useEffect(() => { loadConversations(); }, [loadConversations]);
    useEffect(() => { if (selectedConversation) loadMessages(selectedConversation.id); }, [selectedConversation, loadMessages]);

    if (loading) return (<div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="text-center"><RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" /><p className="text-gray-600">Cargando conversaciones...</p></div></div>);

    const filteredConversations = getFilteredConversations();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-600" />Centro de Comunicación</h1>
                            <p className="text-sm text-gray-600 mt-1">Conversaciones del agente IA (últimos 30 días)</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="text-center"><div className="text-2xl font-bold text-gray-900">{stats.total}</div><div className="text-xs text-gray-500">Total</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-green-600">{stats.active}</div><div className="text-xs text-gray-500">Activas</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-blue-600">{stats.resolved}</div><div className="text-xs text-gray-500">Resueltas</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-gray-600">{stats.abandoned}</div><div className="text-xs text-gray-500">Abandonadas</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
                        <div className="p-3 border-b bg-gray-50">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500" />
                                </div>
                                <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg">
                                    <option value="all">📱 Todos los canales</option>
                                    {Object.entries(CHANNELS).map(([key, ch]) => <option key={key} value={key}>{ch.name}</option>)}
                                </select>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg">
                                    <option value="all">🔍 Todos</option>
                                    <option value="active">✅ Activas</option>
                                    <option value="resolved">✔️ Resueltas</option>
                                    <option value="abandoned">❌ Abandonadas</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-gray-500"><MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" /><p className="font-medium">No hay conversaciones</p></div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const channel = CHANNELS[conv.source_channel] || CHANNELS.webchat;
                                    const Icon = channel.icon;
                                    const sel = selectedConversation?.id === conv.id;
                                    return (
                                        <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`p-3 border-b cursor-pointer ${sel ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${channel.bgClass}`}><Icon className={`w-4 h-4 ${channel.iconClass}`} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-semibold text-sm text-gray-900 truncate">{conv.customer_name || 'Sin nombre'}</h3>
                                                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDistanceToNow(parseISO(conv.created_at), { addSuffix: true, locale: es })}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-2">{conv.customer_phone}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conv.status === 'active' ? 'bg-green-100 text-green-700' : conv.status === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {conv.status === 'active' ? 'Activa' : conv.status === 'resolved' ? 'Resuelta' : 'Abandonada'}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{INTERACTION_TYPES[conv.interaction_type]}</span>
                                                        {conv.outcome === 'reservation_created' && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">✓ Reserva</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border flex flex-col">
                        {selectedConversation ? (
                            <>
                                <div className="p-3 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-purple-100 rounded-full"><User className="w-5 h-5 text-purple-600" /></div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{selectedConversation.customer_name || 'Sin nombre'}</h3>
                                                <p className="text-sm text-gray-600 truncate">{selectedConversation.customer_phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedConversation.status === 'active' && (
                                                <button onClick={() => markAsResolved(selectedConversation.id)} className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"><CheckCircle2 className="w-4 h-4 inline mr-1" />Marcar resuelta</button>
                                            )}
                                            {selectedConversation.reservation_id && (
                                                <button onClick={() => window.open(`/reservas?id=${selectedConversation.reservation_id}`, '_blank')} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"><ExternalLink className="w-4 h-4 inline mr-1" />Ver reserva</button>
                                            )}
                                            <button onClick={() => setSelectedConversation(null)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5 text-gray-600" /></button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" />Iniciada {format(parseISO(selectedConversation.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}</div>
                                        {selectedConversation.resolved_at && <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Resuelta en {Math.round(selectedConversation.resolution_time_seconds / 60)} min</div>}
                                        {selectedConversation.outcome && <div className="flex items-center gap-1">{React.createElement(OUTCOMES[selectedConversation.outcome]?.icon || AlertCircle, { className: 'w-3 h-3' })}{OUTCOMES[selectedConversation.outcome]?.label}</div>}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No hay mensajes</p></div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${msg.direction === 'outbound' ? 'bg-purple-600 text-white' : 'bg-white border text-gray-900'}`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                                                    <div className="flex items-center justify-between mt-2 gap-2">
                                                        <p className={`text-xs ${msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-500'}`}>{format(parseISO(msg.timestamp), 'HH:mm')}</p>
                                                        {msg.sender === 'agent' && <Bot className="w-3 h-3 opacity-60" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-3 border-t bg-white">
                                    <div className="flex gap-2">
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Escribe un mensaje..." className="flex-1 px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500" />
                                        <button onClick={sendMessage} disabled={!newMessage.trim()} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg"><Send className="w-5 h-5" /></button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">💡 Presiona Enter para enviar</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                                <div className="text-center"><MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" /><p className="font-medium text-lg">Selecciona una conversación</p></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


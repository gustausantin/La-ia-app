// CRM SIMPLE - Una sola página con todo claro
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    Bell, 
    Send, 
    X, 
    AlertTriangle, 
    TrendingUp,
    Users,
    MessageSquare,
    DollarSign,
    Info,
    CheckCircle,
    Mail,
    LayoutDashboard,
    Brain, // 🆕 Para sección Agente IA
    Star, 
    Smile, 
    Frown, 
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';
import PlantillasCRM from './PlantillasCRM'; // Importar componente de Plantillas
// 🆕 Imports para gráficos
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CRMSimple = () => {
    const { restaurant } = useAuthContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [alertas, setAlertas] = useState([]);
    const [stats, setStats] = useState({
        mensajesEnviados: 0,
        clientesRecuperados: 0,
        valorGenerado: 0
    });
    const [mostrarInfo, setMostrarInfo] = useState(false);
    
    // Estado para tabs
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // 🆕 Estado para performance del agente IA
    const [agentPerformance, setAgentPerformance] = useState({
        satisfaction: 0,
        positivePercent: 0,
        escalations: 0,
        quality: 0,
        totalConversations: 0,
        sentimentTrend: [],
        problematicConversations: []
    });

    // Detectar si viene de /plantillas para abrir el tab correcto
    useEffect(() => {
        if (location.state?.autoOpenPlantillas) {
            setActiveTab('plantillas');
        }
    }, [location.state]);

    useEffect(() => {
        if (restaurant?.id) {
            cargarDatos();
            loadAgentPerformance(); // 🆕 Cargar performance del agente IA
        }
    }, [restaurant]);
    
    // Definir tabs
    const tabs = [
        { id: 'dashboard', label: 'Dashboard CRM', icon: LayoutDashboard },
        { id: 'plantillas', label: 'Plantillas', icon: Mail }
    ];

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar alertas pendientes
            const { data: sugerencias } = await supabase
                .from('crm_suggestions')
                .select(`
                    *,
                    customers (
                        name,
                        phone,
                        email,
                        visits_count,
                        total_spent
                    )
                `)
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(10);

            // Formatear alertas con mensajes automáticos
            const alertasFormateadas = (sugerencias || []).map(s => ({
                id: s.id,
                tipo: s.type,
                cliente: s.customers?.name || 'Cliente',
                telefono: s.customers?.phone,
                email: s.customers?.email,
                titulo: getTituloAlerta(s.type, s.customers?.name),
                descripcion: getDescripcionAlerta(s.type, s.customers),
                mensaje: getMensajeAutomatico(s.type, s.customers?.name),
                valor: s.customers?.total_spent || 0,
                prioridad: s.priority || 'normal',
                metadata: s.metadata || {}
            }));

            setAlertas(alertasFormateadas);

            // Cargar estadísticas de la semana
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: interacciones } = await supabase
                .from('customer_interactions')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', weekAgo.toISOString());

            const mensajesEnviados = interacciones?.length || 0;
            const clientesRecuperados = interacciones?.filter(i => i.status === 'replied').length || 0;
            const valorGenerado = clientesRecuperados * 45; // Ticket medio estimado

            setStats({
                mensajesEnviados,
                clientesRecuperados,
                valorGenerado
            });

        } catch (error) {
            console.error('Error cargando CRM:', error);
            toast.error('Error al cargar datos del CRM');
        } finally {
            setLoading(false);
        }
    };

    // 🆕 CARGAR PERFORMANCE DEL AGENTE IA
    const loadAgentPerformance = async () => {
        if (!restaurant?.id) return;
        
        try {
            console.log('📊 Cargando performance del agente IA...');
            
            const thirtyDaysAgo = subDays(new Date(), 30);
            const sevenDaysAgo = subDays(new Date(), 7);
            
            // 1. MÉTRICAS AGREGADAS (últimos 30 días)
            const { data: conversations, error: convError } = await supabase
                .from('agent_conversations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'resolved')
                .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'))
                .order('created_at', { ascending: true });
            
            if (convError) {
                console.error('Error cargando conversaciones:', convError);
                return;
            }
            
            const totalConversations = conversations?.length || 0;
            
            // Calcular satisfacción promedio (satisfaction_level)
            const satisfactionMap = {
                'very_satisfied': 5,
                'satisfied': 4,
                'neutral': 3,
                'unsatisfied': 2,
                'very_unsatisfied': 1
            };
            
            const satisfactionScores = conversations
                ?.filter(c => c.metadata?.satisfaction_level)
                .map(c => satisfactionMap[c.metadata.satisfaction_level] || 0) || [];
            
            const avgSatisfaction = satisfactionScores.length > 0
                ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
                : 0;
            
            // % Sentiment positivo
            const positiveCount = conversations?.filter(c => c.sentiment === 'positive').length || 0;
            const positivePercent = totalConversations > 0 ? (positiveCount / totalConversations) * 100 : 0;
            
            // Escalaciones
            const escalations = conversations?.filter(c => 
                c.metadata?.escalation_needed === true
            ).length || 0;
            
            // Calidad de resolución promedio
            const qualityScores = conversations
                ?.filter(c => c.metadata?.resolution_quality)
                .map(c => c.metadata.resolution_quality) || [];
            
            const avgQuality = qualityScores.length > 0
                ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
                : 0;
            
            // 2. EVOLUCIÓN DE SENTIMENT (últimos 30 días, agrupado por día)
            const sentimentByDate = {};
            conversations?.forEach(conv => {
                const date = format(parseISO(conv.created_at), 'yyyy-MM-dd');
                if (!sentimentByDate[date]) {
                    sentimentByDate[date] = { date, positive: 0, neutral: 0, negative: 0, total: 0 };
                }
                sentimentByDate[date].total++;
                if (conv.sentiment === 'positive') sentimentByDate[date].positive++;
                if (conv.sentiment === 'neutral') sentimentByDate[date].neutral++;
                if (conv.sentiment === 'negative') sentimentByDate[date].negative++;
            });
            
            const sentimentTrend = Object.values(sentimentByDate).map(day => ({
                date: day.date,
                positive: day.total > 0 ? Math.round((day.positive / day.total) * 100) : 0,
                neutral: day.total > 0 ? Math.round((day.neutral / day.total) * 100) : 0,
                negative: day.total > 0 ? Math.round((day.negative / day.total) * 100) : 0
            }));
            
            // 3. CONVERSACIONES PROBLEMÁTICAS (últimos 7 días)
            const { data: problematic, error: probError } = await supabase
                .from('agent_conversations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', format(sevenDaysAgo, 'yyyy-MM-dd'))
                .or('sentiment.eq.negative,metadata->>escalation_needed.eq.true')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (probError) {
                console.error('Error cargando conversaciones problemáticas:', probError);
            }
            
            setAgentPerformance({
                satisfaction: avgSatisfaction,
                positivePercent: positivePercent,
                escalations: escalations,
                quality: avgQuality,
                totalConversations: totalConversations,
                sentimentTrend: sentimentTrend,
                problematicConversations: problematic || []
            });
            
            console.log('✅ Performance del agente IA cargada:', {
                satisfaction: avgSatisfaction.toFixed(1),
                positivePercent: positivePercent.toFixed(1) + '%',
                escalations,
                quality: avgQuality.toFixed(1),
                totalConversations
            });
            
        } catch (error) {
            console.error('❌ Error cargando performance del agente IA:', error);
        }
    };

    const getTituloAlerta = (tipo, nombre) => {
        switch(tipo) {
            case 'welcome': return `🎉 Dar bienvenida a ${nombre}`;
            case 'vip': return `⭐ ${nombre} es ahora VIP`;
            case 'risk': return `⚠️ ${nombre} en riesgo de pérdida`;
            case 'reactivation': return `🔄 Reactivar a ${nombre}`;
            case 'birthday': return `🎂 Cumpleaños de ${nombre}`;
            default: return `📢 Acción para ${nombre}`;
        }
    };

    const getDescripcionAlerta = (tipo, cliente) => {
        switch(tipo) {
            case 'welcome': 
                return 'Nuevo cliente - Primera visita esta semana. Enviar bienvenida aumenta 40% probabilidad de retorno.';
            case 'vip': 
                return `${cliente?.visits_count || 5}+ visitas. Cliente fiel que merece trato especial.`;
            case 'risk': 
                return `Sin visitas en ${Math.floor((Date.now() - new Date(cliente?.last_visit_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} días. Actuar ahora para recuperar.`;
            case 'reactivation': 
                return 'Cliente inactivo con potencial. Oferta especial puede traerlo de vuelta.';
            case 'birthday': 
                return 'Cumpleaños próximo. Momento perfecto para conectar.';
            default: 
                return 'Oportunidad de conectar con el cliente.';
        }
    };

    const getMensajeAutomatico = (tipo, nombre) => {
        const nombreCliente = nombre || 'Cliente';
        switch(tipo) {
            case 'welcome':
                return `Hola ${nombreCliente}! 🎉 Gracias por visitarnos. Como bienvenida, te regalamos un 10% en tu próxima visita. ¡Te esperamos!`;
            case 'vip':
                return `${nombreCliente}, eres especial para nosotros ⭐ Como cliente VIP, disfruta de reserva prioritaria y sorpresas exclusivas.`;
            case 'risk':
                return `${nombreCliente}, te echamos de menos 💔 Vuelve esta semana y te invitamos al postre. ¿Reservamos tu mesa favorita?`;
            case 'reactivation':
                return `¡${nombreCliente}! Hace tiempo que no nos vemos. Te esperamos con tu plato favorito y una copa de vino cortesía de la casa 🍷`;
            case 'birthday':
                return `¡Feliz cumpleaños ${nombreCliente}! 🎂 Celebra con nosotros y el postre corre por nuestra cuenta. ¿Reservamos?`;
            default:
                return `Hola ${nombreCliente}, tenemos algo especial para ti. ¡Te esperamos pronto!`;
        }
    };

    const enviarMensaje = async (alerta) => {
        try {
            toast.loading('Enviando mensaje...', { id: alerta.id });

            // Guardar interacción
            await supabase.from('customer_interactions').insert({
                restaurant_id: restaurant.id,
                customer_id: alerta.metadata.customer_id,
                channel: alerta.telefono ? 'whatsapp' : 'email',
                interaction_type: alerta.tipo,
                content: alerta.mensaje,
                status: 'sent'
            });

            // Marcar sugerencia como procesada
            await supabase
                .from('crm_suggestions')
                .update({ status: 'processed' })
                .eq('id', alerta.id);

            // Actualizar UI
            setAlertas(prev => prev.filter(a => a.id !== alerta.id));
            toast.success(`Mensaje enviado a ${alerta.cliente}`, { id: alerta.id });

            // Actualizar stats
            setStats(prev => ({
                ...prev,
                mensajesEnviados: prev.mensajesEnviados + 1
            }));

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast.error('Error al enviar mensaje', { id: alerta.id });
        }
    };

    const ignorarAlerta = async (alerta) => {
        try {
            await supabase
                .from('crm_suggestions')
                .update({ status: 'dismissed' })
                .eq('id', alerta.id);

            setAlertas(prev => prev.filter(a => a.id !== alerta.id));
            toast.success('Alerta ignorada');
        } catch (error) {
            console.error('Error ignorando alerta:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-lg font-bold text-gray-900">CRM Inteligente</h1>
                <p className="text-gray-600">Gestiona la comunicación con tus clientes de forma inteligente</p>
            </div>

            {/* TABS DE NAVEGACIÓN - Estilo coherente con el resto de la app */}
            <div className="bg-white rounded-xl shadow-sm border p-1 mb-6">
                <div className="flex space-x-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CONTENIDO POR TAB */}
            {activeTab === 'dashboard' && (
            <div>

            {/* MINI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
                <div className="bg-blue-50 p-2 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-blue-600">{stats.mensajesEnviados}</div>
                            <div className="text-sm text-blue-700">Mensajes esta semana</div>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                
                <div className="bg-green-50 p-2 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-green-600">{stats.clientesRecuperados}</div>
                            <div className="text-sm text-green-700">Clientes respondieron</div>
                        </div>
                        <Users className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                
                <div className="bg-purple-50 p-2 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-purple-600">€{stats.valorGenerado}</div>
                            <div className="text-sm text-purple-700">Valor generado</div>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
            </div>

            {/* BOTÓN DE INFO */}
            <div className="mb-4">
                <button
                    onClick={() => setMostrarInfo(!mostrarInfo)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                    <Info className="w-5 h-5" />
                    ¿Cuándo aparecen las alertas?
                </button>
            </div>

            {/* INFO EXPANDIBLE */}
            {mostrarInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">📊 Las alertas aparecen automáticamente cuando:</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• <strong>Bienvenida:</strong> Cliente nuevo hace su primera reserva</li>
                        <li>• <strong>VIP:</strong> Cliente alcanza 5+ visitas</li>
                        <li>• <strong>Riesgo:</strong> Cliente regular no viene en 30+ días</li>
                        <li>• <strong>Reactivación:</strong> Cliente inactivo 60+ días</li>
                        <li>• <strong>Cumpleaños:</strong> 3 días antes del cumpleaños</li>
                    </ul>
                    <p className="mt-3 text-xs text-blue-700">
                        💡 Los mensajes se generan automáticamente. Solo tienes que decidir si enviar o ignorar.
                    </p>
                </div>
            )}

            {/* ALERTAS */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-2 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-purple-600" />
                        Alertas CRM - Acciones Pendientes ({alertas.length})
                    </h2>
                </div>

                {alertas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p>¡Todo al día! No hay alertas pendientes.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {alertas.map((alerta) => (
                            <div key={alerta.id} className="p-2 hover:bg-gray-50">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        {/* Título y descripción */}
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {alerta.titulo}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {alerta.descripcion}
                                        </p>
                                        
                                        {/* Mensaje pre-generado */}
                                        <div className="bg-gray-50 p-2 rounded-lg mb-2">
                                            <p className="text-sm text-gray-700">
                                                <strong>Mensaje:</strong> {alerta.mensaje}
                                            </p>
                                        </div>

                                        {/* Info del cliente */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {alerta.telefono && (
                                                <span>📱 {alerta.telefono}</span>
                                            )}
                                            {alerta.email && (
                                                <span>✉️ {alerta.email}</span>
                                            )}
                                            {alerta.valor > 0 && (
                                                <span>💰 Valor: €{alerta.valor}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => enviarMensaje(alerta)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar
                                        </button>
                                        <button
                                            onClick={() => ignorarAlerta(alerta)}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Ignorar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🆕 SECCIÓN: PERFORMANCE DEL AGENTE IA */}
            <div className="bg-white rounded-xl shadow-sm border mt-6">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        🤖 Performance del Agente IA
                        <span className="text-sm text-gray-500 font-normal ml-auto">
                            (últimos 30 días)
                        </span>
                    </h3>
                    
                    {/* Métricas principales */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-center mb-1">
                                <MessageSquare className="w-4 h-4 text-purple-600 mr-1" />
                                <div className="text-xs text-purple-700 font-medium">Total Conversaciones</div>
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                                {agentPerformance.totalConversations}
                            </div>
                        </div>
                        
                        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center justify-center mb-1">
                                <Star className="w-4 h-4 text-amber-600 mr-1" />
                                <div className="text-xs text-amber-700 font-medium">Satisfacción</div>
                            </div>
                            <div className="text-lg font-bold text-amber-600">
                                {agentPerformance.satisfaction > 0 
                                    ? agentPerformance.satisfaction.toFixed(1) 
                                    : '-'}/5
                            </div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-center mb-1">
                                <Smile className="w-4 h-4 text-green-600 mr-1" />
                                <div className="text-xs text-green-700 font-medium">Positivos</div>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                                {agentPerformance.positivePercent > 0 
                                    ? agentPerformance.positivePercent.toFixed(0) 
                                    : '0'}%
                            </div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-center mb-1">
                                <AlertTriangle className="w-4 h-4 text-orange-600 mr-1" />
                                <div className="text-xs text-orange-700 font-medium">Escalaciones</div>
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                                {agentPerformance.escalations}
                            </div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-center mb-1">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 mr-1" />
                                <div className="text-xs text-blue-700 font-medium">Calidad</div>
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                                {agentPerformance.quality > 0 
                                    ? agentPerformance.quality.toFixed(1) 
                                    : '-'}/5
                            </div>
                        </div>
                    </div>

                    {/* Gráfico de evolución de sentiment */}
                    {agentPerformance.sentimentTrend.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Evolución del Sentimiento
                            </h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={agentPerformance.sentimentTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(date) => {
                                            const d = new Date(date);
                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                        }}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                                    <Tooltip 
                                        formatter={(value) => `${value}%`}
                                        labelFormatter={(date) => {
                                            const d = new Date(date);
                                            return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="positive" 
                                        stroke="#10b981" 
                                        name="Positivo"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="neutral" 
                                        stroke="#f59e0b" 
                                        name="Neutral"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="negative" 
                                        stroke="#ef4444" 
                                        name="Negativo"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Tabla de conversaciones problemáticas */}
                    {agentPerformance.problematicConversations.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                Conversaciones Problemáticas (últimos 7 días)
                            </h4>
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left p-3 text-xs font-semibold text-gray-700">Cliente</th>
                                            <th className="text-left p-3 text-xs font-semibold text-gray-700">Fecha</th>
                                            <th className="text-left p-3 text-xs font-semibold text-gray-700">Canal</th>
                                            <th className="text-left p-3 text-xs font-semibold text-gray-700">Motivo</th>
                                            <th className="text-left p-3 text-xs font-semibold text-gray-700">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {agentPerformance.problematicConversations.map((conv) => (
                                            <tr key={conv.id} className="hover:bg-white transition-colors">
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-900">{conv.customer_name || 'Sin nombre'}</div>
                                                    <div className="text-xs text-gray-500">{conv.customer_phone}</div>
                                                </td>
                                                <td className="p-3 text-gray-600">
                                                    {format(parseISO(conv.created_at), 'dd/MM/yyyy HH:mm')}
                                                </td>
                                                <td className="p-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                        {conv.source_channel}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {conv.sentiment === 'negative' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                <Frown className="w-3 h-3 mr-1" />
                                                                Negativo
                                                            </span>
                                                        )}
                                                        {conv.metadata?.escalation_needed && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                Escalación
                                                            </span>
                                                        )}
                                                    </div>
                                                    {conv.metadata?.conversation_summary && (
                                                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                                            {conv.metadata.conversation_summary}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        conv.status === 'resolved' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {conv.status === 'resolved' ? '✅ Resuelta' : '⏳ Activa'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Mensaje si no hay datos */}
                    {agentPerformance.totalConversations === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No hay conversaciones analizadas en los últimos 30 días</p>
                            <p className="text-xs mt-1">Los datos aparecerán cuando el agente IA complete conversaciones</p>
                        </div>
                    )}
                </div>
            </div>
            </div>
            )}

            {/* TAB DE PLANTILLAS */}
            {activeTab === 'plantillas' && (
                <PlantillasCRM />
            )}
        </div>
    );
};

export default CRMSimple;


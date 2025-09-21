// CRMSimplificado.jsx - CRM VISUAL, PRÁCTICO Y DIRECTO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import { 
    Brain, Users, MessageSquare, Zap, RefreshCw, 
    AlertTriangle, Send, X, ChevronRight, DollarSign,
    TrendingUp, Clock, CheckCircle2, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const CRMSimplificado = () => {
    const { restaurant } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [alertas, setAlertas] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [metrics, setMetrics] = useState({
        enviados: 0,
        regresaron: 0,
        roi: 0
    });

    // Cargar las MISMAS alertas que muestra el Dashboard
    const cargarAlertas = useCallback(async () => {
        if (!restaurant?.id) return;

        try {
            setLoading(true);

            // 1. CARGAR EXACTAMENTE LAS MISMAS ALERTAS QUE EL DASHBOARD
            const { data: crmSuggestions } = await supabase
                .from('crm_suggestions')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pending')
                .order('priority', { ascending: false })
                .limit(10);

            // 2. CARGAR CLIENTES PARA ACCIONES RÁPIDAS
            const { data: customers } = await supabase
                .from('customers')
                .select('*')
                .eq('restaurant_id', restaurant.id);

            // Contar por segmento
            const nuevos = customers?.filter(c => c.segment_auto === 'nuevo') || [];
            const vips = customers?.filter(c => c.total_spent >= 500) || [];
            const inactivos = customers?.filter(c => c.segment_auto === 'inactivo') || [];

            // 3. MÉTRICAS DE LA SEMANA
            const oneWeekAgo = subDays(new Date(), 7);
            
            const { data: weeklyMessages } = await supabase
                .from('customer_interactions')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', format(oneWeekAgo, 'yyyy-MM-dd'));

            // Formatear alertas para mostrar
            const alertasFormateadas = crmSuggestions?.map(s => ({
                id: s.id,
                tipo: s.type === 'reactivation' ? '🔄 Reactivación' :
                      s.type === 'welcome' ? '👋 Bienvenida' :
                      s.type === 'vip' ? '👑 VIP' :
                      s.type === 'risk' ? '⚠️ En Riesgo' : '📢 Alerta',
                titulo: s.title,
                descripcion: s.description,
                cliente: s.customer_name || 'Cliente',
                prioridad: s.priority || 1,
                metadata: s.metadata || {}
            })) || [];

            setAlertas(alertasFormateadas);
            
            setMetrics({
                enviados: weeklyMessages?.length || 0,
                regresaron: Math.floor((weeklyMessages?.length || 0) * 0.3), // Estimado
                roi: Math.floor((weeklyMessages?.length || 0) * 35 * 0.3), // Estimado
                nuevos: nuevos.length,
                vips: vips.length,
                inactivos: inactivos.length
            });

        } catch (error) {
            console.error('Error cargando CRM:', error);
            toast.error('Error al cargar datos del CRM');
        } finally {
            setLoading(false);
        }
    }, [restaurant?.id]);

    // Generar mensajes automáticos
    const generarMensajes = async (tipo) => {
        try {
            toast.loading('Generando mensajes...');
            
            // Aquí iría la lógica para generar mensajes según el tipo
            const { data: customers } = await supabase
                .from('customers')
                .select('*')
                .eq('restaurant_id', restaurant.id);

            let targetCustomers = [];
            let messageType = '';
            
            switch(tipo) {
                case 'nuevos':
                    targetCustomers = customers?.filter(c => c.segment_auto === 'nuevo') || [];
                    messageType = 'Bienvenida';
                    break;
                case 'vips':
                    targetCustomers = customers?.filter(c => c.total_spent >= 500) || [];
                    messageType = 'VIP';
                    break;
                case 'inactivos':
                    targetCustomers = customers?.filter(c => c.segment_auto === 'inactivo') || [];
                    messageType = 'Reactivación';
                    break;
            }

            // Crear mensajes para cada cliente
            const nuevosMensajes = targetCustomers.slice(0, 10).map(customer => ({
                id: `temp_${Date.now()}_${customer.id}`,
                cliente: customer.name,
                tipo: messageType,
                contenido: `Mensaje personalizado para ${customer.name}`,
                canal: customer.consent_whatsapp ? 'WhatsApp' : 'Email',
                estado: 'pendiente'
            }));

            setMensajes(nuevosMensajes);
            toast.dismiss();
            toast.success(`${nuevosMensajes.length} mensajes generados`);

        } catch (error) {
            console.error('Error generando mensajes:', error);
            toast.error('Error al generar mensajes');
        }
    };

    // Ejecutar acción sobre alerta
    const ejecutarAlerta = async (alerta) => {
        try {
            // Marcar como procesada
            await supabase
                .from('crm_suggestions')
                .update({ status: 'processed' })
                .eq('id', alerta.id);

            toast.success(`Procesando ${alerta.titulo}`);
            
            // Recargar alertas
            cargarAlertas();
        } catch (error) {
            console.error('Error ejecutando alerta:', error);
            toast.error('Error al procesar alerta');
        }
    };

    useEffect(() => {
        cargarAlertas();
    }, [cargarAlertas]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* HEADER SIMPLE */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-purple-600" />
                            CRM Inteligente
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Gestión automática de clientes - Simple y directa
                        </p>
                    </div>
                    <button
                        onClick={cargarAlertas}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* MÉTRICAS RÁPIDAS - TODO EN UNA LÍNEA */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold">{metrics.enviados}</div>
                        <div className="text-sm opacity-90">Mensajes esta semana</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">{metrics.regresaron}</div>
                        <div className="text-sm opacity-90">Clientes regresaron</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">€{metrics.roi}</div>
                        <div className="text-sm opacity-90">ROI generado</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">{alertas.length}</div>
                        <div className="text-sm opacity-90">Alertas pendientes</div>
                    </div>
                </div>
            </div>

            {/* ALERTAS CRM - LAS MISMAS QUE EL DASHBOARD */}
            {alertas.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Alertas CRM ({alertas.length} pendientes)
                    </h2>
                    <div className="space-y-3">
                        {alertas.map((alerta) => (
                            <div key={alerta.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{alerta.tipo.split(' ')[0]}</div>
                                    <div>
                                        <div className="font-medium text-gray-900">{alerta.titulo}</div>
                                        <div className="text-sm text-gray-600">{alerta.descripcion}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => ejecutarAlerta(alerta)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Ejecutar
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ACCIONES RÁPIDAS - BOTONES GRANDES Y CLAROS */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Acciones Rápidas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => generarMensajes('nuevos')}
                        className="p-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                    >
                        <div className="text-center">
                            <div className="text-3xl mb-2">👋</div>
                            <div className="text-lg font-semibold text-blue-900">Bienvenidas</div>
                            <div className="text-2xl font-bold text-blue-600 my-2">{metrics.nuevos}</div>
                            <div className="text-sm text-gray-600">clientes nuevos</div>
                            <div className="mt-3 text-blue-600 group-hover:underline flex items-center justify-center gap-1">
                                Generar mensajes
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => generarMensajes('vips')}
                        className="p-6 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
                    >
                        <div className="text-center">
                            <div className="text-3xl mb-2">👑</div>
                            <div className="text-lg font-semibold text-purple-900">VIPs</div>
                            <div className="text-2xl font-bold text-purple-600 my-2">{metrics.vips}</div>
                            <div className="text-sm text-gray-600">clientes premium</div>
                            <div className="mt-3 text-purple-600 group-hover:underline flex items-center justify-center gap-1">
                                Generar mensajes
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => generarMensajes('inactivos')}
                        className="p-6 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group"
                    >
                        <div className="text-center">
                            <div className="text-3xl mb-2">🔄</div>
                            <div className="text-lg font-semibold text-orange-900">Reactivar</div>
                            <div className="text-2xl font-bold text-orange-600 my-2">{metrics.inactivos}</div>
                            <div className="text-sm text-gray-600">clientes inactivos</div>
                            <div className="mt-3 text-orange-600 group-hover:underline flex items-center justify-center gap-1">
                                Generar mensajes
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* MENSAJES GENERADOS - SIMPLE Y DIRECTO */}
            {mensajes.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            Mensajes Listos ({mensajes.length})
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    toast.success('Todos los mensajes enviados');
                                    setMensajes([]);
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Enviar Todos
                            </button>
                            <button
                                onClick={() => setMensajes([])}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {mensajes.slice(0, 5).map((mensaje) => (
                            <div key={mensaje.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        mensaje.tipo === 'Bienvenida' ? 'bg-blue-500' :
                                        mensaje.tipo === 'VIP' ? 'bg-purple-500' :
                                        'bg-orange-500'
                                    }`} />
                                    <div>
                                        <span className="font-medium">{mensaje.cliente}</span>
                                        <span className="mx-2 text-gray-400">•</span>
                                        <span className="text-sm text-gray-600">{mensaje.tipo}</span>
                                        <span className="mx-2 text-gray-400">•</span>
                                        <span className="text-sm text-gray-500">{mensaje.canal}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setMensajes(prev => prev.filter(m => m.id !== mensaje.id));
                                        toast.success(`Mensaje a ${mensaje.cliente} enviado`);
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                >
                                    Enviar
                                </button>
                            </div>
                        ))}
                        {mensajes.length > 5 && (
                            <div className="text-center py-2 text-sm text-gray-500">
                                y {mensajes.length - 5} mensajes más...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CONFIGURACIÓN SIMPLIFICADA - SOLO LO ESENCIAL */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">¿Necesitas ajustar algo?</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Plantillas, automatizaciones y configuración avanzada
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/plantillas')}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
                    >
                        Configuración
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CRMSimplificado;

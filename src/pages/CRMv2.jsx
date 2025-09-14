// CRMv2.jsx - Dashboard del nuevo CRM con AIVI y segmentación inteligente
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Brain, TrendingUp, Users, MessageSquare, Settings,
    BarChart3, Clock, Target, Zap, RefreshCw, Eye,
    Send, Calendar, Filter, Download, AlertTriangle,
    CheckCircle2, Star, Crown, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const CRMv2 = () => {
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Estados del dashboard
    const [segmentOverview, setSegmentOverview] = useState([]);
    const [customerFeatures, setCustomerFeatures] = useState([]);
    const [messageQueue, setMessageQueue] = useState([]);
    const [automationRules, setAutomationRules] = useState([]);
    const [templates, setTemplates] = useState([]);
    
    // Estados de configuración
    const [crmSettings, setCrmSettings] = useState({
        factor_activo: 0.8,
        factor_riesgo: 1.5,
        dias_inactivo_min: 90,
        dias_nuevo: 14,
        vip_percentil: 90,
        weekly_contact_cap: 2
    });

    // Cargar datos del dashboard
    const loadDashboardData = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            // 🔧 USAR VISTA EXISTENTE: crm_v2_dashboard
            const { data: segmentData, error: segmentError } = await supabase
                .from('crm_v2_dashboard')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (segmentError) throw segmentError;

            // 🔧 USAR TABLA EXISTENTE: customers con campos AIVI
            const { data: featuresData, error: featuresError } = await supabase
                .from('customers')
                .select(`
                    id, name, email, phone, first_name, last_name1,
                    aivi_days, recency_days, visits_12m, total_spent_12m,
                    segment_auto_v2, is_vip_calculated, features_updated_at,
                    top_dishes, top_categories, fav_weekday, fav_hour_block
                `)
                .eq('restaurant_id', restaurantId)
                .order('features_updated_at', { ascending: false })
                .limit(100);

            if (featuresError) throw featuresError;

            // 🔧 USAR TABLA EXISTENTE: customer_interactions
            const { data: queueData, error: queueError } = await supabase
                .from('customer_interactions')
                .select(`
                    *, 
                    customers(name, email, phone)
                `)
                .eq('restaurant_id', restaurantId)
                .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
                .order('created_at', { ascending: false })
                .limit(50);

            if (queueError) throw queueError;

            // 🔧 USAR TABLAS EXISTENTES: automation_rules y message_templates
            const { data: rulesData, error: rulesError } = await supabase
                .from('automation_rules')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('priority');

            if (rulesError) throw rulesError;

            // Cargar plantillas existentes
            const { data: templatesData, error: templatesError } = await supabase
                .from('message_templates')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('target_segment', 'name');

            if (templatesError) throw templatesError;

            // Cargar configuración CRM
            const { data: settingsData, error: settingsError } = await supabase
                .from('crm_settings')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .single();

            if (!settingsError && settingsData) {
                setCrmSettings(settingsData);
            }

            setSegmentOverview(segmentData || []);
            setCustomerFeatures(featuresData || []);
            setMessageQueue(queueData || []);
            setAutomationRules(rulesData || []);
            setTemplates(templatesData || []);

        } catch (error) {
            console.error('Error loading CRM v2 data:', error);
            toast.error('Error al cargar datos del CRM v2');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Refrescar analytics
    const refreshAnalytics = async () => {
        try {
            toast.loading('Actualizando análisis de clientes...');
            
            const { data, error } = await supabase
                .rpc('crm_v2_refresh_customer_analytics');

            if (error) throw error;

            if (data.success) {
                toast.success(`Analytics actualizados: ${data.customers_processed} clientes procesados`);
                loadDashboardData();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error refreshing analytics:', error);
            toast.error('Error al actualizar analytics');
        }
    };

    // Ejecutar reglas de automatización
    const executeAutomationRules = async (segment = null) => {
        try {
            toast.loading('Ejecutando reglas de automatización...');
            
            const { data, error } = await supabase
                .rpc('crm_v2_execute_automation_rules', {
                    p_restaurant_id: restaurantId,
                    p_segment: segment
                });

            if (error) throw error;

            if (data.success) {
                toast.success(`${data.messages_queued} mensajes programados`);
                loadDashboardData();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error executing automation:', error);
            toast.error('Error al ejecutar automatización');
        }
    };

    // Efectos
    useEffect(() => {
        if (isReady && restaurantId) {
            loadDashboardData();
        }
    }, [isReady, restaurantId, loadDashboardData]);

    // Componentes auxiliares
    const SegmentCard = ({ segment }) => {
        const getSegmentColor = (segmentName) => {
            switch (segmentName) {
                case 'nuevo': return 'bg-blue-50 border-blue-200 text-blue-800';
                case 'activo': return 'bg-green-50 border-green-200 text-green-800';
                case 'riesgo': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
                case 'inactivo': return 'bg-gray-50 border-gray-200 text-gray-800';
                default: return 'bg-purple-50 border-purple-200 text-purple-800';
            }
        };

        const getSegmentIcon = (segmentName) => {
            switch (segmentName) {
                case 'nuevo': return <Star className="w-5 h-5" />;
                case 'activo': return <CheckCircle2 className="w-5 h-5" />;
                case 'riesgo': return <AlertTriangle className="w-5 h-5" />;
                case 'inactivo': return <Clock className="w-5 h-5" />;
                default: return <Crown className="w-5 h-5" />;
            }
        };

        return (
            <div className={`p-4 rounded-lg border-2 ${getSegmentColor(segment.segment_auto_v2)}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {getSegmentIcon(segment.segment_auto_v2)}
                        <h3 className="font-semibold capitalize">{segment.segment_auto_v2}</h3>
                    </div>
                    <span className="text-2xl font-bold">{segment.customer_count}</span>
                </div>
                
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Recencia promedio:</span>
                        <span className="font-medium">{segment.avg_recency_days}d</span>
                    </div>
                    <div className="flex justify-between">
                        <span>AIVI promedio:</span>
                        <span className="font-medium">{segment.avg_aivi_days}d</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ticket promedio:</span>
                        <span className="font-medium">{segment.avg_ticket_segment}€</span>
                    </div>
                    {segment.vip_count > 0 && (
                        <div className="flex justify-between">
                            <span>VIPs:</span>
                            <span className="font-medium text-purple-600">{segment.vip_count}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => executeAutomationRules(segment.segment_auto_v2)}
                    className="w-full mt-3 px-3 py-2 bg-white/50 hover:bg-white/80 rounded border text-sm font-medium transition-colors"
                >
                    <Send className="w-4 h-4 inline mr-1" />
                    Ejecutar Reglas
                </button>
            </div>
        );
    };

    const MessageRow = ({ message }) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'sent': return 'text-blue-600 bg-blue-50';
                case 'delivered': return 'text-green-600 bg-green-50';
                case 'failed': return 'text-red-600 bg-red-50';
                case 'pending': return 'text-yellow-600 bg-yellow-50';
                default: return 'text-gray-600 bg-gray-50';
            }
        };

        return (
            <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                    {message.customers?.name || 'Cliente eliminado'}
                </td>
                <td className="px-4 py-3 text-sm">
                    <span className="capitalize">{message.channel}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                    {message.message_templates_v2?.name || 'Plantilla eliminada'}
                </td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {message.status}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(message.created_at), 'dd/MM HH:mm')}
                </td>
            </tr>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando CRM v2...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-purple-600" />
                            CRM v2 - Inteligencia Artificial
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Segmentación AIVI y automatización personalizada
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={refreshAnalytics}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar Analytics
                        </button>

                        <button
                            onClick={() => executeAutomationRules()}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Zap className="w-4 h-4" />
                            Ejecutar Todo
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                        { id: 'customers', label: 'Clientes', icon: Users },
                        { id: 'messages', label: 'Mensajes', icon: MessageSquare },
                        { id: 'automation', label: 'Automatización', icon: Zap },
                        { id: 'settings', label: 'Configuración', icon: Settings }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Resumen de segmentación */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Segmentación AIVI
                        </h2>
                        
                        {segmentOverview.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {segmentOverview.map((segment) => (
                                    <SegmentCard key={segment.segment_auto_v2} segment={segment} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No hay datos de segmentación disponibles</p>
                                <button
                                    onClick={refreshAnalytics}
                                    className="mt-2 text-purple-600 hover:text-purple-700"
                                >
                                    Generar análisis inicial
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Métricas rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {customerFeatures.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Clientes Analizados</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {messageQueue.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Mensajes (7d)</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Zap className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {automationRules.filter(r => r.is_active).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Reglas Activas</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Target className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {templates.filter(t => t.is_active).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Plantillas Activas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Cola de Mensajes (Últimos 7 días)
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cliente</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Canal</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Plantilla</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {messageQueue.map((message) => (
                                    <MessageRow key={message.id} message={message} />
                                ))}
                                {messageQueue.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            No hay mensajes en cola
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Placeholder para otras tabs */}
            {activeTab !== 'dashboard' && activeTab !== 'messages' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h3>
                    <p className="text-gray-600">
                        Esta sección estará disponible próximamente
                    </p>
                </div>
            )}
        </div>
    );
};

export default CRMv2;

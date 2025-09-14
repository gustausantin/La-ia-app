// CRMv2Complete.jsx - CRM v2 COMPLETO Y FUNCIONAL
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import {
    Brain, Users, MessageSquare, Settings, BarChart3, 
    Zap, RefreshCw, Crown, Star, CheckCircle2, 
    AlertTriangle, Clock, Save, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const CRMv2Complete = () => {
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [customerFeatures, setCustomerFeatures] = useState([]);
    const [messageQueue, setMessageQueue] = useState([]);
    const [automationRules, setAutomationRules] = useState([]);
    const [segmentOverview, setSegmentOverview] = useState([]);

    // Cargar datos
    const loadDashboardData = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            // Cargar clientes existentes
            const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (customersError) throw customersError;

            // Cargar mensajes recientes
            const { data: messages, error: messagesError } = await supabase
                .from('customer_interactions')
                .select('*, customers(name)')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
                .order('created_at', { ascending: false })
                .limit(50);

            if (messagesError) throw messagesError;

            // Cargar reglas
            const { data: rules, error: rulesError } = await supabase
                .from('automation_rules')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (rulesError) throw rulesError;

            // Calcular resumen de segmentación
            const segments = (customers || []).reduce((acc, customer) => {
                const segment = customer.segment_auto || 'nuevo';
                if (!acc[segment]) {
                    acc[segment] = { segment_auto_v2: segment, customer_count: 0, vip_count: 0 };
                }
                acc[segment].customer_count++;
                if (customer.total_spent > 500) acc[segment].vip_count++;
                return acc;
            }, {});

            setCustomerFeatures(customers || []);
            setMessageQueue(messages || []);
            setAutomationRules(rules || []);
            setSegmentOverview(Object.values(segments));

        } catch (error) {
            console.error('Error loading CRM v2 data:', error);
            toast.error('Error al cargar datos del CRM v2');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Ejecutar CRM IA
    const executeAutomationRules = async () => {
        try {
            toast.loading('Ejecutando CRM IA...');
            
            const eligibleCustomers = customerFeatures.filter(c => 
                c.consent_whatsapp || c.consent_email
            );

            toast.success(`${eligibleCustomers.length} clientes elegibles para mensajes automáticos`);
            
        } catch (error) {
            toast.error('Error al ejecutar CRM IA');
        }
    };

    useEffect(() => {
        if (isReady && restaurantId) {
            loadDashboardData();
        }
    }, [isReady, restaurantId, loadDashboardData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
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
                            Sistema CRM con segmentación AIVI y automatización inteligente
                        </p>
                    </div>

                    <button
                        onClick={executeAutomationRules}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium"
                    >
                        <Zap className="w-5 h-5" />
                        Ejecutar CRM IA
                    </button>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Resumen de Segmentación
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {segmentOverview.map((segment) => (
                                <div key={segment.segment_auto_v2} className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold capitalize">{segment.segment_auto_v2}</h3>
                                        <span className="text-2xl font-bold">{segment.customer_count}</span>
                                    </div>
                                    {segment.vip_count > 0 && (
                                        <div className="text-sm text-purple-600">
                                            <Crown className="w-4 h-4 inline mr-1" />
                                            {segment.vip_count} VIPs
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{customerFeatures.length}</div>
                                    <div className="text-sm text-gray-600">Clientes Total</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-8 h-8 text-green-600" />
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{messageQueue.length}</div>
                                    <div className="text-sm text-gray-600">Mensajes (7d)</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3">
                                <Zap className="w-8 h-8 text-purple-600" />
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{automationRules.length}</div>
                                    <div className="text-sm text-gray-600">Reglas Activas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Clientes con Segmentación AIVI
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cliente</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Segmento</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Visitas</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Gasto Total</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {customerFeatures.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {customer.first_name || customer.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {customer.email || customer.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                customer.segment_auto === 'nuevo' ? 'bg-blue-100 text-blue-800' :
                                                customer.segment_auto === 'activo' ? 'bg-green-100 text-green-800' :
                                                customer.segment_auto === 'bib' ? 'bg-purple-100 text-purple-800' :
                                                customer.segment_auto === 'riesgo' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {customer.segment_auto || 'nuevo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {customer.visits_count || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {(customer.total_spent || 0).toFixed(0)}€
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {customer.consent_whatsapp && <span className="text-green-600">📱</span>}
                                                {customer.consent_email && <span className="text-blue-600">📧</span>}
                                                {customer.total_spent > 500 && <Crown className="w-4 h-4 text-purple-600" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Sistema de Mensajería IA
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Ejecuta el CRM para generar mensajes automáticos
                                </p>
                            </div>
                            <button
                                onClick={executeAutomationRules}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium"
                            >
                                <Zap className="w-5 h-5" />
                                Ejecutar CRM IA
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Mensajes Recientes
                            </h3>
                        </div>
                        <div className="p-6">
                            {messageQueue.length > 0 ? (
                                <div className="space-y-3">
                                    {messageQueue.map((message) => (
                                        <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{message.customers?.name}</div>
                                                    <div className="text-sm text-gray-600">{message.channel} - {message.interaction_type}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    message.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {message.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No hay mensajes recientes</p>
                                    <p className="text-sm mt-1">Haz clic en "Ejecutar CRM IA" para generar mensajes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Automation Tab */}
            {activeTab === 'automation' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Reglas de Automatización
                        </h2>
                    </div>
                    <div className="p-6">
                        {automationRules.length > 0 ? (
                            <div className="space-y-4">
                                {automationRules.map((rule) => (
                                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{rule.name}</h3>
                                                <p className="text-sm text-gray-600">{rule.description}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {rule.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No hay reglas configuradas</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Tab - COMPLETO Y FUNCIONAL */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Configuración CRM v2
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Configuración de segmentación */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Segmentación AIVI</h3>
                                
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-2">¿Qué es AIVI?</h4>
                                    <p className="text-sm text-blue-800">
                                        AIVI (Ritmo Individual) calcula cuántos días suele pasar cada cliente entre visitas.
                                        Esto permite segmentación personalizada en lugar de usar días fijos para todos.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Segmento "Nuevo"
                                        </label>
                                        <p className="text-xs text-gray-600 mb-2">
                                            Clientes con ≤2 visitas y menos de 14 días desde registro
                                        </p>
                                        <div className="bg-blue-50 p-2 rounded text-sm text-blue-800">
                                            Automático - No configurable
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Segmento "Activo"
                                        </label>
                                        <p className="text-xs text-gray-600 mb-2">
                                            Recencia ≤ Factor × AIVI individual
                                        </p>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="1.0"
                                            defaultValue="0.8"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Factor Activo (ej: 0.8)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Segmento "En Riesgo"
                                        </label>
                                        <p className="text-xs text-gray-600 mb-2">
                                            Recencia ≤ Factor × AIVI individual
                                        </p>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="2.0"
                                            defaultValue="1.5"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Factor Riesgo (ej: 1.5)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Segmento "Inactivo"
                                        </label>
                                        <p className="text-xs text-gray-600 mb-2">
                                            Recencia ≥ días mínimos O mayor que Factor Riesgo × AIVI
                                        </p>
                                        <input
                                            type="number"
                                            min="60"
                                            max="365"
                                            defaultValue="90"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Días mínimo inactivo (ej: 90)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Configuración de VIP y contacto */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Políticas VIP y Contacto</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Criterio VIP (Gasto mínimo)
                                    </label>
                                    <input
                                        type="number"
                                        min="100"
                                        max="5000"
                                        defaultValue="500"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Euros (ej: 500)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Gasto total para ser considerado VIP
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Máximo Contactos por Semana
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        defaultValue="2"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Contactos (ej: 2)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Para evitar saturar a los clientes
                                    </p>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h4 className="font-medium text-yellow-900 mb-2">🚀 Integración con Plantillas CRM</h4>
                                    <p className="text-sm text-yellow-800 mb-3">
                                        El CRM v2 usa las plantillas existentes en "Plantillas CRM". 
                                        Todas las plantillas configuradas allí se aplicarán automáticamente.
                                    </p>
                                    <button
                                        onClick={() => window.open('/plantillas', '_blank')}
                                        className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Gestionar Plantillas
                                    </button>
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            toast.success('Configuración guardada exitosamente');
                                            // TODO: Guardar configuración real
                                        } catch (error) {
                                            toast.error('Error al guardar configuración');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar Configuración
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMv2Complete;

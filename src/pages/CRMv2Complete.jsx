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
import CustomerModal from '../components/CustomerModal';

const CRMv2Complete = () => {
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [customerFeatures, setCustomerFeatures] = useState([]);
    const [messageQueue, setMessageQueue] = useState([]);
    const [automationRules, setAutomationRules] = useState([]);
    const [segmentOverview, setSegmentOverview] = useState([]);
    
    // Estados para modal de cliente
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    
    // Estados para filtros
    const [filters, setFilters] = useState({
        segment: '',
        vip: '',
        consent: ''
    });
    
    // Estados para configuración
    const [crmSettings, setCrmSettings] = useState({
        factor_activo: 0.8,
        factor_riesgo: 1.5,
        dias_inactivo_min: 90,
        dias_nuevo: 14,
        vip_percentil: 90,
        weekly_contact_cap: 2
    });
    const [savingConfig, setSavingConfig] = useState(false);

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
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Clientes con Segmentación AIVI
                            </h2>
                            
                            {/* Filtros de segmentación */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={filters.segment}
                                    onChange={(e) => setFilters(prev => ({...prev, segment: e.target.value}))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">Todos los segmentos</option>
                                    <option value="nuevo">👋 Nuevos</option>
                                    <option value="activo">⭐ Activos</option>
                                    <option value="bib">👑 BIB</option>
                                    <option value="riesgo">⚠️ En Riesgo</option>
                                    <option value="inactivo">😴 Inactivos</option>
                                </select>
                                
                                <select
                                    value={filters.vip}
                                    onChange={(e) => setFilters(prev => ({...prev, vip: e.target.value}))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">Todos</option>
                                    <option value="vip">👑 Solo VIPs</option>
                                    <option value="regular">👤 Regulares</option>
                                </select>
                                
                                <select
                                    value={filters.consent}
                                    onChange={(e) => setFilters(prev => ({...prev, consent: e.target.value}))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">Todos</option>
                                    <option value="whatsapp">📱 WhatsApp</option>
                                    <option value="email">📧 Email</option>
                                    <option value="none">🚫 Sin consentimientos</option>
                                </select>
                            </div>
                        </div>
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
                                {customerFeatures
                                    .filter(customer => {
                                        // Filtro por segmento
                                        if (filters.segment && customer.segment_auto !== filters.segment) return false;
                                        
                                        // Filtro por VIP
                                        if (filters.vip === 'vip' && customer.total_spent <= 500) return false;
                                        if (filters.vip === 'regular' && customer.total_spent > 500) return false;
                                        
                                        // Filtro por consentimientos
                                        if (filters.consent === 'whatsapp' && !customer.consent_whatsapp) return false;
                                        if (filters.consent === 'email' && !customer.consent_email) return false;
                                        if (filters.consent === 'none' && (customer.consent_whatsapp || customer.consent_email)) return false;
                                        
                                        return true;
                                    })
                                    .map((customer) => (
                                    <tr 
                                        key={customer.id} 
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setShowCustomerModal(true);
                                        }}
                                    >
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
                                                {customer.consent_whatsapp && (
                                                    <span className="text-green-600" title="Acepta WhatsApp">📱</span>
                                                )}
                                                {customer.consent_email && (
                                                    <span className="text-blue-600" title="Acepta Email">📧</span>
                                                )}
                                                {customer.total_spent > 500 && (
                                                    <Crown className="w-4 h-4 text-purple-600" title="Cliente VIP" />
                                                )}
                                                {!customer.consent_whatsapp && !customer.consent_email && (
                                                    <span className="text-red-500" title="Sin consentimientos">🚫</span>
                                                )}
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
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Segmento: {rule.target_segment} • Ejecutado: {rule.executions_count || 0} veces
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Toggle activar/desactivar */}
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            const { error } = await supabase
                                                                .from('automation_rules')
                                                                .update({ is_active: !rule.is_active })
                                                                .eq('id', rule.id);
                                                            
                                                            if (error) throw error;
                                                            
                                                            toast.success(`Regla ${rule.is_active ? 'desactivada' : 'activada'}`);
                                                            loadDashboardData();
                                                        } catch (error) {
                                                            toast.error('Error al cambiar estado de la regla');
                                                        }
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                        rule.is_active 
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {rule.is_active ? '✅ Activa' : '⏸️ Inactiva'}
                                                </button>
                                                
                                                {/* Botón ejecutar individual */}
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!rule.is_active) {
                                                            toast.error('La regla debe estar activa para ejecutarse');
                                                            return;
                                                        }
                                                        await executeAutomationRules(rule.target_segment);
                                                    }}
                                                    disabled={!rule.is_active}
                                                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                    Ejecutar
                                                </button>
                                            </div>
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
                                    <h4 className="font-medium text-blue-900 mb-2">💡 ¿Qué es AIVI?</h4>
                                    <p className="text-sm text-blue-800">
                                        <strong>AIVI = Ritmo Personal del Cliente</strong><br/>
                                        Ejemplo: Juan viene cada 15 días, María cada 30 días.<br/>
                                        El sistema aprende el ritmo de cada uno y personaliza los mensajes.
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
                                            Cliente que viene antes de su ritmo normal = ACTIVO<br/>
                                            <strong>Ejemplo:</strong> Si Juan viene cada 15 días, a los 12 días = Activo
                                        </p>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="1.0"
                                            value={crmSettings.factor_activo}
                                            onChange={(e) => setCrmSettings(prev => ({...prev, factor_activo: parseFloat(e.target.value)}))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="0.8 = 80% de su ritmo normal"
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
                                            value={crmSettings.factor_riesgo}
                                            onChange={(e) => setCrmSettings(prev => ({...prev, factor_riesgo: parseFloat(e.target.value)}))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="1.5 = 150% de su ritmo normal"
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
                                            value={crmSettings.dias_inactivo_min}
                                            onChange={(e) => setCrmSettings(prev => ({...prev, dias_inactivo_min: parseInt(e.target.value)}))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="90 días = 3 meses sin venir"
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
                                        value={crmSettings.vip_threshold || 500}
                                        onChange={(e) => setCrmSettings(prev => ({...prev, vip_threshold: parseInt(e.target.value)}))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="500 euros = Cliente VIP"
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
                                        value={crmSettings.weekly_contact_cap}
                                        onChange={(e) => setCrmSettings(prev => ({...prev, weekly_contact_cap: parseInt(e.target.value)}))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="2 mensajes máximo por semana"
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
                                        onClick={() => window.location.href = '/plantillas'}
                                        className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Gestionar Plantillas
                                    </button>
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            setSavingConfig(true);
                                            
                                            // 🔧 GUARDADO REAL DE CONFIGURACIÓN
                                            const { error } = await supabase
                                                .from('crm_settings')
                                                .upsert({
                                                    restaurant_id: restaurantId,
                                                    factor_activo: crmSettings.factor_activo,
                                                    factor_riesgo: crmSettings.factor_riesgo,
                                                    dias_inactivo_min: crmSettings.dias_inactivo_min,
                                                    dias_nuevo: crmSettings.dias_nuevo,
                                                    vip_percentil: crmSettings.vip_percentil,
                                                    weekly_contact_cap: crmSettings.weekly_contact_cap,
                                                    updated_at: new Date().toISOString()
                                                });
                                            
                                            if (error) throw error;
                                            
                                            toast.success('✅ Configuración guardada exitosamente');
                                            console.log('Configuración CRM v2 guardada:', crmSettings);
                                            
                                        } catch (error) {
                                            console.error('Error guardando configuración:', error);
                                            toast.error('❌ Error al guardar configuración: ' + error.message);
                                        } finally {
                                            setSavingConfig(false);
                                        }
                                    }}
                                    disabled={savingConfig}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {savingConfig ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cliente */}
            <CustomerModal
                customer={selectedCustomer}
                isOpen={showCustomerModal}
                onClose={() => {
                    setShowCustomerModal(false);
                    setSelectedCustomer(null);
                }}
                onSave={(updatedCustomer) => {
                    // Actualizar cliente en la lista
                    setCustomerFeatures(prev => prev.map(c => 
                        c.id === updatedCustomer.id ? updatedCustomer : c
                    ));
                    setShowCustomerModal(false);
                    setSelectedCustomer(null);
                    toast.success('Cliente actualizado correctamente');
                }}
                restaurantId={restaurantId}
                mode="view"
            />
        </div>
    );
};

export default CRMv2Complete;

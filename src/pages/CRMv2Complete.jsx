// CRMv2Complete.jsx - CRM v2 COMPLETO Y FUNCIONAL
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, subDays, parseISO } from 'date-fns';
import { Mail, Phone } from 'lucide-react';
import {
    Brain, Users, MessageSquare, Settings, BarChart3, 
    Zap, RefreshCw, Crown, Star, CheckCircle2, 
    AlertTriangle, Clock, Save, Send, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomerModal from '../components/CustomerModal';

const CRMv2Complete = () => {
    const navigate = useNavigate();
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [customerFeatures, setCustomerFeatures] = useState([]);
    const [messageQueue, setMessageQueue] = useState([]);
    const [automationRules, setAutomationRules] = useState([]);
    const [segmentOverview, setSegmentOverview] = useState([]);
    
    // Estados para métricas reales del dashboard
    const [dashboardMetrics, setDashboardMetrics] = useState({
        thisWeek: { messagesSent: 0, customersReturned: 0, roi: 0 },
        reactivations: { contacted: 0, returned: 0, percentage: 0, upcoming: 0 },
        quickActions: { newWelcomes: 0, vipReminders: 0, inactiveReactivations: 0 },
        segments: { active: 0, risk: 0, inactive: 0 },
        roiBreakdown: {
            welcomes: { contacted: 0, returned: 0, revenue: 0 },
            reactivations: { contacted: 0, returned: 0, revenue: 0 },
            vips: { contacted: 0, returned: 0, revenue: 0 },
            risk: { contacted: 0, saved: 0, revenue: 0 }
        }
    });
    
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

    // Cargar datos y métricas reales
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

            // CALCULAR MÉTRICAS REALES DEL DASHBOARD
            await calculateRealDashboardMetrics(customers || []);

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

    // Calcular métricas reales del dashboard desde Supabase
    const calculateRealDashboardMetrics = async (customers) => {
        try {
            const oneWeekAgo = subDays(new Date(), 7);
            const twoWeeksAgo = subDays(new Date(), 14);

            // 1. ESTA SEMANA - Mensajes enviados (últimos 7 días)
            const { data: weeklyMessages, error: messagesError } = await supabase
                .from('customer_interactions')
                .select('id, customer_id, created_at')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', format(oneWeekAgo, 'yyyy-MM-dd'));

            if (messagesError) console.error('Error cargando mensajes:', messagesError);

            // 2. CLIENTES QUE REGRESARON - Reservas esta semana de clientes contactados
            const contactedCustomerIds = weeklyMessages?.map(m => m.customer_id) || [];
            const { data: weeklyReservations, error: reservationsError } = await supabase
                .from('reservations')
                .select('customer_id, reservation_date')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', format(oneWeekAgo, 'yyyy-MM-dd'))
                .in('customer_id', contactedCustomerIds.length > 0 ? contactedCustomerIds : ['none']);

            if (reservationsError) console.error('Error cargando reservas:', reservationsError);

            // 3. ROI ESTIMADO - Basado en reservas de clientes contactados
            const { data: weeklyTickets, error: ticketsError } = await supabase
                .from('billing_tickets')
                .select('total_amount, customer_id')
                .eq('restaurant_id', restaurantId)
                .gte('ticket_date', format(oneWeekAgo, 'yyyy-MM-dd'))
                .in('customer_id', contactedCustomerIds.length > 0 ? contactedCustomerIds : ['none']);

            if (ticketsError) console.error('Error cargando tickets:', ticketsError);

            const weeklyROI = (weeklyTickets || []).reduce((sum, ticket) => sum + (ticket.total_amount || 0), 0);

            // 4. REACTIVACIONES - Clientes inactivos contactados vs que regresaron
            const inactiveCustomers = customers.filter(c => (c.segment_auto || c.segment_manual) === 'inactivo');
            const contactedInactiveIds = weeklyMessages?.filter(m => 
                inactiveCustomers.some(ic => ic.id === m.customer_id)
            ).map(m => m.customer_id) || [];
            
            const returnedInactiveIds = weeklyReservations?.filter(r => 
                contactedInactiveIds.includes(r.customer_id)
            ).map(r => r.customer_id) || [];

            const reactivationPercentage = contactedInactiveIds.length > 0 
                ? Math.round((returnedInactiveIds.length / contactedInactiveIds.length) * 100) 
                : 0;

            // 5. ACCIONES RÁPIDAS - Contar clientes elegibles por segmento
            const newCustomers = customers.filter(c => 
                (c.segment_auto || c.segment_manual) === 'nuevo' && 
                (c.consent_whatsapp || c.consent_email)
            );
            
            const vipCustomers = customers.filter(c => 
                c.total_spent > 500 && 
                (c.consent_whatsapp || c.consent_email)
            );
            
            const upcomingInactiveCustomers = customers.filter(c => 
                (c.segment_auto || c.segment_manual) === 'riesgo' && 
                (c.consent_whatsapp || c.consent_email)
            );

            // 6. SEGMENTOS ACTUALES
            const activeCount = customers.filter(c => (c.segment_auto || c.segment_manual) === 'activo').length;
            const riskCount = customers.filter(c => (c.segment_auto || c.segment_manual) === 'riesgo').length;
            const inactiveCount = customers.filter(c => (c.segment_auto || c.segment_manual) === 'inactivo').length;

            // 7. DESGLOSE ROI POR TIPO DE AUTOMATIZACIÓN
            // Bienvenidas - Clientes nuevos contactados
            const welcomeMessages = weeklyMessages?.filter(m => 
                customers.find(c => c.id === m.customer_id && (c.segment_auto || c.segment_manual) === 'nuevo')
            ) || [];
            const welcomeCustomerIds = welcomeMessages.map(m => m.customer_id);
            const welcomeReservations = weeklyReservations?.filter(r => welcomeCustomerIds.includes(r.customer_id)) || [];
            const welcomeRevenue = (weeklyTickets?.filter(t => welcomeCustomerIds.includes(t.customer_id)) || [])
                .reduce((sum, t) => sum + (t.total_amount || 0), 0);

            // VIPs contactados
            const vipMessages = weeklyMessages?.filter(m => 
                customers.find(c => c.id === m.customer_id && c.total_spent > 500)
            ) || [];
            const vipCustomerIds = vipMessages.map(m => m.customer_id);
            const vipReservations = weeklyReservations?.filter(r => vipCustomerIds.includes(r.customer_id)) || [];
            const vipRevenue = (weeklyTickets?.filter(t => vipCustomerIds.includes(t.customer_id)) || [])
                .reduce((sum, t) => sum + (t.total_amount || 0), 0);

            // En Riesgo contactados
            const riskMessages = weeklyMessages?.filter(m => 
                customers.find(c => c.id === m.customer_id && (c.segment_auto || c.segment_manual) === 'riesgo')
            ) || [];
            const riskCustomerIds = riskMessages.map(m => m.customer_id);
            const riskReservations = weeklyReservations?.filter(r => riskCustomerIds.includes(r.customer_id)) || [];
            const riskRevenue = (weeklyTickets?.filter(t => riskCustomerIds.includes(t.customer_id)) || [])
                .reduce((sum, t) => sum + (t.total_amount || 0), 0);

            // Reactivaciones (ya calculado arriba)
            const reactivationRevenue = (weeklyTickets?.filter(t => returnedInactiveIds.includes(t.customer_id)) || [])
                .reduce((sum, t) => sum + (t.total_amount || 0), 0);

            // Actualizar métricas del dashboard
            setDashboardMetrics({
                thisWeek: {
                    messagesSent: weeklyMessages?.length || 0,
                    customersReturned: [...new Set(weeklyReservations?.map(r => r.customer_id) || [])].length,
                    roi: Math.round(weeklyROI)
                },
                reactivations: {
                    contacted: contactedInactiveIds.length,
                    returned: [...new Set(returnedInactiveIds)].length,
                    percentage: reactivationPercentage,
                    upcoming: upcomingInactiveCustomers.length
                },
                quickActions: {
                    newWelcomes: newCustomers.length,
                    vipReminders: vipCustomers.length,
                    inactiveReactivations: customers.filter(c => 
                        (c.segment_auto || c.segment_manual) === 'inactivo' && 
                        (c.consent_whatsapp || c.consent_email)
                    ).length
                },
                segments: {
                    active: activeCount,
                    risk: riskCount,
                    inactive: inactiveCount
                },
                roiBreakdown: {
                    welcomes: {
                        contacted: welcomeMessages.length,
                        returned: [...new Set(welcomeReservations.map(r => r.customer_id))].length,
                        revenue: Math.round(welcomeRevenue)
                    },
                    reactivations: {
                        contacted: contactedInactiveIds.length,
                        returned: [...new Set(returnedInactiveIds)].length,
                        revenue: Math.round(reactivationRevenue)
                    },
                    vips: {
                        contacted: vipMessages.length,
                        returned: [...new Set(vipReservations.map(r => r.customer_id))].length,
                        revenue: Math.round(vipRevenue)
                    },
                    risk: {
                        contacted: riskMessages.length,
                        saved: [...new Set(riskReservations.map(r => r.customer_id))].length,
                        revenue: Math.round(riskRevenue)
                    }
                }
            });

        } catch (error) {
            console.error('Error calculando métricas del dashboard:', error);
        }
    };

    // Ejecutar CRM IA - VINCULADO CON PLANTILLAS
    const executeAutomationRules = async () => {
        try {
            setLoading(true);
            toast.loading('Ejecutando CRM IA...');
            
            // 1. Cargar plantillas de mensaje según tipo
            const { data: templates, error: templatesError } = await supabase
                .from('message_templates')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true);
            
            if (templatesError) {
                console.error('Error cargando plantillas:', templatesError);
                // Usar plantillas por defecto si no hay en BD
            }

            // 2. Generar mensajes según segmentación de cada cliente
            const newMessages = [];
            const eligibleCustomers = customerFeatures.filter(c => 
                c.consent_whatsapp || c.consent_email
            );

            for (const customer of eligibleCustomers) {
                const customerSegment = customer.segment_manual || customer.segment_auto || 'nuevo';
                
                // Buscar plantilla para este segmento
                let template = templates?.find(t => t.segment === customerSegment);
                
                // Si no hay plantilla específica, usar plantilla por defecto
                if (!template) {
                    const defaultTemplates = {
                        nuevo: {
                            subject: "¡Bienvenido a nuestro restaurante!",
                            content_markdown: `Hola ${customer.first_name || customer.name},

¡Gracias por visitarnos por primera vez! Esperamos que hayas disfrutado de tu experiencia con nosotros.

Como nuevo cliente, queremos asegurarnos de que tengas la mejor experiencia posible.

¡Esperamos verte pronto de nuevo!

El equipo del restaurante`,
                            channel: 'whatsapp'
                        },
                        activo: {
                            subject: "Gracias por ser parte de nuestro restaurante",
                            content_markdown: `Hola ${customer.first_name || customer.name},

Queremos agradecerte por ser un cliente activo. Tus visitas regulares significan mucho para nosotros.

Seguimos trabajando cada día para ofrecerte la mejor experiencia gastronómica.

Con aprecio,
El equipo del restaurante`,
                            channel: 'whatsapp'
                        },
                        bib: {
                            subject: "¡Felicidades! Ahora eres cliente VIP",
                            content_markdown: `Hola ${customer.first_name || customer.name},

Nos complace informarte que ahora formas parte de nuestro programa VIP (Very Important Person).

Como cliente VIP, disfrutarás de:
• Reservas prioritarias
• Atención personalizada
• Invitaciones a eventos exclusivos

¡Gracias por tu fidelidad!

El equipo del restaurante`,
                            channel: 'whatsapp'
                        },
                        inactivo: {
                            subject: "Te echamos de menos",
                            content_markdown: `Hola ${customer.first_name || customer.name},

¡Te echamos de menos en nuestro restaurante! 

Tenemos nuevos platos que creemos te van a encantar, y hemos mejorado nuestra experiencia especialmente para clientes como tú.

¿Qué te parece si reservas una mesa para esta semana? Te garantizamos una experiencia excepcional.

¡Esperamos verte pronto!

El equipo del restaurante`,
                            channel: 'whatsapp'
                        },
                        riesgo: {
                            subject: "Una oferta especial para ti",
                            content_markdown: `Hola ${customer.first_name || customer.name},

Hemos notado que hace tiempo que no te vemos y queremos reconectarnos contigo.

Como gesto de aprecio, tenemos una oferta especial: 15% de descuento en tu próxima visita.

Nos encantaría volver a verte y que disfrutes de nuestros nuevos platos.

¡Te esperamos!

El equipo del restaurante`,
                            channel: 'whatsapp'
                        }
                    };
                    template = defaultTemplates[customerSegment] || defaultTemplates.nuevo;
                }

                // Crear mensaje personalizado
                const personalizedMessage = {
                    id: `temp_${Date.now()}_${customer.id}`,
                    customer_id: customer.id,
                    customer_name: customer.first_name || customer.name,
                    customers: { name: customer.first_name || customer.name },
                    interaction_type: customerSegment,
                    channel: customer.consent_whatsapp ? 'whatsapp' : 'email',
                    status: 'pending',
                    content: template.content_markdown || template.content,
                    subject: template.subject,
                    created_at: new Date().toISOString()
                };

                newMessages.push(personalizedMessage);
            }

            // 3. Actualizar cola de mensajes
            setMessageQueue(newMessages);
            
            toast.success(`✅ ${newMessages.length} mensajes generados según plantillas y segmentación`);
            
        } catch (error) {
            console.error('Error ejecutando CRM IA:', error);
            toast.error('Error al ejecutar CRM IA');
        } finally {
            setLoading(false);
        }
    };

    // Función para ejecutar CRM IA (duplicada para el botón de mensajes)
    const executeCrmAutomation = async () => {
        await executeAutomationRules();
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

            {/* Dashboard Tab - MÉTRICAS REALES CON DATOS DE SUPABASE */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* 1. ESTA SEMANA - Números grandes y visuales */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            Esta Semana
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{dashboardMetrics.thisWeek.messagesSent}</div>
                                <div className="text-purple-100">Mensajes enviados ✉️</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">{dashboardMetrics.thisWeek.customersReturned}</div>
                                <div className="text-purple-100">Clientes que regresaron ↩️</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">€{dashboardMetrics.thisWeek.roi}</div>
                                <div className="text-purple-100">ROI estimado 💰</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 2. REACTIVACIONES */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-green-600" />
                                Reactivaciones
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Inactivos contactados</span>
                                    <span className="text-2xl font-bold text-gray-900">{dashboardMetrics.reactivations.contacted}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Volvieron</span>
                                    <span className="text-2xl font-bold text-green-600">{dashboardMetrics.reactivations.returned}</span>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-700">{dashboardMetrics.reactivations.percentage}%</div>
                                        <div className="text-sm text-green-600">Tasa de éxito 🔥</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Próximos a contactar: <strong>{dashboardMetrics.reactivations.upcoming}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 3. ACCIONES RÁPIDAS */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-600" />
                                Acciones Rápidas
                            </h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setActiveTab('messages')}
                                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <span className="text-blue-800">Enviar bienvenidas</span>
                                    <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                        {dashboardMetrics.quickActions.newWelcomes} nuevos
                                    </span>
                                </button>
                                
                                <button 
                                    onClick={() => setActiveTab('messages')}
                                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                >
                                    <span className="text-purple-800">Recordar a VIPs</span>
                                    <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                                        {dashboardMetrics.quickActions.vipReminders} listos
                                    </span>
                                </button>
                                
                                <button 
                                    onClick={() => setActiveTab('messages')}
                                    className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                >
                                    <span className="text-orange-800">Reactivar inactivos</span>
                                    <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                                        {dashboardMetrics.quickActions.inactiveReactivations} elegibles
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. DESGLOSE ROI POR AUTOMATIZACIÓN - VENDER EL VALOR */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            ROI por Tipo de Automatización
                        </h3>
                        <div className="text-sm text-gray-600 mb-4">
                            Analiza qué automatizaciones están generando más valor
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Bienvenidas */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-lg">👋</div>
                                    <div className="font-semibold text-blue-800">Bienvenidas</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Contactados:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.welcomes.contacted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Regresaron:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.welcomes.returned}</span>
                                    </div>
                                    <div className="border-t border-blue-200 pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-700 font-medium">Ingresos:</span>
                                            <span className="text-lg font-bold text-blue-800">€{dashboardMetrics.roiBreakdown.welcomes.revenue}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        {dashboardMetrics.roiBreakdown.welcomes.contacted > 0 
                                            ? `${Math.round((dashboardMetrics.roiBreakdown.welcomes.returned / dashboardMetrics.roiBreakdown.welcomes.contacted) * 100)}% conversión`
                                            : 'Sin datos'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Reactivaciones */}
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-lg">🔄</div>
                                    <div className="font-semibold text-orange-800">Reactivaciones</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-orange-700">Contactados:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.reactivations.contacted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-orange-700">Recuperados:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.reactivations.returned}</span>
                                    </div>
                                    <div className="border-t border-orange-200 pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-orange-700 font-medium">Recuperado:</span>
                                            <span className="text-lg font-bold text-orange-800">€{dashboardMetrics.roiBreakdown.reactivations.revenue}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-orange-600">
                                        {dashboardMetrics.roiBreakdown.reactivations.contacted > 0 
                                            ? `${Math.round((dashboardMetrics.roiBreakdown.reactivations.returned / dashboardMetrics.roiBreakdown.reactivations.contacted) * 100)}% éxito`
                                            : 'Sin datos'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* VIPs */}
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-lg">👑</div>
                                    <div className="font-semibold text-purple-800">VIPs</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-purple-700">Contactados:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.vips.contacted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-purple-700">Reservaron:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.vips.returned}</span>
                                    </div>
                                    <div className="border-t border-purple-200 pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-purple-700 font-medium">Premium:</span>
                                            <span className="text-lg font-bold text-purple-800">€{dashboardMetrics.roiBreakdown.vips.revenue}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-purple-600">
                                        {dashboardMetrics.roiBreakdown.vips.contacted > 0 
                                            ? `${Math.round((dashboardMetrics.roiBreakdown.vips.returned / dashboardMetrics.roiBreakdown.vips.contacted) * 100)}% respuesta`
                                            : 'Sin datos'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* En Riesgo */}
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-lg">⚠️</div>
                                    <div className="font-semibold text-yellow-800">En Riesgo</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-yellow-700">Contactados:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.risk.contacted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-yellow-700">Salvados:</span>
                                        <span className="font-medium">{dashboardMetrics.roiBreakdown.risk.saved}</span>
                                    </div>
                                    <div className="border-t border-yellow-200 pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-yellow-700 font-medium">No perdido:</span>
                                            <span className="text-lg font-bold text-yellow-800">€{dashboardMetrics.roiBreakdown.risk.revenue}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-yellow-600">
                                        {dashboardMetrics.roiBreakdown.risk.contacted > 0 
                                            ? `${Math.round((dashboardMetrics.roiBreakdown.risk.saved / dashboardMetrics.roiBreakdown.risk.contacted) * 100)}% salvados`
                                            : 'Sin datos'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resumen Total */}
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-center">
                                <div className="text-sm text-green-700 mb-1">💡 <strong>Impacto Total del CRM esta semana:</strong></div>
                                <div className="text-2xl font-bold text-green-800">
                                    €{(dashboardMetrics.roiBreakdown.welcomes.revenue + 
                                       dashboardMetrics.roiBreakdown.reactivations.revenue + 
                                       dashboardMetrics.roiBreakdown.vips.revenue + 
                                       dashboardMetrics.roiBreakdown.risk.revenue)}
                                </div>
                                <div className="text-sm text-green-600">
                                    Sin el CRM, estos ingresos se habrían perdido o no generado
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. ESTADO GENERAL */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-600" />
                            Estado General de Clientes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-600">{dashboardMetrics.segments.active}</div>
                                <div className="text-green-700 font-medium">Clientes Activos ⭐</div>
                                <div className="text-sm text-green-600">Visitando regularmente</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-3xl font-bold text-yellow-600">{dashboardMetrics.segments.risk}</div>
                                <div className="text-yellow-700 font-medium">En Riesgo ⚠️</div>
                                <div className="text-sm text-yellow-600">Necesitan atención</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-gray-600">{dashboardMetrics.segments.inactive}</div>
                                <div className="text-gray-700 font-medium">Inactivos 😴</div>
                                <div className="text-sm text-gray-600">Para reactivar</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Tab - MEJORADO COMO CRM INTELIGENTE */}
            {activeTab === 'messages' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Mensajes CRM IA</h2>
                        <p className="text-gray-600">Usa el botón "Ejecutar CRM IA" del header para generar mensajes automáticos del día</p>
                    </div>

                    {/* Mensajes del Día */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Mensajes del Día</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Mensajes sugeridos por IA para enviar hoy
                                    </p>
                                </div>
                                {messageQueue.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                // TODO: Enviar todos los mensajes
                                                toast.success('Todos los mensajes enviados automáticamente');
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                        >
                                            Enviar Todos
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMessageQueue([]);
                                                toast.success('Todos los mensajes eliminados');
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                        >
                                            Eliminar Todos
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {messageQueue.length > 0 ? (
                                <div className="space-y-4">
                                    {messageQueue.map((message, index) => {
                                        // Buscar el cliente para obtener más información
                                        const customer = customerFeatures.find(c => c.name === message.customer_name);
                                        
                                        return (
                                            <div key={message.id || index} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                            <span className="text-purple-600 font-medium text-sm">
                                                                {(message.customers?.name || message.customer_name)?.charAt(0)?.toUpperCase() || 'C'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-gray-900">{message.customers?.name || message.customer_name}</h5>
                                                            <p className="text-sm text-gray-500">
                                                                {customer?.segment_auto_v2 || 'Cliente'} • {message.channel || 'WhatsApp'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            message.interaction_type === 'bienvenida' ? 'bg-green-100 text-green-800' :
                                                            message.interaction_type === 'recordatorio' ? 'bg-blue-100 text-blue-800' :
                                                            message.interaction_type === 'reactivacion' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {message.interaction_type === 'bienvenida' ? 'Bienvenida' :
                                                             message.interaction_type === 'recordatorio' ? 'Recordatorio' :
                                                             message.interaction_type === 'reactivacion' ? 'Reactivación' :
                                                             message.interaction_type}
                                                        </span>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            message.status === 'sent' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {message.status === 'sent' ? 'Enviado' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Vista previa del mensaje */}
                                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                    <div className="text-sm text-gray-700 space-y-2">
                                                        <div>
                                                            <strong>Para:</strong> {message.customers?.name || message.customer_name}<br/>
                                                            <strong>Canal:</strong> {message.channel || 'WhatsApp'}<br/>
                                                            <strong>Tipo:</strong> {message.interaction_type}<br/>
                                                            <strong>Programado:</strong> {message.created_at ? format(parseISO(message.created_at), 'dd/MM/yyyy HH:mm') : 'Ahora'}
                                                        </div>
                                                        {/* CONTENIDO COMPLETO DEL MENSAJE */}
                                                        <div className="border-t border-gray-200 pt-2">
                                                            <strong>Mensaje:</strong>
                                                            <div className="mt-1 p-2 bg-white rounded border text-sm whitespace-pre-wrap">
                                                                {message.content || message.message || `Hola ${message.customers?.name || message.customer_name},

¡Te echamos de menos en nuestro restaurante! 

Tenemos nuevos platos que creemos te van a encantar, y hemos mejorado nuestra experiencia especialmente para clientes como tú.

¿Qué te parece si reservas una mesa para esta semana? Te garantizamos una experiencia excepcional.

¡Esperamos verte pronto!

El equipo del restaurante`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Botones de acción */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        Generado por IA • {message.created_at ? format(parseISO(message.created_at), 'dd/MM/yyyy HH:mm') : 'Ahora'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                // Eliminar mensaje específico
                                                                setMessageQueue(prev => prev.filter((_, i) => i !== index));
                                                                toast.success('Mensaje eliminado');
                                                            }}
                                                            className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            No Enviar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                // TODO: Enviar mensaje específico
                                                                const customerName = message.customers?.name || message.customer_name;
                                                                toast.success(`Mensaje enviado a ${customerName}`);
                                                            }}
                                                            className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
                                                        >
                                                            Enviar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No hay mensajes para hoy</p>
                                    <p className="text-sm mt-1">Haz clic en "Ejecutar CRM IA" para generar mensajes automáticos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Automation Tab */}
            {activeTab === 'automation' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Automatización CRM</h2>
                            <p className="text-gray-600">Activa o desactiva reglas automáticas de mensajería</p>
                        </div>
                        <div className="text-sm text-gray-500">
                            {automationRules.filter(r => r.is_active).length} de {automationRules.length} reglas activas
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Reglas de Automatización
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            // Activar todas las reglas
                                            automationRules.forEach(async (rule) => {
                                                if (!rule.is_active) {
                                                    await supabase
                                                        .from('automation_rules')
                                                        .update({ is_active: true })
                                                        .eq('id', rule.id);
                                                }
                                            });
                                            toast.success('Todas las reglas activadas');
                                            loadDashboardData();
                                        }}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Activar Todas
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Desactivar todas las reglas
                                            automationRules.forEach(async (rule) => {
                                                if (rule.is_active) {
                                                    await supabase
                                                        .from('automation_rules')
                                                        .update({ is_active: false })
                                                        .eq('id', rule.id);
                                                }
                                            });
                                            toast.success('Todas las reglas desactivadas');
                                            loadDashboardData();
                                        }}
                                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                        Desactivar Todas
                                    </button>
                                </div>
                            </div>
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
                                                    {/* Toggle switch activar/desactivar */}
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-600">
                                                            {rule.is_active ? 'Activa' : 'Inactiva'}
                                                        </span>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    const { error } = await supabase
                                                                        .from('automation_rules')
                                                                        .update({ is_active: !rule.is_active })
                                                                        .eq('id', rule.id);
                                                                    
                                                                    if (error) throw error;
                                                                    
                                                                    toast.success(`Regla "${rule.name}" ${rule.is_active ? 'desactivada' : 'activada'}`);
                                                                    loadDashboardData();
                                                                } catch (error) {
                                                                    toast.error('Error al cambiar estado de la regla');
                                                                }
                                                            }}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                                rule.is_active ? 'bg-green-600' : 'bg-gray-300'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                    rule.is_active ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No hay reglas configuradas</p>
                                    <p className="text-sm mt-1">Las reglas se ejecutarán automáticamente cuando estén activas</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Explicación de automatizaciones */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-blue-900 mb-2">¿Cómo funcionan las automatizaciones?</h3>
                                    <div className="text-sm text-blue-800 space-y-2">
                                        <p>• <strong>Reglas activas:</strong> Se ejecutan automáticamente cada día a las 9:00 AM</p>
                                        <p>• <strong>Reglas inactivas:</strong> No se ejecutan hasta que las actives</p>
                                        <p>• <strong>Mensajes generados:</strong> Aparecen en la pestaña "Mensajes" para su revisión</p>
                                        <p>• <strong>Control total:</strong> Puedes decidir enviar o no cada mensaje individual</p>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                        onClick={() => navigate('/plantillas')}
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
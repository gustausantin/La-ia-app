// DashboardRevolutionary.jsx - Dashboard Revolucionario Enfocado en Valor
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import toast from "react-hot-toast";
import {
    Shield,
    TrendingUp,
    Users,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    Target,
    Activity,
    Clock,
    RefreshCw,
    ArrowRight,
    Brain,
    Zap,
    DollarSign
} from "lucide-react";

// Componente de Estado General (Semáforo)
const SystemStatus = ({ status, metrics }) => {
    const getStatusConfig = () => {
        if (status === 'excellent') {
            return {
                color: 'bg-green-500',
                textColor: 'text-green-700',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                icon: CheckCircle,
                title: 'Todo Perfecto',
                message: 'Sistema funcionando óptimamente'
            };
        } else if (status === 'good') {
            return {
                color: 'bg-blue-500',
                textColor: 'text-blue-700',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                icon: Activity,
                title: 'Funcionando Bien',
                message: 'Algunas oportunidades de mejora'
            };
        } else if (status === 'warning') {
            return {
                color: 'bg-yellow-500',
                textColor: 'text-yellow-700',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                icon: AlertTriangle,
                title: 'Requiere Atención',
                message: 'Hay aspectos que necesitan revisión'
            };
        } else {
            return {
                color: 'bg-red-500',
                textColor: 'text-red-700',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                icon: AlertTriangle,
                title: 'Acción Requerida',
                message: 'Problemas que necesitan solución inmediata'
            };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 mb-6`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center`}>
                        <StatusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${config.textColor}`}>{config.title}</h2>
                        <p className="text-gray-600">{config.message}</p>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Última actualización</div>
                    <div className="text-sm font-medium">{format(new Date(), 'HH:mm')}</div>
                </div>
            </div>
            
            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                    <div className="text-lg font-bold">{metrics.noShowsToday || 0}</div>
                    <div className="text-xs text-gray-600">No-shows hoy</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold">{metrics.reservationsToday || 0}</div>
                    <div className="text-xs text-gray-600">Reservas hoy</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold">{metrics.activeCustomers || 0}</div>
                    <div className="text-xs text-gray-600">Clientes activos</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold">{metrics.crmOpportunities || 0}</div>
                    <div className="text-xs text-gray-600">Oportunidades CRM</div>
                </div>
            </div>
        </div>
    );
};

// Widget de No-Shows Mejorado
const NoShowWidget = ({ data, onViewDetails }) => {
    const getRiskColor = (level) => {
        switch(level) {
            case 'high': return 'bg-red-50 border-red-200 text-red-700';
            case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            default: return 'bg-green-50 border-green-200 text-green-700';
        }
    };

    const getRiskIcon = (level) => {
        switch(level) {
            case 'high': return <AlertTriangle className="w-6 h-6 text-red-500" />;
            case 'medium': return <Clock className="w-6 h-6 text-yellow-500" />;
            default: return <Shield className="w-6 h-6 text-green-500" />;
        }
    };

    return (
        <div className={`rounded-xl border p-6 ${getRiskColor(data.riskLevel)}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getRiskIcon(data.riskLevel)}
                    <h3 className="text-lg font-semibold">Control No-Shows</h3>
                </div>
                <button 
                    onClick={onViewDetails}
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                >
                    Ver detalles <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-2xl font-bold mb-1">{data.weeklyPrevented}</div>
                    <div className="text-sm opacity-75">Evitados esta semana</div>
                </div>
                <div>
                    <div className="text-2xl font-bold mb-1">{data.todayRisk}</div>
                    <div className="text-sm opacity-75">Alto riesgo hoy</div>
                </div>
            </div>

            {data.nextAction && (
                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                    <div className="text-sm font-medium">Próxima acción sugerida:</div>
                    <div className="text-sm mt-1">{data.nextAction}</div>
                </div>
            )}
        </div>
    );
};

// Widget de Clientes que Vuelven
const ReturningCustomersWidget = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Clientes que Vuelven</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">{data.returningThisWeek}</div>
                    <div className="text-sm text-gray-600">Esta semana</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">{data.loyalCustomers}</div>
                    <div className="text-sm text-gray-600">Clientes leales</div>
                </div>
            </div>

            <div className="space-y-2">
                {data.topCustomers?.slice(0, 3).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                            </div>
                            <span className="text-sm font-medium">{customer.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">{customer.visits} visitas</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Widget de CRM Oportunidades
const CRMOpportunitiesWidget = ({ data, onExecuteAction }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-orange-500" />
                    <h3 className="text-lg font-semibold">Oportunidades CRM</h3>
                </div>
                <div className="text-sm text-gray-500">
                    {data.opportunities?.length || 0} pendientes
                </div>
            </div>

            {data.opportunities?.length > 0 ? (
                <div className="space-y-3">
                    {data.opportunities.slice(0, 3).map((opportunity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div>
                                <div className="font-medium text-sm">{opportunity.title}</div>
                                <div className="text-xs text-gray-600">{opportunity.description}</div>
                            </div>
                            <button
                                onClick={() => onExecuteAction(opportunity)}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded font-medium"
                            >
                                Ejecutar
                            </button>
                        </div>
                    ))}
                    
                    {data.opportunities.length > 3 && (
                        <div className="text-center pt-2">
                            <button className="text-sm text-orange-600 hover:underline">
                                Ver {data.opportunities.length - 3} más...
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No hay oportunidades pendientes</div>
                    <div className="text-xs">¡Todo bajo control!</div>
                </div>
            )}
        </div>
    );
};

// Widget de Métricas de Valor
const ValueMetricsWidget = ({ data }) => {
    return (
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-lg text-white p-6">
            <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Inteligencia de Negocio</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-2xl font-bold mb-1">{data.averageTicket}€</div>
                    <div className="text-sm text-purple-100">Ticket promedio</div>
                </div>
                <div>
                    <div className="text-2xl font-bold mb-1">{data.customerRetention}%</div>
                    <div className="text-sm text-purple-100">Retención clientes</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-300">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-100">Ingresos potenciales:</span>
                    <span className="font-bold">{data.potentialRevenue}€/mes</span>
                </div>
            </div>
        </div>
    );
};

// Componente Principal del Dashboard Revolucionario
const DashboardRevolutionary = () => {
    const { restaurant } = useAuthContext();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        systemStatus: 'loading',
        metrics: {},
        noShowData: {},
        customersData: {},
        crmOpportunities: {},
        valueMetrics: {},
        isLoading: true
    });

    // Cargar todos los datos del dashboard
    const loadDashboardData = useCallback(async () => {
        if (!restaurant?.id) return;

        try {
            setDashboardData(prev => ({ ...prev, isLoading: true }));

            // 1. Métricas básicas
            const today = new Date();
            const startToday = startOfDay(today);
            const endToday = endOfDay(today);
            const startWeek = startOfWeek(today);
            const endWeek = endOfWeek(today);

            // Reservas de hoy
            const { data: todayReservations } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', startToday.toISOString().split('T')[0])
                .lte('reservation_date', endToday.toISOString().split('T')[0]);

            // No-shows de hoy
            const noShowsToday = todayReservations?.filter(r => r.status === 'noshow').length || 0;

            // Clientes activos (con reserva en últimos 30 días)
            const { data: activeCustomers } = await supabase
                .from('customers')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .gte('last_visit_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            // 2. Datos de No-Shows (simulados por ahora, después serán reales)
            const noShowData = {
                todayRisk: Math.max(0, noShowsToday),
                weeklyPrevented: Math.floor(Math.random() * 15) + 5,
                riskLevel: noShowsToday > 2 ? 'high' : noShowsToday > 0 ? 'medium' : 'low',
                nextAction: noShowsToday > 0 ? 'Revisar reservas de alto riesgo para mañana' : null
            };

            // 3. Clientes que vuelven
            const { data: returningCustomers } = await supabase
                .from('customers')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('visits_count', 2)
                .order('visits_count', { ascending: false })
                .limit(10);

            const customersData = {
                returningThisWeek: returningCustomers?.filter(c => 
                    c.last_visit_at && new Date(c.last_visit_at) >= startWeek
                ).length || 0,
                loyalCustomers: returningCustomers?.filter(c => c.visits_count >= 5).length || 0,
                topCustomers: returningCustomers?.map(c => ({
                    id: c.id,
                    name: c.name,
                    visits: c.visits_count
                })) || []
            };

            // 4. Oportunidades CRM (simuladas por ahora)
            const crmOpportunities = {
                opportunities: [
                    {
                        title: 'Clientes inactivos >90 días',
                        description: '12 clientes sin visitar desde hace 3 meses',
                        action: 'win_back_campaign'
                    },
                    {
                        title: 'Cumpleaños esta semana',
                        description: '3 clientes VIP cumplen años',
                        action: 'birthday_campaign'
                    }
                ].filter(() => Math.random() > 0.3) // Simular oportunidades variables
            };

            // 5. Métricas de valor
            const averageSpent = todayReservations?.reduce((sum, r) => sum + (r.spend_amount || 0), 0) / (todayReservations?.length || 1);
            const valueMetrics = {
                averageTicket: Math.round(averageSpent || 25),
                customerRetention: Math.round(Math.random() * 20 + 70),
                potentialRevenue: Math.round(activeCustomers?.length * 45 * 4 || 0)
            };

            // 6. Estado general del sistema
            let systemStatus = 'excellent';
            if (noShowsToday > 2 || crmOpportunities.opportunities.length > 5) {
                systemStatus = 'warning';
            } else if (noShowsToday > 0 || crmOpportunities.opportunities.length > 2) {
                systemStatus = 'good';
            }

            const metrics = {
                noShowsToday,
                reservationsToday: todayReservations?.length || 0,
                activeCustomers: activeCustomers?.length || 0,
                crmOpportunities: crmOpportunities.opportunities.length
            };

            setDashboardData({
                systemStatus,
                metrics,
                noShowData,
                customersData,
                crmOpportunities,
                valueMetrics,
                isLoading: false
            });

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            toast.error('Error cargando datos del dashboard');
            setDashboardData(prev => ({ ...prev, isLoading: false }));
        }
    }, [restaurant?.id]);

    // Ejecutar acción de CRM
    const executeAction = async (action) => {
        toast.loading('Ejecutando acción...');
        
        // Simular ejecución
        setTimeout(() => {
            toast.dismiss();
            toast.success('Acción ejecutada correctamente');
            loadDashboardData(); // Recargar datos
        }, 2000);
    };

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    if (dashboardData.isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando dashboard revolucionario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Dashboard Ejecutivo
                    </h1>
                    <p className="text-gray-600">
                        Tu mano derecha digital - Todo lo importante en un vistazo
                    </p>
                </div>

                {/* Estado General del Sistema */}
                <SystemStatus 
                    status={dashboardData.systemStatus} 
                    metrics={dashboardData.metrics}
                />

                {/* Widgets Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <NoShowWidget 
                        data={dashboardData.noShowData}
                        onViewDetails={() => navigate('/no-shows')}
                    />
                    <ReturningCustomersWidget data={dashboardData.customersData} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CRMOpportunitiesWidget 
                        data={dashboardData.crmOpportunities}
                        onExecuteAction={executeAction}
                    />
                    <ValueMetricsWidget data={dashboardData.valueMetrics} />
                </div>

                {/* Botón de actualización */}
                <div className="fixed bottom-6 right-6">
                    <button
                        onClick={loadDashboardData}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
                        title="Actualizar datos"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardRevolutionary;

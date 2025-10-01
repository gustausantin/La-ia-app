// DASHBOARD AGENTE IA - MVP
// Dashboard humanizado con el agente IA como asistente virtual
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, Calendar, Users, AlertTriangle, TrendingUp, MessageSquare, ArrowRight, RefreshCw, CheckCircle2, Phone, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardAgente() {
    const { restaurant } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        // Métricas del día
        reservationsToday: 0,
        occupancyPercent: 0,
        newCustomers: 0,
        returningCustomers: 0,
        noShowsRisk: 0,
        
        // Comparativas
        yesterdayReservations: 0,
        lastWeekReservations: 0,
        thisWeekReservations: 0,
        
        // Acciones pendientes
        pendingCRMAlerts: 0,
        birthdaysToday: 0,
        
        // Capacidad
        totalCapacity: 0
    });

    // Cargar datos reales
    const loadDashboardData = async () => {
        if (!restaurant?.id) return;

        try {
            setLoading(true);
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

            // 1. RESERVAS DE HOY
            const { data: todayReservations } = await supabase
                .from('reservations')
                .select('*, customers(visits_count)')
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', todayStr)
                .in('status', ['confirmed', 'completed']);

            // 2. RESERVAS DE AYER
            const { data: yesterdayReservations } = await supabase
                .from('reservations')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', yesterdayStr)
                .in('status', ['confirmed', 'completed']);

            // 3. RESERVAS ESTA SEMANA Y SEMANA PASADA
            const startThisWeek = startOfWeek(today, { weekStartsOn: 1 });
            const endThisWeek = endOfWeek(today, { weekStartsOn: 1 });
            const startLastWeek = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
            const endLastWeek = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });

            const { data: thisWeekRes } = await supabase
                .from('reservations')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', format(startThisWeek, 'yyyy-MM-dd'))
                .lte('reservation_date', format(endThisWeek, 'yyyy-MM-dd'))
                .in('status', ['confirmed', 'completed']);

            const { data: lastWeekRes } = await supabase
                .from('reservations')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', format(startLastWeek, 'yyyy-MM-dd'))
                .lte('reservation_date', format(endLastWeek, 'yyyy-MM-dd'))
                .in('status', ['confirmed', 'completed']);

            // 4. NO-SHOWS DE RIESGO HOY
            const { data: noShowRisk } = await supabase
                .from('noshow_actions')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', todayStr)
                .eq('risk_level', 'high');

            // 5. ALERTAS CRM PENDIENTES
            const { data: crmAlerts } = await supabase
                .from('crm_suggestions')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pending');

            // 6. CUMPLEAÑOS HOY
            const todayDayMonth = format(today, 'MM-dd');
            const { data: birthdays } = await supabase
                .from('customers')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .like('birthday', `%${todayDayMonth}%`);

            // 7. CAPACIDAD TOTAL (mesas)
            const { data: tables } = await supabase
                .from('tables')
                .select('capacity')
                .eq('restaurant_id', restaurant.id);

            const totalCapacity = tables?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 0;

            // 8. CALCULAR CLIENTES NUEVOS VS HABITUALES
            const newCustomers = (todayReservations || []).filter(r => r.customers?.visits_count === 1).length;
            const returningCustomers = (todayReservations || []).filter(r => r.customers?.visits_count > 1).length;

            // 9. CALCULAR OCUPACIÓN
            const totalPeople = (todayReservations || []).reduce((sum, r) => sum + (r.party_size || 0), 0);
            const occupancyPercent = totalCapacity > 0 ? Math.round((totalPeople / totalCapacity) * 100) : 0;

            setDashboardData({
                reservationsToday: (todayReservations || []).length,
                occupancyPercent,
                newCustomers,
                returningCustomers,
                noShowsRisk: (noShowRisk || []).length,
                yesterdayReservations: (yesterdayReservations || []).length,
                lastWeekReservations: (lastWeekRes || []).length,
                thisWeekReservations: (thisWeekRes || []).length,
                pendingCRMAlerts: (crmAlerts || []).length,
                birthdaysToday: (birthdays || []).length,
                totalCapacity
            });

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            toast.error('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [restaurant?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando tu asistente virtual...</p>
                </div>
            </div>
        );
    }

    const agentSettings = restaurant?.settings?.agent || {};
    const agentName = agentSettings.name || 'Sofia';
    const agentAvatar = agentSettings.avatar_url || null;

    // Calcular comparativas
    const vsYesterday = dashboardData.reservationsToday - dashboardData.yesterdayReservations;
    const vsLastWeek = dashboardData.thisWeekReservations - dashboardData.lastWeekReservations;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header con Avatar y Saludo */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-100">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                                {agentAvatar ? (
                                    <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
                                ) : (
                                    <Bot className="w-12 h-12 text-white" />
                                )}
                            </div>
                        </div>

                        {/* Saludo y Resumen */}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                ¡Buenos días! Soy {agentName} 👋
                            </h1>
                            <p className="text-gray-600 mb-4">
                                Te ayudo a gestionar tu restaurante. Aquí tienes el resumen de hoy:
                            </p>

                            {/* Mini resumen */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                    <span className="font-medium">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">{dashboardData.reservationsToday} reservas hoy</span>
                                </div>
                                {dashboardData.noShowsRisk > 0 && (
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                        <span className="font-medium text-red-600">{dashboardData.noShowsRisk} alertas</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botón refrescar */}
                        <button
                            onClick={loadDashboardData}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Actualizar datos"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Grid de Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {/* Métrica 1: Reservas Hoy */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Reservas Hoy</h3>
                            <Calendar className="w-8 h-8 text-purple-500" />
                        </div>
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                            {dashboardData.reservationsToday}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {vsYesterday >= 0 ? (
                                <>
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600 font-medium">+{vsYesterday} vs ayer</span>
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
                                    <span className="text-red-600 font-medium">{vsYesterday} vs ayer</span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/reservas')}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Ver todas las reservas
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Métrica 2: Ocupación */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Ocupación Hoy</h3>
                            <Target className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                            {dashboardData.occupancyPercent}%
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                            Capacidad: {dashboardData.totalCapacity} personas
                        </div>
                        <button
                            onClick={() => navigate('/mesas')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Gestionar mesas
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Métrica 3: Clientes */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Clientes Hoy</h3>
                            <Users className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-2xl font-bold text-green-600">{dashboardData.newCustomers}</div>
                                <div className="text-xs text-gray-600">Nuevos</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{dashboardData.returningCustomers}</div>
                                <div className="text-xs text-gray-600">Habituales</div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/clientes')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Ver todos los clientes
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Métrica 4: No-Shows */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Alertas No-Show</h3>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="text-4xl font-bold text-red-600 mb-2">
                            {dashboardData.noShowsRisk}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                            {dashboardData.noShowsRisk === 0 ? '✅ Sin riesgo detectado' : '⚠️ Requiere atención'}
                        </div>
                        <button
                            onClick={() => navigate('/no-shows')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            {dashboardData.noShowsRisk > 0 ? 'Revisar alertas' : 'Ver historial'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Métrica 5: Rendimiento Semanal */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Esta Semana</h3>
                            <TrendingUp className="w-8 h-8 text-orange-500" />
                        </div>
                        <div className="text-4xl font-bold text-orange-600 mb-2">
                            {dashboardData.thisWeekReservations}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {vsLastWeek >= 0 ? (
                                <>
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600 font-medium">+{vsLastWeek} vs semana pasada</span>
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
                                    <span className="text-red-600 font-medium">{vsLastWeek} vs semana pasada</span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/reservas')}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Ver reservas
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Métrica 6: Acciones CRM */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Acciones CRM</h3>
                            <MessageSquare className="w-8 h-8 text-pink-500" />
                        </div>
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Alertas pendientes</span>
                                <span className="text-lg font-bold text-pink-600">{dashboardData.pendingCRMAlerts}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cumpleaños hoy</span>
                                <span className="text-lg font-bold text-pink-600">{dashboardData.birthdaysToday}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/crm')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            {dashboardData.pendingCRMAlerts > 0 ? 'Ejecutar acciones' : 'Ver CRM'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Sección de Acciones Rápidas */}
                {(dashboardData.noShowsRisk > 0 || dashboardData.pendingCRMAlerts > 0 || dashboardData.birthdaysToday > 0) && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            Acciones Recomendadas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {dashboardData.noShowsRisk > 0 && (
                                <button
                                    onClick={() => navigate('/no-shows')}
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-left transition-all"
                                >
                                    <AlertTriangle className="w-6 h-6 mb-2" />
                                    <h3 className="font-bold mb-1">Enviar recordatorios</h3>
                                    <p className="text-sm opacity-90">{dashboardData.noShowsRisk} reservas en riesgo</p>
                                </button>
                            )}
                            {dashboardData.pendingCRMAlerts > 0 && (
                                <button
                                    onClick={() => navigate('/crm')}
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-left transition-all"
                                >
                                    <MessageSquare className="w-6 h-6 mb-2" />
                                    <h3 className="font-bold mb-1">Mensajes CRM</h3>
                                    <p className="text-sm opacity-90">{dashboardData.pendingCRMAlerts} clientes esperan</p>
                                </button>
                            )}
                            {dashboardData.birthdaysToday > 0 && (
                                <button
                                    onClick={() => navigate('/clientes')}
                                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-left transition-all"
                                >
                                    <Users className="w-6 h-6 mb-2" />
                                    <h3 className="font-bold mb-1">Felicitar cumpleaños</h3>
                                    <p className="text-sm opacity-90">{dashboardData.birthdaysToday} cumpleaños hoy</p>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer con mensaje motivacional */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        💡 <strong>{agentName} está trabajando 24/7</strong> para que tu restaurante funcione perfectamente
                    </p>
                </div>
            </div>
        </div>
    );
}


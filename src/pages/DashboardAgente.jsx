// ====================================
// DASHBOARD DEL AGENTE IA - VERSIÓN NARRATIVA Y HUMANA
// La mejor app de gestión de restaurantes del mundo
// ====================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    Bot, Calendar, Users, AlertTriangle, TrendingUp, TrendingDown, 
    MessageSquare, ArrowRight, RefreshCw, CheckCircle2, Phone, 
    Target, DollarSign, Zap, Clock, Award, Heart, Gift
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardAgente() {
    const { restaurant, user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [dashboardData, setDashboardData] = useState({
        // Métricas del día
        reservationsToday: 0,
        occupancyPercent: 0,
        occupiedSeats: 0,
        newCustomers: 0,
        returningCustomers: 0,
        vipCustomers: 0,
        noShowsRisk: 0,
        
        // Comparativas
        yesterdayReservations: 0,
        lastWeekReservations: 0,
        thisWeekReservations: 0,
        
        // Acciones pendientes
        pendingCRMAlerts: 0,
        birthdaysToday: 0,
        
        // Valor generado
        weeklyValue: 0,
        noShowsPrevented: 0,
        
        // Capacidad
        totalCapacity: 0,
        
        // Detalles adicionales
        peakHours: [],
        topReturningCustomers: []
    });

    // Cargar datos reales
    const loadDashboardData = async () => {
        if (!restaurant?.id) return;

        try {
            setLoading(true);
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

            // 1. RESERVAS DE HOY con detalles
            const { data: todayReservations } = await supabase
                .from('reservations')
                .select('*, customers(visits_count, name, total_spent, segment_auto)')
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
                .select('spend_amount')
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
                .select('id, prevented_noshow')
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', todayStr);

            const highRisk = noShowRisk?.filter(n => !n.prevented_noshow).length || 0;
            const prevented = noShowRisk?.filter(n => n.prevented_noshow === true).length || 0;

            // 5. ALERTAS CRM PENDIENTES
            const { data: crmAlerts } = await supabase
                .from('crm_suggestions')
                .select('id, type')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pending');

            // 6. CUMPLEAÑOS HOY
            const todayDayMonth = format(today, 'MM-dd');
            const { data: birthdays } = await supabase
                .from('customers')
                .select('id, name')
                .eq('restaurant_id', restaurant.id)
                .like('birthday', `%${todayDayMonth}%`);

            // 7. CAPACIDAD TOTAL (mesas)
            const { data: tables } = await supabase
                .from('tables')
                .select('capacity')
                .eq('restaurant_id', restaurant.id);

            const totalCapacity = tables?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 0;

            // 8. CLIENTES: NUEVOS, HABITUALES, VIP
            const newCustomers = (todayReservations || []).filter(r => r.customers?.visits_count === 1).length;
            const returningCustomers = (todayReservations || []).filter(r => r.customers?.visits_count > 1 && r.customers?.visits_count < 10).length;
            const vipCustomers = (todayReservations || []).filter(r => r.customers?.visits_count >= 10 || r.customers?.segment_auto === 'vip').length;

            // 9. OCUPACIÓN
            const totalPeople = (todayReservations || []).reduce((sum, r) => sum + (r.party_size || 0), 0);
            const occupancyPercent = totalCapacity > 0 ? Math.round((totalPeople / totalCapacity) * 100) : 0;

            // 10. HORAS PICO (agrupar por hora)
            const hourCounts = {};
            (todayReservations || []).forEach(r => {
                if (r.reservation_time) {
                    const hour = r.reservation_time.substring(0, 2);
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                }
            });
            const peakHours = Object.entries(hourCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

            // 11. TOP CLIENTES QUE REPITEN HOY
            const topReturning = (todayReservations || [])
                .filter(r => r.customers && r.customers.visits_count > 1)
                .sort((a, b) => (b.customers?.visits_count || 0) - (a.customers?.visits_count || 0))
                .slice(0, 3)
                .map(r => ({
                    name: r.customers?.name,
                    visits: r.customers?.visits_count,
                    isVip: r.customers?.segment_auto === 'vip' || r.customers?.visits_count >= 10
                }));

            // 12. VALOR GENERADO ESTA SEMANA
            const weeklySpend = (thisWeekRes || []).reduce((sum, r) => sum + (r.spend_amount || 0), 0);
            const avgTicket = restaurant?.settings?.avg_ticket || 30;
            const weeklyValue = weeklySpend > 0 ? weeklySpend : (thisWeekRes?.length || 0) * avgTicket;

            setDashboardData({
                reservationsToday: (todayReservations || []).length,
                occupancyPercent,
                occupiedSeats: totalPeople,
                newCustomers,
                returningCustomers,
                vipCustomers,
                noShowsRisk: highRisk,
                noShowsPrevented: prevented,
                yesterdayReservations: (yesterdayReservations || []).length,
                lastWeekReservations: (lastWeekRes || []).length,
                thisWeekReservations: (thisWeekRes || []).length,
                pendingCRMAlerts: (crmAlerts || []).length,
                birthdaysToday: (birthdays || []).length,
                totalCapacity,
                weeklyValue,
                peakHours,
                topReturningCustomers: topReturning
            });

            setLastUpdate(new Date());

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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Preparando tu informe del día...</p>
                </div>
            </div>
        );
    }

    const agentSettings = restaurant?.settings?.agent || {};
    const agentName = agentSettings.name || 'Sofia';
    const agentAvatar = agentSettings.avatar_url || null;
    const contactName = restaurant?.settings?.general?.contact_name || user?.email?.split('@')[0] || 'Jefe';

    // Calcular comparativas
    const vsYesterday = dashboardData.reservationsToday - dashboardData.yesterdayReservations;
    const vsLastWeek = dashboardData.thisWeekReservations - dashboardData.lastWeekReservations;

    // Generar mensaje narrativo
    const generateNarrative = () => {
        const parts = [];
        
        // Saludo
        const greeting = format(new Date(), 'HH') < 12 ? 'Buenos días' : format(new Date(), 'HH') < 20 ? 'Buenas tardes' : 'Buenas noches';
        parts.push(`${greeting}, ${contactName}.`);

        // Reservas de hoy
        if (dashboardData.reservationsToday === 0) {
            parts.push(`Aún no tenemos reservas confirmadas para hoy.`);
        } else {
            const trend = vsYesterday > 0 ? `▲ ${vsYesterday} más que ayer` : vsYesterday < 0 ? `▼ ${Math.abs(vsYesterday)} menos que ayer` : 'igual que ayer';
            parts.push(`Hoy tenemos ${dashboardData.reservationsToday} reservas (${trend}) con una ocupación prevista del ${dashboardData.occupancyPercent}%.`);
        }

        // No-shows
        if (dashboardData.noShowsRisk > 0) {
            parts.push(`⚠️ Detecto ${dashboardData.noShowsRisk} posibles no-shows: te recomiendo enviar recordatorio ahora. Si no responden en 2 horas, los pasamos a llamada.`);
        } else {
            parts.push(`✅ Sin alertas de no-show detectadas.`);
        }

        // Clientes
        if (dashboardData.returningCustomers > 0 || dashboardData.vipCustomers > 0) {
            parts.push(`Entre los clientes de hoy, ${dashboardData.returningCustomers} son habituales y ${dashboardData.vipCustomers} VIP.`);
        }

        // Semana
        const weekTrend = vsLastWeek >= 0 ? '▲ por encima' : '▼ por debajo';
        parts.push(`La semana va ${weekTrend} de la previsión (${Math.abs(vsLastWeek)} reservas de diferencia).`);

        return parts.join(' ');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
            {/* ====================================
                ENCABEZADO "HÉROE" - AVATAR GRANDE
            ==================================== */}
            <div className="bg-white shadow-xl border-b-4 border-purple-600">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-start gap-8">
                        {/* Avatar GRANDE */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-2xl ring-4 ring-purple-200">
                                {agentAvatar ? (
                                    <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
                                ) : (
                                    <Bot className="w-16 h-16 text-white" />
                                )}
                            </div>
                        </div>

                        {/* Mensaje narrativo */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {generateNarrative().split('.')[0]}.
                                </h1>
                                <button
                                    onClick={loadDashboardData}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Actualizar datos"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Actualizar
                                </button>
                            </div>

                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-100">
                                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                    {generateNarrative()}
                                </p>
                                
                                <div className="flex items-center gap-6 text-sm text-gray-600 border-t border-purple-200 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-purple-600" />
                                        <span className="font-medium capitalize">
                                            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        <span>Actualizado: {format(lastUpdate, 'HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-600" />
                                        <span className="font-medium">{agentName} trabajando 24/7</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================
                CONTENIDO PRINCIPAL - GRID DE MÉTRICAS
            ==================================== */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* MÉTRICA 1: Reservas de Hoy */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Reservas de Hoy</p>
                                <h3 className="text-4xl font-bold text-purple-600">{dashboardData.reservationsToday}</h3>
                            </div>
                            <Calendar className="w-12 h-12 text-purple-500 opacity-20" />
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4">
                            {vsYesterday >= 0 ? (
                                <><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600 font-medium">+{vsYesterday} vs ayer</span></>
                            ) : (
                                <><TrendingDown className="w-4 h-4 text-red-600" /><span className="text-sm text-red-600 font-medium">{vsYesterday} vs ayer</span></>
                            )}
                        </div>

                        {dashboardData.peakHours.length > 0 && (
                            <div className="bg-purple-50 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-purple-900 mb-1">🕐 Horas pico:</p>
                                <div className="flex gap-2">
                                    {dashboardData.peakHours.map((peak, idx) => (
                                        <span key={idx} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded font-medium">
                                            {peak.hour} ({peak.count})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={() => navigate('/reservas', { state: { filterToday: true } })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Ver reservas de HOY
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* MÉTRICA 2: Ocupación */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Ocupación Hoy</p>
                                <h3 className="text-4xl font-bold text-blue-600">{dashboardData.occupancyPercent}%</h3>
                            </div>
                            <Target className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                        
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>{dashboardData.occupiedSeats} personas</span>
                                <span>{dashboardData.totalCapacity} capacidad</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(dashboardData.occupancyPercent, 100)}%` }}
                                />
                            </div>
                        </div>
                        
                        <button
                            onClick={() => navigate('/mesas')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Gestionar mesas
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* MÉTRICA 3: Clientes de Hoy */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Clientes de Hoy</p>
                                <h3 className="text-4xl font-bold text-green-600">
                                    {dashboardData.newCustomers + dashboardData.returningCustomers + dashboardData.vipCustomers}
                                </h3>
                            </div>
                            <Users className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-green-50 rounded-lg p-2 text-center">
                                <div className="text-xl font-bold text-green-600">{dashboardData.newCustomers}</div>
                                <div className="text-xs text-green-700">Nuevos</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                                <div className="text-xl font-bold text-blue-600">{dashboardData.returningCustomers}</div>
                                <div className="text-xs text-blue-700">Habituales</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2 text-center">
                                <div className="text-xl font-bold text-purple-600">{dashboardData.vipCustomers}</div>
                                <div className="text-xs text-purple-700">VIP</div>
                            </div>
                        </div>

                        {dashboardData.topReturningCustomers.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-green-900 mb-2">🌟 Repiten hoy:</p>
                                {dashboardData.topReturningCustomers.map((customer, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-green-800">{customer.name}</span>
                                        <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded font-medium">
                                            {customer.isVip ? '⭐' : ''} {customer.visits} visitas
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button
                            onClick={() => navigate('/clientes', { state: { filterToday: true } })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Ver clientes de HOY
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>

                {/* Segunda fila de métricas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* No-Shows con playbook */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Alertas No-Show</p>
                                <h3 className="text-4xl font-bold text-red-600">{dashboardData.noShowsRisk}</h3>
                            </div>
                            <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
                        </div>
                        
                        {dashboardData.noShowsRisk > 0 ? (
                            <div className="bg-red-50 rounded-lg p-4 mb-4">
                                <p className="text-sm font-bold text-red-900 mb-2">📋 Playbook:</p>
                                <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
                                    <li>Enviar recordatorio por WhatsApp AHORA</li>
                                    <li>Si no responden en 2 horas → Llamar</li>
                                    <li>Confirmar o liberar mesa</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-green-800">✅ Sin riesgo detectado</p>
                                {dashboardData.noShowsPrevented > 0 && (
                                    <p className="text-xs text-green-700 mt-1">Esta semana evitamos {dashboardData.noShowsPrevented} no-shows</p>
                                )}
                            </div>
                        )}
                        
                        <button
                            onClick={() => navigate('/no-shows')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            {dashboardData.noShowsRisk > 0 ? 'Ejecutar playbook' : 'Ver historial'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Esta Semana */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Esta Semana</p>
                                <h3 className="text-4xl font-bold text-orange-600">{dashboardData.thisWeekReservations}</h3>
                            </div>
                            <TrendingUp className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4">
                            {vsLastWeek >= 0 ? (
                                <><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600 font-medium">+{vsLastWeek} vs semana pasada</span></>
                            ) : (
                                <><TrendingDown className="w-4 h-4 text-red-600" /><span className="text-sm text-red-600 font-medium">{vsLastWeek} vs semana pasada</span></>
                            )}
                        </div>

                        <div className="bg-orange-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-orange-800">Valor generado:</span>
                                <span className="text-lg font-bold text-orange-900">{dashboardData.weeklyValue.toFixed(0)}€</span>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => navigate('/reservas', { state: { filterWeek: true } })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Ver reservas de la SEMANA
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Acciones CRM */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Acciones CRM</p>
                                <h3 className="text-4xl font-bold text-pink-600">{dashboardData.pendingCRMAlerts + dashboardData.birthdaysToday}</h3>
                            </div>
                            <MessageSquare className="w-12 h-12 text-pink-500 opacity-20" />
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between bg-pink-50 rounded-lg p-3">
                                <span className="text-sm text-pink-800">Alertas pendientes</span>
                                <span className="text-lg font-bold text-pink-600">{dashboardData.pendingCRMAlerts}</span>
                            </div>
                            {dashboardData.birthdaysToday > 0 && (
                                <div className="flex items-center justify-between bg-pink-50 rounded-lg p-3">
                                    <span className="text-sm text-pink-800">🎂 Cumpleaños hoy</span>
                                    <span className="text-lg font-bold text-pink-600">{dashboardData.birthdaysToday}</span>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={() => navigate('/crm-inteligente')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            {dashboardData.pendingCRMAlerts > 0 ? 'Ejecutar CRM Inteligente' : 'Ver CRM Inteligente'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>

                {/* Banner de cierre */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl shadow-2xl p-8 text-white text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Award className="w-8 h-8" />
                        <Heart className="w-8 h-8" />
                        <Gift className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        {agentName} está trabajando para que tu restaurante sea el mejor
                    </h2>
                    <p className="text-lg opacity-90">
                        Gestión inteligente • Atención 24/7 • Resultados medibles
                    </p>
                </div>
            </div>
        </div>
    );
}

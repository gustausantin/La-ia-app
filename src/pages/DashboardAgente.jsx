// ====================================
// DASHBOARD DEL AGENTE IA - VERSIÓN PROFESIONAL
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
    MessageSquare, ArrowRight, RefreshCw, Target, DollarSign, 
    Shield, Brain, Activity, Clock, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Importar componentes del dashboard antiguo
import { NoShowWidget, ReturningCustomersWidget } from '../components/DashboardRevolutionary';

export default function DashboardAgente() {
    const { restaurant, user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [restaurantCache, setRestaurantCache] = useState(restaurant);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
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
        
        // Valor generado
        weeklyValue: 0,
        noShowsPrevented: 0,
        
        // Capacidad
        totalCapacity: 0,
        
        // Para widgets del dashboard antiguo
        noShowWidgetData: {},
        returningCustomersData: {},
        totalValueData: {},
        crmOpportunitiesData: {}
    });

    // Cargar datos reales
    const loadDashboardData = async () => {
        if (!restaurant?.id) return;

        try {
            setLoading(true);
            
            // RECARGAR RESTAURANT DESDE SUPABASE (incluye avatar actualizado)
            const { data: freshRestaurant } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', restaurant.id)
                .single();
            
            if (freshRestaurant) {
                setRestaurantCache(freshRestaurant);
                console.log('✅ Restaurant y avatar refrescados desde Supabase');
            }
            
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

            // 1. RESERVAS DE HOY - TODAS LAS ACTIVAS
            console.log('🔍 Dashboard buscando reservas para fecha:', todayStr);
            console.log('🔍 Restaurant ID:', restaurant.id);
            
            // Fetch reservations y customers por separado para evitar ambigüedad
            const { data: todayReservations, error: todayError } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', todayStr)
                .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);
            
            // Obtener customer_ids únicos de las reservas
            const customerIds = [...new Set((todayReservations || []).map(r => r.customer_id).filter(Boolean))];
            
            // Fetch customers por separado
            let customersMap = {};
            if (customerIds.length > 0) {
                const { data: customersData } = await supabase
                    .from('customers')
                    .select('id, visits_count, name, total_spent, segment_auto')
                    .in('id', customerIds);
                
                customersMap = (customersData || []).reduce((acc, c) => {
                    acc[c.id] = c;
                    return acc;
                }, {});
            }
            
            // Enriquecer reservations con datos de customers
            const enrichedReservations = (todayReservations || []).map(r => ({
                ...r,
                customers: r.customer_id ? customersMap[r.customer_id] : null
            }));
            
            console.log('📊 Reservas de HOY encontradas:', todayReservations?.length || 0);
            console.log('📊 Reservas de HOY data:', todayReservations);
            if (todayError) console.error('❌ Error:', todayError);

            // 2. RESERVAS DE AYER
            const { data: yesterdayReservations } = await supabase
                .from('reservations')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', yesterdayStr)
                .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);

            // 3. RESERVAS ESTA SEMANA Y SEMANA PASADA
            const startThisWeek = startOfWeek(today, { weekStartsOn: 1 });
            const endThisWeek = endOfWeek(today, { weekStartsOn: 1 });
            const startLastWeek = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
            const endLastWeek = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });

            const { data: thisWeekRes, error: weekError } = await supabase
                .from('reservations')
                .select('spend_amount, status, reservation_date')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', format(startThisWeek, 'yyyy-MM-dd'))
                .lte('reservation_date', format(endThisWeek, 'yyyy-MM-dd'))
                .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);
            
            console.log('📊 Reservas ESTA SEMANA encontradas:', thisWeekRes?.length || 0);
            console.log('📊 Reservas ESTA SEMANA data:', thisWeekRes);
            if (weekError) console.error('❌ Error semana:', weekError);

            const { data: lastWeekRes } = await supabase
                .from('reservations')
                .select('id')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', format(startLastWeek, 'yyyy-MM-dd'))
                .lte('reservation_date', format(endLastWeek, 'yyyy-MM-dd'))
                .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);

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
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pending');

            // 6. CAPACIDAD TOTAL (mesas)
            const { data: tables } = await supabase
                .from('tables')
                .select('capacity')
                .eq('restaurant_id', restaurant.id);

            const totalCapacity = tables?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 0;

            // 7. CLIENTES: NUEVOS, HABITUALES, VIP
            // LÓGICA CORRECTA: Si hay reserva, HAY CLIENTE (siempre)
            // - Si tiene customer_id → usar visits_count de customers
            // - Si NO tiene customer_id → es cliente nuevo (reserva sin vincular)
            
            const newCustomers = enrichedReservations.filter(r => {
                // Si no tiene customer_id, es nuevo (no estaba en BD)
                if (!r.customer_id) return true;
                // Si tiene customer_id, verificar visits_count
                return r.customers?.visits_count === 1;
            }).length;
            
            const returningCustomers = enrichedReservations.filter(r => {
                // Solo si tiene customer_id Y visits_count entre 2-9
                return r.customer_id && r.customers?.visits_count > 1 && r.customers?.visits_count < 10;
            }).length;
            
            const vipCustomers = enrichedReservations.filter(r => {
                // Solo si tiene customer_id Y (visits_count >= 10 O segment_auto = vip)
                return r.customer_id && (r.customers?.visits_count >= 10 || r.customers?.segment_auto === 'vip');
            }).length;

            // 8. OCUPACIÓN
            const totalPeople = (todayReservations || []).reduce((sum, r) => sum + (r.party_size || 0), 0);
            const occupancyPercent = totalCapacity > 0 ? Math.round((totalPeople / totalCapacity) * 100) : 0;

            // 9. VALOR GENERADO ESTA SEMANA
            const weeklySpend = (thisWeekRes || []).reduce((sum, r) => sum + (r.spend_amount || 0), 0);
            const avgTicket = restaurant?.settings?.avg_ticket || 30;
            const weeklyValue = weeklySpend > 0 ? weeklySpend : (thisWeekRes?.length || 0) * avgTicket;

            // 10. PREPARAR DATOS PARA WIDGETS DEL DASHBOARD ANTIGUO
            const noShowWidgetData = {
                weeklyPrevented: prevented,
                todayRisk: highRisk,
                successRate: todayReservations?.length > 0 ? Math.round(((todayReservations.length - highRisk) / todayReservations.length) * 100) : 100,
                riskLevel: highRisk > 3 ? 'high' : highRisk > 1 ? 'medium' : 'low',
                nextAction: highRisk > 0 ? 'Enviar recordatorio a reservas de riesgo' : null,
                avgTicket
            };

            const returningCustomersData = {
                vipCount: vipCustomers,
                returningCount: returningCustomers,
                newCount: newCustomers,
                avgTicket
            };

            const totalValueData = {
                weeklyValue,
                noShowsPrevented: prevented,
                avgTicket,
                noShowsRecovered: prevented * avgTicket,
                crmGenerated: 0, // Se calculará con datos reales del CRM
                automationSavings: 0 // Se calculará con datos reales
            };

            const crmOpportunitiesData = {
                opportunities: crmAlerts || [],
                totalPending: (crmAlerts || []).length
            };

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
                totalCapacity,
                weeklyValue,
                noShowWidgetData,
                returningCustomersData,
                totalValueData,
                crmOpportunitiesData
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

    // Escuchar cambios en el restaurant desde Configuración
    useEffect(() => {
        const handleRestaurantUpdate = async (event) => {
            console.log('🔄 Dashboard: Recibiendo evento restaurant-updated');
            const updatedRestaurant = event.detail?.restaurant;
            
            if (updatedRestaurant) {
                console.log('✅ Dashboard: Actualizando con nuevo restaurant');
                setRestaurantCache(updatedRestaurant);
                setRefreshTrigger(prev => prev + 1); // Forzar re-render
                toast.success('Avatar actualizado');
            }
        };

        window.addEventListener('restaurant-updated', handleRestaurantUpdate);

        return () => {
            window.removeEventListener('restaurant-updated', handleRestaurantUpdate);
        };
    }, []);

    // Sincronizar cuando cambie el restaurant del contexto
    useEffect(() => {
        if (restaurant) {
            setRestaurantCache(restaurant);
        }
    }, [restaurant]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Cargando datos...</p>
                </div>
            </div>
        );
    }

    // Usar restaurantCache para asegurar reactividad
    const agentSettings = restaurantCache?.settings?.agent || {};
    const agentName = agentSettings.name || 'Sofia';
    const agentAvatar = agentSettings.avatar_url || null;
    const contactName = restaurantCache?.settings?.contact_name || user?.email?.split('@')[0] || 'Jefe';

    // Calcular comparativas
    const vsYesterday = dashboardData.reservationsToday - dashboardData.yesterdayReservations;
    const vsLastWeek = dashboardData.thisWeekReservations - dashboardData.lastWeekReservations;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* ====================================
                    BANNER: AGENTE DESACTIVADO
                ==================================== */}
                {!restaurantCache?.settings?.agent?.enabled && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 mb-6 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-amber-900 mb-2">
                                    ⚠️ Tu agente IA está desactivado
                                </h3>
                                <p className="text-amber-800 mb-4">
                                    <strong>{agentName}</strong> no está respondiendo a tus clientes en WhatsApp, teléfono, Instagram ni otros canales. 
                                    Las reservas manuales desde aquí siguen funcionando, pero tus clientes no reciben respuestas automáticas.
                                </p>
                                <button
                                    onClick={() => navigate('/configuracion?tab=agent')}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center gap-2"
                                >
                                    <Bot className="w-5 h-5" />
                                    Activar agente ahora
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====================================
                    ENCABEZADO CON ESTILO CORPORATIVO
                ==================================== */}
                <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-white rounded-xl shadow-sm border border-purple-100 p-4 md:p-8 mb-4 md:mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        {/* Avatar más grande con degradado corporativo */}
                        <div className="flex-shrink-0">
                            <div className="w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 flex items-center justify-center shadow-lg ring-4 ring-purple-100">
                                {agentAvatar ? (
                                    <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
                                ) : (
                                    <Bot className="w-28 h-28 text-white opacity-80" />
                                )}
                            </div>
                        </div>

                        {/* Información */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                {format(new Date(), 'HH') < 12 ? 'Buenos días' : format(new Date(), 'HH') < 20 ? 'Buenas tardes' : 'Buenas noches'}, {contactName}
                            </h1>
                            <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                                Aquí tienes los datos más importantes del día para tu restaurante
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-xs md:text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium capitalize">
                                        {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Actualizado: {format(lastUpdate, 'HH:mm')}</span>
                                </div>
                                <button
                                    onClick={loadDashboardData}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====================================
                    GRID DE MÉTRICAS - DISEÑO PROFESIONAL
                ==================================== */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                    
                    {/* MÉTRICA 1: Reservas de Hoy */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col hover:shadow-lg transition-all">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Reservas de Hoy</p>
                                    <h3 className="text-4xl font-bold text-gray-900">{dashboardData.reservationsToday}</h3>
                                </div>
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                                {vsYesterday >= 0 ? (
                                    <><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-green-600 font-medium">+{vsYesterday} vs ayer</span></>
                                ) : (
                                    <><TrendingDown className="w-4 h-4 text-red-600" /><span className="text-red-600 font-medium">{vsYesterday} vs ayer</span></>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/reservas', { state: { filterToday: true } })}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                            >
                                Ver reservas de hoy
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* MÉTRICA 2: Ocupación */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col hover:shadow-lg transition-all">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Ocupación Hoy</p>
                                    <h3 className="text-4xl font-bold text-gray-900">{dashboardData.occupancyPercent}%</h3>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Target className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                                    <span>{dashboardData.occupiedSeats} personas</span>
                                    <span>{dashboardData.totalCapacity} capacidad</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(dashboardData.occupancyPercent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/mesas')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                            >
                                Gestionar mesas
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* MÉTRICA 3: Clientes de Hoy */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col hover:shadow-lg transition-all">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Clientes de Hoy</p>
                                    <h3 className="text-4xl font-bold text-gray-900">
                                        {dashboardData.newCustomers + dashboardData.returningCustomers + dashboardData.vipCustomers}
                                    </h3>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-gray-100 rounded p-2 text-center">
                                    <div className="text-xl font-bold text-gray-900">{dashboardData.newCustomers}</div>
                                    <div className="text-xs text-gray-600">Nuevos</div>
                                </div>
                                <div className="bg-gray-100 rounded p-2 text-center">
                                    <div className="text-xl font-bold text-gray-900">{dashboardData.returningCustomers}</div>
                                    <div className="text-xs text-gray-600">Habituales</div>
                                </div>
                                <div className="bg-gray-900 rounded p-2 text-center">
                                    <div className="text-xl font-bold text-white">{dashboardData.vipCustomers}</div>
                                    <div className="text-xs text-gray-300">VIP</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/clientes', { state: { filterToday: true } })}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                            >
                                Ver clientes de hoy
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Segunda fila de métricas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    
                    {/* No-Shows */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Alertas No-Show</p>
                                    <h3 className="text-4xl font-bold text-gray-900">{dashboardData.noShowsRisk}</h3>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-gray-400" />
                            </div>
                            
                            {dashboardData.noShowsRisk > 0 ? (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <p className="text-xs text-red-800 font-medium">⚠️ Reservas de riesgo detectadas</p>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded p-3">
                                    <p className="text-xs text-green-800 font-medium">✓ Sin riesgo detectado</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/no-shows')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                            >
                                {dashboardData.noShowsRisk > 0 ? 'Ver alertas' : 'Ver historial'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Esta Semana */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Esta Semana</p>
                                    <h3 className="text-4xl font-bold text-gray-900">{dashboardData.thisWeekReservations}</h3>
                                </div>
                                <TrendingUp className="w-8 h-8 text-gray-400" />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    {vsLastWeek >= 0 ? (
                                        <><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-green-600 font-medium">+{vsLastWeek} vs sem. pasada</span></>
                                    ) : (
                                        <><TrendingDown className="w-4 h-4 text-red-600" /><span className="text-red-600 font-medium">{vsLastWeek} vs sem. pasada</span></>
                                    )}
                                </div>

                                <div className="bg-gray-100 rounded p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600 font-medium">Valor generado:</span>
                                        <span className="text-lg font-bold text-gray-900">{dashboardData.weeklyValue.toFixed(0)}€</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/reservas', { state: { filterWeek: true } })}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                            >
                                Ver reservas de la semana
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Acciones CRM */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Acciones CRM</p>
                                    <h3 className="text-4xl font-bold text-gray-900">{dashboardData.pendingCRMAlerts}</h3>
                                </div>
                                <MessageSquare className="w-8 h-8 text-gray-400" />
                            </div>
                            
                            <div className="bg-gray-100 rounded p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 font-medium">Alertas pendientes</span>
                                    <span className="text-lg font-bold text-gray-900">{dashboardData.pendingCRMAlerts}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/crm-inteligente')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                            >
                                {dashboardData.pendingCRMAlerts > 0 ? 'Ejecutar CRM IA' : 'Ver CRM IA'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* ====================================
                    WIDGETS ADICIONALES
                ==================================== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                    <NoShowWidget 
                        data={dashboardData.noShowWidgetData} 
                        onViewDetails={() => navigate('/no-shows')} 
                    />
                    <ReturningCustomersWidget 
                        data={dashboardData.returningCustomersData} 
                    />
                </div>

                {/* ====================================
                    ROI DE LA APLICACIÓN
                ==================================== */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md border-2 border-green-200 p-6 mb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-600 rounded-lg p-3">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">ROI de la Aplicación</h3>
                                <p className="text-sm text-gray-600">Valor generado esta semana</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-green-700">{dashboardData.weeklyValue.toFixed(0)}€</div>
                            <div className="text-xs text-gray-600 mt-1">
                                {vsLastWeek >= 0 ? (
                                    <span className="text-green-600 font-medium">↑ +{vsLastWeek} reservas vs sem. pasada</span>
                                ) : (
                                    <span className="text-red-600 font-medium">↓ {vsLastWeek} reservas vs sem. pasada</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Ticket Medio */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-gray-700 uppercase">Ticket Medio</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {dashboardData.thisWeekReservations > 0 
                                    ? (dashboardData.weeklyValue / dashboardData.thisWeekReservations).toFixed(2) 
                                    : '0.00'}€
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Por reserva</p>
                        </div>

                        {/* Reservas Gestionadas */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-gray-700 uppercase">Reservas Gestionadas</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{dashboardData.thisWeekReservations}</div>
                            <p className="text-xs text-gray-600 mt-1">Esta semana</p>
                        </div>

                        {/* Ocupación Promedio */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-gray-700 uppercase">Ocupación Promedio</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{dashboardData.occupancyPercent}%</div>
                            <p className="text-xs text-gray-600 mt-1">Hoy</p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-xs text-gray-600 text-center">
                            💡 <strong>Cálculo:</strong> Ticket medio (30€) × Reservas gestionadas esta semana
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

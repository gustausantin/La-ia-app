// Dashboard.jsx - DATOS 100% REALES de Supabase
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, getHours, startOfDay, endOfDay } from "date-fns";
import toast from "react-hot-toast";
import {
    Activity,
    Users,
    MessageSquare,
    Calendar,
    TrendingUp,
    Clock,
    BarChart3,
    RefreshCw,
    Zap,
    Settings,
    CheckCircle,
    AlertCircle,
    Database
} from "lucide-react";

// Logger básico
const logger = {
    info: (msg, data) => console.log(`ℹ️ ${msg}`, data),
    error: (msg, error) => console.error(`❌ ${msg}`, error),
    warn: (msg, data) => console.warn(`⚠️ ${msg}`, data)
};

// Spinner de carga
const DashboardSpinner = ({ text = "Cargando..." }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{text}</p>
        </div>
    </div>
);

// Componente principal del Dashboard
export default function Dashboard() {
    const { status, isAuthenticated, restaurant } = useAuthContext();
    const navigate = useNavigate();

    // Estados para datos REALES
    const [realData, setRealData] = useState({
        // Datos de reservas
        totalReservationsToday: 0,
        totalReservationsThisWeek: 0,
        reservationsByHour: {},
        peakHour: null,
        averagePartySize: 0,
        
        // Datos de mesas
        totalTables: 0,
        totalCapacity: 0,
        currentOccupancyRate: 0,
        
        // Datos de canales
        activeChannels: 0,
        channelsList: [],
        
        // Datos de clientes
        totalCustomers: 0,
        newCustomersToday: 0,
        
        // Datos del agente IA
        agentReservations: 0, // Por ahora 0 hasta conectar APIs externas
        agentConversions: 0,
        averageResponseTime: 0
    });

    const [todayReservations, setTodayReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    logger.info('📊 Dashboard iniciando con datos reales...', { status, isAuthenticated });

    // Mostrar loading mientras se inicializa
    if (status === 'checking') {
        return <DashboardSpinner text="Inicializando sistema..." />;
    }

    const restaurantId = restaurant?.id;

    // Función para calcular la hora punta REAL
    const calculatePeakHour = (reservations) => {
        if (!reservations || reservations.length === 0) return null;
        
        const hourCounts = {};
        reservations.forEach(reservation => {
            if (reservation.reservation_time) {
                const hour = getHours(parseISO(`2000-01-01T${reservation.reservation_time}`));
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });

        if (Object.keys(hourCounts).length === 0) return null;
        
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        
        return `${peakHour}h`;
    };

    // Función para obtener canales REALES configurados
    const fetchRealChannels = useCallback(async () => {
        if (!restaurantId) return { count: 0, list: [] };

        try {
            const { data: channels, error } = await supabase
                .from('channel_credentials')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true);

            if (error) {
                logger.warn("Error cargando canales:", error);
                return { count: 0, list: [] };
            }

            const channelsList = channels || [];
            logger.info('✅ Canales reales cargados:', channelsList);
            
            return {
                count: channelsList.length,
                list: channelsList.map(ch => ch.channel)
            };
        } catch (error) {
            logger.error("Error fetching channels:", error);
            return { count: 0, list: [] };
        }
    }, [restaurantId]);

    // Función para obtener datos REALES de reservas
    const fetchRealReservations = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const startOfWeek = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
            
            // Reservas de hoy
            const { data: todayReservations, error: todayError } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('reservation_date', today)
                .order('reservation_time', { ascending: true });

            if (todayError) {
                logger.warn("Error cargando reservas de hoy:", todayError);
            }

            // Reservas de la semana
            const { data: weekReservations, error: weekError } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', startOfWeek)
                .lte('reservation_date', today);

            if (weekError) {
                logger.warn("Error cargando reservas de la semana:", weekError);
            }

            const reservationsToday = todayReservations || [];
            const reservationsWeek = weekReservations || [];

            // Calcular hora punta REAL
            const peakHour = calculatePeakHour(reservationsWeek);
            
            // Calcular tamaño promedio de grupo REAL
            const totalPartySize = reservationsToday.reduce((sum, r) => sum + (r.party_size || 0), 0);
            const averagePartySize = reservationsToday.length > 0 ? 
                Math.round(totalPartySize / reservationsToday.length * 10) / 10 : 0;

            setTodayReservations(reservationsToday);

            return {
                totalReservationsToday: reservationsToday.length,
                totalReservationsThisWeek: reservationsWeek.length,
                peakHour: peakHour,
                averagePartySize: averagePartySize,
                reservationsData: reservationsToday
            };
        } catch (error) {
            logger.error("Error fetching reservations:", error);
            return {
                totalReservationsToday: 0,
                totalReservationsThisWeek: 0,
                peakHour: null,
                averagePartySize: 0,
                reservationsData: []
            };
        }
    }, [restaurantId]);

    // Función para obtener datos REALES de mesas
    const fetchRealTables = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const { data: tables, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (error) {
                logger.warn("Error cargando mesas:", error);
                return { totalTables: 0, totalCapacity: 0 };
            }

            const tablesList = tables || [];
            const totalCapacity = tablesList.reduce((sum, table) => sum + (table.capacity || 0), 0);

            return {
                totalTables: tablesList.length,
                totalCapacity: totalCapacity
            };
        } catch (error) {
            logger.error("Error fetching tables:", error);
            return { totalTables: 0, totalCapacity: 0 };
        }
    }, [restaurantId]);

    // Función para obtener datos REALES de clientes
    const fetchRealCustomers = useCallback(async () => {
        if (!restaurantId) return;

        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            
            // Total de clientes
            const { data: allCustomers, error: allError } = await supabase
                .from('customers')
                .select('id')
                .eq('restaurant_id', restaurantId);

            // Clientes nuevos hoy
            const { data: newCustomers, error: newError } = await supabase
                .from('customers')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59`);

            if (allError || newError) {
                logger.warn("Error cargando clientes:", allError || newError);
            }

            return {
                totalCustomers: allCustomers?.length || 0,
                newCustomersToday: newCustomers?.length || 0
            };
        } catch (error) {
            logger.error("Error fetching customers:", error);
            return { totalCustomers: 0, newCustomersToday: 0 };
        }
    }, [restaurantId]);

    // Función principal para cargar TODOS los datos reales
    const loadRealData = useCallback(async () => {
        setIsLoading(true);
        try {
            logger.info('🔄 Cargando datos reales del dashboard...');

            const [reservationsData, tablesData, customersData, channelsData] = await Promise.all([
                fetchRealReservations(),
                fetchRealTables(),
                fetchRealCustomers(),
                fetchRealChannels()
            ]);

            // Calcular ocupación REAL
            const currentOccupancyRate = tablesData.totalTables > 0 ? 
                Math.round((reservationsData.totalReservationsToday / tablesData.totalTables) * 100) : 0;

            const newRealData = {
                // Reservas REALES
                totalReservationsToday: reservationsData.totalReservationsToday,
                totalReservationsThisWeek: reservationsData.totalReservationsThisWeek,
                peakHour: reservationsData.peakHour,
                averagePartySize: reservationsData.averagePartySize,
                
                // Mesas REALES
                totalTables: tablesData.totalTables,
                totalCapacity: tablesData.totalCapacity,
                currentOccupancyRate: Math.min(currentOccupancyRate, 100),
                
                // Canales REALES
                activeChannels: channelsData.count,
                channelsList: channelsData.list,
                
                // Clientes REALES
                totalCustomers: customersData.totalCustomers,
                newCustomersToday: customersData.newCustomersToday,
                
                // Agente IA (REALES - por ahora 0 hasta conectar APIs)
                agentReservations: 0,
                agentConversions: 0,
                averageResponseTime: 0
            };

            setRealData(newRealData);
            setLastUpdate(new Date());
            
            logger.info('✅ Datos reales cargados exitosamente:', newRealData);
        } catch (error) {
            logger.error("Error loading real data:", error);
            toast.error("Error cargando datos del dashboard");
        } finally {
            setIsLoading(false);
        }
    }, [fetchRealReservations, fetchRealTables, fetchRealCustomers, fetchRealChannels]);

    // Función de refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadRealData();
            toast.success("Dashboard actualizado con datos reales");
        } catch (error) {
            logger.error("Error refreshing:", error);
            toast.error("Error al actualizar");
        } finally {
            setRefreshing(false);
        }
    }, [loadRealData]);

    // Cargar datos iniciales
    useEffect(() => {
        if (restaurantId) {
            loadRealData();
        }
    }, [restaurantId, loadRealData]);

    // Si está cargando
    if (isLoading) {
        return <DashboardSpinner text="Cargando datos reales..." />;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard - {restaurant?.name || 'Tu Restaurante'}
                    </h1>
                    <p className="text-gray-600">
                        {format(new Date(), "EEEE dd 'de' MMMM, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                        Última actualización: {format(lastUpdate, 'HH:mm:ss')} - 
                        <span className="text-green-600 ml-1">
                            <Database className="w-4 h-4 inline mr-1" />
                            Datos reales de Supabase
                        </span>
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar Datos
                </button>
            </div>

            {/* Rendimiento del Agente IA - DATOS REALES */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-600 rounded-lg">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Rendimiento del Agente IA</h2>
                        <p className="text-sm text-gray-600">Datos reales • Sin conexiones externas aún</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Reservas del Agente IA - REAL */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Reservas del Agente IA</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{realData.agentReservations}</div>
                        <div className="text-xs text-gray-500 mt-1">APIs externas no conectadas</div>
                        <div className="text-xs text-orange-500 mt-1">⚡ Pendiente configuración</div>
                    </div>

                    {/* Tasa de Conversión - REAL */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Tasa de Conversión</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">{realData.agentConversions}%</div>
                        <div className="text-xs text-gray-500 mt-1">Sin conversaciones IA aún</div>
                        <div className="text-xs text-orange-500 mt-1">📊 Pendiente conexión</div>
                    </div>

                    {/* Tiempo de Respuesta - REAL */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700">Tiempo de Respuesta</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{realData.averageResponseTime}s</div>
                        <div className="text-xs text-gray-500 mt-1">Sin datos de respuesta aún</div>
                        <div className="text-xs text-orange-500 mt-1">⚡ Pendiente activación</div>
                    </div>

                    {/* Canales Activos - DATOS REALES */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Canales Configurados</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{realData.activeChannels}/6</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {realData.channelsList.length > 0 ? 
                                `Activos: ${realData.channelsList.join(', ')}` : 
                                'Ningún canal configurado'
                            }
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                            <button 
                                onClick={() => navigate('/configuracion?tab=channels')}
                                className="hover:underline"
                            >
                                ⚙️ Configurar canales
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget CRM eliminado según solicitud del usuario */}

            {/* Estadísticas del Restaurante - DATOS REALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Reservas HOY - REAL */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Reservas Hoy</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{realData.totalReservationsToday}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {realData.averagePartySize > 0 ? 
                            `Promedio: ${realData.averagePartySize} personas/reserva` : 
                            'Sin reservas hoy'
                        }
                    </div>
                </div>

                {/* Reservas Esta Semana - REAL */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Esta Semana</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{realData.totalReservationsThisWeek}</div>
                    <div className="text-xs text-gray-500 mt-1">Últimos 7 días</div>
                </div>

                {/* Clientes - DATOS REALES */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Base de Clientes</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{realData.totalCustomers}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {realData.newCustomersToday > 0 ? 
                            `+${realData.newCustomersToday} nuevos hoy` : 
                            'Sin clientes nuevos hoy'
                        }
                    </div>
                </div>

                {/* Hora Punta - CALCULADA REAL */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Hora Punta</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                        {realData.peakHour || '--'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {realData.peakHour ? 
                            'Calculado de reservas reales' : 
                            'Sin datos suficientes'
                        }
                    </div>
                </div>
            </div>

            {/* Ocupación y Mesas - DATOS REALES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Ocupación - REAL */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Ocupación Hoy</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{realData.currentOccupancyRate}%</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {realData.totalReservationsToday}/{realData.totalTables} mesas reservadas
                    </div>
                </div>

                {/* Mesas Configuradas - REAL */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Mesas Configuradas</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{realData.totalTables}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Capacidad total: {realData.totalCapacity} personas
                    </div>
                    {realData.totalTables === 0 && (
                        <div className="text-xs text-orange-500 mt-1">
                            <button 
                                onClick={() => navigate('/mesas')}
                                className="hover:underline"
                            >
                                ⚙️ Configurar mesas
                            </button>
                        </div>
                    )}
                </div>

                {/* Estado del Sistema - REAL */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Estado del Sistema</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">Operativo</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Base interna funcionando
                    </div>
                </div>
            </div>

            {/* Reservas de Hoy - DATOS REALES */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Reservas de Hoy</h3>
                    <button
                        onClick={() => navigate("/reservas")}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                        Ver todas →
                    </button>
                </div>

                {todayReservations.length > 0 ? (
                    <div className="space-y-3">
                        {todayReservations.map((reservation) => (
                            <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{reservation.customer_name}</div>
                                        <div className="text-sm text-gray-500">
                                            {reservation.reservation_time} • {reservation.party_size} personas
                                            {reservation.table_number && ` • Mesa ${reservation.table_number}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                        reservation.status === 'confirmed' 
                                            ? 'bg-green-100 text-green-800'
                                            : reservation.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {reservation.status === 'confirmed' ? 'Confirmada' : 
                                         reservation.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No hay reservas para hoy</p>
                        <button
                            onClick={() => navigate("/reservas")}
                            className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                            Crear nueva reserva
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

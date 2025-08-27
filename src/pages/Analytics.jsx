// Analytics Simple - Versión que funciona garantizada
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    Users,
    MessageSquare,
    Activity,
    RefreshCw,
} from "lucide-react";

export default function Analytics() {
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalConversations: 0,
        successfulBookings: 0,
        conversionRate: 0,
        avgResponseTime: 0,
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (isReady && restaurantId) {
            loadAnalytics();
        }
    }, [isReady, restaurantId]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            // Cargar métricas básicas
            const { data: metricsData, error: metricsError } = await supabase
                .from('agent_metrics')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('date', { ascending: false })
                .limit(7);

            if (metricsError) {
                console.error('Error loading metrics:', metricsError);
                return;
            }

            if (metricsData && metricsData.length > 0) {
                // Calcular totales
                const totals = metricsData.reduce((acc, day) => ({
                    totalConversations: acc.totalConversations + (day.total_conversations || 0),
                    successfulBookings: acc.successfulBookings + (day.successful_bookings || 0),
                    avgResponseTime: acc.avgResponseTime + (day.avg_response_time || 0),
                }), { totalConversations: 0, successfulBookings: 0, avgResponseTime: 0 });

                const conversionRate = totals.totalConversations > 0 
                    ? (totals.successfulBookings / totals.totalConversations * 100) 
                    : 0;

                setMetrics({
                    totalConversations: totals.totalConversations,
                    successfulBookings: totals.successfulBookings,
                    conversionRate: Math.round(conversionRate * 10) / 10,
                    avgResponseTime: Math.round(totals.avgResponseTime / metricsData.length * 10) / 10,
                });

                // Preparar datos para gráfico
                const chartData = metricsData.reverse().map(day => ({
                    date: new Date(day.date).toLocaleDateString('es-ES', { 
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    conversaciones: day.total_conversations || 0,
                    reservas: day.successful_bookings || 0,
                }));

                setChartData(chartData);
            }

        } catch (error) {
            console.error('Error in loadAnalytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isReady || loading) {
        return (
            <div className="min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">
                        Cargando Analytics...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600">Rendimiento de tu agente IA</p>
                </div>
                <button
                    onClick={loadAnalytics}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                </button>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Conversaciones</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.totalConversations}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Reservas Exitosas</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.successfulBookings}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.conversionRate}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.avgResponseTime}s</p>
                        </div>
                        <Activity className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Gráfico de conversaciones */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Conversaciones y Reservas (Últimos 7 días)
                </h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="conversaciones" fill="#3B82F6" name="Conversaciones" />
                            <Bar dataKey="reservas" fill="#10B981" name="Reservas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Estado del restaurant */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Restaurant</h3>
                <div className="space-y-2">
                    <p><span className="font-medium">Nombre:</span> {restaurant?.name || 'Mi Restaurante'}</p>
                    <p><span className="font-medium">ID:</span> {restaurantId}</p>
                    <p><span className="font-medium">Estado:</span> 
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Activo
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

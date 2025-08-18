
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

function Analytics() {
    const { restaurantId } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReservations: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        avgPartySize: 0
    });

    useEffect(() => {
        // Simular carga de datos
        setTimeout(() => {
            setStats({
                totalReservations: 156,
                totalRevenue: 12350,
                totalCustomers: 89,
                avgPartySize: 3.2
            });
            setLoading(false);
        }, 1000);
    }, [restaurantId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <BarChart3 className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-purple-600" />
                    Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                    Análisis y métricas de tu restaurante
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+12% vs mes anterior</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Ingresos</p>
                            <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+8% vs mes anterior</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Clientes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+15% vs mes anterior</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Promedio por Mesa</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.avgPartySize}</p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+5% vs mes anterior</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Reservas por Día
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Gráfico en desarrollo</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Ingresos Mensuales
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Gráfico en desarrollo</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analytics;

import React from 'react';
import { BarChart3, Users, Clock, DollarSign, TrendingUp, Award } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const OccupancyMetrics = ({ metrics, date, totalReservations }) => {
    if (!metrics) return null;

    const formattedDate = format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });

    return (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Dashboard de Ocupación
            </h2>
            <p className="text-purple-100 text-xs mb-3 capitalize">{formattedDate}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Tasa de Ocupación */}
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors">
                    <div>
                        <p className="text-xs text-purple-100">Ocupación</p>
                        <p className="text-lg font-bold">{metrics.occupancyRate}%</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-purple-200" />
                </div>

                {/* Slots Reservados */}
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors">
                    <div>
                        <p className="text-xs text-purple-100">Reservados</p>
                        <p className="text-lg font-bold">{metrics.reservedSlots}</p>
                        <p className="text-xs text-purple-200">de {metrics.totalSlots} slots</p>
                    </div>
                    <Users className="w-5 h-5 text-purple-200" />
                </div>

                {/* Hora Pico */}
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors">
                    <div>
                        <p className="text-xs text-purple-100">Hora Pico</p>
                        <p className="text-lg font-bold">{metrics.peakHour}</p>
                    </div>
                    <Clock className="w-5 h-5 text-purple-200" />
                </div>

                {/* Revenue Estimado */}
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors">
                    <div>
                        <p className="text-xs text-purple-100">Revenue Est.</p>
                        <p className="text-lg font-bold">{metrics.estimatedRevenue}€</p>
                    </div>
                    <DollarSign className="w-5 h-5 text-purple-200" />
                </div>

                {/* Top Mesa */}
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors">
                    <div>
                        <p className="text-xs text-purple-100">Top Mesa</p>
                        <p className="text-base font-bold truncate">
                            {metrics.tableStats?.[0]?.tableName || 'N/A'}
                        </p>
                        <p className="text-xs text-purple-200">
                            {metrics.tableStats?.[0]?.occupancyRate?.toFixed(0) || '0'}% ocupada
                        </p>
                    </div>
                    <Award className="w-5 h-5 text-purple-200" />
                </div>
            </div>

            {/* Insight Placeholder */}
            <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1 text-xs">💡 Insight IA</h4>
                        <p className="text-xs text-purple-100">
                            {metrics.occupancyRate > 80 
                                ? "🔥 Alta ocupación detectada. Considera activar overbooking controlado para maximizar ingresos."
                                : metrics.occupancyRate > 50
                                ? "📊 Ocupación moderada. Buen momento para campañas de captación."
                                : "⚠️ Ocupación baja. Recomendamos estrategias de marketing para aumentar reservas."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

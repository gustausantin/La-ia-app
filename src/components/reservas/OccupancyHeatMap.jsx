import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Table, Users, MapPin, Info } from 'lucide-react';

export const OccupancyHeatMap = ({ occupancyData, loading, onSlotClick }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
                </div>
                <p className="text-gray-500 mt-4">Cargando mapa de ocupación...</p>
            </div>
        );
    }

    if (!occupancyData || occupancyData.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                <Table className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No hay datos de ocupación para la fecha seleccionada</p>
                <p className="text-gray-400 text-sm mt-2">
                    Asegúrate de que existen slots de disponibilidad generados para este día.
                </p>
            </div>
        );
    }

    // Determinar el rango de horarios
    const allSlots = occupancyData.flatMap(table => table.slots);
    const timeSlots = useMemo(() => {
        if (allSlots.length === 0) return [];

        const times = new Set();
        allSlots.forEach(slot => {
            times.add(format(new Date(`2000-01-01T${slot.start_time}`), 'HH:mm'));
        });

        return Array.from(times).sort();
    }, [allSlots]);

    const getSlotStatusClass = (slot) => {
        if (!slot) return 'bg-gray-100 border-gray-200';
        if (slot.status === 'reserved') return 'bg-red-500 text-white border-red-600 hover:bg-red-600';
        if (slot.status === 'free') return 'bg-green-500 text-white border-green-600 hover:bg-green-600';
        if (slot.status === 'occupied') return 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600';
        return 'bg-gray-300 border-gray-400';
    };

    const getSlotContent = (slot) => {
        if (!slot) return '';
        if (slot.status === 'reserved' && slot.reservation_info) {
            const firstName = slot.reservation_info.customer_name.split(' ')[0];
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-xs font-semibold truncate max-w-full px-1">
                        {firstName}
                    </span>
                    <span className="text-[10px] opacity-90">
                        ({slot.reservation_info.party_size}p)
                    </span>
                </div>
            );
        }
        return '';
    };

    const getSlotTooltip = (slot) => {
        if (!slot) return 'Slot no disponible';
        if (slot.status === 'reserved' && slot.reservation_info) {
            return `🔴 RESERVADO\n${slot.reservation_info.customer_name} (${slot.reservation_info.party_size} personas)\nEstado: ${slot.reservation_info.status}\n${slot.reservation_info.special_requests ? `Solicitudes: ${slot.reservation_info.special_requests}` : ''}`;
        }
        if (slot.status === 'free') return '🟢 LIBRE - Disponible para reservar';
        if (slot.status === 'occupied') return '🟡 OCUPADO - Reservado manualmente';
        return 'Slot no disponible';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Table className="w-5 h-5 text-purple-600" />
                    Mapa de Ocupación por Mesas
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                        Libre
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                        Reservado
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-yellow-500 rounded-sm"></span>
                        Ocupado
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-gray-200 rounded-sm"></span>
                        No disponible
                    </span>
                </p>
            </div>

            {/* Heat Map Table */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                    <div className="shadow-sm overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th 
                                        scope="col" 
                                        className="sticky left-0 z-20 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100 border-r border-gray-300"
                                    >
                                        Mesa / Zona
                                    </th>
                                    {timeSlots.map(time => (
                                        <th 
                                            key={time} 
                                            scope="col" 
                                            className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]"
                                        >
                                            {time}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {occupancyData.map((table, idx) => (
                                    <tr 
                                        key={table.table_id}
                                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                    >
                                        <td className="sticky left-0 z-10 px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 bg-inherit border-r border-gray-200">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-purple-600" />
                                                    <span className="font-bold">{table.table_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <MapPin className="w-3 h-3 text-blue-500" />
                                                    <span>{table.table_zone}</span>
                                                    <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                        {table.table_capacity}p
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        {timeSlots.map(time => {
                                            const slot = table.slots.find(
                                                s => format(new Date(`2000-01-01T${s.start_time}`), 'HH:mm') === time
                                            );
                                            return (
                                                <td
                                                    key={time}
                                                    className={`relative px-1 py-1 text-center cursor-pointer transition-all duration-150 border border-gray-200 ${
                                                        getSlotStatusClass(slot)
                                                    }`}
                                                    onClick={() => onSlotClick && onSlotClick({ slot, table, time })}
                                                    title={getSlotTooltip(slot)}
                                                >
                                                    <div className="min-h-[50px] flex items-center justify-center text-xs font-semibold">
                                                        {getSlotContent(slot)}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                    <span className="font-semibold">Tip:</span> Haz clic en cualquier slot para ver más detalles o realizar acciones. 
                    Los slots en <span className="font-bold text-red-600">rojo</span> están reservados, 
                    los <span className="font-bold text-green-600">verdes</span> están libres y listos para reservar.
                </p>
            </div>
        </div>
    );
};

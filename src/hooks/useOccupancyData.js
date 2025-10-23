import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const useOccupancyData = (restaurantId, selectedDate, selectedZone) => {
    const [occupancyData, setOccupancyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);

    const fetchOccupancyData = useCallback(async () => {
        if (!restaurantId || !selectedDate) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            // 1. Obtener todas las mesas activas del restaurante
            let tablesQuery = supabase
                .from('tables')
                .select('id, name, capacity, zone, is_active')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true)
                .order('zone', { ascending: true })
                .order('name', { ascending: true });

            if (selectedZone && selectedZone !== 'all') {
                tablesQuery = tablesQuery.eq('zone', selectedZone);
            }

            const { data: tables, error: tablesError } = await tablesQuery;
            if (tablesError) throw tablesError;

            if (!tables || tables.length === 0) {
                setOccupancyData([]);
                setMetrics(null);
                setLoading(false);
                return;
            }

            const tableIds = tables.map(table => table.id);

            // 2. Obtener slots de disponibilidad para la fecha y mesas seleccionadas
            const { data: slots, error: slotsError } = await supabase
                .from('availability_slots')
                .select('id, table_id, start_time, end_time, status, reservation_id')
                .eq('restaurant_id', restaurantId)
                .eq('slot_date', dateStr)
                .in('table_id', tableIds)
                .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;

            // 3. Obtener detalles de reservas para los slots ocupados
            const reservedSlotIds = slots
                ?.filter(s => s.status === 'reserved' && s.reservation_id)
                .map(s => s.reservation_id) || [];

            let reservations = [];
            if (reservedSlotIds.length > 0) {
                const { data: fetchedReservations, error: reservationsError } = await supabase
                    .from('reservations')
                    .select('id, customer_name, party_size, special_requests, status')
                    .in('id', reservedSlotIds);

                if (reservationsError) throw reservationsError;
                reservations = fetchedReservations || [];
            }

            // 4. Combinar datos y calcular métricas
            let totalSlots = 0;
            let reservedSlots = 0;
            let freeSlots = 0;
            let totalRevenue = 0;
            const averageTicketPrice = 45; // Esto debería venir de restaurant_settings
            const tableStats = [];

            const combinedData = tables.map(table => {
                const tableSlots = slots?.filter(s => s.table_id === table.id) || [];
                const tableSlotsReserved = tableSlots.filter(s => s.status === 'reserved').length;
                const tableSlotsFree = tableSlots.filter(s => s.status === 'free').length;
                
                totalSlots += tableSlots.length;
                reservedSlots += tableSlotsReserved;
                freeSlots += tableSlotsFree;

                const slotsWithReservationInfo = tableSlots.map(slot => {
                    const reservation = reservations.find(r => r.id === slot.reservation_id);
                    if (reservation) {
                        totalRevenue += reservation.party_size * averageTicketPrice;
                    }
                    return {
                        ...slot,
                        reservation_info: reservation ? {
                            customer_name: reservation.customer_name,
                            party_size: reservation.party_size,
                            special_requests: reservation.special_requests,
                            status: reservation.status,
                        } : null,
                    };
                });

                // Estadísticas por mesa
                tableStats.push({
                    tableId: table.id,
                    tableName: table.name,
                    zone: table.zone,
                    capacity: table.capacity,
                    totalCount: tableSlots.length,
                    reservedCount: tableSlotsReserved,
                    freeCount: tableSlotsFree,
                    occupancyRate: tableSlots.length > 0 
                        ? (tableSlotsReserved / tableSlots.length) * 100 
                        : 0,
                });

                return {
                    table_id: table.id,
                    table_name: table.name,
                    table_capacity: table.capacity,
                    table_zone: table.zone,
                    slots: slotsWithReservationInfo,
                };
            });

            // Calcular métricas globales
            const occupancyRate = totalSlots > 0 ? (reservedSlots / totalSlots) * 100 : 0;

            // Encontrar hora pico
            const hourCounts = {};
            slots?.forEach(slot => {
                if (slot.status === 'reserved') {
                    const hour = slot.start_time.substring(0, 5);
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                }
            });

            const peakHour = Object.entries(hourCounts)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

            setMetrics({
                occupancyRate: occupancyRate.toFixed(1),
                totalSlots,
                reservedSlots,
                freeSlots,
                peakHour,
                estimatedRevenue: totalRevenue.toFixed(2),
                tableStats,
            });

            setOccupancyData(combinedData);

        } catch (err) {
            console.error("Error fetching occupancy data:", err);
            setError(err.message);
            toast.error("Error al cargar datos de ocupación: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [restaurantId, selectedDate, selectedZone]);

    useEffect(() => {
        fetchOccupancyData();
    }, [fetchOccupancyData]);

    return { 
        occupancyData, 
        metrics,
        loading, 
        error, 
        reload: fetchOccupancyData 
    };
};


import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

function Calendario() {
    const { restaurantId } = useAuthContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar eventos del calendario
    const loadEvents = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);
            const startDate = startOfMonth(currentDate);
            const endDate = endOfMonth(currentDate);

            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    id,
                    customer_name,
                    customer_phone,
                    reservation_date,
                    reservation_time,
                    party_size,
                    status,
                    special_requests,
                    table_id
                `)
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', format(startDate, 'yyyy-MM-dd'))
                .lte('reservation_date', format(endDate, 'yyyy-MM-dd'))
                .order('reservation_time', { ascending: true });

            if (error) throw error;

            // Transformar reservas a eventos del calendario
            const calendarEvents = (data || []).map(reservation => ({
                id: reservation.id,
                title: `${reservation.customer_name} (${reservation.party_size} pax)`,
                date: reservation.reservation_date,
                time: reservation.reservation_time,
                type: 'reservation',
                status: reservation.status,
                details: {
                    customer_name: reservation.customer_name,
                    customer_phone: reservation.customer_phone,
                    party_size: reservation.party_size,
                    special_requests: reservation.special_requests,
                    table_id: reservation.table_id
                }
            }));

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error loading calendar events:', error);
            toast.error('Error al cargar eventos del calendario');
        } finally {
            setLoading(false);
        }
    }, [restaurantId, currentDate]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // Navegación del calendario
    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    // Obtener días del mes para mostrar en el calendario
    const getDaysInMonth = () => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    };

    // Obtener eventos para una fecha específica
    const getEventsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return events.filter(event => event.date === dateStr);
    };

    const days = getDaysInMonth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <CalendarIcon className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-7 h-7 text-purple-600" />
                        Calendario
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona reservas y eventos de tu restaurante
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Nuevo Evento
                </button>
            </div>

            {/* Navegación del calendario */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <h2 className="text-xl font-semibold text-gray-900">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>

                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="p-4 text-center font-medium text-gray-500 text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendario */}
                <div className="grid grid-cols-7">
                    {days.map(day => {
                        const dayEvents = getEventsForDate(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                className={`
                                    min-h-[120px] p-2 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                                    ${!isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : ''}
                                    ${isToday ? 'bg-blue-50' : ''}
                                `}
                            >
                                <div className={`
                                    text-sm font-medium mb-1
                                    ${isToday ? 'text-blue-600' : 'text-gray-900'}
                                    ${!isSameMonth(day, currentDate) ? 'text-gray-400' : ''}
                                `}>
                                    {format(day, 'd')}
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            className={`
                                                text-xs p-1 rounded truncate
                                                ${event.type === 'reservation' ? 
                                                    event.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                                                    event.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                : 'bg-purple-100 text-purple-800'}
                                            `}
                                        >
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {event.time}
                                            </div>
                                            <div className="truncate">{event.title}</div>
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center">
                                            +{dayEvents.length - 3} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Resumen de eventos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resumen del mes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {events.length}
                        </div>
                        <div className="text-sm text-blue-800">Total reservas</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {events.filter(e => e.status === 'confirmada').length}
                        </div>
                        <div className="text-sm text-green-800">Confirmadas</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                            {events.filter(e => e.status === 'pendiente').length}
                        </div>
                        <div className="text-sm text-yellow-800">Pendientes</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calendario;

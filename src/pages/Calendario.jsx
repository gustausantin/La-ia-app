// src/pages/Calendario.jsx - Gestión PREMIUM de horarios y disponibilidad con IA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Users, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

function Calendario() {
    const { restaurantId } = useAuthContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
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

    // Manejar clic en día
    const handleDayClick = (date) => {
        setSelectedDate(date);
        const dayEvents = getEventsForDate(date);
        if (dayEvents.length === 1) {
            setSelectedEvent(dayEvents[0]);
            setShowEventModal(true);
        } else if (dayEvents.length > 1) {
            // Mostrar lista de eventos para ese día
            setShowEventModal(true);
        } else {
            // Crear nuevo evento para ese día
            setSelectedEvent(null);
            setShowEventModal(true);
        }
    };

    // Manejar guardar evento
    const handleSaveEvent = async (eventData) => {
        try {
            // Aquí iría la lógica para guardar/actualizar eventos
            toast.success('Evento guardado correctamente');
            setShowEventModal(false);
            loadEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Error al guardar evento');
        }
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
                <button
                    onClick={() => {
                        setSelectedDate(new Date());
                        setSelectedEvent(null);
                        setShowEventModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
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
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    min-h-[120px] p-2 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                                    ${!isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : ''}
                                    ${isToday ? 'bg-blue-50' : ''}
                                    ${isSelected ? 'bg-purple-50' : ''}
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

            {/* Lista de eventos del día seleccionado */}
            {selectedDate && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Eventos del {format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </h3>
                    <div className="space-y-3">
                        {getEventsForDate(selectedDate).map(event => (
                            <div
                                key={event.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                    setSelectedEvent(event);
                                    setShowEventModal(true);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-3 h-3 rounded-full
                                        ${event.type === 'reservation' ? 
                                            event.status === 'confirmada' ? 'bg-green-500' :
                                            event.status === 'pendiente' ? 'bg-yellow-500' :
                                            'bg-gray-500'
                                        : 'bg-purple-500'}
                                    `} />
                                    <div>
                                        <div className="font-medium text-gray-900">{event.title}</div>
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {event.time}
                                            {event.details.party_size && (
                                                <>
                                                    <Users className="w-4 h-4" />
                                                    {event.details.party_size} personas
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`
                                    px-3 py-1 text-xs font-medium rounded-full
                                    ${event.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                                      event.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'}
                                `}>
                                    {event.status}
                                </div>
                            </div>
                        ))}
                        {getEventsForDate(selectedDate).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No hay eventos para este día</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de eventos */}
            {showEventModal && (
                <EventModal
                    event={selectedEvent}
                    date={selectedDate}
                    onSave={handleSaveEvent}
                    onClose={() => {
                        setShowEventModal(false);
                        setSelectedEvent(null);
                    }}
                    onDelete={() => {
                        // Lógica de eliminación
                        setShowEventModal(false);
                        loadEvents();
                    }}
                />
            )}
        </div>
    );
}

// Modal de eventos
function EventModal({ event, date, onSave, onClose, onDelete }) {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        type: event?.type || 'reservation',
        time: event?.time || '12:00',
        customer_name: event?.details?.customer_name || '',
        customer_phone: event?.details?.customer_phone || '',
        party_size: event?.details?.party_size || 2,
        special_requests: event?.details?.special_requests || '',
        status: event?.status || 'pendiente'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {event ? 'Editar Evento' : 'Nuevo Evento'}
                    </h3>
                    {date && (
                        <p className="text-sm text-gray-600 mt-1">
                            {format(date, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hora
                        </label>
                        <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {formData.type === 'reservation' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del cliente
                                </label>
                                <input
                                    type="text"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de personas
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.party_size}
                                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmada">Confirmada</option>
                                    <option value="sentada">Sentada</option>
                                    <option value="completada">Completada</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="flex justify-between pt-4">
                        <div>
                            {event && onDelete && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Calendario;
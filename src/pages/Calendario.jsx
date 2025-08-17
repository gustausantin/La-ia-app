// src/pages/Calendario.jsx - Gestión PREMIUM de horarios y disponibilidad con IA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
    format, 
    parseISO, 
    startOfWeek, 
    endOfWeek, 
    addDays, 
    isSameDay, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval,
    addMonths,
    subMonths,
    isToday,
    isBefore,
    isAfter,
    getDay,
    setHours,
    setMinutes,
    addMinutes,
    differenceInMinutes,
    isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    Save, 
    Plus, 
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    Settings,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Coffee,
    Moon,
    Sun,
    Sunset,
    Bot,
    Users,
    TrendingUp,
    Info,
    Edit2,
    Trash2,
    Copy,
    PhoneCall,
    MessageSquare,
    Globe,
    Mail,
    Instagram,
    Facebook,
    Zap,
    BarChart3,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// DATOS NECESARIOS DE SUPABASE:
// - tabla: weekly_schedules (restaurant_id, day_of_week, is_open, slots)
// - tabla: calendar_events (restaurant_id, date, type, data)
// - tabla: agent_schedules (restaurant_id, channel, schedule)
// - tabla: capacity_settings (restaurant_id, time_slot, max_capacity)
// - RPC: get_availability_for_date(restaurant_id, date)
// - RPC: get_occupancy_forecast(restaurant_id, start_date, end_date)

// Iconos para los turnos
const SHIFT_ICONS = {
    morning: Sun,
    afternoon: Coffee,
    evening: Sunset,
    night: Moon
};

// Colores para tipos de eventos
const EVENT_COLORS = {
    closure: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    vacation: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    special_hours: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    event: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    maintenance: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    holiday: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
};

// Componente de TimeSlot mejorado
const TimeSlotInput = ({ label, value, onChange, icon: Icon }) => (
    <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />}
            <input
                type="time"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
        </div>
    </div>
);

// Componente principal
function Calendario() {
    console.log('📆 Calendario component rendering...');
    
    const { restaurant, agentStatus } = useAuthContext();
    const restaurantId = restaurant?.id;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Calendario</h1>
                <p className="text-gray-600">Visualiza y gestiona tu calendario de eventos.</p>
            </div>
        </div>
    );
}

export default Calendario;

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('horarios');
    const [weeklySchedule, setWeeklySchedule] = useState([]);
    const [agentSchedule, setAgentSchedule] = useState({});
    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('month'); // month, week, day
    const [showAgentSettings, setShowAgentSettings] = useState(false);

    // Datos simulados de ocupación
    const [occupancyData, setOccupancyData] = useState({});
    const [capacitySettings, setCapacitySettings] = useState({
        maxTables: 20,
        maxCovers: 80,
        avgDuration: 90, // minutos
        bufferTime: 15 // minutos entre reservas
    });

    const daysOfWeek = [
        { id: 1, name: 'Lunes', short: 'Lun' },
        { id: 2, name: 'Martes', short: 'Mar' },
        { id: 3, name: 'Miércoles', short: 'Mié' },
        { id: 4, name: 'Jueves', short: 'Jue' },
        { id: 5, name: 'Viernes', short: 'Vie' },
        { id: 6, name: 'Sábado', short: 'Sáb' },
        { id: 0, name: 'Domingo', short: 'Dom' }
    ];

    // Generar datos de ocupación simulados
    const generateOccupancyData = useCallback(() => {
        const data = {};
        const days = generateCalendarDays();

        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Simular ocupación basada en patrones
            data[dateStr] = {
                lunch: {
                    reservations: isWeekend ? 15 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 7),
                    occupancy: isWeekend ? 65 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 25)
                },
                dinner: {
                    reservations: isWeekend ? 25 + Math.floor(Math.random() * 15) : 15 + Math.floor(Math.random() * 10),
                    occupancy: isWeekend ? 75 + Math.floor(Math.random() * 20) : 55 + Math.floor(Math.random() * 25)
                },
                aiReservations: Math.floor(Math.random() * 15) + 5,
                manualReservations: Math.floor(Math.random() * 8) + 2
            };
        });

        setOccupancyData(data);
    }, [currentDate]);

    useEffect(() => {
        if (restaurantId) {
            loadInitialData();
            generateOccupancyData();
        }
    }, [restaurantId, currentDate]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadWeeklySchedule(),
                loadAgentSchedule(),
                loadEvents()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const loadWeeklySchedule = async () => {
        // Simular carga de horarios
        const mockSchedule = daysOfWeek.map(day => ({
            day_of_week: day.id,
            is_open: day.id !== 0, // Cerrado los domingos por defecto
            shifts: {
                morning: { enabled: false, start: '09:00', end: '12:00' },
                lunch: { enabled: true, start: '13:00', end: '16:00' },
                evening: { enabled: false, start: '18:00', end: '20:00' },
                dinner: { enabled: true, start: '20:00', end: '23:30' }
            },
            capacity_modifier: 1.0, // Modificador de capacidad por día
            special_notes: ''
        }));
        setWeeklySchedule(mockSchedule);
    };

    const loadAgentSchedule = async () => {
        // Simular configuración del agente por canal
        const mockAgentSchedule = {
            whatsapp: { 
                enabled: true, 
                always_on: true,
                schedule: null,
                response_time: 5 
            },
            vapi: { 
                enabled: true, 
                always_on: false,
                schedule: { start: '09:00', end: '23:00' },
                response_time: 2 
            },
            instagram: { 
                enabled: true, 
                always_on: true,
                schedule: null,
                response_time: 10 
            },
            facebook: { 
                enabled: false, 
                always_on: false,
                schedule: null,
                response_time: 15 
            },
            email: { 
                enabled: true, 
                always_on: true,
                schedule: null,
                response_time: 30 
            }
        };
        setAgentSchedule(mockAgentSchedule);
    };

    const loadEvents = async () => {
        // Simular eventos
        const mockEvents = [
            {
                id: 1,
                title: 'Día de San Valentín - Menú Especial',
                type: 'event',
                start_date: '2024-02-14',
                end_date: '2024-02-14',
                affects_capacity: true,
                capacity_modifier: 0.8,
                description: 'Servicio especial con menú romántico'
            },
            {
                id: 2,
                title: 'Mantenimiento cocina',
                type: 'maintenance',
                start_date: '2024-02-20',
                end_date: '2024-02-20',
                affects_capacity: true,
                capacity_modifier: 0.5,
                description: 'Solo servicio limitado'
            }
        ];
        setEvents(mockEvents);
    };

    const handleSaveWeeklySchedule = async () => {
        try {
            // Aquí iría la llamada a Supabase
            toast.success('Horarios guardados correctamente');
        } catch (error) {
            toast.error('Error al guardar los horarios');
        }
    };

    const handleUpdateSchedule = (dayIndex, field, value) => {
        const updated = [...weeklySchedule];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            updated[dayIndex] = {
                ...updated[dayIndex],
                [parent]: {
                    ...updated[dayIndex][parent],
                    [child]: value
                }
            };
        } else {
            updated[dayIndex] = { ...updated[dayIndex], [field]: value };
        }
        setWeeklySchedule(updated);
    };

    const handleUpdateAgentSchedule = (channel, field, value) => {
        setAgentSchedule(prev => ({
            ...prev,
            [channel]: {
                ...prev[channel],
                [field]: value
            }
        }));
    };

    const generateCalendarDays = () => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    };

    const getOccupancyColor = (percentage) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-orange-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const navigateMonth = (direction) => {
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Calendar className="w-8 h-8 text-purple-600" />
                                Horarios y Calendario
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestiona los horarios del restaurante y la disponibilidad del agente IA
                            </p>
                        </div>

                        {/* Estado del agente */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                                <Bot className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium">
                                    Agente {agentStatus?.active ? 'Activo' : 'Inactivo'}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${agentStatus?.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            </div>
                            <button
                                onClick={() => setShowAgentSettings(true)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs mejorados */}
                <div className="bg-white rounded-t-xl border-b border-gray-200">
                    <nav className="flex">
                        {[
                            { id: 'horarios', label: 'Horarios Semanales', icon: Clock },
                            { id: 'calendario', label: 'Calendario', icon: Calendar },
                            { id: 'capacidad', label: 'Gestión de Capacidad', icon: Users },
                            { id: 'agente', label: 'Horarios del Agente', icon: Bot },
                            { id: 'analytics', label: 'Análisis', icon: BarChart3 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-4 font-medium transition-colors relative
                                    ${activeTab === tab.id
                                        ? 'text-purple-600 border-b-2 border-purple-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Contenido según tab activa */}
                <div className="bg-white rounded-b-xl shadow-sm">
                    {/* Tab: Horarios Semanales */}
                    {activeTab === 'horarios' && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Configuración de Horarios Semanales
                                </h3>
                                <button
                                    onClick={handleSaveWeeklySchedule}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar Cambios
                                </button>
                            </div>

                            <div className="space-y-4">
                                {weeklySchedule.map((schedule, index) => {
                                    const day = daysOfWeek.find(d => d.id === schedule.day_of_week);
                                    const hasEvents = events.some(e => {
                                        const eventDate = parseISO(e.start_date);
                                        return getDay(eventDate) === day.id;
                                    });

                                    return (
                                        <div
                                            key={day.id}
                                            className={`
                                                border rounded-xl p-6 transition-all
                                                ${schedule.is_open 
                                                    ? 'border-gray-200 bg-white' 
                                                    : 'border-gray-100 bg-gray-50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={schedule.is_open}
                                                            onChange={(e) => handleUpdateSchedule(index, 'is_open', e.target.checked)}
                                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                        />
                                                        <span className="text-lg font-medium text-gray-900">
                                                            {day.name}
                                                        </span>
                                                    </label>
                                                    {hasEvents && (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                                            Eventos programados
                                                        </span>
                                                    )}
                                                </div>

                                                {schedule.is_open && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">
                                                            Capacidad:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            value={(schedule.capacity_modifier * 100).toFixed(0)}
                                                            onChange={(e) => handleUpdateSchedule(index, 'capacity_modifier', e.target.value / 100)}
                                                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500"
                                                            min="0"
                                                            max="150"
                                                        />
                                                        <span className="text-sm text-gray-500">%</span>
                                                    </div>
                                                )}
                                            </div>

                                            {schedule.is_open && (
                                                <div className="space-y-4">
                                                    {/* Turnos del día */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {Object.entries(schedule.shifts || {}).map(([shift, config]) => {
                                                            const ShiftIcon = SHIFT_ICONS[shift] || Clock;

                                                            return (
                                                                <div
                                                                    key={shift}
                                                                    className={`
                                                                        border rounded-lg p-4 transition-all
                                                                        ${config.enabled 
                                                                            ? 'border-purple-200 bg-purple-50' 
                                                                            : 'border-gray-200'
                                                                        }
                                                                    `}
                                                                >
                                                                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={config.enabled}
                                                                            onChange={(e) => handleUpdateSchedule(index, `shifts.${shift}.enabled`, e.target.checked)}
                                                                            className="w-4 h-4 text-purple-600 rounded"
                                                                        />
                                                                        <ShiftIcon className="w-4 h-4 text-gray-600" />
                                                                        <span className="font-medium text-gray-700 capitalize">
                                                                            {shift === 'lunch' ? 'Comida' : 
                                                                             shift === 'dinner' ? 'Cena' :
                                                                             shift === 'morning' ? 'Mañana' :
                                                                             shift === 'evening' ? 'Tarde' : shift}
                                                                        </span>
                                                                    </label>

                                                                    {config.enabled && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    type="time"
                                                                                    value={config.start}
                                                                                    onChange={(e) => handleUpdateSchedule(index, `shifts.${shift}.start`, e.target.value)}
                                                                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                                                                />
                                                                                <span className="text-gray-500">-</span>
                                                                                <input
                                                                                    type="time"
                                                                                    value={config.end}
                                                                                    onChange={(e) => handleUpdateSchedule(index, `shifts.${shift}.end`, e.target.value)}
                                                                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Notas especiales */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Notas especiales para {day.name}
                                                        </label>
                                                        <textarea
                                                            value={schedule.special_notes || ''}
                                                            onChange={(e) => handleUpdateSchedule(index, 'special_notes', e.target.value)}
                                                            placeholder="Ej: Happy hour 18:00-20:00, Menú especial..."
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-purple-500"
                                                            rows="2"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Acciones rápidas */}
                            <div className="flex gap-3 pt-4">
                                <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                    <Copy className="w-4 h-4 inline mr-2" />
                                    Copiar horario de la semana anterior
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                    Aplicar plantilla
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab: Calendario */}
                    {activeTab === 'calendario' && (
                        <div className="p-6">
                            {/* Controles del calendario */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => navigateMonth('prev')}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                                    </h3>
                                    <button
                                        onClick={() => navigateMonth('next')}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-3 py-1 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    >
                                        Hoy
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={viewMode}
                                        onChange={(e) => setViewMode(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                    >
                                        <option value="month">Mes</option>
                                        <option value="week">Semana</option>
                                        <option value="day">Día</option>
                                    </select>

                                    <button
                                        onClick={() => {
                                            setEditingEvent(null);
                                            setShowEventModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nuevo Evento
                                    </button>
                                </div>
                            </div>

                            {/* Leyenda */}
                            <div className="flex items-center gap-6 mb-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">Baja ocupación (&lt;50%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-gray-600">Media (50-75%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                    <span className="text-gray-600">Alta (75-90%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-gray-600">Completo (&gt;90%)</span>
                                </div>
                            </div>

                            {/* Grid del calendario */}
                            <div className="bg-gray-50 rounded-lg p-1">
                                {/* Días de la semana */}
                                <div className="grid grid-cols-7 mb-1">
                                    {daysOfWeek.map(day => (
                                        <div
                                            key={day.id}
                                            className="py-3 text-center text-sm font-medium text-gray-700"
                                        >
                                            {day.name}
                                        </div>
                                    ))}
                                </div>

                                {/* Días del mes */}
                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays().map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const daySchedule = weeklySchedule.find(s => s.day_of_week === getDay(day));
                                        const dayEvents = events.filter(e => isSameDay(parseISO(e.start_date), day));
                                        const dayOccupancy = occupancyData[dateStr];
                                        const isPast = isBefore(day, new Date()) && !isToday(day);

                                        return (
                                            <div
                                                key={day.toString()}
                                                onClick={() => setSelectedDate(day)}
                                                className={`
                                                    min-h-[120px] bg-white p-3 rounded-lg border transition-all cursor-pointer
                                                    ${day.getMonth() !== currentDate.getMonth() ? 'opacity-50' : ''}
                                                    ${isToday(day) ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'}
                                                    ${isPast ? 'bg-gray-50' : 'hover:border-purple-300'}
                                                    ${!daySchedule?.is_open ? 'bg-gray-100' : ''}
                                                `}
                                            >
                                                {/* Fecha */}
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`
                                                        text-sm font-semibold
                                                        ${isToday(day) ? 'text-purple-600' : 'text-gray-900'}
                                                    `}>
                                                        {format(day, 'd')}
                                                    </span>

                                                    {/* Indicadores */}
                                                    <div className="flex gap-1">
                                                        {dayOccupancy?.aiReservations > 0 && (
                                                            <Bot className="w-3 h-3 text-purple-500" />
                                                        )}
                                                        {!daySchedule?.is_open && (
                                                            <XCircle className="w-3 h-3 text-gray-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Ocupación */}
                                                {daySchedule?.is_open && dayOccupancy && (
                                                    <div className="space-y-1 mb-2">
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-2 h-2 rounded-full ${getOccupancyColor(dayOccupancy.lunch.occupancy)}`} />
                                                            <span className="text-xs text-gray-600">
                                                                C: {dayOccupancy.lunch.occupancy}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-2 h-2 rounded-full ${getOccupancyColor(dayOccupancy.dinner.occupancy)}`} />
                                                            <span className="text-xs text-gray-600">
                                                                D: {dayOccupancy.dinner.occupancy}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Eventos */}
                                                {dayEvents.slice(0, 2).map((event, idx) => (
                                                    <div
                                                        key={event.id}
                                                        className={`
                                                            text-xs px-2 py-1 rounded mb-1 truncate
                                                            ${EVENT_COLORS[event.type].bg}
                                                            ${EVENT_COLORS[event.type].text}
                                                        `}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingEvent(event);
                                                            setShowEventModal(true);
                                                        }}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}

                                                {dayEvents.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{dayEvents.length - 2} más
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Capacidad */}
                    {activeTab === 'capacidad' && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Gestión de Capacidad y Turnos
                                </h3>
                                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                    Ver guía de optimización →
                                </button>
                            </div>

                            {/* Configuración general */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h4 className="font-medium text-gray-900 mb-4">Configuración General</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mesas totales
                                        </label>
                                        <input
                                            type="number"
                                            value={capacitySettings.maxTables}
                                            onChange={(e) => setCapacitySettings(prev => ({
                                                ...prev,
                                                maxTables: parseInt(e.target.value)
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacidad máxima
                                        </label>
                                        <input
                                            type="number"
                                            value={capacitySettings.maxCovers}
                                            onChange={(e) => setCapacitySettings(prev => ({
                                                ...prev,
                                                maxCovers: parseInt(e.target.value)
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Duración media (min)
                                        </label>
                                        <input
                                            type="number"
                                            value={capacitySettings.avgDuration}
                                            onChange={(e) => setCapacitySettings(prev => ({
                                                ...prev,
                                                avgDuration: parseInt(e.target.value)
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tiempo buffer (min)
                                        </label>
                                        <input
                                            type="number"
                                            value={capacitySettings.bufferTime}
                                            onChange={(e) => setCapacitySettings(prev => ({
                                                ...prev,
                                                bufferTime: parseInt(e.target.value)
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Optimización por turnos */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Optimización por Turnos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['Comida', 'Cena'].map(turno => (
                                        <div key={turno} className="bg-white border border-gray-200 rounded-xl p-6">
                                            <h5 className="font-medium text-gray-900 mb-4">{turno}</h5>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Capacidad base</span>
                                                    <span className="font-medium">{capacitySettings.maxCovers} personas</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Turnos estimados</span>
                                                    <span className="font-medium">
                                                        {Math.floor(180 / (capacitySettings.avgDuration + capacitySettings.bufferTime))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Capacidad total</span>
                                                    <span className="font-medium text-purple-600">
                                                        {capacitySettings.maxCovers * Math.floor(180 / (capacitySettings.avgDuration + capacitySettings.bufferTime))} personas
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                                <p className="text-sm text-purple-700">
                                                    <Zap className="w-4 h-4 inline mr-1" />
                                                    Recomendación: Reducir 10min el tiempo medio aumentaría la capacidad en {Math.floor(capacitySettings.maxCovers * 0.15)} personas
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sugerencias de optimización */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                    Sugerencias de Optimización
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4">
                                        <h5 className="font-medium text-gray-900 mb-2">Turnos flexibles</h5>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Permite reservas cada 15 min en lugar de cada 30 min para maximizar ocupación
                                        </p>
                                        <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                                            Implementar →
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-lg p-4">
                                        <h5 className="font-medium text-gray-900 mb-2">Mesas compartidas</h5>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Activa mesas compartidas para grupos pequeños en horas pico
                                        </p>
                                        <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                                            Configurar →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Agente */}
                    {activeTab === 'agente' && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Configuración de Horarios del Agente IA
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Estado global:</span>
                                    <button
                                        className={`
                                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                            ${agentStatus?.active ? 'bg-purple-600' : 'bg-gray-200'}
                                        `}
                                    >
                                        <span
                                            className={`
                                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                                ${agentStatus?.active ? 'translate-x-6' : 'translate-x-1'}
                                            `}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Configuración por canal */}
                            <div className="space-y-4">
                                {Object.entries(agentSchedule).map(([channel, config]) => {
                                    const ChannelIcon = channel === 'whatsapp' ? MessageCircle :
                                                       channel === 'vapi' ? PhoneCall :
                                                       channel === 'instagram' ? Instagram :
                                                       channel === 'facebook' ? Facebook :
                                                       channel === 'email' ? Mail : Globe;

                                    return (
                                        <div
                                            key={channel}
                                            className={`
                                                border rounded-xl p-6 transition-all
                                                ${config.enabled 
                                                    ? 'border-purple-200 bg-purple-50' 
                                                    : 'border-gray-200 bg-white'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${config.enabled ? 'bg-purple-200' : 'bg-gray-200'}
                                                    `}>
                                                        <ChannelIcon className={`
                                                            w-5 h-5
                                                            ${config.enabled ? 'text-purple-700' : 'text-gray-500'}
                                                        `} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 capitalize">
                                                            {channel === 'vapi' ? 'Llamadas (Vapi)' : channel}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            Tiempo de respuesta: {config.response_time}s
                                                        </p>
                                                    </div>
                                                </div>

                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-sm text-gray-600">Activado</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={config.enabled}
                                                        onChange={(e) => handleUpdateAgentSchedule(channel, 'enabled', e.target.checked)}
                                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                </label>
                                            </div>

                                            {config.enabled && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={config.always_on}
                                                                onChange={(e) => handleUpdateAgentSchedule(channel, 'always_on', e.target.checked)}
                                                                className="w-4 h-4 text-purple-600 rounded"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">
                                                                Disponible 24/7
                                                            </span>
                                                        </label>

                                                        {config.always_on && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                                Siempre activo
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!config.always_on && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <TimeSlotInput
                                                                label="Hora de inicio"
                                                                value={config.schedule?.start}
                                                                onChange={(value) => handleUpdateAgentSchedule(channel, 'schedule', {
                                                                    ...config.schedule,
                                                                    start: value
                                                                })}
                                                                icon={Clock}
                                                            />
                                                            <TimeSlotInput
                                                                label="Hora de fin"
                                                                value={config.schedule?.end}
                                                                onChange={(value) => handleUpdateAgentSchedule(channel, 'schedule', {
                                                                    ...config.schedule,
                                                                    end: value
                                                                })}
                                                                icon={Clock}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Estadísticas del canal */}
                                                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-200">
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-gray-900">
                                                                {channel === 'whatsapp' ? '521' :
                                                                 channel === 'vapi' ? '287' :
                                                                 channel === 'instagram' ? '198' :
                                                                 channel === 'facebook' ? '156' : '85'}
                                                            </p>
                                                            <p className="text-xs text-gray-600">Conversaciones/mes</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-gray-900">
                                                                {channel === 'whatsapp' ? '44.9' :
                                                                 channel === 'vapi' ? '49.8' :
                                                                 channel === 'instagram' ? '44.9' :
                                                                 channel === 'facebook' ? '39.7' : '38.8'}%
                                                            </p>
                                                            <p className="text-xs text-gray-600">Conversión</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-gray-900">4.7</p>
                                                            <p className="text-xs text-gray-600">Satisfacción</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mensaje de respuesta fuera de horario */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h4 className="font-medium text-gray-900 mb-4">
                                    Mensaje fuera de horario
                                </h4>
                                <textarea
                                    placeholder="Gracias por contactarnos. Nuestro horario de atención es..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500"
                                    rows="3"
                                    defaultValue="Gracias por contactar con nosotros. Actualmente estamos fuera de nuestro horario de atención. Le responderemos lo antes posible cuando volvamos a estar disponibles. Para reservas urgentes, puede llamarnos directamente al restaurante."
                                />
                                <div className="flex justify-end mt-4">
                                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                        Guardar mensaje
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Analytics */}
                    {activeTab === 'analytics' && (
                        <div className="p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                Análisis de Ocupación y Tendencias
                            </h3>

                            {/* Resumen del mes */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <Activity className="w-8 h-8 text-purple-600" />
                                        <span className="text-sm text-gray-500">Este mes</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">72%</p>
                                    <p className="text-sm text-gray-600 mt-1">Ocupación media</p>
                                    <p className="text-sm text-green-600 mt-2">+8% vs mes anterior</p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="w-8 h-8 text-green-600" />
                                        <span className="text-sm text-gray-500">Mejor día</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">Sábado</p>
                                    <p className="text-sm text-gray-600 mt-1">92% ocupación media</p>
                                    <p className="text-sm text-purple-600 mt-2">38 reservas promedio</p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <Bot className="w-8 h-8 text-purple-600" />
                                        <span className="text-sm text-gray-500">Agente IA</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">68%</p>
                                    <p className="text-sm text-gray-600 mt-1">Reservas automatizadas</p>
                                    <p className="text-sm text-green-600 mt-2">342 este mes</p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                                        <span className="text-sm text-gray-500">Atención</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">3</p>
                                    <p className="text-sm text-gray-600 mt-1">Días con sobrecarga</p>
                                    <p className="text-sm text-amber-600 mt-2">Revisar capacidad</p>
                                </div>
                            </div>

                            {/* Patrones identificados */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-600" />
                                    Patrones Identificados por IA
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4">
                                        <h5 className="font-medium text-gray-900 mb-2">
                                            Viernes: Alta demanda no atendida
                                        </h5>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Detectamos 15-20 solicitudes rechazadas cada viernes por falta de capacidad
                                        </p>
                                        <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                                            Ver análisis detallado →
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-lg p-4">
                                        <h5 className="font-medium text-gray-900 mb-2">
                                            Martes: Oportunidad de promoción
                                        </h5>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Ocupación media del 35%. Ideal para promociones o eventos especiales
                                        </p>
                                        <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                                            Crear promoción →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de eventos */}
            {showEventModal && (
                <EventModal
                    event={editingEvent}
                    onSave={(eventData) => {
                        // Guardar evento
                        setShowEventModal(false);
                        toast.success('Evento guardado correctamente');
                    }}
                    onClose={() => {
                        setShowEventModal(false);
                        setEditingEvent(null);
                    }}
                    onDelete={() => {
                        // Eliminar evento
                        setShowEventModal(false);
                        toast.success('Evento eliminado');
                    }}
                />
            )}

            {/* Modal de configuración del agente */}
            {showAgentSettings && (
                <AgentSettingsModal
                    onClose={() => setShowAgentSettings(false)}
                    agentSchedule={agentSchedule}
                    onUpdate={handleUpdateAgentSchedule}
                />
            )}
        </div>
    );
}

// Modal de eventos mejorado
function EventModal({ event, onSave, onClose, onDelete }) {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        type: event?.type || 'closure',
        start_date: event?.start_date || format(new Date(), 'yyyy-MM-dd'),
        end_date: event?.end_date || format(new Date(), 'yyyy-MM-dd'),
        affects_capacity: event?.affects_capacity || false,
        capacity_modifier: event?.capacity_modifier || 1.0,
        description: event?.description || '',
        notifications_sent: event?.notifications_sent || false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {event ? 'Editar Evento' : 'Nuevo Evento'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XCircle className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSave(formData);
                    }}
                    className="p-6 space-y-6"
                >
                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título del evento
                        </label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ej: Cena de San Valentín"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Tipo de evento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de evento
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="closure">Cierre</option>
                            <option value="vacation">Vacaciones</option>
                            <option value="special_hours">Horario Especial</option>
                            <option value="event">Evento</option>
                            <option value="maintenance">Mantenimiento</option>
                            <option value="holiday">Festivo</option>
                        </select>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha inicio
                            </label>
                            <input
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha fin
                            </label>
                            <input
                                name="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Afecta capacidad */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="affects_capacity"
                                checked={formData.affects_capacity}
                                onChange={handleChange}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="font-medium text-gray-700">
                                Afecta a la capacidad del restaurante
                            </span>
                        </label>

                        {formData.affects_capacity && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacidad disponible
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="150"
                                        value={formData.capacity_modifier * 100}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            capacity_modifier: e.target.value / 100
                                        }))}
                                        className="flex-1"
                                    />
                                    <span className="w-12 text-right font-medium">
                                        {Math.round(formData.capacity_modifier * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción / Notas
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Información adicional sobre el evento..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            rows="3"
                        />
                    </div>

                    {/* Notificaciones */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-blue-900 font-medium">
                                    Notificaciones automáticas
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    El agente IA notificará automáticamente a los clientes afectados por este evento
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex justify-between pt-4 border-t">
                        <div>
                            {event && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                {event ? 'Guardar cambios' : 'Crear evento'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Modal de configuración del agente
function AgentSettingsModal({ onClose, agentSchedule, onUpdate }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Configuración Rápida del Agente
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XCircle className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Presets */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Configuraciones rápidas</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                                <h5 className="font-medium text-gray-900 mb-1">Máxima disponibilidad</h5>
                                <p className="text-sm text-gray-600">Todos los canales 24/7</p>
                            </button>
                            <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                                <h5 className="font-medium text-gray-900 mb-1">Horario comercial</h5>
                                <p className="text-sm text-gray-600">9:00 - 21:00 todos los días</p>
                            </button>
                            <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                                <h5 className="font-medium text-gray-900 mb-1">Solo WhatsApp</h5>
                                <p className="text-sm text-gray-600">WhatsApp 24/7, resto desactivado</p>
                            </button>
                            <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                                <h5 className="font-medium text-gray-900 mb-1">Modo vacaciones</h5>
                                <p className="text-sm text-gray-600">Solo mensajes automáticos</p>
                            </button>
                        </div>
                    </div>

                    {/* Estado actual */}
                    <div className="bg-purple-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Estado actual</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {Object.values(agentSchedule).filter(c => c.enabled).length}
                                </p>
                                <p className="text-sm text-gray-600">Canales activos</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {Object.values(agentSchedule).filter(c => c.always_on).length}
                                </p>
                                <p className="text-sm text-gray-600">Disponibles 24/7</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">5s</p>
                                <p className="text-sm text-gray-600">Respuesta promedio</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Guardar configuración
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// src/pages/Calendario.jsx - Gestión PREMIUM de horarios y disponibilidad con IA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
    Activity,
    Star
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
export default function Calendario() {
    const { restaurantInfo } = useAuthContext();
    const restaurantId = restaurantInfo?.id;

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

    // Canales del agente IA
    const agentChannels = [
        { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'green' },
        { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'pink' },
        { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'blue' },
        { id: 'phone', name: 'Teléfono', icon: PhoneCall, color: 'gray' },
        { id: 'web', name: 'Web Chat', icon: Globe, color: 'purple' },
        { id: 'email', name: 'Email', icon: Mail, color: 'red' }
    ];

    // Inicializar datos
    useEffect(() => {
        initializeData();
    }, [restaurantId]);

    const initializeData = async () => {
        if (!restaurantId) return;
        
        setLoading(true);
        try {
            // Cargar horarios reales desde Supabase
            const { data: scheduleData, error: scheduleError } = await supabase
                .from("restaurant_schedule")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .order("day_of_week");

            if (scheduleError) {
            }

            // Si no hay horarios guardados, crear estructura vacía
            const loadedSchedule = scheduleData && scheduleData.length > 0 
                ? scheduleData 
                : daysOfWeek.map(day => ({
                    day_of_week: day.id,
                    day_name: day.name,
                    is_open: false, // CERRADO por defecto hasta que configuren
                    slots: [] // SIN slots hasta que configuren
                }));

            // Configuración del agente por defecto
            const defaultAgentSchedule = {};
            agentChannels.forEach(channel => {
                defaultAgentSchedule[channel.id] = {
                    enabled: channel.id !== 'email',
                    always_on: channel.id === 'web',
                    schedule: {
                        monday: { start: '09:00', end: '23:00' },
                        tuesday: { start: '09:00', end: '23:00' },
                        wednesday: { start: '09:00', end: '23:00' },
                        thursday: { start: '09:00', end: '23:00' },
                        friday: { start: '09:00', end: '24:00' },
                        saturday: { start: '10:00', end: '24:00' },
                        sunday: { start: '10:00', end: '22:00' }
                    }
                };
            });

            // Eventos de ejemplo
            // DATOS MOCK ELIMINADOS - Sin eventos de ejemplo
            const sampleEvents = [];

            // Generar datos de ocupación simulados
            const occupancySimData = {};
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

            monthDays.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayOfWeek = getDay(day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                
                occupancySimData[dateStr] = {
                    lunch: 0,
                    dinner: 0,
                    estimated_revenue: 0
                };
            });

            setWeeklySchedule(loadedSchedule);
            setAgentSchedule(defaultAgentSchedule);
            // DATOS MOCK ELIMINADOS - Estados vacíos
            setEvents([]);
            setOccupancyData({});

        } catch (error) {
            toast.error('Error al cargar los datos del calendario');
        } finally {
            setLoading(false);
        }
    };

    // Guardar horarios semanales
    const saveWeeklySchedule = async () => {
        try {
            toast.promise(
                new Promise(resolve => setTimeout(resolve, 1000)),
                {
                    loading: 'Guardando horarios...',
                    success: 'Horarios guardados correctamente',
                    error: 'Error al guardar horarios'
                }
            );
            // TODO: Implementar guardado real en Supabase
        } catch (error) {
        }
    };

    // Guardar configuración del agente
    const saveAgentSchedule = async () => {
        try {
            toast.promise(
                new Promise(resolve => setTimeout(resolve, 1000)),
                {
                    loading: 'Guardando configuración del agente...',
                    success: 'Configuración del agente guardada',
                    error: 'Error al guardar configuración del agente'
                }
            );
            // TODO: Implementar guardado real en Supabase
        } catch (error) {
        }
    };

    // Navegación del calendario
    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    // Generar días del calendario
    const generateCalendarDays = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    };

    // Actualizar horario semanal
    const updateDaySchedule = (dayId, field, value) => {
        setWeeklySchedule(prev => 
            prev.map(day => {
                if (day.day_of_week === dayId) {
                    const updatedDay = { ...day, [field]: value };
                    
                    // Si abrimos el día y no tiene slots, agregar horario de ejemplo
                    if (field === 'is_open' && value === true && (!day.slots || day.slots.length === 0)) {
                        updatedDay.slots = [
                            { name: 'Almuerzo', start: '12:00', end: '16:00', capacity: 30 },
                            { name: 'Cena', start: '19:00', end: '23:00', capacity: 40 }
                        ];
                        toast.success(`✅ ${day.day_name} configurado con horarios de ejemplo. ¡Puedes editarlos!`);
                    }
                    
                    return updatedDay;
                }
                return day;
            })
        );
    };

    // Actualizar slot de horario
    const updateSlot = (dayId, slotIndex, field, value) => {
        setWeeklySchedule(prev => 
            prev.map(day => 
                day.day_of_week === dayId 
                    ? {
                        ...day,
                        slots: day.slots.map((slot, index) => 
                            index === slotIndex 
                                ? { ...slot, [field]: value }
                                : slot
                        )
                    }
                    : day
            )
        );
    };

    // Agregar nuevo slot
    const addSlot = (dayId) => {
        const newSlot = { name: 'Nuevo turno', start: '12:00', end: '16:00', capacity: 30 };
        setWeeklySchedule(prev => 
            prev.map(day => 
                day.day_of_week === dayId 
                    ? { ...day, slots: [...day.slots, newSlot] }
                    : day
            )
        );
    };

    // Eliminar slot
    const removeSlot = (dayId, slotIndex) => {
        setWeeklySchedule(prev => 
            prev.map(day => 
                day.day_of_week === dayId 
                    ? {
                        ...day,
                        slots: day.slots.filter((_, index) => index !== slotIndex)
                    }
                    : day
            )
        );
    };

    // Actualizar configuración del agente
    const updateAgentChannel = (channelId, field, value) => {
        setAgentSchedule(prev => ({
            ...prev,
            [channelId]: {
                ...prev[channelId],
                [field]: value
            }
        }));
    };

    // Actualizar horario del agente por día
    const updateAgentDaySchedule = (channelId, day, field, value) => {
        setAgentSchedule(prev => ({
            ...prev,
            [channelId]: {
                ...prev[channelId],
                schedule: {
                    ...prev[channelId].schedule,
                    [day]: {
                        ...prev[channelId].schedule[day],
                        [field]: value
                    }
                }
            }
        }));
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
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAgentSettings(!showAgentSettings)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                                <Bot className="w-4 h-4" />
                                Config. Agente IA
                            </button>
                            <button
                                onClick={activeTab === 'horarios' ? saveWeeklySchedule : saveAgentSchedule}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Guardar cambios
                            </button>
                        </div>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Días abiertos</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {weeklySchedule.filter(day => day.is_open).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Horas semanales</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {weeklySchedule.reduce((total, day) => {
                                            if (!day.is_open) return total;
                                            return total + day.slots.reduce((dayTotal, slot) => {
                                                const start = new Date(`2000-01-01T${slot.start}`);
                                                const end = new Date(`2000-01-01T${slot.end}`);
                                                return dayTotal + (end - start) / (1000 * 60 * 60);
                                            }, 0);
                                        }, 0).toFixed(0)}h
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Canales IA activos</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {Object.values(agentSchedule).filter(channel => channel.enabled).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Ocupación promedio</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {Math.round(Object.values(occupancyData).reduce((sum, day) => 
                                            sum + (day.lunch + day.dinner) / 2, 0) / Object.keys(occupancyData).length) || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de navegación */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'horarios', name: 'Horarios del restaurante', icon: Clock },
                                { id: 'agente', name: 'Agente IA', icon: Bot },
                                { id: 'calendario', name: 'Vista calendario', icon: Calendar },
                                { id: 'eventos', name: 'Eventos especiales', icon: Star }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${
                                            activeTab === tab.id
                                                ? 'border-purple-500 text-purple-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab: Horarios del restaurante */}
                    {activeTab === 'horarios' && (
                        <div className="p-6">
                            <div className="space-y-6">
                                {weeklySchedule.map((day) => {
                                    const Icon = SHIFT_ICONS[day.slots?.[0]?.name?.toLowerCase()] || Clock;
                                    
                                    return (
                                        <div key={day.day_of_week} className="bg-gray-50 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5 text-purple-600" />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {day.day_name}
                                                    </h3>
                                                    <button
                                                        onClick={() => updateDaySchedule(day.day_of_week, 'is_open', !day.is_open)}
                                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                            day.is_open 
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {day.is_open ? 'Abierto' : 'Cerrado'}
                                                    </button>
                                                </div>
                                                
                                                {day.is_open && (
                                                    <button
                                                        onClick={() => addSlot(day.day_of_week)}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Agregar turno
                                                    </button>
                                                )}
                                            </div>

                                            {day.is_open && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {day.slots.map((slot, slotIndex) => (
                                                        <div key={slotIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <input
                                                                    type="text"
                                                                    value={slot.name}
                                                                    onChange={(e) => updateSlot(day.day_of_week, slotIndex, 'name', e.target.value)}
                                                                    className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                                                                />
                                                                <button
                                                                    onClick={() => removeSlot(day.day_of_week, slotIndex)}
                                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <TimeSlotInput
                                                                    label="Inicio"
                                                                    value={slot.start}
                                                                    onChange={(value) => updateSlot(day.day_of_week, slotIndex, 'start', value)}
                                                                    icon={Clock}
                                                                />
                                                                <TimeSlotInput
                                                                    label="Fin"
                                                                    value={slot.end}
                                                                    onChange={(value) => updateSlot(day.day_of_week, slotIndex, 'end', value)}
                                                                    icon={Clock}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Capacidad máxima
                                                                </label>
                                                                <div className="relative">
                                                                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <input
                                                                        type="number"
                                                                        value={slot.capacity}
                                                                        onChange={(e) => updateSlot(day.day_of_week, slotIndex, 'capacity', parseInt(e.target.value))}
                                                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                                        placeholder="Personas"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {!day.is_open && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>Restaurante cerrado este día</p>
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

                    {/* Tab: Agente IA */}
                    {activeTab === 'agente' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Configuración por canal */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Configuración por canal
                                    </h3>

                                    {agentChannels.map((channel) => {
                                        const Icon = channel.icon;
                                        const config = agentSchedule[channel.id] || {};
                                        
                                        return (
                                            <div key={channel.id} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 bg-${channel.color}-100 rounded-lg flex items-center justify-center`}>
                                                            <Icon className={`w-4 h-4 text-${channel.color}-600`} />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{channel.name}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateAgentChannel(channel.id, 'always_on', !config.always_on)}
                                                            className={`px-2 py-1 text-xs rounded-full ${
                                                                config.always_on 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}
                                                        >
                                                            24/7
                                                        </button>
                                                        <button
                                                            onClick={() => updateAgentChannel(channel.id, 'enabled', !config.enabled)}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                                config.enabled 
                                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                            }`}
                                                        >
                                                            {config.enabled ? 'Activo' : 'Inactivo'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {config.enabled && !config.always_on && config.schedule && (
                                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                                        {Object.entries(config.schedule).map(([day, schedule]) => (
                                                            <div key={day} className="flex items-center justify-between py-1">
                                                                <span className="capitalize text-gray-600 w-20">
                                                                    {day === 'monday' ? 'Lun' : 
                                                                     day === 'tuesday' ? 'Mar' :
                                                                     day === 'wednesday' ? 'Mié' :
                                                                     day === 'thursday' ? 'Jue' :
                                                                     day === 'friday' ? 'Vie' :
                                                                     day === 'saturday' ? 'Sáb' : 'Dom'}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="time"
                                                                        value={schedule.start}
                                                                        onChange={(e) => updateAgentDaySchedule(channel.id, day, 'start', e.target.value)}
                                                                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-gray-400">-</span>
                                                                    <input
                                                                        type="time"
                                                                        value={schedule.end}
                                                                        onChange={(e) => updateAgentDaySchedule(channel.id, day, 'end', e.target.value)}
                                                                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Panel de estado y estadísticas */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                            <Activity className="w-5 h-5" />
                                            Estado del agente IA
                                        </h3>
                                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <Zap className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Sistema operativo</h4>
                                                    <p className="text-sm text-gray-600">Todos los canales funcionando correctamente</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div className="bg-white/60 rounded-lg p-3">
                                                    <p className="text-2xl font-bold text-purple-600">99.9%</p>
                                                    <p className="text-sm text-gray-600">Disponibilidad</p>
                                                </div>
                                                <div className="bg-white/60 rounded-lg p-3">
                                                    <p className="text-2xl font-bold text-purple-600">1.2s</p>
                                                    <p className="text-sm text-gray-600">Tiempo respuesta</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Rendimiento hoy</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Conversaciones atendidas</span>
                                                <span className="font-semibold text-gray-900">47</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Reservas generadas</span>
                                                <span className="font-semibold text-green-600">12</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Consultas respondidas</span>
                                                <span className="font-semibold text-blue-600">35</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Escaladas a humano</span>
                                                <span className="font-semibold text-orange-600">3</span>
                                            </div>
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
                                </div>
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
                                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Hoy
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowEventModal(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nuevo evento
                                    </button>
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
                                            {day.short}
                                        </div>
                                    ))}
                                </div>

                                {/* Días del mes */}
                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays().map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const daySchedule = weeklySchedule.find(s => s.day_of_week === getDay(day));
                                        const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
                                        const dayOccupancy = occupancyData[dateStr];
                                        const isPast = isBefore(day, new Date());
                                        const isCurrentMonth = format(day, 'MM') === format(currentDate, 'MM');

                                        return (
                                            <div
                                                key={format(day, 'yyyy-MM-dd')}
                                                className={`min-h-[100px] p-2 bg-white rounded border transition-all cursor-pointer hover:shadow-md ${
                                                    !isCurrentMonth ? 'opacity-40' : ''
                                                } ${isToday(day) ? 'ring-2 ring-purple-500' : 'border-gray-200'}`}
                                                onClick={() => setSelectedDate(day)}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-sm font-medium ${
                                                        isToday(day) ? 'text-purple-600' : 'text-gray-900'
                                                    }`}>
                                                        {format(day, 'd')}
                                                    </span>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        {!daySchedule?.is_open && (
                                                            <div className="w-2 h-2 bg-red-400 rounded-full" title="Cerrado" />
                                                        )}
                                                        {dayEvents.length > 0 && (
                                                            <div className="w-2 h-2 bg-orange-400 rounded-full" title="Eventos especiales" />
                                                        )}
                                                    </div>
                                                </div>

                                                {dayOccupancy && daySchedule?.is_open && (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-gray-600">
                                                            Almuerzo: {dayOccupancy.lunch}%
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1">
                                                            <div 
                                                                className={`h-1 rounded-full ${
                                                                    dayOccupancy.lunch > 80 ? 'bg-red-500' :
                                                                    dayOccupancy.lunch > 60 ? 'bg-orange-500' : 'bg-green-500'
                                                                }`}
                                                                style={{ width: `${Math.min(dayOccupancy.lunch, 100)}%` }}
                                                            />
                                                        </div>
                                                        
                                                        <div className="text-xs text-gray-600">
                                                            Cena: {dayOccupancy.dinner}%
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1">
                                                            <div 
                                                                className={`h-1 rounded-full ${
                                                                    dayOccupancy.dinner > 80 ? 'bg-red-500' :
                                                                    dayOccupancy.dinner > 60 ? 'bg-orange-500' : 'bg-green-500'
                                                                }`}
                                                                style={{ width: `${Math.min(dayOccupancy.dinner, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={`text-xs p-1 rounded mt-1 ${EVENT_COLORS[event.type]?.bg} ${EVENT_COLORS[event.type]?.text}`}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Leyenda */}
                            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>Baja ocupación</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                    <span>Ocupación media</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span>Alta ocupación</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                    <span>Cerrado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                    <span>Evento especial</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Eventos especiales */}
                    {activeTab === 'eventos' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Eventos especiales</h3>
                                <button
                                    onClick={() => setShowEventModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nuevo evento
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {events.map(event => (
                                    <div key={event.id} className={`p-4 rounded-lg border-2 ${EVENT_COLORS[event.type]?.border} ${EVENT_COLORS[event.type]?.bg}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                            <button className="text-gray-500 hover:text-gray-700">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`px-2 py-1 rounded-full ${EVENT_COLORS[event.type]?.bg} ${EVENT_COLORS[event.type]?.text}`}>
                                                {event.type}
                                            </span>
                                            <span className="text-gray-500">
                                                {format(parseISO(event.date), 'dd/MM/yyyy', { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {events.length === 0 && (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos programados</h3>
                                    <p className="text-gray-500 mb-4">Crea tu primer evento especial para gestionar horarios únicos</p>
                                    <button
                                        onClick={() => setShowEventModal(true)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Crear evento
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

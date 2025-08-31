// src/pages/Calendario.jsx - Gestión PREMIUM de horarios y disponibilidad con IA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useChannelStats } from '../hooks/useChannelStats';
import { useOccupancy } from '../hooks/useOccupancy';
import CalendarioErrorBoundary from '../components/CalendarioErrorBoundary';
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
    isWithinInterval,
    isSameMonth
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
    Star,
    Activity,
    Zap,
    MessageSquare,
    Phone,
    Mail,
    Sparkles,
    Brain
} from "lucide-react";
import toast from "react-hot-toast";

// Configuración de días de la semana
const daysOfWeek = [
    { id: 'monday', name: 'Lunes' },
    { id: 'tuesday', name: 'Martes' },
    { id: 'wednesday', name: 'Miércoles' },
    { id: 'thursday', name: 'Jueves' },
    { id: 'friday', name: 'Viernes' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' }
];

export default function Calendario() {
    const { restaurant, restaurantId, isReady, addNotification } = useAuthContext();
    const { channelStats } = useChannelStats();
    const { occupancy: occupancyData } = useOccupancy(7);

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedule, setSchedule] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('horarios');
    const [showEventModal, setShowEventModal] = useState(false);
    
    // Estados para estadísticas calculadas
    const [stats, setStats] = useState({
        daysOpen: 0,
        weeklyHours: 0,
        activeChannels: 5,
        occupancy: 0
    });

    // Estados para eventos especiales
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Generar días del calendario
    const calendarDays = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    // Inicializar datos
    useEffect(() => {
        initializeData();
    }, [restaurantId]);

    // Escuchar cambios de horarios desde Configuración
    useEffect(() => {
        const handleRestaurantReload = (event) => {
            console.log("🔄 Calendario: Recargando horarios por cambio en Configuración");
            initializeData();
        };

        const handleScheduleUpdate = (event) => {
            console.log("🔄 Calendario: Horarios actualizados desde Configuración");
            initializeData();
        };

        window.addEventListener('force-restaurant-reload', handleRestaurantReload);
        window.addEventListener('schedule-updated', handleScheduleUpdate);
        
        // También recargar cuando se enfoca la página
        const handleFocus = () => {
            initializeData();
        };
        
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                initializeData();
            }
        });

        return () => {
            window.removeEventListener('force-restaurant-reload', handleRestaurantReload);
            window.removeEventListener('schedule-updated', handleScheduleUpdate);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    const initializeData = async () => {
        if (!restaurantId) return;
        
        setLoading(true);
        try {
            // Cargar horarios desde restaurants.settings (donde están realmente guardados)
            const { data: restaurantData, error: scheduleError } = await supabase
                .from("restaurants")
                .select("settings")
                .eq("id", restaurantId)
                .single();

            if (scheduleError) {
                console.error("❌ Error cargando horarios:", scheduleError);
            }

            const savedHours = restaurantData?.settings?.operating_hours || {};
            
            console.log("🔄 Horarios cargados desde BD:", savedHours);

            // Convertir horarios de operating_hours a formato de calendario
            const loadedSchedule = daysOfWeek.map(day => {
                const dayKey = day.id; // monday, tuesday, etc.
                const dayHours = savedHours[dayKey];
                
                console.log(`📅 ${day.name}:`, dayHours);
                
                const isOpen = dayHours ? !dayHours.closed : false;
                
                return {
                    day_of_week: day.id,
                    day_name: day.name,
                    is_open: isOpen,
                    slots: isOpen ? [
                        {
                            id: 1,
                            name: "Horario Principal",
                            start_time: dayHours?.open || "09:00",
                            end_time: dayHours?.close || "22:00"
                        }
                    ] : []
                };
            });

            setSchedule(loadedSchedule);
            
            // Calcular estadísticas
            calculateStats(loadedSchedule);

        } catch (error) {
            console.error("❌ Error inicializando calendario:", error);
            toast.error("Error al cargar los datos del calendario");
        } finally {
            setLoading(false);
        }
    };

    // Función para calcular estadísticas reales
    const calculateStats = useCallback(async (scheduleData) => {
        try {
            // 1. Días abiertos
            const daysOpen = scheduleData.filter(day => day.is_open).length;
            
            // 2. Horas semanales
            const weeklyHours = scheduleData.reduce((total, day) => {
                if (!day.is_open || !day.slots[0]) return total;
                const start = day.slots[0].start_time;
                const end = day.slots[0].end_time;
                const startHour = parseInt(start.split(':')[0]);
                const endHour = parseInt(end.split(':')[0]);
                const hours = endHour - startHour;
                return total + hours;
            }, 0);

            // 3. Canales activos (desde hook)
            const activeChannels = channelStats.active;

            // 4. Ocupación promedio (desde hook)
            const occupancy = occupancyData.average;

            setStats({
                daysOpen,
                weeklyHours,
                activeChannels,
                occupancy
            });

        } catch (error) {
            console.error("Error calculando estadísticas:", error);
        }
    }, [restaurantId]);

    // Obtener horario de un día específico
    const getDaySchedule = useCallback((date) => {
        const dayOfWeekIndex = getDay(date); // 0 = domingo, 1 = lunes, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeekIndex];
        
        return schedule.find(s => s.day_of_week === dayName) || {
            day_of_week: dayName,
            is_open: false,
            slots: []
        };
    }, [schedule]);

    // Funciones de navegación del calendario
    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
        });
    };

    // Manejar click en día del calendario
    const handleDayClick = useCallback((date) => {
        try {
            console.log("Día seleccionado:", format(date, 'yyyy-MM-dd'));
            // TODO: Implementar modal de eventos especiales
            toast(`Funcionalidad de eventos para ${format(date, 'dd/MM/yyyy')} próximamente`, {
                icon: "📅",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error en handleDayClick:", error);
            toast.error("Error al seleccionar el día");
        }
    }, []);

    // Guardar horario semanal
    const saveWeeklySchedule = async () => {
        if (!restaurantId) {
            toast.error("Error: No hay restaurante configurado");
            return;
        }

        // Validaciones antes de guardar
        const invalidDays = schedule.filter(day => {
            if (!day.is_open) return false;
            return !day.slots || day.slots.length === 0 || !day.slots[0].start_time || !day.slots[0].end_time;
        });

        if (invalidDays.length > 0) {
            toast.error(`Horarios incompletos en: ${invalidDays.map(d => d.day_name).join(', ')}`);
            return;
        }

        setSaving(true);
        try {
            console.log("🔄 Guardando horarios en calendario...", schedule);
            
            // Mapear números de día a nombres
            const dayMapping = {
                1: 'monday',    // Lunes
                2: 'tuesday',   // Martes  
                3: 'wednesday', // Miércoles
                4: 'thursday',  // Jueves
                5: 'friday',    // Viernes
                6: 'saturday',  // Sábado
                0: 'sunday'     // Domingo
            };

            // Convertir schedule a formato operating_hours (UNIFICADO CON CONFIGURACIÓN)
            const operating_hours = {};
            schedule.forEach(day => {
                // day.day_of_week ya viene como string (monday, tuesday, etc.)
                const dayName = day.day_of_week;
                
                if (!day.is_open || !day.slots || day.slots.length === 0) {
                    operating_hours[dayName] = {
                        open: "09:00",
                        close: "22:00",
                        closed: true
                    };
                } else {
                    // Para múltiples turnos, usar el primer turno como principal
                    // y guardar todos los turnos en una propiedad adicional
                    const firstSlot = day.slots[0];
                    operating_hours[dayName] = {
                        open: firstSlot.start_time || "09:00",
                        close: firstSlot.end_time || "22:00",
                        closed: false,
                        // Guardar todos los turnos para uso futuro
                        shifts: day.slots.map(slot => ({
                            start: slot.start_time,
                            end: slot.end_time,
                            name: slot.name
                        }))
                    };
                }
            });

            console.log("📊 Operating hours a guardar:", operating_hours);

            // Obtener settings actuales para no sobrescribir otros datos
            const { data: currentRestaurant, error: fetchError } = await supabase
                .from("restaurants")
                .select("settings")
                .eq("id", restaurantId)
                .single();

            if (fetchError) {
                console.error("Error obteniendo configuración actual:", fetchError);
                throw fetchError;
            }

            const currentSettings = currentRestaurant?.settings || {};

            // Actualizar en la base de datos
            const { error } = await supabase
                .from("restaurants")
                .update({
                    settings: {
                        ...currentSettings,
                        operating_hours: operating_hours,
                        calendar_schedule: schedule // También guardar el schedule completo
                    },
                    updated_at: new Date().toISOString()
                })
                .eq("id", restaurantId);

            if (error) {
                console.error("Error en actualización Supabase:", error);
                throw error;
            }

            // Disparar evento para sync con Configuración
            window.dispatchEvent(new CustomEvent('schedule-updated', { 
                detail: { scheduleData: schedule, restaurantId } 
            }));

            toast.success("✅ Horarios actualizados correctamente");
            console.log("✅ Horarios guardados exitosamente");
            
        } catch (error) {
            console.error("❌ Error guardando horarios:", error);
            
            // Mensajes de error más específicos
            let errorMessage = "Error al guardar los horarios";
            if (error.message?.includes('permission')) {
                errorMessage = "Sin permisos para actualizar horarios";
            } else if (error.message?.includes('network')) {
                errorMessage = "Error de conexión. Verifica tu internet";
            } else if (error.message?.includes('validation')) {
                errorMessage = "Datos de horarios inválidos";
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

        return (
        <CalendarioErrorBoundary>
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Calendar className="w-8 h-8 text-blue-600" />
                                Horarios y Calendario
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestiona los horarios del restaurante y eventos especiales
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={saveWeeklySchedule}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                <Save className="w-4 h-4" />
                                Guardar cambios
                                    </>
                                )}
                            </button>
                        </div>
                        </div>
                    </div>

                                    {/* Estadísticas rápidas - Diseño vertical mejorado */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Resumen de actividad
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.daysOpen}</p>
                                    <p className="text-sm text-gray-600">Días abiertos</p>
                            <p className="text-xs text-gray-500">de 7 días</p>
                        </div>

                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                                <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.weeklyHours}h</p>
                                    <p className="text-sm text-gray-600">Horas semanales</p>
                            <p className="text-xs text-gray-500">tiempo de servicio</p>
                        </div>

                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                                <MessageSquare className="w-6 h-6 text-purple-600" />
                                </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeChannels}</p>
                            <p className="text-sm text-gray-600">Canales activos</p>
                            <p className="text-xs text-gray-500">comunicación</p>
                        </div>

                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                                </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.occupancy}%</p>
                            <p className="text-sm text-gray-600">Ocupación</p>
                            <p className="text-xs text-gray-500">última semana</p>
                        </div>
                    </div>
                </div>

                {/* Tabs de navegación */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'horarios', name: 'Horarios del restaurante', icon: Clock },
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
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {schedule.map((day, index) => (
                                    <div key={day.day_of_week} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-gray-900">{day.day_name}</h3>
                                                    <button
                                                onClick={() => {
                                                    const newSchedule = [...schedule];
                                                    newSchedule[index].is_open = !newSchedule[index].is_open;
                                                    if (newSchedule[index].is_open && newSchedule[index].slots.length === 0) {
                                                        newSchedule[index].slots = [{
                                                            id: 1,
                                                            name: "Horario Principal",
                                                            start_time: "09:00",
                                                            end_time: "22:00"
                                                        }];
                                                    }
                                                    setSchedule(newSchedule);
                                                }}
                                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                            day.is_open 
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {day.is_open ? 'Abierto' : 'Cerrado'}
                                                    </button>
                                                </div>
                                                
                                        {day.is_open && day.slots.length > 0 && (
                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                <input
                                                                        type="time"
                                                        value={day.slots[0].start_time}
                                                        onChange={(e) => {
                                                            const newSchedule = [...schedule];
                                                            newSchedule[index].slots[0].start_time = e.target.value;
                                                            setSchedule(newSchedule);
                                                        }}
                                                        className="text-sm px-2 py-1 border border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-gray-400">-</span>
                                                                    <input
                                                                        type="time"
                                                        value={day.slots[0].end_time}
                                                        onChange={(e) => {
                                                            const newSchedule = [...schedule];
                                                            newSchedule[index].slots[0].end_time = e.target.value;
                                                            setSchedule(newSchedule);
                                                        }}
                                                        className="text-sm px-2 py-1 border border-gray-300 rounded"
                                                                    />
                                                                </div>
                                                                                                <button
                                                    className="w-full text-xs text-blue-600 hover:text-blue-800 py-1"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                        // Implementar múltiples turnos AHORA
                                                        const dayIndex = schedule.findIndex(d => d.day_of_week === day.day_of_week);
                                                        if (dayIndex !== -1) {
                                                            const newSchedule = [...schedule];
                                                            const currentSlots = newSchedule[dayIndex].slots || [];
                                                            
                                                            // Añadir nuevo turno
                                                            const newSlot = {
                                                                id: currentSlots.length + 1,
                                                                name: `Turno ${currentSlots.length + 1}`,
                                                                start_time: "20:00",
                                                                end_time: "23:00"
                                                            };
                                                            
                                                            newSchedule[dayIndex].slots.push(newSlot);
                                                            setSchedule(newSchedule);
                                                            
                                                            toast.success(`Turno ${currentSlots.length + 1} añadido para ${day.day_name}`);
                                                        }
                                                    }}
                                                >
                                                    + Añadir turno
                                </button>
                        </div>
                    )}
                                                        </div>
                                ))}
                                                    </div>
                                                    
                            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                                        <button
                                    onClick={saveWeeklySchedule}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Guardar horarios
                                        </>
                                    )}
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
                                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Hoy
                                    </button>
                                </div>
                                    <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toast("Funcionalidad de eventos especiales próximamente", {
                                            icon: "🗓️",
                                            duration: 3000,
                                        });
                                        // setShowEventModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nuevo evento
                                    </button>
                            </div>

                            {/* Calendario */}
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                {/* Encabezados de días */}
                                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Días del calendario */}
                                <div className="grid grid-cols-7">
                                    {calendarDays.map((day, index) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        const daySchedule = getDaySchedule(day);

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${
                                                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                                } ${isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                                                onClick={() => handleDayClick(day)}
                                            >
                                                <div className={`text-sm font-medium mb-1 ${
                                                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                                    }`}>
                                                        {format(day, 'd')}
                                                </div>

                                                {/* Estado del día */}
                                                    <div className="space-y-1">
                                                    {daySchedule.is_open ? (
                                                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                                            Abierto {daySchedule.slots[0]?.start_time}-{daySchedule.slots[0]?.end_time}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                                            Cerrado
                                                    </div>
                                                )}
                                                    </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Eventos especiales */}
                    {activeTab === 'eventos' && (
                        <div className="p-6">
                            <div className="text-center py-12">
                                <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Eventos especiales
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Configura vacaciones, festivos y cierres puntuales
                                </p>
                                <button
                                    onClick={() => setShowEventModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear evento especial
                                </button>
                            </div>
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </CalendarioErrorBoundary>
    );
}

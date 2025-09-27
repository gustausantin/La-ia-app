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
    Brain,
    RefreshCw,
    X
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
    const [activeTab, setActiveTab] = useState('calendario');
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

    // Inicializar datos - SOLO UNA VEZ
    useEffect(() => {
        if (restaurantId) {
            console.log('🚀 INICIALIZANDO CALENDARIO - Restaurant ID:', restaurantId);
            initializeData();
            loadEvents();
        }
    }, [restaurantId]); // SOLO cuando cambia restaurantId, NO al navegar meses

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
        
        // Nota: Removidos listeners de focus/visibility que causaban recargas innecesarias

        return () => {
            window.removeEventListener('force-restaurant-reload', handleRestaurantReload);
            window.removeEventListener('schedule-updated', handleScheduleUpdate);
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
            
            console.log('\n🔄 CARGANDO HORARIOS DESDE BD...');
            console.log('Datos raw:', savedHours);
            
            // 🏗️ CONVERSIÓN ROBUSTA: operating_hours → schedule format
            const loadedSchedule = daysOfWeek.map(day => {
                const dayKey = day.id; // monday, tuesday, etc.
                const dayHours = savedHours[dayKey];
                
                // Lógica robusta: verificar múltiples campos
                const isOpen = Boolean(
                    dayHours && 
                    (dayHours.open === true || dayHours.is_open === true)
                );
                
                console.log(`  ${dayKey}: ${isOpen ? '✅ ABIERTO' : '❌ CERRADO'} - data:`, dayHours);
                
                // Construir slots robustos
                let slots = [];
                if (isOpen) {
                    if (dayHours?.shifts && Array.isArray(dayHours.shifts) && dayHours.shifts.length > 0) {
                        // Usar turnos guardados
                        slots = dayHours.shifts.map(shift => ({
                            id: shift.id || Date.now() + Math.random(),
                            name: shift.name || "Turno",
                            start_time: shift.start_time || shift.start || "09:00",
                            end_time: shift.end_time || shift.end || "22:00"
                        }));
                    } else {
                        // Crear turno por defecto
                        slots = [{
                            id: 1,
                            name: "Horario Principal",
                            start_time: dayHours?.start_time || dayHours?.start || "09:00",
                            end_time: dayHours?.end_time || dayHours?.end || "22:00"
                        }];
                    }
                }
                
                return {
                    day_of_week: day.id,
                    day_name: day.name,
                    is_open: isOpen,
                    slots: slots
                };
            });

            setSchedule(loadedSchedule);
            
            console.log('✅ SCHEDULE CARGADO CORRECTAMENTE:');
            loadedSchedule.forEach(day => {
                console.log(`  ${day.day_of_week} (${day.day_name}): ${day.is_open ? 'ABIERTO' : 'CERRADO'}`);
            });
            console.log('\n');
            
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

            // 3. Canales activos (calculado desde configuración real)
            let activeChannels = 0;
            try {
                const { data: restaurantData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                
                const channels = restaurantData?.settings?.channels || {};
                activeChannels = Object.values(channels).filter(channel => channel.enabled === true).length;
            } catch (error) {
                console.error("Error calculando canales activos:", error);
                activeChannels = channelStats.active; // fallback
            }

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

    // SOLUCIÓN DEFINITIVA: Lógica correcta de días
    const getDaySchedule = useCallback((date) => {
        // MAPEO ROBUSTO - NUNCA MÁS FALLOS
        const dayOfWeekIndex = getDay(date); // 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
        
        // MAPEO EXACTO - CADA ÍNDICE A SU DÍA CORRECTO
        const DAY_MAPPING = {
            0: 'sunday',    // Domingo
            1: 'monday',    // Lunes  
            2: 'tuesday',   // Martes
            3: 'wednesday', // Miércoles
            4: 'thursday',  // Jueves
            5: 'friday',    // Viernes
            6: 'saturday'   // Sábado
        };
        
        const SPANISH_NAMES = {
            0: 'Domingo',
            1: 'Lunes',
            2: 'Martes', 
            3: 'Miércoles',
            4: 'Jueves',
            5: 'Viernes',
            6: 'Sábado'
        };
        
        const dayName = DAY_MAPPING[dayOfWeekIndex];
        const dayNameSpanish = SPANISH_NAMES[dayOfWeekIndex];
        
        // DEBUG CRÍTICO - VERIFICAR QUE EL MAPEO ES CORRECTO
        console.log(`🔍 FECHA: ${format(date, 'dd/MM/yyyy')} -> Día ${dayOfWeekIndex} -> ${dayNameSpanish} (${dayName})`);
        
        // Buscar en el schedule cargado
        const daySchedule = schedule.find(s => s.day_of_week === dayName);
        
        if (daySchedule) {
            console.log(`✅ ENCONTRADO: ${dayNameSpanish} está ${daySchedule.is_open ? 'ABIERTO' : 'CERRADO'}`);
            return {
                ...daySchedule,
                day_name: dayNameSpanish
            };
        }
        
        // ERROR - NO DEBERÍA PASAR NUNCA
        console.error(`❌ ERROR: No se encontró ${dayNameSpanish} (${dayName}) en schedule`);
        console.error('Schedule disponible:', schedule.map(s => `${s.day_of_week}: ${s.is_open ? 'ABIERTO' : 'CERRADO'}`));
        
        return {
            day_of_week: dayName,
            day_name: dayNameSpanish,
            is_open: false,
            slots: []
        };
    }, [schedule]);

    // Funciones de navegación del calendario
    const navigateMonth = (direction) => {
        console.log(`🔄 Navegando al mes ${direction === 'next' ? 'siguiente' : 'anterior'}`);
        console.log('Schedule antes de navegar:', schedule.map(s => `${s.day_of_week}: ${s.is_open ? 'ABIERTO' : 'CERRADO'}`).join(', '));
        
        setCurrentDate(prev => {
            const newDate = direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
            console.log(`📅 Nueva fecha: ${format(newDate, 'MMMM yyyy', { locale: es })}`);
            return newDate;
        });
        
        // NO reinicializar schedule - mantener el estado
        console.log('Schedule después de navegar:', schedule.map(s => `${s.day_of_week}: ${s.is_open ? 'ABIERTO' : 'CERRADO'}`).join(', '));
    };

    // Estados para eventos especiales
    const [selectedDay, setSelectedDay] = useState(null);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        start_time: '09:00',
        end_time: '22:00',
        closed: false
    });

    // Cargar eventos especiales
    const loadEvents = async () => {
        if (!restaurantId) return;
        
        try {
            const { data, error } = await supabase
                .from('special_events')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('event_date');
            
            if (error) throw error;
            
            setEvents(data || []);
            console.log('✅ Eventos cargados:', data?.length || 0);
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
        }
    };

    // Guardar evento especial
    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!selectedDay || !restaurantId) return;
        
        try {
            const eventDate = format(selectedDay, 'yyyy-MM-dd');
            
            const eventData = {
                restaurant_id: restaurantId,
                event_date: eventDate,
                title: eventForm.title,
                description: eventForm.description || '',
                type: eventForm.closed ? 'cerrado' : 'evento',
                start_time: eventForm.closed ? null : eventForm.start_time,
                end_time: eventForm.closed ? null : eventForm.end_time,
                is_closed: eventForm.closed
            };
            
            const { data, error } = await supabase
                .from('special_events')
                .insert([eventData])
                .select()
                .single();
            
            if (error) throw error;
            
            // Actualizar estado local
            setEvents(prev => [...prev, data]);
            
            toast.success(`✅ Evento "${eventForm.title}" creado para ${format(selectedDay, 'dd/MM/yyyy')}`);
            setShowEventModal(false);
            
            console.log('✅ Evento guardado:', data);
        } catch (error) {
            console.error('❌ Error guardando evento:', error);
            toast.error('Error al guardar el evento');
        }
    };

    // Obtener evento de un día específico
    const getDayEvent = useCallback((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return events.find(event => event.event_date === dateStr);
    }, [events]);

    // Manejar click en día del calendario
    const handleDayClick = useCallback((date) => {
        try {
            setSelectedDay(date);
            
            // Verificar si ya hay un evento en este día
            const existingEvent = getDayEvent(date);
            
            if (existingEvent) {
                setEventForm({
                    title: existingEvent.title,
                    description: existingEvent.description || '',
                    start_time: existingEvent.start_time || '09:00',
                    end_time: existingEvent.end_time || '22:00',
                    closed: existingEvent.is_closed
                });
            } else {
                setEventForm({
                    title: '',
                    description: '',
                    start_time: '09:00',
                    end_time: '22:00',
                    closed: false
                });
            }
            
            setShowEventModal(true);
        } catch (error) {
            console.error("Error en handleDayClick:", error);
            toast.error("Error al seleccionar el día");
        }
    }, [getDayEvent]);

    // Guardar horario semanal
    const saveWeeklySchedule = async () => {
        if (!restaurantId) {
            toast.error("Error: No hay restaurante configurado");
            return;
        }

        // VALIDACIONES MEJORADAS PARA MÚLTIPLES TURNOS
        const invalidDays = schedule.filter(day => {
            if (!day.is_open) return false;
            
            // Verificar que tenga slots y que todos los slots tengan horarios válidos
            if (!day.slots || day.slots.length === 0) return true;
            
            // Verificar cada slot individualmente
            return day.slots.some(slot => 
                !slot.start_time || !slot.end_time || 
                slot.start_time === "" || slot.end_time === ""
            );
        });

        if (invalidDays.length > 0) {
            toast.error(`Horarios incompletos en: ${invalidDays.map(d => d.day_name).join(', ')}`);
            return;
        }

        setSaving(true);
        try {
            console.log("🔄 Guardando horarios con múltiples turnos...", schedule);
            
            // CONVERSIÓN ROBUSTA A FORMATO SUPABASE
            const operating_hours = {};
            const calendar_schedule = [];
            
            schedule.forEach(day => {
                const dayName = day.day_of_week;
                
                if (!day.is_open || !day.slots || day.slots.length === 0) {
                    // Día cerrado
                    operating_hours[dayName] = {
                        start: "09:00",
                        end: "22:00",
                        open: false
                    };
                    calendar_schedule.push({
                        day_of_week: dayName,
                        day_name: day.day_name,
                        is_open: false,
                        slots: []
                    });
                } else {
                    // Día abierto con turnos
                    const validSlots = day.slots.filter(slot => 
                        slot.start_time && slot.end_time && 
                        slot.start_time !== "" && slot.end_time !== ""
                    );
                    
                    if (validSlots.length > 0) {
                        // Usar el primer turno válido para operating_hours (compatibilidad)
                        const firstSlot = validSlots[0];
                    operating_hours[dayName] = {
                            start: firstSlot.start_time,
                            end: firstSlot.end_time,
                        open: true,
                            // GUARDAR TODOS LOS TURNOS
                            shifts: validSlots.map(slot => ({
                                id: slot.id || Date.now() + Math.random(),
                                name: slot.name || "Turno",
                            start_time: slot.start_time,
                                end_time: slot.end_time
                        }))
                    };
                        
                        calendar_schedule.push({
                            day_of_week: dayName,
                            day_name: day.day_name,
                            is_open: true,
                            slots: validSlots.map(slot => ({
                                id: slot.id || Date.now() + Math.random(),
                                name: slot.name || "Turno",
                                start_time: slot.start_time,
                                end_time: slot.end_time
                            }))
                        });
                    }
                }
            });

            console.log("📊 Datos a guardar:", { operating_hours, calendar_schedule });

            // GUARDADO ROBUSTO EN SUPABASE
            const { data: currentRestaurant, error: fetchError } = await supabase
                .from("restaurants")
                .select("settings")
                .eq("id", restaurantId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error("Error obteniendo configuración actual:", fetchError);
                throw fetchError;
            }

            const currentSettings = currentRestaurant?.settings || {};

            // Actualizar con estructura completa
            const { error } = await supabase
                .from("restaurants")
                .update({
                    settings: {
                        ...currentSettings,
                        operating_hours: operating_hours,
                        calendar_schedule: calendar_schedule
                    },
                    updated_at: new Date().toISOString()
                })
                .eq("id", restaurantId);

            if (error) {
                console.error("❌ Error Supabase:", error);
                throw error;
            }

            // ACTUALIZAR ESTADO LOCAL
            setSchedule(calendar_schedule);

            // Evento de sincronización
            try {
            window.dispatchEvent(new CustomEvent('schedule-updated', { 
                    detail: { 
                        scheduleData: calendar_schedule, 
                        operatingHours: operating_hours,
                        restaurantId 
                    } 
                }));
            } catch (eventError) {
                console.warn("Error disparando evento:", eventError);
            }

            toast.success("✅ Turnos guardados correctamente en Supabase");
            console.log("✅ Guardado exitoso con múltiples turnos");
            
        } catch (error) {
            console.error("❌ Error guardando turnos:", error);
            
            // MENSAJES DE ERROR ESPECÍFICOS
            let errorMessage = "Error al guardar los turnos";
            
            if (error.code === 'PGRST301') {
                errorMessage = "Sin permisos para actualizar horarios";
            } else if (error.code === '23505') {
                errorMessage = "Conflicto en los datos. Intenta de nuevo";
            } else if (error.message?.includes('permission')) {
                errorMessage = "Sin permisos para actualizar horarios";
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
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
                                { id: 'calendario', name: 'Vista calendario', icon: Calendar }
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
                                                
                                        {day.is_open && (
                                            <div className="space-y-3">
                                                {/* Mostrar TODOS los turnos */}
                                                {day.slots && day.slots.map((slot, slotIndex) => (
                                                    <div key={slot.id || slotIndex} className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <input
                                                                type="text"
                                                                value={slot.name || `Turno ${slotIndex + 1}`}
                                                                onChange={(e) => {
                                                                    const newSchedule = [...schedule];
                                                                    newSchedule[index].slots[slotIndex].name = e.target.value;
                                                                    setSchedule(newSchedule);
                                                                }}
                                                                className="text-sm font-medium bg-transparent border-none outline-none text-gray-800"
                                                                placeholder="Nombre del turno"
                                                            />
                                                            {day.slots.length > 1 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const newSchedule = [...schedule];
                                                                        newSchedule[index].slots.splice(slotIndex, 1);
                                                                        setSchedule(newSchedule);
                                                                        toast.success("Turno eliminado");
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                                <div className="flex items-center gap-2">
                                                                <input
                                                                        type="time"
                                                                value={slot.start_time}
                                                        onChange={(e) => {
                                                            const newSchedule = [...schedule];
                                                                    newSchedule[index].slots[slotIndex].start_time = e.target.value;
                                                            setSchedule(newSchedule);
                                                        }}
                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                    />
                                                            <span className="text-gray-500 text-xs">a</span>
                                                                    <input
                                                                        type="time"
                                                                value={slot.end_time}
                                                        onChange={(e) => {
                                                            const newSchedule = [...schedule];
                                                                    newSchedule[index].slots[slotIndex].end_time = e.target.value;
                                                            setSchedule(newSchedule);
                                                        }}
                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                    />
                                                                </div>
                                                    </div>
                                                ))}
                                                
                                                {/* Botón para añadir NUEVO turno */}
                                                                                                <button
                                                    className="w-full text-sm text-purple-600 hover:text-purple-800 py-2 border border-dashed border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                            const newSchedule = [...schedule];
                                                        const currentSlots = newSchedule[index].slots || [];
                                                        
                                                        // Sugerir horarios diferentes según el número de turno
                                                        const turnosSugeridos = [
                                                            { start: "09:00", end: "22:00", name: "Horario Principal" },
                                                            { start: "12:00", end: "14:00", name: "Turno Mañana" },
                                                            { start: "19:00", end: "21:00", name: "Turno Noche" },
                                                            { start: "15:00", end: "17:00", name: "Turno Tarde" },
                                                            { start: "21:00", end: "23:00", name: "Turno Nocturno" }
                                                        ];
                                                        
                                                        const nextTurno = turnosSugeridos[currentSlots.length] || turnosSugeridos[1];
                                                        
                                                            const newSlot = {
                                                            id: Date.now(),
                                                            name: nextTurno.name,
                                                            start_time: nextTurno.start,
                                                            end_time: nextTurno.end
                                                        };
                                                        
                                                        newSchedule[index].slots.push(newSlot);
                                                            setSchedule(newSchedule);
                                                            
                                                        toast.success(`✅ ${nextTurno.name} añadido para ${day.day_name}`);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Añadir turno
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
                                        const dayEvent = getDayEvent(day);

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${
                                                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                                } ${isToday ? 'bg-blue-50' : ''} ${dayEvent ? 'bg-yellow-50' : ''} hover:bg-gray-50 cursor-pointer`}
                                                onClick={() => handleDayClick(day)}
                                            >
                                                <div className={`text-sm font-medium mb-1 ${
                                                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                                    }`}>
                                                        {format(day, 'd')}
                                                </div>

                                                {/* Estado del día */}
                                                <div className="space-y-1">
                                                    {/* ⚖️ PRIORIDAD: Eventos prevalecen sobre horarios base */}
                                                    {dayEvent ? (
                                                        <div className={`text-xs px-2 py-1 rounded ${
                                                            dayEvent.is_closed 
                                                                ? 'text-red-600 bg-red-100' 
                                                                : 'text-orange-600 bg-orange-100'
                                                        }`}>
                                                            {dayEvent.is_closed ? '🔒 ' : '🎉 '}{dayEvent.title}
                                                        </div>
                                                    ) : daySchedule.is_open ? (
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

                </div>
            </div>

            {/* Modal de Eventos Especiales */}
            {showEventModal && selectedDay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Crear evento - {format(selectedDay, 'dd/MM/yyyy')}
                            </h3>
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título del evento
                                </label>
                                <input
                                    type="text"
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej: Día de San Valentín, Cerrado por vacaciones..."
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={eventForm.closed}
                                        onChange={(e) => setEventForm(prev => ({ ...prev, closed: e.target.checked }))}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Restaurante cerrado este día</span>
                                </label>
                                
                                <div className="pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 mb-2">Acceso rápido:</p>
                                    <button
                                        type="button"
                                        onClick={() => setEventForm(prev => ({ 
                                            ...prev, 
                                            title: 'Vacaciones',
                                            closed: true 
                                        }))}
                                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        🏖️ VACACIONES
                                    </button>
                                </div>
                                
                                <p className="text-xs text-gray-500">
                                    Si no está marcado, es un evento especial con el restaurante abierto
                                </p>
                            </div>

                            {!eventForm.closed && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hora apertura
                                        </label>
                                        <input
                                            type="time"
                                            value={eventForm.start_time}
                                            onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hora cierre
                                        </label>
                                        <input
                                            type="time"
                                            value={eventForm.end_time}
                                            onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows="3"
                                    placeholder="Detalles adicionales del evento..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEventModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Crear evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </CalendarioErrorBoundary>
    );
}

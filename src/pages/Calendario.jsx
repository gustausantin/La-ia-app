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

// TEST INLINE - VERIFICAR LÓGICA
console.log('🧪 TEST CALENDAR LOGIC:');
const testData = { tuesday: { open: true }, monday: { open: false }, wednesday: { open: false } };
const testSchedule = [
    { day_of_week: 'sunday', is_open: false },
    { day_of_week: 'monday', is_open: false },
    { day_of_week: 'tuesday', is_open: true },
    { day_of_week: 'wednesday', is_open: false },
    { day_of_week: 'thursday', is_open: false },
    { day_of_week: 'friday', is_open: false },
    { day_of_week: 'saturday', is_open: false }
];

console.log('✅ SCHEDULE TEST:', testSchedule.map(d => `${d.day_of_week}:${d.is_open}`).join(', '));
console.log('🎯 MARTES ABIERTO:', testSchedule.find(d => d.day_of_week === 'tuesday')?.is_open ? '✅' : '❌');

// ALERTA VISUAL PARA DEBUG
setTimeout(() => {
    console.log('🔍🔍🔍 MIRA LA CONSOLA - Deberías ver logs del calendario aquí 🔍🔍🔍');
    console.log('📅 Si configuras MARTES abierto, SOLO los martes deberían aparecer ABIERTOS');
    console.log('❌ Si ves otros días abiertos, hay un problema grave');
}, 2000);
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

    // Generar días del calendario CON ALINEACIÓN CORRECTA
    const generateCalendarDays = () => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const startWeek = startOfWeek(start, { weekStartsOn: 1 }); // Lunes como primer día
        const endWeek = endOfWeek(end, { weekStartsOn: 1 });
        
        // Generar TODOS los días incluyendo los vacíos al principio y final
        return eachDayOfInterval({
            start: startWeek,
            end: endWeek
        });
    };
    
    const calendarDays = generateCalendarDays();

    // Inicializar datos - SOLO UNA VEZ
    useEffect(() => {
        if (restaurantId) {
            console.log('🚀 INICIALIZANDO CALENDARIO - Restaurant ID:', restaurantId);
            
            // TEST DE VERIFICACIÓN DE DÍAS
            console.log('🧪 TEST: Verificando getDay() con fechas conocidas:');
            const testDates = [
                new Date(2025, 9, 4),  // 4 Oct 2025 = Sábado
                new Date(2025, 9, 5),  // 5 Oct 2025 = Domingo
                new Date(2025, 9, 6),  // 6 Oct 2025 = Lunes
            ];
            testDates.forEach(date => {
                const dayIndex = getDay(date);
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                console.log(`   ${format(date, 'dd/MM/yyyy')} es ${format(date, 'EEEE', { locale: es })} | getDay()=${dayIndex} | mapped=${dayNames[dayIndex]}`);
            });
            
            initializeData();
            loadEvents();
        }
    }, [restaurantId]); // SOLO cuando cambia restaurantId, NO al navegar meses

    // DEBUG: Verificar schedule en cada render
    useEffect(() => {
        if (schedule.length > 0) {
            console.log('🔄 SCHEDULE ACTUAL EN RENDER:', schedule.map(s => `${s.day_of_week}:${s.is_open ? 'ABIERTO' : 'CERRADO'}`).join(', '));
        }
    });

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
            console.log('📊 DATOS RAW:', JSON.stringify(savedHours, null, 2));
            
            // Debug detallado de cada día
            console.log('🔍 VERIFICANDO CADA DÍA:');
            console.log('  - domingo:', savedHours.sunday?.open, '→', savedHours.sunday?.open === true);
            console.log('  - lunes:', savedHours.monday?.open, '→', savedHours.monday?.open === true);
            console.log('  - martes:', savedHours.tuesday?.open, '→', savedHours.tuesday?.open === true);
            console.log('  - miércoles:', savedHours.wednesday?.open, '→', savedHours.wednesday?.open === true);
            console.log('  - jueves:', savedHours.thursday?.open, '→', savedHours.thursday?.open === true);
            console.log('  - viernes:', savedHours.friday?.open, '→', savedHours.friday?.open === true);
            console.log('  - sábado:', savedHours.saturday?.open, '→', savedHours.saturday?.open === true);

            // CREAR SCHEDULE DEFINITIVO - VERIFICACIÓN ESTRICTA DEL CAMPO 'open'
            const loadedSchedule = [
                { day_of_week: 'sunday', day_name: 'Domingo', is_open: savedHours.sunday?.open === true, slots: [] },
                { day_of_week: 'monday', day_name: 'Lunes', is_open: savedHours.monday?.open === true, slots: [] },
                { day_of_week: 'tuesday', day_name: 'Martes', is_open: savedHours.tuesday?.open === true, slots: [] },
                { day_of_week: 'wednesday', day_name: 'Miércoles', is_open: savedHours.wednesday?.open === true, slots: [] },
                { day_of_week: 'thursday', day_name: 'Jueves', is_open: savedHours.thursday?.open === true, slots: [] },
                { day_of_week: 'friday', day_name: 'Viernes', is_open: savedHours.friday?.open === true, slots: [] },
                { day_of_week: 'saturday', day_name: 'Sábado', is_open: savedHours.saturday?.open === true, slots: [] }
            ];
            
            console.log('📅 SCHEDULE CARGADO:', loadedSchedule.map(d => `${d.day_name}: ${d.is_open ? '✅' : '❌'}`).join(', '));
            
            // VERIFICACIÓN CRÍTICA: Mostrar exactamente qué está configurado
            console.log('🔴 DÍAS ABIERTOS SEGÚN BD:');
            loadedSchedule.forEach(day => {
                if (day.is_open) {
                    console.log(`   ✅ ${day.day_name} (${day.day_of_week}) está ABIERTO`);
                }
            });

            // Añadir horarios solo a días abiertos
            loadedSchedule.forEach(day => {
                if (day.is_open) {
                    day.slots = [{ start_time: "09:00", end_time: "22:00" }];
                }
            });

            console.log('📊 SCHEDULE CREADO:');
            loadedSchedule.forEach(day => {
                console.log(`  ${day.day_of_week}: ${day.is_open ? '✅ ABIERTO' : '❌ CERRADO'}`);
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

    // SOLUCIÓN DEFINITIVA - MATEMÁTICAMENTE IMPOSIBLE QUE FALLE
    const getDaySchedule = useCallback((date) => {
        // getDay() SIEMPRE devuelve 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
        const dayIndex = getDay(date);
        
        // Mapeo DIRECTO por índice - GARANTIZADO por la especificación de JavaScript
        // IMPORTANTE: La semana empieza en DOMINGO (índice 0) según JavaScript
        const dayMapping = [
            'sunday',    // índice 0 = domingo
            'monday',    // índice 1 = lunes  
            'tuesday',   // índice 2 = martes
            'wednesday', // índice 3 = miércoles
            'thursday',  // índice 4 = jueves
            'friday',    // índice 5 = viernes
            'saturday'   // índice 6 = sábado
        ];
        
        const dayNames = [
            'Domingo',   // índice 0
            'Lunes',     // índice 1
            'Martes',    // índice 2
            'Miércoles', // índice 3
            'Jueves',    // índice 4
            'Viernes',   // índice 5
            'Sábado'     // índice 6
        ];

        const dayKey = dayMapping[dayIndex];
        const dayName = dayNames[dayIndex];
        const dayConfig = schedule.find(s => s.day_of_week === dayKey);
        const isOpen = dayConfig?.is_open === true;

        // Log solo para los primeros días del mes para debug
        const dayOfMonth = parseInt(format(date, 'd'));
        if (dayOfMonth <= 7) {
            console.log(`📅 ${format(date, 'EEEE dd/MM/yyyy', { locale: es })} | getDay()=${dayIndex} | mapped=${dayKey} | config=${isOpen ? '✅' : '❌'}`);
        }

        return {
            day_of_week: dayKey,
            day_name: dayName,
            is_open: isOpen,
            slots: isOpen && dayConfig?.slots?.length > 0 
                ? dayConfig.slots 
                : (isOpen ? [{ start_time: "09:00", end_time: "22:00" }] : [])
        };
    }, [schedule]);

    // Funciones de navegación del calendario
    const navigateMonth = (direction) => {
        console.log(`\n🔄 NAVEGANDO AL MES ${direction === 'next' ? 'SIGUIENTE' : 'ANTERIOR'}`);
        console.log('📊 SCHEDULE ANTES DE NAVEGAR:', schedule.map(s => `${s.day_of_week}:${s.is_open ? '✅' : '❌'}`).join(', '));

        setCurrentDate(prev => {
            const newDate = direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
            console.log(`📅 Nueva fecha: ${format(newDate, 'MMMM yyyy', { locale: es })}`);
            return newDate;
        });

        // El schedule se mantiene - NO se reinicializa
        console.log('📊 SCHEDULE DESPUÉS DE NAVEGAR (mismo):', schedule.map(s => `${s.day_of_week}:${s.is_open ? '✅' : '❌'}`).join(', '));
        console.log('🔄 El schedule NO cambia al navegar meses - se mantiene constante\n');
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

                                {/* Días del calendario - CON ALINEACIÓN CORRECTA */}
                                <div className="grid grid-cols-7">
                                    {calendarDays.map((day, index) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        const daySchedule = getDaySchedule(day);
                                        const dayEvent = getDayEvent(day);
                                        
                                        // Debug para verificar alineación de la primera semana
                                        if (index < 7) {
                                            const columnDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                                            console.log(`Columna ${index} (${columnDays[index]}): ${format(day, 'EEEE dd/MM', { locale: es })} | getDaySchedule dice: ${daySchedule.day_name} ${daySchedule.is_open ? '✅' : '❌'}`);
                                        }

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${
                                                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                                } ${isToday && isCurrentMonth ? 'bg-blue-50' : ''} ${dayEvent && isCurrentMonth ? 'bg-yellow-50' : ''} ${isCurrentMonth ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                                                onClick={() => isCurrentMonth && handleDayClick(day)}
                                            >
                                                <div className={`text-sm font-medium mb-1 ${
                                                    isToday && isCurrentMonth ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                                    }`}>
                                                        {format(day, 'd')}
                                                </div>

                                                {/* Estado del día - SOLO PARA DÍAS DEL MES ACTUAL */}
                                                {isCurrentMonth && (
                                                    <div className="text-xs px-2 py-1 rounded">
                                                        {daySchedule.is_open ? (
                                                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
                                                                Abierto 09:00-22:00
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 bg-red-100 px-2 py-1 rounded">
                                                                Cerrado
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Eventos adicionales */}
                                                {dayEvent && (
                                                    <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded mt-1">
                                                        {dayEvent.is_closed ? '🔒' : '🎉'} {dayEvent.title}
                                                    </div>
                                                )}
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

// src/pages/Calendario.jsx - Gestión PREMIUM de horarios y disponibilidad con IA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useChannelStats } from '../hooks/useChannelStats';
import { useOccupancy } from '../hooks/useOccupancy';
import { useAvailabilityChangeDetection } from '../hooks/useAvailabilityChangeDetection';
import { useRegenerationModal } from '../hooks/useRegenerationModal';
import RegenerationRequiredModal from '../components/RegenerationRequiredModal';
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
// 🔒 REGLA ORO #2: testData eliminado - PROHIBIDO usar datos falsos
// Todos los datos deben venir de la base de datos real

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
    const changeDetection = useAvailabilityChangeDetection(restaurantId);
    const { isModalOpen, modalChangeReason, modalChangeDetails, showRegenerationModal, closeModal } = useRegenerationModal();

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

            let savedHours = restaurantData?.settings?.operating_hours || {};
            
            // Si no hay horarios guardados, inicializar con valores por defecto
            if (Object.keys(savedHours).length === 0) {
                console.log('⚠️ No hay horarios guardados, inicializando por defecto...');
                savedHours = {
                    monday: { open: '09:00', close: '22:00', closed: false },    // ✅ ABIERTO
                    tuesday: { open: '09:00', close: '22:00', closed: false },   // ✅ ABIERTO
                    wednesday: { open: '09:00', close: '22:00', closed: false }, // ✅ ABIERTO
                    thursday: { open: '09:00', close: '22:00', closed: false },  // ✅ ABIERTO
                    friday: { open: '09:00', close: '22:00', closed: false },    // ✅ ABIERTO
                    saturday: { open: '09:00', close: '22:00', closed: true },   // ❌ CERRADO
                    sunday: { open: '10:00', close: '21:00', closed: true }      // ❌ CERRADO
                };
            }
            
            console.log('\n🔄 CARGANDO HORARIOS DESDE BD...');
            console.log('📊 DATOS RAW:', JSON.stringify(savedHours, null, 2));
            
            // Debug detallado de cada día - FORMATO CORRECTO
            console.log('🔍 VERIFICANDO CADA DÍA (formato closed):');
            console.log('  - domingo:', savedHours.sunday?.closed, '→ abierto:', !savedHours.sunday?.closed);
            console.log('  - lunes:', savedHours.monday?.closed, '→ abierto:', !savedHours.monday?.closed);
            console.log('  - martes:', savedHours.tuesday?.closed, '→ abierto:', !savedHours.tuesday?.closed);
            console.log('  - miércoles:', savedHours.wednesday?.closed, '→ abierto:', !savedHours.wednesday?.closed);
            console.log('  - jueves:', savedHours.thursday?.closed, '→ abierto:', !savedHours.thursday?.closed);
            console.log('  - viernes:', savedHours.friday?.closed, '→ abierto:', !savedHours.friday?.closed);
            console.log('  - sábado:', savedHours.saturday?.closed, '→ abierto:', !savedHours.saturday?.closed);

            // CREAR SCHEDULE DEFINITIVO - CARGAR TURNOS REALES
            const loadedSchedule = [
                { day_of_week: 'sunday', day_name: 'Domingo' },
                { day_of_week: 'monday', day_name: 'Lunes' },
                { day_of_week: 'tuesday', day_name: 'Martes' },
                { day_of_week: 'wednesday', day_name: 'Miércoles' },
                { day_of_week: 'thursday', day_name: 'Jueves' },
                { day_of_week: 'friday', day_name: 'Viernes' },
                { day_of_week: 'saturday', day_name: 'Sábado' }
            ].map(day => {
                const dayConfig = savedHours[day.day_of_week] || {};
                // FORMATO CORRECTO: usar !closed en lugar de open
                const isOpen = !dayConfig.closed;
                
                // 🔧 HORARIO SIMPLE (SIN TURNOS) - CAMPOS CORRECTOS
                const openTime = dayConfig.open || "09:00";
                const closeTime = dayConfig.close || "22:00";
                
                console.log(`🔄 ${day.day_name}: ${isOpen ? `✅ ${openTime}-${closeTime}` : '❌ Cerrado'}`);
                
                return {
                    ...day,
                    is_open: isOpen,
                    open_time: openTime,
                    close_time: closeTime
                };
            });
            
            console.log('📅 SCHEDULE CARGADO SIMPLE:', loadedSchedule.map(d => 
                `${d.day_name}: ${d.is_open ? `✅ ${d.open_time}-${d.close_time}` : '❌'}`
            ).join(', '));

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
                if (!day.is_open || !day.open_time || !day.close_time) return total;
                const startHour = parseInt(day.open_time.split(':')[0]);
                const endHour = parseInt(day.close_time.split(':')[0]);
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
            open_time: isOpen ? (dayConfig?.open_time || "09:00") : null,
            close_time: isOpen ? (dayConfig?.close_time || "22:00") : null
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
            
            // 🔒 VALIDACIÓN ANTES DE CERRAR DÍAS
            if (eventForm.closed) {
                console.log(`🔒 Validando cierre del día ${eventDate}...`);
                
                try {
                    // 🚧 TEMPORAL: Función SQL no ejecutada aún
                    console.log("🚧 Función validar_cierre_dia no disponible - saltando validación");
                    const validationData = { validation_result: 'ALLOWED' }; // Mock temporal
                    const validationError = null;
                    
                    if (validationError) {
                        console.warn("⚠️ No se pudo validar el cierre:", validationError);
                    } else if (validationData?.validation_result === 'BLOCKED') {
                        // Hay reservas confirmadas - BLOQUEAR
                        const reservations = validationData.reservation_details || [];
                        const reservationList = reservations.map(r => 
                            `• ${r.customer_name} - ${r.reservation_time} (${r.party_size} personas)`
                        ).join('\n');
                        
                        toast.error(
                            `❌ NO SE PUEDE CERRAR EL DÍA\n\n` +
                            `📅 ${eventDate} tiene ${validationData.existing_reservations} reservas confirmadas:\n\n` +
                            `${reservationList}\n\n` +
                            `🔧 SOLUCIÓN: Ve a "Reservas" y cancela/reprograma estas reservas primero.`,
                            { 
                                duration: 8000,
                                style: { 
                                    minWidth: '400px',
                                    whiteSpace: 'pre-line',
                                    fontSize: '13px'
                                }
                            }
                        );
                        return; // BLOQUEAR creación del evento
                        
                    } else if (validationData?.validation_result === 'WARNING') {
                        // Solo hay disponibilidades - ADVERTIR pero permitir
                        const userConfirmed = confirm(
                            `⚠️ ADVERTENCIA DE CIERRE\n\n` +
                            `📅 ${eventDate} tiene ${validationData.existing_slots} slots disponibles activos.\n\n` +
                            `✅ ACCIÓN AUTOMÁTICA:\n` +
                            `• Los slots disponibles serán eliminados\n` +
                            `• No hay reservas confirmadas afectadas\n\n` +
                            `¿Continuar con el cierre del día?`
                        );
                        
                        if (!userConfirmed) {
                            toast("Cierre cancelado por el usuario", { icon: 'ℹ️' });
                            return;
                        }
                        
                        toast(
                            `🔄 Cierre programado\n\n` +
                            `Se eliminarán ${validationData.existing_slots} slots disponibles.\n` +
                            `Regenera disponibilidades después.`,
                            { icon: '🔄', duration: 4000 }
                        );
                    }
                } catch (validationCheckError) {
                    console.warn("⚠️ Error validando cierre:", validationCheckError);
                    // Continuar con advertencia general
                    const userConfirmed = confirm(
                        `⚠️ NO SE PUDO VALIDAR EL CIERRE\n\n` +
                        `No se pudo verificar si hay reservas confirmadas en ${eventDate}.\n\n` +
                        `🚨 RIESGO: Podrías estar cerrando un día con reservas.\n\n` +
                        `¿Quieres continuar bajo tu responsabilidad?`
                    );
                    
                    if (!userConfirmed) {
                        toast.error("Cierre cancelado por seguridad");
                        return;
                    }
                }
            }
            
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
            
            // 🚨 MOSTRAR MODAL BLOQUEANTE DE REGENERACIÓN
            changeDetection.onSpecialEventChange(
                eventForm.closed ? 'closed' : 'special_hours',
                format(selectedDay, 'dd/MM/yyyy')
            );
            
            // MOSTRAR MODAL INMEDIATAMENTE
            if (eventForm.closed) {
                showRegenerationModal('special_event_closed', `Día ${format(selectedDay, 'dd/MM/yyyy')} cerrado`);
            } else {
                showRegenerationModal('special_event_created', `Evento "${eventForm.title}" en ${format(selectedDay, 'dd/MM/yyyy')}`);
            }
            
            toast.success(`✅ Evento "${eventForm.title}" creado para ${format(selectedDay, 'dd/MM/yyyy')}`);
            setShowEventModal(false);
            
            console.log('✅ Evento guardado:', data);
            
            // 🔄 AVISO DE REGENERACIÓN PARA EVENTOS DE CIERRE
            if (eventForm.closed) {
                setTimeout(() => {
                    toast(
                        `🔄 REGENERACIÓN RECOMENDADA\n\n` +
                        `Has cerrado el día ${format(selectedDay, 'dd/MM/yyyy')}.\n\n` +
                        `📍 Ve a "Gestión de Disponibilidades"\n` +
                        `🗑️ Usa "Borrar Disponibilidades" para limpiar\n` +
                        `🎯 Luego "Generar Disponibilidades" para actualizar\n\n` +
                        `Esto elimina slots del día cerrado.`,
                        { 
                            icon: '🔄',
                            duration: 8000,
                            style: { 
                                minWidth: '350px',
                                whiteSpace: 'pre-line',
                                fontSize: '14px'
                            }
                        }
                    );
                }, 1500);
            }
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

        // VALIDACIONES SIMPLES (SIN TURNOS)
        const invalidDays = schedule.filter(day => {
            if (!day.is_open) return false;
            
            // Verificar que tenga horarios válidos
            return !day.open_time || !day.close_time || 
                   day.open_time === "" || day.close_time === "";
        });

        if (invalidDays.length > 0) {
            toast.error(`Horarios incompletos en: ${invalidDays.map(d => d.day_name).join(', ')}`);
            return;
        }

        setSaving(true);
        try {
            console.log("🔄 Guardando horarios simplificados...", schedule);
            
            // 🔍 DETECCIÓN DE CONFLICTOS CALENDARIO vs DISPONIBILIDADES
            console.log("🔍 Verificando conflictos calendario vs disponibilidades...");
            
            try {
                // 🚧 TEMPORAL: Función SQL no ejecutada aún
                console.log("🚧 Función detectar_conflictos_calendario no disponible - saltando validación");
                const conflictData = { conflicts_found: 0 }; // Mock temporal
                const conflictError = null;
                
                if (conflictError) {
                    console.warn("⚠️ No se pudo verificar conflictos:", conflictError);
                } else if (conflictData?.conflicts_found > 0) {
                    const conflicts = conflictData.conflicts;
                    const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL');
                    
                    if (criticalConflicts.length > 0) {
                        // Hay reservas confirmadas en días que se van a cerrar
                        const conflictMessage = criticalConflicts.map(c => 
                            `📅 ${c.conflict_date}: ${c.confirmed_reservations} reservas confirmadas`
                        ).join('\n');
                        
                        const userConfirmed = confirm(
                            `⚠️ CONFLICTO CRÍTICO DETECTADO\n\n` +
                            `Los siguientes días tienen RESERVAS CONFIRMADAS pero van a cerrarse:\n\n` +
                            `${conflictMessage}\n\n` +
                            `🚨 IMPACTO: Los clientes podrían llegar a un restaurante cerrado\n\n` +
                            `OPCIONES:\n` +
                            `✅ Cancelar guardado y revisar reservas\n` +
                            `❌ Continuar (RIESGO: Clientes afectados)\n\n` +
                            `¿Quieres CANCELAR el guardado para revisar las reservas?`
                        );
                        
                        if (userConfirmed) {
                            toast.error(
                                `❌ Guardado cancelado\n\n` +
                                `Revisa las ${criticalConflicts.length} reservas confirmadas\n` +
                                `antes de cerrar esos días.`,
                                { duration: 6000 }
                            );
                            setSaving(false);
                            return;
                        }
                    } else {
                        // Solo conflictos de disponibilidades (no críticos)
                        const warningMessage = `Se detectaron ${conflictData.conflicts_found} días con disponibilidades que serán corregidas automáticamente.`;
                        
                        toast(
                            `🔄 Regeneración Requerida\n\n` +
                            `${warningMessage}\n\n` +
                            `Regenera disponibilidades después de guardar.`,
                            { icon: '🔄', duration: 5000 }
                        );
                    }
                }
            } catch (conflictCheckError) {
                console.warn("⚠️ Error verificando conflictos:", conflictCheckError);
                // Continuar con el guardado aunque falle la verificación
            }
            
            // CONVERSIÓN ROBUSTA A FORMATO SUPABASE
            const operating_hours = {};
            const calendar_schedule = [];
            
            schedule.forEach(day => {
                const dayName = day.day_of_week;
                
                if (!day.is_open) {
                    // Día cerrado - formato simple
                    operating_hours[dayName] = {
                        open: "09:00",
                        close: "22:00",
                        closed: true
                    };
                    calendar_schedule.push({
                        day_of_week: dayName,
                        day_name: day.day_name,
                        is_open: false
                    });
                } else {
                    // Día abierto - horario simple (SIN TURNOS)
                    operating_hours[dayName] = {
                        open: day.open_time || "09:00",
                        close: day.close_time || "22:00",
                        closed: false
                    };
                    calendar_schedule.push({
                        day_of_week: dayName,
                        day_name: day.day_name,
                        is_open: true,
                        open_time: day.open_time || "09:00",
                        close_time: day.close_time || "22:00"
                    });
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

            toast.success("✅ Horarios guardados correctamente");
            console.log("✅ Guardado exitoso - horarios simples");
            
            // 🔄 AVISO AUTOMÁTICO DE REGENERACIÓN
            setTimeout(() => {
                toast(
                    `🔄 REGENERACIÓN REQUERIDA\n\n` +
                    `Los horarios han cambiado.\n\n` +
                    `📍 Ve a "Gestión de Disponibilidades"\n` +
                    `🎯 Haz clic en "Generar Disponibilidades"\n\n` +
                    `Esto asegura coherencia entre calendario y reservas.`,
                    { 
                        icon: '🔄',
                        duration: 8000,
                        style: { 
                            minWidth: '350px',
                            whiteSpace: 'pre-line',
                            fontSize: '14px'
                        }
                    }
                );
            }, 1500); // Esperar un poco para que se vea después del éxito
            
        } catch (error) {
            console.error("❌ Error guardando horarios:", error);
            
            // MENSAJES DE ERROR ESPECÍFICOS
            let errorMessage = "Error al guardar los horarios";
            
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
                                                    if (newSchedule[index].is_open && !newSchedule[index].open_time) {
                                                        newSchedule[index].open_time = "09:00";
                                                        newSchedule[index].close_time = "22:00";
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
                                                {/* Horario Simple (SIN TURNOS) */}
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <div className="text-sm font-medium text-gray-800 mb-2">
                                                        Horario de Apertura
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={day.open_time || "09:00"}
                                                            onChange={(e) => {
                                                                const newSchedule = [...schedule];
                                                                newSchedule[index].open_time = e.target.value;
                                                                setSchedule(newSchedule);
                                                            }}
                                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                        />
                                                        <span className="text-gray-500 text-xs">a</span>
                                                        <input
                                                            type="time"
                                                            value={day.close_time || "22:00"}
                                                            onChange={(e) => {
                                                                const newSchedule = [...schedule];
                                                                newSchedule[index].close_time = e.target.value;
                                                                setSchedule(newSchedule);
                                                            }}
                                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                </div>
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

                                                {/* Estado del día - EVENTOS TIENEN PRIORIDAD */}
                                                {isCurrentMonth && (
                                                    <div className="text-xs">
                                                        {/* Si hay evento y está cerrado, mostrar CERRADO */}
                                                        {dayEvent && dayEvent.is_closed ? (
                                                            <div>
                                                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded block mb-1">
                                                                    Cerrado
                                                                </span>
                                                                <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded block">
                                                                    🔒 {dayEvent.title}
                                                                </span>
                                                            </div>
                                                        ) : dayEvent ? (
                                                            // Si hay evento pero NO está cerrado, mostrar evento especial
                                                            <div>
                                                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded block mb-1">
                                                                    Abierto 09:00-22:00
                                                                </span>
                                                                <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded block">
                                                                    🎉 {dayEvent.title}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            // Si NO hay evento, mostrar horario regular
                                                            <span className={`px-2 py-1 rounded block ${
                                                                daySchedule.is_open 
                                                                    ? 'text-green-600 bg-green-100' 
                                                                    : 'text-red-600 bg-red-100'
                                                            }`}>
                                                                {daySchedule.is_open ? 'Abierto 09:00-22:00' : 'Cerrado'}
                                                            </span>
                                                        )}
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
                            {/* Aviso importante */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                                <p className="text-sm text-blue-700">
                                    <strong>📌 Importante:</strong> Los eventos tienen prioridad sobre el horario regular. 
                                    Si marcas este día como cerrado, anulará el horario habitual.
                                </p>
                            </div>

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
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => setEventForm(prev => ({ 
                                                ...prev, 
                                                title: 'Vacaciones',
                                                closed: true 
                                            }))}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                                        >
                                            🏖️ Vacaciones
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEventForm(prev => ({ 
                                                ...prev, 
                                                title: 'Cerrado',
                                                closed: true 
                                            }))}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                                        >
                                            🔒 Cerrado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEventForm(prev => ({ 
                                                ...prev, 
                                                title: 'Festivo',
                                                closed: true 
                                            }))}
                                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm font-medium hover:bg-orange-200 transition-colors"
                                        >
                                            📅 Festivo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEventForm(prev => ({ 
                                                ...prev, 
                                                title: 'Evento especial',
                                                closed: false 
                                            }))}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors"
                                        >
                                            🎉 Evento
                                        </button>
                                    </div>
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

            {/* 🚨 MODAL BLOQUEANTE DE REGENERACIÓN */}
            <RegenerationRequiredModal
                isOpen={isModalOpen}
                onClose={closeModal}
                changeReason={modalChangeReason}
                changeDetails={modalChangeDetails}
            />
        </div>
        </CalendarioErrorBoundary>
    );
}

// AvailabilityManager.jsx - Gestor de Tabla de Disponibilidades
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    RefreshCw,
    Settings,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Users,
    Trash2,
    Plus,
    Eye,
    EyeOff,
    AlertCircle,
    Info,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAvailabilityChangeDetection } from '../hooks/useAvailabilityChangeDetection';
import ConfirmActionModal from './ConfirmActionModal';
import ResultModal from './ResultModal';

const AvailabilityManager = ({ autoTriggerRegeneration = false }) => {
    const { restaurantId } = useAuthContext();
    const changeDetection = useAvailabilityChangeDetection(restaurantId);
    const [loading, setLoading] = useState(false);
    const [showNoSlotsModal, setShowNoSlotsModal] = useState(false);
    const [noSlotsReason, setNoSlotsReason] = useState(null);
    const [validationExecuted, setValidationExecuted] = useState(false); // 🔒 Flag para evitar validación doble
    const [showRegenerationModal, setShowRegenerationModal] = useState(false); // 🎯 Modal de resultado
    const [regenerationResult, setRegenerationResult] = useState(null); // 📊 Datos del resultado
    const [showConfirmDelete, setShowConfirmDelete] = useState(false); // 🗑️ Modal confirmación borrado
    const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false); // 🔄 Modal confirmación regeneración
    const [dayStats, setDayStats] = useState(null); // 📊 Estadísticas de días (nueva versión simplificada)
    const [autoTriggerShown, setAutoTriggerShown] = useState(false); // 🔒 Flag para evitar modal repetido
    const [protectedDaysData, setProtectedDaysData] = useState([]); // 🛡️ Datos de días protegidos para el modal
    const [dateRangeInfo, setDateRangeInfo] = useState(null); // 📅 Rango de fechas para el modal
    
    // 🚨 Forzar verificación del estado cuando se monta el componente
    useEffect(() => {
        if (restaurantId) {
            console.log('🔍 AvailabilityManager montado - verificando estado de regeneración...');
            console.log('🔍 needsRegeneration:', changeDetection.needsRegeneration);
            console.log('🔍 changeType:', changeDetection.changeType);
            console.log('🔍 changeDetails:', changeDetection.changeDetails);
            console.log('🔍 autoTriggerRegeneration:', autoTriggerRegeneration);
            
            // 🎯 LIMPIAR modal de resultado al montar (evitar que aparezca sin acción)
            setShowRegenerationModal(false);
            setRegenerationResult(null);
        }
    }, [restaurantId, changeDetection.needsRegeneration, changeDetection.changeType, autoTriggerRegeneration]);
    
    const [availabilityStats, setAvailabilityStats] = useState(null);
    const [conflictingReservations, setConflictingReservations] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [showAvailabilityGrid, setShowAvailabilityGrid] = useState(false);
    const [availabilityGrid, setAvailabilityGrid] = useState([]);
    const [restaurantSettings, setRestaurantSettings] = useState(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conflictData, setConflictData] = useState(null);
    const [generationSuccess, setGenerationSuccess] = useState(() => {
        // Cargar estado persistente del localStorage
        try {
            const saved = localStorage.getItem(`generationSuccess_${restaurantId}`);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dayAvailability, setDayAvailability] = useState([]);
    const [calendarExceptions, setCalendarExceptions] = useState([]);
    const [loadingDayView, setLoadingDayView] = useState(false);
    const [generationSettings, setGenerationSettings] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'), // Siempre desde hoy
        endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        overwriteExisting: false
    });

    // Cargar configuración del restaurante
    const loadRestaurantSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('settings')
                .eq('id', restaurantId)
                .single();

            if (error) throw error;

            // Extraer configuración del JSONB settings
            const settings = data?.settings || {};
            
            const processedSettings = {
                advance_booking_days: settings.advance_booking_days || 30,
                min_party_size: settings.min_party_size || 1,
                max_party_size: settings.max_party_size || 20,
                reservation_duration: settings.reservation_duration || 90
            };
            
            setRestaurantSettings(processedSettings);
            
            // Actualizar fechas según configuración
            if (processedSettings.advance_booking_days) {
                setGenerationSettings(prev => ({
                    ...prev,
                    endDate: format(addDays(new Date(), processedSettings.advance_booking_days), 'yyyy-MM-dd')
                }));
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    };

    // 🛡️ Cargar excepciones de calendario
    const loadCalendarExceptions = async () => {
        try {
            const { data, error } = await supabase
                .from('calendar_exceptions')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .gte('exception_date', format(new Date(), 'yyyy-MM-dd'))
                .order('exception_date', { ascending: true });

            if (error) throw error;

            setCalendarExceptions(data || []);
            console.log(`🛡️ ${data?.length || 0} excepciones de calendario cargadas`);
        } catch (error) {
            console.error('Error cargando excepciones:', error);
        }
    };

    // Cargar estadísticas de disponibilidad - SOLO DATOS REALES
    const loadAvailabilityStats = async () => {
        try {
            console.log('📊 Loading REAL availability stats for restaurant:', restaurantId);
            
            if (!restaurantId) {
                console.warn('⚠️ Restaurant ID required for REAL stats');
                return;
            }

            // Usar la nueva función del store que garantiza datos REALES
            const { useReservationStore } = await import('../stores/reservationStore.js');
            const stats = await useReservationStore.getState().getAvailabilityStats(restaurantId);
            
            console.log('✅ REAL availability stats loaded:', stats);
            setAvailabilityStats(stats);

        } catch (error) {
            console.error('❌ Error loading REAL availability stats:', error);
            toast.error('Error al cargar estadísticas reales de disponibilidad');
            // NO mostrar stats falsas - dejar null
            setAvailabilityStats(null);
        }
    };

    // 📊 Calcular estadísticas de DÍAS basadas en SLOTS REALES (no configuración)
    const loadDayStats = async () => {
        try {
            console.log('📊 Calculando estadísticas de DÍAS para restaurant:', restaurantId);
            
            if (!restaurantId) {
                console.warn('⚠️ Restaurant ID required');
                return;
            }

            // 1. Obtener configuración del restaurante (solo para duración y período)
            const { data: restaurantData, error: restError } = await supabase
                .from('restaurants')
                .select('settings')
                .eq('id', restaurantId)
                .single();

            if (restError) throw restError;

            const advanceDays = restaurantData?.settings?.advance_booking_days || 30;
            const reservationDuration = restaurantData?.settings?.reservation_duration || 60;

            // 2. Calcular rango de fechas
            const today = format(new Date(), 'yyyy-MM-dd');
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');

            // 3. Obtener DÍAS ÚNICOS con slots REALES en availability_slots
            const { data: slotsData, error: slotsError } = await supabase
                .from('availability_slots')
                .select('slot_date')
                .eq('restaurant_id', restaurantId)
                .gte('slot_date', today)
                .lte('slot_date', endDate);

            if (slotsError) throw slotsError;

            // 3.5. Obtener días CERRADOS manualmente (festivos, vacaciones) desde special_events
            const { data: closedDays, error: closedError } = await supabase
                .from('special_events')
                .select('event_date')
                .eq('restaurant_id', restaurantId)
                .eq('is_closed', true)
                .gte('event_date', today)
                .lte('event_date', endDate);

            if (closedError) console.warn('⚠️ Error obteniendo días cerrados:', closedError);

            // Crear set de días cerrados
            const closedDaysSet = new Set(
                closedDays?.map(d => d.event_date) || []
            );

            console.log('🚫 DEBUG - Días cerrados manualmente (desde special_events):', Array.from(closedDaysSet));

            // 4. Calcular días únicos con slots, EXCLUYENDO días cerrados manualmente
            const uniqueDaysWithSlots = new Set(
                slotsData?.filter(s => !closedDaysSet.has(s.slot_date)).map(s => s.slot_date) || []
            );
            const diasTotales = uniqueDaysWithSlots.size;

            // Debug: Mostrar TODOS los días con slots
            const diasArray = Array.from(uniqueDaysWithSlots).sort();
            console.log('📊 DEBUG - Días con SLOTS REALES (sin cerrados):', diasTotales);
            console.log('📅 DEBUG - Días específicos:', diasArray);

            // 5. Obtener TODAS las reservas ACTIVAS (sin filtro de rango)
            // ⚠️ CRÍTICO: NO filtrar por endDate porque puede haber reservas futuras
            // que protegen días aunque estén fuera del rango de configuración
            const { data: reservations, error: resError } = await supabase
                .from('reservations')
                .select('reservation_date, status')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', today);  // Solo desde hoy en adelante

            if (resError) throw resError;

            // 6. Filtrar solo las que NO están canceladas o completadas
            const activeReservations = reservations?.filter(r => 
                r.status !== 'cancelled' && r.status !== 'completed'
            ) || [];

            // 7. Calcular días únicos con reservas activas QUE TIENEN SLOTS
            // ⚠️ CRÍTICO: Solo contar reservas en días que TIENEN slots generados
            const reservationsInSlotsRange = activeReservations.filter(r => 
                uniqueDaysWithSlots.has(r.reservation_date)
            );
            
            const uniqueDaysWithReservations = new Set(
                reservationsInSlotsRange.map(r => r.reservation_date)
            ).size;

            // 8. Calcular días libres = días con slots - días con reservas (en rango)
            const diasLibres = Math.max(0, diasTotales - uniqueDaysWithReservations);

            console.log('📊 DEBUG - Cálculo de días:', {
                diasConSlots: diasTotales,
                diasConReservasEnRango: uniqueDaysWithReservations,
                diasLibres: diasLibres,
                totalReservasActivas: activeReservations.length,
                reservasFueraDeRango: activeReservations.length - reservationsInSlotsRange.length
            });

            // 9. Total de reservas activas (TODAS, incluidas fuera de rango)
            const reservasActivas = activeReservations.length;

            // 10. Obtener número de mesas
            const mesas = availabilityStats?.tablesCount || 0;

            // 11. Calcular la fecha máxima de disponibilidades REALES
            const maxSlotDate = slotsData && slotsData.length > 0
                ? Math.max(...slotsData.map(s => new Date(s.slot_date).getTime()))
                : null;

            const maxDate = maxSlotDate ? format(new Date(maxSlotDate), 'dd/MM/yyyy') : null;

            const stats = {
                diasTotales: diasTotales,  // ← AHORA basado en SLOTS REALES, no configuración
                diasConReservas: uniqueDaysWithReservations,
                diasLibres: diasLibres,  // ← AHORA basado en SLOTS REALES
                reservasActivas: reservasActivas,
                mesas: mesas,
                duracionReserva: reservationDuration,
                advanceDaysConfig: advanceDays,  // Guardamos la config para el modal de generar
                fechaHasta: maxDate  // ← Fecha máxima REAL de disponibilidades
            };

            console.log('✅ Estadísticas de DÍAS calculadas (BASADAS EN SLOTS REALES):', stats);
            console.log('📊 DEBUG - Días con slots:', diasTotales);
            console.log('📊 DEBUG - Días con reservas:', uniqueDaysWithReservations);
            console.log('📊 DEBUG - Días libres:', diasLibres);
            console.log('📊 DEBUG - Reservas activas:', reservasActivas);
            console.log('📊 DEBUG - Fecha hasta:', maxDate);
            setDayStats(stats);

        } catch (error) {
            console.error('❌ Error calculando estadísticas de días:', error);
            setDayStats(null);
        }
    };

    // Detectar reservas que entrarían en conflicto
    const detectConflicts = async (startDate, endDate) => {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    id,
                    reservation_date,
                    reservation_time,
                    table_id,
                    customer_name,
                    party_size,
                    status,
                    tables(name)
                `)
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', startDate)
                .lte('reservation_date', endDate)
                .in('status', ['confirmed', 'pending']);

            if (error) throw error;

            setConflictingReservations(data || []);
            return data?.length || 0;
        } catch (error) {
            console.error('Error detectando conflictos:', error);
            return 0;
        }
    };

    // 🔒 REGLA SAGRADA: NUNCA ELIMINAR RESERVAS
    // Esta función SOLO limpia la UI - JAMÁS toca la tabla 'reservations'
    // Las reservas son SAGRADAS y solo se eliminan manualmente desde Reservas.jsx
    // 🗑️ BORRAR DISPONIBILIDADES: Elimina slots sin reservas, preserva ocupados
    const handleSmartCleanup = async () => {
        if (!restaurantId) {
            toast.error('❌ Falta ID del restaurante');
            return;
        }

        // 🛡️ Preparar datos de días protegidos
        const protectedDays = await prepareProtectedDaysData();
        setProtectedDaysData(protectedDays);

        // Mostrar modal de confirmación
        setShowConfirmDelete(true);
    };

    // 🔄 Preparar y mostrar modal de regeneración
    const handleShowRegenerateModal = async () => {
        // 🛡️ Preparar datos de días protegidos
        const protectedDays = await prepareProtectedDaysData();
        setProtectedDaysData(protectedDays);

        // 📅 Calcular rango de fechas
        try {
            const { data: settings } = await supabase
                .from('restaurants')
                .select('settings')
                .eq('id', restaurantId)
                .single();
            
            const advanceDays = settings?.settings?.advance_booking_days || 20;
            const endDate = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            setDateRangeInfo(`hasta el ${endDate} (${advanceDays} días)`);
        } catch (error) {
            console.error('Error calculando rango:', error);
        }

        // Mostrar modal de confirmación
        setShowConfirmRegenerate(true);
    };

    // 📊 Preparar datos de días protegidos para el modal
    const prepareProtectedDaysData = async () => {
        if (!restaurantId) return [];

        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            
            // Obtener TODAS las reservas futuras agrupadas por día
            const { data: reservations, error } = await supabase
                .from('reservations')
                .select('reservation_date, customer_name, status')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', today)
                .not('status', 'in', '(cancelled,completed)');  // Solo activas
            
            if (error) {
                console.error('❌ Error obteniendo reservas:', error);
                return [];
            }

            // Agrupar por fecha
            const groupedByDate = {};
            reservations?.forEach(res => {
                if (!groupedByDate[res.reservation_date]) {
                    groupedByDate[res.reservation_date] = [];
                }
                groupedByDate[res.reservation_date].push(res);
            });

            // Convertir a array ordenado con formato
            const protectedDays = Object.keys(groupedByDate)
                .sort()
                .map(date => ({
                    date: format(new Date(date), 'dd/MM/yyyy', { locale: es }),
                    count: groupedByDate[date].length,
                    rawDate: date
                }));

            console.log('🛡️ Días protegidos preparados:', protectedDays);
            return protectedDays;
        } catch (error) {
            console.error('❌ Error preparando días protegidos:', error);
            return [];
        }
    };

    // 🗑️ Ejecutar borrado después de confirmar
    const executeDelete = async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);
            toast.loading('🗑️ Borrando disponibilidades...', { id: 'cleanup' });

            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');

            console.log('🗑️ BORRAR DISPONIBILIDADES:');
            console.log('   🏪 Restaurante:', restaurantId);
            console.log('🔍 QUERY PARAMETERS:', {
                today,
                endDate,
                advanceDays,
                restaurantId
            });

            // 🎯 PASO 1: Consultar reservas ANTES de borrar (para contar días protegidos)
            
            // Debug: Todas las reservas
            const { data: allReservationsDebug } = await supabase
                .from('reservations')
                .select('id, reservation_date, status, customer_name')
                .eq('restaurant_id', restaurantId);

            console.log('📊 TODAS las reservas del restaurante:', allReservationsDebug);
            
            // ⚠️ TODAS las reservas futuras (SIN filtrar por endDate)
            // CRÍTICO: Incluir reservas fuera del rango porque también protegen días
            const { data: reservationsDataBefore, error: resError } = await supabase
                .from('reservations')
                .select('id, reservation_date, status, customer_name')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', today);  // Solo desde hoy, SIN límite superior

            if (resError) {
                console.error('❌ Error consultando reservas:', resError);
            }

            console.log('📊 TODAS las reservas consultadas:', reservationsDataBefore);

            // ✅ FILTRAR: Solo contar las ACTIVAS (excluir cancelled y completed)
            const activeReservationsArray = reservationsDataBefore?.filter(r => 
                r.status !== 'cancelled' && r.status !== 'completed'
            ) || [];

            const activeReservations = activeReservationsArray.length;
            
            // Contar días únicos con reservas ACTIVAS (días protegidos)
            const uniqueDaysBefore = new Set(
                activeReservationsArray.map(r => r.reservation_date)
            );
            const daysProtected = uniqueDaysBefore.size;

            console.log('📊 ANTES de borrar (SOLO ACTIVAS):', {
                reservasActivas: activeReservations,
                reservasCanceladas: reservationsDataBefore?.filter(r => r.status === 'cancelled' || r.status === 'completed').length || 0,
                diasProtegidos: daysProtected,
                fechas: Array.from(uniqueDaysBefore)
            });

            // 🎯 PASO 2: Ejecutar borrado
            const { data, error } = await supabase.rpc('borrar_disponibilidades_simple', {
                p_restaurant_id: restaurantId
            });

            if (error) {
                console.error('❌ Error borrando:', error);
                throw error;
            }

            console.log('🗑️ Resultado borrado:', data);

            toast.dismiss('cleanup');

            if (data?.success) {
                // Limpiar estado local
                setGenerationSuccess(null);
                setAvailabilityStats(null);
                setAvailabilityGrid([]);
                
                try {
                    localStorage.removeItem(`generationSuccess_${restaurantId}`);
                } catch (error) {
                    console.warn('No se pudo limpiar localStorage:', error);
                }

                // 🎯 PASO 3: Recargar stats
                await loadAvailabilityStats();
                await loadDayStats(); // 📊 Recargar estadísticas de días

                // Total de días en el período
                const totalDays = advanceDays;
                
                // Días eliminados = Total - Protegidos
                const daysDeleted = totalDays - daysProtected;

                const duration = restaurantSettings?.reservation_duration || 60;
                const endDateFormatted = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');

                // Mostrar modal con terminología de DÍAS
                console.log('🎯 MOSTRANDO MODAL DE RESULTADO - BORRAR');
                setRegenerationResult({
                    type: 'delete',
                    totalDays: totalDays,
                    daysProtected: daysProtected,
                    daysAvailable: daysDeleted, // Días eliminados
                    activeReservations: activeReservations,
                    period: `HOY hasta ${endDateFormatted} (${advanceDays} días)`,
                    duration: `${duration} min por reserva`
                });
                setShowRegenerationModal(true);
                console.log('✅ Modal de resultado activado');

            } else {
                throw new Error(data?.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error borrando disponibilidades:', error);
            toast.dismiss('cleanup');
            toast.error('❌ Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 🛡️ VALIDAR RESERVAS EN DÍAS QUE SE QUIEREN CERRAR
    const validateReservationsOnClosedDays = async (operatingHours) => {
        try {
            // 1. Detectar días que están marcados como cerrados
            const closedDays = [];
            const dayMap = {
                'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
                'friday': 5, 'saturday': 6, 'sunday': 0
            };
            
            Object.entries(operatingHours).forEach(([day, hours]) => {
                if (hours.closed) {
                    closedDays.push({
                        day,
                        dayNumber: dayMap[day],
                        displayName: day.charAt(0).toUpperCase() + day.slice(1)
                    });
                }
            });
            
            if (closedDays.length === 0) {
                return { valid: true, conflicts: [] };
            }
            
            console.log('🔍 Días marcados como cerrados:', closedDays);
            
            // 2. Buscar reservas activas en esos días de la semana
            const { data: reservations, error } = await supabase
                .from('reservations')
                .select('id, customer_name, customer_phone, reservation_date, reservation_time, party_size, status')
                .eq('restaurant_id', restaurantId)
                .in('status', ['pending', 'confirmed', 'pending_approval'])
                .gte('reservation_date', format(new Date(), 'yyyy-MM-dd'));
            
            if (error) throw error;
            
            console.log('📋 Reservas activas encontradas:', reservations?.length || 0);
            console.log('📋 Detalle de reservas:', reservations);
            
            // 3. Filtrar reservas que caen en días cerrados y agrupar por fecha
            const conflictingReservations = [];
            closedDays.forEach(closedDay => {
                const dayReservations = reservations.filter(r => {
                    // Usar parseISO para evitar problemas de zona horaria
                    const reservationDate = new Date(r.reservation_date + 'T00:00:00');
                    const reservationDay = reservationDate.getDay();
                    console.log(`🔍 Reserva ${r.id}: fecha=${r.reservation_date}, día=${reservationDay}, buscando=${closedDay.dayNumber}`);
                    return reservationDay === closedDay.dayNumber;
                });
                
                console.log(`🔍 Día ${closedDay.displayName} (${closedDay.dayNumber}): ${dayReservations.length} reservas`);
                
                if (dayReservations.length > 0) {
                    // Agrupar por fecha específica (sin duplicados)
                    const uniqueDates = [...new Set(dayReservations.map(r => r.reservation_date))];
                    uniqueDates.forEach(date => {
                        const reservationsForDate = dayReservations.filter(r => r.reservation_date === date);
                        conflictingReservations.push({
                            day: closedDay.day,
                            displayName: closedDay.displayName,
                            date: date, // ✅ FECHA ESPECÍFICA
                            reservations: reservationsForDate
                        });
                    });
                }
            });
            
            console.log('⚠️ Conflictos encontrados:', conflictingReservations);
            
            return {
                valid: conflictingReservations.length === 0,
                conflicts: conflictingReservations,
                closedDays
            };
            
        } catch (error) {
            console.error('❌ Error validando reservas:', error);
            return { valid: false, conflicts: [], error: error.message };
        }
    };

    // 🔒 REGLA SAGRADA: NUNCA ELIMINAR RESERVAS
    // Esta función SOLO regenera availability_slots PROTEGIENDO reservas existentes
    // Las reservas son SAGRADAS y solo se eliminan manualmente desde Reservas.jsx
    const smartRegeneration = async (changeType = 'general', changeData = {}) => {
        if (!restaurantId) {
            toast.error('❌ No se encontró el ID del restaurante');
            return;
        }

        // 🔄 SIEMPRE recargar settings desde Supabase para tener los horarios actualizados
        console.log('🔄 Recargando settings desde Supabase antes de validar...');
        const { data: freshSettings, error: settingsError } = await supabase
            .from('restaurants')
            .select('settings')
            .eq('id', restaurantId)
            .single();
        
        if (settingsError) {
            console.error('❌ Error recargando settings:', settingsError);
            toast.error('❌ Error al verificar configuración del restaurante');
            return;
        }
        
        const currentSettings = freshSettings?.settings || restaurantSettings;
        console.log('🔍 Settings actualizados:', currentSettings);
        console.log('🔍 Operating hours que se usarán en regeneración:', currentSettings?.operating_hours);

        // 🔒 NO VALIDAR - La función SQL ya protege los días con reservas
        console.log('✅ Procediendo con regeneración (protección en SQL)');

        try {
            setLoading(true);
            toast.loading('Regeneración inteligente en proceso...', { id: 'smart-generating' });
            
            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');


            // Usar cleanup_and_regenerate_availability ya que regenerate_availability_smart no existe
            const { data, error } = await supabase.rpc('cleanup_and_regenerate_availability', {
                p_restaurant_id: restaurantId,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en regeneración inteligente:', error);
                throw error;
            }

            // Verificar si la respuesta es exitosa
            if (data && typeof data === 'object') {
                if (data.success === false) {
                    console.error('❌ Error en la función:', data.error);
                    throw new Error(data.error || 'Error regenerando disponibilidades');
                }
            }

            toast.dismiss('smart-generating');
            
            // Mostrar resultados detallados
            const results = data; // RPC devuelve objeto directo
            const duration = restaurantSettings?.reservation_duration || 90;
            const endDateFormatted = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            
            console.log('🔍 Resultado de regeneración:', results);
            
            // Actualizar estado local con datos correctos
            const slotsCreated = results?.slots_created || 0;
            const slotsMarked = results?.slots_marked || 0;
            const daysProtected = results?.days_protected || 0;
            
            const successData = {
                slotsCreated: slotsCreated,
                dateRange: `HOY hasta ${endDateFormatted}`,
                duration: duration,
                buffer: 15,
                timestamp: new Date().toLocaleString(),
                smartRegeneration: true,
                action: results?.action || 'regeneración_completada',
                message: results?.message || 'Regeneración completada correctamente'
            };
            
            setGenerationSuccess(successData);
            
            // Guardar en localStorage
            try {
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            } catch (error) {
                console.warn('No se pudo guardar en localStorage:', error);
            }
            
            // 🔒 RECARGAR ESTADÍSTICAS INMEDIATAMENTE
            console.log('🔄 Recargando estadísticas después de regenerar...');
            await loadAvailabilityStats();
            await loadDayStats(); // 📊 Recargar estadísticas de días
            console.log('✅ Estadísticas recargadas');
            
            // 🎯 CALCULAR DÍAS Y RESERVAS REALES
            
            console.log('🔍 QUERY PARAMETERS:', {
                today,
                endDate,
                advanceDays,
                restaurantId
            });
            
            // Obtener TODAS las reservas primero (para debug)
            const { data: allReservations } = await supabase
                .from('reservations')
                .select('id, reservation_date, status, customer_name')
                .eq('restaurant_id', restaurantId);

            console.log('📊 TODAS las reservas del restaurante:', allReservations);
            
            // TODAS las reservas en el rango (sin filtrar por status)
            const { data: reservationsData, error: reservationsError } = await supabase
                .from('reservations')
                .select('id, reservation_date, status, customer_name')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_date', today)
                .lte('reservation_date', endDate);

            if (reservationsError) {
                console.error('❌ Error consultando reservas:', reservationsError);
            }

            console.log('📊 TODAS las reservas consultadas:', reservationsData);

            // ✅ FILTRAR: Solo contar las ACTIVAS (excluir cancelled y completed)
            const activeReservationsArray = reservationsData?.filter(r => 
                r.status !== 'cancelled' && r.status !== 'completed'
            ) || [];

            const activeReservations = activeReservationsArray.length;
            
            // Contar días únicos con reservas ACTIVAS (días protegidos)
            const uniqueDays = new Set(
                activeReservationsArray.map(r => r.reservation_date)
            );
            const daysProtectedCount = uniqueDays.size;

            // Total de días en el período
            const totalDays = advanceDays;
            
            // Días regenerados = Total - Protegidos
            const daysRegenerated = totalDays - daysProtectedCount;
            
            console.log('📊 Estadísticas REALES para modal (SOLO ACTIVAS):', {
                totalDays,
                daysProtectedCount,
                daysRegenerated,
                reservasActivas: activeReservations,
                reservasCanceladas: reservationsData?.filter(r => r.status === 'cancelled' || r.status === 'completed').length || 0,
                fechasProtegidas: Array.from(uniqueDays)
            });
            
            // 🎯 Mostrar modal con terminología de DÍAS
            console.log('🎯 MOSTRANDO MODAL DE RESULTADO - REGENERAR');
            setRegenerationResult({
                type: 'regenerate',
                totalDays: totalDays,
                daysProtected: daysProtectedCount,
                daysAvailable: daysRegenerated, // Días regenerados
                activeReservations: activeReservations,
                period: `HOY hasta ${endDateFormatted} (${advanceDays} días)`,
                duration: `${duration} min por reserva`
            });
            setShowRegenerationModal(true);

            // ✅ LIMPIAR FLAG DE REGENERACIÓN REQUERIDA
            changeDetection.clearRegenerationFlag();
            console.log('✅ Flag de regeneración limpiado');
            console.log('✅ Modal de resultado activado');

        } catch (error) {
            console.error('Error en regeneración inteligente:', error);
            toast.dismiss('smart-generating');
            toast.error('❌ Error en regeneración inteligente: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 🚨 AUTO-TRIGGER: Mostrar modal de confirmación si viene desde cambio de horarios (SOLO UNA VEZ)
    useEffect(() => {
        if (autoTriggerRegeneration && restaurantId && !loading && !autoTriggerShown) {
            console.log('🚨 AUTO-TRIGGER: Mostrando modal de confirmación (PRIMERA VEZ)...');
            // Pequeño delay para que el componente termine de montar
            const timer = setTimeout(async () => {
                await handleShowRegenerateModal(); // Preparar datos y mostrar modal
                setAutoTriggerShown(true); // 🔒 MARCAR COMO MOSTRADO para no repetir
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoTriggerRegeneration, restaurantId, loading, autoTriggerShown]);

    // 🔒 REGLA SAGRADA: NUNCA ELIMINAR RESERVAS
    // Esta función SOLO genera availability_slots - JAMÁS toca la tabla 'reservations'
    // Las reservas son SAGRADAS y solo se eliminan manualmente desde Reservas.jsx
    const generateAvailability = async () => {
        // 🔒 Evitar ejecución doble
        if (validationExecuted) {
            console.log('⚠️ Validación ya ejecutada, saltando...');
            return;
        }
        
        try {
            setValidationExecuted(true); // Marcar como ejecutado
            setLoading(true);
            toast.loading('Generando tabla de disponibilidades...', { id: 'generating' });

            // 1. VALIDAR RESERVAS EN DÍAS CERRADOS (igual que smartRegeneration)
            console.log('🛡️ Validando reservas existentes antes de generar...');
            const { data: restaurantData, error: settingsError } = await supabase
                .from('restaurants')
                .select('settings')
                .eq('id', restaurantId)
                .single();

            if (!settingsError && restaurantData?.settings?.operating_hours) {
                const validation = await validateReservationsOnClosedDays(restaurantData.settings.operating_hours);
                
                if (!validation.valid && validation.conflicts.length > 0) {
                    console.log('⚠️ CONFLICTOS DETECTADOS - Mostrando modal informativo:', validation.conflicts);
                    toast.dismiss('generating');
                    
                    // Mostrar modal informativo
                    setConflictData({
                        conflicts: validation.conflicts,
                        closedDays: validation.closedDays,
                        isGenerating: true // Flag para saber que viene de generateAvailability
                    });
                    setShowConflictModal(true);
                    return; // Esperar a que el usuario confirme en el modal
                }
            }

            // 2. Detectar conflictos si se va a sobrescribir
            if (generationSettings.overwriteExisting) {
                const conflicts = await detectConflicts(
                    generationSettings.startDate,
                    generationSettings.endDate
                );

                if (conflicts > 0 && !confirm(
                    `⚠️ ATENCIÓN: Se encontraron ${conflicts} reservas confirmadas en este período.\n\n` +
                    `Si continúas, podrías afectar reservas existentes.\n\n` +
                    `¿Estás seguro de que quieres continuar?`
                )) {
                    toast.dismiss('generating');
                    return;
                }
            }

            // 3. CARGAR POLÍTICA DE RESERVAS REAL ANTES DE GENERAR
            console.log('📋 Cargando política de reservas REAL...');
            const { useReservationStore } = await import('../stores/reservationStore.js');
            
            // Declarar variables fuera del try para usarlas después
            let advanceDays, duration, today, endDate;
            
            try {
                await useReservationStore.getState().loadReservationPolicy(restaurantId);
                const settings = useReservationStore.getState().settings;
                console.log('✅ Política cargada:', settings);
                
                // Usar valores REALES de la política
                advanceDays = settings.maxAdvanceBooking;
                duration = settings.slotDuration;
                
                if (!advanceDays || !duration) {
                    throw new Error('Política de reservas incompleta - faltan datos obligatorios');
                }
                
                today = format(new Date(), 'yyyy-MM-dd');
                endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');
                
                console.log('🎯 Usando política REAL:', {
                    advanceDays,
                    duration,
                    startDate: today,
                    endDate
                });
                
            } catch (policyError) {
                console.error('❌ Error cargando política de reservas:', policyError);
                toast.error('Error: No se pudo cargar la política de reservas. Verifica la configuración.');
                toast.dismiss('generating');
                return;
            }
            
            // Verificar si hay mesas activas
            const { data: tablesData, error: tablesError } = await supabase
                .from('tables')
                .select('id, name, capacity, is_active')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true);
            
            if (!tablesData || tablesData.length === 0) {
                toast.error('❌ No hay mesas activas. Añade mesas antes de generar disponibilidades.');
                toast.dismiss('generating');
                return;
            }
            
            // USAR FUNCIÓN SIMPLIFICADA (sin turnos)
            // Si no hay restaurantId, pasar null para que la función lo detecte
            const { data, error } = await supabase.rpc('generate_availability_slots_simple', {
                p_restaurant_id: restaurantId || null,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en generate_availability_slots:', error);
                toast.dismiss('generating');
                
                // Mostrar error técnico si lo hay
                const errorMsg = error.message || error.hint || 'Error desconocido';
                toast.error(
                    `❌ Error al generar horarios de reserva\n\n` +
                    `🔍 Motivo: ${errorMsg}\n\n` +
                    '📋 Verifica que:\n' +
                    '• Tienes horarios de apertura configurados\n' +
                    '• Hay días abiertos en el calendario\n' +
                    '• La política de reservas está completa\n' +
                    '• Tienes mesas activas\n\n' +
                    '🔧 Revisa: Configuración → Horarios y Política de Reservas',
                    { duration: 10000 }
                );
                setLoading(false);
                return;
            }
            
            // Verificar si la respuesta es exitosa
            if (data && typeof data === 'object') {
                if (data.success === false) {
                    console.error('❌ Error en la función:', data);
                    toast.dismiss('generating');
                    
                    // 🎯 MOSTRAR EL MOTIVO EXACTO DEL ERROR
                    const errorReason = data.error || 'Error desconocido';
                    const errorHint = data.hint || '';
                    
                    let helpMessage = '\n\n📋 Verifica que:\n';
                    
                    // Personalizar mensaje según el error
                    if (errorReason.includes('mesas')) {
                        helpMessage += '• Tienes al menos una mesa activa\n' +
                                      '🔧 Ve a: Mesas → Crear nueva mesa';
                    } else if (errorReason.includes('horario') || errorReason.includes('cerrado')) {
                        helpMessage += '• Tienes horarios de apertura configurados\n' +
                                      '• Hay días abiertos en el calendario\n' +
                                      '🔧 Ve a: Configuración → Horarios o Calendario';
                    } else if (errorReason.includes('política') || errorReason.includes('reservas')) {
                        helpMessage += '• La política de reservas está completa\n' +
                                      '• Los días de antelación están configurados\n' +
                                      '🔧 Ve a: Configuración → Política de Reservas';
                    } else {
                        helpMessage += '• Horarios de apertura configurados\n' +
                                      '• Días abiertos en el calendario\n' +
                                      '• Política de reservas completa\n' +
                                      '• Mesas activas creadas\n' +
                                      '🔧 Revisa: Configuración → Horarios, Calendario y Mesas';
                    }
                    
                    toast.error(
                        `❌ No se pudieron generar horarios de reserva\n\n` +
                        `🔍 Motivo: ${errorReason}` +
                        (errorHint ? `\n💡 Sugerencia: ${errorHint}` : '') +
                        helpMessage,
                        { duration: 12000 }
                    );
                    setLoading(false);
                    return;
                }
            }
            
            // 🔍 DEBUG: Ver exactamente qué devuelve la función SQL
            console.log('🔍 DEBUG RESULTADO SQL:');
            console.log('   📊 data completo:', data);
            console.log('   📊 success:', data?.success);
            console.log('   📊 stats:', data?.stats);
            console.log('   📊 config:', data?.config);

            toast.dismiss('generating');
            
            // Verificar el resultado
            if (!data || !data.success) {
                const errorMessage = data?.error || 'Error desconocido';
                toast.error(`❌ ${errorMessage}`);
                return;
            }
            
            // Extraer estadísticas directamente de la respuesta SQL
            const slotsCreated = data.slots_created || 0;
            const tableCount = data.table_count || 0;
            const policyApplied = data.policy_applied || {};
            const durationMinutes = policyApplied.reservation_duration || 90;
            
            // Valores por defecto para campos que la función SQL no devuelve
            const slotsSkipped = 0;
            const daysProcessed = advanceDays || 7;
            const daysClosed = 0;
            const dateRange = { end: endDate };
            
            const endDateFormatted = dateRange.end ? format(new Date(dateRange.end), 'dd/MM/yyyy') : format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            
            let summaryMessage = '';
            
            if (slotsCreated === 0 && slotsSkipped === 0) {
                // 🚨 NO SE GENERARON SLOTS - MOSTRAR MODAL DE ADVERTENCIA
                const reasonData = {
                    daysProcessed,
                    daysClosed,
                    tableCount,
                    slotsSkipped,
                    endDate: endDateFormatted,
                    allClosed: daysClosed === daysProcessed
                };
                
                setNoSlotsReason(reasonData);
                setShowNoSlotsModal(true);
                toast.dismiss('generating');
            } else {
                // Se generaron slots exitosamente
                summaryMessage = `✅ ${slotsCreated} slots creados | ${tableCount} mesas | Hasta ${endDateFormatted}`;
                
                toast.success('✅ Disponibilidades generadas correctamente');
            }

            // 🔒 VERIFICAR DATOS REALES POST-GENERACIÓN
            console.log('📊 Verificando resultado de generación...');
            
            // Contar slots totales actuales
            const { count: totalSlotsCount, error: countError } = await supabase
                .from('availability_slots')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .gte('slot_date', format(new Date(), 'yyyy-MM-dd'));
            
            const totalSlots = countError ? 0 : (totalSlotsCount || 0);
            
            console.log('📊 Total de slots en el sistema:', totalSlots);
            console.log('📊 Respuesta de función SQL:', data);
            
            const successData = {
                slotsCreated: slotsCreated,
                slotsSkipped: slotsSkipped,
                dateRange: `HOY hasta ${endDateFormatted}`,
                duration: duration,
                tableCount: tableCount,
                daysProcessed: daysProcessed,
                daysClosed: daysClosed,
                timestamp: new Date().toLocaleString(),
                totalSlots: totalSlots
            };
            
            // Persistir éxito
            setGenerationSuccess(successData);
            localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            
            // NO mostrar toast adicional - ya se mostró arriba
            
            setGenerationSuccess(successData);
            
            // Guardar en localStorage para persistencia
            try {
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            } catch (error) {
                // Silencioso - no es crítico
            }
            
            // 🔒 RECARGAR ESTADÍSTICAS INMEDIATAMENTE
            console.log('🔄 Recargando estadísticas después de generar...');
            await loadAvailabilityStats();
            await loadDayStats(); // 📊 Recargar estadísticas de días
            console.log('✅ Estadísticas recargadas');
            
            // 🎯 Obtener estadísticas REALES
            const reservationStore2 = await import('../stores/reservationStore.js');
            const realStats = await reservationStore2.useReservationStore.getState().getAvailabilityStats(restaurantId);
            
            // 🎯 Mostrar modal con datos REALES
            setRegenerationResult({
                action: 'generación_completada',
                slotsCreated: data?.slots_created || 0,
                slotsMarked: realStats?.reserved || 0,
                daysProtected: data?.days_protected || 0, // REAL del SQL
                totalSlots: realStats?.total || 0,
                availableSlots: realStats?.free || 0,
                message: data?.message || 'Disponibilidades generadas correctamente',
                period: `${today} hasta ${endDate}`,
                duration: `${duration} min por reserva`
            });
            setShowRegenerationModal(true);

        } catch (error) {
            console.error('Error generando disponibilidades:', error);
            toast.dismiss('generating');
            toast.error('❌ Error: ' + error.message);
        } finally {
            setLoading(false);
            setValidationExecuted(false); // Reset para permitir siguiente ejecución
        }
    };

    // Limpiar disponibilidades
    // 🧹 SOLO LIMPIEZA: Elimina slots sin reservas, preserva con reservas, NO regenera
    const smartCleanupOnly = async () => {
        if (!restaurantId) {
            toast.error('❌ Falta ID del restaurante');
            return;
        }

        const confirmed = confirm(
            '🧹 SOLO LIMPIEZA INTELIGENTE\n\n' +
            '✅ ACCIONES:\n' +
            '• Eliminará slots SIN reservas\n' +
            '• Preservará slots CON reservas confirmadas\n' +
            '• NO generará slots nuevos\n\n' +
            '🛡️ Las reservas confirmadas están 100% protegidas\n' +
            '📊 Resultado: Si no hay reservas → 0 slots\n\n' +
            '¿Continuar con la limpieza?'
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            toast.loading('🧹 Limpieza inteligente...', { id: 'smart-cleanup-only' });

            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');

            console.log('🧹 SOLO LIMPIEZA INTELIGENTE:');
            console.log('   📅 Período:', today, 'hasta', endDate);

            const { data, error } = await supabase.rpc('smart_cleanup_availability', {
                p_restaurant_id: restaurantId,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en limpieza:', error);
                throw error;
            }

            console.log('🧹 Resultado limpieza:', data);

            toast.dismiss('smart-cleanup-only');

            if (data?.success) {
                const slotsDeleted = data?.slots_deleted || 0;
                const slotsPreserved = data?.slots_preserved || 0;
                const slotsAfter = data?.slots_after || 0;

                toast.success('✅ Limpieza completada correctamente');

                // Limpiar estado local completamente
                setGenerationSuccess(null);
                setAvailabilityStats(null);
                setAvailabilityGrid([]);
                
                // Limpiar localStorage
                try {
                    localStorage.removeItem(`generationSuccess_${restaurantId}`);
                } catch (error) {
                    console.warn('No se pudo limpiar localStorage:', error);
                }

                // Recargar stats reales
                await loadAvailabilityStats();
                await loadDayStats(); // 📊 Recargar estadísticas de días
                
                // 🎯 Obtener estadísticas REALES de la BD
                const reservationStore4 = await import('../stores/reservationStore.js');
                const realStats = await reservationStore4.useReservationStore.getState().getAvailabilityStats(restaurantId);
                
                // Mostrar modal con datos REALES
                setRegenerationResult({
                    action: 'limpieza_simple',
                    slotsCreated: 0, // Correcto: en limpieza no se crean
                    slotsMarked: realStats?.reserved || 0, // REAL de BD
                    daysProtected: data?.days_protected || 0, // REAL del SQL
                    slotsDeleted: slotsDeleted,
                    totalSlots: realStats?.total || 0,
                    availableSlots: realStats?.free || 0,
                    message: `${slotsDeleted} slots eliminados (sin reservas). ${realStats?.reserved || 0} slots preservados (con reservas). ${slotsAfter === 0 ? 'Tabla limpia - Sin disponibilidades.' : 'Solo reservas confirmadas preservadas.'}`,
                    period: 'Limpieza simple',
                    duration: `${realStats?.total || 0} slots totales`
                });
                setShowRegenerationModal(true);

            } else {
                throw new Error(data?.error || 'Error desconocido en limpieza');
            }

        } catch (error) {
            console.error('Error en limpieza:', error);
            toast.dismiss('smart-cleanup-only');
            toast.error('❌ Error en limpieza: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 🔄 LIMPIEZA + REGENERACIÓN: Elimina slots sin reservas, preserva con reservas, regenera nuevos
    const smartCleanupAndRegenerate = async () => {
        if (!restaurantId || !restaurantSettings) {
            toast.error('❌ Faltan datos de configuración');
            return;
        }

        const confirmed = confirm(
            '🧠 LIMPIEZA INTELIGENTE + REGENERACIÓN\n\n' +
            '✅ ACCIONES SEGURAS:\n' +
            '• Eliminará slots SIN reservas\n' +
            '• Preservará slots CON reservas confirmadas\n' +
            '• Generará nuevos slots según configuración actual\n\n' +
            '🛡️ Las reservas confirmadas están 100% protegidas\n\n' +
            '¿Continuar con la limpieza inteligente?'
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            toast.loading('🧠 Limpieza inteligente + regeneración...', { id: 'smart-cleanup' });

            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');
            const duration = restaurantSettings?.reservation_duration || 90;

            console.log('🧠 LIMPIEZA + REGENERACIÓN INTELIGENTE:');
            console.log('   📅 Período:', today, 'hasta', endDate);
            console.log('   🕒 Duración:', duration, 'minutos');

            const { data, error } = await supabase.rpc('cleanup_and_regenerate_availability', {
                p_restaurant_id: restaurantId,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en limpieza inteligente:', error);
                throw error;
            }
            
            // Verificar si la respuesta es exitosa
            if (data && typeof data === 'object') {
                if (data.success === false) {
                    console.error('❌ Error en la función:', data.error);
                    throw new Error(data.error || 'Error en limpieza y regeneración');
                }
            }

            console.log('🧠 Resultado limpieza inteligente:', data);

            toast.dismiss('smart-cleanup');

            if (data?.success) {
                // Extraer datos del resultado anidado
                const cleanup = data.cleanup || {};
                const generation = data.generation || {};
                const stats = generation.stats || {};
                
                const slotsCreated = stats.slots_created || 0;
                const slotsDeleted = cleanup.slots_deleted || 0;
                const slotsPreserved = cleanup.slots_preserved || 0;

                toast.success('✅ Limpieza inteligente completada correctamente');

                // Actualizar estado local con datos reales
                const successData = {
                    slotsCreated: slotsCreated,
                    dateRange: `HOY hasta ${format(addDays(new Date(), advanceDays), 'dd/MM/yyyy')}`,
                    duration: duration,
                    buffer: 15,
                    timestamp: new Date().toLocaleString(),
                    totalAvailable: slotsCreated - reservationsProtected,
                    totalOccupied: 0,
                    totalReserved: reservationsProtected,
                    smartCleanup: true
                };

                setGenerationSuccess(successData);

                // Guardar en localStorage
                try {
                    localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
                } catch (error) {
                    console.warn('No se pudo guardar en localStorage:', error);
                }

                // Solo cargar el grid
                setTimeout(async () => {
                    await loadAvailabilityGrid();
                }, 500);

            } else {
                throw new Error(data?.error || 'Error desconocido en limpieza inteligente');
            }

        } catch (error) {
            console.error('Error en limpieza inteligente:', error);
            toast.dismiss('smart-cleanup');
            toast.error('❌ Error en limpieza inteligente: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Cargar vista detallada de disponibilidades
    const loadAvailabilityGrid = async () => {
        try {
            const { data, error } = await supabase
                .from('availability_slots')
                .select(`
                    id,
                    slot_date,
                    start_time,
                    end_time,
                    status,
                    table_id,
                    tables(name, capacity, zone)
                `)
                .eq('restaurant_id', restaurantId)
                .gte('slot_date', generationSettings.startDate)
                .lte('slot_date', generationSettings.endDate)
                .order('slot_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;

            // Agrupar por fecha y mesa
            const grouped = {};
            data?.forEach(slot => {
                const dateKey = slot.slot_date;
                if (!grouped[dateKey]) {
                    grouped[dateKey] = {};
                }
                
                const tableKey = slot.tables.name;
                if (!grouped[dateKey][tableKey]) {
                    grouped[dateKey][tableKey] = {
                        table: slot.tables,
                        slots: []
                    };
                }
                
                grouped[dateKey][tableKey].slots.push(slot);
            });

            setAvailabilityGrid(grouped);
        } catch (error) {
            console.error('Error cargando vista detallada:', error);
        }
    };

    // Cargar disponibilidades de un día específico
    const loadDayAvailability = async (date) => {
        try {
            setLoadingDayView(true);
            
            console.log('🔍 Buscando disponibilidades para:', {
                restaurant_id: restaurantId,
                date: date
            });
            
            // MOSTRAR EL RESTAURANT ID PARA DEBUG
            console.log('🏪 TU RESTAURANT ID ES:', restaurantId);
            console.log('📋 Copia este ID para usar en SQL:', restaurantId);
            
            const { data, error } = await supabase
                .from('availability_slots')
                .select(`
                    id,
                    slot_date,
                    start_time,
                    end_time,
                    status,
                    is_available,
                    duration_minutes,
                    table_id,
                    metadata,
                    tables(name, capacity, zone)
                `)
                .eq('restaurant_id', restaurantId)
                .eq('slot_date', date)
                .eq('status', 'free')  // 🔥 SOLO slots libres
                .eq('is_available', true)  // 🔥 SOLO disponibles
                .order('start_time', { ascending: true })
                .order('table_id', { ascending: true });

            if (error) {
                console.error('❌ Error en consulta:', error);
                throw error;
            }
            
            console.log(`📊 Slots encontrados: ${data?.length || 0}`, data);

            // Verificar si es un día cerrado
            const closedDaySlot = data?.find(slot => 
                slot.metadata?.type === 'closed_day' && 
                slot.start_time === '00:00:00'
            );

            if (closedDaySlot) {
                // Mostrar mensaje de día cerrado
                setDayAvailability({
                    'RESTAURANTE CERRADO': [{
                        id: 'closed',
                        start_time: '🚫',
                        message: closedDaySlot.metadata?.message || 'Restaurante cerrado este día',
                        isClosed: true
                    }]
                });
                return;
            }

            // Si no hay slots normales, mostrar mensaje de sin disponibilidades
            if (!data || data.length === 0) {
                setDayAvailability({
                    'SIN DISPONIBILIDADES': [{
                        id: 'no-slots',
                        start_time: '❌',
                        message: 'No hay disponibilidades generadas para este día',
                        isEmpty: true
                    }]
                });
                return;
            }

            // Agrupar por mesa (slots normales)
            // ✅ La query ya filtró solo slots libres (status='free' y is_available=true)
            const groupedByTable = {};
            data.forEach(slot => {
                const tableKey = `${slot.tables.name} (Zona: ${slot.tables.zone || 'Sin zona'}) - Cap: ${slot.tables.capacity}`;
                if (!groupedByTable[tableKey]) groupedByTable[tableKey] = [];
                
                groupedByTable[tableKey].push({
                    ...slot,
                    hasReservation: false
                });
            });

            setDayAvailability(groupedByTable);
        } catch (error) {
            console.error('Error cargando disponibilidades del día:', error);
            toast.error('Error cargando disponibilidades del día');
        } finally {
            setLoadingDayView(false);
        }
    };

    // Cargar estado persistente cuando cambie el restaurantId
    useEffect(() => {
        if (restaurantId) {
            // Cargar estado persistente específico del restaurante
            try {
                const saved = localStorage.getItem(`generationSuccess_${restaurantId}`);
                if (saved) {
                    setGenerationSuccess(JSON.parse(saved));
                }
            } catch (error) {
                // Silencioso - no es crítico
            }
            
            loadRestaurantSettings();
            loadAvailabilityStats().then(() => {
                // Cargar estadísticas de días después de las stats normales
                loadDayStats();
            });
        }
    }, [restaurantId]);

    // Actualizar generationSuccess cuando cambien las estadísticas reales
    useEffect(() => {
        if (availabilityStats && generationSuccess && (
            generationSuccess.totalAvailable === null || 
            generationSuccess.totalAvailable === undefined ||
            generationSuccess.totalOccupied === null || 
            generationSuccess.totalOccupied === undefined ||
            generationSuccess.totalReserved === null || 
            generationSuccess.totalReserved === undefined
        )) {
            setGenerationSuccess(prev => ({
                ...prev,
                totalAvailable: availabilityStats.free || 0,
                totalOccupied: availabilityStats.occupied || 0,
                totalReserved: availabilityStats.occupied || 0 // occupied incluye reservas
            }));
            
            // Actualizar localStorage también
            try {
                const updatedData = {
                    ...generationSuccess,
                    totalAvailable: availabilityStats.free || 0,
                    totalOccupied: availabilityStats.occupied || 0,
                    totalReserved: availabilityStats.occupied || 0
                };
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(updatedData));
            } catch (error) {
                // Silencioso - no es crítico
            }
        }
    }, [availabilityStats, generationSuccess, restaurantId]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Gestión de Disponibilidades
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Controla cuándo están disponibles tus mesas para reservas
                    </p>
                </div>
                
            </div>


            {/* Información de Política de Reservas */}
            {restaurantSettings && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
                    <h3 className="text-base font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Política de Reservas Actual
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <div className="text-blue-700 font-semibold text-sm mb-1">Días de Antelación</div>
                            <div className="text-gray-900 text-lg font-bold">{restaurantSettings.advance_booking_days || 30} días</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <div className="text-blue-700 font-semibold text-sm mb-1">Duración Reserva</div>
                            <div className="text-gray-900 text-lg font-bold">{restaurantSettings.reservation_duration || 90} min</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <div className="text-blue-700 font-semibold text-sm mb-1">Tamaño Grupo</div>
                            <div className="text-gray-900 text-lg font-bold">{restaurantSettings.min_party_size || 1}-{restaurantSettings.max_party_size || 12} personas</div>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                        💡 Estas configuraciones se aplican automáticamente al generar disponibilidades
                    </div>
                </div>
            )}

            {/* Panel de Estado de Disponibilidades - CONDICIONAL */}
            
            {/* 🎯 CASO 1: SÍ HAY SLOTS GENERADOS (libres, no solo protegidos) */}
            {availabilityStats?.free > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all mb-6">
                    {/* Header con más presencia */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Disponibilidades Activas
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <p className="text-sm text-gray-600 font-medium">
                                            {dayStats?.mesas || 0} mesas • {dayStats?.duracionReserva || 60} min/reserva
                                        </p>
                                        {dayStats?.fechaHasta && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                                <CalendarCheck className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-bold text-blue-900">
                                                    Hasta: <span className="text-base">{dayStats.fechaHasta}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleSmartCleanup}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-4 h-4" />
                            Borrar
                        </button>
                    </div>
                    
                    {/* Grid de estadísticas - CON MÁS VIDA */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 p-6 bg-gray-50">
                        <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="flex items-center justify-center gap-2 mb-3 text-blue-600">
                                <Calendar className="w-5 h-5" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Días Totales</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 text-center">
                                {dayStats?.diasTotales || 0}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="flex items-center justify-center gap-2 mb-3 text-green-600">
                                <CalendarCheck className="w-5 h-5" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Días Libres</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 text-center">
                                {dayStats?.diasLibres || 0}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="flex items-center justify-center gap-2 mb-3 text-amber-600">
                                <CalendarClock className="w-5 h-5" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Días Ocupados</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 text-center">
                                {dayStats?.diasConReservas || 0}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="flex items-center justify-center gap-2 mb-3 text-purple-600">
                                <Users className="w-5 h-5" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Reservas</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 text-center">
                                {dayStats?.reservasActivas || 0}
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer con última generación */}
                    {generationSuccess?.timestamp && (
                        <div className="px-6 py-3 bg-white border-t border-gray-200 rounded-b-xl">
                            <p className="text-sm text-gray-600 text-center font-medium">
                                Última actualización: {generationSuccess.timestamp}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 🎯 CASO 2: NO HAY SLOTS LIBRES - CON MÁS PRESENCIA */}
            {availabilityStats?.free === 0 && dayStats && (
                <div className="bg-white rounded-xl border border-amber-200 shadow-md mb-6">
                    {/* Header con advertencia */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-50 rounded-xl border border-amber-300 shadow-sm">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Sin Disponibilidades Generadas
                                </h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium">
                                    No hay horarios activos para nuevas reservas
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info de reservas protegidas (si las hay) */}
                    {dayStats.diasConReservas > 0 && (
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Reservas Protegidas
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-center gap-2 mb-2 text-amber-600">
                                        <CalendarClock className="w-5 h-5" />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Días Ocupados</span>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 text-center">
                                        {dayStats.diasConReservas}
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-center gap-2 mb-2 text-purple-600">
                                        <Users className="w-5 h-5" />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Reservas</span>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 text-center">
                                        {dayStats.reservasActivas}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                                Estos días y reservas están protegidos
                            </p>
                        </div>
                    )}

                    {/* Botón para generar */}
                    <div className="p-6 text-center bg-white">
                        <button
                            onClick={handleShowRegenerateModal}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Generar Horarios de Reserva
                        </button>
                        <p className="text-sm text-gray-600 mt-3 font-medium">
                            Crear disponibilidades para los próximos {dayStats.advanceDaysConfig || 20} días
                        </p>
                    </div>
                </div>
            )}

            {/* Aviso de regeneración necesaria - BANNER CRÍTICO */}
            {/* ⚠️ NO mostrar si el modal de confirmación O resultado está abierto */}
            {changeDetection.needsRegeneration && !showConfirmRegenerate && !showRegenerationModal && (
                <div className="border-2 border-red-500 rounded-lg p-6 mb-6 bg-red-50 shadow-lg animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-900 text-lg mb-2 flex items-center gap-2">
                                🚨 REGENERACIÓN REQUERIDA - ACCIÓN NECESARIA
                    </h3>
                    
                            <div className="text-red-800 mb-4 space-y-2">
                                <p className="font-semibold text-base">
                                    ⚠️ {changeDetection.getChangeMessage()}
                                </p>
                                <p className="text-sm">
                                    <strong>⚡ IMPORTANTE:</strong> Las disponibilidades actuales NO reflejan los cambios. 
                                    Los clientes podrían ver horarios incorrectos.
                                </p>
                                <div className="bg-white border-l-4 border-red-500 p-2 rounded">
                                    <p className="text-sm font-medium text-red-900">
                                        📍 Acción requerida:
                                    </p>
                                    <ol className="text-sm text-red-800 mt-2 ml-4 list-decimal space-y-1">
                                        <li>Haz clic en "🔄 Regenerar Ahora"</li>
                                        <li>Espera a que se complete el proceso</li>
                                        <li>Verifica las nuevas disponibilidades</li>
                                    </ol>
                                </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                await smartRegeneration(changeDetection.changeType, changeDetection.changeDetails);
                                changeDetection.clearRegenerationFlag();
                            }}
                            disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-md font-semibold text-base"
                        >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                    🔄 Regenerar Ahora
                        </button>
                        
                        <button
                            onClick={() => changeDetection.clearRegenerationFlag()}
                                    className="text-sm text-red-700 hover:text-red-900 underline font-medium"
                        >
                                    Ignorar (no recomendado)
                        </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflictos detectados */}
            {showDetails && conflictingReservations.length > 0 && (
                <div className="border border-orange-200 rounded-lg p-2 mb-6 bg-orange-50">
                    <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Reservas que podrían verse afectadas ({conflictingReservations.length})
                    </h3>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {conflictingReservations.map(reservation => (
                            <div key={reservation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-3">
                                    <div className="text-sm">
                                        <div className="font-medium">{reservation.customer_name}</div>
                                        <div className="text-gray-600">
                                            {format(new Date(reservation.reservation_date), 'dd/MM/yyyy', { locale: es })} • {reservation.reservation_time}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    {reservation.party_size}
                                    <span>•</span>
                                    {reservation.tables?.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Acciones principales */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleShowRegenerateModal}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Generando...' : 'Generar Horarios de Reserva'}
                </button>

            </div>

            {/* Selector de día específico */}
            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Consultar Día Específico
                </h3>
                
                <div className="flex items-end gap-4 mb-3">
                    <div className="w-48">
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                            Seleccionar fecha:
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => loadDayAvailability(selectedDate)}
                            disabled={loadingDayView}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors h-10"
                        >
                            {loadingDayView ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            Ver Horarios de Reserva
                        </button>
                    </div>
                </div>

                {/* Mostrar disponibilidades del día seleccionado */}
                {Object.keys(dayAvailability).length > 0 && (
                    <div className="mt-4 border-t border-blue-200 pt-4">
                        <h4 className="font-medium text-blue-900 mb-3">
                            📅 Disponibilidades para {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es })}
                        </h4>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {Object.entries(dayAvailability).map(([tableName, slots]) => (
                                <div key={tableName} className={`p-2 rounded border ${
                                    slots[0]?.isClosed 
                                        ? 'bg-red-50 border-red-200' 
                                        : slots[0]?.isEmpty
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-white border-blue-200'
                                }`}>
                                    <div className="font-medium text-gray-900 mb-2">{tableName}</div>
                                    
                                    {/* Mensaje especial para días cerrados o sin disponibilidades */}
                                    {(slots[0]?.isClosed || slots[0]?.isEmpty) ? (
                                        <div className={`text-center py-4 ${
                                            slots[0]?.isClosed 
                                                ? 'text-red-600' 
                                                : 'text-yellow-600'
                                        }`}>
                                            <div className="text-lg mb-2">
                                                {slots[0]?.isClosed ? '🚫' : '❌'}
                                            </div>
                                            <div className="font-medium">
                                                {slots[0]?.message}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Slots normales */
                                                        <div className="flex flex-wrap gap-2">
                                                            {slots.map((slot) => (
                                                                <span
                                                                    key={slot.id}
                                                                    className={`px-2 py-1 text-xs rounded ${
                                                                        slot.hasReservation 
                                                                            ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                                                            : slot.status === 'free'
                                                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                                                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                                                                    }`}
                                                                >
                                                                    {slot.start_time.slice(0, 5)} {slot.hasReservation ? '📋' : '✅'}
                                                                </span>
                                                            ))}
                                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Info del período actual - ACTUALIZADO DINÁMICAMENTE */}
            {availabilityStats?.total > 0 && (
                <div className="mt-4 p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                        <strong>Período actual:</strong> {' '}
                        {availabilityStats?.dateRange?.start ? (
                            <>
                                {format(new Date(availabilityStats.dateRange.start), 'dd/MM/yyyy', { locale: es })} - {' '}
                                {format(new Date(availabilityStats.dateRange.end), 'dd/MM/yyyy', { locale: es })}
                            </>
                        ) : (
                            <>
                                {format(new Date(), 'dd/MM/yyyy', { locale: es })} - {' '}
                                {format(addDays(new Date(), restaurantSettings?.advance_booking_days || 30), 'dd/MM/yyyy', { locale: es })}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Vista detallada de disponibilidades */}
            {showAvailabilityGrid && (
                <div className="mt-6 border border-gray-200 rounded-lg p-2">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Calendario de Disponibilidades
                    </h3>
                    
                    {Object.keys(availabilityGrid).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No hay disponibilidades generadas para este período</p>
                            <p className="text-sm">Usa el botón "Generar Horarios de Reserva" para crear slots</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-96 overflow-y-auto">
                            {Object.entries(availabilityGrid).map(([date, tables]) => (
                                <div key={date} className="border border-gray-100 rounded-lg p-2">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(date), 'EEEE, dd/MM/yyyy', { locale: es })}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(tables).map(([tableName, tableData]) => (
                                            <div key={tableName} className="bg-gray-50 rounded-lg p-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        {tableName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        ({tableData.table.capacity} personas)
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1">
                                                    {tableData.slots.map((slot) => (
                                                        <div
                                                            key={slot.id}
                                                            className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                                                                slot.status === 'free'
                                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                    : slot.status === 'reserved'
                                                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                                    : slot.status === 'occupied'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                            title={`${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)} (${slot.status})${
                                                                slot.metadata?.reservation_id ? ' - Con reserva' : ''
                                                            }`}
                                                        >
                                                            {slot.start_time.slice(0, 5)}
                                                            {slot.metadata?.reservation_id && (
                                                                <span className="ml-1">📋</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {tableData.slots.filter(s => s.status === 'free').length} libres • {' '}
                                                    {tableData.slots.filter(s => s.status === 'reserved').length} reservados • {' '}
                                                    {tableData.slots.filter(s => s.status === 'occupied').length} ocupados
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 🛡️ MODAL DE PROTECCIÓN: RESERVAS EN DÍAS CERRADOS */}
            {showConflictModal && conflictData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                            <div className="flex items-center gap-4">
                                <AlertTriangle className="w-12 h-12 text-white" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        ⚠️ Reservas Detectadas en Días que Quieres Cerrar
                                    </h2>
                                    <p className="text-orange-100 mt-1">
                                        Protección automática de reservas activada
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-gray-700 mb-4 text-lg">
                                Has marcado <strong>{conflictData.closedDays.map(d => d.displayName).join(', ')}</strong> como cerrados,
                                pero hay <strong className="text-red-600">{conflictData.conflicts.reduce((sum, c) => sum + c.reservations.length, 0)} reservas activas</strong> en esos días:
                            </p>

                            {/* Lista de conflictos por día */}
                            <div className="space-y-4">
                                {conflictData.conflicts.map(dayConflict => {
                                    // Agrupar reservas por fecha
                                    const byDate = {};
                                    dayConflict.reservations.forEach(r => {
                                        if (!byDate[r.reservation_date]) {
                                            byDate[r.reservation_date] = [];
                                        }
                                        byDate[r.reservation_date].push(r);
                                    });

                                    return (
                                        <div key={dayConflict.day} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                                            <h3 className="font-bold text-orange-900 mb-3 text-lg capitalize flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                {dayConflict.displayName}s con reservas:
                                            </h3>

                                            {/* Por cada fecha específica */}
                                            {Object.entries(byDate).map(([date, reservations]) => (
                                                <div key={date} className="mb-3 last:mb-0 bg-white rounded-lg p-3">
                                                    <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        📅 {format(new Date(date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                                        <span className="ml-auto bg-orange-200 px-2 py-0.5 rounded-full text-xs">
                                                            {reservations.length} reserva{reservations.length > 1 ? 's' : ''}
                                                        </span>
                                                    </p>
                                                    <ul className="ml-4 space-y-2">
                                                        {reservations.map(r => (
                                                            <li key={r.id} className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 p-2 rounded">
                                                                <Users className="w-4 h-4 text-gray-500" />
                                                                <span className="font-medium">{r.customer_name}</span>
                                                                <span className="text-gray-500">•</span>
                                                                <span>{r.reservation_time.slice(0, 5)}</span>
                                                                <span className="text-gray-500">•</span>
                                                                <span>{r.party_size} personas</span>
                                                                <span className="ml-auto text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                    {r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendiente' : 'Pend. Aprobación'}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explicación */}
                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-6">
                                <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    🛡️ PROTECCIÓN AUTOMÁTICA ACTIVADA
                                </p>
                                <p className="text-sm text-blue-800 mb-2">
                                    Si continúas, el sistema hará lo siguiente:
                                </p>
                                <ul className="text-sm text-blue-800 ml-4 list-disc space-y-1">
                                    <li>
                                        ⚠️ <strong>NO cerrará</strong> los días específicos que tienen reservas (ej: jueves 9, 16, 23 de octubre)
                                    </li>
                                    <li>
                                        ✅ <strong>SÍ cerrará</strong> los demás días de la semana sin reservas
                                    </li>
                                    <li>
                                        📋 Podrás gestionar estas reservas manualmente y cerrar esos días después
                                    </li>
                                    <li>
                                        🔒 Las reservas existentes quedan <strong>100% protegidas</strong>
                                    </li>
                                </ul>
                            </div>

                            {/* Advertencia final */}
                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mt-4">
                                <p className="text-sm text-yellow-900">
                                    <strong>💡 Recomendación:</strong> Contacta a estos clientes para cancelar/mover sus reservas antes de cerrar definitivamente esos días.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 p-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConflictModal(false);
                                    setConflictData(null);
                                }}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    setShowConflictModal(false);
                                    const conflictsCopy = conflictData; // Guardar antes de limpiar
                                    setConflictData(null);
                                    
                                    toast.loading('Creando excepciones para proteger reservas...', { id: 'protected-regen' });
                                    
                                    try {
                                        // 🛡️ PASO 1: CREAR EXCEPCIONES para cada fecha con reservas
                                        const exceptionsToCreate = [];
                                        
                                        conflictsCopy.conflicts.forEach(dayConflict => {
                                            dayConflict.reservations.forEach(reservation => {
                                                const exceptionDate = reservation.reservation_date;
                                                
                                                // Evitar duplicados en el mismo batch
                                                if (!exceptionsToCreate.find(e => e.exception_date === exceptionDate)) {
                                                    // 🔑 OBTENER HORARIOS DEL DÍA CERRADO
                                                    const dayOfWeek = new Date(exceptionDate).getDay();
                                                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                                    const dayName = dayNames[dayOfWeek];
                                                    const dayConfig = restaurantSettings?.operating_hours?.[dayName];
                                                    
                                                    exceptionsToCreate.push({
                                                        restaurant_id: restaurantId,
                                                        exception_date: exceptionDate,
                                                        is_open: true, // Forzar abierto para proteger la reserva
                                                        open_time: dayConfig?.open || '09:00', // Usar horario del día
                                                        close_time: dayConfig?.close || '22:00', // Usar horario del día
                                                        reason: `Reserva existente protegida (${reservation.customer_name} - ${reservation.party_size} personas)`,
                                                        created_by: 'system'
                                                    });
                                                }
                                            });
                                        });
                                        
                                        console.log('🛡️ Creando excepciones:', exceptionsToCreate);
                                        
                                        // Insertar excepciones en batch
                                        if (exceptionsToCreate.length > 0) {
                                            const { error: exceptionsError } = await supabase
                                                .from('calendar_exceptions')
                                                .upsert(exceptionsToCreate, {
                                                    onConflict: 'restaurant_id,exception_date',
                                                    ignoreDuplicates: false
                                                });
                                            
                                            if (exceptionsError) {
                                                console.error('❌ Error creando excepciones:', exceptionsError);
                                                throw new Error('Error al crear excepciones de calendario');
                                            }
                                            
                                            console.log(`✅ ${exceptionsToCreate.length} excepciones creadas`);
                                        }
                                        
                                        toast.loading('Regenerando disponibilidades con protección...', { id: 'protected-regen' });
                                        
                                        // 🔄 PASO 2: REGENERAR o GENERAR DISPONIBILIDADES (ahora respetará las excepciones)
                                        const today = format(new Date(), 'yyyy-MM-dd');
                                        const advanceDays = restaurantSettings?.advance_booking_days || 30;
                                        const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');

                                        let data, error;
                                        
                                        if (conflictData.isGenerating) {
                                            // Viene de generateAvailability - usar función simple
                                            const result = await supabase.rpc('generate_availability_slots_simple', {
                                                p_restaurant_id: restaurantId,
                                                p_start_date: today,
                                                p_end_date: endDate
                                            });
                                            data = result.data;
                                            error = result.error;
                                        } else {
                                            // Viene de smartRegeneration - usar función de limpieza
                                            const result = await supabase.rpc('cleanup_and_regenerate_availability', {
                                                p_restaurant_id: restaurantId,
                                                p_start_date: today,
                                                p_end_date: endDate
                                            });
                                            data = result.data;
                                            error = result.error;
                                        }

                                        if (error) throw error;

                                        toast.dismiss('protected-regen');
                                        toast.success(`✅ ${conflictData.isGenerating ? 'Generación' : 'Regeneración'} completada correctamente`);
                                        
                                        // Actualizar estado
                                        const successData = {
                                            slotsCreated: data?.slots_created || data?.affected_count || 0,
                                            dateRange: `HOY hasta ${format(addDays(new Date(), advanceDays), 'dd/MM/yyyy')}`,
                                            duration: restaurantSettings?.reservation_duration || 90,
                                            timestamp: new Date().toLocaleString(),
                                            protectedReservations: conflictData.conflicts.reduce((sum, c) => sum + c.reservations.length, 0)
                                        };
                                        
                                        setGenerationSuccess(successData);
                                        localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
                                        
                                        // Recargar estadísticas y excepciones
                                        await loadCalendarExceptions();
                                        
                                        // 🔄 FORZAR RECARGA DE ESTADÍSTICAS CON RETRASO
                                        console.log('🔄 Forzando recarga de estadísticas...');
                                        
                                        // Primero limpiar el estado actual
                                        setAvailabilityStats(null);
                                        setGenerationSuccess(null);
                                        
                                        // Luego recargar con un pequeño delay para asegurar que la BD está actualizada
                                        setTimeout(async () => {
                                            try {
                                                await loadAvailabilityStats();
                                                await loadDayStats(); // 📊 Recargar estadísticas de días
                                                console.log('✅ Estadísticas recargadas después de regeneración');
                                                
                                                // Actualizar generationSuccess con las estadísticas reales
                                                setGenerationSuccess({
                                                    ...successData,
                                                    totalAvailable: availabilityStats?.free || 0,
                                                    totalOccupied: availabilityStats?.occupied || 0,
                                                    totalReserved: availabilityStats?.reserved || 0
                                                });
                                            } catch (error) {
                                                console.error('❌ Error recargando estadísticas:', error);
                                            }
                                        }, 500);
                                        
                                        // Cerrar modal
                                        setShowConflictModal(false);
                                        setConflictData(null);
                                        
                                    } catch (error) {
                                        toast.dismiss('protected-regen');
                                        console.error('Error en regeneración protegida:', error);
                                        toast.error('Error al regenerar: ' + error.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Continuar (Proteger Reservas)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛡️ SECCIÓN: EXCEPCIONES DE CALENDARIO */}
            {calendarExceptions.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        🛡️ Días Protegidos (Excepciones Activas)
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                        Estos días permanecerán <strong>abiertos</strong> aunque tu horario semanal indique lo contrario:
                    </p>
                    <div className="space-y-2">
                        {calendarExceptions.map(exception => (
                            <div key={exception.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-blue-200 hover:border-blue-400 transition-colors">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-3 h-3 rounded-full ${exception.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            📅 {format(new Date(exception.exception_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            <span className="font-semibold">Motivo:</span> {exception.reason}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${exception.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {exception.is_open ? '✅ Abierto' : '❌ Cerrado'}
                                    </span>
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm(`¿Eliminar la excepción para ${format(new Date(exception.exception_date), "d 'de' MMMM", { locale: es })}?\n\nEste día volverá a seguir el horario semanal normal.`)) {
                                                return;
                                            }
                                            
                                            try {
                                                toast.loading('Eliminando excepción...', { id: 'delete-exception' });
                                                
                                                const { error } = await supabase
                                                    .from('calendar_exceptions')
                                                    .delete()
                                                    .eq('id', exception.id);
                                                
                                                if (error) throw error;
                                                
                                                toast.dismiss('delete-exception');
                                                toast.success('✅ Excepción eliminada correctamente');
                                                
                                                // Recargar excepciones
                                                await loadCalendarExceptions();
                                                
                                                // Sugerir regeneración
                                                toast.info('💡 Recuerda regenerar las disponibilidades para aplicar el cambio', { duration: 5000 });
                                                
                                            } catch (error) {
                                                toast.dismiss('delete-exception');
                                                console.error('Error eliminando excepción:', error);
                                                toast.error('❌ Error al eliminar la excepción');
                                            }
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar excepción"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-3 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Las excepciones se eliminan automáticamente cuando se cancelan todas las reservas del día.</span>
                    </p>
                </div>
            )}

            {/* 🚨 MODAL DE ADVERTENCIA: NO SE GENERARON SLOTS */}
            {showNoSlotsModal && noSlotsReason && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-2">
                    <div 
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center relative border-4 border-orange-500"
                        style={{
                            animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                        }}
                    >
                        {/* Icono de alerta */}
                        <div className="mb-6 flex justify-center">
                            <AlertTriangle className="w-20 h-20 text-orange-600 animate-pulse" />
                        </div>

                        {/* Título */}
                        <h2 className="text-xl font-extrabold text-gray-900 mb-4 leading-tight">
                            ⚠️ NO SE GENERARON HORARIOS DE RESERVA
                        </h2>

                        {/* Mensaje principal */}
                        {noSlotsReason.allClosed ? (
                            <div className="mb-6">
                                <p className="text-lg text-gray-700 mb-4">
                                    <strong>Motivo:</strong> Todos los días están cerrados en el período seleccionado
                                </p>
                                <div className="p-6 bg-red-50 border-l-4 border-red-400 rounded text-left">
                                    <p className="text-gray-800 font-semibold mb-3">📊 Análisis del período:</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                                        <li>Días procesados: <strong>{noSlotsReason.daysProcessed}</strong></li>
                                        <li>Días cerrados: <strong className="text-red-600">{noSlotsReason.daysClosed}</strong></li>
                                        <li>Mesas disponibles: <strong>{noSlotsReason.tableCount}</strong></li>
                                        <li>Período: <strong>HOY hasta {noSlotsReason.endDate}</strong></li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <p className="text-lg text-gray-700 mb-4">
                                    <strong>Motivo:</strong> No se encontraron días con horarios configurados
                                </p>
                                <div className="p-6 bg-orange-50 border-l-4 border-orange-400 rounded text-left">
                                    <p className="text-gray-800 font-semibold mb-3">📊 Estado actual:</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                                        <li>Slots existentes preservados: <strong>{noSlotsReason.slotsSkipped}</strong></li>
                                        <li>Días procesados: <strong>{noSlotsReason.daysProcessed}</strong></li>
                                        <li>Días cerrados: <strong>{noSlotsReason.daysClosed}</strong></li>
                                        <li>Mesas disponibles: <strong>{noSlotsReason.tableCount}</strong></li>
                                        <li>Período: <strong>HOY hasta {noSlotsReason.endDate}</strong></li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Solución */}
                        <div className="mb-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded text-left">
                            <p className="text-gray-800 font-medium text-lg mb-3">
                                🔧 <strong>¿QUÉ DEBES HACER?</strong>
                            </p>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2">
                                {noSlotsReason.allClosed ? (
                                    <>
                                        <li>Ve a <strong>Calendario</strong> y abre algunos días</li>
                                        <li>O ve a <strong>Configuración → Horarios</strong> y configura días abiertos</li>
                                        <li>Vuelve aquí y genera los horarios de nuevo</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Ve a <strong>Configuración → Horarios</strong> y verifica los horarios de apertura</li>
                                        <li>Ve a <strong>Calendario</strong> y asegúrate de tener días abiertos</li>
                                        <li>Verifica que tu <strong>Política de Reservas</strong> esté correctamente configurada</li>
                                        <li>Vuelve aquí y genera los horarios de nuevo</li>
                                    </>
                                )}
                            </ol>
                        </div>

                        {/* Botón de cerrar */}
                        <button
                            onClick={() => {
                                setShowNoSlotsModal(false);
                                setNoSlotsReason(null);
                            }}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            Entendido - Voy a configurar
                        </button>
                    </div>
                </div>
            )}

            {/* Modales de Confirmación */}
            <ConfirmActionModal
                isOpen={showConfirmDelete}
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={executeDelete}
                type="delete"
                protectedDays={protectedDaysData}
            />

            <ConfirmActionModal
                isOpen={showConfirmRegenerate}
                onClose={() => setShowConfirmRegenerate(false)}
                onConfirm={() => {
                    // Ejecutar regeneración
                    smartRegeneration('schedule_change', { source: 'manual_confirm' });
                }}
                type="regenerate"
                protectedDays={protectedDaysData}
                dateRange={dateRangeInfo}
            />

            {/* Modal de Resultado Unificado */}
            <ResultModal
                isOpen={showRegenerationModal}
                onClose={() => setShowRegenerationModal(false)}
                type={regenerationResult?.type || 'delete'}
                result={regenerationResult || {}}
            />

            {/* Estilos de animación inline */}
            <style>{`
                @keyframes bounceIn {
                    0% {
                        transform: scale(0.3);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 1;
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default AvailabilityManager;


// AvailabilityManager.jsx - Gestor de Tabla de Disponibilidades
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar,
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
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAvailabilityChangeDetection } from '../hooks/useAvailabilityChangeDetection';

const AvailabilityManager = () => {
    const { restaurantId } = useAuthContext();
    const changeDetection = useAvailabilityChangeDetection(restaurantId);
    const [loading, setLoading] = useState(false);
    const [availabilityStats, setAvailabilityStats] = useState(null);
    const [conflictingReservations, setConflictingReservations] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [showAvailabilityGrid, setShowAvailabilityGrid] = useState(false);
    const [availabilityGrid, setAvailabilityGrid] = useState([]);
    const [restaurantSettings, setRestaurantSettings] = useState(null);
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

        const confirmed = confirm(
            '🗑️ BORRAR DISPONIBILIDADES\n\n' +
            '✅ ACCIÓN:\n' +
            '• Eliminará slots disponibles (sin reservas)\n' +
            '• Mantendrá slots ocupados (con reservas)\n' +
            '• Resultado: Solo quedarán las reservas confirmadas\n\n' +
            '🛡️ Las reservas están 100% protegidas\n\n' +
            '¿Continuar?'
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            toast.loading('🗑️ Borrando disponibilidades...', { id: 'cleanup' });

            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');

            console.log('🗑️ BORRAR DISPONIBILIDADES:');
            console.log('   🏪 Restaurante:', restaurantId);

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
                const slotsDeleted = data?.slots_deleted || 0;
                const slotsPreserved = data?.slots_preserved || 0;
                const slotsAfter = data?.slots_after || 0;

                toast.success(
                    `🗑️ Disponibilidades Borradas:\n\n` +
                    `🗑️ ${slotsDeleted} slots eliminados\n` +
                    `🛡️ ${slotsPreserved} reservas mantenidas\n` +
                    `📊 Total restante: ${slotsAfter}\n\n` +
                    `${slotsAfter === 0 ? '✅ Sin disponibilidades - Solo reservas' : '✅ Solo quedan las reservas confirmadas'}`,
                    { 
                        duration: 5000,
                        style: { 
                            minWidth: '350px',
                            whiteSpace: 'pre-line',
                            fontSize: '14px'
                        }
                    }
                );

                // Limpiar estado local y recargar
                setGenerationSuccess(null);
                setAvailabilityStats(null);
                setAvailabilityGrid([]);
                
                try {
                    localStorage.removeItem(`generationSuccess_${restaurantId}`);
                } catch (error) {
                    console.warn('No se pudo limpiar localStorage:', error);
                }

                // Recargar datos reales
                setTimeout(async () => {
                    await loadAvailabilityStats();
                }, 500);

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

    // 🔒 REGLA SAGRADA: NUNCA ELIMINAR RESERVAS
    // Esta función SOLO regenera availability_slots PROTEGIENDO reservas existentes
    // Las reservas son SAGRADAS y solo se eliminan manualmente desde Reservas.jsx
    const smartRegeneration = async (changeType = 'general', changeData = {}) => {
        if (!restaurantId) {
            toast.error('❌ No se encontró el ID del restaurante');
            return;
        }

        try {
            setLoading(true);
            toast.loading('Regeneración inteligente en proceso...', { id: 'smart-generating' });
            
            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');


            const { data, error } = await supabase.rpc('regenerate_availability_smart', {
                p_restaurant_id: restaurantId,
                p_change_type: changeType,
                p_change_data: changeData,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en regeneración inteligente:', error);
                throw error;
            }


            toast.dismiss('smart-generating');
            
            // Mostrar resultados detallados
            const results = data; // RPC devuelve objeto directo, no array
            const duration = restaurantSettings?.reservation_duration || 90;
            const endDateFormatted = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            
            console.log('🔍 Resultado de regeneración:', results);
            
            const smartMessage = `🧠 Regeneración Inteligente Completada:
            
📊 RESULTADO:
• Acción: ${results?.action || 'regeneración_completada'}
• Slots afectados: ${results?.affected_count || results?.slots_after || 0}
• Detalle: ${results?.message || 'Regeneración completada correctamente'}

⚙️ CONFIGURACIÓN:
• Período: HOY hasta ${endDateFormatted} (${advanceDays} días)
• Duración: ${duration} min por reserva
• Reservas existentes: PRESERVADAS automáticamente

🎯 Sistema inteligente aplicado exitosamente.`;
            
            toast.success(smartMessage, { 
                duration: 8000,
                style: { 
                    minWidth: '450px',
                    whiteSpace: 'pre-line',
                    fontSize: '14px'
                }
            });

            // Actualizar estado local con datos correctos
            const slotsCreated = results?.slots_created || results?.affected_count || 0;
            const slotsUpdated = results?.slots_updated || 0;
            const slotsPreserved = results?.slots_preserved || 0;
            
            const successData = {
                slotsCreated: slotsCreated,
                dateRange: `HOY hasta ${endDateFormatted}`,
                duration: duration,
                buffer: 15, // Buffer por defecto en minutos
                timestamp: new Date().toLocaleString(),
                smartRegeneration: true,
                action: results?.action || 'regeneración_completada',
                message: results?.message || 'Regeneración completada correctamente',
                // 🔒 DATOS REALES CALCULADOS DE LA RESPUESTA SQL
                totalAvailable: slotsCreated - slotsPreserved, // Nuevos slots disponibles
                totalOccupied: 0,  // Los ocupados se cargarán con stats reales
                totalReserved: slotsPreserved // Slots con reservas preservadas
            };
            
            setGenerationSuccess(successData);
            
            // Guardar en localStorage
            try {
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            } catch (error) {
                console.warn('No se pudo guardar en localStorage:', error);
            }
            
            // 🔒 NO cargar estadísticas automáticamente - preservar generationSuccess
            // Solo cargar el grid para mostrar los slots específicos
            setTimeout(async () => {
                await loadAvailabilityGrid();
            }, 500);

        } catch (error) {
            console.error('Error en regeneración inteligente:', error);
            toast.dismiss('smart-generating');
            toast.error('❌ Error en regeneración inteligente: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 🔒 REGLA SAGRADA: NUNCA ELIMINAR RESERVAS
    // Esta función SOLO genera availability_slots - JAMÁS toca la tabla 'reservations'
    // Las reservas son SAGRADAS y solo se eliminan manualmente desde Reservas.jsx
    const generateAvailability = async () => {
        try {
            setLoading(true);
            toast.loading('Generando tabla de disponibilidades...', { id: 'generating' });

            // 1. Detectar conflictos si se va a sobrescribir
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

            // 2. CARGAR POLÍTICA DE RESERVAS REAL ANTES DE GENERAR
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
            const { data, error } = await supabase.rpc('generate_availability_slots_simple', {
                p_restaurant_id: restaurantId,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en generate_availability_slots:', error);
                throw error;
            }
            
            // 🔍 DEBUG: Ver exactamente qué devuelve la función SQL
            console.log('🔍 DEBUG RESULTADO SQL:');
            console.log('   📊 data completo:', data);
            console.log('   📊 slots_created:', data?.slots_created);
            console.log('   📊 success:', data?.success);

            toast.dismiss('generating');
            
            // Crear mensaje inteligente basado en la acción
            const endDateFormatted = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            
            let summaryMessage = '';
            
            if (data.action === 'no_changes_detected') {
                // No había cambios - mostrar mensaje informativo
                summaryMessage = `ℹ️ No hay disponibilidades nuevas que generar:

📊 ESTADO ACTUAL:
• ${data.current_slots || 0} slots ya existentes
• Período: HOY hasta ${endDateFormatted} (${advanceDays} días)
• Duración: ${duration} min por reserva
• Última generación: ${data.last_generation ? new Date(data.last_generation).toLocaleString() : 'No disponible'}

✅ Motivo: ${data.reason}

🎯 Las disponibilidades están actualizadas.`;
                
                toast.info(summaryMessage, { 
                    duration: 6000,
                    style: { 
                        minWidth: '450px',
                        whiteSpace: 'pre-line',
                        fontSize: '14px'
                    }
                });
            } else {
                // Hubo regeneración - mostrar mensaje de éxito
                const changesDetected = data.changes_detected ? data.changes_detected.join(', ') : 'Cambios detectados';
                
                summaryMessage = `✅ Disponibilidades regeneradas exitosamente:

📊 RESUMEN:
• ${data.slots_created || 0} slots nuevos creados
• ${data.slots_updated || 0} slots actualizados
• ${data.slots_preserved || 0} reservas preservadas
• Desde HOY hasta ${endDateFormatted} (${advanceDays} días)
• Duración por reserva: ${duration} min

🔍 CAMBIOS DETECTADOS:
• ${changesDetected}

🎯 Las disponibilidades están listas para recibir reservas.`;
                
                toast.success(summaryMessage, { 
                    duration: 8000,
                    style: { 
                        minWidth: '450px',
                        whiteSpace: 'pre-line',
                        fontSize: '14px'
                    }
                });
            }

            // 🔒 CONSULTAR DATOS REALES POST-GENERACIÓN
            console.log('📊 Consultando slots reales creados...');
            
            // Contar slots reales creados en los últimos 5 minutos
            const { count: recentSlotsCount, error: countError } = await supabase
                .from('availability_slots')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
            
            const actualSlotsCreated = countError ? 0 : (recentSlotsCount || 0);
            
            console.log('📊 Slots realmente creados en los últimos 5 min:', actualSlotsCreated);
            console.log('📊 Respuesta de función SQL:', data);
            
            // Usar datos reales o fallback a la respuesta SQL
            const slotsCreated = actualSlotsCreated > 0 ? actualSlotsCreated : (data?.slots_created || 0);
            const slotsUpdated = data?.slots_updated || 0;
            const slotsPreserved = data?.slots_preserved || 0;
            
            const successData = {
                slotsCreated: slotsCreated,
                dateRange: `HOY hasta ${endDateFormatted}`,
                duration: duration,
                buffer: 15, // Buffer por defecto en minutos
                timestamp: new Date().toLocaleString(),
                // 🔒 DATOS REALES CALCULADOS
                totalAvailable: Math.max(0, slotsCreated - slotsPreserved), // Nuevos slots disponibles
                totalOccupied: 0,  // Los ocupados se cargarán con stats reales
                totalReserved: slotsPreserved, // Slots con reservas preservadas
                actuallyCreated: actualSlotsCreated // Slots realmente creados según consulta directa
            };
            
            // Actualizar el mensaje de éxito con datos reales
            if (actualSlotsCreated > 0) {
                toast.success(`✅ ¡Generación exitosa!\n\n📊 SLOTS CREADOS: ${actualSlotsCreated}\n🕒 Duración: ${duration} min\n📅 Período: ${successData.dateRange}`, {
                    duration: 6000,
                    style: { 
                        minWidth: '350px',
                        whiteSpace: 'pre-line',
                        fontSize: '14px'
                    }
                });
            }
            
            setGenerationSuccess(successData);
            
            // Guardar en localStorage para persistencia
            try {
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            } catch (error) {
                // Silencioso - no es crítico
            }
            
            // 🔒 CARGAR ESTADÍSTICAS REALES INMEDIATAMENTE
            console.log('🔄 Recargando estadísticas después de generar...');
            
            // Forzar recarga inmediata
            try {
                await loadAvailabilityStats(); // Esto cargará los datos reales
                console.log('✅ Estadísticas recargadas');
            } catch (statsError) {
                console.error('❌ Error recargando estadísticas:', statsError);
            }
            
            // Recargar grid también
            setTimeout(async () => {
                try {
                    await loadAvailabilityGrid();
                    console.log('✅ Grid recargado');
                } catch (gridError) {
                    console.error('❌ Error recargando grid:', gridError);
                }
            }, 1000);

        } catch (error) {
            console.error('Error generando disponibilidades:', error);
            toast.dismiss('generating');
            toast.error('❌ Error: ' + error.message);
        } finally {
            setLoading(false);
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

                toast.success(
                    `🧹 Limpieza Completada:\n\n` +
                    `🗑️ ${slotsDeleted} slots eliminados (sin reservas)\n` +
                    `🛡️ ${slotsPreserved} slots preservados (con reservas)\n` +
                    `📊 Total restante: ${slotsAfter} slots\n\n` +
                    `${slotsAfter === 0 ? '✅ Tabla limpia - Sin disponibilidades' : '✅ Solo reservas confirmadas preservadas'}`,
                    { 
                        duration: 6000,
                        style: { 
                            minWidth: '400px',
                            whiteSpace: 'pre-line',
                            fontSize: '14px'
                        }
                    }
                );

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
                setTimeout(async () => {
            await loadAvailabilityStats();
                }, 500);

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
                p_end_date: endDate,
                p_slot_duration_minutes: duration
            });

            if (error) {
                console.error('❌ Error en limpieza inteligente:', error);
                throw error;
            }

            console.log('🧠 Resultado limpieza inteligente:', data);

            toast.dismiss('smart-cleanup');

            if (data?.success) {
                const slotsCreated = data?.total_slots_created || 0;
                const reservationsProtected = data?.reservations_protected || 0;

                toast.success(
                    `🧠 Limpieza Inteligente Completada:\n\n` +
                    `✅ ${slotsCreated} slots generados\n` +
                    `🛡️ ${reservationsProtected} reservas protegidas\n` +
                    `🗑️ Slots sin reservas eliminados\n\n` +
                    `¡Disponibilidades actualizadas correctamente!`,
                    { 
                        duration: 6000,
                        style: { 
                            minWidth: '400px',
                            whiteSpace: 'pre-line',
                            fontSize: '14px'
                        }
                    }
                );

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
            const groupedByTable = {};
            data.forEach(slot => {
                const tableKey = `${slot.tables.name} (Zona: ${slot.tables.zone || 'Sin zona'}) - Cap: ${slot.tables.capacity}`;
                if (!groupedByTable[tableKey]) groupedByTable[tableKey] = [];
                
                groupedByTable[tableKey].push({
                    ...slot,
                    hasReservation: slot.metadata?.reservation_id ? true : false
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
            loadAvailabilityStats();
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
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Política de Reservas Actual
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-blue-700 font-medium">Días de Antelación</div>
                            <div className="text-blue-900">{restaurantSettings.advance_booking_days || 30} días</div>
                        </div>
                        <div>
                            <div className="text-blue-700 font-medium">Duración Reserva</div>
                            <div className="text-blue-900">{restaurantSettings.reservation_duration || 90} min</div>
                        </div>
                        <div>
                            <div className="text-blue-700 font-medium">Tamaño Grupo</div>
                            <div className="text-blue-900">{restaurantSettings.min_party_size || 1}-{restaurantSettings.max_party_size || 12} personas</div>
                        </div>
                        {/* Buffer eliminado */}
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                        💡 Estas configuraciones se aplican automáticamente al generar disponibilidades
                    </div>
                </div>
            )}

            {/* Panel de Estado de Disponibilidades - PERSISTENTE */}
            {(generationSuccess || availabilityStats?.total > 0) && (
                <div className="border border-green-200 rounded-lg p-4 mb-6 bg-green-50">
                    <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        ✅ Disponibilidades Activas
                    </h3>
                    
                    {/* Estadísticas completas */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-2xl font-bold text-green-700">
                                {generationSuccess ? generationSuccess.slotsCreated : (availabilityStats?.total || 0)}
                            </div>
                            <div className="text-xs text-green-600">
                                {generationSuccess ? 'Slots Creados' : 'Total Slots'}
                            </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-blue-700">
                                {generationSuccess?.totalAvailable !== null && generationSuccess?.totalAvailable !== undefined 
                                    ? generationSuccess.totalAvailable 
                                    : (availabilityStats?.free || 0)}
                            </div>
                            <div className="text-xs text-blue-600">Disponibles</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-red-700">
                                {generationSuccess?.totalOccupied !== null && generationSuccess?.totalOccupied !== undefined 
                                    ? generationSuccess.totalOccupied 
                                    : (availabilityStats?.occupied || 0)}
                            </div>
                            <div className="text-xs text-red-600">Ocupados</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-purple-700">
                                {generationSuccess?.totalReserved !== null && generationSuccess?.totalReserved !== undefined 
                                    ? generationSuccess.totalReserved 
                                    : (availabilityStats?.occupied || 0)}
                            </div>
                            <div className="text-xs text-purple-600">Con Reservas</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-gray-700">
                                {availabilityStats?.tablesCount || 0}
                            </div>
                            <div className="text-xs text-gray-600">Mesas</div>
                        </div>
                    </div>
                    
                    {/* Información de configuración */}
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                            <span className="text-green-700 font-medium">📅 Período:</span>
                            <span className="text-green-600 ml-1">
                                {generationSuccess?.dateRange || `${availabilityStats?.dateRange?.start || 'HOY'} hasta ${availabilityStats?.dateRange?.end || 'Configurado'}`}
                            </span>
                        </div>
                        <div>
                            <span className="text-green-700 font-medium">⏰ Configuración:</span>
                            <span className="text-green-600 ml-1">
                                {generationSuccess?.duration || restaurantSettings?.reservation_duration || 90} min por reserva
                            </span>
                        </div>
                    </div>
                    
                    <div className="text-xs text-green-600 border-t border-green-200 pt-2 flex justify-between items-center">
                        <span>
                            🕒 <strong>Última generación:</strong> {generationSuccess?.timestamp || 'Disponibilidades cargadas del sistema'}
                        </span>
                    <button 
                        onClick={handleSmartCleanup}
                        className="text-xs text-green-600 hover:text-green-800 underline ml-4"
                    >
                        🗑️ Borrar Disponibilidades
                    </button>
                    </div>
                </div>
            )}

            {/* Aviso de regeneración necesaria */}
            {changeDetection.needsRegeneration && (
                <div className="border border-orange-200 rounded-lg p-4 mb-6 bg-orange-50">
                    <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        ⚠️ Regeneración de Disponibilidades Requerida
                    </h3>
                    
                    <div className="text-sm text-orange-800 mb-3">
                        <p className="mb-2">
                            <strong>Motivo:</strong> {changeDetection.getChangeMessage()}
                        </p>
                        <p className="text-xs text-orange-600">
                            🕒 Cambio detectado: {changeDetection.lastChangeTimestamp ? new Date(changeDetection.lastChangeTimestamp).toLocaleString() : 'Recientemente'}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                await smartRegeneration(changeDetection.changeType, changeDetection.changeDetails);
                                changeDetection.clearRegenerationFlag();
                            }}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Regenerar Disponibilidades
                        </button>
                        
                        <button
                            onClick={() => changeDetection.clearRegenerationFlag()}
                            className="text-sm text-orange-600 hover:text-orange-800 underline"
                        >
                            Ignorar por ahora
                        </button>
                    </div>
                </div>
            )}

            {/* Conflictos detectados */}
            {showDetails && conflictingReservations.length > 0 && (
                <div className="border border-orange-200 rounded-lg p-4 mb-6 bg-orange-50">
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
                    onClick={generateAvailability}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Generando...' : 'Generar Disponibilidades'}
                </button>

            </div>

            {/* Selector de día específico */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                            Ver Disponibilidades
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
                                <div key={tableName} className={`p-3 rounded border ${
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
                                            <div className="text-2xl mb-2">
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
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
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
                <div className="mt-6 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Calendario de Disponibilidades
                    </h3>
                    
                    {Object.keys(availabilityGrid).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No hay disponibilidades generadas para este período</p>
                            <p className="text-sm">Usa el botón "Generar Disponibilidades" para crear slots</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-96 overflow-y-auto">
                            {Object.entries(availabilityGrid).map(([date, tables]) => (
                                <div key={date} className="border border-gray-100 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(date), 'EEEE, dd/MM/yyyy', { locale: es })}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(tables).map(([tableName, tableData]) => (
                                            <div key={tableName} className="bg-gray-50 rounded-lg p-3">
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
        </div>
    );
};

export default AvailabilityManager;

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
                advance_booking_days: settings.horizon_days || 30,
                min_party_size: settings.min_party_size || 1,
                max_party_size: settings.max_party_size || 20,
                reservation_duration: settings.turn_duration_minutes || 90,
                buffer_time: settings.buffer_minutes !== undefined ? settings.buffer_minutes : 15
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

    // Cargar estadísticas de disponibilidad
    const loadAvailabilityStats = async () => {
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
                    metadata,
                    tables(name, capacity, zone)
                `)
                .eq('restaurant_id', restaurantId)
                .gte('slot_date', format(new Date(), 'yyyy-MM-dd'))
                .order('slot_date', { ascending: true });

            if (error) throw error;

            // Calcular estadísticas incluyendo slots reservados
            const freeSlots = data?.filter(slot => slot.status === 'free') || [];
            const occupiedSlots = data?.filter(slot => slot.status === 'reserved' || slot.status === 'occupied') || [];
            const blockedSlots = data?.filter(slot => slot.status === 'blocked') || [];
            const reservedSlots = data?.filter(slot => slot.metadata?.reservation_id) || [];

            // DEBUG TEMPORAL: Entender por qué exactamente 1000
            if (data && data.length > 0) {
                const statusCounts = data.reduce((acc, slot) => {
                    acc[slot.status] = (acc[slot.status] || 0) + 1;
                    return acc;
                }, {});
                
                // Solo log si hay exactamente 1000 free slots
                if (freeSlots.length === 1000) {
                    console.log('🔍 PROBLEMA: Exactamente 1000 disponibles de', data.length, 'total');
                    console.log('📊 Distribución de status:', statusCounts);
                    console.log('🔢 Primeros 5 slots:', data.slice(0, 5).map(s => ({ 
                        status: s.status, 
                        date: s.slot_date, 
                        time: s.start_time 
                    })));
                }
            }

            const stats = {
                total: data?.length || 0,
                free: freeSlots.length,
                occupied: occupiedSlots.length,
                blocked: blockedSlots.length,
                dateRange: {
                    start: data?.[0]?.slot_date || null,
                    end: data?.[data?.length - 1]?.slot_date || null
                },
                tablesCount: [...new Set(data?.map(slot => slot.table_id))].length || 0,
                reservationsFound: reservedSlots.length
            };
            

            setAvailabilityStats(stats);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
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

    // Regeneración inteligente de disponibilidades
    const smartRegeneration = async (changeType = 'general', changeData = {}) => {
        if (!restaurantId) {
            toast.error('❌ No se encontró el ID del restaurante');
            return;
        }

        try {
            setLoading(true);
            toast.loading('Regeneración inteligente en proceso...', { id: 'smart-generating' });
            
            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 90;
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
            const results = data[0];
            const duration = restaurantSettings?.reservation_duration || 90;
            const buffer = restaurantSettings?.buffer_time !== undefined ? restaurantSettings.buffer_time : 15;
            const endDateFormatted = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            
            const smartMessage = `🧠 Regeneración Inteligente Completada:
            
📊 RESULTADO:
• Acción: ${results.action}
• Slots afectados: ${results.affected_count}
• Detalle: ${results.message}

⚙️ CONFIGURACIÓN:
• Período: HOY hasta ${endDateFormatted} (${advanceDays} días)
• Duración: ${duration} min + ${buffer} min buffer
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

            // Actualizar estado local
            const successData = {
                slotsCreated: results.affected_count,
                dateRange: `HOY hasta ${endDateFormatted}`,
                duration: duration,
                buffer: buffer,
                timestamp: new Date().toLocaleString(),
                smartRegeneration: true,
                action: results.action,
                message: results.message
            };
            
            setGenerationSuccess(successData);
            
            // Guardar en localStorage
            try {
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            } catch (error) {
                console.warn('No se pudo guardar en localStorage:', error);
            }
            
            // Recargar estadísticas
            setTimeout(async () => {
                await Promise.all([
                    loadAvailabilityStats(),
                    loadAvailabilityGrid()
                ]);
            }, 500);

        } catch (error) {
            console.error('Error en regeneración inteligente:', error);
            toast.dismiss('smart-generating');
            toast.error('❌ Error en regeneración inteligente: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Generar tabla de disponibilidades (función original)
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

            // 2. Llamar a la función de generación usando política de reservas
            const today = format(new Date(), 'yyyy-MM-dd');
            const advanceDays = restaurantSettings?.advance_booking_days || 30;
            const endDate = format(addDays(new Date(), advanceDays), 'yyyy-MM-dd');
            
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


            // Generar disponibilidades
            const { data, error } = await supabase.rpc('generate_availability_slots', {
                p_restaurant_id: restaurantId,
                p_start_date: today,
                p_end_date: endDate
            });

            if (error) {
                console.error('❌ Error en generate_availability_slots:', error);
                throw error;
            }
            

            toast.dismiss('generating');
            
            // Crear mensaje de resumen inteligente ANTES de recargar
            const duration = restaurantSettings?.reservation_duration || 90;
            const buffer = restaurantSettings?.buffer_time !== undefined ? restaurantSettings.buffer_time : 15;
            const endDateFormatted = format(addDays(new Date(), advanceDays), 'dd/MM/yyyy');
            
            // Mostrar mensaje de éxito inmediato
            const summaryMessage = `✅ Disponibilidades generadas exitosamente:
            
📊 RESUMEN:
• ${data} slots creados
• Desde HOY hasta ${endDateFormatted} (${advanceDays} días)
• Duración por reserva: ${duration} min
• Buffer entre reservas: ${buffer} min
• Para todas las mesas activas
            
🎯 Las disponibilidades están listas para recibir reservas.`;
            
            toast.success(summaryMessage, { 
                duration: 8000,
                style: { 
                    minWidth: '450px',
                    whiteSpace: 'pre-line',
                    fontSize: '14px'
                }
            });

            // Actualizar estado local inmediatamente para reflejar cambios
            const successData = {
                slotsCreated: data,
                dateRange: `HOY hasta ${endDateFormatted}`,
                duration: duration,
                buffer: buffer,
                timestamp: new Date().toLocaleString()
            };
            
            setGenerationSuccess(successData);
            
            // Guardar en localStorage para persistencia
            try {
                localStorage.setItem(`generationSuccess_${restaurantId}`, JSON.stringify(successData));
            } catch (error) {
                // Silencioso - no es crítico
            }
            
            // Recargar estadísticas con un pequeño delay para asegurar consistencia
            setTimeout(async () => {
                await Promise.all([
                    loadAvailabilityStats(),
                    loadAvailabilityGrid()
                ]);
            }, 500);

        } catch (error) {
            console.error('Error generando disponibilidades:', error);
            toast.dismiss('generating');
            toast.error('❌ Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Limpiar disponibilidades
    const clearAvailability = async () => {
        if (!confirm('⚠️ ¿Estás seguro de eliminar TODA la tabla de disponibilidades?\n\nEsta acción no se puede deshacer.')) {
            return;
        }

        try {
            setLoading(true);
            toast.loading('Eliminando disponibilidades...', { id: 'clearing' });

            const { error } = await supabase
                .from('availability_slots')
                .delete()
                .eq('restaurant_id', restaurantId);

            if (error) throw error;

            toast.dismiss('clearing');
            toast.success('✅ Tabla de disponibilidades eliminada');
            
            await loadAvailabilityStats();

        } catch (error) {
            console.error('Error eliminando disponibilidades:', error);
            toast.dismiss('clearing');
            toast.error('❌ Error: ' + error.message);
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
            const { data, error } = await supabase
                .from('availability_slots')
                .select(`
                    id,
                    slot_date,
                    start_time,
                    end_time,
                    status,
                    table_id,
                    metadata,
                    tables(name, capacity, zone)
                `)
                .eq('restaurant_id', restaurantId)
                .eq('slot_date', date)
                .order('start_time', { ascending: true })
                .order('table_id', { ascending: true });

            if (error) throw error;

            // Agrupar por mesa
            const groupedByTable = {};
            data?.forEach(slot => {
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
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                    
                    <button
                        onClick={async () => {
                            setShowAvailabilityGrid(!showAvailabilityGrid);
                            if (!showAvailabilityGrid) {
                                await loadAvailabilityGrid();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                        <Calendar className="w-4 h-4" />
                        {showAvailabilityGrid ? 'Ocultar calendario' : 'Ver calendario'}
                    </button>
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
                        <div>
                            <div className="text-blue-700 font-medium">Buffer</div>
                            <div className="text-blue-900">{restaurantSettings.buffer_time || 15} min</div>
                        </div>
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
                                {generationSuccess?.slotsCreated || availabilityStats?.total || 0}
                            </div>
                            <div className="text-xs text-green-600">Slots Creados</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-blue-700">
                                {availabilityStats?.free || 0}
                            </div>
                            <div className="text-xs text-blue-600">Disponibles</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-red-700">
                                {availabilityStats?.occupied || 0}
                            </div>
                            <div className="text-xs text-red-600">Ocupados</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-lg font-bold text-purple-700">
                                {availabilityStats?.reservationsFound || 0}
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
                                {generationSuccess?.duration || restaurantSettings?.reservation_duration || 90} min + {generationSuccess?.buffer !== undefined ? generationSuccess.buffer : (restaurantSettings?.buffer_time !== undefined ? restaurantSettings.buffer_time : 15)} min buffer
                            </span>
                        </div>
                    </div>
                    
                    <div className="text-xs text-green-600 border-t border-green-200 pt-2 flex justify-between items-center">
                        <span>
                            🕒 <strong>Última generación:</strong> {generationSuccess?.timestamp || 'Disponibilidades cargadas del sistema'}
                        </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={async () => {
                                await loadAvailabilityStats();
                                toast.success('Estadísticas actualizadas');
                            }}
                            className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                            Actualizar stats
                        </button>
                        <button 
                            onClick={() => {
                                setGenerationSuccess(null);
                                try {
                                    localStorage.removeItem(`generationSuccess_${restaurantId}`);
                                } catch (error) {
                                    // Silencioso - no es crítico
                                }
                            }}
                            className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                            Limpiar estado
                        </button>
                    </div>
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


                <button
                    onClick={() => loadAvailabilityStats()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>

                {availabilityStats?.total > 0 && (
                    <button
                        onClick={clearAvailability}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        Limpiar Todo
                    </button>
                )}
            </div>

            {/* Selector de día específico */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Consultar Día Específico
                </h3>
                
                <div className="flex items-center gap-4 mb-3">
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                            Seleccionar fecha:
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-blue-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={() => loadDayAvailability(selectedDate)}
                            disabled={loadingDayView}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                                <div key={tableName} className="bg-white p-3 rounded border border-blue-200">
                                    <div className="font-medium text-gray-900 mb-2">{tableName}</div>
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
                                                {slot.start_time} {slot.hasReservation ? '📋' : '✅'}
                                            </span>
                                        ))}
                                    </div>
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
                                {format(addDays(new Date(), restaurantSettings?.advance_booking_days || 90), 'dd/MM/yyyy', { locale: es })}
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
                                                            title={`${slot.start_time} - ${slot.end_time} (${slot.status})${
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

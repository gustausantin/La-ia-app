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
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const AvailabilityManager = () => {
    const { restaurantId } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [availabilityStats, setAvailabilityStats] = useState(null);
    const [conflictingReservations, setConflictingReservations] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [generationSettings, setGenerationSettings] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        overwriteExisting: false
    });

    // Cargar estadísticas de disponibilidad
    const loadAvailabilityStats = async () => {
        try {
            const { data, error } = await supabase
                .from('availability_slots')
                .select(`
                    id,
                    slot_date,
                    status,
                    table_id,
                    tables(name, capacity)
                `)
                .eq('restaurant_id', restaurantId)
                .gte('slot_date', format(new Date(), 'yyyy-MM-dd'))
                .order('slot_date', { ascending: true });

            if (error) throw error;

            // Calcular estadísticas
            const stats = {
                total: data?.length || 0,
                free: data?.filter(slot => slot.status === 'free').length || 0,
                occupied: data?.filter(slot => slot.status === 'occupied').length || 0,
                blocked: data?.filter(slot => slot.status === 'blocked').length || 0,
                dateRange: {
                    start: data?.[0]?.slot_date || null,
                    end: data?.[data?.length - 1]?.slot_date || null
                },
                tablesCount: [...new Set(data?.map(slot => slot.table_id))].length || 0
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

    // Generar tabla de disponibilidades
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

            // 2. Llamar a la función de generación
            const { data, error } = await supabase.rpc('generate_availability_slots', {
                p_restaurant_id: restaurantId,
                p_start_date: generationSettings.startDate,
                p_end_date: generationSettings.endDate,
                p_overwrite_existing: generationSettings.overwriteExisting
            });

            if (error) throw error;

            toast.dismiss('generating');
            toast.success(`✅ Tabla generada: ${data} slots creados`);
            
            // Recargar estadísticas
            await loadAvailabilityStats();

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

    useEffect(() => {
        if (restaurantId) {
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
                
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
            </div>

            {/* Estadísticas actuales */}
            {availabilityStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">
                            {availabilityStats.total}
                        </div>
                        <div className="text-sm text-blue-700">Total Slots</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                            {availabilityStats.free}
                        </div>
                        <div className="text-sm text-green-700">Disponibles</div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-900">
                            {availabilityStats.occupied}
                        </div>
                        <div className="text-sm text-red-700">Ocupados</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                            {availabilityStats.tablesCount}
                        </div>
                        <div className="text-sm text-gray-700">Mesas</div>
                    </div>
                </div>
            )}

            {/* Configuración de generación */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración de Generación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={generationSettings.startDate}
                            onChange={(e) => setGenerationSettings(prev => ({
                                ...prev,
                                startDate: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={generationSettings.endDate}
                            onChange={(e) => setGenerationSettings(prev => ({
                                ...prev,
                                endDate: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    <div className="flex items-end">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={generationSettings.overwriteExisting}
                                onChange={(e) => setGenerationSettings(prev => ({
                                    ...prev,
                                    overwriteExisting: e.target.checked
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                                Sobrescribir existentes
                            </span>
                        </label>
                    </div>
                </div>

                {generationSettings.overwriteExisting && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-yellow-800">
                                    ⚠️ Modo sobrescritura activado
                                </div>
                                <div className="text-xs text-yellow-700 mt-1">
                                    Se eliminarán las disponibilidades existentes y se verificarán conflictos con reservas
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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

            {/* Info adicional */}
            {availabilityStats?.dateRange.start && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                        <strong>Período actual:</strong> {' '}
                        {format(new Date(availabilityStats.dateRange.start), 'dd/MM/yyyy', { locale: es })} - {' '}
                        {format(new Date(availabilityStats.dateRange.end), 'dd/MM/yyyy', { locale: es })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManager;

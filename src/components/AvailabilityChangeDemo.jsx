// Componente de demostración para mostrar el sistema de detección de cambios
import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAvailabilityChangeDetection } from '../hooks/useAvailabilityChangeDetection';
import { 
    AlertCircle, 
    Home, 
    Clock, 
    Settings, 
    Calendar,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const AvailabilityChangeDemo = () => {
    const { restaurantId } = useAuthContext();
    const changeDetection = useAvailabilityChangeDetection(restaurantId);
    const [loading, setLoading] = useState(false);

    const simulateChange = async (type, description) => {
        setLoading(true);
        
        // Simular un delay como si fuera una operación real
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoData = {
            table_change: { id: 'demo-table-1', name: 'Mesa Demo', capacity: 4 },
            schedule_change: { monday: { open: '10:00', close: '23:00' } },
            policy_change: { reservation_duration: 120, buffer_time: 20 },
            special_event_change: { id: 'demo-event-1', name: 'Evento Demo', start_date: '2025-09-20' }
        };

        const actions = {
            table_change: () => changeDetection.onTableChange('added', demoData.table_change),
            schedule_change: () => changeDetection.onScheduleChange(demoData.schedule_change),
            policy_change: () => changeDetection.onPolicyChange(demoData.policy_change),
            special_event_change: () => changeDetection.onSpecialEventChange('added', demoData.special_event_change)
        };

        if (actions[type]) {
            actions[type]();
            toast.success(`✅ ${description} simulado correctamente`);
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                    Demo: Sistema de Detección de Cambios
                </h3>
                <p className="text-gray-600 mt-1">
                    Simula cambios para ver cómo el sistema detecta automáticamente cuando se necesita regenerar disponibilidades
                </p>
            </div>

            {/* Estado actual */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Estado Actual:</h4>
                {changeDetection.needsRegeneration ? (
                    <div className="flex items-start gap-2 text-orange-700">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <p className="font-medium">⚠️ Regeneración Necesaria</p>
                            <p className="text-sm">{changeDetection.getChangeMessage()}</p>
                            <p className="text-xs text-orange-600 mt-1">
                                Detectado: {changeDetection.lastChangeTimestamp ? 
                                    new Date(changeDetection.lastChangeTimestamp).toLocaleString() : 
                                    'Recientemente'
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>✅ No hay cambios pendientes</span>
                    </div>
                )}
            </div>

            {/* Botones de simulación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => simulateChange('table_change', 'Cambio en mesa')}
                    disabled={loading}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                    <Home className="w-6 h-6 text-blue-600" />
                    <div>
                        <div className="font-medium text-gray-900">Simular Cambio en Mesa</div>
                        <div className="text-sm text-gray-600">Añadir, modificar o eliminar mesa</div>
                    </div>
                </button>

                <button
                    onClick={() => simulateChange('schedule_change', 'Cambio en horarios')}
                    disabled={loading}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                    <Clock className="w-6 h-6 text-green-600" />
                    <div>
                        <div className="font-medium text-gray-900">Simular Cambio en Horarios</div>
                        <div className="text-sm text-gray-600">Modificar horarios de apertura</div>
                    </div>
                </button>

                <button
                    onClick={() => simulateChange('policy_change', 'Cambio en política')}
                    disabled={loading}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                    <Settings className="w-6 h-6 text-purple-600" />
                    <div>
                        <div className="font-medium text-gray-900">Simular Cambio en Política</div>
                        <div className="text-sm text-gray-600">Modificar política de reservas</div>
                    </div>
                </button>

                <button
                    onClick={() => simulateChange('special_event_change', 'Evento especial')}
                    disabled={loading}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                    <Calendar className="w-6 h-6 text-orange-600" />
                    <div>
                        <div className="font-medium text-gray-900">Simular Evento Especial</div>
                        <div className="text-sm text-gray-600">Añadir día festivo o cierre</div>
                    </div>
                </button>
            </div>

            {/* Botón para limpiar estado */}
            {changeDetection.needsRegeneration && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <button
                        onClick={() => {
                            changeDetection.clearRegenerationFlag();
                            toast.success('Estado limpiado');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Limpiar Estado
                    </button>
                    
                    <div className="text-sm text-gray-600">
                        💡 Ve a la pestaña "Disponibilidades" para ver el aviso de regeneración
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Simulando cambio...</span>
                </div>
            )}
        </div>
    );
};

export default AvailabilityChangeDemo;

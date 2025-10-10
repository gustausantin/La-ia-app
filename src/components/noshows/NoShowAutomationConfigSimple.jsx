// NoShowAutomationConfigSimple.jsx - Configuración Simple del Sistema No-Shows
import React, { useState, useEffect } from 'react';
import { Shield, Save, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Configuración ultra-simple: Un solo switch ON/OFF
 * El sistema decide automáticamente todo lo demás
 */
export default function NoShowAutomationConfigSimple() {
    const { restaurant } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(true);

    // Cargar estado actual
    useEffect(() => {
        const loadConfig = async () => {
            if (!restaurant?.id) return;

            try {
                setLoading(true);
                
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('settings')
                    .eq('id', restaurant.id)
                    .single();

                if (error) throw error;

                // Leer el estado del sistema
                if (data?.settings?.noshow_automation) {
                    setEnabled(data.settings.noshow_automation.enabled ?? true);
                }

            } catch (error) {
                console.error('Error cargando configuración:', error);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [restaurant?.id]);

    // Guardar configuración
    const handleToggle = async (newState) => {
        if (!restaurant?.id) return;

        try {
            setSaving(true);
            setEnabled(newState);
            toast.loading('Guardando...', { id: 'save-config' });

            // Obtener settings actuales
            const { data: currentData } = await supabase
                .from('restaurants')
                .select('settings')
                .eq('id', restaurant.id)
                .single();

            const currentSettings = currentData?.settings || {};

            // Actualizar solo el estado enabled
            const updatedSettings = {
                ...currentSettings,
                noshow_automation: {
                    ...(currentSettings.noshow_automation || {}),
                    enabled: newState
                }
            };

            // Guardar en Supabase
            const { error } = await supabase
                .from('restaurants')
                .update({ settings: updatedSettings })
                .eq('id', restaurant.id);

            if (error) throw error;

            toast.success(
                newState 
                    ? '✅ Sistema activado correctamente' 
                    : '⏸️ Sistema pausado',
                { id: 'save-config' }
            );

        } catch (error) {
            console.error('Error guardando configuración:', error);
            toast.error('Error al guardar', { id: 'save-config' });
            // Revertir el estado en caso de error
            setEnabled(!newState);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sistema Anti No-Shows</h2>
                    <p className="text-gray-600">Configuración del sistema inteligente</p>
                </div>
            </div>

            {/* Main Switch */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {enabled ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                                <XCircle className="w-6 h-6 text-gray-400" />
                            )}
                            <h3 className="text-xl font-bold text-gray-900">
                                Sistema {enabled ? 'Activo' : 'Pausado'}
                            </h3>
                        </div>
                        <p className="text-gray-600 ml-9">
                            {enabled 
                                ? 'El sistema está funcionando automáticamente'
                                : 'El sistema está pausado temporalmente'
                            }
                        </p>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                        onClick={() => handleToggle(!enabled)}
                        disabled={saving}
                        className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
                            enabled ? 'bg-green-600' : 'bg-gray-300'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span
                            className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${
                                enabled ? 'translate-x-12' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Información del Sistema */}
            <div className="mt-6 bg-blue-50 rounded-lg p-5 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    ¿Qué hace el sistema cuando está activo?
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span><strong>Recordatorio 24h antes:</strong> Envía mensaje automático a todos los clientes</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span><strong>Recordatorio 4h antes:</strong> Segundo mensaje de confirmación</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span><strong>Detección de riesgo:</strong> Calcula automáticamente el riesgo de cada reserva</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span><strong>Alertas inteligentes:</strong> Te avisa solo cuando hay riesgo alto</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span><strong>Auto-liberación:</strong> Libera automáticamente reservas sin confirmar 2h antes</span>
                    </li>
                </ul>
            </div>

            {/* Nota importante */}
            <div className="mt-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-900">
                    <span className="font-bold">💡 Sistema 100% automático:</span> No necesitas configurar nada más. 
                    El algoritmo inteligente decide automáticamente cuándo y cómo contactar a cada cliente según su perfil de riesgo.
                </p>
            </div>

            {/* Estado visual grande */}
            <div className={`mt-6 rounded-xl p-6 text-center ${
                enabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}>
                <p className="text-white text-lg font-bold">
                    {enabled ? '🛡️ Sistema Protegiendo tu Restaurante' : '⏸️ Sistema en Pausa'}
                </p>
                <p className="text-white/90 text-sm mt-1">
                    {enabled 
                        ? 'Todas las reservas están siendo monitoreadas' 
                        : 'Las automatizaciones están desactivadas temporalmente'
                    }
                </p>
            </div>
        </div>
    );
}


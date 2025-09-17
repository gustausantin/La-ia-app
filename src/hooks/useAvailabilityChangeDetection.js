// Hook para detectar cambios que requieren regenerar disponibilidades
import { useState, useEffect, useCallback } from 'react';

export const useAvailabilityChangeDetection = (restaurantId) => {
    const [needsRegeneration, setNeedsRegeneration] = useState(false);
    const [lastChangeTimestamp, setLastChangeTimestamp] = useState(null);
    const [changeType, setChangeType] = useState(null);
    const [changeDetails, setChangeDetails] = useState(null);

    // Función para marcar que se necesita regeneración
    const markNeedsRegeneration = useCallback((type, details = null) => {
        const timestamp = new Date().toISOString();
        
        setNeedsRegeneration(true);
        setLastChangeTimestamp(timestamp);
        setChangeType(type);
        setChangeDetails(details);

        // Guardar en localStorage para persistencia
        try {
            localStorage.setItem(`needsRegeneration_${restaurantId}`, JSON.stringify({
                needsRegeneration: true,
                lastChangeTimestamp: timestamp,
                changeType: type,
                changeDetails: details
            }));
        } catch (error) {
            console.warn('Error guardando estado de regeneración:', error);
        }
    }, [restaurantId]);

    // Función para limpiar el estado de regeneración
    const clearRegenerationFlag = useCallback(() => {
        setNeedsRegeneration(false);
        setLastChangeTimestamp(null);
        setChangeType(null);
        setChangeDetails(null);

        try {
            localStorage.removeItem(`needsRegeneration_${restaurantId}`);
        } catch (error) {
            console.warn('Error limpiando estado de regeneración:', error);
        }
    }, [restaurantId]);

    // Cargar estado persistente al inicializar
    useEffect(() => {
        if (restaurantId) {
            try {
                const saved = localStorage.getItem(`needsRegeneration_${restaurantId}`);
                if (saved) {
                    const data = JSON.parse(saved);
                    setNeedsRegeneration(data.needsRegeneration || false);
                    setLastChangeTimestamp(data.lastChangeTimestamp);
                    setChangeType(data.changeType);
                    setChangeDetails(data.changeDetails);
                }
            } catch (error) {
                console.warn('Error cargando estado de regeneración:', error);
            }
        }
    }, [restaurantId]);

    // Funciones específicas para diferentes tipos de cambios
    const onTableChange = useCallback((action, tableData) => {
        markNeedsRegeneration('table_change', {
            action, // 'added', 'removed', 'modified', 'status_changed'
            table: tableData
        });
    }, [markNeedsRegeneration]);

    const onScheduleChange = useCallback((scheduleData) => {
        markNeedsRegeneration('schedule_change', {
            schedule: scheduleData
        });
    }, [markNeedsRegeneration]);

    const onPolicyChange = useCallback((policyData) => {
        markNeedsRegeneration('policy_change', {
            policy: policyData
        });
    }, [markNeedsRegeneration]);

    const onSpecialEventChange = useCallback((action, eventData) => {
        markNeedsRegeneration('special_event_change', {
            action, // 'added', 'removed', 'modified'
            event: eventData
        });
    }, [markNeedsRegeneration]);

    // Función para obtener mensaje descriptivo del cambio
    const getChangeMessage = useCallback(() => {
        if (!needsRegeneration || !changeType) return null;

        const messages = {
            table_change: {
                added: '🏠 Se añadió una nueva mesa',
                removed: '❌ Se eliminó una mesa',
                modified: '🔧 Se modificó una mesa',
                status_changed: '🔄 Se cambió el estado de una mesa'
            },
            schedule_change: '⏰ Se modificaron los horarios de apertura',
            policy_change: '⚙️ Se cambió la política de reservas',
            special_event_change: {
                added: '🎉 Se añadió un evento especial',
                removed: '🗑️ Se eliminó un evento especial',
                modified: '📝 Se modificó un evento especial'
            }
        };

        const message = messages[changeType];
        if (typeof message === 'string') {
            return message;
        } else if (typeof message === 'object' && changeDetails?.action) {
            return message[changeDetails.action] || 'Se detectó un cambio';
        }

        return 'Se detectó un cambio que requiere regenerar disponibilidades';
    }, [needsRegeneration, changeType, changeDetails]);

    return {
        needsRegeneration,
        lastChangeTimestamp,
        changeType,
        changeDetails,
        markNeedsRegeneration,
        clearRegenerationFlag,
        onTableChange,
        onScheduleChange,
        onPolicyChange,
        onSpecialEventChange,
        getChangeMessage
    };
};

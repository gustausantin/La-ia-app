-- =====================================================
-- DETECTOR DE CONFLICTOS CALENDARIO vs DISPONIBILIDADES
-- Identifica días cerrados que tienen slots activos
-- =====================================================

CREATE OR REPLACE FUNCTION detectar_conflictos_calendario(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_end_date date;
    v_restaurant_settings jsonb;
    v_operating_hours jsonb;
    v_special_events jsonb;
    v_conflicts jsonb := '[]'::jsonb;
    v_conflict_record RECORD;
    v_day_name text;
    v_is_open boolean;
    v_event_info jsonb;
BEGIN
    RAISE NOTICE '🔍 DETECTANDO CONFLICTOS CALENDARIO vs DISPONIBILIDADES';
    
    -- Calcular fecha final
    v_end_date := COALESCE(p_end_date, CURRENT_DATE + INTERVAL '90 days');
    
    -- Obtener configuración del restaurante
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    v_operating_hours := v_restaurant_settings->'operating_hours';
    v_special_events := v_restaurant_settings->'special_events';
    
    RAISE NOTICE '📅 Analizando período: % hasta %', p_start_date, v_end_date;
    
    -- Buscar conflictos día por día
    FOR v_conflict_record IN
        WITH date_series AS (
            SELECT generate_series(p_start_date, v_end_date, '1 day'::interval)::date as check_date
        ),
        daily_analysis AS (
            SELECT 
                ds.check_date,
                LOWER(TO_CHAR(ds.check_date, 'Day')) as day_name,
                -- Contar slots disponibles ese día
                COUNT(av.id) as available_slots,
                -- Contar reservas confirmadas ese día
                COUNT(r.id) as confirmed_reservations
            FROM date_series ds
            LEFT JOIN availability_slots av ON (
                av.restaurant_id = p_restaurant_id 
                AND av.slot_date = ds.check_date
            )
            LEFT JOIN reservations r ON (
                r.restaurant_id = p_restaurant_id 
                AND r.reservation_date = ds.check_date
                AND r.status IN ('confirmed', 'pending')
            )
            GROUP BY ds.check_date
        )
        SELECT * FROM daily_analysis
        WHERE available_slots > 0  -- Solo días con slots activos
        ORDER BY check_date
    LOOP
        v_day_name := TRIM(v_conflict_record.day_name);
        
        -- 1. Verificar si el día está cerrado por horario estándar
        v_is_open := COALESCE((v_operating_hours->v_day_name->>'is_open')::boolean, false);
        
        -- 2. Verificar eventos especiales (cierres puntuales)
        SELECT jsonb_agg(
            jsonb_build_object(
                'event_type', event->>'event_type',
                'description', event->>'description'
            )
        ) INTO v_event_info
        FROM jsonb_array_elements(COALESCE(v_special_events, '[]'::jsonb)) as event
        WHERE (event->>'event_date')::date = v_conflict_record.check_date
        AND event->>'event_type' IN ('closure', 'holiday', 'vacation');
        
        -- 3. Detectar conflictos
        IF NOT v_is_open OR v_event_info IS NOT NULL THEN
            -- Día cerrado pero con slots activos = CONFLICTO
            v_conflicts := v_conflicts || jsonb_build_object(
                'conflict_date', v_conflict_record.check_date,
                'day_name', v_day_name,
                'conflict_type', CASE 
                    WHEN NOT v_is_open THEN 'closed_by_schedule'
                    WHEN v_event_info IS NOT NULL THEN 'closed_by_event'
                    ELSE 'unknown'
                END,
                'available_slots', v_conflict_record.available_slots,
                'confirmed_reservations', v_conflict_record.confirmed_reservations,
                'events', COALESCE(v_event_info, '[]'::jsonb),
                'severity', CASE 
                    WHEN v_conflict_record.confirmed_reservations > 0 THEN 'CRITICAL'
                    WHEN v_conflict_record.available_slots > 0 THEN 'WARNING'
                    ELSE 'INFO'
                END,
                'impact', CASE 
                    WHEN v_conflict_record.confirmed_reservations > 0 THEN 
                        format('RESERVAS AFECTADAS: %s clientes podrían llegar a restaurante cerrado', 
                               v_conflict_record.confirmed_reservations)
                    ELSE 
                        format('DISPONIBILIDADES INCORRECTAS: %s slots activos en día cerrado', 
                               v_conflict_record.available_slots)
                END
            );
            
            RAISE NOTICE '⚠️ CONFLICTO: % (%) - % slots, % reservas', 
                v_conflict_record.check_date, 
                v_day_name,
                v_conflict_record.available_slots,
                v_conflict_record.confirmed_reservations;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎯 ANÁLISIS COMPLETADO: % conflictos detectados', jsonb_array_length(v_conflicts);
    
    RETURN jsonb_build_object(
        'success', true,
        'restaurant_id', p_restaurant_id,
        'analysis_period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', v_end_date
        ),
        'conflicts_found', jsonb_array_length(v_conflicts),
        'conflicts', v_conflicts,
        'summary', CASE 
            WHEN jsonb_array_length(v_conflicts) = 0 THEN 
                'Sin conflictos detectados - Calendario y disponibilidades están sincronizados'
            ELSE 
                format('%s conflictos detectados - Se requiere acción correctiva', 
                       jsonb_array_length(v_conflicts))
        END,
        'next_action', CASE 
            WHEN jsonb_array_length(v_conflicts) > 0 THEN 
                'Ejecutar regeneración inteligente para corregir inconsistencias'
            ELSE 
                'Sistema coherente - No se requiere acción'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR EN DETECCIÓN: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE
        );
END;
$$;

-- =====================================================
-- FUNCIÓN DE VALIDACIÓN ANTES DE CERRAR DÍAS
-- =====================================================

CREATE OR REPLACE FUNCTION validar_cierre_dia(
    p_restaurant_id uuid,
    p_date date,
    p_closure_type text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_slots integer;
    v_existing_reservations integer;
    v_reservation_details jsonb;
BEGIN
    RAISE NOTICE '🔒 VALIDANDO CIERRE DEL DÍA: %', p_date;
    
    -- Contar slots existentes
    SELECT COUNT(*) INTO v_existing_slots
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date = p_date;
    
    -- Contar y obtener detalles de reservas
    SELECT 
        COUNT(*),
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'customer_name', customer_name,
                'reservation_time', reservation_time,
                'party_size', party_size,
                'status', status,
                'phone', customer_phone
            )
        )
    INTO v_existing_reservations, v_reservation_details
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date = p_date
    AND status IN ('confirmed', 'pending');
    
    RAISE NOTICE '📊 Día %: % slots, % reservas', p_date, v_existing_slots, v_existing_reservations;
    
    RETURN jsonb_build_object(
        'success', true,
        'date', p_date,
        'can_close', v_existing_reservations = 0,
        'existing_slots', v_existing_slots,
        'existing_reservations', v_existing_reservations,
        'reservation_details', COALESCE(v_reservation_details, '[]'::jsonb),
        'validation_result', CASE 
            WHEN v_existing_reservations > 0 THEN 'BLOCKED'
            WHEN v_existing_slots > 0 THEN 'WARNING'
            ELSE 'ALLOWED'
        END,
        'message', CASE 
            WHEN v_existing_reservations > 0 THEN 
                format('❌ NO SE PUEDE CERRAR: %s reservas confirmadas requieren atención', 
                       v_existing_reservations)
            WHEN v_existing_slots > 0 THEN 
                format('⚠️ ADVERTENCIA: %s slots activos serán eliminados', 
                       v_existing_slots)
            ELSE 
                '✅ Día puede cerrarse sin conflictos'
        END,
        'required_actions', CASE 
            WHEN v_existing_reservations > 0 THEN 
                jsonb_build_array(
                    'Contactar clientes para reprogramar reservas',
                    'Cancelar reservas manualmente desde panel de Reservas',
                    'Confirmar cierre después de resolver reservas'
                )
            WHEN v_existing_slots > 0 THEN 
                jsonb_build_array(
                    'Los slots disponibles serán eliminados automáticamente',
                    'Regenerar disponibilidades después del cierre'
                )
            ELSE 
                jsonb_build_array('Proceder con el cierre')
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'can_close', false
        );
END;
$$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ FUNCIONES DE DETECCIÓN DE CONFLICTOS CREADAS:';
    RAISE NOTICE '   🔍 detectar_conflictos_calendario() - Analiza inconsistencias';
    RAISE NOTICE '   🔒 validar_cierre_dia() - Valida antes de cerrar días';
    RAISE NOTICE '🛡️ PROTECCIÓN: Previene conflictos calendario vs disponibilidades';
END $$;

-- =====================================================
-- MEJORAS INTELIGENTES PARA DISPONIBILIDADES
-- =====================================================

-- 1. FUNCIÓN PARA DETECTAR SI HAY CAMBIOS PENDIENTES
CREATE OR REPLACE FUNCTION check_availability_changes_needed(
    p_restaurant_id uuid,
    p_start_date date,
    p_end_date date,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_slots integer := 0;
    v_expected_slots integer := 0;
    v_settings_changed boolean := false;
    v_calendar_changed boolean := false;
    v_tables_changed boolean := false;
    v_last_generation timestamp;
    v_changes_detected text[] := ARRAY[]::text[];
BEGIN
    -- Contar slots actuales
    SELECT COUNT(*) INTO v_current_slots
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND p_end_date;
    
    -- Obtener última generación
    SELECT MAX(created_at) INTO v_last_generation
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id;
    
    -- Verificar cambios en configuración desde última generación
    IF EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = p_restaurant_id 
        AND updated_at > COALESCE(v_last_generation, '1970-01-01'::timestamp)
    ) THEN
        v_settings_changed := true;
        v_changes_detected := array_append(v_changes_detected, 'Configuración del restaurante');
    END IF;
    
    -- Verificar cambios en mesas
    IF EXISTS (
        SELECT 1 FROM tables 
        WHERE restaurant_id = p_restaurant_id 
        AND updated_at > COALESCE(v_last_generation, '1970-01-01'::timestamp)
    ) THEN
        v_tables_changed := true;
        v_changes_detected := array_append(v_changes_detected, 'Configuración de mesas');
    END IF;
    
    -- Verificar eventos especiales nuevos
    IF EXISTS (
        SELECT 1 FROM special_events 
        WHERE restaurant_id = p_restaurant_id 
        AND event_date BETWEEN p_start_date AND p_end_date
        AND created_at > COALESCE(v_last_generation, '1970-01-01'::timestamp)
    ) THEN
        v_calendar_changed := true;
        v_changes_detected := array_append(v_changes_detected, 'Eventos especiales en calendario');
    END IF;
    
    -- Verificar si faltan días (automatización diaria)
    DECLARE
        v_max_date_in_slots date;
        v_expected_end_date date;
        v_missing_days integer := 0;
    BEGIN
        -- Obtener configuración de días de antelación
        SELECT CURRENT_DATE + COALESCE(
            (settings->'reservation_policy'->>'advance_booking_days')::integer, 
            30
        ) INTO v_expected_end_date
        FROM restaurants 
        WHERE id = p_restaurant_id;
        
        -- Obtener fecha máxima actual en slots
        SELECT MAX(slot_date) INTO v_max_date_in_slots
        FROM availability_slots
        WHERE restaurant_id = p_restaurant_id;
        
        -- Calcular días faltantes
        IF v_max_date_in_slots IS NULL THEN
            v_missing_days := v_expected_end_date - CURRENT_DATE;
            v_changes_detected := array_append(v_changes_detected, 'No hay disponibilidades creadas');
        ELSIF v_max_date_in_slots < v_expected_end_date THEN
            v_missing_days := v_expected_end_date - v_max_date_in_slots;
            v_changes_detected := array_append(v_changes_detected, format('Faltan %s días de disponibilidad', v_missing_days));
        END IF;
    END;
    
    -- Determinar si se necesita regeneración
    DECLARE
        v_needs_regeneration boolean := false;
        v_reason text := '';
    BEGIN
        IF array_length(v_changes_detected, 1) > 0 THEN
            v_needs_regeneration := true;
            v_reason := array_to_string(v_changes_detected, ', ');
        ELSIF v_current_slots = 0 THEN
            v_needs_regeneration := true;
            v_reason := 'No existen disponibilidades';
        ELSE
            v_reason := 'No hay cambios detectados';
        END IF;
        
        RETURN jsonb_build_object(
            'needs_regeneration', v_needs_regeneration,
            'reason', v_reason,
            'changes_detected', v_changes_detected,
            'current_slots', v_current_slots,
            'last_generation', v_last_generation,
            'settings_changed', v_settings_changed,
            'calendar_changed', v_calendar_changed,
            'tables_changed', v_tables_changed
        );
    END;
END;
$$;

-- 2. FUNCIÓN PARA AUTOMATIZACIÓN DIARIA
CREATE OR REPLACE FUNCTION daily_availability_maintenance(
    p_restaurant_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_record RECORD;
    v_results jsonb := '[]'::jsonb;
    v_restaurant_result jsonb;
    v_advance_days integer;
    v_current_max_date date;
    v_target_end_date date;
    v_missing_days integer;
    v_generation_result jsonb;
BEGIN
    -- Si no se especifica restaurante, procesar todos los activos
    FOR v_restaurant_record IN 
        SELECT id, name 
        FROM restaurants 
        WHERE (p_restaurant_id IS NULL OR id = p_restaurant_id)
        AND active = true
        ORDER BY name
    LOOP
        -- Obtener configuración de días de antelación
        SELECT COALESCE(
            (settings->'reservation_policy'->>'advance_booking_days')::integer, 
            30
        ) INTO v_advance_days
        FROM restaurants 
        WHERE id = v_restaurant_record.id;
        
        -- Calcular fecha objetivo
        v_target_end_date := CURRENT_DATE + v_advance_days;
        
        -- Obtener fecha máxima actual
        SELECT COALESCE(MAX(slot_date), CURRENT_DATE - 1) INTO v_current_max_date
        FROM availability_slots
        WHERE restaurant_id = v_restaurant_record.id;
        
        -- Calcular días faltantes
        v_missing_days := v_target_end_date - v_current_max_date;
        
        IF v_missing_days > 0 THEN
            -- Generar disponibilidades para los días faltantes
            SELECT generate_availability_slots(
                v_restaurant_record.id,
                v_current_max_date + 1,
                v_target_end_date,
                COALESCE(
                    (SELECT (settings->'reservation_policy'->>'reservation_duration')::integer 
                     FROM restaurants WHERE id = v_restaurant_record.id), 
                    90
                )
            ) INTO v_generation_result;
            
            v_restaurant_result := jsonb_build_object(
                'restaurant_id', v_restaurant_record.id,
                'restaurant_name', v_restaurant_record.name,
                'advance_days_config', v_advance_days,
                'missing_days', v_missing_days,
                'date_range', jsonb_build_object(
                    'from', v_current_max_date + 1,
                    'to', v_target_end_date
                ),
                'generation_result', v_generation_result,
                'status', 'completed'
            );
        ELSE
            v_restaurant_result := jsonb_build_object(
                'restaurant_id', v_restaurant_record.id,
                'restaurant_name', v_restaurant_record.name,
                'advance_days_config', v_advance_days,
                'missing_days', 0,
                'status', 'no_action_needed',
                'message', 'Disponibilidades al día'
            );
        END IF;
        
        v_results := v_results || v_restaurant_result;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_at', NOW(),
        'restaurants_processed', jsonb_array_length(v_results),
        'results', v_results
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'processed_at', NOW()
        );
END;
$$;

-- 3. FUNCIÓN INTELIGENTE QUE VERIFICA ANTES DE GENERAR
CREATE OR REPLACE FUNCTION generate_availability_slots_smart_check(
    p_restaurant_id uuid,
    p_start_date date,
    p_end_date date,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check_result jsonb;
    v_needs_regeneration boolean;
    v_generation_result jsonb;
BEGIN
    -- Verificar si se necesita regeneración
    SELECT check_availability_changes_needed(
        p_restaurant_id, 
        p_start_date, 
        p_end_date, 
        p_slot_duration_minutes
    ) INTO v_check_result;
    
    v_needs_regeneration := (v_check_result->>'needs_regeneration')::boolean;
    
    IF NOT v_needs_regeneration THEN
        -- No hay cambios - devolver mensaje informativo
        RETURN jsonb_build_object(
            'success', true,
            'action', 'no_changes_detected',
            'message', 'No hay disponibilidades nuevas que generar',
            'reason', v_check_result->>'reason',
            'current_slots', (v_check_result->>'current_slots')::integer,
            'last_generation', v_check_result->>'last_generation',
            'slots_created', 0,
            'slots_updated', 0,
            'slots_preserved', 0
        );
    ELSE
        -- Hay cambios - proceder con la generación
        SELECT generate_availability_slots(
            p_restaurant_id, 
            p_start_date, 
            p_end_date, 
            p_slot_duration_minutes
        ) INTO v_generation_result;
        
        -- Agregar información del check
        RETURN v_generation_result || jsonb_build_object(
            'action', 'regeneration_completed',
            'changes_detected', v_check_result->'changes_detected',
            'check_reason', v_check_result->>'reason'
        );
    END IF;
END;
$$;

-- PROBAR LAS NUEVAS FUNCIONES
SELECT 'PROBANDO CHECK DE CAMBIOS' as test,
check_availability_changes_needed(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    60
) as resultado;

SELECT 'PROBANDO GENERACIÓN INTELIGENTE' as test,
generate_availability_slots_smart_check(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    60
) as resultado;

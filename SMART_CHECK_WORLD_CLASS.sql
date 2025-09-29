-- =====================================================
-- SMART CHECK WORLD-CLASS PARA LA NUEVA FUNCIÓN
-- =====================================================
-- Actualizar la función smart_check para usar la nueva lógica

CREATE OR REPLACE FUNCTION generate_availability_slots_smart_check(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT (CURRENT_DATE + interval '30 days')::date,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_changes_needed boolean := false;
    v_changes_detected text[] := ARRAY[]::text[];
    v_current_slots integer := 0;
    v_expected_days integer;
    v_max_date_in_slots date;
    v_last_generation timestamp;
    v_generation_result jsonb;
BEGIN
    -- Verificar si hay cambios que requieren regeneración
    
    -- 1. Contar slots actuales
    SELECT COUNT(*) INTO v_current_slots
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND p_end_date;
    
    -- 2. Verificar última generación
    SELECT MAX(created_at) INTO v_last_generation
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id;
    
    -- 3. Verificar cambios en configuración
    IF EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = p_restaurant_id 
        AND updated_at > COALESCE(v_last_generation, '1900-01-01'::timestamp)
    ) THEN
        v_changes_needed := true;
        v_changes_detected := array_append(v_changes_detected, 'Configuración del restaurante');
    END IF;
    
    -- 4. Verificar cambios en mesas
    IF EXISTS (
        SELECT 1 FROM restaurant_tables 
        WHERE restaurant_id = p_restaurant_id 
        AND updated_at > COALESCE(v_last_generation, '1900-01-01'::timestamp)
    ) THEN
        v_changes_needed := true;
        v_changes_detected := array_append(v_changes_detected, 'Configuración de mesas');
    END IF;
    
    -- 5. Verificar eventos especiales
    IF EXISTS (
        SELECT 1 FROM special_events 
        WHERE restaurant_id = p_restaurant_id 
        AND event_date BETWEEN p_start_date AND p_end_date
        AND updated_at > COALESCE(v_last_generation, '1900-01-01'::timestamp)
    ) THEN
        v_changes_needed := true;
        v_changes_detected := array_append(v_changes_detected, 'Eventos especiales en calendario');
    END IF;
    
    -- 6. Verificar cobertura de fechas
    SELECT MAX(slot_date) INTO v_max_date_in_slots
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id;
    
    v_expected_days := p_end_date - CURRENT_DATE;
    
    IF v_max_date_in_slots IS NULL THEN
        v_changes_needed := true;
        v_changes_detected := array_append(v_changes_detected, 'No hay disponibilidades creadas');
    ELSIF v_max_date_in_slots < p_end_date THEN
        v_changes_needed := true;
        v_changes_detected := array_append(v_changes_detected, 
            format('Faltan %s días de disponibilidad', p_end_date - v_max_date_in_slots));
    END IF;
    
    -- 7. Si no hay cambios, retornar sin generar
    IF NOT v_changes_needed THEN
        RETURN jsonb_build_object(
            'success', true,
            'action', 'no_changes_needed',
            'message', 'Las disponibilidades están actualizadas',
            'slots_created', 0,
            'slots_updated', 0,
            'slots_preserved', 0,
            'current_slots', v_current_slots,
            'changes_detected', ARRAY[]::text[]
        );
    END IF;
    
    -- 8. Hay cambios - usar la nueva función world-class
    RAISE NOTICE '🔄 CAMBIOS DETECTADOS: %', array_to_string(v_changes_detected, ', ');
    
    SELECT generate_availability_slots_world_class(
        p_restaurant_id, 
        p_start_date, 
        p_end_date, 
        p_slot_duration_minutes
    ) INTO v_generation_result;
    
    -- 9. Añadir información de cambios al resultado
    v_generation_result := v_generation_result || jsonb_build_object(
        'action', 'regeneration_completed',
        'changes_detected', v_changes_detected,
        'check_reason', array_to_string(v_changes_detected, ', ')
    );
    
    RETURN v_generation_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'action', 'error_during_check'
    );
END;
$$;

-- =====================================================
-- FUNCIÓN DE BORRADO SIMPLE (MANTENER COMPATIBILIDAD)
-- =====================================================

CREATE OR REPLACE FUNCTION borrar_disponibilidades_simple(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT (CURRENT_DATE + interval '30 days')::date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slots_deleted integer := 0;
    v_reservations_preserved integer := 0;
BEGIN
    -- Contar reservas que se van a preservar
    SELECT COUNT(*) INTO v_reservations_preserved
    FROM availability_slots a
    INNER JOIN reservations r ON r.table_id = a.table_id 
        AND r.reservation_date = a.slot_date 
        AND r.reservation_time = a.start_time
    WHERE a.restaurant_id = p_restaurant_id
    AND a.slot_date BETWEEN p_start_date AND p_end_date
    AND r.status IN ('confirmed', 'pending');
    
    -- Eliminar solo slots sin reservas
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND slot_date BETWEEN p_start_date AND p_end_date
    AND id NOT IN (
        SELECT DISTINCT a.id
        FROM availability_slots a
        INNER JOIN reservations r ON r.table_id = a.table_id 
            AND r.reservation_date = a.slot_date 
            AND r.reservation_time = a.start_time
        WHERE a.restaurant_id = p_restaurant_id
        AND r.status IN ('confirmed', 'pending')
    );
    
    GET DIAGNOSTICS v_slots_deleted = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Eliminados %s slots, preservadas %s reservas', 
                         v_slots_deleted, v_reservations_preserved),
        'slots_deleted', v_slots_deleted,
        'reservations_preserved', v_reservations_preserved,
        'period_start', p_start_date,
        'period_end', p_end_date
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'slots_deleted', v_slots_deleted
    );
END;
$$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION generate_availability_slots_smart_check(uuid, date, date, integer) 
IS 'Smart check que usa la nueva función world-class para generar disponibilidades';

COMMENT ON FUNCTION borrar_disponibilidades_simple(uuid, date, date) 
IS 'Función para borrar disponibilidades preservando reservas confirmadas';

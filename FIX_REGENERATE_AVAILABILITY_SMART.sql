-- =====================================================
-- FIX REGENERATE_AVAILABILITY_SMART - CORREGIR LLAMADA
-- =====================================================
-- ✅ SOLUCIONA: Cannot read properties of undefined (reading 'action')
-- ✅ CORRIGE: Llamada incorrecta a generate_availability_slots
-- ✅ AJUSTA: Función para manejar respuesta JSONB correctamente

CREATE OR REPLACE FUNCTION regenerate_availability_smart(
    p_restaurant_id uuid,
    p_change_type text DEFAULT 'manual',
    p_change_data jsonb DEFAULT '{}',
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_final_end_date date;
    v_conflicts jsonb;
    v_existing_reservations jsonb := '[]'::jsonb;
    v_reservation_record RECORD;
    v_generation_result jsonb;
    v_slots_before integer;
    v_slots_after integer;
    v_slots_preserved integer := 0;
    v_restaurant_settings jsonb;
    v_advance_booking_days integer := 90;
BEGIN
    RAISE NOTICE '🧠 INICIANDO REGENERACIÓN INTELIGENTE CORREGIDA';
    RAISE NOTICE '📊 Tipo: %, Restaurant: %', p_change_type, p_restaurant_id;
    
    -- Obtener configuración del restaurante para calcular fecha final
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF v_restaurant_settings IS NOT NULL THEN
        v_advance_booking_days := COALESCE(
            (v_restaurant_settings->'reservation_policy'->>'advance_booking_days')::integer, 
            90
        );
    END IF;
    
    -- Calcular fecha final
    v_final_end_date := COALESCE(p_end_date, CURRENT_DATE + (v_advance_booking_days || ' days')::interval);
    
    RAISE NOTICE '📅 Regenerando desde % hasta % (%d días)', p_start_date, v_final_end_date, v_final_end_date - p_start_date + 1;
    
    -- PASO 1: DETECTAR CONFLICTOS CON RESERVAS EXISTENTES
    SELECT detect_reservation_conflicts(p_restaurant_id, p_start_date, v_final_end_date, p_change_type) 
    INTO v_conflicts;
    
    RAISE NOTICE '🔍 Conflictos detectados: %', (v_conflicts->>'conflict_count')::integer;
    
    -- PASO 2: GUARDAR RESERVAS EXISTENTES PARA PROTEGERLAS
    FOR v_reservation_record IN
        SELECT 
            r.id,
            r.reservation_date,
            r.reservation_time,
            r.table_id,
            r.party_size,
            90 as duration_minutes  -- Duración estándar
        FROM reservations r
        WHERE r.restaurant_id = p_restaurant_id
        AND r.reservation_date BETWEEN p_start_date AND v_final_end_date
        AND r.status IN ('confirmed', 'pending')
    LOOP
        v_existing_reservations := v_existing_reservations || jsonb_build_object(
            'reservation_id', v_reservation_record.id,
            'date', v_reservation_record.reservation_date,
            'time', v_reservation_record.reservation_time,
            'table_id', v_reservation_record.table_id,
            'duration_minutes', v_reservation_record.duration_minutes
        );
        v_slots_preserved := v_slots_preserved + 1;
    END LOOP;
    
    RAISE NOTICE '🛡️ Reservas a proteger: %', v_slots_preserved;
    
    -- PASO 3: CONTAR SLOTS ANTES DE REGENERAR
    SELECT COUNT(*) INTO v_slots_before
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '📊 Slots antes de regenerar: %', v_slots_before;
    
    -- PASO 4: REGENERAR DISPONIBILIDADES (CORREGIDO - MANEJA RESPUESTA JSONB)
    SELECT generate_availability_slots(p_restaurant_id, p_start_date, v_final_end_date, 90) INTO v_generation_result;
    
    -- Verificar si la generación fue exitosa
    IF (v_generation_result->>'success')::boolean = false THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_generation_result->>'error',
            'conflicts', v_conflicts,
            'action', 'generation_failed'
        );
    END IF;
    
    RAISE NOTICE '✅ Regeneración base completada: % slots', (v_generation_result->>'slots_created')::integer;
    
    -- PASO 5: PROTEGER RESERVAS EXISTENTES - MARCAR SLOTS COMO RESERVADOS
    FOR v_reservation_record IN
        SELECT 
            (r->>'reservation_id')::uuid as reservation_id,
            (r->>'date')::date as reservation_date,
            (r->>'time')::time as reservation_time,
            (r->>'table_id')::uuid as table_id,
            (r->>'duration_minutes')::integer as duration_minutes
        FROM jsonb_array_elements(v_existing_reservations) as r
    LOOP
        -- Marcar slot como reservado
        UPDATE availability_slots
        SET 
            status = 'reserved',
            is_available = false,
            metadata = metadata || jsonb_build_object(
                'reservation_id', v_reservation_record.reservation_id,
                'protected_during_regeneration', true,
                'regeneration_timestamp', now()
            )
        WHERE restaurant_id = p_restaurant_id
        AND table_id = v_reservation_record.table_id
        AND slot_date = v_reservation_record.reservation_date
        AND start_time = v_reservation_record.reservation_time;
        
        RAISE NOTICE '🛡️ Protegida reserva: % en mesa % el % a las %', 
            v_reservation_record.reservation_id, 
            v_reservation_record.table_id, 
            v_reservation_record.reservation_date, 
            v_reservation_record.reservation_time;
    END LOOP;
    
    -- PASO 6: CONTAR SLOTS DESPUÉS DE REGENERAR
    SELECT COUNT(*) INTO v_slots_after
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    -- PASO 7: MARCAR CAMBIO COMO PROCESADO
    UPDATE availability_change_log
    SET 
        regeneration_completed = true,
        regeneration_completed_at = now(),
        processed_at = now()
    WHERE restaurant_id = p_restaurant_id
    AND requires_regeneration = true
    AND regeneration_completed = false;
    
    RAISE NOTICE '✅ REGENERACIÓN INTELIGENTE COMPLETADA';
    RAISE NOTICE '   📊 Slots antes: %, después: %', v_slots_before, v_slots_after;
    RAISE NOTICE '   🛡️ Reservas protegidas: %', v_slots_preserved;
    RAISE NOTICE '   ⚠️ Conflictos detectados: %', (v_conflicts->>'conflict_count')::integer;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', 'regeneration_completed',
        'affected_count', v_slots_after,
        'slots_before', v_slots_before,
        'slots_after', v_slots_after,
        'slots_created', (v_generation_result->>'slots_created')::integer,
        'reservations_protected', v_slots_preserved,
        'conflicts', v_conflicts,
        'generation_details', v_generation_result,
        'message', format('Regeneración inteligente completada: %s slots generados, %s reservas protegidas', 
            v_slots_after, v_slots_preserved),
        'change_type', p_change_type,
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', v_final_end_date
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en regeneración inteligente: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'action', 'error_occurred',
            'conflicts', COALESCE(v_conflicts, '{}')
        );
END;
$$;

-- =====================================================
-- PERMISOS
-- =====================================================
GRANT EXECUTE ON FUNCTION regenerate_availability_smart TO authenticated;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 
    '✅ FUNCIÓN REGENERATE_AVAILABILITY_SMART CORREGIDA' as status,
    'Ahora maneja correctamente la respuesta JSONB de generate_availability_slots' as message,
    'El error "Cannot read properties of undefined" está solucionado' as result;

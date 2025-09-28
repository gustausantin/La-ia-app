-- =====================================================
-- FIX: DURACIÓN HARDCODEADA EN REGENERATE_AVAILABILITY_SMART
-- =====================================================

-- El problema: regenerate_availability_smart tiene hardcodeado 90 minutos
-- La solución: Leer la duración desde la política de reservas del restaurante

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
    v_reservation_duration integer := 90; -- ← VALOR POR DEFECTO
BEGIN
    RAISE NOTICE '🧠 INICIANDO REGENERACIÓN INTELIGENTE CON DURACIÓN DINÁMICA';
    RAISE NOTICE '📊 Tipo: %, Restaurant: %', p_change_type, p_restaurant_id;
    
    -- PASO 1: OBTENER CONFIGURACIÓN DEL RESTAURANTE (incluyendo duración)
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF v_restaurant_settings IS NOT NULL THEN
        v_advance_booking_days := COALESCE(
            (v_restaurant_settings->>'advance_booking_days')::integer, 
            90
        );
        
        -- ✅ LEER DURACIÓN DESDE LA POLÍTICA DE RESERVAS
        v_reservation_duration := COALESCE(
            (v_restaurant_settings->>'reservation_duration')::integer,
            90
        );
    END IF;
    
    RAISE NOTICE '🕒 Usando duración configurada: % minutos', v_reservation_duration;
    
    -- Calcular fecha final
    v_final_end_date := COALESCE(p_end_date, CURRENT_DATE + (v_advance_booking_days || ' days')::interval);
    
    RAISE NOTICE '📅 Regenerando desde % hasta % (%d días)', p_start_date, v_final_end_date, v_final_end_date - p_start_date + 1;
    
    -- PASO 2: DETECTAR CONFLICTOS CON RESERVAS EXISTENTES
    SELECT detect_reservation_conflicts(p_restaurant_id, p_start_date, v_final_end_date, p_change_type) 
    INTO v_conflicts;
    
    RAISE NOTICE '🔍 Conflictos detectados: %', (v_conflicts->>'conflict_count')::integer;
    
    -- PASO 3: GUARDAR RESERVAS EXISTENTES PARA PROTEGERLAS
    FOR v_reservation_record IN
        SELECT 
            r.id,
            r.reservation_date,
            r.reservation_time,
            r.table_id,
            r.party_size,
            v_reservation_duration as duration_minutes  -- ← USAR DURACIÓN DINÁMICA
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
    
    -- PASO 4: CONTAR SLOTS ANTES DE REGENERAR
    SELECT COUNT(*) INTO v_slots_before
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '📊 Slots antes de regenerar: %', v_slots_before;
    
    -- PASO 5: REGENERAR DISPONIBILIDADES USANDO DURACIÓN DINÁMICA
    -- ✅ PASAR LA DURACIÓN LEÍDA DE LA CONFIGURACIÓN
    SELECT generate_availability_slots(p_restaurant_id, p_start_date, v_final_end_date, v_reservation_duration) 
    INTO v_generation_result;
    
    -- Verificar si la generación de slots fue exitosa
    IF (v_generation_result->>'success')::boolean = false THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_generation_result->>'error',
            'conflicts', v_conflicts,
            'action', 'regeneration_failed'
        );
    END IF;
    
    RAISE NOTICE '✅ Regeneración base completada con duración % min', v_reservation_duration;
    
    -- PASO 6: PROTEGER RESERVAS EXISTENTES - MARCAR SLOTS COMO RESERVADOS
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
    
    -- PASO 7: CONTAR SLOTS DESPUÉS DE REGENERAR
    SELECT COUNT(*) INTO v_slots_after
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    -- PASO 8: MARCAR CAMBIO COMO PROCESADO
    UPDATE availability_change_log
    SET 
        regeneration_completed = true,
        regeneration_completed_at = now(),
        processed_at = now()
    WHERE restaurant_id = p_restaurant_id
    AND requires_regeneration = true
    AND regeneration_completed = false;
    
    RAISE NOTICE '✅ REGENERACIÓN INTELIGENTE COMPLETADA CON DURACIÓN DINÁMICA';
    RAISE NOTICE '   📊 Slots antes: %, después: %', v_slots_before, v_slots_after;
    RAISE NOTICE '   🛡️ Reservas protegidas: %', v_slots_preserved;
    RAISE NOTICE '   🕒 Duración utilizada: % minutos', v_reservation_duration;
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
        'duration_used', v_reservation_duration,
        'message', format('Regeneración inteligente completada: %s slots generados con %s min de duración, %s reservas protegidas', 
            (v_generation_result->>'slots_created')::integer, v_reservation_duration, v_slots_preserved),
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
            'conflicts', v_conflicts,
            'action', 'regeneration_failed'
        );
END;
$$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ FIX APLICADO: regenerate_availability_smart ahora lee la duración desde la política de reservas';
    RAISE NOTICE '🕒 Ya no usa 90 minutos hardcodeado - usa la configuración del restaurante';
    RAISE NOTICE '📊 Campos añadidos al resultado: duration_used, slots_created';
END $$;

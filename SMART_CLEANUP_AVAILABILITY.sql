-- =====================================================
-- LIMPIEZA INTELIGENTE DE AVAILABILITY_SLOTS
-- Elimina slots sin reservas, preserva slots con reservas
-- =====================================================

CREATE OR REPLACE FUNCTION smart_cleanup_availability(
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
    v_slots_before integer;
    v_slots_deleted integer;
    v_slots_preserved integer;
    v_reservations_protected jsonb := '[]'::jsonb;
    v_reservation_record RECORD;
BEGIN
    RAISE NOTICE '🧹 INICIANDO LIMPIEZA INTELIGENTE';
    RAISE NOTICE '🏪 Restaurante: %', p_restaurant_id;
    
    -- Calcular fecha final si no se proporciona
    v_end_date := COALESCE(p_end_date, CURRENT_DATE + INTERVAL '90 days');
    
    RAISE NOTICE '📅 Período: % hasta %', p_start_date, v_end_date;
    
    -- PASO 1: CONTAR SLOTS ANTES DE LIMPIAR
    SELECT COUNT(*) INTO v_slots_before
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_end_date;
    
    RAISE NOTICE '📊 Slots antes de limpiar: %', v_slots_before;
    
    -- PASO 2: IDENTIFICAR RESERVAS QUE DEBEN PROTEGERSE
    FOR v_reservation_record IN
        SELECT 
            r.id as reservation_id,
            r.reservation_date,
            r.reservation_time,
            r.table_id,
            r.customer_name,
            r.status,
            a.id as slot_id
        FROM reservations r
        LEFT JOIN availability_slots a ON (
            a.restaurant_id = r.restaurant_id
            AND a.table_id = r.table_id
            AND a.slot_date = r.reservation_date
            AND a.start_time = r.reservation_time
        )
        WHERE r.restaurant_id = p_restaurant_id
        AND r.reservation_date BETWEEN p_start_date AND v_end_date
        AND r.status IN ('confirmed', 'pending')
    LOOP
        -- Guardar información de la reserva protegida
        v_reservations_protected := v_reservations_protected || jsonb_build_object(
            'reservation_id', v_reservation_record.reservation_id,
            'date', v_reservation_record.reservation_date,
            'time', v_reservation_record.reservation_time,
            'table_id', v_reservation_record.table_id,
            'customer_name', v_reservation_record.customer_name,
            'status', v_reservation_record.status,
            'slot_id', v_reservation_record.slot_id
        );
        
        RAISE NOTICE '🛡️ Protegiendo reserva: % - % el % a las %', 
            v_reservation_record.customer_name,
            v_reservation_record.status,
            v_reservation_record.reservation_date, 
            v_reservation_record.reservation_time;
    END LOOP;
    
    v_slots_preserved := jsonb_array_length(v_reservations_protected);
    RAISE NOTICE '🛡️ Total reservas a proteger: %', v_slots_preserved;
    
    -- PASO 3: ELIMINAR SLOTS SIN RESERVAS (LIMPIEZA SEGURA)
    WITH slots_to_delete AS (
        SELECT a.id
        FROM availability_slots a
        WHERE a.restaurant_id = p_restaurant_id
        AND a.slot_date BETWEEN p_start_date AND v_end_date
        AND NOT EXISTS (
            SELECT 1 
            FROM reservations r 
            WHERE r.restaurant_id = a.restaurant_id
            AND r.table_id = a.table_id
            AND r.reservation_date = a.slot_date
            AND r.reservation_time = a.start_time
            AND r.status IN ('confirmed', 'pending')
        )
    )
    DELETE FROM availability_slots 
    WHERE id IN (SELECT id FROM slots_to_delete);
    
    GET DIAGNOSTICS v_slots_deleted = ROW_COUNT;
    
    RAISE NOTICE '🗑️ Slots eliminados (sin reservas): %', v_slots_deleted;
    RAISE NOTICE '🛡️ Slots preservados (con reservas): %', v_slots_preserved;
    
    -- PASO 4: VERIFICAR RESULTADO
    DECLARE
        v_slots_after integer;
    BEGIN
        SELECT COUNT(*) INTO v_slots_after
        FROM availability_slots
        WHERE restaurant_id = p_restaurant_id
        AND slot_date BETWEEN p_start_date AND v_end_date;
        
        RAISE NOTICE '📊 Slots después de limpiar: %', v_slots_after;
        
        -- Verificar que los slots preservados siguen ahí
        IF v_slots_after != v_slots_preserved THEN
            RAISE WARNING '⚠️ Inconsistencia: esperábamos % slots preservados, pero hay %', 
                v_slots_preserved, v_slots_after;
        END IF;
    END;
    
    RAISE NOTICE '✅ LIMPIEZA INTELIGENTE COMPLETADA';
    
    RETURN jsonb_build_object(
        'success', true,
        'action', 'smart_cleanup_completed',
        'slots_before', v_slots_before,
        'slots_deleted', v_slots_deleted,
        'slots_preserved', v_slots_preserved,
        'slots_after', v_slots_preserved,
        'protected_reservations', v_reservations_protected,
        'message', format('Limpieza inteligente: %s slots eliminados, %s reservas protegidas', 
            v_slots_deleted, v_slots_preserved),
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', v_end_date
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en limpieza inteligente: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'action', 'smart_cleanup_failed'
        );
END;
$$;

-- =====================================================
-- FUNCIÓN COMBINADA: LIMPIAR + REGENERAR
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_and_regenerate_availability(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cleanup_result jsonb;
    v_generation_result jsonb;
    v_final_result jsonb;
BEGIN
    RAISE NOTICE '🔄 INICIANDO LIMPIEZA + REGENERACIÓN COMBINADA';
    
    -- PASO 1: LIMPIEZA INTELIGENTE
    SELECT smart_cleanup_availability(p_restaurant_id, p_start_date, p_end_date) 
    INTO v_cleanup_result;
    
    IF (v_cleanup_result->>'success')::boolean = false THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Falló la limpieza: ' || (v_cleanup_result->>'error'),
            'action', 'cleanup_failed'
        );
    END IF;
    
    -- PASO 2: REGENERAR DISPONIBILIDADES
    SELECT generate_availability_slots(p_restaurant_id, p_start_date, p_end_date, p_slot_duration_minutes)
    INTO v_generation_result;
    
    IF (v_generation_result->>'success')::boolean = false THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Falló la regeneración: ' || (v_generation_result->>'error'),
            'cleanup_result', v_cleanup_result,
            'action', 'regeneration_failed'
        );
    END IF;
    
    -- PASO 3: COMBINAR RESULTADOS
    v_final_result := jsonb_build_object(
        'success', true,
        'action', 'cleanup_and_regeneration_completed',
        'cleanup', v_cleanup_result,
        'generation', v_generation_result,
        'total_slots_created', (v_generation_result->>'slots_created')::integer,
        'reservations_protected', (v_cleanup_result->>'slots_preserved')::integer,
        'message', format('Limpieza + Regeneración: %s slots creados, %s reservas protegidas',
            (v_generation_result->>'slots_created')::integer,
            (v_cleanup_result->>'slots_preserved')::integer
        )
    );
    
    RAISE NOTICE '✅ LIMPIEZA + REGENERACIÓN COMPLETADA';
    
    RETURN v_final_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en limpieza + regeneración: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'action', 'cleanup_and_regeneration_failed'
        );
END;
$$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ FUNCIONES DE LIMPIEZA INTELIGENTE CREADAS:';
    RAISE NOTICE '   🧹 smart_cleanup_availability() - Solo limpieza';
    RAISE NOTICE '   🔄 cleanup_and_regenerate_availability() - Limpieza + Regeneración';
    RAISE NOTICE '🛡️ PROTECCIÓN GARANTIZADA: Las reservas confirmadas NUNCA se eliminan';
END $$;

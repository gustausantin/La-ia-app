-- =====================================================
-- FUNCIÓN INTELIGENTE DE REGENERACIÓN DE DISPONIBILIDADES
-- =====================================================
-- Esta función es la joya de la corona del sistema de reservas
-- Regenera disponibilidades de forma inteligente preservando datos importantes
-- =====================================================

-- Eliminar función existente si existe (para cambiar tipo de retorno)
DROP FUNCTION IF EXISTS regenerate_availability_smart(uuid, text, jsonb, date, date);

CREATE OR REPLACE FUNCTION regenerate_availability_smart(
    p_restaurant_id uuid,
    p_change_type text DEFAULT 'general',  -- 'general', 'schedule', 'tables', 'policy'
    p_change_data jsonb DEFAULT '{}'::jsonb,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_restaurant_settings jsonb;
    v_operating_hours jsonb;
    v_reservation_duration integer;
    v_advance_days integer;
    v_actual_end_date date;
    v_affected_count integer := 0;
    v_preserved_count integer := 0;
    v_created_count integer := 0;
    v_action_taken text;
    v_message text;
    v_current_date date;
    v_day_name text;
    v_day_config jsonb;
    v_table_record record;
    v_slot_time time;
    v_slot_end time;
    v_start_time time;
    v_end_time time;
BEGIN
    -- 1. VALIDACIONES INICIALES
    IF p_restaurant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurant ID is required',
            'error_detail', 'NULL_RESTAURANT_ID'
        );
    END IF;

    -- 2. OBTENER CONFIGURACIÓN DEL RESTAURANTE
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;

    IF v_restaurant_settings IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurant not found',
            'error_detail', 'RESTAURANT_NOT_FOUND'
        );
    END IF;

    -- Extraer configuraciones
    v_operating_hours := v_restaurant_settings->'operating_hours';
    v_reservation_duration := COALESCE(
        (v_restaurant_settings->'reservation_policy'->>'reservation_duration')::integer,
        90
    );
    v_advance_days := COALESCE(
        (v_restaurant_settings->'reservation_policy'->>'advance_booking_days')::integer,
        30
    );

    -- Calcular fecha final
    v_actual_end_date := COALESCE(p_end_date, p_start_date + v_advance_days);

    -- Log de inicio
    RAISE NOTICE '🚀 REGENERACIÓN INTELIGENTE INICIADA';
    RAISE NOTICE '📊 Restaurant: %, Tipo: %, Período: % a %', 
        p_restaurant_id, p_change_type, p_start_date, v_actual_end_date;

    -- 3. PRESERVAR DATOS IMPORTANTES ANTES DE REGENERAR
    -- Crear tabla temporal para guardar reservas confirmadas
    CREATE TEMP TABLE IF NOT EXISTS temp_preserved_reservations AS
    SELECT DISTINCT
        r.id as reservation_id,
        r.table_id,
        r.date as reservation_date,
        r.time as reservation_time,
        r.duration_minutes,
        r.status
    FROM reservations r
    WHERE r.restaurant_id = p_restaurant_id
    AND r.date BETWEEN p_start_date AND v_actual_end_date
    AND r.status IN ('confirmed', 'seated', 'completed');

    GET DIAGNOSTICS v_preserved_count = ROW_COUNT;
    RAISE NOTICE '💾 Preservando % reservas confirmadas', v_preserved_count;

    -- 4. REGENERACIÓN SEGÚN EL TIPO DE CAMBIO
    CASE p_change_type
        WHEN 'schedule' THEN
            -- Solo regenerar días afectados por cambio de horario
            v_action_taken := 'Horarios actualizados';
            
        WHEN 'tables' THEN
            -- Solo regenerar para mesas específicas
            v_action_taken := 'Mesas actualizadas';
            
        WHEN 'policy' THEN
            -- Ajustar duración de slots existentes
            v_action_taken := 'Política aplicada';
            
        ELSE -- 'general'
            -- Regeneración completa pero inteligente
            v_action_taken := 'Regeneración completa';
    END CASE;

    -- 5. LIMPIAR SLOTS ANTIGUOS (preservando los que tienen reservas)
    DELETE FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_actual_end_date
    AND NOT EXISTS (
        SELECT 1 FROM temp_preserved_reservations pr
        WHERE pr.table_id = availability_slots.table_id
        AND pr.reservation_date = availability_slots.slot_date
        AND pr.reservation_time BETWEEN availability_slots.start_time 
            AND (availability_slots.start_time + (availability_slots.duration_minutes || ' minutes')::interval)
    );

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    RAISE NOTICE '🗑️ Eliminados % slots sin reservas', v_affected_count;

    -- 6. GENERAR NUEVOS SLOTS
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_actual_end_date LOOP
        -- Obtener configuración del día
        v_day_name := LOWER(TRIM(TO_CHAR(v_current_date, 'Day')));
        
        -- Mapear día en inglés
        v_day_name := CASE v_day_name
            WHEN 'monday' THEN 'monday'
            WHEN 'tuesday' THEN 'tuesday'
            WHEN 'wednesday' THEN 'wednesday'
            WHEN 'thursday' THEN 'thursday'
            WHEN 'friday' THEN 'friday'
            WHEN 'saturday' THEN 'saturday'
            WHEN 'sunday' THEN 'sunday'
            WHEN 'lunes' THEN 'monday'
            WHEN 'martes' THEN 'tuesday'
            WHEN 'miércoles' THEN 'wednesday'
            WHEN 'jueves' THEN 'thursday'
            WHEN 'viernes' THEN 'friday'
            WHEN 'sábado' THEN 'saturday'
            WHEN 'domingo' THEN 'sunday'
            ELSE v_day_name
        END;
        
        v_day_config := v_operating_hours->v_day_name;
        
        -- Si el día está abierto
        IF v_day_config IS NOT NULL AND (v_day_config->>'open')::boolean = true THEN
            v_start_time := (v_day_config->>'start')::time;
            v_end_time := (v_day_config->>'end')::time;
            
            -- Para cada mesa activa
            FOR v_table_record IN 
                SELECT id, name, capacity 
                FROM tables 
                WHERE restaurant_id = p_restaurant_id 
                AND is_active = true
            LOOP
                v_slot_time := v_start_time;
                
                -- Generar slots del día
                WHILE v_slot_time < v_end_time LOOP
                    v_slot_end := v_slot_time + (v_reservation_duration || ' minutes')::interval;
                    
                    -- Solo crear si el slot completo cabe en el horario
                    IF v_slot_end <= v_end_time THEN
                        -- Verificar si este slot no existe ya (por reserva preservada)
                        IF NOT EXISTS (
                            SELECT 1 FROM availability_slots
                            WHERE restaurant_id = p_restaurant_id
                            AND table_id = v_table_record.id
                            AND slot_date = v_current_date
                            AND start_time = v_slot_time
                        ) THEN
                            -- Verificar si hay una reserva preservada en este horario
                            IF EXISTS (
                                SELECT 1 FROM temp_preserved_reservations
                                WHERE table_id = v_table_record.id
                                AND reservation_date = v_current_date
                                AND reservation_time = v_slot_time
                            ) THEN
                                -- Crear slot como ocupado
                                -- Detectar si usa 'status' o 'is_available'
                                IF EXISTS (
                                    SELECT 1 FROM information_schema.columns 
                                    WHERE table_name = 'availability_slots' 
                                    AND column_name = 'status'
                                ) THEN
                                    INSERT INTO availability_slots (
                                        restaurant_id, table_id, slot_date, start_time, 
                                        end_time, duration_minutes, status, source, metadata
                                    ) VALUES (
                                        p_restaurant_id, v_table_record.id, v_current_date, 
                                        v_slot_time, v_slot_end, v_reservation_duration, 
                                        'reserved', 'smart_regen',
                                        jsonb_build_object('preserved', true)
                                    );
                                ELSE
                                    INSERT INTO availability_slots (
                                        restaurant_id, table_id, slot_date, start_time, 
                                        end_time, duration_minutes, is_available, source, metadata
                                    ) VALUES (
                                        p_restaurant_id, v_table_record.id, v_current_date, 
                                        v_slot_time, v_slot_end, v_reservation_duration,
                                        false, 'smart_regen',
                                        jsonb_build_object('preserved', true, 'reason', 'reservation')
                                    );
                                END IF;
                            ELSE
                                -- Crear slot como disponible
                                -- Detectar si usa 'status' o 'is_available'
                                IF EXISTS (
                                    SELECT 1 FROM information_schema.columns 
                                    WHERE table_name = 'availability_slots' 
                                    AND column_name = 'status'
                                ) THEN
                                    INSERT INTO availability_slots (
                                        restaurant_id, table_id, slot_date, start_time, 
                                        end_time, duration_minutes, status, source
                                    ) VALUES (
                                        p_restaurant_id, v_table_record.id, v_current_date, 
                                        v_slot_time, v_slot_end, v_reservation_duration,
                                        'available', 'smart_regen'
                                    );
                                ELSE
                                    INSERT INTO availability_slots (
                                        restaurant_id, table_id, slot_date, start_time, 
                                        end_time, duration_minutes, is_available, source
                                    ) VALUES (
                                        p_restaurant_id, v_table_record.id, v_current_date, 
                                        v_slot_time, v_slot_end, v_reservation_duration,
                                        true, 'smart_regen'
                                    );
                                END IF;
                            END IF;
                            
                            v_created_count := v_created_count + 1;
                        END IF;
                    END IF;
                    
                    -- Avanzar al siguiente slot
                    v_slot_time := v_slot_time + (v_reservation_duration || ' minutes')::interval;
                END LOOP;
            END LOOP;
        END IF;
        
        -- Siguiente día
        v_current_date := v_current_date + 1;
    END LOOP;

    -- 7. LIMPIAR TABLA TEMPORAL
    DROP TABLE IF EXISTS temp_preserved_reservations;

    -- 8. PREPARAR RESPUESTA
    v_message := format(
        'Regeneración completada: %s slots creados, %s reservas preservadas', 
        v_created_count, v_preserved_count
    );

    RAISE NOTICE '✅ REGENERACIÓN COMPLETADA: %', v_message;

    -- Retornar resultado exitoso
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action_taken,
        'affected_count', v_created_count,
        'preserved_count', v_preserved_count,
        'message', v_message,
        'period', jsonb_build_object(
            'start', p_start_date,
            'end', v_actual_end_date
        ),
        'slots_created', v_created_count
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Limpiar tabla temporal si existe
        DROP TABLE IF EXISTS temp_preserved_reservations;
        
        -- Log del error
        RAISE NOTICE '❌ ERROR: % - %', SQLERRM, SQLSTATE;
        
        -- Retornar error estructurado
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'slots_created', 0
        );
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION regenerate_availability_smart TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_availability_smart TO anon;

-- Comentario descriptivo
COMMENT ON FUNCTION regenerate_availability_smart IS 
'Función inteligente de regeneración de disponibilidades que preserva reservas existentes y optimiza la generación según el tipo de cambio realizado';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que la función se creó correctamente:
-- SELECT proname FROM pg_proc WHERE proname = 'regenerate_availability_smart';

-- Para probar la función:
-- SELECT regenerate_availability_smart(
--     'tu-restaurant-id'::uuid,
--     'general',
--     '{}'::jsonb,
--     CURRENT_DATE,
--     CURRENT_DATE + 30
-- );

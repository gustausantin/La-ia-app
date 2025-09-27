-- =====================================================
-- VERIFICAR Y ACTUALIZAR FUNCIÓN generate_availability_slots
-- =====================================================
-- Esta función es la base para generar slots de disponibilidad
-- =====================================================

-- Primero, verificar qué versión existe
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'generate_availability_slots';

-- Si necesitas actualizar la función, ejecuta esto:

-- Eliminar versión anterior si existe
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date);
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date, integer, integer);

-- Crear versión actualizada que funciona con tu esquema actual
CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id uuid,
    p_start_date date,
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
    v_current_date date;
    v_day_name text;
    v_day_config jsonb;
    v_table_record record;
    v_slot_time time;
    v_slot_end time;
    v_start_time time;
    v_end_time time;
    v_slots_created integer := 0;
    v_days_processed integer := 0;
    v_has_status boolean;
BEGIN
    -- Validar restaurant
    IF p_restaurant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurant ID is required',
            'slots_created', 0
        );
    END IF;

    -- Obtener configuración del restaurante
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;

    IF v_restaurant_settings IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurant not found',
            'slots_created', 0
        );
    END IF;

    -- Extraer configuraciones
    v_operating_hours := v_restaurant_settings->'operating_hours';
    
    -- Obtener duración de la política de reservas
    v_reservation_duration := COALESCE(
        (v_restaurant_settings->'reservation_policy'->>'reservation_duration')::integer,
        90  -- Por defecto 90 minutos
    );
    
    v_advance_days := COALESCE(
        (v_restaurant_settings->'reservation_policy'->>'advance_booking_days')::integer,
        30  -- Por defecto 30 días
    );

    -- Calcular fecha final si no se proporciona
    v_actual_end_date := COALESCE(p_end_date, p_start_date + v_advance_days);

    -- Verificar si la tabla usa 'status' o 'is_available'
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_slots' 
        AND column_name = 'status'
    ) INTO v_has_status;

    RAISE NOTICE '🚀 Generando slots desde % hasta % con duración de % minutos', 
        p_start_date, v_actual_end_date, v_reservation_duration;

    -- Limpiar slots existentes en el rango
    DELETE FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_actual_end_date;

    -- Generar slots para cada día
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_actual_end_date LOOP
        -- Obtener configuración del día
        v_day_name := LOWER(TRIM(TO_CHAR(v_current_date, 'Day')));
        
        -- Mapear día a inglés si está en español
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
        
        -- Verificar si el día está abierto
        IF v_day_config IS NOT NULL AND (v_day_config->>'open')::boolean = true THEN
            v_start_time := (v_day_config->>'start')::time;
            v_end_time := (v_day_config->>'end')::time;
            
            RAISE NOTICE 'Procesando %: % (%)', v_current_date, v_day_name, 
                format('Abierto de %s a %s', v_start_time, v_end_time);
            
            -- Para cada mesa activa
            FOR v_table_record IN 
                SELECT id, name, capacity 
                FROM tables 
                WHERE restaurant_id = p_restaurant_id 
                AND is_active = true
                ORDER BY id
            LOOP
                v_slot_time := v_start_time;
                
                -- Generar slots del día para esta mesa
                WHILE v_slot_time < v_end_time LOOP
                    v_slot_end := v_slot_time + (v_reservation_duration || ' minutes')::interval;
                    
                    -- Solo crear si el slot completo cabe en el horario
                    IF v_slot_end <= v_end_time THEN
                        IF v_has_status THEN
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, start_time, 
                                end_time, duration_minutes, status, source
                            ) VALUES (
                                p_restaurant_id, v_table_record.id, v_current_date, 
                                v_slot_time, v_slot_end, v_reservation_duration,
                                'available', 'system'
                            );
                        ELSE
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, start_time, 
                                end_time, duration_minutes, is_available, source
                            ) VALUES (
                                p_restaurant_id, v_table_record.id, v_current_date, 
                                v_slot_time, v_slot_end, v_reservation_duration,
                                true, 'system'
                            );
                        END IF;
                        
                        v_slots_created := v_slots_created + 1;
                    END IF;
                    
                    -- Avanzar al siguiente slot
                    v_slot_time := v_slot_time + (v_reservation_duration || ' minutes')::interval;
                END LOOP;
            END LOOP;
        ELSE
            RAISE NOTICE 'Día % cerrado (%)', v_current_date, v_day_name;
        END IF;
        
        v_days_processed := v_days_processed + 1;
        v_current_date := v_current_date + 1;
    END LOOP;

    RAISE NOTICE '✅ Generación completada: % slots creados en % días', 
        v_slots_created, v_days_processed;

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'days_processed', v_days_processed,
        'period', jsonb_build_object(
            'start', p_start_date,
            'end', v_actual_end_date
        ),
        'duration_minutes', v_reservation_duration,
        'message', format('Generados %s slots para %s días', v_slots_created, v_days_processed)
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: % - %', SQLERRM, SQLSTATE;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'slots_created', 0
        );
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION generate_availability_slots TO authenticated;
GRANT EXECUTE ON FUNCTION generate_availability_slots TO anon;

-- Comentario
COMMENT ON FUNCTION generate_availability_slots IS 
'Genera slots de disponibilidad para el período especificado basándose en horarios y política de reservas configurados';

-- =====================================================
-- TEST
-- =====================================================
-- Para probar:
-- SELECT generate_availability_slots(
--     'tu-restaurant-id'::uuid,
--     CURRENT_DATE,
--     CURRENT_DATE + 7
-- );

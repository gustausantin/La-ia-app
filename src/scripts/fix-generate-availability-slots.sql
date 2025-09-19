    -- ====================================
    -- FIX CRÍTICO: generate_availability_slots
    -- Fecha: 19 Septiembre 2025
    -- Objetivo: Recrear función que está causando error 500
    -- ====================================

    -- 1. VERIFICAR SI LA FUNCIÓN EXISTE
    SELECT 
        routine_name,
        routine_type,
        data_type
    FROM information_schema.routines 
    WHERE routine_name = 'generate_availability_slots'
    AND routine_schema = 'public';

    -- 2. ELIMINAR TODAS LAS VERSIONES EXISTENTES
    DROP FUNCTION IF EXISTS generate_availability_slots(uuid) CASCADE;
    DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date) CASCADE;
    DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date) CASCADE;
    DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date, integer) CASCADE;
    DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date, integer, integer) CASCADE;

    -- 3. RECREAR FUNCIÓN ULTRA-ROBUSTA
    CREATE OR REPLACE FUNCTION generate_availability_slots(
        p_restaurant_id uuid,
        p_start_date date DEFAULT CURRENT_DATE,
        p_end_date date DEFAULT NULL
    )
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        loop_date date;
        final_end_date date;
        day_of_week_text text;
        operating_hours jsonb;
        day_schedule jsonb;
        slot_time time;
        end_time time;
        table_record RECORD;
        slots_created integer := 0;
        restaurant_settings jsonb;
        slot_duration_minutes integer := 90;
        horizon_days integer := 30;
    BEGIN
        -- Log inicio
        RAISE NOTICE '🚀 INICIANDO generate_availability_slots para restaurant %', p_restaurant_id;
        
        -- Calcular fecha final
        IF p_end_date IS NULL THEN
            final_end_date := p_start_date + INTERVAL '30 days';
        ELSE
            final_end_date := p_end_date;
        END IF;
        
        RAISE NOTICE '📅 Generando desde % hasta %', p_start_date, final_end_date;
        
        -- Obtener configuración del restaurante
        SELECT settings INTO restaurant_settings
        FROM restaurants 
        WHERE id = p_restaurant_id;
        
        IF restaurant_settings IS NULL THEN
            RAISE NOTICE '⚠️ No se encontró configuración para restaurant %, usando defaults', p_restaurant_id;
            restaurant_settings := '{
                "operating_hours": {
                    "monday": {"open": "12:00", "close": "23:00", "closed": false},
                    "tuesday": {"open": "12:00", "close": "23:00", "closed": false},
                    "wednesday": {"open": "12:00", "close": "23:00", "closed": false},
                    "thursday": {"open": "12:00", "close": "23:00", "closed": false},
                    "friday": {"open": "12:00", "close": "23:00", "closed": false},
                    "saturday": {"open": "12:00", "close": "23:00", "closed": false},
                    "sunday": {"open": "12:00", "close": "23:00", "closed": false}
                },
                "turn_duration_minutes": 90
            }'::jsonb;
        END IF;
        
        -- Extraer duración de turno
        slot_duration_minutes := COALESCE(
            (restaurant_settings->>'turn_duration_minutes')::integer, 
            90
        );
        
        operating_hours := restaurant_settings->'operating_hours';
        
        RAISE NOTICE '⚙️ Duración de turno: % minutos', slot_duration_minutes;
        
        -- Limpiar slots existentes del sistema en el rango
        DELETE FROM availability_slots 
        WHERE restaurant_id = p_restaurant_id 
        AND slot_date >= p_start_date 
        AND slot_date <= final_end_date
        AND source = 'system';
        
        RAISE NOTICE '🧹 Limpiados slots existentes del sistema';
        
        -- Loop por cada día
        loop_date := p_start_date;
        WHILE loop_date <= final_end_date LOOP
            -- Obtener día de la semana
            day_of_week_text := CASE EXTRACT(DOW FROM loop_date)
                WHEN 0 THEN 'sunday'
                WHEN 1 THEN 'monday'
                WHEN 2 THEN 'tuesday'
                WHEN 3 THEN 'wednesday'
                WHEN 4 THEN 'thursday'
                WHEN 5 THEN 'friday'
                WHEN 6 THEN 'saturday'
            END;
            
            -- Obtener horario del día
            day_schedule := operating_hours->day_of_week_text;
            
            -- PARSING ULTRA-ROBUSTO para AMBOS formatos de horarios
            IF day_schedule IS NOT NULL THEN
                BEGIN
                    -- DETECTAR FORMATO DE HORARIOS
                    IF day_schedule ? 'open' AND day_schedule ? 'close' THEN
                        -- FORMATO ANTIGUO: {"open": "09:00", "close": "22:00", "closed": false}
                        IF day_schedule ? 'closed' AND (day_schedule->>'closed')::boolean IS TRUE THEN
                            RAISE NOTICE '🚫 Día % cerrado (formato antiguo), saltando', day_of_week_text;
                            loop_date := loop_date + INTERVAL '1 day';
                            CONTINUE;
                        END IF;
                        
                        -- Validar que open y close sean horas válidas, no booleanos
                        IF day_schedule->>'open' ~ '^[0-9]{2}:[0-9]{2}$' AND day_schedule->>'close' ~ '^[0-9]{2}:[0-9]{2}$' THEN
                            slot_time := (day_schedule->>'open')::time;
                            end_time := (day_schedule->>'close')::time;
                        ELSE
                            RAISE NOTICE '⚠️ Formato de hora inválido en formato antiguo para %: open=%, close=%, saltando día', day_of_week_text, day_schedule->>'open', day_schedule->>'close';
                            loop_date := loop_date + INTERVAL '1 day';
                            CONTINUE;
                        END IF;
                        
                    ELSIF day_schedule ? 'open' AND day_schedule ? 'start' THEN
                        -- FORMATO NUEVO: {"open": true, "start": "09:00", "end": "22:00", "shifts": [...]}
                        
                        -- Verificar si el día está abierto (open debe ser boolean true)
                        IF day_schedule->>'open' != 'true' THEN
                            RAISE NOTICE '🚫 Día % cerrado (formato nuevo: open=%), saltando', day_of_week_text, day_schedule->>'open';
                            loop_date := loop_date + INTERVAL '1 day';
                            CONTINUE;
                        END IF;
                        
                        -- Validar que start y end sean horas válidas, no booleanos
                        IF day_schedule->>'start' ~ '^[0-9]{2}:[0-9]{2}$' AND day_schedule->>'end' ~ '^[0-9]{2}:[0-9]{2}$' THEN
                            slot_time := (day_schedule->>'start')::time;
                            end_time := (day_schedule->>'end')::time;
                        ELSE
                            RAISE NOTICE '⚠️ Formato de hora inválido en formato nuevo para %: start=%, end=%, saltando día', day_of_week_text, day_schedule->>'start', day_schedule->>'end';
                            loop_date := loop_date + INTERVAL '1 day';
                            CONTINUE;
                        END IF;
                        
                        -- TODO: En futuro, procesar también los shifts individuales
                        -- Por ahora usamos solo el horario principal para simplificar
                        
                    ELSE
                        RAISE NOTICE '⚠️ Formato de horario no reconocido para %: %, saltando día', day_of_week_text, day_schedule;
                        loop_date := loop_date + INTERVAL '1 day';
                        CONTINUE;
                    END IF;
                    
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '❌ Error parsing horarios para %: %, saltando día', day_of_week_text, SQLERRM;
                    loop_date := loop_date + INTERVAL '1 day';
                    CONTINUE;
                END;
                
                RAISE NOTICE '📅 Procesando % (%) de % a %', loop_date, day_of_week_text, slot_time, end_time;
                
                -- Para cada mesa activa del restaurante
                FOR table_record IN 
                    SELECT id, table_number, name, capacity 
                    FROM tables 
                    WHERE restaurant_id = p_restaurant_id 
                    AND is_active = true
                LOOP
                    -- Generar slots para esta mesa
                    slot_time := (day_schedule->>'open')::time;
                    
                    WHILE slot_time < end_time LOOP
                        -- Verificar que no haya conflicto con reservas existentes
                        IF NOT EXISTS (
                            SELECT 1 FROM reservations r
                            WHERE r.restaurant_id = p_restaurant_id
                            AND r.table_id = table_record.id
                            AND r.reservation_date = loop_date
                            AND r.reservation_time = slot_time
                            AND r.status IN ('confirmada', 'sentada')
                        ) THEN
                            -- Crear slot si no existe
                            INSERT INTO availability_slots (
                                restaurant_id,
                                table_id,
                                slot_date,
                                start_time,
                                end_time,
                                status,
                                source,
                                metadata
                            ) VALUES (
                                p_restaurant_id,
                                table_record.id,
                                loop_date,
                                slot_time,
                                slot_time + (slot_duration_minutes || ' minutes')::interval,
                                'free',
                                'system',
                                jsonb_build_object(
                                    'table_number', table_record.table_number,
                                    'table_name', table_record.name,
                                    'capacity', table_record.capacity
                                )
                            )
                            ON CONFLICT (restaurant_id, table_id, slot_date, start_time) DO NOTHING;
                            
                            slots_created := slots_created + 1;
                        END IF;
                        
                        -- Avanzar al siguiente slot
                        slot_time := slot_time + (slot_duration_minutes || ' minutes')::interval;
                    END LOOP;
                END LOOP;
            ELSE
                RAISE NOTICE '🚫 Día % cerrado, saltando', loop_date;
            END IF;
            
            -- Avanzar al siguiente día
            loop_date := loop_date + INTERVAL '1 day';
        END LOOP;
        
        RAISE NOTICE '✅ COMPLETADO: % slots creados', slots_created;
        
        RETURN slots_created;
    END;
    $$;

    -- 4. VERIFICAR QUE LA FUNCIÓN SE CREÓ CORRECTAMENTE
    SELECT 
        'FUNCIÓN CREADA EXITOSAMENTE' as status,
        routine_name,
        routine_type
    FROM information_schema.routines 
    WHERE routine_name = 'generate_availability_slots'
    AND routine_schema = 'public';

    -- 5. VERIFICAR CONFIGURACIÓN DE HORARIOS
    -- Mostrar formato actual de horarios
    SELECT 
        id,
        name,
        CASE 
            WHEN settings->'operating_hours'->'monday' ? 'open' AND settings->'operating_hours'->'monday' ? 'closed' THEN 'FORMATO_ANTIGUO'
            WHEN settings->'operating_hours'->'monday' ? 'open' AND settings->'operating_hours'->'monday' ? 'start' THEN 'FORMATO_NUEVO_CON_SHIFTS'
            ELSE 'FORMATO_DESCONOCIDO'
        END as formato_detectado,
        settings->'operating_hours' as horarios_actuales
    FROM restaurants 
    WHERE settings->'operating_hours' IS NOT NULL;

    -- CORREGIR horarios malformados (opcional - ejecutar si hay resultados arriba)
    /*
    UPDATE restaurants 
    SET settings = jsonb_set(
        settings,
        '{operating_hours}',
        '{
            "monday": {"open": "12:00", "close": "23:00", "closed": false},
            "tuesday": {"open": "12:00", "close": "23:00", "closed": false},
            "wednesday": {"open": "12:00", "close": "23:00", "closed": false},
            "thursday": {"open": "12:00", "close": "23:00", "closed": false},
            "friday": {"open": "12:00", "close": "23:00", "closed": false},
            "saturday": {"open": "12:00", "close": "23:00", "closed": false},
            "sunday": {"open": "12:00", "close": "23:00", "closed": false}
        }'::jsonb
    )
    WHERE settings->'operating_hours' IS NOT NULL
    AND (
        settings->'operating_hours'->>'monday' LIKE '%false%' OR
        settings->'operating_hours'->>'tuesday' LIKE '%false%' OR
        settings->'operating_hours'->>'wednesday' LIKE '%false%' OR
        settings->'operating_hours'->>'thursday' LIKE '%false%' OR
        settings->'operating_hours'->>'friday' LIKE '%false%' OR
        settings->'operating_hours'->>'saturday' LIKE '%false%' OR
        settings->'operating_hours'->>'sunday' LIKE '%false%'
    );
    */

    -- 6. DEBUGGING DETALLADO - Verificar cada día individualmente
    WITH restaurant_hours AS (
        SELECT 
            id,
            settings->'operating_hours' as operating_hours
        FROM restaurants 
        WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be'
    ),
    day_breakdown AS (
        SELECT 
            r.id,
            (jsonb_each(r.operating_hours)).key as day_key,
            (jsonb_each(r.operating_hours)).value as day_data
        FROM restaurant_hours r
    )
    SELECT 
        'DEBUGGING HORARIOS' as info,
        day_key,
        day_data,
        day_data->>'open' as open_value,
        day_data->>'start' as start_value,
        day_data->>'end' as end_value,
        CASE 
            WHEN day_data->>'open' = 'true' THEN 'ABIERTO'
            WHEN day_data->>'open' = 'false' THEN 'CERRADO'
            ELSE 'FORMATO_INVALIDO'
        END as status_interpretado,
        CASE 
            WHEN day_data->>'start' ~ '^[0-9]{2}:[0-9]{2}$' THEN 'HORA_VALIDA'
            ELSE 'HORA_INVALIDA'
        END as start_validation,
        CASE 
            WHEN day_data->>'end' ~ '^[0-9]{2}:[0-9]{2}$' THEN 'HORA_VALIDA'
            ELSE 'HORA_INVALIDA'
        END as end_validation
    FROM day_breakdown
    ORDER BY day_key;

    -- 7. HACER PRUEBA RÁPIDA (opcional)
    -- SELECT generate_availability_slots(
    --     '310e1734-381d-4fda-8806-7c338a28c6be'::uuid,
    --     CURRENT_DATE,
    --     CURRENT_DATE + INTERVAL '2 days'
    -- ) as slots_created;

-- MIGRACIÓN: Corregir lógica de slots y mensajes para días cerrados
-- Fecha: 18 Septiembre 2025
-- Objetivo: 1) Permitir último slot después del fin del turno, 2) Mensajes para días cerrados

DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date, integer, integer) CASCADE;

CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id uuid,
    p_start_date date,
    p_end_date date,
    p_slot_duration_minutes integer DEFAULT 90,
    p_buffer_minutes integer DEFAULT 15
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    loop_date date;
    final_end_date date;
    day_of_week_text text;
    operating_hours jsonb;
    day_schedule jsonb;
    day_shifts jsonb;
    shift_record jsonb;
    shift_start_time time;
    shift_end_time time;
    slot_time time;
    end_time time;
    table_record RECORD;
    slots_created integer := 0;
    restaurant_settings jsonb;
    has_is_available boolean;
    has_status boolean;
BEGIN
    -- Verificar qué columnas existen en la tabla
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_slots' AND column_name = 'is_available'
    ) INTO has_is_available;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_slots' AND column_name = 'status'
    ) INTO has_status;
    
    RAISE NOTICE 'Table structure: is_available=%, status=%', has_is_available, has_status;
    
    -- Obtener configuración del restaurante
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurant not found: %', p_restaurant_id;
    END IF;
    
    -- Obtener operating_hours
    operating_hours := restaurant_settings->'operating_hours';
    
    IF operating_hours IS NULL THEN
        RAISE EXCEPTION 'No operating_hours found in restaurant settings';
    END IF;
    
    -- Calcular fecha final
    final_end_date := LEAST(p_end_date, CURRENT_DATE + INTERVAL '120 days');
    
    -- LIMPIEZA: Eliminar slots existentes
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND slot_date BETWEEN p_start_date AND final_end_date;
    
    RAISE NOTICE 'Generating slots from % to %', p_start_date, final_end_date;
    
    -- Iterar por cada día
    loop_date := p_start_date;
    WHILE loop_date <= final_end_date LOOP
        day_of_week_text := LOWER(TO_CHAR(loop_date, 'Day'));
        day_of_week_text := TRIM(day_of_week_text);
        
        -- Obtener configuración del día
        day_schedule := operating_hours->day_of_week_text;
        
        RAISE NOTICE 'Day: % - Schedule: %', day_of_week_text, day_schedule;
        
        -- Verificar si el día está cerrado
        IF day_schedule IS NULL OR (day_schedule->>'open')::boolean = false THEN
            RAISE NOTICE 'Day % is CLOSED, creating closed message', day_of_week_text;
            
            -- Crear un slot especial para indicar que está cerrado
            FOR table_record IN 
                SELECT id, name FROM tables 
                WHERE restaurant_id = p_restaurant_id AND is_active = true
                LIMIT 1  -- Solo uno por día cerrado
            LOOP
                IF has_is_available THEN
                    INSERT INTO availability_slots (
                        restaurant_id, table_id, slot_date, start_time, end_time,
                        is_available, source, created_at, metadata
                    ) VALUES (
                        p_restaurant_id, table_record.id, loop_date, '00:00:00', '00:00:01',
                        false, 'system', NOW(), 
                        jsonb_build_object('type', 'closed_day', 'message', 'Restaurante cerrado este día')
                    );
                ELSIF has_status THEN
                    INSERT INTO availability_slots (
                        restaurant_id, table_id, slot_date, start_time, end_time,
                        status, source, created_at, metadata
                    ) VALUES (
                        p_restaurant_id, table_record.id, loop_date, '00:00:00', '00:00:01',
                        'closed', 'system', NOW(),
                        jsonb_build_object('type', 'closed_day', 'message', 'Restaurante cerrado este día')
                    );
                ELSE
                    INSERT INTO availability_slots (
                        restaurant_id, table_id, slot_date, start_time, end_time,
                        source, created_at, metadata
                    ) VALUES (
                        p_restaurant_id, table_record.id, loop_date, '00:00:00', '00:00:01',
                        'system', NOW(),
                        jsonb_build_object('type', 'closed_day', 'message', 'Restaurante cerrado este día')
                    );
                END IF;
                
                slots_created := slots_created + 1;
            END LOOP;
            
            loop_date := loop_date + 1;
            CONTINUE;
        END IF;
        
        -- Obtener turnos (shifts) del día
        day_shifts := day_schedule->'shifts';
        
        -- Si hay turnos definidos, usar solo los turnos (ignorar "Horario Principal")
        IF day_shifts IS NOT NULL AND jsonb_array_length(day_shifts) > 0 THEN
            RAISE NOTICE 'Found % shifts for %', jsonb_array_length(day_shifts), day_of_week_text;
            
            -- Procesar cada turno
            FOR shift_record IN SELECT * FROM jsonb_array_elements(day_shifts)
            LOOP
                -- Saltar "Horario Principal"
                IF shift_record->>'name' = 'Horario Principal' THEN
                    RAISE NOTICE 'Skipping Horario Principal for %', day_of_week_text;
                    CONTINUE;
                END IF;
                
                -- Obtener horarios del turno
                shift_start_time := (shift_record->>'start_time')::time;
                shift_end_time := (shift_record->>'end_time')::time;
                
                RAISE NOTICE 'Processing shift: % (%-%)', shift_record->>'name', shift_start_time, shift_end_time;
                
                IF shift_start_time IS NULL OR shift_end_time IS NULL THEN
                    RAISE NOTICE 'Invalid shift times, skipping';
                    CONTINUE;
                END IF;
                
                -- Generar slots para este turno
                FOR table_record IN 
                    SELECT id, name FROM tables 
                    WHERE restaurant_id = p_restaurant_id AND is_active = true
                LOOP
                    slot_time := shift_start_time;
                    
                    -- NUEVA LÓGICA: Permitir último slot hasta BUFFER_MINUTES después del fin del turno
                    -- Ejemplo: Turno 12:00-14:00, buffer 15min → último slot puede empezar a las 14:15
                    WHILE slot_time <= shift_end_time + (p_buffer_minutes || ' minutes')::interval LOOP
                        end_time := slot_time + (p_slot_duration_minutes || ' minutes')::interval;
                        
                        RAISE NOTICE 'Creating slot for table % at % (shift: %)', table_record.name, slot_time, shift_record->>'name';
                        
                        -- INSERT adaptado según las columnas disponibles
                        IF has_is_available THEN
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, start_time, end_time,
                                is_available, source, created_at, metadata
                            ) VALUES (
                                p_restaurant_id, table_record.id, loop_date, slot_time, end_time,
                                true, 'system', NOW(),
                                jsonb_build_object('shift_name', shift_record->>'name', 'shift_id', shift_record->>'id')
                            );
                        ELSIF has_status THEN
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, start_time, end_time,
                                status, source, created_at, metadata
                            ) VALUES (
                                p_restaurant_id, table_record.id, loop_date, slot_time, end_time,
                                'available', 'system', NOW(),
                                jsonb_build_object('shift_name', shift_record->>'name', 'shift_id', shift_record->>'id')
                            );
                        ELSE
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, start_time, end_time,
                                source, created_at, metadata
                            ) VALUES (
                                p_restaurant_id, table_record.id, loop_date, slot_time, end_time,
                                'system', NOW(),
                                jsonb_build_object('shift_name', shift_record->>'name', 'shift_id', shift_record->>'id')
                            );
                        END IF;
                        
                        slots_created := slots_created + 1;
                        
                        -- Avanzar al siguiente slot (duración + buffer)
                        slot_time := slot_time + (p_slot_duration_minutes + p_buffer_minutes || ' minutes')::interval;
                    END LOOP;
                END LOOP;
            END LOOP;
            
        ELSE
            -- Si no hay turnos, usar horario general del día
            shift_start_time := (day_schedule->>'start')::time;
            shift_end_time := (day_schedule->>'end')::time;
            
            RAISE NOTICE 'No shifts found, using general hours: %-%', shift_start_time, shift_end_time;
            
            IF shift_start_time IS NULL OR shift_end_time IS NULL THEN
                shift_start_time := '09:00'::time;
                shift_end_time := '22:00'::time;
            END IF;
            
            -- Generar slots para horario general
            FOR table_record IN 
                SELECT id, name FROM tables 
                WHERE restaurant_id = p_restaurant_id AND is_active = true
            LOOP
                slot_time := shift_start_time;
                
                -- NUEVA LÓGICA: Permitir último slot hasta BUFFER_MINUTES después del cierre
                WHILE slot_time <= shift_end_time + (p_buffer_minutes || ' minutes')::interval LOOP
                    end_time := slot_time + (p_slot_duration_minutes || ' minutes')::interval;
                    
                    -- INSERT adaptado según las columnas disponibles
                    IF has_is_available THEN
                        INSERT INTO availability_slots (
                            restaurant_id, table_id, slot_date, start_time, end_time,
                            is_available, source, created_at
                        ) VALUES (
                            p_restaurant_id, table_record.id, loop_date, slot_time, end_time,
                            true, 'system', NOW()
                        );
                    ELSIF has_status THEN
                        INSERT INTO availability_slots (
                            restaurant_id, table_id, slot_date, start_time, end_time,
                            status, source, created_at
                        ) VALUES (
                            p_restaurant_id, table_record.id, loop_date, slot_time, end_time,
                            'available', 'system', NOW()
                        );
                    ELSE
                        INSERT INTO availability_slots (
                            restaurant_id, table_id, slot_date, start_time, end_time,
                            source, created_at
                        ) VALUES (
                            p_restaurant_id, table_record.id, loop_date, slot_time, end_time,
                            'system', NOW()
                        );
                    END IF;
                    
                    slots_created := slots_created + 1;
                    
                    -- Avanzar al siguiente slot (duración + buffer)
                    slot_time := slot_time + (p_slot_duration_minutes + p_buffer_minutes || ' minutes')::interval;
                END LOOP;
            END LOOP;
        END IF;
        
        loop_date := loop_date + 1;
    END LOOP;
    
    RAISE NOTICE 'Successfully created % slots', slots_created;
    RETURN slots_created;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error generating availability slots: %', SQLERRM;
END;
$$;

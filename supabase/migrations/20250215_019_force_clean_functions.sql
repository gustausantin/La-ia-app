-- CORRECCIÓN DEFINITIVA ERROR 409: Forzar limpieza completa
-- Eliminar TODAS las funciones relacionadas sin excepción

-- 1. Eliminar funciones con todos los posibles signatures
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots(uuid) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots_robust(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS diagnostic_availability_data(uuid) CASCADE;
DROP FUNCTION IF EXISTS regenerate_availability_smart(uuid, text, jsonb, date, date) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots_for_table(uuid, uuid, date, date) CASCADE;

-- 2. Verificar que no queden funciones relacionadas
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc 
    WHERE proname LIKE '%availability%';
    
    IF func_count > 0 THEN
        RAISE NOTICE 'Funciones de availability encontradas: %', func_count;
    ELSE
        RAISE NOTICE 'Todas las funciones de availability eliminadas correctamente';
    END IF;
END $$;

-- 3. Recrear función principal COMPLETA con TODOS los factores
CREATE FUNCTION generate_availability_slots(
    p_restaurant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    restaurant_settings JSONB;
    operating_hours JSONB;
    turn_duration INTEGER;
    buffer_minutes INTEGER;
    horizon_days INTEGER;
    current_loop_date DATE;
    final_end_date DATE;
    slot_count INTEGER := 0;
    day_schedule JSONB;
    shift_start TIME;
    shift_end TIME;
    table_record RECORD;
    current_slot_time TIME;
    slot_end_time TIME;
    existing_reservations INTEGER;
    day_name TEXT;
    open_value TEXT;
    close_value TEXT;
    closed_value BOOLEAN;
BEGIN
    -- Obtener configuración del restaurante
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurante no encontrado: %', p_restaurant_id;
    END IF;
    
    -- Extraer parámetros
    operating_hours := COALESCE(restaurant_settings->'operating_hours', '{}'::jsonb);
    turn_duration := COALESCE((restaurant_settings->>'reservation_duration')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_time')::INTEGER, 15);
    horizon_days := COALESCE((restaurant_settings->>'advance_booking_days')::INTEGER, 30);
    
    -- Calcular fecha final
    final_end_date := COALESCE(p_end_date, p_start_date + horizon_days);
    
    -- Limpiar slots existentes
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
      AND slot_date BETWEEN p_start_date AND final_end_date
      AND source = 'system';
    
    -- Generar slots día por día
    current_loop_date := p_start_date;
    
    WHILE current_loop_date <= final_end_date LOOP
        -- Obtener día de la semana
        day_name := CASE EXTRACT(DOW FROM current_loop_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- Obtener horario del día
        day_schedule := operating_hours->day_name;
        
        IF day_schedule IS NOT NULL THEN
            closed_value := COALESCE((day_schedule->>'closed')::BOOLEAN, false);
            
            IF NOT closed_value THEN
                
                -- SISTEMA DE TURNOS: Verificar si hay turnos configurados
                DECLARE
                    day_shifts JSONB := day_schedule->'shifts';
                    shift_data JSONB;
                    start_time_str TEXT;
                    end_time_str TEXT;
                BEGIN
                    -- Si hay turnos configurados, usarlos
                    IF day_shifts IS NOT NULL AND jsonb_array_length(day_shifts) > 0 THEN
                        
                        -- Iterar sobre cada turno configurado
                        FOR i IN 0..jsonb_array_length(day_shifts) - 1 LOOP
                            shift_data := day_shifts->i;
                            start_time_str := shift_data->>'start_time';
                            end_time_str := shift_data->>'end_time';
                            
                            -- Parsing robusto del turno
                            BEGIN
                                IF start_time_str IS NOT NULL AND start_time_str != '' THEN
                                    shift_start := start_time_str::TIME;
                                ELSE
                                    CONTINUE;
                                END IF;
                            EXCEPTION WHEN OTHERS THEN
                                CONTINUE;
                            END;
                            
                            BEGIN
                                IF end_time_str IS NOT NULL AND end_time_str != '' THEN
                                    shift_end := end_time_str::TIME;
                                ELSE
                                    CONTINUE;
                                END IF;
                            EXCEPTION WHEN OTHERS THEN
                                CONTINUE;
                            END;
                            
                            -- Generar slots para este turno específico
                            IF shift_start < shift_end THEN
                                FOR table_record IN 
                                    SELECT id FROM tables 
                                    WHERE restaurant_id = p_restaurant_id AND is_active = true
                                LOOP
                                    current_slot_time := shift_start;
                                    
                                    WHILE current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL <= shift_end LOOP
                                        slot_end_time := current_slot_time + (turn_duration || ' minutes')::INTERVAL;
                                        
                                        -- Verificar conflictos con reservas existentes
                                        SELECT COUNT(*) INTO existing_reservations
                                        FROM reservations r
                                        WHERE r.restaurant_id = p_restaurant_id
                                          AND r.table_id = table_record.id
                                          AND r.reservation_date = current_loop_date
                                          AND r.status IN ('confirmed', 'seated')
                                          AND (
                                              (r.reservation_time >= current_slot_time AND r.reservation_time < slot_end_time)
                                              OR
                                              (r.reservation_time + (turn_duration || ' minutes')::INTERVAL > current_slot_time 
                                               AND r.reservation_time <= current_slot_time)
                                          );
                                        
                                        -- Crear slot si no hay conflictos
                                        IF existing_reservations = 0 THEN
                                            INSERT INTO availability_slots (
                                                restaurant_id,
                                                table_id,
                                                slot_date,
                                                start_time,
                                                end_time,
                                                status,
                                                source,
                                                metadata,
                                                created_at,
                                                updated_at
                                            ) VALUES (
                                                p_restaurant_id,
                                                table_record.id,
                                                current_loop_date,
                                                current_slot_time,
                                                slot_end_time::TIME,
                                                'free',
                                                'system',
                                                jsonb_build_object('shift_name', shift_data->>'name'),
                                                NOW(),
                                                NOW()
                                            );
                                            
                                            slot_count := slot_count + 1;
                                        END IF;
                                        
                                        current_slot_time := current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL;
                                    END LOOP;
                                END LOOP;
                            END IF;
                        END LOOP;
                        
                    ELSE
                        -- FALLBACK: Si no hay turnos, usar horario completo
                        open_value := day_schedule->>'open';
                        close_value := day_schedule->>'close';
                        
                        -- Parsing robusto de horarios completos
                        BEGIN
                            IF open_value IS NOT NULL AND open_value != '' 
                               AND open_value != 'null' AND open_value != 'true' 
                               AND open_value != 'false' THEN
                                shift_start := open_value::TIME;
                            ELSE
                                shift_start := '09:00'::TIME;
                            END IF;
                        EXCEPTION WHEN OTHERS THEN
                            shift_start := '09:00'::TIME;
                        END;
                        
                        BEGIN
                            IF close_value IS NOT NULL AND close_value != '' 
                               AND close_value != 'null' AND close_value != 'true' 
                               AND close_value != 'false' THEN
                                shift_end := close_value::TIME;
                            ELSE
                                shift_end := '22:00'::TIME;
                            END IF;
                        EXCEPTION WHEN OTHERS THEN
                            shift_end := '22:00'::TIME;
                        END;
                
                -- Generar slots
                IF shift_start < shift_end THEN
                    FOR table_record IN 
                        SELECT id FROM tables 
                        WHERE restaurant_id = p_restaurant_id AND is_active = true
                    LOOP
                        current_slot_time := shift_start;
                        
                        WHILE current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL <= shift_end LOOP
                            slot_end_time := current_slot_time + (turn_duration || ' minutes')::INTERVAL;
                            
                            -- Verificar conflictos
                            SELECT COUNT(*) INTO existing_reservations
                            FROM reservations r
                            WHERE r.restaurant_id = p_restaurant_id
                              AND r.table_id = table_record.id
                              AND r.reservation_date = current_loop_date
                              AND r.status IN ('confirmed', 'seated')
                              AND (
                                  (r.reservation_time >= current_slot_time AND r.reservation_time < slot_end_time)
                                  OR
                                  (r.reservation_time + (turn_duration || ' minutes')::INTERVAL > current_slot_time 
                                   AND r.reservation_time <= current_slot_time)
                              );
                            
                            -- Crear slot si no hay conflictos
                            IF existing_reservations = 0 THEN
                                INSERT INTO availability_slots (
                                    restaurant_id,
                                    table_id,
                                    slot_date,
                                    start_time,
                                    end_time,
                                    status,
                                    source,
                                    created_at,
                                    updated_at
                                ) VALUES (
                                    p_restaurant_id,
                                    table_record.id,
                                    current_loop_date,
                                    current_slot_time,
                                    slot_end_time::TIME,
                                    'free',
                                    'system',
                                    NOW(),
                                    NOW()
                                );
                                
                                slot_count := slot_count + 1;
                            END IF;
                            
                            current_slot_time := current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL;
                        END LOOP;
                    END LOOP;
                END IF;
            END IF;
        END IF;
        
        current_loop_date := current_loop_date + 1;
    END LOOP;
    
    RETURN slot_count;
END;
$$;

-- 4. Verificación final
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'generate_availability_slots'
    ) THEN
        RAISE NOTICE 'Función generate_availability_slots creada exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: Función no se creó correctamente';
    END IF;
END $$;

-- Corrección quirúrgica para la función generate_availability_slots
-- Solo arregla el manejo de horarios inválidos sin tocar nada más

CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS INTEGER AS $$
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
    is_day_affected BOOLEAN;
    special_event RECORD;
BEGIN
    -- 1. Obtener configuración del restaurante
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurante no encontrado: %', p_restaurant_id;
    END IF;
    
    -- Extraer parámetros con valores por defecto seguros
    operating_hours := COALESCE(restaurant_settings->'operating_hours', '{}'::jsonb);
    turn_duration := COALESCE((restaurant_settings->>'turn_duration_minutes')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_minutes')::INTEGER, 15);
    horizon_days := COALESCE((restaurant_settings->>'horizon_days')::INTEGER, 30);
    
    -- Calcular fecha final
    final_end_date := COALESCE(p_end_date, p_start_date + horizon_days);
    
    -- 2. Limpiar slots existentes del sistema en el rango
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
      AND slot_date BETWEEN p_start_date AND final_end_date
      AND source = 'system';
    
    -- 3. Generar slots día por día
    current_loop_date := p_start_date;
    
    WHILE current_loop_date <= final_end_date LOOP
        -- Obtener horario del día usando nombres de días
        day_schedule := CASE EXTRACT(DOW FROM current_loop_date)
            WHEN 0 THEN operating_hours->'sunday'    -- Domingo
            WHEN 1 THEN operating_hours->'monday'    -- Lunes
            WHEN 2 THEN operating_hours->'tuesday'   -- Martes
            WHEN 3 THEN operating_hours->'wednesday' -- Miércoles
            WHEN 4 THEN operating_hours->'thursday'  -- Jueves
            WHEN 5 THEN operating_hours->'friday'    -- Viernes
            WHEN 6 THEN operating_hours->'saturday'  -- Sábado
        END;
        
        -- Verificar si el día está abierto y no está marcado como cerrado
        IF day_schedule IS NOT NULL AND COALESCE((day_schedule->>'closed')::BOOLEAN, false) = false THEN
            
            -- Verificar eventos especiales que afecten este día
            is_day_affected := false;
            FOR special_event IN 
                SELECT * FROM special_events 
                WHERE restaurant_id = p_restaurant_id
                  AND is_active = true
                  AND start_date <= current_loop_date 
                  AND end_date >= current_loop_date
                  AND event_type IN ('closure', 'holiday')
            LOOP
                is_day_affected := true;
                EXIT;
            END LOOP;
            
            -- Si el día no está afectado por cierres, generar slots
            IF NOT is_day_affected THEN
                
                -- CORRECCIÓN CRÍTICA: Manejo robusto de horarios
                BEGIN
                    shift_start := (day_schedule->>'open')::TIME;
                    shift_end := (day_schedule->>'close')::TIME;
                EXCEPTION WHEN invalid_text_representation THEN
                    -- Si los datos no son válidos, usar horarios por defecto
                    shift_start := '09:00'::TIME;
                    shift_end := '22:00'::TIME;
                    RAISE NOTICE 'Horarios inválidos para %, usando defaults: % - %', current_loop_date, shift_start, shift_end;
                END;
                
                -- Validar que los horarios sean válidos
                IF shift_start IS NOT NULL AND shift_end IS NOT NULL AND shift_start < shift_end THEN
                    
                    -- Generar slots para cada mesa activa
                    FOR table_record IN 
                        SELECT id, name, capacity, is_active 
                        FROM tables 
                        WHERE restaurant_id = p_restaurant_id 
                          AND is_active = true
                    LOOP
                        
                        -- Generar slots dentro del turno
                        current_slot_time := shift_start;
                        
                        WHILE current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL <= shift_end LOOP
                            slot_end_time := current_slot_time + (turn_duration || ' minutes')::INTERVAL;
                            
                            -- Verificar conflictos con reservas existentes
                            SELECT COUNT(*) INTO existing_reservations
                            FROM reservations r
                            WHERE r.restaurant_id = p_restaurant_id
                              AND r.table_id = table_record.id
                              AND r.reservation_date = current_loop_date
                              AND r.status IN ('confirmada', 'sentada')
                              AND (
                                  (r.reservation_time >= current_slot_time AND r.reservation_time < slot_end_time)
                                  OR
                                  (r.reservation_time + (turn_duration || ' minutes')::INTERVAL > current_slot_time 
                                   AND r.reservation_time <= current_slot_time)
                              );
                            
                            -- Si no hay conflictos, crear slot
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
                            
                            -- Avanzar al siguiente slot
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
$$ LANGUAGE plpgsql;

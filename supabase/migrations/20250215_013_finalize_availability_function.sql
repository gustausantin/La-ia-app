-- FINALIZACIÓN: Hacer la función robusta como la función principal
-- Reemplazar generate_availability_slots con la versión robusta

-- 1. Eliminar función anterior
DROP FUNCTION IF EXISTS generate_availability_slots(uuid,date,date);

-- 2. Crear la función principal con toda la robustez
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
    day_name TEXT;
    open_value TEXT;
    close_value TEXT;
    closed_value BOOLEAN;
    active_tables_count INTEGER;
BEGIN
    -- Verificar que el restaurante existe
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurante no encontrado: %', p_restaurant_id;
    END IF;
    
    -- Verificar que hay mesas activas
    SELECT COUNT(*) INTO active_tables_count
    FROM tables 
    WHERE restaurant_id = p_restaurant_id AND is_active = true;
    
    IF active_tables_count = 0 THEN
        RAISE EXCEPTION 'No hay mesas activas para el restaurante: %', p_restaurant_id;
    END IF;
    
    -- Extraer parámetros con validación robusta
    operating_hours := COALESCE(restaurant_settings->'operating_hours', '{}'::jsonb);
    
    IF operating_hours = '{}'::jsonb THEN
        RAISE EXCEPTION 'No se encontraron horarios de operación para el restaurante: %', p_restaurant_id;
    END IF;
    
    turn_duration := COALESCE((restaurant_settings->>'reservation_duration')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_time')::INTEGER, 15);
    horizon_days := COALESCE((restaurant_settings->>'advance_booking_days')::INTEGER, 30);
    
    -- Calcular fecha final
    final_end_date := COALESCE(p_end_date, p_start_date + horizon_days);
    
    -- Limpiar slots existentes del sistema en el rango
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
      AND slot_date BETWEEN p_start_date AND final_end_date
      AND source = 'system';
    
    -- Generar slots día por día
    current_loop_date := p_start_date;
    
    WHILE current_loop_date <= final_end_date LOOP
        -- Obtener nombre del día
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
        
        -- Verificar si el día está configurado
        IF day_schedule IS NOT NULL THEN
            
            -- Extraer valores con validación extrema
            open_value := day_schedule->>'open';
            close_value := day_schedule->>'close';
            closed_value := COALESCE((day_schedule->>'closed')::BOOLEAN, false);
            
            -- Solo procesar si no está cerrado
            IF NOT closed_value THEN
                
                -- Verificar eventos especiales
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
                
                -- Si no está afectado por eventos, procesar horarios
                IF NOT is_day_affected THEN
                    
                    -- VALIDACIÓN ULTRA ROBUSTA DE HORARIOS
                    shift_start := NULL;
                    shift_end := NULL;
                    
                    -- Intentar parsear open
                    BEGIN
                        IF open_value IS NOT NULL AND open_value != '' AND open_value != 'null' AND open_value != 'true' AND open_value != 'false' THEN
                            shift_start := open_value::TIME;
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        shift_start := '09:00'::TIME;
                    END;
                    
                    -- Intentar parsear close
                    BEGIN
                        IF close_value IS NOT NULL AND close_value != '' AND close_value != 'null' AND close_value != 'true' AND close_value != 'false' THEN
                            shift_end := close_value::TIME;
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        shift_end := '22:00'::TIME;
                    END;
                    
                    -- Aplicar defaults si es necesario
                    IF shift_start IS NULL THEN
                        shift_start := '09:00'::TIME;
                    END IF;
                    
                    IF shift_end IS NULL THEN
                        shift_end := '22:00'::TIME;
                    END IF;
                    
                    -- Validar que los horarios son lógicos
                    IF shift_start < shift_end THEN
                        
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
        END IF;
        
        current_loop_date := current_loop_date + 1;
    END LOOP;
    
    RETURN slot_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Comentario de finalización
COMMENT ON FUNCTION generate_availability_slots(UUID, DATE, DATE) IS 
'Función robusta para generar slots de disponibilidad. Maneja casos edge en operating_hours y valida todos los inputs de forma segura.';

-- REGENERACIÓN INTELIGENTE DE DISPONIBILIDADES
-- Función que respeta reservas existentes y hace regeneración selectiva

-- 1. Función para regeneración inteligente
CREATE OR REPLACE FUNCTION regenerate_availability_smart(
    p_restaurant_id UUID,
    p_change_type TEXT DEFAULT 'general',
    p_change_data JSONB DEFAULT '{}'::jsonb,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS TABLE(
    action TEXT,
    affected_count INTEGER,
    message TEXT
) AS $$
DECLARE
    restaurant_settings JSONB;
    operating_hours JSONB;
    turn_duration INTEGER;
    buffer_minutes INTEGER;
    horizon_days INTEGER;
    final_end_date DATE;
    existing_reservations_count INTEGER;
    new_slots_created INTEGER := 0;
    slots_preserved INTEGER := 0;
    slots_removed INTEGER := 0;
BEGIN
    -- Obtener configuración del restaurante
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurante no encontrado: %', p_restaurant_id;
    END IF;
    
    -- Extraer parámetros
    turn_duration := COALESCE((restaurant_settings->>'reservation_duration')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_time')::INTEGER, 15);
    horizon_days := COALESCE((restaurant_settings->>'advance_booking_days')::INTEGER, 30);
    final_end_date := COALESCE(p_end_date, p_start_date + horizon_days);
    
    -- Contar reservas existentes que podrían verse afectadas
    SELECT COUNT(*) INTO existing_reservations_count
    FROM reservations r
    JOIN availability_slots a ON r.table_id = a.table_id 
        AND r.reservation_date = a.slot_date 
        AND r.reservation_time >= a.start_time 
        AND r.reservation_time < a.end_time
    WHERE r.restaurant_id = p_restaurant_id
      AND r.reservation_date BETWEEN p_start_date AND final_end_date
      AND r.status IN ('confirmada', 'sentada');
    
    -- Estrategia de regeneración basada en el tipo de cambio
    CASE p_change_type
        WHEN 'table_added' THEN
            -- Solo generar slots para la nueva mesa
            DECLARE
                new_table_id UUID := (p_change_data->>'table_id')::UUID;
            BEGIN
                -- Generar slots solo para la nueva mesa
                SELECT generate_availability_slots_for_table(
                    p_restaurant_id, 
                    new_table_id, 
                    p_start_date, 
                    final_end_date
                ) INTO new_slots_created;
                
                RETURN QUERY SELECT 
                    'table_added'::TEXT, 
                    new_slots_created, 
                    format('Se añadieron %s slots para la nueva mesa', new_slots_created);
            END;
            
        WHEN 'table_removed' THEN
            -- Verificar si hay reservas en esa mesa
            DECLARE
                removed_table_id UUID := (p_change_data->>'table_id')::UUID;
                table_reservations INTEGER;
            BEGIN
                SELECT COUNT(*) INTO table_reservations
                FROM reservations
                WHERE restaurant_id = p_restaurant_id
                  AND table_id = removed_table_id
                  AND reservation_date >= p_start_date
                  AND status IN ('confirmada', 'sentada');
                
                IF table_reservations > 0 THEN
                    RETURN QUERY SELECT 
                        'conflict_detected'::TEXT, 
                        table_reservations, 
                        format('No se puede eliminar la mesa: tiene %s reservas futuras', table_reservations);
                ELSE
                    -- Eliminar slots de la mesa removida
                    DELETE FROM availability_slots 
                    WHERE restaurant_id = p_restaurant_id 
                      AND table_id = removed_table_id
                      AND slot_date >= p_start_date;
                    
                    GET DIAGNOSTICS slots_removed = ROW_COUNT;
                    
                    RETURN QUERY SELECT 
                        'table_removed'::TEXT, 
                        slots_removed, 
                        format('Se eliminaron %s slots de la mesa removida', slots_removed);
                END IF;
            END;
            
        WHEN 'schedule_change' THEN
            -- Regeneración completa pero preservando reservas
            -- Marcar slots con reservas como preservados
            UPDATE availability_slots 
            SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"preserved": true}'::jsonb
            WHERE restaurant_id = p_restaurant_id
              AND slot_date BETWEEN p_start_date AND final_end_date
              AND id IN (
                  SELECT a.id 
                  FROM availability_slots a
                  JOIN reservations r ON r.table_id = a.table_id 
                      AND r.reservation_date = a.slot_date 
                      AND r.reservation_time >= a.start_time 
                      AND r.reservation_time < a.end_time
                  WHERE r.status IN ('confirmada', 'sentada')
              );
            
            GET DIAGNOSTICS slots_preserved = ROW_COUNT;
            
            -- Eliminar slots sin reservas
            DELETE FROM availability_slots 
            WHERE restaurant_id = p_restaurant_id 
              AND slot_date BETWEEN p_start_date AND final_end_date
              AND source = 'system'
              AND (metadata->>'preserved')::boolean IS NOT TRUE;
            
            GET DIAGNOSTICS slots_removed = ROW_COUNT;
            
            -- Generar nuevos slots
            SELECT generate_availability_slots(p_restaurant_id, p_start_date, final_end_date) 
            INTO new_slots_created;
            
            -- Limpiar marcadores de preservación
            UPDATE availability_slots 
            SET metadata = metadata - 'preserved'
            WHERE restaurant_id = p_restaurant_id
              AND (metadata->>'preserved')::boolean = true;
            
            RETURN QUERY SELECT 
                'schedule_updated'::TEXT, 
                new_slots_created, 
                format('Horarios actualizados: %s slots preservados, %s eliminados, %s nuevos creados', 
                       slots_preserved, slots_removed, new_slots_created);
                       
        ELSE
            -- Regeneración general inteligente
            -- Preservar slots con reservas existentes
            UPDATE availability_slots 
            SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"preserved": true}'::jsonb
            WHERE restaurant_id = p_restaurant_id
              AND slot_date BETWEEN p_start_date AND final_end_date
              AND id IN (
                  SELECT a.id 
                  FROM availability_slots a
                  JOIN reservations r ON r.table_id = a.table_id 
                      AND r.reservation_date = a.slot_date 
                      AND r.reservation_time >= a.start_time 
                      AND r.reservation_time < a.end_time
                  WHERE r.status IN ('confirmada', 'sentada')
              );
            
            GET DIAGNOSTICS slots_preserved = ROW_COUNT;
            
            -- Eliminar solo slots sin reservas
            DELETE FROM availability_slots 
            WHERE restaurant_id = p_restaurant_id 
              AND slot_date BETWEEN p_start_date AND final_end_date
              AND source = 'system'
              AND (metadata->>'preserved')::boolean IS NOT TRUE;
            
            GET DIAGNOSTICS slots_removed = ROW_COUNT;
            
            -- Generar nuevos slots
            SELECT generate_availability_slots(p_restaurant_id, p_start_date, final_end_date) 
            INTO new_slots_created;
            
            -- Limpiar marcadores de preservación
            UPDATE availability_slots 
            SET metadata = metadata - 'preserved'
            WHERE restaurant_id = p_restaurant_id
              AND (metadata->>'preserved')::boolean = true;
            
            RETURN QUERY SELECT 
                'regenerated'::TEXT, 
                new_slots_created, 
                format('Regeneración inteligente completada: %s reservas preservadas, %s slots eliminados, %s nuevos creados', 
                       slots_preserved, slots_removed, new_slots_created);
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 2. Función auxiliar para generar slots de una mesa específica
CREATE OR REPLACE FUNCTION generate_availability_slots_for_table(
    p_restaurant_id UUID,
    p_table_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS INTEGER AS $$
DECLARE
    restaurant_settings JSONB;
    operating_hours JSONB;
    turn_duration INTEGER;
    buffer_minutes INTEGER;
    current_loop_date DATE;
    slot_count INTEGER := 0;
    day_schedule JSONB;
    shift_start TIME;
    shift_end TIME;
    current_slot_time TIME;
    slot_end_time TIME;
    existing_reservations INTEGER;
    day_name TEXT;
    open_value TEXT;
    close_value TEXT;
    closed_value BOOLEAN;
BEGIN
    -- Obtener configuración
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    operating_hours := COALESCE(restaurant_settings->'operating_hours', '{}'::jsonb);
    turn_duration := COALESCE((restaurant_settings->>'reservation_duration')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_time')::INTEGER, 15);
    
    -- Generar slots día por día para la mesa específica
    current_loop_date := p_start_date;
    
    WHILE current_loop_date <= p_end_date LOOP
        -- Obtener horario del día
        day_name := CASE EXTRACT(DOW FROM current_loop_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        day_schedule := operating_hours->day_name;
        
        IF day_schedule IS NOT NULL THEN
            open_value := day_schedule->>'open';
            close_value := day_schedule->>'close';
            closed_value := COALESCE((day_schedule->>'closed')::BOOLEAN, false);
            
            IF NOT closed_value THEN
                -- Parsing robusto de horarios
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
                
                IF shift_start < shift_end THEN
                    -- Generar slots para esta mesa
                    current_slot_time := shift_start;
                    
                    WHILE current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL <= shift_end LOOP
                        slot_end_time := current_slot_time + (turn_duration || ' minutes')::INTERVAL;
                        
                        -- Verificar conflictos con reservas existentes
                        SELECT COUNT(*) INTO existing_reservations
                        FROM reservations r
                        WHERE r.restaurant_id = p_restaurant_id
                          AND r.table_id = p_table_id
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
                                p_table_id,
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
                END IF;
            END IF;
        END IF;
        
        current_loop_date := current_loop_date + 1;
    END LOOP;
    
    RETURN slot_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Comentarios
COMMENT ON FUNCTION regenerate_availability_smart(UUID, TEXT, JSONB, DATE, DATE) IS 
'Función de regeneración inteligente que respeta reservas existentes y aplica estrategias específicas según el tipo de cambio';

COMMENT ON FUNCTION generate_availability_slots_for_table(UUID, UUID, DATE, DATE) IS 
'Genera slots de disponibilidad para una mesa específica, útil cuando se añaden nuevas mesas';

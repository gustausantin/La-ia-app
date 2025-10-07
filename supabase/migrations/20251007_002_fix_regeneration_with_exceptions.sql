-- ========================================
-- FUNCIÓN CORREGIDA: REGENERACIÓN CON EXCEPCIONES
-- Versión que funciona con el esquema real de availability_slots
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_and_regenerate_availability(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings JSONB;
    v_operating_hours JSONB;
    v_slot_interval INTEGER;
    v_reservation_duration INTEGER;
    v_current_date DATE;
    v_day_of_week INTEGER;
    v_day_config JSONB;
    v_is_open BOOLEAN;
    v_open_time TIME;
    v_close_time TIME;
    v_current_time TIME;
    v_end_time TIME;
    v_slots_created INTEGER := 0;
    v_slots_deleted INTEGER := 0;
    v_table RECORD;
    v_has_exception BOOLEAN;
    v_exception_is_open BOOLEAN;
    v_exception_open_time TIME;
    v_exception_close_time TIME;
BEGIN
    -- 1. Obtener configuración del restaurante
    SELECT settings INTO v_settings
    FROM restaurants
    WHERE id = p_restaurant_id;
    
    IF v_settings IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurante no encontrado o sin configuración'
        );
    END IF;
    
    -- Extraer configuraciones
    v_operating_hours := v_settings->'operating_hours';
    v_slot_interval := COALESCE((v_settings->>'slot_interval')::INTEGER, 30);
    v_reservation_duration := COALESCE((v_settings->>'reservation_duration')::INTEGER, 90);
    
    IF v_operating_hours IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay horarios de operación configurados'
        );
    END IF;
    
    -- 2. LIMPIAR slots existentes en el rango (sin tocar reservas)
    DELETE FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
      AND slot_date >= p_start_date
      AND slot_date <= p_end_date
      AND status = 'free'; -- Solo eliminar slots libres
    
    GET DIAGNOSTICS v_slots_deleted = ROW_COUNT;
    
    RAISE NOTICE '🧹 Slots eliminados: %', v_slots_deleted;
    
    -- 3. GENERAR nuevos slots respetando excepciones
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        -- Obtener día de la semana como nombre en inglés (monday, tuesday, etc.)
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        
        -- Mapear número a nombre de día
        CASE v_day_of_week
            WHEN 0 THEN v_day_config := v_operating_hours->'sunday';
            WHEN 1 THEN v_day_config := v_operating_hours->'monday';
            WHEN 2 THEN v_day_config := v_operating_hours->'tuesday';
            WHEN 3 THEN v_day_config := v_operating_hours->'wednesday';
            WHEN 4 THEN v_day_config := v_operating_hours->'thursday';
            WHEN 5 THEN v_day_config := v_operating_hours->'friday';
            WHEN 6 THEN v_day_config := v_operating_hours->'saturday';
        END CASE;
        
        -- 🔍 VERIFICAR SI HAY EXCEPCIÓN PARA ESTA FECHA
        v_has_exception := FALSE;
        v_exception_is_open := FALSE;
        v_exception_open_time := NULL;
        v_exception_close_time := NULL;
        
        SELECT 
            ce.is_open,
            ce.open_time,
            ce.close_time
        INTO 
            v_exception_is_open,
            v_exception_open_time,
            v_exception_close_time
        FROM calendar_exceptions ce
        WHERE ce.restaurant_id = p_restaurant_id
          AND ce.exception_date = v_current_date
        LIMIT 1;
        
        -- Si encontramos una excepción, marcar el flag
        IF FOUND THEN
            v_has_exception := TRUE;
            RAISE NOTICE '🔔 Excepción detectada para %: is_open=%, horario=%-%', 
                v_current_date, v_exception_is_open, v_exception_open_time, v_exception_close_time;
        END IF;
        
        -- 🛡️ LÓGICA DE EXCEPCIONES:
        -- Si hay excepción, la excepción GANA sobre el horario semanal
        IF v_has_exception THEN
            v_is_open := v_exception_is_open;
            -- 🔑 USAR HORARIOS DE LA EXCEPCIÓN si están definidos, sino usar horarios semanales
            v_open_time := COALESCE(v_exception_open_time, (v_day_config->>'open')::TIME);
            v_close_time := COALESCE(v_exception_close_time, (v_day_config->>'close')::TIME);
        ELSE
            -- No hay excepción: usar horario semanal normal
            v_is_open := COALESCE((v_day_config->>'closed')::BOOLEAN, true) = false;
            v_open_time := (v_day_config->>'open')::TIME;
            v_close_time := (v_day_config->>'close')::TIME;
        END IF;
        
        -- Solo generar slots si el día está abierto (ya sea por horario o excepción)
        IF v_is_open THEN
            
            -- Validar que tenemos horarios válidos
            IF v_open_time IS NOT NULL AND v_close_time IS NOT NULL THEN
                
                -- 🔄 LOOP POR CADA MESA ACTIVA
                FOR v_table IN 
                    SELECT id, name, capacity
                    FROM tables
                    WHERE restaurant_id = p_restaurant_id
                      AND is_active = true
                LOOP
                    v_current_time := v_open_time;
                    
                    -- Generar slots para esta mesa en este día
                    WHILE v_current_time < v_close_time LOOP
                        -- Calcular end_time
                        v_end_time := v_current_time + (v_reservation_duration || ' minutes')::INTERVAL;
                        
                        -- Insertar slot
                        INSERT INTO availability_slots (
                            restaurant_id,
                            slot_date,
                            start_time,
                            end_time,
                            table_id,
                            status,
                            is_available,
                            duration_minutes,
                            source,
                            created_at,
                            updated_at
                        ) VALUES (
                            p_restaurant_id,
                            v_current_date,
                            v_current_time,
                            v_end_time,
                            v_table.id,
                            'free',
                            true,
                            v_reservation_duration,
                            'system',
                            NOW(),
                            NOW()
                        )
                        ON CONFLICT (restaurant_id, slot_date, start_time, table_id) 
                        DO NOTHING; -- Si ya existe, no hacer nada
                        
                        v_slots_created := v_slots_created + 1;
                        
                        -- Avanzar al siguiente slot
                        v_current_time := v_current_time + (v_slot_interval || ' minutes')::INTERVAL;
                    END LOOP;
                END LOOP;
                
            END IF;
        ELSE
            RAISE NOTICE '🚫 Día cerrado (o excepción cerrada): %', v_current_date;
        END IF;
        
        -- Avanzar al siguiente día
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE '✅ Regeneración completada: % slots creados, % slots eliminados', v_slots_created, v_slots_deleted;
    
    -- 4. Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Disponibilidades regeneradas respetando excepciones',
        'slots_created', v_slots_created,
        'slots_deleted', v_slots_deleted,
        'date_range', jsonb_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'exceptions_respected', true
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION cleanup_and_regenerate_availability IS 'Regenera availability_slots respetando calendar_exceptions. Las excepciones tienen prioridad sobre el horario semanal. Versión corregida que funciona con el esquema real.';

-- ========================================
-- MIGRACIÓN COMPLETADA ✅
-- Función corregida para respetar excepciones
-- ========================================

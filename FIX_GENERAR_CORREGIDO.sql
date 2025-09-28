-- =====================================================
-- FUNCIÓN REGENERACIÓN INTELIGENTE - CORREGIDA
-- =====================================================

CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id uuid,
    p_start_date date,
    p_end_date date,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_record RECORD;
    v_settings jsonb;
    v_operating_hours jsonb;
    v_calendar_schedule jsonb;
    v_reservation_policy jsonb;
    v_min_party_size integer := 1;
    v_max_party_size integer := 20;
    v_standard_duration integer;
    v_total_tables integer := 0;
    v_table_record RECORD;
    v_current_date date;
    v_final_end_date date;
    v_day_name text;
    v_day_config jsonb;
    v_is_open boolean;
    v_day_shifts jsonb;
    v_shift_record jsonb;
    v_open_time time;
    v_close_time time;
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created integer := 0;
    v_slots_updated integer := 0;
    v_slots_preserved integer := 0;
    v_open_days integer := 0;
    v_tables_used integer := 0;
    
    -- VARIABLES PARA CALENDARIO
    v_special_event RECORD;
    v_calendar_day RECORD;
    v_is_special_event boolean := false;
    v_event_closed boolean := false;
    
    -- VARIABLES PARA REGENERACIÓN
    v_existing_slot RECORD;
BEGIN
    RAISE NOTICE '🔄 REGENERACIÓN INTELIGENTE PARA RESTAURANTE %', p_restaurant_id;
    
    -- Obtener configuración del restaurante
    SELECT * INTO v_restaurant_record FROM restaurants WHERE id = p_restaurant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Restaurante no encontrado');
    END IF;
    
    v_settings := v_restaurant_record.settings;
    v_operating_hours := v_settings->'operating_hours';
    v_calendar_schedule := v_settings->'calendar_schedule';
    v_reservation_policy := v_settings->'reservation_policy';
    
    -- Configurar política de reservas
    IF v_reservation_policy IS NOT NULL THEN
        v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
        v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
    END IF;
    
    v_standard_duration := p_slot_duration_minutes;
    v_final_end_date := p_end_date; -- CORREGIDO: usar parámetro
    
    -- Verificar mesas activas
    SELECT COUNT(*) INTO v_total_tables
    FROM tables 
    WHERE restaurant_id = p_restaurant_id 
    AND is_active = true
    AND capacity >= v_min_party_size;
    
    IF v_total_tables = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin mesas activas');
    END IF;
    
    -- 🛡️ CONTAR SLOTS CON RESERVAS PARA PROTEGER
    SELECT COUNT(*) INTO v_slots_preserved
    FROM availability_slots a
    INNER JOIN reservations r ON r.table_id = a.table_id 
        AND r.reservation_date = a.slot_date 
        AND r.reservation_time = a.start_time
    WHERE a.restaurant_id = p_restaurant_id
    AND a.slot_date BETWEEN p_start_date AND v_final_end_date
    AND r.status IN ('confirmed', 'pending');
    
    -- ITERAR POR CADA DÍA
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_final_end_date LOOP
        
        -- OBTENER NOMBRE DEL DÍA
        v_day_name := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday' 
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- VERIFICAR EVENTOS ESPECIALES
        v_is_special_event := false;
        v_event_closed := false;
        
        SELECT * INTO v_special_event 
        FROM special_events 
        WHERE restaurant_id = p_restaurant_id 
        AND event_date = v_current_date;
        
        IF FOUND THEN
            v_is_special_event := true;
            v_event_closed := COALESCE(v_special_event.is_closed, false);
        END IF;
        
        -- SI ESTÁ CERRADO POR EVENTO = ELIMINAR SLOTS SIN RESERVAS
        IF v_is_special_event AND v_event_closed THEN
            DELETE FROM availability_slots 
            WHERE restaurant_id = p_restaurant_id 
            AND slot_date = v_current_date
            AND id NOT IN (
                SELECT DISTINCT a.id
                FROM availability_slots a
                INNER JOIN reservations r ON r.table_id = a.table_id 
                    AND r.reservation_date = a.slot_date 
                    AND r.reservation_time = a.start_time
                WHERE a.restaurant_id = p_restaurant_id
                AND r.status IN ('confirmed', 'pending')
            );
            
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- OBTENER CONFIGURACIÓN DEL DÍA
        v_day_config := NULL;
        
        IF v_calendar_schedule IS NOT NULL THEN
            FOR v_calendar_day IN 
                SELECT * FROM jsonb_array_elements(v_calendar_schedule) 
                WHERE (value->>'date')::date = v_current_date
            LOOP
                v_day_config := v_calendar_day.value;
                EXIT;
            END LOOP;
        END IF;
        
        IF v_day_config IS NULL THEN
            v_day_config := v_operating_hours->v_day_name;
        END IF;
        
        IF v_day_config IS NULL THEN
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- VERIFICAR SI ESTÁ ABIERTO
        v_is_open := COALESCE((v_day_config->>'open')::boolean, false);
        
        IF NOT v_is_open THEN
            -- ELIMINAR SLOTS SIN RESERVAS DEL DÍA CERRADO
            DELETE FROM availability_slots 
            WHERE restaurant_id = p_restaurant_id 
            AND slot_date = v_current_date
            AND id NOT IN (
                SELECT DISTINCT a.id
                FROM availability_slots a
                INNER JOIN reservations r ON r.table_id = a.table_id 
                    AND r.reservation_date = a.slot_date 
                    AND r.reservation_time = a.start_time
                WHERE a.restaurant_id = p_restaurant_id
                AND r.status IN ('confirmed', 'pending')
            );
            
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- DÍA ABIERTO - PROCESAR
        v_open_days := v_open_days + 1;
        
        -- ELIMINAR SLOTS EXISTENTES SIN RESERVAS PARA ESTE DÍA
        DELETE FROM availability_slots 
        WHERE restaurant_id = p_restaurant_id 
        AND slot_date = v_current_date
        AND id NOT IN (
            SELECT DISTINCT a.id
            FROM availability_slots a
            INNER JOIN reservations r ON r.table_id = a.table_id 
                AND r.reservation_date = a.slot_date 
                AND r.reservation_time = a.start_time
            WHERE a.restaurant_id = p_restaurant_id
            AND r.status IN ('confirmed', 'pending')
        );
        
        -- OBTENER TURNOS/HORARIOS
        v_day_shifts := v_day_config->'shifts';
        
        IF v_day_shifts IS NOT NULL AND jsonb_array_length(v_day_shifts) > 0 THEN
            -- PROCESAR CADA TURNO
            FOR v_shift_record IN SELECT * FROM jsonb_array_elements(v_day_shifts)
            LOOP
                v_open_time := (v_shift_record->>'start_time')::time;
                v_close_time := (v_shift_record->>'end_time')::time;
                
                -- CREAR SLOTS PARA CADA MESA
                FOR v_table_record IN 
                    SELECT id, name, capacity, zone
                    FROM tables 
                    WHERE restaurant_id = p_restaurant_id 
                    AND is_active = true
                    AND capacity >= v_min_party_size
                    ORDER BY zone, name
                LOOP
                    v_slot_start_time := v_open_time;
                    
                    WHILE v_slot_start_time + (v_standard_duration || ' minutes')::interval <= v_close_time::time LOOP
                        v_slot_end_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                        
                        -- VERIFICAR SI YA EXISTE SLOT CON RESERVA
                        SELECT * INTO v_existing_slot
                        FROM availability_slots a
                        INNER JOIN reservations r ON r.table_id = a.table_id 
                            AND r.reservation_date = a.slot_date 
                            AND r.reservation_time = a.start_time
                        WHERE a.restaurant_id = p_restaurant_id
                        AND a.table_id = v_table_record.id
                        AND a.slot_date = v_current_date
                        AND a.start_time = v_slot_start_time
                        AND r.status IN ('confirmed', 'pending');
                        
                        IF FOUND THEN
                            -- ACTUALIZAR METADATA DEL SLOT CON RESERVA
                            UPDATE availability_slots 
                            SET 
                                metadata = jsonb_build_object(
                                    'duration_minutes', v_standard_duration,
                                    'table_capacity', v_table_record.capacity,
                                    'day_name', v_day_name,
                                    'shift_name', COALESCE(v_shift_record->>'name', 'Turno Principal'),
                                    'regenerated_at', NOW()
                                ),
                                updated_at = NOW()
                            WHERE restaurant_id = p_restaurant_id
                            AND table_id = v_table_record.id
                            AND slot_date = v_current_date
                            AND start_time = v_slot_start_time;
                            
                            v_slots_updated := v_slots_updated + 1;
                        ELSE
                            -- CREAR NUEVO SLOT
                            INSERT INTO availability_slots (
                                restaurant_id, 
                                table_id, 
                                slot_date, 
                                start_time, 
                                end_time,
                                status,
                                source,
                                is_available,
                                metadata,
                                created_at
                            ) VALUES (
                                p_restaurant_id, 
                                v_table_record.id, 
                                v_current_date, 
                                v_slot_start_time, 
                                v_slot_end_time,
                                'free',
                                'system',
                                true,
                                jsonb_build_object(
                                    'duration_minutes', v_standard_duration,
                                    'table_capacity', v_table_record.capacity,
                                    'day_name', v_day_name,
                                    'shift_name', COALESCE(v_shift_record->>'name', 'Turno Principal')
                                ),
                                NOW()
                            );
                            
                            v_slots_created := v_slots_created + 1;
                        END IF;
                        
                        v_slot_start_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                    END LOOP;
                END LOOP;
            END LOOP;
            
        ELSE
            -- SIN TURNOS - USAR HORARIO DIRECTO
            v_open_time := COALESCE((v_day_config->>'start_time')::time, (v_day_config->>'start')::time, '09:00'::time);
            v_close_time := COALESCE((v_day_config->>'end_time')::time, (v_day_config->>'end')::time, '22:00'::time);
            
            -- CREAR SLOTS PARA CADA MESA
            FOR v_table_record IN 
                SELECT id, name, capacity, zone
                FROM tables 
                WHERE restaurant_id = p_restaurant_id 
                AND is_active = true
                AND capacity >= v_min_party_size
                ORDER BY zone, name
            LOOP
                v_slot_start_time := v_open_time;
                
                WHILE v_slot_start_time + (v_standard_duration || ' minutes')::interval <= v_close_time::time LOOP
                    v_slot_end_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                    
                    -- VERIFICAR SI YA EXISTE SLOT CON RESERVA
                    SELECT * INTO v_existing_slot
                    FROM availability_slots a
                    INNER JOIN reservations r ON r.table_id = a.table_id 
                        AND r.reservation_date = a.slot_date 
                        AND r.reservation_time = a.start_time
                    WHERE a.restaurant_id = p_restaurant_id
                    AND a.table_id = v_table_record.id
                    AND a.slot_date = v_current_date
                    AND a.start_time = v_slot_start_time
                    AND r.status IN ('confirmed', 'pending');
                    
                    IF FOUND THEN
                        -- ACTUALIZAR METADATA
                        UPDATE availability_slots 
                        SET 
                            metadata = jsonb_build_object(
                                'duration_minutes', v_standard_duration,
                                'table_capacity', v_table_record.capacity,
                                'day_name', v_day_name,
                                'regenerated_at', NOW()
                            ),
                            updated_at = NOW()
                        WHERE restaurant_id = p_restaurant_id
                        AND table_id = v_table_record.id
                        AND slot_date = v_current_date
                        AND start_time = v_slot_start_time;
                        
                        v_slots_updated := v_slots_updated + 1;
                    ELSE
                        -- CREAR NUEVO SLOT
                        INSERT INTO availability_slots (
                            restaurant_id, 
                            table_id, 
                            slot_date, 
                            start_time, 
                            end_time,
                            status,
                            source,
                            is_available,
                            metadata,
                            created_at
                        ) VALUES (
                            p_restaurant_id, 
                            v_table_record.id, 
                            v_current_date, 
                            v_slot_start_time, 
                            v_slot_end_time,
                            'free',
                            'system',
                            true,
                            jsonb_build_object(
                                'duration_minutes', v_standard_duration,
                                'table_capacity', v_table_record.capacity,
                                'day_name', v_day_name
                            ),
                            NOW()
                        );
                        
                        v_slots_created := v_slots_created + 1;
                    END IF;
                    
                    v_slot_start_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                END LOOP;
            END LOOP;
        END IF;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- CALCULAR MESAS UTILIZADAS
    SELECT COUNT(DISTINCT table_id) INTO v_tables_used
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'slots_updated', v_slots_updated,
        'slots_preserved', v_slots_preserved,
        'days_processed', v_open_days,
        'tables_used', v_tables_used,
        'period_start', p_start_date,
        'period_end', v_final_end_date,
        'slot_duration_minutes', v_standard_duration,
        'message', format('REGENERACIÓN: %s nuevos, %s actualizados, %s preservados', v_slots_created, v_slots_updated, v_slots_preserved)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'slots_created', 0);
END;
$$;

-- PROBAR LA FUNCIÓN CORREGIDA
SELECT 'PROBANDO REGENERACIÓN CORREGIDA' as test, 
generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 7,
    60
) as resultado;

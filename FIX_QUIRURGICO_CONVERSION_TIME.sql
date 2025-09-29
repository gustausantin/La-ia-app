-- =====================================================
-- FIX QUIRÚRGICO: CONVERSIÓN SEGURA DE TIME
-- =====================================================
-- Problema: v_day_config contiene "false" en vez de horarios
-- Solución: Validación robusta antes de conversión

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
    
    -- VARIABLES PARA CONVERSIÓN SEGURA
    v_open_value text;
    v_close_value text;
BEGIN
    -- Obtener información del restaurante
    SELECT * INTO v_restaurant_record
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Restaurante no encontrado');
    END IF;
    
    v_settings := COALESCE(v_restaurant_record.settings, '{}'::jsonb);
    v_operating_hours := v_settings->'operating_hours';
    v_calendar_schedule := v_settings->'calendar_schedule';
    v_reservation_policy := v_settings->'reservation_policy';
    
    -- Configuración de reservas
    v_standard_duration := COALESCE((v_reservation_policy->>'standard_duration')::integer, p_slot_duration_minutes);
    v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
    v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
    
    -- Verificar mesas activas
    SELECT COUNT(*) INTO v_total_tables
    FROM restaurant_tables
    WHERE restaurant_id = p_restaurant_id AND is_active = true;
    
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
    
    -- Establecer fecha final
    v_final_end_date := COALESCE(p_end_date, p_start_date + interval '30 days');
    v_current_date := p_start_date;
    
    -- 🔄 GENERAR SLOTS PARA CADA DÍA
    WHILE v_current_date <= v_final_end_date LOOP
        -- Obtener día de la semana
        v_day_name := CASE EXTRACT(dow FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- 🎯 VERIFICAR EVENTOS ESPECIALES
        v_is_special_event := false;
        v_event_closed := false;
        
        IF v_calendar_schedule IS NOT NULL THEN
            SELECT * INTO v_special_event
            FROM special_events
            WHERE restaurant_id = p_restaurant_id
            AND event_date = v_current_date;
            
            IF FOUND THEN
                v_is_special_event := true;
                v_event_closed := COALESCE(v_special_event.is_closed, false);
            END IF;
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
        
        -- 📅 OBTENER CONFIGURACIÓN DEL DÍA
        v_day_config := v_operating_hours->v_day_name;
        
        IF v_day_config IS NULL THEN
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- VERIFICAR SI ESTÁ ABIERTO
        v_is_open := COALESCE((v_day_config->>'closed')::boolean, true) = false;
        
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
        
        -- 🔧 CONVERSIÓN SEGURA DE HORARIOS (FIX QUIRÚRGICO)
        v_open_value := v_day_config->>'open';
        v_close_value := v_day_config->>'close';
        
        -- VALIDAR Y CONVERTIR HORARIO DE APERTURA
        BEGIN
            IF v_open_value IS NULL OR v_open_value = 'false' OR v_open_value = 'true' OR v_open_value = '' THEN
                v_open_time := '09:00'::time;
            ELSE
                v_open_time := v_open_value::time;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_open_time := '09:00'::time;
        END;
        
        -- VALIDAR Y CONVERTIR HORARIO DE CIERRE
        BEGIN
            IF v_close_value IS NULL OR v_close_value = 'false' OR v_close_value = 'true' OR v_close_value = '' THEN
                v_close_time := '22:00'::time;
            ELSE
                v_close_time := v_close_value::time;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_close_time := '22:00'::time;
        END;
        
        -- 🏪 GENERAR SLOTS PARA CADA MESA
        FOR v_table_record IN 
            SELECT * FROM restaurant_tables 
            WHERE restaurant_id = p_restaurant_id AND is_active = true
        LOOP
            v_tables_used := v_tables_used + 1;
            
            -- GENERAR SLOTS DE TIEMPO
            v_slot_start_time := v_open_time;
            
            -- 🎯 CAMBIO SOLICITADO: PERMITIR RESERVAS HASTA LA HORA DE CIERRE
            WHILE v_slot_start_time <= v_close_time LOOP
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
                            'is_protected', true
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
                        is_available,
                        metadata,
                        created_at
                    ) VALUES (
                        p_restaurant_id,
                        v_table_record.id,
                        v_current_date,
                        v_slot_start_time,
                        v_slot_end_time,
                        true,
                        jsonb_build_object(
                            'duration_minutes', v_standard_duration,
                            'table_capacity', v_table_record.capacity,
                            'day_name', v_day_name,
                            'is_protected', false
                        ),
                        NOW()
                    );
                    
                    v_slots_created := v_slots_created + 1;
                END IF;
                
                -- Siguiente slot (cada 60 minutos)
                v_slot_start_time := v_slot_start_time + interval '60 minutes';
            END LOOP;
        END LOOP;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- 📊 RESULTADO FINAL
    RETURN jsonb_build_object(
        'success', true,
        'message', format('REGENERACIÓN: %s nuevos, %s actualizados, %s preservados', 
                         v_slots_created, v_slots_updated, v_slots_preserved),
        'slots_created', v_slots_created,
        'slots_updated', v_slots_updated,
        'slots_preserved', v_slots_preserved,
        'period_start', p_start_date,
        'period_end', v_final_end_date,
        'days_processed', v_open_days,
        'tables_used', v_tables_used,
        'slot_duration_minutes', v_standard_duration
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'slots_created', v_slots_created
    );
END;
$$;

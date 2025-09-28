-- =====================================================
-- FUNCIÓN CORREGIDA CON ESQUEMA REAL DE special_events
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
    v_open_days integer := 0;
    v_tables_used integer := 0;
    
    -- VARIABLES PARA CALENDARIO
    v_special_event RECORD;
    v_calendar_day RECORD;
    v_is_special_event boolean := false;
    v_event_closed boolean := false;
BEGIN
    RAISE NOTICE '🚀 INICIANDO GENERACIÓN CON CALENDARIO REAL PARA RESTAURANTE %', p_restaurant_id;
    
    -- Obtener configuración del restaurante
    SELECT * INTO v_restaurant_record FROM restaurants WHERE id = p_restaurant_id;
    IF NOT FOUND THEN
        RAISE NOTICE '❌ RESTAURANTE NO ENCONTRADO';
        RETURN jsonb_build_object('success', false, 'error', 'Restaurante no encontrado');
    END IF;
    
    v_settings := v_restaurant_record.settings;
    v_operating_hours := v_settings->'operating_hours';
    v_calendar_schedule := v_settings->'calendar_schedule';
    v_reservation_policy := v_settings->'reservation_policy';
    
    RAISE NOTICE '📋 HORARIOS BASE: %', v_operating_hours;
    RAISE NOTICE '📅 CALENDARIO: %', v_calendar_schedule;
    
    -- Configurar política de reservas
    IF v_reservation_policy IS NOT NULL THEN
        v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
        v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
    END IF;
    
    v_standard_duration := p_slot_duration_minutes;
    RAISE NOTICE '⏱️ DURACIÓN SLOT: % minutos', v_standard_duration;
    
    -- Verificar mesas activas
    SELECT COUNT(*) INTO v_total_tables
    FROM tables 
    WHERE restaurant_id = p_restaurant_id 
    AND is_active = true
    AND capacity >= v_min_party_size;
    
    RAISE NOTICE '🪑 MESAS ACTIVAS ENCONTRADAS: %', v_total_tables;
    
    IF v_total_tables = 0 THEN
        RAISE NOTICE '❌ NO HAY MESAS ACTIVAS';
        RETURN jsonb_build_object('success', false, 'error', 'Sin mesas activas');
    END IF;
    
    -- ITERAR POR CADA DÍA EN EL RANGO
    v_current_date := p_start_date;
    v_final_end_date := p_end_date;
    
    RAISE NOTICE '📅 PROCESANDO DESDE % HASTA %', v_current_date, v_final_end_date;
    
    WHILE v_current_date <= v_final_end_date LOOP
        
        -- OBTENER NOMBRE DEL DÍA EN INGLÉS
        v_day_name := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday' 
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        RAISE NOTICE '📅 PROCESANDO DÍA: % (%)', v_current_date, v_day_name;
        
        -- 🔍 PASO 1: VERIFICAR EVENTOS ESPECIALES (VACACIONES, CIERRES)
        v_is_special_event := false;
        v_event_closed := false;
        
        SELECT * INTO v_special_event 
        FROM special_events 
        WHERE restaurant_id = p_restaurant_id 
        AND event_date = v_current_date;
        
        IF FOUND THEN
            v_is_special_event := true;
            v_event_closed := COALESCE(v_special_event.is_closed, false);
            
            RAISE NOTICE '🎯 EVENTO ESPECIAL ENCONTRADO: % (%) - CERRADO: %', 
                COALESCE(v_special_event.title, 'Sin título'),
                COALESCE(v_special_event.type, 'Sin tipo'), 
                v_event_closed;
        END IF;
        
        -- 🚫 SI HAY EVENTO Y ESTÁ CERRADO = SALTAR DÍA
        IF v_is_special_event AND v_event_closed THEN
            RAISE NOTICE '🚫 DÍA % CERRADO POR EVENTO ESPECIAL ("%") - SALTANDO', 
                v_current_date, COALESCE(v_special_event.title, 'Sin título');
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- 🔍 PASO 2: VERIFICAR CALENDAR_SCHEDULE (SI EXISTE)
        v_day_config := NULL;
        
        IF v_calendar_schedule IS NOT NULL THEN
            -- Buscar en calendar_schedule primero
            FOR v_calendar_day IN 
                SELECT * FROM jsonb_array_elements(v_calendar_schedule) 
                WHERE (value->>'date')::date = v_current_date
            LOOP
                v_day_config := v_calendar_day.value;
                RAISE NOTICE '📅 CONFIGURACIÓN DESDE CALENDAR_SCHEDULE: %', v_day_config;
                EXIT; -- Solo tomar el primero
            END LOOP;
        END IF;
        
        -- 🔍 PASO 3: FALLBACK A OPERATING_HOURS SI NO HAY CALENDAR_SCHEDULE
        IF v_day_config IS NULL THEN
            v_day_config := v_operating_hours->v_day_name;
            RAISE NOTICE '📅 CONFIGURACIÓN DESDE OPERATING_HOURS: %', v_day_config;
        END IF;
        
        IF v_day_config IS NULL THEN
            RAISE NOTICE '⚠️ NO HAY CONFIGURACIÓN PARA %', v_day_name;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- 🔍 PASO 4: VERIFICAR SI ESTÁ ABIERTO
        v_is_open := COALESCE((v_day_config->>'open')::boolean, false);
        
        RAISE NOTICE '🔍 DÍA % - ABIERTO: % - CONFIG: %', 
            v_day_name, v_is_open, v_day_config;
        
        IF NOT v_is_open THEN
            RAISE NOTICE '🚫 DÍA % CERRADO EN CONFIGURACIÓN - SALTANDO', v_day_name;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- ✅ DÍA ABIERTO - PROCESAR
        v_open_days := v_open_days + 1;
        RAISE NOTICE '✅ DÍA % ABIERTO - PROCESANDO HORARIOS', v_day_name;
        
        -- 🕐 OBTENER TURNOS/HORARIOS
        v_day_shifts := v_day_config->'shifts';
        
        IF v_day_shifts IS NOT NULL AND jsonb_array_length(v_day_shifts) > 0 THEN
            RAISE NOTICE '🕐 PROCESANDO % TURNOS', jsonb_array_length(v_day_shifts);
            
            -- PROCESAR CADA TURNO
            FOR v_shift_record IN SELECT * FROM jsonb_array_elements(v_day_shifts)
            LOOP
                v_open_time := (v_shift_record->>'start_time')::time;
                v_close_time := (v_shift_record->>'end_time')::time;
                
                RAISE NOTICE '⏰ TURNO: % - %', v_open_time, v_close_time;
                
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
                                'shift_name', COALESCE(v_shift_record->>'name', 'Turno Principal'),
                                'source_type', CASE WHEN v_calendar_schedule IS NOT NULL THEN 'calendar_schedule' ELSE 'operating_hours' END,
                                'special_event', v_is_special_event,
                                'event_title', CASE WHEN v_is_special_event THEN v_special_event.title ELSE NULL END,
                                'event_type', CASE WHEN v_is_special_event THEN v_special_event.type ELSE NULL END
                            ),
                            NOW()
                        );
                        
                        v_slots_created := v_slots_created + 1;
                        v_slot_start_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                    END LOOP;
                END LOOP;
            END LOOP;
            
        ELSE
            -- SIN TURNOS - USAR HORARIO DIRECTO
            v_open_time := COALESCE((v_day_config->>'start_time')::time, (v_day_config->>'start')::time, '09:00'::time);
            v_close_time := COALESCE((v_day_config->>'end_time')::time, (v_day_config->>'end')::time, '22:00'::time);
            
            RAISE NOTICE '⏰ HORARIO DIRECTO: % - %', v_open_time, v_close_time;
            
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
                            'source_type', CASE WHEN v_calendar_schedule IS NOT NULL THEN 'calendar_schedule' ELSE 'operating_hours' END,
                            'special_event', v_is_special_event,
                            'event_title', CASE WHEN v_is_special_event THEN v_special_event.title ELSE NULL END,
                            'event_type', CASE WHEN v_is_special_event THEN v_special_event.type ELSE NULL END
                        ),
                        NOW()
                    );
                    
                    v_slots_created := v_slots_created + 1;
                    v_slot_start_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                END LOOP;
            END LOOP;
        END IF;
        
        RAISE NOTICE '📊 SLOTS CREADOS HASTA AHORA: %', v_slots_created;
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- CALCULAR MESAS UTILIZADAS
    SELECT COUNT(DISTINCT table_id) INTO v_tables_used
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '🎯 RESULTADO FINAL: % slots creados en % días abiertos usando % mesas', 
        v_slots_created, v_open_days, v_tables_used;
    
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'days_processed', v_open_days,
        'tables_used', v_tables_used,
        'period_start', p_start_date,
        'period_end', v_final_end_date,
        'slot_duration_minutes', v_standard_duration,
        'message', format('CALENDARIO REAL: %s slots en %s días abiertos', v_slots_created, v_open_days)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'slots_created', 0);
END;
$$;

-- PROBAR LA FUNCIÓN CORREGIDA
SELECT 'PROBANDO FUNCIÓN CORREGIDA' as test, 
generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    '2024-10-10'::date,  -- Día con vacaciones (DEBE SALTAR)
    '2024-10-11'::date,  -- Día siguiente (DEBE CREAR SLOTS)
    60
) as resultado;

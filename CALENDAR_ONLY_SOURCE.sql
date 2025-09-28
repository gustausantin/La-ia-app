-- =====================================================
-- FUNCIÓN CORREGIDA: SOLO CALENDARIO COMO FUENTE
-- No usa operating_hours, solo calendar_schedule
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
    -- CONFIGURACIÓN DEL RESTAURANTE
    v_restaurant_record RECORD;
    v_settings jsonb;
    v_calendar_schedule jsonb; -- 🗓️ SOLO CALENDARIO
    v_reservation_policy jsonb;
    
    -- POLÍTICAS DE RESERVA
    v_min_party_size integer := 1;
    v_max_party_size integer := 20;
    v_standard_duration integer;
    
    -- INVENTARIO DE MESAS
    v_total_tables integer := 0;
    v_table_record RECORD;
    
    -- ITERACIÓN POR DÍAS
    v_current_date date;
    v_final_end_date date;
    v_day_name text;
    v_day_of_week text;
    
    -- 🗓️ CALENDARIO COMO ÚNICA FUENTE
    v_calendar_day jsonb;
    v_day_found boolean;
    v_is_open boolean;
    v_day_slots jsonb;
    
    -- HORARIOS DEL CALENDARIO
    v_slot_config jsonb;
    v_open_time time;
    v_close_time time;
    
    -- GENERACIÓN DE SLOTS
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created integer := 0;
    v_open_days integer := 0;
    
    -- ESTADÍSTICAS
    v_tables_used integer := 0;
    v_first_slot_time time;
    v_last_slot_time time;
    
BEGIN
    RAISE NOTICE '🗓️ GENERANDO DISPONIBILIDADES DESDE CALENDARIO ÚNICAMENTE';
    RAISE NOTICE '🏪 Restaurante: %', p_restaurant_id;
    RAISE NOTICE '📅 Período: % hasta %', p_start_date, p_end_date;
    RAISE NOTICE '⏱️ Duración por slot: % minutos', p_slot_duration_minutes;
    
    -- =====================================================
    -- PASO 1: OBTENER CONFIGURACIÓN DEL RESTAURANTE
    -- =====================================================
    SELECT * INTO v_restaurant_record 
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Restaurante no encontrado');
    END IF;
    
    v_settings := v_restaurant_record.settings;
    IF v_settings IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Configuración del restaurante no encontrada');
    END IF;
    
    -- =====================================================
    -- PASO 2: OBTENER CALENDARIO (ÚNICA FUENTE)
    -- =====================================================
    v_calendar_schedule := v_settings->'calendar_schedule';
    
    IF v_calendar_schedule IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay calendario configurado. Ve a Configuración > Horarios y guarda el calendario',
            'slots_created', 0
        );
    END IF;
    
    RAISE NOTICE '🗓️ Calendario encontrado con % días configurados', jsonb_array_length(v_calendar_schedule);
    
    -- =====================================================
    -- PASO 3: OBTENER POLÍTICAS Y MESAS
    -- =====================================================
    v_reservation_policy := v_settings->'reservation_policy';
    IF v_reservation_policy IS NOT NULL THEN
        v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
        v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
    END IF;
    
    v_standard_duration := p_slot_duration_minutes;
    
    -- Verificar mesas
    SELECT COUNT(*) INTO v_total_tables
    FROM tables 
    WHERE restaurant_id = p_restaurant_id 
    AND is_active = true
    AND capacity >= v_min_party_size;
    
    IF v_total_tables = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay mesas activas configuradas',
            'slots_created', 0
        );
    END IF;
    
    RAISE NOTICE '🪑 Mesas válidas encontradas: %', v_total_tables;
    
    -- =====================================================
    -- PASO 4: ITERAR POR CADA DÍA USANDO SOLO CALENDARIO
    -- =====================================================
    v_current_date := p_start_date;
    v_final_end_date := p_end_date;
    
    WHILE v_current_date <= v_final_end_date LOOP
        -- Obtener día de la semana
        v_day_name := LOWER(TO_CHAR(v_current_date, 'Day'));
        v_day_name := TRIM(v_day_name);
        
        -- Convertir a inglés para buscar en calendario
        v_day_of_week := CASE v_day_name
            WHEN 'lunes' THEN 'monday'
            WHEN 'martes' THEN 'tuesday'
            WHEN 'miércoles' THEN 'wednesday'
            WHEN 'jueves' THEN 'thursday'
            WHEN 'viernes' THEN 'friday'
            WHEN 'sábado' THEN 'saturday'
            WHEN 'domingo' THEN 'sunday'
            ELSE v_day_name
        END;
        
        -- 🗓️ BUSCAR DÍA EN CALENDARIO (ÚNICA FUENTE)
        v_day_found := false;
        v_is_open := false;
        v_calendar_day := NULL;
        
        FOR v_calendar_day IN SELECT * FROM jsonb_array_elements(v_calendar_schedule)
        LOOP
            IF v_calendar_day->>'day_of_week' = v_day_of_week THEN
                v_day_found := true;
                v_is_open := COALESCE((v_calendar_day->>'is_open')::boolean, false);
                
                RAISE NOTICE '🗓️ % (%) encontrado en calendario - %', 
                    v_current_date, v_day_of_week,
                    CASE WHEN v_is_open THEN 'ABIERTO' ELSE 'CERRADO' END;
                
                EXIT; -- Salir del loop, día encontrado
            END IF;
        END LOOP;
        
        -- Si día no encontrado en calendario o está cerrado, saltar
        IF NOT v_day_found THEN
            RAISE NOTICE '⚠️ % (%) NO encontrado en calendario - SALTANDO', v_current_date, v_day_of_week;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        IF NOT v_is_open THEN
            RAISE NOTICE '❌ % (%) CERRADO en calendario - SALTANDO', v_current_date, v_day_of_week;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        v_open_days := v_open_days + 1;
        
        -- =====================================================
        -- PASO 5: USAR HORARIOS DEL CALENDARIO
        -- =====================================================
        v_day_slots := v_calendar_day->'slots';
        
        IF v_day_slots IS NOT NULL AND jsonb_array_length(v_day_slots) > 0 THEN
            -- PROCESAR TURNOS DEL CALENDARIO
            RAISE NOTICE '🔄 Procesando % turnos del calendario', jsonb_array_length(v_day_slots);
            
            FOR v_slot_config IN SELECT * FROM jsonb_array_elements(v_day_slots)
            LOOP
                v_open_time := (v_slot_config->>'start_time')::time;
                v_close_time := (v_slot_config->>'end_time')::time;
                
                RAISE NOTICE '🕒 Turno del calendario: % - %', v_open_time, v_close_time;
                
                -- Generar slots para cada mesa en este turno
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
                        
                        -- Insertar slot
                        INSERT INTO availability_slots (
                            restaurant_id, table_id, slot_date, start_time, end_time,
                            duration_minutes, max_party_size, status, created_at
                        ) VALUES (
                            p_restaurant_id, v_table_record.id, v_current_date, 
                            v_slot_start_time, v_slot_end_time, v_standard_duration,
                            v_table_record.capacity, 'available', NOW()
                        );
                        
                        v_slots_created := v_slots_created + 1;
                        v_slot_start_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                        
                        -- Estadísticas
                        IF v_first_slot_time IS NULL OR v_slot_start_time < v_first_slot_time THEN
                            v_first_slot_time := v_slot_start_time;
                        END IF;
                        IF v_last_slot_time IS NULL OR v_slot_end_time > v_last_slot_time THEN
                            v_last_slot_time := v_slot_end_time;
                        END IF;
                    END LOOP;
                END LOOP;
            END LOOP;
        ELSE
            RAISE NOTICE '⚠️ % - Día abierto pero sin turnos configurados en calendario', v_current_date;
        END IF;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- Calcular mesas utilizadas
    SELECT COUNT(DISTINCT table_id) INTO v_tables_used
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '✅ GENERACIÓN COMPLETADA DESDE CALENDARIO:';
    RAISE NOTICE '   📊 Slots creados: %', v_slots_created;
    RAISE NOTICE '   📅 Días abiertos: %', v_open_days;
    RAISE NOTICE '   🪑 Mesas utilizadas: %', v_tables_used;
    
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'days_processed', v_open_days,
        'tables_used', v_tables_used,
        'period_start', p_start_date,
        'period_end', v_final_end_date,
        'first_slot_time', v_first_slot_time,
        'last_slot_time', v_last_slot_time,
        'slot_duration_minutes', v_standard_duration,
        'source', 'calendar_only',
        'message', format('Generación desde calendario: %s slots para %s días', v_slots_created, v_open_days)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR EN GENERACIÓN DESDE CALENDARIO: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'slots_created', 0
        );
END;
$$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ FUNCIÓN CORREGIDA: generate_availability_slots()';
    RAISE NOTICE '🗓️ AHORA USA SOLO EL CALENDARIO COMO FUENTE';
    RAISE NOTICE '❌ NO USA operating_hours';
    RAISE NOTICE '✅ USA calendar_schedule ÚNICAMENTE';
    RAISE NOTICE '🎯 RESPETA EXACTAMENTE LO QUE VE EN EL CALENDARIO';
END $$;

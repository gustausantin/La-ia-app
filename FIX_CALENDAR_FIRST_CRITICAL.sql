-- =====================================================
-- FIX CRÍTICO: CALENDARIO PRIMERO, HORARIOS DESPUÉS
-- La función debe consultar el CALENDARIO como fuente de verdad
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
    v_operating_hours jsonb;
    v_special_events jsonb; -- 🗓️ EVENTOS DEL CALENDARIO
    v_reservation_policy jsonb;
    
    -- POLÍTICAS DE RESERVA
    v_min_party_size integer := 1;
    v_max_party_size integer := 20;
    v_standard_duration integer;
    v_advance_booking_days integer := 30;
    
    -- INVENTARIO DE MESAS
    v_total_tables integer := 0;
    v_table_record RECORD;
    
    -- ITERACIÓN POR DÍAS
    v_current_date date;
    v_final_end_date date;
    v_day_name text;
    v_day_config jsonb;
    v_is_open boolean;
    
    -- 🗓️ VERIFICACIÓN DE CALENDARIO
    v_calendar_event jsonb;
    v_is_closed_by_event boolean;
    v_event_found boolean;
    
    -- HORARIOS DEL DÍA
    v_day_shifts jsonb;
    v_shift_record jsonb;
    v_open_time time;
    v_close_time time;
    
    -- GENERACIÓN DE SLOTS
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created integer := 0;
    v_open_days integer := 0;
    v_total_slots integer := 0;
    v_slot_id uuid;
    
    -- CONTADORES Y ESTADÍSTICAS
    v_tables_used integer := 0;
    v_first_slot_time time;
    v_last_slot_time time;
    
BEGIN
    RAISE NOTICE '🚀 GENERANDO DISPONIBILIDADES CON CALENDARIO COMO BASE';
    RAISE NOTICE '🏪 Restaurante: %', p_restaurant_id;
    RAISE NOTICE '📅 Período: % hasta %', p_start_date, p_end_date;
    RAISE NOTICE '⏱️ Duración por slot: % minutos', p_slot_duration_minutes;
    
    -- Validar parámetros
    IF p_restaurant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Restaurant ID requerido');
    END IF;
    
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Fechas de inicio y fin requeridas');
    END IF;
    
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
    -- PASO 2: OBTENER CONFIGURACIONES CRÍTICAS
    -- =====================================================
    v_operating_hours := v_settings->'operating_hours';
    v_special_events := v_settings->'special_events'; -- 🗓️ CALENDARIO
    v_reservation_policy := v_settings->'reservation_policy';
    
    RAISE NOTICE '🗓️ Eventos especiales encontrados: %', 
        CASE WHEN v_special_events IS NOT NULL THEN jsonb_array_length(v_special_events) ELSE 0 END;
    
    -- Configurar políticas
    IF v_reservation_policy IS NOT NULL THEN
        v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
        v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
        v_advance_booking_days := COALESCE((v_reservation_policy->>'advance_booking_days')::integer, 30);
    END IF;
    
    v_standard_duration := p_slot_duration_minutes;
    
    -- =====================================================
    -- PASO 3: VERIFICAR MESAS DISPONIBLES
    -- =====================================================
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
    -- PASO 4: VERIFICAR HORARIOS OPERATIVOS
    -- =====================================================
    IF v_operating_hours IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay horarios operativos configurados',
            'slots_created', 0
        );
    END IF;
    
    -- =====================================================
    -- PASO 5: ITERAR POR CADA DÍA (CALENDARIO PRIMERO)
    -- =====================================================
    v_current_date := p_start_date;
    v_final_end_date := LEAST(p_end_date, p_start_date + v_advance_booking_days);
    
    WHILE v_current_date <= v_final_end_date LOOP
        -- Obtener nombre del día
        v_day_name := LOWER(TO_CHAR(v_current_date, 'Day'));
        v_day_name := TRIM(v_day_name);
        
        -- Convertir a inglés si es necesario
        v_day_name := CASE v_day_name
            WHEN 'lunes' THEN 'monday'
            WHEN 'martes' THEN 'tuesday'
            WHEN 'miércoles' THEN 'wednesday'
            WHEN 'jueves' THEN 'thursday'
            WHEN 'viernes' THEN 'friday'
            WHEN 'sábado' THEN 'saturday'
            WHEN 'domingo' THEN 'sunday'
            ELSE v_day_name
        END;
        
        -- 🗓️ PASO CRÍTICO: VERIFICAR CALENDARIO PRIMERO
        v_is_closed_by_event := false;
        v_event_found := false;
        
        IF v_special_events IS NOT NULL THEN
            -- Buscar eventos para esta fecha específica
            FOR v_calendar_event IN SELECT * FROM jsonb_array_elements(v_special_events)
            LOOP
                IF (v_calendar_event->>'event_date')::date = v_current_date THEN
                    v_event_found := true;
                    
                    -- Verificar si es un evento de cierre
                    IF (v_calendar_event->>'is_closed')::boolean = true 
                       OR v_calendar_event->>'type' IN ('cerrado', 'closure', 'holiday', 'vacation') THEN
                        v_is_closed_by_event := true;
                        
                        RAISE NOTICE '🗓️ % - CERRADO POR EVENTO: % (tipo: %)', 
                            v_current_date, 
                            v_calendar_event->>'title',
                            v_calendar_event->>'type';
                        EXIT; -- Salir del loop, día cerrado
                    END IF;
                END IF;
            END LOOP;
        END IF;
        
        -- Si está cerrado por evento del calendario, saltar día
        IF v_is_closed_by_event THEN
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- 🕒 PASO SECUNDARIO: VERIFICAR HORARIO BASE
        v_day_config := v_operating_hours->v_day_name;
        v_is_open := false;
        
        IF v_day_config IS NOT NULL AND (v_day_config->>'open')::boolean = true THEN
            v_is_open := true;
        END IF;
        
        RAISE NOTICE '📅 % (%) - %', v_current_date, v_day_name, 
            CASE WHEN v_is_open THEN 'ABIERTO' ELSE 'CERRADO POR HORARIO' END;
        
        -- Si está cerrado por horario, saltar día
        IF NOT v_is_open THEN
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        v_open_days := v_open_days + 1;
        
        -- =====================================================
        -- PROCESAR TURNOS O HORARIO GENERAL
        -- =====================================================
        v_day_shifts := v_day_config->'shifts';
        
        IF v_day_shifts IS NOT NULL AND jsonb_array_length(v_day_shifts) > 0 THEN
            -- PROCESAR TURNOS MÚLTIPLES
            RAISE NOTICE '🔄 Procesando % turnos', jsonb_array_length(v_day_shifts);
            
            FOR v_shift_record IN SELECT * FROM jsonb_array_elements(v_day_shifts)
            LOOP
                v_open_time := (v_shift_record->>'start_time')::time;
                v_close_time := (v_shift_record->>'end_time')::time;
                
                RAISE NOTICE '🕒 Turno: %-%s', v_open_time, v_close_time;
                
                -- Generar slots para este turno
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
                        
                        -- Guardar primer y último slot para estadísticas
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
            -- PROCESAR HORARIO GENERAL DEL DÍA
            v_open_time := COALESCE((v_day_config->>'start')::time, '09:00'::time);
            v_close_time := COALESCE((v_day_config->>'end')::time, '22:00'::time);
            
            RAISE NOTICE '📋 Horario general: %-%s', v_open_time, v_close_time;
            
            -- Generar slots para cada mesa
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
                    
                    -- Guardar primer y último slot para estadísticas
                    IF v_first_slot_time IS NULL OR v_slot_start_time < v_first_slot_time THEN
                        v_first_slot_time := v_slot_start_time;
                    END IF;
                    IF v_last_slot_time IS NULL OR v_slot_end_time > v_last_slot_time THEN
                        v_last_slot_time := v_slot_end_time;
                    END IF;
                END LOOP;
            END LOOP;
        END IF;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- Calcular mesas utilizadas
    SELECT COUNT(DISTINCT table_id) INTO v_tables_used
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '✅ GENERACIÓN COMPLETADA:';
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
        'message', format('Generación exitosa: %s slots para %s días', v_slots_created, v_open_days)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR EN GENERACIÓN: %', SQLERRM;
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
    RAISE NOTICE '🗓️ AHORA CONSULTA EL CALENDARIO PRIMERO';
    RAISE NOTICE '🛡️ RESPETA VACACIONES Y FESTIVOS';
    RAISE NOTICE '⚠️ EJECUTA ESTE SCRIPT EN SUPABASE PARA CORREGIR EL PROBLEMA';
END $$;

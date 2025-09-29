-- 🎯 FUNCIÓN DEFINITIVA PARA GENERACIÓN DE DISPONIBILIDADES
-- Implementa la lógica: CALENDARIO PRIMERO → HORARIO GENERAL → TURNOS → SLOTS
-- Basada en la estructura real de las tablas confirmada por el usuario

-- ELIMINAR FUNCIÓN ANTERIOR
DROP FUNCTION IF EXISTS generate_availability_slots_smart_check(uuid, date, date, integer);

-- FUNCIÓN AUXILIAR PARA GENERAR SLOTS EN UN RANGO
CREATE OR REPLACE FUNCTION generar_slots_para_rango_final(
    p_restaurant_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_shift_name text,
    p_slot_duration_minutes integer
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_time time;
    v_end_time time;
    v_table_record record;
    v_slots_created integer := 0;
    v_last_allowed_start time;
BEGIN
    -- Calcular última hora de inicio permitida
    v_last_allowed_start := p_end_time - (p_slot_duration_minutes || ' minutes')::interval;
    
    -- Si no hay tiempo suficiente para al menos un slot, salir
    IF p_start_time > v_last_allowed_start THEN
        RAISE NOTICE '⚠️ No hay tiempo suficiente para slots entre % y %', p_start_time, p_end_time;
        RETURN 0;
    END IF;
    
    -- Obtener todas las mesas activas del restaurante
    FOR v_table_record IN 
        SELECT id, name 
        FROM tables 
        WHERE restaurant_id = p_restaurant_id 
        AND active = true
    LOOP
        v_current_time := p_start_time;
        
        -- Generar slots cada 30 minutos dentro del rango
        WHILE v_current_time <= v_last_allowed_start LOOP
            v_end_time := v_current_time + (p_slot_duration_minutes || ' minutes')::interval;
            
            -- Verificar que no hay reserva confirmada/pendiente en este slot
            IF NOT EXISTS (
                SELECT 1 FROM reservations 
                WHERE table_id = v_table_record.id
                AND reservation_date = p_date
                AND reservation_time = v_current_time
                AND status IN ('confirmed', 'pending')
            ) THEN
                -- Insertar slot (evitar duplicados)
                INSERT INTO availability_slots (
                    restaurant_id,
                    slot_date,
                    start_time,
                    end_time,
                    table_id,
                    shift_name,
                    status,
                    source,
                    is_available,
                    duration_minutes
                ) VALUES (
                    p_restaurant_id,
                    p_date,
                    v_current_time,
                    v_end_time,
                    v_table_record.id,
                    p_shift_name,
                    'free',
                    'system',
                    true,
                    p_slot_duration_minutes
                )
                ON CONFLICT (restaurant_id, slot_date, start_time, table_id) 
                DO NOTHING;
                
                v_slots_created := v_slots_created + 1;
            END IF;
            
            -- Avanzar 30 minutos
            v_current_time := v_current_time + interval '30 minutes';
        END LOOP;
    END LOOP;
    
    RETURN v_slots_created;
END;
$$;

-- FUNCIÓN PRINCIPAL DEFINITIVA
CREATE OR REPLACE FUNCTION generate_availability_slots_smart_check(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT (CURRENT_DATE + interval '10 days')::date,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_date date;
    v_restaurant_settings jsonb;
    v_operating_hours jsonb;
    v_day_of_week text;
    v_day_config jsonb;
    v_shifts jsonb;
    v_shift jsonb;
    v_special_event record;
    v_total_slots integer := 0;
    v_processed_days integer := 0;
    v_skipped_days integer := 0;
    v_slots_created integer;
    v_start_time time;
    v_end_time time;
    v_shift_name text;
    v_shift_start time;
    v_shift_end time;
BEGIN
    RAISE NOTICE '🚀 INICIANDO LÓGICA DEFINITIVA - CALENDARIO → HORARIO → TURNOS → SLOTS';
    
    -- 1. VALIDACIONES INICIALES
    IF p_restaurant_id IS NULL THEN
        RETURN jsonb_build_object('error', 'restaurant_id es requerido');
    END IF;
    
    -- Obtener configuración del restaurante
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF v_restaurant_settings IS NULL THEN
        RETURN jsonb_build_object('error', 'Restaurante no encontrado');
    END IF;
    
    v_operating_hours := v_restaurant_settings->'operating_hours';
    
    IF v_operating_hours IS NULL THEN
        RETURN jsonb_build_object('error', 'operating_hours no configurado en settings');
    END IF;
    
    -- 2. LIMPIAR SLOTS EXISTENTES SIN RESERVAS
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND slot_date BETWEEN p_start_date AND p_end_date
    AND id NOT IN (
        SELECT DISTINCT a.id
        FROM availability_slots a
        INNER JOIN reservations r ON r.table_id = a.table_id 
            AND r.reservation_date = a.slot_date 
            AND r.reservation_time = a.start_time
        WHERE a.restaurant_id = p_restaurant_id
        AND r.status IN ('confirmed', 'pending')
    );
    
    RAISE NOTICE '🧹 Slots existentes limpiados para el período % - %', p_start_date, p_end_date;
    
    -- 3. PROCESAR CADA DÍA SEGÚN LÓGICA DEFINITIVA
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        RAISE NOTICE '📅 Procesando fecha: %', v_current_date;
        
        -- REGLA 1: CALENDARIO PRIMERO (PRIORIDAD MÁXIMA)
        SELECT * INTO v_special_event
        FROM special_events
        WHERE restaurant_id = p_restaurant_id
        AND event_date = v_current_date
        AND is_closed = true;
        
        IF FOUND THEN
            RAISE NOTICE '🚫 CALENDARIO: Día cerrado por evento especial - %', v_special_event.title;
            v_skipped_days := v_skipped_days + 1;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- Obtener día de la semana
        v_day_of_week := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- REGLA 2: HORARIO GENERAL DEL RESTAURANTE
        v_day_config := v_operating_hours->v_day_of_week;
        
        IF v_day_config IS NULL OR (v_day_config->>'open')::boolean = false THEN
            RAISE NOTICE '🚫 HORARIO: Día cerrado según operating_hours - %', v_day_of_week;
            v_skipped_days := v_skipped_days + 1;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- Obtener horarios base del día
        v_start_time := (v_day_config->>'start')::time;
        v_end_time := (v_day_config->>'end')::time;
        
        RAISE NOTICE '✅ Día abierto: % de % a %', v_day_of_week, v_start_time, v_end_time;
        
        -- REGLA 3: TURNOS PREVALECEN SOBRE HORARIO GENERAL
        v_shifts := v_day_config->'shifts';
        
        IF v_shifts IS NOT NULL AND jsonb_array_length(v_shifts) > 0 THEN
            RAISE NOTICE '🔄 Procesando % turnos para %', jsonb_array_length(v_shifts), v_day_of_week;
            
            -- Procesar cada turno
            FOR v_shift IN SELECT * FROM jsonb_array_elements(v_shifts)
            LOOP
                v_shift_name := v_shift->>'name';
                v_shift_start := (v_shift->>'start_time')::time;
                v_shift_end := (v_shift->>'end_time')::time;
                
                RAISE NOTICE '⏰ Turno: % (% - %)', v_shift_name, v_shift_start, v_shift_end;
                
                -- Generar slots para este turno
                v_slots_created := generar_slots_para_rango_final(
                    p_restaurant_id,
                    v_current_date,
                    v_shift_start,
                    v_shift_end,
                    v_shift_name,
                    p_slot_duration_minutes
                );
                
                v_total_slots := v_total_slots + v_slots_created;
                RAISE NOTICE '✅ Creados % slots para turno %', v_slots_created, v_shift_name;
            END LOOP;
        ELSE
            -- Sin turnos: usar horario general completo
            RAISE NOTICE '📋 Sin turnos definidos, usando horario general completo';
            
            v_slots_created := generar_slots_para_rango_final(
                p_restaurant_id,
                v_current_date,
                v_start_time,
                v_end_time,
                'Horario General',
                p_slot_duration_minutes
            );
            
            v_total_slots := v_total_slots + v_slots_created;
            RAISE NOTICE '✅ Creados % slots para horario general', v_slots_created;
        END IF;
        
        v_processed_days := v_processed_days + 1;
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- 4. RESULTADO FINAL
    RAISE NOTICE '🎉 PROCESO COMPLETADO: % días procesados, % días omitidos, % slots totales', 
        v_processed_days, v_skipped_days, v_total_slots;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Disponibilidades generadas con lógica definitiva',
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'stats', jsonb_build_object(
            'processed_days', v_processed_days,
            'skipped_days', v_skipped_days,
            'total_slots', v_total_slots,
            'slot_duration_minutes', p_slot_duration_minutes
        ),
        'logic_applied', jsonb_build_array(
            'REGLA 1: Calendario primero (special_events.is_closed)',
            'REGLA 2: Horario general (operating_hours.open)',
            'REGLA 3: Turnos prevalecen (shifts dentro de operating_hours)',
            'REGLA 4: Slots cada 30min respetando duración'
        )
    );
END;
$$;

-- COMENTARIOS SOBRE LA IMPLEMENTACIÓN
COMMENT ON FUNCTION generate_availability_slots_smart_check IS 
'Función definitiva para generar availability_slots respetando:
1. CALENDARIO PRIMERO: special_events.is_closed = true bloquea el día
2. HORARIO GENERAL: operating_hours.open = false bloquea el día  
3. TURNOS PREVALECEN: si existen shifts, solo se generan slots dentro de ellos
4. SLOTS: intervalos de 30min respetando reservation_duration
Estructura basada en restaurants.settings confirmada por el usuario.';

-- VERIFICAR FUNCIÓN CREADA
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_availability_slots_smart_check';

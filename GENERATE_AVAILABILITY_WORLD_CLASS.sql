-- =====================================================
-- FUNCIÓN WORLD-CLASS PARA GENERAR DISPONIBILIDADES
-- =====================================================
-- Lógica definitiva: Calendario → Horario General → Turnos → Slots
-- Objetivo: La mejor aplicación de restaurantes del mundo

DROP FUNCTION IF EXISTS generate_availability_slots_world_class(uuid, date, date, integer);

CREATE OR REPLACE FUNCTION generate_availability_slots_world_class(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT (CURRENT_DATE + interval '30 days')::date,
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
    v_current_date date;
    v_day_name text;
    v_day_config jsonb;
    v_is_day_open boolean;
    v_general_start_time time;
    v_general_end_time time;
    v_day_shifts jsonb;
    v_shift_record jsonb;
    v_shift_start_time time;
    v_shift_end_time time;
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created integer := 0;
    v_slots_updated integer := 0;
    v_slots_preserved integer := 0;
    v_tables_processed integer := 0;
    v_days_processed integer := 0;
    v_table_record RECORD;
    v_existing_reservation_count integer;
    v_special_event RECORD;
    v_is_special_event boolean;
    v_event_closed boolean;
BEGIN
    -- =====================================================
    -- 1. VALIDACIONES INICIALES
    -- =====================================================
    
    -- Validar restaurante
    SELECT * INTO v_restaurant_record
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurante no encontrado',
            'restaurant_id', p_restaurant_id
        );
    END IF;
    
    -- Obtener configuración
    v_settings := COALESCE(v_restaurant_record.settings, '{}'::jsonb);
    v_operating_hours := v_settings->'operating_hours';
    v_calendar_schedule := v_settings->'calendar_schedule';
    
    -- Validar que hay configuración mínima
    IF v_operating_hours IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay horarios configurados para el restaurante'
        );
    END IF;
    
    -- Verificar mesas activas
    SELECT COUNT(*) INTO v_tables_processed
    FROM tables
    WHERE restaurant_id = p_restaurant_id AND is_active = true;
    
    IF v_tables_processed = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay mesas activas en el restaurante'
        );
    END IF;
    
    -- Contar reservas existentes para preservar
    SELECT COUNT(*) INTO v_slots_preserved
    FROM availability_slots a
    INNER JOIN reservations r ON r.table_id = a.table_id 
        AND r.reservation_date = a.slot_date 
        AND r.reservation_time = a.start_time
    WHERE a.restaurant_id = p_restaurant_id
    AND a.slot_date BETWEEN p_start_date AND p_end_date
    AND r.status IN ('confirmed', 'pending');
    
    RAISE NOTICE '🏪 RESTAURANTE: % - Mesas activas: % - Reservas a preservar: %', 
        v_restaurant_record.name, v_tables_processed, v_slots_preserved;
    
    -- =====================================================
    -- 2. PROCESAR CADA DÍA SEGÚN LÓGICA DEFINITIVA
    -- =====================================================
    
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        v_days_processed := v_days_processed + 1;
        
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
        
        RAISE NOTICE '📅 PROCESANDO: % (%) - Día %', 
            v_current_date, v_day_name, v_days_processed;
        
        -- =====================================================
        -- 2.1. VERIFICAR CALENDARIO (PRIORIDAD MÁXIMA)
        -- =====================================================
        
        -- Verificar eventos especiales que cierran el día
        v_is_special_event := false;
        v_event_closed := false;
        
        SELECT * INTO v_special_event
        FROM special_events
        WHERE restaurant_id = p_restaurant_id
        AND event_date = v_current_date;
        
        IF FOUND THEN
            v_is_special_event := true;
            v_event_closed := COALESCE(v_special_event.is_closed, false);
            
            IF v_event_closed THEN
                RAISE NOTICE '🚫 DÍA CERRADO POR EVENTO: % - %', 
                    v_current_date, v_special_event.title;
                
                -- Eliminar slots sin reservas del día cerrado
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
        END IF;
        
        -- =====================================================
        -- 2.2. VERIFICAR HORARIO GENERAL DEL RESTAURANTE
        -- =====================================================
        
        v_day_config := v_operating_hours->v_day_name;
        
        IF v_day_config IS NULL THEN
            RAISE NOTICE '⚠️ Sin configuración para %', v_day_name;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- Verificar si el día está abierto según configuración general
        -- Verificar tanto 'open' como 'closed' (negado) para compatibilidad
        v_is_day_open := COALESCE(
            (v_day_config->>'open')::boolean, 
            NOT COALESCE((v_day_config->>'closed')::boolean, true)
        );
        
        IF NOT v_is_day_open THEN
            RAISE NOTICE '🚫 DÍA CERRADO SEGÚN CONFIGURACIÓN: %', v_current_date;
            
            -- Eliminar slots sin reservas del día cerrado
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
        
        -- Obtener horario general del día (horario público de atención)
        BEGIN
            -- Conversión segura de horarios - probar diferentes campos
            DECLARE
                v_start_value text;
                v_end_value text;
            BEGIN
                -- Probar diferentes nombres de campos para inicio (solo strings)
                v_start_value := COALESCE(
                    v_day_config->>'start',
                    v_day_config->>'start_time',
                    '09:00'
                );
                
                -- Probar diferentes nombres de campos para fin (solo strings)
                v_end_value := COALESCE(
                    v_day_config->>'end',
                    v_day_config->>'end_time',
                    v_day_config->>'close',
                    '22:00'
                );
                
                -- Validar y convertir
                IF v_start_value IS NOT NULL AND v_start_value != 'false' AND v_start_value != 'true' THEN
                    v_general_start_time := v_start_value::time;
                ELSE
                    v_general_start_time := '09:00'::time;
                END IF;
                
                IF v_end_value IS NOT NULL AND v_end_value != 'false' AND v_end_value != 'true' THEN
                    v_general_end_time := v_end_value::time;
                ELSE
                    v_general_end_time := '22:00'::time;
                END IF;
            END;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Error parseando horarios para %, usando por defecto', v_day_name;
            v_general_start_time := '09:00'::time;
            v_general_end_time := '22:00'::time;
        END;
        
        RAISE NOTICE '🕐 HORARIO GENERAL: % - % a %', 
            v_day_name, v_general_start_time, v_general_end_time;
        
        -- Eliminar slots existentes sin reservas para regenerar
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
        
        -- =====================================================
        -- 2.3. VERIFICAR TURNOS (OPCIONAL - PREVALECEN SOBRE HORARIO GENERAL)
        -- =====================================================
        
        v_day_shifts := v_day_config->'shifts';
        
        IF v_day_shifts IS NOT NULL AND jsonb_array_length(v_day_shifts) > 0 THEN
            -- HAY TURNOS DEFINIDOS - USAR SOLO LOS TURNOS
            RAISE NOTICE '🔄 TURNOS ENCONTRADOS: % turnos para %', 
                jsonb_array_length(v_day_shifts), v_day_name;
            
            -- Procesar cada turno
            FOR i IN 0..jsonb_array_length(v_day_shifts) - 1 LOOP
                v_shift_record := v_day_shifts->i;
                
                -- Obtener horarios del turno
                BEGIN
                    v_shift_start_time := (v_shift_record->>'start_time')::time;
                    v_shift_end_time := (v_shift_record->>'end_time')::time;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Error parseando turno %, saltando', i + 1;
                    CONTINUE;
                END;
                
                RAISE NOTICE '   Turno %: % - % (%)', 
                    i + 1, v_shift_start_time, v_shift_end_time, 
                    COALESCE(v_shift_record->>'name', 'Sin nombre');
                
                -- Generar slots para este turno
                PERFORM generate_slots_for_timerange(
                    p_restaurant_id,
                    v_current_date,
                    v_shift_start_time,
                    v_shift_end_time,
                    p_slot_duration_minutes,
                    format('Turno %s', COALESCE(v_shift_record->>'name', (i + 1)::text))
                );
                
            END LOOP;
            
        ELSE
            -- NO HAY TURNOS - USAR HORARIO GENERAL COMPLETO
            RAISE NOTICE '📋 SIN TURNOS - Usando horario general completo: % a %', 
                v_general_start_time, v_general_end_time;
            
            -- Generar slots para todo el horario general
            PERFORM generate_slots_for_timerange(
                p_restaurant_id,
                v_current_date,
                v_general_start_time,
                v_general_end_time,
                p_slot_duration_minutes,
                'Horario General'
            );
            
        END IF;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- Contar slots creados
    SELECT COUNT(*) INTO v_slots_created
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND p_end_date
    AND created_at >= NOW() - interval '1 minute';
    
    -- =====================================================
    -- 3. RESULTADO FINAL
    -- =====================================================
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('WORLD-CLASS: %s nuevos, %s preservados', 
                         v_slots_created, v_slots_preserved),
        'slots_created', v_slots_created,
        'slots_updated', v_slots_updated,
        'slots_preserved', v_slots_preserved,
        'period_start', p_start_date,
        'period_end', p_end_date,
        'days_processed', v_days_processed,
        'tables_processed', v_tables_processed,
        'slot_duration_minutes', p_slot_duration_minutes,
        'logic_version', 'WORLD_CLASS_V1'
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

-- =====================================================
-- FUNCIÓN AUXILIAR PARA GENERAR SLOTS EN UN RANGO
-- =====================================================

CREATE OR REPLACE FUNCTION generate_slots_for_timerange(
    p_restaurant_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_duration_minutes integer,
    p_context text DEFAULT 'General'
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created_in_range integer := 0;
    v_table_record RECORD;
    v_existing_slot RECORD;
BEGIN
    RAISE NOTICE '   🎯 Generando slots para %: % a % (duración: %min)', 
        p_context, p_start_time, p_end_time, p_duration_minutes;
    
    -- Generar slots para cada mesa activa
    FOR v_table_record IN 
        SELECT * FROM tables 
        WHERE restaurant_id = p_restaurant_id AND is_active = true
    LOOP
        
        v_slot_start_time := p_start_time;
        
        -- LÓGICA CLAVE: La última reserva puede empezar hasta la hora de cierre
        WHILE v_slot_start_time <= p_end_time LOOP
            v_slot_end_time := v_slot_start_time + (p_duration_minutes || ' minutes')::interval;
            
            -- Verificar si ya existe slot con reserva (preservar)
            SELECT * INTO v_existing_slot
            FROM availability_slots a
            INNER JOIN reservations r ON r.table_id = a.table_id 
                AND r.reservation_date = a.slot_date 
                AND r.reservation_time = a.start_time
            WHERE a.restaurant_id = p_restaurant_id
            AND a.table_id = v_table_record.id
            AND a.slot_date = p_date
            AND a.start_time = v_slot_start_time
            AND r.status IN ('confirmed', 'pending');
            
            IF FOUND THEN
                -- Actualizar metadata del slot con reserva
                UPDATE availability_slots 
                SET 
                    metadata = jsonb_build_object(
                        'duration_minutes', p_duration_minutes,
                        'table_capacity', v_table_record.capacity,
                        'context', p_context,
                        'is_protected', true
                    ),
                    updated_at = NOW()
                WHERE restaurant_id = p_restaurant_id
                AND table_id = v_table_record.id
                AND slot_date = p_date
                AND start_time = v_slot_start_time;
                
            ELSE
                -- Crear nuevo slot disponible
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
                    p_date,
                    v_slot_start_time,
                    v_slot_end_time,
                    true,
                    jsonb_build_object(
                        'duration_minutes', p_duration_minutes,
                        'table_capacity', v_table_record.capacity,
                        'context', p_context,
                        'is_protected', false
                    ),
                    NOW()
                );
                
                v_slots_created_in_range := v_slots_created_in_range + 1;
            END IF;
            
            -- Avanzar al siguiente slot (cada 60 minutos por defecto)
            v_slot_start_time := v_slot_start_time + interval '60 minutes';
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE '   ✅ Creados % slots en rango % - %', 
        v_slots_created_in_range, p_start_time, p_end_time;
    
    RETURN v_slots_created_in_range;
END;
$$;

-- =====================================================
-- COMENTARIOS Y PERMISOS
-- =====================================================

COMMENT ON FUNCTION generate_availability_slots_world_class(uuid, date, date, integer) 
IS 'Función world-class para generar disponibilidades siguiendo la lógica definitiva: Calendario → Horario General → Turnos → Slots';

COMMENT ON FUNCTION generate_slots_for_timerange(uuid, date, time, time, integer, text) 
IS 'Función auxiliar para generar slots en un rango de tiempo específico';

-- =====================================================
-- FUNCIÓN DE PRUEBA RÁPIDA
-- =====================================================

/*
-- PRUEBA RÁPIDA:
SELECT generate_availability_slots_world_class(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 7,
    90
) as resultado;
*/

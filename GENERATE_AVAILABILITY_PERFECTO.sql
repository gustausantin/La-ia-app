-- =====================================================
-- FUNCIÓN PERFECTA DE GENERACIÓN DE DISPONIBILIDADES
-- Basada en el esquema real y algoritmo empresarial
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS generate_availability_slots CASCADE;

-- FUNCIÓN COMPLETA CON ESQUEMA REAL
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
    
    -- HORARIOS DEL DÍA
    v_day_shifts jsonb;
    v_shift_record jsonb;
    v_open_time time;
    v_close_time time;
    
    -- GENERACIÓN DE SLOTS
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created integer := 0;
    v_days_processed integer := 0;
    v_open_days integer := 0;
    
BEGIN
    RAISE NOTICE '🚀 INICIANDO GENERACIÓN PERFECTA DE DISPONIBILIDADES';
    RAISE NOTICE '📊 Restaurant: %, Período: % a %', p_restaurant_id, p_start_date, p_end_date;
    
    -- =====================================================
    -- PASO 1: OBTENER Y VALIDAR CONFIGURACIÓN DEL RESTAURANTE
    -- =====================================================
    SELECT 
        id, name, settings, active
    INTO v_restaurant_record
    FROM restaurants 
    WHERE id = p_restaurant_id AND active = true;
    
    IF v_restaurant_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurante no encontrado o inactivo',
            'slots_created', 0
        );
    END IF;
    
    v_settings := COALESCE(v_restaurant_record.settings, '{}'::jsonb);
    RAISE NOTICE '✅ Restaurante encontrado: %', v_restaurant_record.name;
    
    -- =====================================================
    -- PASO 2: EXTRAER POLÍTICAS DE RESERVA
    -- =====================================================
    v_reservation_policy := v_settings->'reservation_policy';
    
    IF v_reservation_policy IS NOT NULL THEN
        v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
        v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
        v_advance_booking_days := COALESCE((v_reservation_policy->>'advance_booking_days')::integer, 30);
    END IF;
    
    v_standard_duration := COALESCE(p_slot_duration_minutes, 
                                  (v_reservation_policy->>'reservation_duration')::integer, 90);
    
    RAISE NOTICE '📋 Políticas: Grupo %-%s personas, Duración %min, Horizonte %d días', 
        v_min_party_size, v_max_party_size, v_standard_duration, v_advance_booking_days;
    
    -- =====================================================
    -- PASO 3: VERIFICAR INVENTARIO DE MESAS
    -- =====================================================
    SELECT COUNT(*) INTO v_total_tables
    FROM tables 
    WHERE restaurant_id = p_restaurant_id 
    AND is_active = true
    AND capacity >= v_min_party_size;
    
    IF v_total_tables = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay mesas activas disponibles para el tamaño mínimo de grupo',
            'slots_created', 0
        );
    END IF;
    
    RAISE NOTICE '🪑 Mesas válidas encontradas: %', v_total_tables;
    
    -- =====================================================
    -- PASO 4: OBTENER HORARIOS OPERATIVOS
    -- =====================================================
    v_operating_hours := v_settings->'operating_hours';
    
    IF v_operating_hours IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay horarios operativos configurados. Ve a Configuración > Horarios',
            'slots_created', 0
        );
    END IF;
    
    RAISE NOTICE '⏰ Horarios operativos configurados correctamente';
    
    -- =====================================================
    -- PASO 5: CALCULAR HORIZONTE TEMPORAL
    -- =====================================================
    v_final_end_date := LEAST(p_end_date, CURRENT_DATE + (v_advance_booking_days || ' days')::interval);
    
    RAISE NOTICE '📅 Generando desde % hasta % (%d días)', 
        p_start_date, v_final_end_date, v_final_end_date - p_start_date + 1;
    
    -- =====================================================
    -- PASO 6: LIMPIAR SLOTS EXISTENTES
    -- =====================================================
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '🧹 Slots anteriores eliminados';
    
    -- =====================================================
    -- PASO 7: ALGORITMO PRINCIPAL - GENERAR DISPONIBILIDADES
    -- =====================================================
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_final_end_date LOOP
        v_days_processed := v_days_processed + 1;
        
        -- Obtener nombre del día y convertir a formato inglés
        v_day_name := LOWER(TRIM(TO_CHAR(v_current_date, 'Day')));
        v_day_name := CASE v_day_name
            WHEN 'lunes' THEN 'monday'
            WHEN 'martes' THEN 'tuesday'
            WHEN 'miércoles' THEN 'wednesday'
            WHEN 'miercoles' THEN 'wednesday'
            WHEN 'jueves' THEN 'thursday'
            WHEN 'viernes' THEN 'friday'
            WHEN 'sábado' THEN 'saturday'
            WHEN 'sabado' THEN 'saturday'
            WHEN 'domingo' THEN 'sunday'
            ELSE v_day_name -- Ya está en inglés
        END;
        
        -- Obtener configuración del día
        v_day_config := v_operating_hours->v_day_name;
        
        -- Verificar si el día está abierto
        v_is_open := false;
        IF v_day_config IS NOT NULL AND (v_day_config->>'open')::boolean = true THEN
            v_is_open := true;
        END IF;
        
        RAISE NOTICE '📅 % (%) - %', v_current_date, v_day_name, 
            CASE WHEN v_is_open THEN 'ABIERTO' ELSE 'CERRADO' END;
        
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
                -- Saltar "Horario Principal" si existe
                IF v_shift_record->>'name' = 'Horario Principal' THEN
                    CONTINUE;
                END IF;
                
                v_open_time := (v_shift_record->>'start_time')::time;
                v_close_time := (v_shift_record->>'end_time')::time;
                
                IF v_open_time IS NULL OR v_close_time IS NULL THEN
                    CONTINUE;
                END IF;
                
                RAISE NOTICE '⏰ Turno "%": %-%s', 
                    v_shift_record->>'name', v_open_time, v_close_time;
                
                -- Generar slots para cada mesa en este turno
                FOR v_table_record IN 
                    SELECT id, name, capacity, zone
                    FROM tables 
                    WHERE restaurant_id = p_restaurant_id 
                    AND is_active = true
                    AND capacity >= v_min_party_size
                    ORDER BY capacity, name
                LOOP
                    v_slot_start_time := v_open_time;
                    
                    -- Generar slots dentro del turno
                    WHILE v_slot_start_time < v_close_time LOOP
                        v_slot_end_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                        
                        -- Solo crear slot si cabe completamente en el turno
                        IF v_slot_end_time <= v_close_time THEN
                            -- Insertar slot usando el esquema real
                            INSERT INTO availability_slots (
                                restaurant_id, 
                                table_id, 
                                slot_date, 
                                start_time, 
                                end_time,
                                status,           -- Usar 'status' según esquema
                                source,
                                shift_name,
                                is_available,
                                metadata,
                                created_at
                            ) VALUES (
                                p_restaurant_id, 
                                v_table_record.id, 
                                v_current_date, 
                                v_slot_start_time, 
                                v_slot_end_time,
                                'free',          -- Estado inicial
                                'system',        -- Generado por sistema
                                v_shift_record->>'name',
                                true,            -- Disponible inicialmente
                                jsonb_build_object(
                                    'table_capacity', v_table_record.capacity,
                                    'min_party_size', v_min_party_size,
                                    'max_party_size', LEAST(v_max_party_size, v_table_record.capacity),
                                    'duration_minutes', v_standard_duration,
                                    'zone', v_table_record.zone
                                ),
                                NOW()
                            );
                            
                            v_slots_created := v_slots_created + 1;
                        END IF;
                        
                        -- Avanzar al siguiente slot
                        v_slot_start_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
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
                ORDER BY capacity, name
            LOOP
                v_slot_start_time := v_open_time;
                
                WHILE v_slot_start_time < v_close_time LOOP
                    v_slot_end_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                    
                    IF v_slot_end_time <= v_close_time THEN
                        -- Insertar slot
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
                                'table_capacity', v_table_record.capacity,
                                'min_party_size', v_min_party_size,
                                'max_party_size', LEAST(v_max_party_size, v_table_record.capacity),
                                'duration_minutes', v_standard_duration,
                                'zone', v_table_record.zone
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
    
    -- =====================================================
    -- RESULTADO FINAL
    -- =====================================================
    RAISE NOTICE '🎯 GENERACIÓN COMPLETADA:';
    RAISE NOTICE '   📊 Total slots: %', v_slots_created;
    RAISE NOTICE '   📅 Días procesados: %', v_days_processed;
    RAISE NOTICE '   ✅ Días abiertos: %', v_open_days;
    RAISE NOTICE '   🪑 Mesas utilizadas: %', v_total_tables;
    
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'algorithm_summary', jsonb_build_object(
            'days_processed', v_days_processed,
            'open_days', v_open_days,
            'total_tables', v_total_tables,
            'min_party_size', v_min_party_size,
            'max_party_size', v_max_party_size,
            'standard_duration', v_standard_duration,
            'advance_booking_days', v_advance_booking_days,
            'date_range', jsonb_build_object(
                'start', p_start_date,
                'end', v_final_end_date
            )
        ),
        'message', format('✅ Algoritmo completo: %s slots generados para %s mesas en %s días abiertos', 
            v_slots_created, v_total_tables, v_open_days)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en generación: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'slots_created', 0
        );
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION generate_availability_slots TO authenticated;
GRANT EXECUTE ON FUNCTION generate_availability_slots TO anon;

-- =====================================================
-- PRUEBA INMEDIATA CON CASA LOLITA
-- =====================================================
SELECT generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 7,
    90
) as resultado_perfecto;

-- Verificación completa
SELECT 
    '🎯 RESULTADO FINAL' as titulo,
    COUNT(*) as total_slots_generados,
    COUNT(DISTINCT slot_date) as dias_con_disponibilidad,
    COUNT(DISTINCT table_id) as mesas_utilizadas,
    MIN(slot_date) as fecha_inicio,
    MAX(slot_date) as fecha_fin,
    MIN(start_time) as primera_hora,
    MAX(end_time) as ultima_hora,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60)::integer as duracion_promedio_min
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date >= CURRENT_DATE;

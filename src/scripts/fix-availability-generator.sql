-- ========================================
-- REPARAR GENERADOR DE DISPONIBILIDADES
-- Fecha: 19 Septiembre 2025
-- Descripción: Recrear función generate_availability_slots que está dando error 400
-- ========================================

-- 1. ELIMINAR FUNCIÓN EXISTENTE SI EXISTE
-- ========================================
DROP FUNCTION IF EXISTS generate_availability_slots(UUID, DATE, DATE);

-- 2. RECREAR FUNCIÓN CON VALIDACIONES ROBUSTAS
-- ========================================
CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_restaurant RECORD;
    v_settings JSONB;
    v_operating_hours JSONB;
    v_day_key TEXT;
    v_day_data JSONB;
    v_is_open BOOLEAN;
    v_start_time TIME;
    v_end_time TIME;
    v_current_date DATE;
    v_end_date DATE;
    v_slots_created INTEGER := 0;
    v_result JSONB;
    v_duration INTEGER := 90; -- Duración por defecto en minutos
BEGIN
    -- Validar parámetros de entrada
    IF p_restaurant_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'restaurant_id es requerido',
            'slots_created', 0
        );
    END IF;

    IF p_start_date IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'start_date es requerido',
            'slots_created', 0
        );
    END IF;

    -- Establecer fecha de fin por defecto (30 días)
    v_end_date := COALESCE(p_end_date, p_start_date + INTERVAL '30 days');

    -- Obtener información del restaurante
    SELECT * INTO v_restaurant
    FROM restaurants 
    WHERE id = p_restaurant_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Restaurante no encontrado',
            'slots_created', 0
        );
    END IF;

    -- Obtener configuración del restaurante
    v_settings := COALESCE(v_restaurant.settings, '{}'::jsonb);
    v_operating_hours := COALESCE(v_settings->'operating_hours', '{}'::jsonb);
    
    -- Obtener duración de reserva
    v_duration := COALESCE((v_settings->>'reservation_duration')::integer, 90);

    -- Eliminar slots existentes en el rango de fechas
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND date_slot BETWEEN p_start_date AND v_end_date;

    -- Generar slots para cada día
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_end_date LOOP
        -- Obtener el día de la semana
        v_day_key := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;

        -- Obtener configuración para este día
        v_day_data := v_operating_hours->v_day_key;
        
        IF v_day_data IS NOT NULL THEN
            -- Verificar si está abierto
            v_is_open := COALESCE((v_day_data->>'open')::boolean, false);
            
            IF v_is_open THEN
                -- Obtener horarios
                BEGIN
                    v_start_time := COALESCE((v_day_data->>'start')::time, (v_day_data->>'start_time')::time, '09:00'::time);
                    v_end_time := COALESCE((v_day_data->>'end')::time, (v_day_data->>'end_time')::time, '22:00'::time);
                EXCEPTION WHEN OTHERS THEN
                    -- Si hay error parseando las horas, usar valores por defecto
                    v_start_time := '09:00'::time;
                    v_end_time := '22:00'::time;
                END;

                -- Generar slots para este día
                DECLARE
                    v_current_time TIME;
                    v_slot_end_time TIME;
                BEGIN
                    v_current_time := v_start_time;
                    
                    WHILE v_current_time < v_end_time LOOP
                        v_slot_end_time := v_current_time + (v_duration || ' minutes')::interval;
                        
                        -- Solo crear slot si termina antes del cierre
                        IF v_slot_end_time <= v_end_time THEN
                            INSERT INTO availability_slots (
                                restaurant_id,
                                date_slot,
                                time_slot,
                                duration_minutes,
                                is_available,
                                created_at
                            ) VALUES (
                                p_restaurant_id,
                                v_current_date,
                                v_current_time,
                                v_duration,
                                true,
                                NOW()
                            );
                            
                            v_slots_created := v_slots_created + 1;
                        END IF;
                        
                        -- Avanzar al siguiente slot
                        v_current_time := v_current_time + (v_duration || ' minutes')::interval;
                    END LOOP;
                END;
            END IF;
        END IF;
        
        -- Siguiente día
        v_current_date := v_current_date + 1;
    END LOOP;

    -- Construir resultado
    v_result := json_build_object(
        'success', true,
        'message', 'Disponibilidades generadas correctamente',
        'slots_created', v_slots_created,
        'date_range', json_build_object(
            'start', p_start_date,
            'end', v_end_date
        ),
        'restaurant_id', p_restaurant_id,
        'duration_minutes', v_duration
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Manejo de errores robusto
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'slots_created', v_slots_created
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. COMENTARIOS Y PERMISOS
-- ========================================
COMMENT ON FUNCTION generate_availability_slots(UUID, DATE, DATE) IS 'Genera slots de disponibilidad para un restaurante en un rango de fechas';

-- 4. PROBAR LA FUNCIÓN
-- ========================================
-- Descomenta para probar:
/*
SELECT generate_availability_slots(
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days'
);
*/

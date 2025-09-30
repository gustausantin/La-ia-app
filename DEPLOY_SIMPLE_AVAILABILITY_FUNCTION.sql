-- ========================================
-- DESPLEGAR FUNCIÓN DE DISPONIBILIDADES SIMPLIFICADA
-- Fecha: 30 Septiembre 2025
-- Descripción: Función que usa SOLO operating_hours (sin turnos)
-- ========================================

-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR

-- 1. ELIMINAR FUNCIÓN EXISTENTE SI EXISTE
-- ========================================
DROP FUNCTION IF EXISTS generate_availability_slots_simple(UUID, DATE, DATE);

-- 2. CREAR FUNCIÓN SIMPLIFICADA
-- ========================================
CREATE OR REPLACE FUNCTION generate_availability_slots_simple(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_restaurant RECORD;
    v_settings JSONB;
    v_operating_hours JSONB;
    v_reservation_duration INTEGER;
    v_current_date DATE;
    v_day_name TEXT;
    v_day_hours JSONB;
    v_open_time TIME;
    v_close_time TIME;
    v_current_time TIME;
    v_slots_created INTEGER := 0;
    v_slots_updated INTEGER := 0;
    v_end_date DATE;
BEGIN
    -- Validar parámetros
    IF p_restaurant_id IS NULL THEN
        RETURN json_build_object('error', 'Restaurant ID is required');
    END IF;
    
    IF p_start_date IS NULL THEN
        RETURN json_build_object('error', 'Start date is required');
    END IF;
    
    -- Establecer fecha final (por defecto 30 días)
    v_end_date := COALESCE(p_end_date, p_start_date + INTERVAL '30 days');
    
    -- Obtener configuración del restaurante
    SELECT * INTO v_restaurant 
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Restaurant not found');
    END IF;
    
    v_settings := v_restaurant.settings;
    v_operating_hours := v_settings->'operating_hours';
    v_reservation_duration := COALESCE((v_settings->>'reservation_duration')::INTEGER, 90);
    
    -- Verificar que existan horarios
    IF v_operating_hours IS NULL THEN
        RETURN json_build_object('error', 'No operating hours configured');
    END IF;
    
    -- Generar slots para cada día
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_end_date LOOP
        -- Obtener nombre del día en inglés
        v_day_name := LOWER(TO_CHAR(v_current_date, 'Day'));
        v_day_name := TRIM(v_day_name);
        
        -- Convertir nombres de días al formato usado en operating_hours
        CASE v_day_name
            WHEN 'monday' THEN v_day_name := 'monday';
            WHEN 'tuesday' THEN v_day_name := 'tuesday';
            WHEN 'wednesday' THEN v_day_name := 'wednesday';
            WHEN 'thursday' THEN v_day_name := 'thursday';
            WHEN 'friday' THEN v_day_name := 'friday';
            WHEN 'saturday' THEN v_day_name := 'saturday';
            WHEN 'sunday' THEN v_day_name := 'sunday';
        END CASE;
        
        -- Obtener horarios del día
        v_day_hours := v_operating_hours->v_day_name;
        
        -- Verificar si el día está abierto (NO closed)
        IF v_day_hours IS NOT NULL AND NOT COALESCE((v_day_hours->>'closed')::BOOLEAN, false) THEN
            v_open_time := (v_day_hours->>'open')::TIME;
            v_close_time := (v_day_hours->>'close')::TIME;
            
            -- Generar slots para este día
            v_current_time := v_open_time;
            
            WHILE v_current_time + (v_reservation_duration || ' minutes')::INTERVAL <= v_close_time LOOP
                -- Insertar o actualizar slot
                INSERT INTO availability_slots (
                    restaurant_id,
                    slot_date,
                    slot_time,
                    duration_minutes,
                    is_available,
                    created_at,
                    updated_at
                ) VALUES (
                    p_restaurant_id,
                    v_current_date,
                    v_current_time,
                    v_reservation_duration,
                    true,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (restaurant_id, slot_date, slot_time) 
                DO UPDATE SET
                    duration_minutes = EXCLUDED.duration_minutes,
                    updated_at = NOW()
                WHERE availability_slots.is_available = true; -- Solo actualizar si sigue disponible
                
                IF FOUND THEN
                    v_slots_updated := v_slots_updated + 1;
                ELSE
                    v_slots_created := v_slots_created + 1;
                END IF;
                
                -- Avanzar al siguiente slot
                v_current_time := v_current_time + (v_reservation_duration || ' minutes')::INTERVAL;
            END LOOP;
        END IF;
        
        -- Siguiente día
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'slots_updated', v_slots_updated,
        'date_range', json_build_object(
            'start', p_start_date,
            'end', v_end_date
        ),
        'duration_minutes', v_reservation_duration
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', 'Database error: ' || SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. COMENTARIOS Y PERMISOS
-- ========================================
COMMENT ON FUNCTION generate_availability_slots_simple(UUID, DATE, DATE) IS 
'Genera slots de disponibilidad usando SOLO operating_hours (sin turnos). Versión simplificada.';

-- ========================================
-- INSTRUCCIONES DE USO:
-- ========================================
-- 1. Copia todo este código
-- 2. Ve a Supabase Dashboard > SQL Editor
-- 3. Pega el código y ejecuta
-- 4. La función estará disponible inmediatamente
-- 
-- Ejemplo de prueba:
-- SELECT generate_availability_slots_simple('tu-restaurant-uuid'::UUID, '2025-09-30'::DATE, '2025-10-30'::DATE);

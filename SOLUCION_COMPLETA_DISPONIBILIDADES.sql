-- ============================================
-- SOLUCIÓN COMPLETA SISTEMA DE DISPONIBILIDADES
-- Fecha: 30 Septiembre 2025
-- Versión: 1.0 DEFINITIVA
-- ============================================

-- PRIMERO: LIMPIAR TODO LO ANTERIOR
-- ============================================
DROP FUNCTION IF EXISTS generate_availability_slots_simple CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots CASCADE;
DROP FUNCTION IF EXISTS borrar_disponibilidades_simple CASCADE;
DROP FUNCTION IF EXISTS cleanup_and_regenerate_availability CASCADE;
DROP FUNCTION IF EXISTS regenerate_availability_smart CASCADE;

-- ============================================
-- TABLA: availability_slots (si no existe)
-- ============================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    max_party_size INTEGER DEFAULT 8,
    reserved_by UUID REFERENCES customers(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, slot_date, slot_time, table_id)
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_availability_restaurant_date 
ON availability_slots(restaurant_id, slot_date);

CREATE INDEX IF NOT EXISTS idx_availability_available 
ON availability_slots(is_available);

-- ============================================
-- FUNCIÓN 1: GENERAR DISPONIBILIDADES
-- ============================================
CREATE OR REPLACE FUNCTION generate_availability_slots_simple(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant RECORD;
    v_settings JSONB;
    v_operating_hours JSONB;
    v_reservation_duration INTEGER;
    v_max_party_size INTEGER;
    v_min_party_size INTEGER;
    v_advance_days INTEGER;
    v_min_hours INTEGER;
    v_current_date DATE;
    v_day_name TEXT;
    v_day_hours JSONB;
    v_open_time TIME;
    v_close_time TIME;
    v_current_time TIME;
    v_slots_created INTEGER := 0;
    v_slots_skipped INTEGER := 0;
    v_days_processed INTEGER := 0;
    v_days_closed INTEGER := 0;
    v_end_date_calc DATE;
    v_table_count INTEGER;
    v_special_event RECORD;
    v_table RECORD;  -- Variable para el loop de mesas
BEGIN
    -- 1. VALIDACIONES INICIALES
    IF p_restaurant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurant ID es requerido'
        );
    END IF;
    
    -- 2. OBTENER CONFIGURACIÓN DEL RESTAURANTE
    SELECT * INTO v_restaurant 
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurant no encontrado'
        );
    END IF;
    
    -- 3. EXTRAER CONFIGURACIÓN
    v_settings := COALESCE(v_restaurant.settings, '{}'::jsonb);
    v_operating_hours := v_settings->'operating_hours';
    
    -- Política de reservas con valores por defecto
    v_reservation_duration := COALESCE((v_settings->>'reservation_duration')::INTEGER, 90);
    v_max_party_size := COALESCE((v_settings->>'max_party_size')::INTEGER, 12);
    v_min_party_size := COALESCE((v_settings->>'min_party_size')::INTEGER, 1);
    v_advance_days := COALESCE((v_settings->>'advance_booking_days')::INTEGER, 30);
    v_min_hours := COALESCE((v_settings->>'min_advance_hours')::INTEGER, 2);
    
    -- 4. CALCULAR RANGO DE FECHAS
    v_end_date_calc := COALESCE(p_end_date, p_start_date + (v_advance_days || ' days')::INTERVAL);
    
    -- Validar que no exceeda el máximo de antelación
    IF v_end_date_calc > p_start_date + (v_advance_days || ' days')::INTERVAL THEN
        v_end_date_calc := p_start_date + (v_advance_days || ' days')::INTERVAL;
    END IF;
    
    -- 5. VERIFICAR MESAS DISPONIBLES
    SELECT COUNT(*) INTO v_table_count
    FROM tables
    WHERE restaurant_id = p_restaurant_id
    AND is_active = true;
    
    IF v_table_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay mesas activas configuradas',
            'message', 'Configure al menos una mesa antes de generar disponibilidades'
        );
    END IF;
    
    -- 6. VERIFICAR HORARIOS
    IF v_operating_hours IS NULL THEN
        -- Crear horarios por defecto si no existen
        v_operating_hours := jsonb_build_object(
            'monday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
            'tuesday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
            'wednesday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
            'thursday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
            'friday', jsonb_build_object('open', '09:00', 'close', '23:00', 'closed', false),
            'saturday', jsonb_build_object('open', '09:00', 'close', '23:00', 'closed', false),
            'sunday', jsonb_build_object('open', '10:00', 'close', '22:00', 'closed', false)
        );
        
        -- Guardar horarios por defecto
        UPDATE restaurants 
        SET settings = v_settings || jsonb_build_object('operating_hours', v_operating_hours)
        WHERE id = p_restaurant_id;
    END IF;
    
    -- 7. GENERAR SLOTS PARA CADA DÍA
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_end_date_calc LOOP
        v_days_processed := v_days_processed + 1;
        
        -- Verificar eventos especiales (días cerrados)
        SELECT * INTO v_special_event
        FROM special_events
        WHERE restaurant_id = p_restaurant_id
        AND event_date = v_current_date
        AND is_closed = true
        LIMIT 1;
        
        IF FOUND THEN
            -- Día cerrado por evento especial
            v_days_closed := v_days_closed + 1;
            v_current_date := v_current_date + INTERVAL '1 day';
            CONTINUE;
        END IF;
        
        -- Obtener nombre del día
        v_day_name := LOWER(TRIM(TO_CHAR(v_current_date, 'fmday')));
        
        -- Obtener horario del día
        v_day_hours := v_operating_hours->v_day_name;
        
        -- Verificar si el día está abierto
        IF v_day_hours IS NOT NULL AND NOT COALESCE((v_day_hours->>'closed')::BOOLEAN, false) THEN
            v_open_time := (v_day_hours->>'open')::TIME;
            v_close_time := (v_day_hours->>'close')::TIME;
            
            -- Validar horarios
            IF v_open_time IS NULL OR v_close_time IS NULL THEN
                v_days_closed := v_days_closed + 1;
                v_current_date := v_current_date + INTERVAL '1 day';
                CONTINUE;
            END IF;
            
            -- Generar slots para cada mesa activa
            FOR v_table IN 
                SELECT id, table_number, capacity 
                FROM tables 
                WHERE restaurant_id = p_restaurant_id 
                AND is_active = true
            LOOP
                v_current_time := v_open_time;
                
                -- Generar slots respetando la duración de reserva
                WHILE v_current_time + (v_reservation_duration || ' minutes')::INTERVAL <= v_close_time LOOP
                    -- Verificar si ya existe un slot ocupado
                    IF NOT EXISTS (
                        SELECT 1 FROM availability_slots
                        WHERE restaurant_id = p_restaurant_id
                        AND slot_date = v_current_date
                        AND slot_time = v_current_time
                        AND table_id = v_table.id
                        AND is_available = false
                    ) THEN
                        -- Insertar o actualizar slot
                        INSERT INTO availability_slots (
                            restaurant_id,
                            slot_date,
                            slot_time,
                            duration_minutes,
                            table_id,
                            is_available,
                            max_party_size,
                            created_at,
                            updated_at
                        ) VALUES (
                            p_restaurant_id,
                            v_current_date,
                            v_current_time,
                            v_reservation_duration,
                            v_table.id,
                            true,
                            v_table.capacity,
                            NOW(),
                            NOW()
                        )
                        ON CONFLICT (restaurant_id, slot_date, slot_time, table_id) 
                        DO UPDATE SET
                            duration_minutes = EXCLUDED.duration_minutes,
                            max_party_size = EXCLUDED.max_party_size,
                            updated_at = NOW()
                        WHERE availability_slots.is_available = true;
                        
                        v_slots_created := v_slots_created + 1;
                    ELSE
                        v_slots_skipped := v_slots_skipped + 1;
                    END IF;
                    
                    -- Avanzar al siguiente slot
                    v_current_time := v_current_time + (v_reservation_duration || ' minutes')::INTERVAL;
                END LOOP;
            END LOOP;
        ELSE
            v_days_closed := v_days_closed + 1;
        END IF;
        
        -- Siguiente día
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    -- 8. RETORNAR RESULTADO EXITOSO
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Disponibilidades generadas correctamente',
        'stats', jsonb_build_object(
            'slots_created', v_slots_created,
            'slots_skipped', v_slots_skipped,
            'days_processed', v_days_processed,
            'days_closed', v_days_closed,
            'table_count', v_table_count
        ),
        'config', jsonb_build_object(
            'duration_minutes', v_reservation_duration,
            'max_party_size', v_max_party_size,
            'min_party_size', v_min_party_size,
            'advance_days', v_advance_days
        ),
        'date_range', jsonb_build_object(
            'start', p_start_date,
            'end', v_end_date_calc
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Error en la base de datos',
        'detail', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

-- ============================================
-- FUNCIÓN 2: BORRAR DISPONIBILIDADES
-- ============================================
CREATE OR REPLACE FUNCTION borrar_disponibilidades_simple(
    p_restaurant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slots_before INTEGER;
    v_slots_deleted INTEGER;
    v_slots_preserved INTEGER;
    v_slots_after INTEGER;
BEGIN
    -- Contar slots antes
    SELECT COUNT(*) INTO v_slots_before
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id;
    
    -- Contar slots ocupados (a preservar)
    SELECT COUNT(*) INTO v_slots_preserved
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND is_available = false;
    
    -- Borrar solo slots disponibles
    DELETE FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND is_available = true;
    
    GET DIAGNOSTICS v_slots_deleted = ROW_COUNT;
    
    -- Contar slots después
    SELECT COUNT(*) INTO v_slots_after
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Disponibilidades borradas correctamente',
        'slots_before', v_slots_before,
        'slots_deleted', v_slots_deleted,
        'slots_preserved', v_slots_preserved,
        'slots_after', v_slots_after
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

-- ============================================
-- FUNCIÓN 3: LIMPIAR Y REGENERAR
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_and_regenerate_availability(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cleanup_result JSONB;
    v_generate_result JSONB;
BEGIN
    -- Primero borrar disponibilidades
    v_cleanup_result := borrar_disponibilidades_simple(p_restaurant_id);
    
    -- Si el borrado fue exitoso, regenerar
    IF (v_cleanup_result->>'success')::boolean THEN
        v_generate_result := generate_availability_slots_simple(
            p_restaurant_id, 
            p_start_date, 
            p_end_date
        );
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Disponibilidades regeneradas correctamente',
            'cleanup', v_cleanup_result,
            'generation', v_generate_result
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Error al limpiar disponibilidades',
            'detail', v_cleanup_result
        );
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

-- ============================================
-- FUNCIÓN 4: OBTENER DISPONIBILIDAD POR FECHA
-- ============================================
CREATE OR REPLACE FUNCTION get_availability_for_date(
    p_restaurant_id UUID,
    p_date DATE
)
RETURNS TABLE(
    slot_time TIME,
    table_id UUID,
    table_name TEXT,
    table_capacity INTEGER,
    is_available BOOLEAN,
    reserved_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.slot_time,
        a.table_id,
        t.name AS table_name,
        t.capacity AS table_capacity,
        a.is_available,
        c.name AS reserved_by_name
    FROM availability_slots a
    LEFT JOIN tables t ON a.table_id = t.id
    LEFT JOIN customers c ON a.reserved_by = c.id
    WHERE a.restaurant_id = p_restaurant_id
    AND a.slot_date = p_date
    ORDER BY a.slot_time, t.table_number;
END;
$$;

-- ============================================
-- FUNCIÓN 5: MARCAR SLOT COMO RESERVADO
-- ============================================
CREATE OR REPLACE FUNCTION mark_slot_as_reserved(
    p_restaurant_id UUID,
    p_date DATE,
    p_time TIME,
    p_table_id UUID,
    p_customer_id UUID,
    p_reservation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE availability_slots
    SET 
        is_available = false,
        reserved_by = p_customer_id,
        reservation_id = p_reservation_id,
        updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
    AND slot_date = p_date
    AND slot_time = p_time
    AND table_id = p_table_id
    AND is_available = true;
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Slot marcado como reservado'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Slot no disponible o no encontrado'
        );
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- ============================================
-- FUNCIÓN 6: LIBERAR SLOT
-- ============================================
CREATE OR REPLACE FUNCTION release_slot(
    p_restaurant_id UUID,
    p_date DATE,
    p_time TIME,
    p_table_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE availability_slots
    SET 
        is_available = true,
        reserved_by = NULL,
        reservation_id = NULL,
        updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
    AND slot_date = p_date
    AND slot_time = p_time
    AND table_id = p_table_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Slot liberado correctamente'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Slot no encontrado'
        );
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- ============================================
-- PERMISOS
-- ============================================
GRANT EXECUTE ON FUNCTION generate_availability_slots_simple TO authenticated;
GRANT EXECUTE ON FUNCTION borrar_disponibilidades_simple TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_and_regenerate_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_availability_for_date TO authenticated;
GRANT EXECUTE ON FUNCTION mark_slot_as_reserved TO authenticated;
GRANT EXECUTE ON FUNCTION release_slot TO authenticated;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON FUNCTION generate_availability_slots_simple IS 'Genera slots de disponibilidad basándose en la política de reservas y horarios del restaurante';
COMMENT ON FUNCTION borrar_disponibilidades_simple IS 'Elimina slots disponibles preservando los ocupados';
COMMENT ON FUNCTION cleanup_and_regenerate_availability IS 'Limpia y regenera toda la disponibilidad';
COMMENT ON FUNCTION get_availability_for_date IS 'Obtiene la disponibilidad para una fecha específica';
COMMENT ON FUNCTION mark_slot_as_reserved IS 'Marca un slot como reservado';
COMMENT ON FUNCTION release_slot IS 'Libera un slot previamente reservado';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

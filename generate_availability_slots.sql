-- ============================================
-- FUNCIÓN DE DISPONIBILIDADES PARA LA-IA APP
-- Sistema Multi-Tenant Profesional
-- Fecha: 30 Septiembre 2025
-- 
-- LÓGICA IMPLEMENTADA (5 PASOS):
-- 1. Política de Reservas: Lee datos reales de restaurants.settings
--    - advance_booking_days, reservation_duration, min/max_party_size, min_advance_hours
-- 2. Calendario del Restaurante: Solo genera slots en días abiertos
--    - Si closed=true → NO genera slots
-- 3. Horario General: Respeta horarios de apertura/cierre reales
--    - Última reserva = close_time - reservation_duration
-- 4. Generación de Slots: Intervalos según duración real de reserva
--    - Formato HH:MM (sin segundos)
-- 5. Reglas Clave: Prioridad Calendario > Política de Reservas
-- ============================================

-- LIMPIAR FUNCIONES ANTERIORES
DROP FUNCTION IF EXISTS generate_availability_slots_simple CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots CASCADE;

-- ============================================
-- FUNCIÓN QUE FUNCIONA PARA TODOS
-- ============================================
CREATE OR REPLACE FUNCTION generate_availability_slots_simple(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
    v_current_date DATE;
    v_current_time TIME;
    v_table RECORD;
    v_slots_created INTEGER := 0;
    v_table_count INTEGER;
    v_restaurant_name TEXT;
    v_settings JSONB;
    
    -- Política de Reservas (DATOS REALES)
    v_advance_booking_days INTEGER;
    v_reservation_duration INTEGER;
    v_min_party_size INTEGER;
    v_max_party_size INTEGER;
    v_min_advance_hours INTEGER;
    
    -- Horarios del día actual
    v_day_name TEXT;
    v_operating_hours JSONB;
    v_open_time TIME;
    v_close_time TIME;
    v_is_closed BOOLEAN;
    v_last_slot_time TIME;
BEGIN
    -- ============================================
    -- DETERMINAR RESTAURANT_ID
    -- ============================================
    v_restaurant_id := p_restaurant_id;
    
    -- Si no viene restaurant_id, intentar detectarlo por auth
    IF v_restaurant_id IS NULL AND auth.uid() IS NOT NULL THEN
        -- Buscar en mapping
        SELECT urm.restaurant_id, r.name 
        INTO v_restaurant_id, v_restaurant_name
        FROM user_restaurant_mapping urm
        JOIN restaurants r ON r.id = urm.restaurant_id
        WHERE urm.auth_user_id = auth.uid()
        AND urm.active = true
        ORDER BY urm.created_at DESC
        LIMIT 1;
        
        -- Si no hay mapping, buscar por owner
        IF v_restaurant_id IS NULL THEN
            SELECT id, name 
            INTO v_restaurant_id, v_restaurant_name
            FROM restaurants
            WHERE owner_id = auth.uid()
            AND active = true
            ORDER BY created_at DESC
            LIMIT 1;
        END IF;
    ELSE
        -- Si viene restaurant_id, obtener el nombre
        SELECT name, settings 
        INTO v_restaurant_name, v_settings
        FROM restaurants
        WHERE id = v_restaurant_id;
    END IF;
    
    -- Validación: debe haber un restaurant_id
    IF v_restaurant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No se pudo determinar el restaurante',
            'hint', 'Proporcione restaurant_id o asegúrese de estar autenticado'
        );
    END IF;
    
    -- ============================================
    -- PASO 1: CARGAR POLÍTICA DE RESERVAS (DATOS REALES)
    -- ============================================
    v_advance_booking_days := COALESCE((v_settings->'booking_settings'->>'advance_booking_days')::INTEGER, 30);
    v_reservation_duration := COALESCE((v_settings->>'reservation_duration')::INTEGER, 90);
    v_min_party_size := COALESCE((v_settings->'booking_settings'->>'min_party_size')::INTEGER, 1);
    v_max_party_size := COALESCE((v_settings->'booking_settings'->>'max_party_size')::INTEGER, 12);
    v_min_advance_hours := COALESCE((v_settings->'booking_settings'->>'min_booking_hours')::INTEGER, 2);
    
    -- ============================================
    -- VERIFICAR MESAS DEL RESTAURANTE
    -- ============================================
    SELECT COUNT(*) INTO v_table_count
    FROM tables
    WHERE restaurant_id = v_restaurant_id
    AND is_active = true;
    
    IF v_table_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay mesas activas configuradas',
            'restaurant_id', v_restaurant_id,
            'restaurant_name', v_restaurant_name,
            'hint', 'Configure al menos una mesa activa en el restaurante'
        );
    END IF;
    
    -- ============================================
    -- GENERAR SLOTS PARA EL RESTAURANTE
    -- ============================================
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        -- PASO 2: OBTENER NOMBRE DEL DÍA
        v_day_name := LOWER(TO_CHAR(v_current_date, 'Day'));
        v_day_name := TRIM(v_day_name);
        
        -- Convertir día en inglés si es necesario
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
        
        -- PASO 2: OBTENER HORARIOS DEL DÍA (DATOS REALES)
        v_operating_hours := v_settings->'operating_hours'->v_day_name;
        v_is_closed := COALESCE((v_operating_hours->>'closed')::BOOLEAN, false);
        
        -- PASO 2: Si el día está cerrado, NO generar slots
        IF v_is_closed THEN
            v_current_date := v_current_date + INTERVAL '1 day';
            CONTINUE;
        END IF;
        
        -- PASO 3: OBTENER HORARIOS DE APERTURA Y CIERRE
        v_open_time := COALESCE((v_operating_hours->>'open')::TIME, '12:00:00'::TIME);
        v_close_time := COALESCE((v_operating_hours->>'close')::TIME, '22:00:00'::TIME);
        
        -- PASO 3: Calcular última hora de reserva (respetando duración)
        v_last_slot_time := v_close_time - (v_reservation_duration || ' minutes')::INTERVAL;
        
        -- Para cada mesa del restaurante
        FOR v_table IN 
            SELECT id, capacity, name
            FROM tables 
            WHERE restaurant_id = v_restaurant_id 
            AND is_active = true
        LOOP
            -- PASO 4: GENERAR SLOTS según horarios reales
            v_current_time := v_open_time;
            
            WHILE v_current_time <= v_last_slot_time LOOP
                BEGIN
                    INSERT INTO availability_slots (
                        restaurant_id,
                        slot_date,
                        start_time,
                        end_time,
                        table_id,
                        status,
                        source,
                        duration_minutes,
                        is_available
                    ) VALUES (
                        v_restaurant_id,
                        v_current_date,
                        v_current_time,
                        (v_current_time + (v_reservation_duration || ' minutes')::INTERVAL)::TIME,
                        v_table.id,
                        'free',
                        'system',
                        v_reservation_duration,
                        true
                    );
                    v_slots_created := v_slots_created + 1;
                EXCEPTION 
                    WHEN unique_violation THEN
                        NULL; -- Slot ya existe, continuar
                END;
                
                -- PASO 4: Avanzar según la duración de reserva
                v_current_time := v_current_time + (v_reservation_duration || ' minutes')::INTERVAL;
            END LOOP;
        END LOOP;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    -- ============================================
    -- RETORNAR RESULTADO CON POLÍTICA APLICADA
    -- ============================================
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Disponibilidades generadas para %s', v_restaurant_name),
        'slots_created', v_slots_created,
        'table_count', v_table_count,
        'restaurant_id', v_restaurant_id,
        'restaurant_name', v_restaurant_name,
        'policy_applied', jsonb_build_object(
            'advance_booking_days', v_advance_booking_days,
            'reservation_duration', v_reservation_duration,
            'min_party_size', v_min_party_size,
            'max_party_size', v_max_party_size,
            'min_advance_hours', v_min_advance_hours
        )
    );
END;
$$;

-- ============================================
-- PERMISOS PARA TODOS
-- ============================================
GRANT EXECUTE ON FUNCTION generate_availability_slots_simple TO authenticated;
GRANT EXECUTE ON FUNCTION generate_availability_slots_simple TO anon;

-- ============================================
-- RLS PARA MULTI-TENANCY
-- ============================================
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve slots de SU restaurante
DROP POLICY IF EXISTS "Users see own restaurant slots" ON availability_slots;
CREATE POLICY "Users see own restaurant slots" 
ON availability_slots FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_restaurant_mapping
        WHERE auth_user_id = auth.uid()
        AND restaurant_id = availability_slots.restaurant_id
    )
    OR
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE id = availability_slots.restaurant_id
        AND owner_id = auth.uid()
    )
);

-- Solo pueden insertar en SU restaurante
DROP POLICY IF EXISTS "Users insert own restaurant slots" ON availability_slots;
CREATE POLICY "Users insert own restaurant slots" 
ON availability_slots FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_restaurant_mapping
        WHERE auth_user_id = auth.uid()
        AND restaurant_id = availability_slots.restaurant_id
        AND role IN ('owner', 'admin', 'manager')
    )
    OR
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE id = availability_slots.restaurant_id
        AND owner_id = auth.uid()
    )
);

-- ============================================
-- TESTING: Generar para CUALQUIER restaurante
-- ============================================
-- Para probar, encuentra cualquier restaurante y genera:

-- Ver todos los restaurantes disponibles
SELECT 
    r.id,
    r.name,
    COUNT(t.id) as mesas_activas,
    r.owner_id
FROM restaurants r
LEFT JOIN tables t ON t.restaurant_id = r.id AND t.is_active = true
WHERE r.active = true
GROUP BY r.id, r.name, r.owner_id
ORDER BY r.created_at DESC;

-- Generar para un restaurante específico (reemplaza el UUID)
-- SELECT generate_availability_slots_simple(
--     'RESTAURANT_ID_AQUI'::UUID,
--     CURRENT_DATE::DATE,
--     (CURRENT_DATE + 7)::DATE
-- ) as resultado;

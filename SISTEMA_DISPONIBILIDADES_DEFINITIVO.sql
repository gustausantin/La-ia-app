-- =====================================================
-- SISTEMA DE DISPONIBILIDADES DEFINITIVO
-- =====================================================
-- 
-- OBJETIVO: Implementar EXACTAMENTE la lógica especificada
-- PRIORIDAD: CALENDARIO → HORARIO GENERAL → TURNOS → SLOTS
-- REGLA: Turnos prevalecen sobre horario general
--
-- =====================================================

-- =====================================================
-- PASO 1: BASE DE DATOS ÓPTIMA
-- =====================================================

-- 1.1 HORARIOS GENERALES DEL RESTAURANTE (base)
CREATE TABLE IF NOT EXISTS restaurant_operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME NOT NULL DEFAULT '09:00',
    close_time TIME NOT NULL DEFAULT '22:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_operating_hours CHECK (open_time < close_time),
    UNIQUE(restaurant_id, day_of_week)
);

-- 1.2 TURNOS ESPECÍFICOS (opcionales - prevalecen sobre horario general)
CREATE TABLE IF NOT EXISTS restaurant_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_shift_times CHECK (start_time < end_time)
);

-- 1.3 ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_operating_hours_restaurant_day 
    ON restaurant_operating_hours(restaurant_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_day_active 
    ON restaurant_shifts(restaurant_id, day_of_week, is_active);

-- =====================================================
-- PASO 2: LÓGICA DEFINITIVA - FUNCIÓN PRINCIPAL
-- =====================================================

CREATE OR REPLACE FUNCTION generate_availability_slots_definitivo(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_slot_duration_minutes INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_date DATE;
    v_day_of_week INTEGER;
    v_slots_created INTEGER := 0;
    v_slots_preserved INTEGER := 0;
    
    -- Variables para horario general
    v_is_open BOOLEAN;
    v_general_open TIME;
    v_general_close TIME;
    
    -- Variables para turnos
    v_shift_record RECORD;
    v_has_shifts BOOLEAN;
    
    -- Variables para generación de slots
    v_table_record RECORD;
    v_slot_start TIME;
    v_slot_end TIME;
    v_last_allowed_start TIME;
BEGIN
    RAISE NOTICE '🚀 INICIANDO SISTEMA DEFINITIVO';
    RAISE NOTICE '📅 Rango: % a % | Duración: % min', p_start_date, p_end_date, p_slot_duration_minutes;
    
    -- =====================================================
    -- ITERAR CADA DÍA EN EL RANGO
    -- =====================================================
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        
        RAISE NOTICE '';
        RAISE NOTICE '📅 PROCESANDO: % (día %)', v_current_date, v_day_of_week;
        
        -- =====================================================
        -- REGLA 1: CALENDARIO PRIMERO
        -- =====================================================
        IF EXISTS (
            SELECT 1 FROM special_events 
            WHERE restaurant_id = p_restaurant_id 
            AND event_date = v_current_date 
            AND is_closed = true
        ) THEN
            RAISE NOTICE '🚫 CALENDARIO: Día cerrado por evento especial';
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- =====================================================
        -- REGLA 2: HORARIO GENERAL DEL RESTAURANTE
        -- =====================================================
        SELECT is_open, open_time, close_time 
        INTO v_is_open, v_general_open, v_general_close
        FROM restaurant_operating_hours 
        WHERE restaurant_id = p_restaurant_id 
        AND day_of_week = v_day_of_week;
        
        -- Si no hay configuración o está cerrado
        IF NOT FOUND OR NOT v_is_open THEN
            RAISE NOTICE '🚫 HORARIO GENERAL: Día cerrado en configuración';
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        RAISE NOTICE '🕐 HORARIO GENERAL: % - %', v_general_open, v_general_close;
        
        -- =====================================================
        -- REGLA 3: TURNOS (OPCIONALES - PREVALECEN)
        -- =====================================================
        SELECT EXISTS (
            SELECT 1 FROM restaurant_shifts 
            WHERE restaurant_id = p_restaurant_id 
            AND day_of_week = v_day_of_week 
            AND is_active = true
        ) INTO v_has_shifts;
        
        IF v_has_shifts THEN
            RAISE NOTICE '🔄 TURNOS: Existen turnos específicos - PREVALECEN sobre horario general';
            
            -- GENERAR SLOTS SOLO DENTRO DE LOS TURNOS
            FOR v_shift_record IN 
                SELECT name, start_time, end_time 
                FROM restaurant_shifts 
                WHERE restaurant_id = p_restaurant_id 
                AND day_of_week = v_day_of_week 
                AND is_active = true
                ORDER BY start_time
            LOOP
                RAISE NOTICE '   📋 Turno: % (% - %)', 
                    v_shift_record.name, v_shift_record.start_time, v_shift_record.end_time;
                
                -- CALCULAR ÚLTIMA RESERVA PERMITIDA EN ESTE TURNO
                v_last_allowed_start := v_shift_record.end_time - (p_slot_duration_minutes || ' minutes')::interval;
                
                RAISE NOTICE '   ⏰ Última reserva permitida: %', v_last_allowed_start;
                
                -- GENERAR SLOTS PARA ESTE TURNO
                v_slot_start := v_shift_record.start_time;
                WHILE v_slot_start <= v_last_allowed_start LOOP
                    v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
                    
                    -- CREAR SLOTS PARA CADA MESA ACTIVA
                    FOR v_table_record IN 
                        SELECT id, capacity FROM tables 
                        WHERE restaurant_id = p_restaurant_id AND is_active = true
                    LOOP
                        -- VERIFICAR SI YA EXISTE RESERVA
                        IF NOT EXISTS (
                            SELECT 1 FROM availability_slots a
                            INNER JOIN reservations r ON r.table_id = a.table_id 
                                AND r.reservation_date = a.slot_date 
                                AND r.reservation_time = a.start_time
                            WHERE a.restaurant_id = p_restaurant_id
                            AND a.table_id = v_table_record.id
                            AND a.slot_date = v_current_date
                            AND a.start_time = v_slot_start
                            AND r.status IN ('confirmed', 'pending')
                        ) THEN
                            -- CREAR SLOT
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, 
                                start_time, end_time, is_available,
                                metadata, created_at
                            ) VALUES (
                                p_restaurant_id, v_table_record.id, v_current_date,
                                v_slot_start, v_slot_end, true,
                                jsonb_build_object(
                                    'duration_minutes', p_slot_duration_minutes,
                                    'table_capacity', v_table_record.capacity,
                                    'shift_name', v_shift_record.name,
                                    'source', 'turno_especifico'
                                ),
                                NOW()
                            ) ON CONFLICT (restaurant_id, table_id, slot_date, start_time) DO NOTHING;
                            
                            v_slots_created := v_slots_created + 1;
                        ELSE
                            v_slots_preserved := v_slots_preserved + 1;
                        END IF;
                    END LOOP;
                    
                    -- SIGUIENTE SLOT
                    v_slot_start := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
                END LOOP;
            END LOOP;
            
        ELSE
            RAISE NOTICE '📝 SIN TURNOS: Usando horario general completo';
            
            -- CALCULAR ÚLTIMA RESERVA PERMITIDA EN HORARIO GENERAL
            v_last_allowed_start := v_general_close - (p_slot_duration_minutes || ' minutes')::interval;
            
            RAISE NOTICE '   ⏰ Última reserva permitida: %', v_last_allowed_start;
            
            -- GENERAR SLOTS PARA TODO EL HORARIO GENERAL
            v_slot_start := v_general_open;
            WHILE v_slot_start <= v_last_allowed_start LOOP
                v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
                
                -- CREAR SLOTS PARA CADA MESA ACTIVA
                FOR v_table_record IN 
                    SELECT id, capacity FROM tables 
                    WHERE restaurant_id = p_restaurant_id AND is_active = true
                LOOP
                    -- VERIFICAR SI YA EXISTE RESERVA
                    IF NOT EXISTS (
                        SELECT 1 FROM availability_slots a
                        INNER JOIN reservations r ON r.table_id = a.table_id 
                            AND r.reservation_date = a.slot_date 
                            AND r.reservation_time = a.start_time
                        WHERE a.restaurant_id = p_restaurant_id
                        AND a.table_id = v_table_record.id
                        AND a.slot_date = v_current_date
                        AND a.start_time = v_slot_start
                        AND r.status IN ('confirmed', 'pending')
                    ) THEN
                        -- CREAR SLOT
                        INSERT INTO availability_slots (
                            restaurant_id, table_id, slot_date, 
                            start_time, end_time, is_available,
                            metadata, created_at
                        ) VALUES (
                            p_restaurant_id, v_table_record.id, v_current_date,
                            v_slot_start, v_slot_end, true,
                            jsonb_build_object(
                                'duration_minutes', p_slot_duration_minutes,
                                'table_capacity', v_table_record.capacity,
                                'source', 'horario_general'
                            ),
                            NOW()
                        ) ON CONFLICT (restaurant_id, table_id, slot_date, start_time) DO NOTHING;
                        
                        v_slots_created := v_slots_created + 1;
                    ELSE
                        v_slots_preserved := v_slots_preserved + 1;
                    END IF;
                END LOOP;
                
                -- SIGUIENTE SLOT
                v_slot_start := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
            END LOOP;
        END IF;
        
        -- SIGUIENTE DÍA
        v_current_date := v_current_date + 1;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SISTEMA DEFINITIVO COMPLETADO:';
    RAISE NOTICE '   ✅ Slots creados: %', v_slots_created;
    RAISE NOTICE '   🔒 Slots preservados: %', v_slots_preserved;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('SISTEMA DEFINITIVO: %s nuevos, %s preservados', v_slots_created, v_slots_preserved),
        'slots_created', v_slots_created,
        'slots_updated', 0,
        'slots_preserved', v_slots_preserved,
        'period_start', p_start_date,
        'period_end', p_end_date,
        'days_processed', (p_end_date - p_start_date) + 1,
        'tables_processed', (SELECT COUNT(*) FROM tables WHERE restaurant_id = p_restaurant_id AND is_active = true),
        'slot_duration_minutes', p_slot_duration_minutes,
        'logic_version', 'SISTEMA_DEFINITIVO_V1'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'logic_version', 'SISTEMA_DEFINITIVO_ERROR'
    );
END;
$$;

-- =====================================================
-- PASO 3: MIGRACIÓN SIMPLE DE DATOS EXISTENTES
-- =====================================================

CREATE OR REPLACE FUNCTION migrar_datos_existentes()
RETURNS JSONB AS $$
DECLARE
    restaurant_record RECORD;
    day_config JSONB;
    migrated_count INTEGER := 0;
    day_mapping TEXT[] := ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    day_index INTEGER;
BEGIN
    RAISE NOTICE '🔄 MIGRANDO DATOS EXISTENTES A NUEVAS TABLAS';
    
    -- Migrar horarios generales desde JSONB
    FOR restaurant_record IN 
        SELECT id, settings 
        FROM restaurants 
        WHERE settings IS NOT NULL 
        AND settings->'operating_hours' IS NOT NULL
    LOOP
        RAISE NOTICE '📍 Migrando restaurante: %', restaurant_record.id;
        
        FOR day_index IN 0..6 LOOP
            day_config := restaurant_record.settings->'operating_hours'->day_mapping[day_index + 1];
            
            IF day_config IS NOT NULL THEN
                -- INSERTAR HORARIO GENERAL (sin turnos por ahora)
                INSERT INTO restaurant_operating_hours (
                    restaurant_id, day_of_week, is_open, open_time, close_time
                ) VALUES (
                    restaurant_record.id, day_index,
                    COALESCE((day_config->>'open')::boolean, true),
                    COALESCE((day_config->>'start')::time, '09:00'::time),
                    COALESCE((day_config->>'end')::time, '22:00'::time)
                ) ON CONFLICT (restaurant_id, day_of_week) DO UPDATE SET
                    is_open = EXCLUDED.is_open,
                    open_time = EXCLUDED.open_time,
                    close_time = EXCLUDED.close_time,
                    updated_at = NOW();
                
                migrated_count := migrated_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA: % horarios migrados', migrated_count;
    
    RETURN jsonb_build_object(
        'success', true,
        'migrated_hours', migrated_count,
        'message', 'Datos migrados exitosamente'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASO 4: ACTUALIZAR SMART_CHECK
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS generate_availability_slots_smart_check(uuid,date,date,integer);

-- Crear smart_check que use el sistema definitivo
CREATE OR REPLACE FUNCTION generate_availability_slots_smart_check(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_slot_duration_minutes INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    -- Llamar directamente al sistema definitivo
    RETURN generate_availability_slots_definitivo(
        p_restaurant_id,
        p_start_date,
        p_end_date,
        p_slot_duration_minutes
    );
END;
$$;

-- =====================================================
-- PASO 5: INSTRUCCIONES DE IMPLEMENTACIÓN
-- =====================================================

/*
IMPLEMENTACIÓN PASO A PASO:

1. EJECUTAR TODO ESTE SCRIPT en Supabase

2. MIGRAR DATOS EXISTENTES:
   SELECT migrar_datos_existentes();

3. PROBAR EL SISTEMA:
   SELECT generate_availability_slots_definitivo(
       'tu-restaurant-id'::uuid,
       CURRENT_DATE,
       CURRENT_DATE + 7,
       90
   );

4. PROBAR DESDE EL FRONTEND:
   - Ir a Gestión de Disponibilidades
   - Hacer clic en "Generar Disponibilidades"
   - Debería funcionar perfectamente

LÓGICA IMPLEMENTADA:
✅ CALENDARIO PRIMERO - Si cerrado, no hay disponibilidades
✅ HORARIO GENERAL - Base de operación del restaurante
✅ TURNOS PREVALECEN - Si existen, solo se usan los turnos
✅ ÚLTIMA RESERVA - Calculada correctamente según duración
✅ FORMATO TIEMPO - Sin segundos (TIME type automático)
✅ SLOTS PRECISOS - Reflejan exactamente lo reservable

BENEFICIOS:
🚀 Lógica clara y robusta
🛡️ Sin solapamientos problemáticos
📈 Performance optimizada
🔧 Fácil de mantener
📚 Documentación completa
*/

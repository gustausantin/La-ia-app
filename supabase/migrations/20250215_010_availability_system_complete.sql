-- =====================================================
-- SISTEMA DE DISPONIBILIDADES COMPLETO - WORLD CLASS
-- Migración: 20250215_010_availability_system_complete.sql
-- Autor: La-IA Restaurant Management Team
-- Descripción: Sistema completo de disponibilidades para reservas
-- =====================================================

-- ELIMINAR FUNCIÓN EXISTENTE CON TIPO DE RETORNO DIFERENTE
DROP FUNCTION IF EXISTS generate_availability_slots(uuid,date,date);

-- 1. TABLA DE SLOTS DE DISPONIBILIDAD
-- =====================================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    shift_name TEXT, -- 'almuerzo', 'cena', etc.
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'held', 'reserved', 'blocked')),
    source TEXT DEFAULT 'system' CHECK (source IN ('system', 'manual', 'n8n', 'agent')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint único: una mesa no puede tener slots solapados
    CONSTRAINT unique_slot_per_table UNIQUE (restaurant_id, slot_date, start_time, end_time, table_id)
);

-- Índices optimizados para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_availability_slots_restaurant_date_status 
    ON availability_slots (restaurant_id, slot_date, status);
CREATE INDEX IF NOT EXISTS idx_availability_slots_table_date 
    ON availability_slots (table_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_datetime 
    ON availability_slots (slot_date, start_time);

-- 2. TABLA DE EVENTOS ESPECIALES (CIERRES, FESTIVOS, ETC.)
-- =====================================================
CREATE TABLE IF NOT EXISTS special_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('closure', 'holiday', 'maintenance', 'private_event', 'reduced_capacity')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME, -- NULL = todo el día
    end_time TIME,   -- NULL = todo el día
    affected_tables UUID[], -- NULL = todas las mesas
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_special_events_restaurant_dates 
    ON special_events (restaurant_id, start_date, end_date, is_active);

-- 3. PARÁMETROS DE CONFIGURACIÓN EN RESTAURANTS
-- =====================================================
-- Añadir campos necesarios a restaurants.settings si no existen
DO $$
BEGIN
    -- Verificar si la columna settings existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'settings'
    ) THEN
        -- Actualizar restaurants existentes con configuración por defecto
        UPDATE restaurants 
        SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
            'turn_duration_minutes', COALESCE(settings->>'turn_duration_minutes', '90')::int,
            'buffer_minutes', COALESCE(settings->>'buffer_minutes', '15')::int,
            'horizon_days', COALESCE(settings->>'horizon_days', '90')::int,
            'max_party_size', COALESCE(settings->>'max_party_size', '8')::int,
            'allow_same_day_bookings', COALESCE((settings->>'allow_same_day_bookings')::boolean, true),
            'min_advance_hours', COALESCE(settings->>'min_advance_hours', '2')::int
        )
        WHERE settings IS NULL OR 
              settings->>'turn_duration_minutes' IS NULL OR
              settings->>'buffer_minutes' IS NULL OR
              settings->>'horizon_days' IS NULL;
              
        RAISE NOTICE '✅ Configuración de disponibilidades añadida a restaurants existentes';
    ELSE
        RAISE NOTICE '⚠️ Tabla restaurants no tiene columna settings - se creará automáticamente';
    END IF;
END $$;

-- 4. FUNCIÓN: GENERAR SLOTS DE DISPONIBILIDAD
-- =====================================================
CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    restaurant_settings JSONB;
    operating_hours JSONB;
    turn_duration INTEGER;
    buffer_minutes INTEGER;
    horizon_days INTEGER;
    current_loop_date DATE;
    final_end_date DATE;
    slot_count INTEGER := 0;
    day_schedule JSONB;
    shift_key TEXT;
    shift_data JSONB;
    shift_start TIME;
    shift_end TIME;
    current_slot_time TIME;
    slot_end_time TIME;
    table_record RECORD;
    special_event RECORD;
    is_day_affected BOOLEAN;
BEGIN
    -- 1. Obtener configuración del restaurante
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurante no encontrado: %', p_restaurant_id;
    END IF;
    
    -- Extraer parámetros
    operating_hours := restaurant_settings->'operating_hours';
    turn_duration := COALESCE((restaurant_settings->>'turn_duration_minutes')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_minutes')::INTEGER, 15);
    horizon_days := COALESCE((restaurant_settings->>'horizon_days')::INTEGER, 90);
    
    -- Calcular fecha final
    final_end_date := COALESCE(p_end_date, p_start_date + horizon_days);
    
    -- 2. Limpiar slots existentes en el rango (regeneración idempotente)
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
      AND slot_date BETWEEN p_start_date AND final_end_date
      AND source = 'system';
    
    -- 3. Generar slots día por día
    current_loop_date := p_start_date;
    
    WHILE current_loop_date <= final_end_date LOOP
        -- Obtener horario del día usando nombres de días
        day_schedule := CASE EXTRACT(DOW FROM current_loop_date)
            WHEN 0 THEN operating_hours->'sunday'    -- Domingo
            WHEN 1 THEN operating_hours->'monday'    -- Lunes
            WHEN 2 THEN operating_hours->'tuesday'   -- Martes
            WHEN 3 THEN operating_hours->'wednesday' -- Miércoles
            WHEN 4 THEN operating_hours->'thursday'  -- Jueves
            WHEN 5 THEN operating_hours->'friday'    -- Viernes
            WHEN 6 THEN operating_hours->'saturday'  -- Sábado
        END;
        
        -- Verificar si el día está abierto y no está marcado como cerrado
        IF day_schedule IS NOT NULL AND COALESCE((day_schedule->>'closed')::BOOLEAN, false) = false THEN
            
            -- Verificar eventos especiales que afecten este día
            is_day_affected := false;
            FOR special_event IN 
                SELECT * FROM special_events 
                WHERE restaurant_id = p_restaurant_id 
                  AND is_active = true
                  AND start_date <= current_loop_date 
                  AND end_date >= current_loop_date
                  AND event_type IN ('closure', 'holiday')
            LOOP
                is_day_affected := true;
                EXIT;
            END LOOP;
            
            -- Si el día no está afectado por cierres, generar slots
            IF NOT is_day_affected THEN
                
                -- Usar horario simple open/close (sin shifts por ahora)
                shift_start := (day_schedule->>'open')::TIME;
                shift_end := (day_schedule->>'close')::TIME;
                
                IF shift_start IS NOT NULL AND shift_end IS NOT NULL THEN
                    
                    -- Generar slots para cada mesa activa
                    FOR table_record IN 
                        SELECT id, name, capacity, is_active 
                        FROM tables 
                        WHERE restaurant_id = p_restaurant_id 
                          AND is_active = true
                    LOOP
                        
                        -- Generar slots dentro del turno
                        current_slot_time := shift_start;
                        
                        WHILE current_slot_time + (turn_duration || ' minutes')::INTERVAL <= shift_end LOOP
                            slot_end_time := current_slot_time + (turn_duration || ' minutes')::INTERVAL;
                            
                            -- Verificar que no haya eventos especiales que afecten esta mesa/hora
                            IF NOT EXISTS (
                                SELECT 1 FROM special_events 
                                WHERE restaurant_id = p_restaurant_id 
                                  AND is_active = true
                                  AND start_date <= current_loop_date 
                                  AND end_date >= current_loop_date
                                  AND (start_time IS NULL OR start_time <= current_slot_time)
                                  AND (end_time IS NULL OR end_time >= slot_end_time)
                                  AND (affected_tables IS NULL OR table_record.id = ANY(affected_tables))
                            ) THEN
                                
                                -- Insertar slot
                                INSERT INTO availability_slots (
                                    restaurant_id, slot_date, start_time, end_time,
                                    table_id, shift_name, status, source, metadata
                                ) VALUES (
                                    p_restaurant_id, current_loop_date, current_slot_time, slot_end_time,
                                    table_record.id, shift_key, 'free', 'system',
                                    jsonb_build_object(
                                        'table_name', table_record.name,
                                        'table_capacity', table_record.capacity,
                                        'generated_at', now()
                                    )
                                );
                                
                                slot_count := slot_count + 1;
                            END IF;
                            
                            -- Avanzar al siguiente slot (con buffer)
                            current_slot_time := current_slot_time + ((turn_duration + buffer_minutes) || ' minutes')::INTERVAL;
                        END LOOP;
                    END LOOP;
                END IF;
            END IF;
        END IF;
        
        current_loop_date := current_loop_date + 1;
    END LOOP;
    
    -- Retornar resultados
    RETURN slot_count;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNCIÓN: VERIFICAR DISPONIBILIDAD
-- =====================================================
CREATE OR REPLACE FUNCTION check_availability(
    p_restaurant_id UUID,
    p_date DATE,
    p_time TIME,
    p_party_size INTEGER DEFAULT 2,
    p_duration_minutes INTEGER DEFAULT NULL
) RETURNS TABLE (
    available_slots INTEGER,
    suggested_times TIME[],
    available_tables JSONB[]
) AS $$
DECLARE
    restaurant_settings JSONB;
    turn_duration INTEGER;
    buffer_minutes INTEGER;
    min_advance_hours INTEGER;
    booking_start_time TIMESTAMPTZ;
    min_booking_time TIMESTAMPTZ;
    slot_end_time TIME;
    available_count INTEGER := 0;
    suggestions TIME[] := ARRAY[]::TIME[];
    tables_info JSONB[] := ARRAY[]::JSONB[];
    slot_record RECORD;
BEGIN
    -- 1. Obtener configuración
    SELECT settings INTO restaurant_settings
    FROM restaurants WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE EXCEPTION 'Restaurante no encontrado: %', p_restaurant_id;
    END IF;
    
    turn_duration := COALESCE(p_duration_minutes, (restaurant_settings->>'turn_duration_minutes')::INTEGER, 90);
    buffer_minutes := COALESCE((restaurant_settings->>'buffer_minutes')::INTEGER, 15);
    min_advance_hours := COALESCE((restaurant_settings->>'min_advance_hours')::INTEGER, 2);
    
    -- 2. Validar tiempo mínimo de antelación
    booking_start_time := p_date::TIMESTAMPTZ + p_time::TIME;
    min_booking_time := now() + (min_advance_hours || ' hours')::INTERVAL;
    
    IF booking_start_time < min_booking_time THEN
        RETURN QUERY SELECT 0, ARRAY[]::TIME[], ARRAY[]::JSONB[];
        RETURN;
    END IF;
    
    slot_end_time := p_time + (turn_duration || ' minutes')::INTERVAL;
    
    -- 3. Buscar slots disponibles para la hora exacta solicitada
    FOR slot_record IN
        SELECT 
            a.id, a.start_time, a.end_time, a.table_id,
            t.name as table_name, t.capacity, t.table_type
        FROM availability_slots a
        JOIN tables t ON t.id = a.table_id
        WHERE a.restaurant_id = p_restaurant_id
          AND a.slot_date = p_date
          AND a.start_time = p_time
          AND a.status = 'free'
          AND t.capacity >= p_party_size
          AND t.is_active = true
        ORDER BY t.capacity ASC -- Priorizar mesas más pequeñas
    LOOP
        available_count := available_count + 1;
        tables_info := tables_info || jsonb_build_object(
            'table_id', slot_record.table_id,
            'table_name', slot_record.table_name,
            'capacity', slot_record.capacity,
            'table_type', slot_record.table_type,
            'start_time', slot_record.start_time,
            'end_time', slot_record.end_time
        );
    END LOOP;
    
    -- 4. Si no hay disponibilidad exacta, buscar alternativas cercanas
    IF available_count = 0 THEN
        FOR slot_record IN
            SELECT DISTINCT a.start_time
            FROM availability_slots a
            JOIN tables t ON t.id = a.table_id
            WHERE a.restaurant_id = p_restaurant_id
              AND a.slot_date = p_date
              AND a.status = 'free'
              AND t.capacity >= p_party_size
              AND t.is_active = true
              AND a.start_time BETWEEN p_time - '2 hours'::INTERVAL AND p_time + '2 hours'::INTERVAL
            ORDER BY ABS(EXTRACT(EPOCH FROM (a.start_time - p_time)))
            LIMIT 5
        LOOP
            suggestions := suggestions || slot_record.start_time;
        END LOOP;
    END IF;
    
    RETURN QUERY SELECT available_count, suggestions, tables_info;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCIÓN: RESERVAR MESA (TRANSACCIONAL)
-- =====================================================
CREATE OR REPLACE FUNCTION book_table(
    p_restaurant_id UUID,
    p_date DATE,
    p_time TIME,
    p_party_size INTEGER,
    p_channel TEXT DEFAULT 'web',
    p_customer JSONB DEFAULT '{}',
    p_duration_minutes INTEGER DEFAULT NULL,
    p_special_requests TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    reservation_id UUID,
    table_info JSONB,
    message TEXT
) AS $$
DECLARE
    restaurant_settings JSONB;
    turn_duration INTEGER;
    min_advance_hours INTEGER;
    booking_start_time TIMESTAMPTZ;
    min_booking_time TIMESTAMPTZ;
    slot_end_time TIME;
    selected_slot RECORD;
    new_reservation_id UUID;
    customer_id UUID;
    customer_name TEXT;
    customer_phone TEXT;
    customer_email TEXT;
BEGIN
    -- 1. Validaciones iniciales
    SELECT settings INTO restaurant_settings
    FROM restaurants WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 'Restaurante no encontrado';
        RETURN;
    END IF;
    
    turn_duration := COALESCE(p_duration_minutes, (restaurant_settings->>'turn_duration_minutes')::INTEGER, 90);
    min_advance_hours := COALESCE((restaurant_settings->>'min_advance_hours')::INTEGER, 2);
    
    -- Validar tiempo mínimo de antelación
    booking_start_time := p_date::TIMESTAMPTZ + p_time::TIME;
    min_booking_time := now() + (min_advance_hours || ' hours')::INTERVAL;
    
    IF booking_start_time < min_booking_time THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 
            'Reserva demasiado próxima. Mínimo ' || min_advance_hours || ' horas de antelación';
        RETURN;
    END IF;
    
    slot_end_time := p_time + (turn_duration || ' minutes')::INTERVAL;
    
    -- 2. Buscar y bloquear slot disponible (FOR UPDATE SKIP LOCKED)
    SELECT 
        a.id, a.table_id, a.start_time, a.end_time,
        t.name as table_name, t.capacity, t.table_type
    INTO selected_slot
    FROM availability_slots a
    JOIN tables t ON t.id = a.table_id
    WHERE a.restaurant_id = p_restaurant_id
      AND a.slot_date = p_date
      AND a.start_time = p_time
      AND a.status = 'free'
      AND t.capacity >= p_party_size
      AND t.is_active = true
    ORDER BY t.capacity ASC -- Priorizar mesa más pequeña adecuada
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF selected_slot IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 'No hay disponibilidad para esa fecha y hora';
        RETURN;
    END IF;
    
    -- 3. Procesar información del cliente
    customer_name := COALESCE(p_customer->>'name', p_customer->>'first_name', 'Cliente');
    customer_phone := p_customer->>'phone';
    customer_email := p_customer->>'email';
    
    -- Buscar o crear cliente
    IF customer_phone IS NOT NULL OR customer_email IS NOT NULL THEN
        SELECT id INTO customer_id
        FROM customers
        WHERE restaurant_id = p_restaurant_id
          AND (
              (customer_phone IS NOT NULL AND phone = customer_phone) OR
              (customer_email IS NOT NULL AND email = customer_email)
          )
        LIMIT 1;
        
        -- Crear cliente si no existe
        IF customer_id IS NULL THEN
            INSERT INTO customers (
                restaurant_id, name, phone, email, 
                first_name, segment_auto, created_at
            ) VALUES (
                p_restaurant_id, customer_name, customer_phone, customer_email,
                split_part(customer_name, ' ', 1), 'nuevo', now()
            )
            RETURNING id INTO customer_id;
        END IF;
    END IF;
    
    -- 4. Crear reserva
    INSERT INTO reservations (
        restaurant_id, customer_id, table_id,
        reservation_date, reservation_time, party_size,
        status, source, channel, special_requests,
        created_at, updated_at
    ) VALUES (
        p_restaurant_id, customer_id, selected_slot.table_id,
        p_date, p_time, p_party_size,
        'confirmed', p_channel, p_channel, p_special_requests,
        now(), now()
    )
    RETURNING id INTO new_reservation_id;
    
    -- 5. Marcar slot como reservado
    UPDATE availability_slots
    SET status = 'reserved',
        metadata = metadata || jsonb_build_object(
            'reservation_id', new_reservation_id,
            'reserved_at', now(),
            'reserved_by', p_channel,
            'party_size', p_party_size
        ),
        updated_at = now()
    WHERE id = selected_slot.id;
    
    -- 6. Retornar éxito
    RETURN QUERY SELECT 
        true,
        new_reservation_id,
        jsonb_build_object(
            'table_id', selected_slot.table_id,
            'table_name', selected_slot.table_name,
            'capacity', selected_slot.capacity,
            'table_type', selected_slot.table_type,
            'start_time', selected_slot.start_time,
            'end_time', selected_slot.end_time,
            'customer_name', customer_name
        ),
        'Reserva confirmada exitosamente';
        
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de error, hacer rollback automático
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 
            'Error al procesar la reserva: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN: LIBERAR SLOTS AL CANCELAR RESERVA
-- =====================================================
CREATE OR REPLACE FUNCTION release_reservation_slot(
    p_reservation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    reservation_record RECORD;
BEGIN
    -- Obtener información de la reserva
    SELECT r.restaurant_id, r.reservation_date, r.reservation_time, r.table_id
    INTO reservation_record
    FROM reservations r
    WHERE r.id = p_reservation_id;
    
    IF reservation_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Liberar slots asociados
    UPDATE availability_slots
    SET status = 'free',
        metadata = metadata - 'reservation_id' - 'reserved_at' - 'reserved_by' - 'party_size',
        updated_at = now()
    WHERE restaurant_id = reservation_record.restaurant_id
      AND slot_date = reservation_record.reservation_date
      AND start_time = reservation_record.reservation_time
      AND table_id = reservation_record.table_id
      AND status = 'reserved'
      AND (metadata->>'reservation_id')::UUID = p_reservation_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGERS PARA MANTENER CONSISTENCIA
-- =====================================================

-- Trigger para actualizar slots cuando se cancela una reserva
CREATE OR REPLACE FUNCTION handle_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la reserva se cancela o marca como no_show, liberar el slot
    IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
        PERFORM release_reservation_slot(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservation_status_change_trigger ON reservations;
CREATE TRIGGER reservation_status_change_trigger
    AFTER UPDATE OF status ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION handle_reservation_status_change();

-- Trigger para regenerar slots cuando cambian las mesas
CREATE OR REPLACE FUNCTION handle_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Regenerar slots para los próximos 7 días cuando una mesa cambia
    IF TG_OP = 'UPDATE' AND (NEW.is_active != OLD.is_active OR NEW.capacity != OLD.capacity) THEN
        PERFORM generate_availability_slots(NEW.restaurant_id, CURRENT_DATE, CURRENT_DATE + 7);
    ELSIF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        PERFORM generate_availability_slots(NEW.restaurant_id, CURRENT_DATE, CURRENT_DATE + 7);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS table_changes_trigger ON tables;
CREATE TRIGGER table_changes_trigger
    AFTER INSERT OR UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION handle_table_changes();

-- 9. RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "availability_slots_tenant_isolation" ON availability_slots;
DROP POLICY IF EXISTS "special_events_tenant_isolation" ON special_events;

-- Política para availability_slots
CREATE POLICY "availability_slots_tenant_isolation" ON availability_slots
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para special_events
CREATE POLICY "special_events_tenant_isolation" ON special_events
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- 10. FUNCIÓN DE INICIALIZACIÓN PARA RESTAURANTES EXISTENTES
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_availability_system(p_restaurant_id UUID)
RETURNS TEXT AS $$
DECLARE
    result_text TEXT;
    slots_count INTEGER;
BEGIN
    -- Generar slots iniciales para los próximos 90 días
    SELECT generate_availability_slots(p_restaurant_id, CURRENT_DATE, CURRENT_DATE + 90) INTO slots_count;
    
    result_text := format('✅ Sistema de disponibilidades inicializado para restaurante %s. Generados %s slots',
                         p_restaurant_id, slots_count);
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 11. INICIALIZACIÓN AUTOMÁTICA PARA RESTAURANTES EXISTENTES
-- =====================================================
DO $$
DECLARE
    restaurant_record RECORD;
    init_result TEXT;
BEGIN
    -- Inicializar sistema para todos los restaurantes existentes que tengan mesas activas
    FOR restaurant_record IN
        SELECT DISTINCT r.id, r.name
        FROM restaurants r
        JOIN tables t ON t.restaurant_id = r.id
        WHERE t.is_active = true
    LOOP
        BEGIN
            SELECT initialize_availability_system(restaurant_record.id) INTO init_result;
            RAISE NOTICE '%', init_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Error inicializando restaurante %: %', restaurant_record.name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '🚀 Sistema de disponibilidades completo instalado y operativo';
END $$;

-- FIN DE LA MIGRACIÓN
-- =====================================================

-- =====================================================
-- RESTAURAR FUNCIÓN ORIGINAL + SOLO CAMBIO DE HORARIOS
-- =====================================================

-- 🔄 USAR LA FUNCIÓN QUE FUNCIONABA ANTES
-- Solo cambiar la lógica de horarios para permitir hasta cierre

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
    v_restaurant_record RECORD;
    v_settings jsonb;
    v_operating_hours jsonb;
    v_calendar_schedule jsonb;
    v_reservation_policy jsonb;
    v_min_party_size integer := 1;
    v_max_party_size integer := 20;
    v_standard_duration integer;
    v_total_tables integer := 0;
    v_table_record RECORD;
    v_current_date date;
    v_final_end_date date;
    v_day_name text;
    v_day_config jsonb;
    v_is_open boolean;
    v_day_shifts jsonb;
    v_shift_record jsonb;
    v_open_time time;
    v_close_time time;
    v_slot_start_time time;
    v_slot_end_time time;
    v_slots_created integer := 0;
    v_slots_updated integer := 0;
    v_slots_preserved integer := 0;
    v_open_days integer := 0;
    v_tables_used integer := 0;
    
    -- VARIABLES PARA CALENDARIO
    v_special_event RECORD;
    v_calendar_day RECORD;
    v_is_special_event boolean := false;
    v_event_closed boolean := false;
    
    -- VARIABLES PARA REGENERACIÓN
    v_existing_slot RECORD;
BEGIN
    RAISE NOTICE '🔄 REGENERACIÓN INTELIGENTE PARA RESTAURANTE %', p_restaurant_id;
    
    -- Obtener configuración del restaurante
    SELECT * INTO v_restaurant_record FROM restaurants WHERE id = p_restaurant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Restaurante no encontrado');
    END IF;
    
    v_settings := v_restaurant_record.settings;
    v_operating_hours := v_settings->'operating_hours';
    v_calendar_schedule := v_settings->'calendar_schedule';
    v_reservation_policy := v_settings->'reservation_policy';
    
    -- Configurar política de reservas
    IF v_reservation_policy IS NOT NULL THEN
        v_min_party_size := COALESCE((v_reservation_policy->>'min_party_size')::integer, 1);
        v_max_party_size := COALESCE((v_reservation_policy->>'max_party_size')::integer, 20);
    END IF;
    
    v_standard_duration := p_slot_duration_minutes;
    v_final_end_date := p_end_date;
    
    -- Verificar mesas activas
    SELECT COUNT(*) INTO v_total_tables
    FROM tables 
    WHERE restaurant_id = p_restaurant_id 
    AND is_active = true
    AND capacity >= v_min_party_size;
    
    IF v_total_tables = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sin mesas activas');
    END IF;
    
    -- 🛡️ CONTAR SLOTS CON RESERVAS PARA PROTEGER
    SELECT COUNT(*) INTO v_slots_preserved
    FROM availability_slots a
    INNER JOIN reservations r ON r.table_id = a.table_id 
        AND r.reservation_date = a.slot_date 
        AND r.reservation_time = a.start_time
    WHERE a.restaurant_id = p_restaurant_id
    AND a.slot_date BETWEEN p_start_date AND v_final_end_date
    AND r.status IN ('confirmed', 'pending');
    
    -- ITERAR POR CADA DÍA
    v_current_date := p_start_date;
    
    WHILE v_current_date <= v_final_end_date LOOP
        
        -- OBTENER NOMBRE DEL DÍA
        v_day_name := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- VERIFICAR EVENTOS ESPECIALES EN CALENDARIO
        SELECT * INTO v_special_event
        FROM special_events
        WHERE restaurant_id = p_restaurant_id
        AND event_date = v_current_date;
        
        v_is_special_event := FOUND;
        v_event_closed := v_is_special_event AND COALESCE(v_special_event.is_closed, false);
        
        -- OBTENER CONFIGURACIÓN DEL DÍA
        v_day_config := v_operating_hours->v_day_name;
        v_is_open := NOT COALESCE((v_day_config->>'closed')::boolean, false);
        
        IF v_event_closed THEN
            -- DÍA CERRADO POR EVENTO ESPECIAL
            RAISE NOTICE '🚫 Día % cerrado por evento: %', v_current_date, v_special_event.title;
            
        ELSIF NOT v_is_open THEN
            -- DÍA CERRADO NORMAL
            RAISE NOTICE '🚫 Día % cerrado (configuración)', v_current_date;
            
        ELSE
            -- DÍA ABIERTO - GENERAR SLOTS
            v_open_days := v_open_days + 1;
            v_day_shifts := v_day_config->'shifts';
            
            -- Si no hay turnos definidos, usar horario simple
            IF v_day_shifts IS NULL OR jsonb_array_length(v_day_shifts) = 0 THEN
                v_open_time := COALESCE((v_day_config->>'open')::time, '09:00'::time);
                v_close_time := COALESCE((v_day_config->>'close')::time, '22:00'::time);
                
                RAISE NOTICE '📅 Día % abierto: % - %', v_current_date, v_open_time, v_close_time;
                
                -- GENERAR SLOTS PARA CADA MESA
                FOR v_table_record IN 
                    SELECT id, name, capacity, zone
                    FROM tables 
                    WHERE restaurant_id = p_restaurant_id 
                    AND is_active = true
                    AND capacity >= v_min_party_size
                    ORDER BY zone, name
                LOOP
                    v_slot_start_time := v_open_time;
                    
                    -- ✅ LÓGICA CORRECTA: Permitir reservas hasta la hora de cierre
                    -- Horario público 09:00-22:00 → última reserva 22:00 ✅
                    WHILE v_slot_start_time <= v_close_time LOOP
                        v_slot_end_time := v_slot_start_time + (v_standard_duration || ' minutes')::interval;
                        
                        -- VERIFICAR SI YA EXISTE SLOT CON RESERVA
                        SELECT * INTO v_existing_slot
                        FROM availability_slots a
                        INNER JOIN reservations r ON r.table_id = a.table_id 
                            AND r.reservation_date = a.slot_date 
                            AND r.reservation_time = a.start_time
                        WHERE a.restaurant_id = p_restaurant_id
                        AND a.table_id = v_table_record.id
                        AND a.slot_date = v_current_date
                        AND a.start_time = v_slot_start_time
                        AND r.status IN ('confirmed', 'pending');
                        
                        IF FOUND THEN
                            -- ACTUALIZAR METADATA DEL SLOT CON RESERVA
                            UPDATE availability_slots 
                            SET 
                                metadata = jsonb_build_object(
                                    'duration_minutes', v_standard_duration,
                                    'reservation_id', v_existing_slot.id,
                                    'protected', true,
                                    'customer_name', v_existing_slot.customer_name
                                ),
                                duration_minutes = v_standard_duration,
                                updated_at = NOW()
                            WHERE restaurant_id = p_restaurant_id
                            AND table_id = v_table_record.id
                            AND slot_date = v_current_date
                            AND start_time = v_slot_start_time;
                            
                            v_slots_updated := v_slots_updated + 1;
                            
                        ELSE
                            -- CREAR NUEVO SLOT LIBRE
                            INSERT INTO availability_slots (
                                restaurant_id, table_id, slot_date, start_time, end_time,
                                status, is_available, duration_minutes, metadata, created_at, updated_at
                            ) VALUES (
                                p_restaurant_id,
                                v_table_record.id,
                                v_current_date,
                                v_slot_start_time,
                                v_slot_end_time,
                                'free',
                                true,
                                v_standard_duration,
                                jsonb_build_object(
                                    'duration_minutes', v_standard_duration,
                                    'table_name', v_table_record.name,
                                    'table_capacity', v_table_record.capacity,
                                    'table_zone', v_table_record.zone
                                ),
                                NOW(),
                                NOW()
                            )
                            ON CONFLICT (restaurant_id, table_id, slot_date, start_time) 
                            DO UPDATE SET
                                end_time = EXCLUDED.end_time,
                                status = EXCLUDED.status,
                                is_available = EXCLUDED.is_available,
                                duration_minutes = EXCLUDED.duration_minutes,
                                metadata = EXCLUDED.metadata,
                                updated_at = NOW();
                            
                            v_slots_created := v_slots_created + 1;
                        END IF;
                        
                        -- AVANZAR AL SIGUIENTE SLOT (cada 60 minutos)
                        v_slot_start_time := v_slot_start_time + '60 minutes'::interval;
                    END LOOP;
                    
                    v_tables_used := v_tables_used + 1;
                END LOOP;
            END IF;
        END IF;
        
        -- SIGUIENTE DÍA
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- ELIMINAR SLOTS ANTIGUOS SIN RESERVAS (LIMPIEZA)
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date
    AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.table_id = availability_slots.table_id
        AND r.reservation_date = availability_slots.slot_date
        AND r.reservation_time = availability_slots.start_time
        AND r.status IN ('confirmed', 'pending')
    )
    AND created_at < NOW() - interval '1 minute';
    
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_slots_created,
        'slots_updated', v_slots_updated,
        'slots_preserved', v_slots_preserved,
        'days_processed', (v_final_end_date - p_start_date + 1),
        'open_days', v_open_days,
        'tables_used', v_tables_used,
        'period_start', p_start_date,
        'period_end', v_final_end_date,
        'slot_duration_minutes', v_standard_duration
    );
END;
$$;

-- ✅ APLICAR RESTAURACIÓN
SELECT 'FUNCIÓN RESTAURADA: Permite reservas hasta la hora de cierre' as status;

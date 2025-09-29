-- =====================================================
-- FIX: CORREGIR ON CONFLICT EN LA FUNCIÓN
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
    RAISE NOTICE '🚀 SISTEMA DEFINITIVO - CONSTRAINT CORREGIDO';
    RAISE NOTICE '📅 Rango: % a % | Duración: % min', p_start_date, p_end_date, p_slot_duration_minutes;
    
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        
        RAISE NOTICE '';
        RAISE NOTICE '📅 PROCESANDO: % (día %)', v_current_date, v_day_of_week;
        
        -- REGLA 1: CALENDARIO PRIMERO
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
        
        -- REGLA 2: HORARIO GENERAL DEL RESTAURANTE
        SELECT is_open, open_time, close_time 
        INTO v_is_open, v_general_open, v_general_close
        FROM restaurant_operating_hours 
        WHERE restaurant_id = p_restaurant_id 
        AND day_of_week = v_day_of_week;
        
        IF NOT FOUND OR NOT v_is_open THEN
            RAISE NOTICE '🚫 HORARIO GENERAL: Día cerrado en configuración';
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        RAISE NOTICE '🕐 HORARIO GENERAL: % - %', v_general_open, v_general_close;
        
        -- REGLA 3: TURNOS (OPCIONALES - PREVALECEN)
        SELECT EXISTS (
            SELECT 1 FROM restaurant_shifts 
            WHERE restaurant_id = p_restaurant_id 
            AND day_of_week = v_day_of_week 
            AND is_active = true
        ) INTO v_has_shifts;
        
        IF v_has_shifts THEN
            RAISE NOTICE '🔄 TURNOS: Existen turnos específicos - PREVALECEN';
            
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
                
                v_last_allowed_start := v_shift_record.end_time - (p_slot_duration_minutes || ' minutes')::interval;
                RAISE NOTICE '   ⏰ Última reserva permitida: %', v_last_allowed_start;
                
                v_slot_start := v_shift_record.start_time;
                WHILE v_slot_start <= v_last_allowed_start LOOP
                    v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
                    
                    FOR v_table_record IN 
                        SELECT id, capacity FROM tables 
                        WHERE restaurant_id = p_restaurant_id AND is_active = true
                    LOOP
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
                            -- CONSTRAINT CORREGIDO: incluir end_time
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
                            ) ON CONFLICT (restaurant_id, slot_date, start_time, end_time, table_id) DO NOTHING;
                            
                            v_slots_created := v_slots_created + 1;
                        ELSE
                            v_slots_preserved := v_slots_preserved + 1;
                        END IF;
                    END LOOP;
                    
                    v_slot_start := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
                END LOOP;
            END LOOP;
            
        ELSE
            RAISE NOTICE '📝 SIN TURNOS: Usando horario general completo';
            
            v_last_allowed_start := v_general_close - (p_slot_duration_minutes || ' minutes')::interval;
            RAISE NOTICE '   ⏰ Última reserva permitida: %', v_last_allowed_start;
            
            v_slot_start := v_general_open;
            WHILE v_slot_start <= v_last_allowed_start LOOP
                v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
                
                FOR v_table_record IN 
                    SELECT id, capacity FROM tables 
                    WHERE restaurant_id = p_restaurant_id AND is_active = true
                LOOP
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
                        -- CONSTRAINT CORREGIDO: incluir end_time
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
                        ) ON CONFLICT (restaurant_id, slot_date, start_time, end_time, table_id) DO NOTHING;
                        
                        v_slots_created := v_slots_created + 1;
                    ELSE
                        v_slots_preserved := v_slots_preserved + 1;
                    END IF;
                END LOOP;
                
                v_slot_start := v_slot_start + (p_slot_duration_minutes || ' minutes')::interval;
            END LOOP;
        END IF;
        
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
        'logic_version', 'SISTEMA_DEFINITIVO_V1_FIXED'
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

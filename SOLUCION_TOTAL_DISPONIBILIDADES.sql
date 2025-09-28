-- =====================================================
-- SOLUCIÓN COMPLETA - GENERAR DISPONIBILIDADES YA
-- =====================================================
-- Este script arregla TODO y genera los slots
-- =====================================================

-- 1. VERIFICAR Y ARREGLAR FORMATO DE HORARIOS
DO $$
DECLARE
    v_restaurant_id uuid := '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';
    v_settings jsonb;
BEGIN
    -- Obtener settings actuales
    SELECT settings INTO v_settings FROM restaurants WHERE id = v_restaurant_id;
    
    -- Si no hay operating_hours o está mal, crear unos correctos
    IF v_settings->'operating_hours' IS NULL OR 
       v_settings->'operating_hours'->'friday' IS NULL OR
       v_settings->'operating_hours'->'friday'->>'open' IS NULL THEN
        
        -- Actualizar con horarios correctos
        UPDATE restaurants 
        SET settings = jsonb_set(
            COALESCE(settings, '{}'::jsonb),
            '{operating_hours}',
            '{
                "monday": {"open": false, "start": "09:00", "end": "22:00"},
                "tuesday": {"open": false, "start": "09:00", "end": "22:00"},
                "wednesday": {"open": false, "start": "09:00", "end": "22:00"},
                "thursday": {"open": true, "start": "09:00", "end": "22:00"},
                "friday": {"open": true, "start": "09:00", "end": "22:00"},
                "saturday": {"open": true, "start": "09:00", "end": "22:00"},
                "sunday": {"open": false, "start": "09:00", "end": "22:00"}
            }'::jsonb,
            true
        )
        WHERE id = v_restaurant_id;
        
        RAISE NOTICE '✅ Horarios actualizados correctamente';
    END IF;
    
    -- Si no hay política de reservas, crear una
    IF v_settings->'reservation_policy' IS NULL OR
       v_settings->'reservation_policy'->>'reservation_duration' IS NULL THEN
        
        UPDATE restaurants 
        SET settings = jsonb_set(
            COALESCE(settings, '{}'::jsonb),
            '{reservation_policy}',
            '{
                "reservation_duration": 90,
                "advance_booking_days": 30,
                "min_party_size": 2,
                "max_party_size": 8
            }'::jsonb,
            true
        )
        WHERE id = v_restaurant_id;
        
        RAISE NOTICE '✅ Política de reservas configurada';
    END IF;
END $$;

-- 2. ASEGURAR QUE HAY MESAS ACTIVAS
DO $$
DECLARE
    v_restaurant_id uuid := '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';
    v_table_count integer;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM tables 
    WHERE restaurant_id = v_restaurant_id AND is_active = true;
    
    IF v_table_count = 0 THEN
        -- Crear mesas si no hay ninguna
        INSERT INTO tables (restaurant_id, name, capacity, zone, is_active)
        VALUES 
            (v_restaurant_id, 'Mesa 1', 4, 'Salón Principal', true),
            (v_restaurant_id, 'Mesa 2', 4, 'Salón Principal', true),
            (v_restaurant_id, 'Mesa 3', 2, 'Barra', true),
            (v_restaurant_id, 'Mesa 4', 6, 'Terraza', true),
            (v_restaurant_id, 'Mesa 5', 4, 'Terraza', true),
            (v_restaurant_id, 'Mesa 6', 8, 'Privado', true),
            (v_restaurant_id, 'Mesa 7', 2, 'Barra', true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Mesas creadas: 7';
    ELSE
        RAISE NOTICE '✅ Mesas activas encontradas: %', v_table_count;
    END IF;
END $$;

-- 3. LIMPIAR SLOTS ANTIGUOS
DELETE FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 4. GENERAR SLOTS MANUALMENTE (MÉTODO DIRECTO)
DO $$
DECLARE
    v_restaurant_id uuid := '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';
    v_current_date date;
    v_end_date date;
    v_table record;
    v_slot_time time;
    v_slot_end time;
    v_day_name text;
    v_is_open boolean;
    v_start_time time;
    v_end_time time;
    v_duration integer := 90; -- 90 minutos por reserva
    v_slots_created integer := 0;
BEGIN
    -- Fechas
    v_current_date := CURRENT_DATE;
    v_end_date := CURRENT_DATE + 30; -- 30 días adelante
    
    -- Por cada día
    WHILE v_current_date <= v_end_date LOOP
        -- Obtener día de la semana
        v_day_name := LOWER(TO_CHAR(v_current_date, 'fmday'));
        
        -- Determinar si está abierto (jueves, viernes, sábado)
        v_is_open := v_day_name IN ('thursday', 'friday', 'saturday', 'jueves', 'viernes', 'sábado');
        v_start_time := '09:00'::time;
        v_end_time := '22:00'::time;
        
        IF v_is_open THEN
            -- Por cada mesa activa
            FOR v_table IN 
                SELECT id, name, capacity 
                FROM tables 
                WHERE restaurant_id = v_restaurant_id AND is_active = true
            LOOP
                v_slot_time := v_start_time;
                
                -- Generar slots del día
                WHILE v_slot_time < v_end_time LOOP
                    v_slot_end := v_slot_time + (v_duration || ' minutes')::interval;
                    
                    -- Solo si el slot completo cabe en el horario
                    IF v_slot_end <= v_end_time THEN
                        INSERT INTO availability_slots (
                            restaurant_id, 
                            table_id, 
                            slot_date, 
                            start_time, 
                            end_time, 
                            duration_minutes,
                            status,
                            is_available,
                            source,
                            created_at
                        ) VALUES (
                            v_restaurant_id,
                            v_table.id,
                            v_current_date,
                            v_slot_time,
                            v_slot_end,
                            v_duration,
                            'available',
                            true,
                            'manual_fix',
                            NOW()
                        );
                        
                        v_slots_created := v_slots_created + 1;
                    END IF;
                    
                    v_slot_time := v_slot_time + (v_duration || ' minutes')::interval;
                END LOOP;
            END LOOP;
        END IF;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    RAISE NOTICE '✅ SLOTS CREADOS: %', v_slots_created;
END $$;

-- 5. VERIFICAR RESULTADO
SELECT 
    'RESULTADO FINAL' as estado,
    COUNT(*) as total_slots,
    COUNT(DISTINCT slot_date) as dias_con_slots,
    COUNT(DISTINCT table_id) as mesas_con_slots,
    MIN(slot_date) as primer_dia,
    MAX(slot_date) as ultimo_dia
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 6. VER EJEMPLO DEL JUEVES 2 DE OCTUBRE
SELECT 
    t.name as mesa,
    COUNT(*) as slots,
    MIN(a.start_time) as primera_hora,
    MAX(a.end_time) as ultima_hora
FROM availability_slots a
JOIN tables t ON t.id = a.table_id
WHERE a.restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND a.slot_date = '2025-10-02'
GROUP BY t.name
ORDER BY t.name;

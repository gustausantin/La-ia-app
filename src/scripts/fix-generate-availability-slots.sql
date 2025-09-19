-- ====================================
-- FIX CRÍTICO: generate_availability_slots
-- Fecha: 19 Septiembre 2025
-- Objetivo: Recrear función que está causando error 500
-- ====================================

-- 1. VERIFICAR SI LA FUNCIÓN EXISTE
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_availability_slots'
AND routine_schema = 'public';

-- 2. ELIMINAR TODAS LAS VERSIONES EXISTENTES
DROP FUNCTION IF EXISTS generate_availability_slots(uuid) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date, integer) CASCADE;
DROP FUNCTION IF EXISTS generate_availability_slots(uuid, date, date, integer, integer) CASCADE;

-- 3. RECREAR FUNCIÓN ULTRA-ROBUSTA
CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loop_date date;
    final_end_date date;
    day_of_week_text text;
    operating_hours jsonb;
    day_schedule jsonb;
    slot_time time;
    end_time time;
    table_record RECORD;
    slots_created integer := 0;
    restaurant_settings jsonb;
    slot_duration_minutes integer := 90;
    horizon_days integer := 30;
BEGIN
    -- Log inicio
    RAISE NOTICE '🚀 INICIANDO generate_availability_slots para restaurant %', p_restaurant_id;
    
    -- Calcular fecha final
    IF p_end_date IS NULL THEN
        final_end_date := p_start_date + INTERVAL '30 days';
    ELSE
        final_end_date := p_end_date;
    END IF;
    
    RAISE NOTICE '📅 Generando desde % hasta %', p_start_date, final_end_date;
    
    -- Obtener configuración del restaurante
    SELECT settings INTO restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF restaurant_settings IS NULL THEN
        RAISE NOTICE '⚠️ No se encontró configuración para restaurant %, usando defaults', p_restaurant_id;
        restaurant_settings := '{
            "operating_hours": {
                "monday": {"open": "12:00", "close": "23:00", "closed": false},
                "tuesday": {"open": "12:00", "close": "23:00", "closed": false},
                "wednesday": {"open": "12:00", "close": "23:00", "closed": false},
                "thursday": {"open": "12:00", "close": "23:00", "closed": false},
                "friday": {"open": "12:00", "close": "23:00", "closed": false},
                "saturday": {"open": "12:00", "close": "23:00", "closed": false},
                "sunday": {"open": "12:00", "close": "23:00", "closed": false}
            },
            "turn_duration_minutes": 90
        }'::jsonb;
    END IF;
    
    -- Extraer duración de turno
    slot_duration_minutes := COALESCE(
        (restaurant_settings->>'turn_duration_minutes')::integer, 
        90
    );
    
    operating_hours := restaurant_settings->'operating_hours';
    
    RAISE NOTICE '⚙️ Duración de turno: % minutos', slot_duration_minutes;
    
    -- Limpiar slots existentes del sistema en el rango
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND slot_date >= p_start_date 
    AND slot_date <= final_end_date
    AND source = 'system';
    
    RAISE NOTICE '🧹 Limpiados slots existentes del sistema';
    
    -- Loop por cada día
    loop_date := p_start_date;
    WHILE loop_date <= final_end_date LOOP
        -- Obtener día de la semana
        day_of_week_text := CASE EXTRACT(DOW FROM loop_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- Obtener horario del día
        day_schedule := operating_hours->day_of_week_text;
        
        -- Solo procesar si el día no está cerrado
        IF day_schedule IS NOT NULL AND (day_schedule->>'closed')::boolean IS NOT TRUE THEN
            -- Extraer horas de apertura y cierre
            slot_time := (day_schedule->>'open')::time;
            end_time := (day_schedule->>'close')::time;
            
            RAISE NOTICE '📅 Procesando % (%) de % a %', loop_date, day_of_week_text, slot_time, end_time;
            
            -- Para cada mesa activa del restaurante
            FOR table_record IN 
                SELECT id, table_number, name, capacity 
                FROM tables 
                WHERE restaurant_id = p_restaurant_id 
                AND is_active = true
            LOOP
                -- Generar slots para esta mesa
                slot_time := (day_schedule->>'open')::time;
                
                WHILE slot_time < end_time LOOP
                    -- Verificar que no haya conflicto con reservas existentes
                    IF NOT EXISTS (
                        SELECT 1 FROM reservations r
                        WHERE r.restaurant_id = p_restaurant_id
                        AND r.table_id = table_record.id
                        AND r.reservation_date = loop_date
                        AND r.reservation_time = slot_time
                        AND r.status IN ('confirmada', 'sentada')
                    ) THEN
                        -- Crear slot si no existe
                        INSERT INTO availability_slots (
                            restaurant_id,
                            table_id,
                            slot_date,
                            start_time,
                            end_time,
                            status,
                            source,
                            metadata
                        ) VALUES (
                            p_restaurant_id,
                            table_record.id,
                            loop_date,
                            slot_time,
                            slot_time + (slot_duration_minutes || ' minutes')::interval,
                            'free',
                            'system',
                            jsonb_build_object(
                                'table_number', table_record.table_number,
                                'table_name', table_record.name,
                                'capacity', table_record.capacity
                            )
                        )
                        ON CONFLICT (restaurant_id, table_id, slot_date, start_time) DO NOTHING;
                        
                        slots_created := slots_created + 1;
                    END IF;
                    
                    -- Avanzar al siguiente slot
                    slot_time := slot_time + (slot_duration_minutes || ' minutes')::interval;
                END LOOP;
            END LOOP;
        ELSE
            RAISE NOTICE '🚫 Día % cerrado, saltando', loop_date;
        END IF;
        
        -- Avanzar al siguiente día
        loop_date := loop_date + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE '✅ COMPLETADO: % slots creados', slots_created;
    
    RETURN slots_created;
END;
$$;

-- 4. VERIFICAR QUE LA FUNCIÓN SE CREÓ CORRECTAMENTE
SELECT 
    'FUNCIÓN CREADA EXITOSAMENTE' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'generate_availability_slots'
AND routine_schema = 'public';

-- 5. HACER PRUEBA RÁPIDA (opcional)
-- SELECT generate_availability_slots(
--     (SELECT id FROM restaurants WHERE owner_id = auth.uid() LIMIT 1),
--     CURRENT_DATE,
--     CURRENT_DATE + INTERVAL '7 days'
-- ) as slots_created;

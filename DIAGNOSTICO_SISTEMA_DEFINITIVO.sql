-- =====================================================
-- DIAGNÓSTICO: POR QUÉ NO SE CREAN SLOTS
-- =====================================================

-- 1. VERIFICAR HORARIOS MIGRADOS
SELECT 
    'HORARIOS_MIGRADOS' as verificacion,
    day_of_week,
    CASE day_of_week 
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes' 
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as dia_nombre,
    is_open,
    open_time,
    close_time
FROM restaurant_operating_hours 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
ORDER BY day_of_week;

-- 2. VERIFICAR TURNOS EXISTENTES
SELECT 
    'TURNOS_EXISTENTES' as verificacion,
    day_of_week,
    name,
    start_time,
    end_time,
    is_active
FROM restaurant_shifts 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
ORDER BY day_of_week, start_time;

-- 3. VERIFICAR EVENTOS ESPECIALES EN EL RANGO
SELECT 
    'EVENTOS_ESPECIALES' as verificacion,
    event_date,
    title,
    is_closed
FROM special_events 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY event_date;

-- 4. VERIFICAR MESAS ACTIVAS
SELECT 
    'MESAS_ACTIVAS' as verificacion,
    COUNT(*) as total_mesas,
    array_agg(id) as mesa_ids
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND is_active = true;

-- 5. VERIFICAR DÍA ESPECÍFICO (HOY)
DO $$
DECLARE
    v_today_dow INTEGER := EXTRACT(DOW FROM CURRENT_DATE);
    v_horario RECORD;
    v_eventos INTEGER;
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO PARA HOY (%)', CURRENT_DATE;
    RAISE NOTICE '   Día de la semana: % (0=domingo)', v_today_dow;
    
    -- Verificar horario de hoy
    SELECT * INTO v_horario
    FROM restaurant_operating_hours 
    WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
    AND day_of_week = v_today_dow;
    
    IF FOUND THEN
        RAISE NOTICE '   Horario encontrado: abierto=%, %-%', 
            v_horario.is_open, v_horario.open_time, v_horario.close_time;
    ELSE
        RAISE NOTICE '   ❌ NO HAY HORARIO CONFIGURADO PARA HOY';
    END IF;
    
    -- Verificar eventos hoy
    SELECT COUNT(*) INTO v_eventos
    FROM special_events 
    WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
    AND event_date = CURRENT_DATE
    AND is_closed = true;
    
    IF v_eventos > 0 THEN
        RAISE NOTICE '   ❌ HAY % EVENTOS QUE CIERRAN HOY', v_eventos;
    ELSE
        RAISE NOTICE '   ✅ No hay eventos que cierren hoy';
    END IF;
END $$;

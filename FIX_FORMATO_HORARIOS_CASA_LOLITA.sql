-- =====================================================
-- FIX: VERIFICAR Y CORREGIR FORMATO DE HORARIOS
-- =====================================================

-- 1. VER EL FORMATO ACTUAL DE LOS HORARIOS (RAW)
SELECT 
    settings->'operating_hours' as horarios_raw
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 2. VERIFICAR SI ALGÚN DÍA ESTÁ REALMENTE ABIERTO
SELECT 
    'Problema detectado' as diagnostico,
    CASE 
        WHEN settings->'operating_hours' IS NULL THEN 'NO HAY HORARIOS'
        WHEN settings->'operating_hours'->'friday' IS NULL THEN 'FORMATO INCORRECTO - No hay campo friday'
        WHEN (settings->'operating_hours'->'friday'->>'open')::text = 'true' THEN 'Viernes está abierto'
        ELSE 'Viernes está cerrado o formato incorrecto'
    END as estado_viernes
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 3. CONTAR MESAS ACTIVAS (CONFIRMACIÓN)
SELECT COUNT(*) as mesas_activas
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND is_active = true;

-- 4. VER ESTRUCTURA EXACTA DEL CAMPO FRIDAY
SELECT 
    jsonb_typeof(settings->'operating_hours') as tipo_horarios,
    jsonb_typeof(settings->'operating_hours'->'friday') as tipo_friday,
    settings->'operating_hours'->'friday' as friday_completo
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 5. ACTUALIZAR HORARIOS AL FORMATO CORRECTO
-- Si los horarios están mal formateados, ejecuta esto:
UPDATE restaurants 
SET settings = jsonb_set(
    settings,
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
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 6. VERIFICAR QUE SE ACTUALIZÓ
SELECT 
    'Jueves' as dia,
    (settings->'operating_hours'->'thursday'->>'open')::boolean as abierto,
    settings->'operating_hours'->'thursday'->>'start' as inicio,
    settings->'operating_hours'->'thursday'->>'end' as fin
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 
    'Viernes',
    (settings->'operating_hours'->'friday'->>'open')::boolean,
    settings->'operating_hours'->'friday'->>'start',
    settings->'operating_hours'->'friday'->>'end'
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 
    'Sábado',
    (settings->'operating_hours'->'saturday'->>'open')::boolean,
    settings->'operating_hours'->'saturday'->>'start',
    settings->'operating_hours'->'saturday'->>'end'
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 7. AHORA SÍ, GENERAR SLOTS
SELECT generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 30
) as resultado_final;

-- 8. VERIFICAR QUE SE CREARON
SELECT 
    COUNT(*) as slots_creados,
    MIN(slot_date) as desde,
    MAX(slot_date) as hasta
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 9. VER ALGUNOS EJEMPLOS
SELECT 
    slot_date,
    COUNT(*) as slots_por_dia,
    MIN(start_time) as primera_hora,
    MAX(end_time) as ultima_hora
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
GROUP BY slot_date
ORDER BY slot_date
LIMIT 7;

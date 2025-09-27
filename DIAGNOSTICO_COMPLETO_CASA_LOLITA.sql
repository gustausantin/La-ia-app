-- =====================================================
-- DIAGNÓSTICO COMPLETO PARA CASA LOLITA
-- =====================================================

-- 1. VER RESULTADO DE LA FUNCIÓN (con más detalle)
SELECT generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    '2025-10-01'::date,  -- Fecha específica
    '2025-10-07'::date   -- Una semana
) as resultado_generacion;

-- 2. VERIFICAR MESAS (CRÍTICO)
SELECT 
    'TOTAL MESAS' as tipo,
    COUNT(*) as cantidad
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 
    'MESAS ACTIVAS' as tipo,
    COUNT(*) as cantidad
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND is_active = true;

-- 3. VER TODAS LAS MESAS EN DETALLE
SELECT 
    id,
    name,
    capacity,
    is_active,
    zone
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
ORDER BY name;

-- 4. VERIFICAR HORARIOS (CRÍTICO)
SELECT 
    jsonb_pretty(settings->'operating_hours') as horarios
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 5. VERIFICAR CADA DÍA SI ESTÁ ABIERTO
SELECT 
    'Lunes' as dia,
    (settings->'operating_hours'->'monday'->>'open')::boolean as abierto,
    settings->'operating_hours'->'monday'->>'start' as hora_inicio,
    settings->'operating_hours'->'monday'->>'end' as hora_fin
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Martes', 
    (settings->'operating_hours'->'tuesday'->>'open')::boolean,
    settings->'operating_hours'->'tuesday'->>'start',
    settings->'operating_hours'->'tuesday'->>'end'
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Miércoles',
    (settings->'operating_hours'->'wednesday'->>'open')::boolean,
    settings->'operating_hours'->'wednesday'->>'start',
    settings->'operating_hours'->'wednesday'->>'end'
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Jueves',
    (settings->'operating_hours'->'thursday'->>'open')::boolean,
    settings->'operating_hours'->'thursday'->>'start',
    settings->'operating_hours'->'thursday'->>'end'
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Viernes',
    (settings->'operating_hours'->'friday'->>'open')::boolean,
    settings->'operating_hours'->'friday'->>'start',
    settings->'operating_hours'->'friday'->>'end'
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Sábado',
    (settings->'operating_hours'->'saturday'->>'open')::boolean,
    settings->'operating_hours'->'saturday'->>'start',
    settings->'operating_hours'->'saturday'->>'end'
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Domingo',
    (settings->'operating_hours'->'sunday'->>'open')::boolean,
    settings->'operating_hours'->'sunday'->>'start',
    settings->'operating_hours'->'sunday'->>'end'
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 6. VERIFICAR POLÍTICA DE RESERVAS
SELECT 
    settings->'reservation_policy'->>'reservation_duration' as duracion_minutos,
    settings->'reservation_policy'->>'advance_booking_days' as dias_anticipacion,
    settings->'reservation_policy'->>'min_party_size' as min_personas,
    settings->'reservation_policy'->>'max_party_size' as max_personas
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 7. SI NO HAY MESAS, CREAR MESAS DE PRUEBA
-- DESCOMENTA ESTAS LÍNEAS SI NO TIENES MESAS
/*
INSERT INTO tables (restaurant_id, name, capacity, zone, is_active)
VALUES 
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 1', 4, 'Salón Principal', true),
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 2', 4, 'Salón Principal', true),
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 3', 2, 'Barra', true),
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 4', 6, 'Terraza', true),
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 5', 4, 'Terraza', true),
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 6', 8, 'Privado', true),
    ('69726b25-d3e9-4b9c-bc05-610e70ed2c4f', 'Mesa 7', 2, 'Barra', true);
*/

-- 8. VERIFICAR SI HAY ALGÚN ERROR EN LOS LOGS
-- Esto mostrará si la función está fallando silenciosamente
SELECT generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 1  -- Solo 1 día para ver el detalle
) as resultado_un_dia;

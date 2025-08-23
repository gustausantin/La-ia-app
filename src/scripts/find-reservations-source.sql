-- 🔍 ENCONTRAR DE DÓNDE VIENEN LAS 12 RESERVAS

-- Ver si hay datos reales en reservations
SELECT COUNT(*) as total_reservations FROM reservations;

-- Ver todas las reservas
SELECT * FROM reservations ORDER BY created_at DESC;

-- Buscar función create_restaurant_securely
SELECT 
    'FUNCIÓN: create_restaurant_securely' as titulo,
    routine_definition as codigo
FROM information_schema.routines 
WHERE routine_name = 'create_restaurant_securely';

-- Buscar cualquier función que mencione reservations
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%reservations%'
   OR routine_definition ILIKE '%INSERT INTO%reservation%';

-- Buscar triggers en reservations
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'reservations';

-- =====================================================
-- VERIFICACIÓN REAL DE AVAILABILITY_SLOTS
-- Contar exactamente lo que hay en Supabase
-- =====================================================

-- 1. CONTAR TOTAL DE SLOTS POR RESTAURANTE
SELECT 
    'TOTAL SLOTS CREADOS' as tipo,
    COUNT(*) as cantidad,
    MIN(slot_date) as fecha_inicio,
    MAX(slot_date) as fecha_fin
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 2. CONTAR POR STATUS
SELECT 
    'POR STATUS' as tipo,
    status,
    COUNT(*) as cantidad
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
GROUP BY status
ORDER BY cantidad DESC;

-- 3. CONTAR POR is_available
SELECT 
    'POR DISPONIBILIDAD' as tipo,
    is_available,
    COUNT(*) as cantidad
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
GROUP BY is_available;

-- 4. CONTAR POR FECHA (últimos días)
SELECT 
    'POR FECHA' as tipo,
    slot_date,
    COUNT(*) as slots_por_dia
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date >= CURRENT_DATE
GROUP BY slot_date
ORDER BY slot_date
LIMIT 20;

-- 5. CONTAR POR MESA
SELECT 
    'POR MESA' as tipo,
    table_id,
    COUNT(*) as slots_por_mesa
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date >= CURRENT_DATE
GROUP BY table_id
ORDER BY slots_por_mesa DESC;

-- 6. VERIFICAR ESTRUCTURA DE DATOS
SELECT 
    'MUESTRA DE DATOS' as tipo,
    slot_date,
    start_time,
    end_time,
    status,
    is_available,
    table_id
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date >= CURRENT_DATE
ORDER BY slot_date, start_time
LIMIT 10;

-- 7. RESUMEN FINAL
SELECT 
    'RESUMEN FINAL' as tipo,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_available = true THEN 1 END) as disponibles,
    COUNT(CASE WHEN is_available = false THEN 1 END) as ocupados,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as status_available,
    COUNT(CASE WHEN status = 'reserved' THEN 1 END) as status_reserved,
    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as status_occupied
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date >= CURRENT_DATE;

-- =====================================================
-- DEBUG: VERIFICAR DISPONIBILIDADES GENERADAS
-- =====================================================

-- 1. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'availability_slots'
ORDER BY ordinal_position;

-- 2. Contar slots totales por fecha
SELECT 
    slot_date,
    COUNT(*) as total_slots,
    COUNT(DISTINCT table_id) as mesas,
    MIN(start_time) as primera_hora,
    MAX(end_time) as ultima_hora
FROM availability_slots
WHERE slot_date >= CURRENT_DATE
GROUP BY slot_date
ORDER BY slot_date
LIMIT 10;

-- 3. Ver algunos slots de ejemplo del 2 de octubre 2025
SELECT 
    id,
    restaurant_id,
    table_id,
    slot_date,
    start_time,
    end_time,
    CASE 
        WHEN status IS NOT NULL THEN 'status=' || status
        WHEN is_available IS NOT NULL THEN 'is_available=' || is_available::text
        ELSE 'sin_estado'
    END as estado_slot,
    source
FROM availability_slots
WHERE slot_date = '2025-10-02'
LIMIT 20;

-- 4. Ver TODOS los restaurant_id que tienen slots
SELECT DISTINCT
    restaurant_id,
    COUNT(*) as total_slots,
    MIN(slot_date) as primera_fecha,
    MAX(slot_date) as ultima_fecha
FROM availability_slots
GROUP BY restaurant_id;

-- 4b. Buscar tu restaurante por nombre (más fácil)
SELECT 
    r.id as restaurant_id,
    r.name as nombre_restaurante,
    COUNT(a.id) as total_slots
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
GROUP BY r.id, r.name;

-- 5. Ver estructura y primeros registros
SELECT * FROM availability_slots 
ORDER BY created_at DESC 
LIMIT 5;

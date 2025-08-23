-- 🔍 ENCONTRAR EL CULPABLE DE LAS 12 RESERVAS

-- =========================================
-- VER DATOS ACTUALES EN RESERVATIONS
-- =========================================

SELECT 'DATOS ACTUALES EN RESERVATIONS:' as info;

SELECT 
    id,
    restaurant_id,
    customer_name,
    date,
    time,
    party_size,
    status,
    source,
    created_at
FROM reservations 
ORDER BY created_at DESC;

-- =========================================
-- CONTAR RESERVAS POR RESTAURANT
-- =========================================

SELECT 
    'CONTEO POR RESTAURANT:' as info,
    restaurant_id,
    COUNT(*) as total_reservations
FROM reservations 
GROUP BY restaurant_id;

-- =========================================
-- FUNCIÓN SOSPECHOSA: create_default_restaurant
-- =========================================

SELECT 
    'FUNCIÓN: create_default_restaurant' as titulo,
    routine_definition as codigo
FROM information_schema.routines 
WHERE routine_name = 'create_default_restaurant';

-- =========================================
-- FUNCIÓN: create_restaurant_securely  
-- =========================================

SELECT 
    'FUNCIÓN: create_restaurant_securely' as titulo,
    routine_definition as codigo
FROM information_schema.routines 
WHERE routine_name = 'create_restaurant_securely';

-- =========================================
-- VERIFICAR TRIGGERS
-- =========================================

SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%reservation%'
   OR action_statement ILIKE '%customer%';

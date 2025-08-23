-- 🔍 INSPECCIONAR LAS FUNCIONES SOSPECHOSAS

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
-- VERIFICAR SI HAY TRIGGERS QUE CREAN DATOS
-- =========================================

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%reservation%'
   OR action_statement ILIKE '%customer%'
   OR action_statement ILIKE '%sample%'
   OR action_statement ILIKE '%example%';

-- =========================================
-- VERIFICAR DATOS ACTUALES EN RESERVATIONS
-- =========================================

SELECT 'DATOS ACTUALES EN RESERVATIONS:' as info;

-- Primero ver qué columnas existen realmente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- Luego ver los datos (usando solo columnas básicas)
SELECT *
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

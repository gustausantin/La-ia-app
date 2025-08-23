-- 🔍 VERIFICACIÓN COMPLETA: Estado CERO de la aplicación
-- Ejecutar en Supabase SQL Editor para confirmar que NO HAY DATOS

-- =========================================
-- VERIFICAR ESTADO COMPLETAMENTE LIMPIO
-- =========================================

SELECT '🔍 VERIFICACIÓN DE ESTADO LIMPIO' as info;

-- Contar todos los datos que deberían estar en CERO
SELECT 
    'RESERVATIONS' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ LIMPIO' 
        ELSE '❌ TIENE DATOS' 
    END as estado
FROM reservations
UNION ALL
SELECT 
    'CUSTOMERS' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ LIMPIO' 
        ELSE '❌ TIENE DATOS' 
    END as estado
FROM customers  
UNION ALL
SELECT 
    'TABLES' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ LIMPIO' 
        ELSE '❌ TIENE DATOS' 
    END as estado
FROM tables
UNION ALL
SELECT 
    'ANALYTICS' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ LIMPIO' 
        ELSE '❌ TIENE DATOS' 
    END as estado
FROM analytics;

-- =========================================
-- VERIFICAR DATOS DE USUARIO (DEBEN EXISTIR)
-- =========================================

SELECT '👤 DATOS DE USUARIO (ESTOS SÍ DEBEN EXISTIR)' as info;

SELECT 
    'AUTH.USERS' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USUARIOS EXISTEN' 
        ELSE '❌ NO HAY USUARIOS' 
    END as estado
FROM auth.users
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'PROFILES' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PERFILES EXISTEN' 
        ELSE '❌ NO HAY PERFILES' 
    END as estado
FROM profiles
UNION ALL
SELECT 
    'RESTAURANTS' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ RESTAURANTS EXISTEN' 
        ELSE '❌ NO HAY RESTAURANTS' 
    END as estado
FROM restaurants
UNION ALL
SELECT 
    'USER_RESTAURANT_MAPPING' as tabla, 
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ MAPPINGS EXISTEN' 
        ELSE '❌ NO HAY MAPPINGS' 
    END as estado
FROM user_restaurant_mapping;

-- =========================================
-- MOSTRAR DETALLES DE USUARIO ACTUAL
-- =========================================

SELECT '📋 DETALLES DE TU USUARIO ACTUAL' as info;

SELECT 
    u.email,
    u.email_confirmed_at,
    r.name as restaurant_name,
    r.city,
    r.plan,
    r.active,
    p.full_name
FROM auth.users u
LEFT JOIN user_restaurant_mapping urm ON u.id = urm.auth_user_id
LEFT JOIN restaurants r ON urm.restaurant_id = r.id
LEFT JOIN profiles p ON u.id = p.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC;

-- =========================================
-- VERIFICACIÓN FINAL
-- =========================================

SELECT '🎯 RESUMEN FINAL' as info;

WITH data_counts AS (
    SELECT 
        (SELECT COUNT(*) FROM reservations) as reservations_count,
        (SELECT COUNT(*) FROM customers) as customers_count,
        (SELECT COUNT(*) FROM tables) as tables_count,
        (SELECT COUNT(*) FROM analytics) as analytics_count,
        (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as users_count,
        (SELECT COUNT(*) FROM restaurants) as restaurants_count
)
SELECT 
    CASE 
        WHEN reservations_count = 0 
         AND customers_count = 0 
         AND tables_count = 0 
         AND analytics_count = 0 
         AND users_count > 0 
         AND restaurants_count > 0
        THEN '🎉 PERFECTO: Estado limpio con usuario listo'
        WHEN reservations_count > 0 OR customers_count > 0 OR tables_count > 0 OR analytics_count > 0
        THEN '⚠️ ADVERTENCIA: Aún hay datos ficticios'
        WHEN users_count = 0 OR restaurants_count = 0
        THEN '❌ ERROR: Faltan datos de usuario/restaurant'
        ELSE '🤔 ESTADO DESCONOCIDO'
    END as estado_final,
    reservations_count,
    customers_count,
    tables_count,
    analytics_count,
    users_count,
    restaurants_count
FROM data_counts;

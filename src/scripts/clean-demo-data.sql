-- 🧹 LIMPIAR DATOS DE EJEMPLO DE LA BASE DE DATOS
-- Ejecutar en Supabase SQL Editor para tener una base limpia

-- =========================================
-- LIMPIAR DATOS DE EJEMPLO
-- =========================================

-- Verificar qué datos tenemos antes de limpiar
SELECT 'ANTES DE LIMPIAR - DATOS EXISTENTES' as info;

SELECT 'RESERVATIONS:' as tabla, COUNT(*) as cantidad FROM reservations
UNION ALL
SELECT 'CUSTOMERS:' as tabla, COUNT(*) as cantidad FROM customers  
UNION ALL
SELECT 'TABLES:' as tabla, COUNT(*) as cantidad FROM tables
UNION ALL
SELECT 'ANALYTICS:' as tabla, COUNT(*) as cantidad FROM analytics;

-- Mostrar las reservas que se van a eliminar
SELECT 'RESERVAS QUE SE VAN A ELIMINAR:' as info;
SELECT 
    r.customer_name,
    r.reservation_date,
    r.reservation_time,
    r.party_size,
    r.source,
    r.channel,
    rest.name as restaurant_name
FROM reservations r
JOIN restaurants rest ON r.restaurant_id = rest.id;

-- =========================================
-- ELIMINAR DATOS DE EJEMPLO
-- =========================================

-- Eliminar en orden correcto (respetando foreign keys)
DELETE FROM analytics;
DELETE FROM reservations;
DELETE FROM customers;
DELETE FROM tables;

-- =========================================
-- VERIFICAR LIMPIEZA
-- =========================================

SELECT 'DESPUÉS DE LIMPIAR - VERIFICACIÓN' as info;

SELECT 'RESERVATIONS:' as tabla, COUNT(*) as cantidad FROM reservations
UNION ALL
SELECT 'CUSTOMERS:' as tabla, COUNT(*) as cantidad FROM customers  
UNION ALL
SELECT 'TABLES:' as tabla, COUNT(*) as cantidad FROM tables
UNION ALL
SELECT 'ANALYTICS:' as tabla, COUNT(*) as cantidad FROM analytics;

-- =========================================
-- RESETEAR SECUENCIAS (si existen)
-- =========================================

-- Nota: UUID no necesita reset, pero por si acaso hay algún SERIAL
-- ALTER SEQUENCE IF EXISTS reservations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS tables_id_seq RESTART WITH 1;

RAISE NOTICE '🧹 BASE DE DATOS LIMPIADA - Sin datos de ejemplo';
RAISE NOTICE '✅ Ahora la aplicación mostrará solo datos reales del usuario';

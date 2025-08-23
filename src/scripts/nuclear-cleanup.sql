-- 🔥 LIMPIEZA NUCLEAR - ELIMINAR TODO RASTRO DE DATOS
-- Esto borrará ABSOLUTAMENTE TODO

-- Eliminar todos los datos de todas las tablas operacionales
TRUNCATE TABLE analytics RESTART IDENTITY CASCADE;
TRUNCATE TABLE reservations RESTART IDENTITY CASCADE;
TRUNCATE TABLE customers RESTART IDENTITY CASCADE;
TRUNCATE TABLE tables RESTART IDENTITY CASCADE;

-- Verificar que TODO esté a CERO
SELECT 
    'VERIFICACIÓN FINAL:' as estado,
    (SELECT COUNT(*) FROM reservations) as reservations,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM tables) as tables,
    (SELECT COUNT(*) FROM analytics) as analytics;

-- Si aún hay datos, mostrarlos
SELECT 'RESERVAS QUE QUEDAN:' as info;
SELECT * FROM reservations;

SELECT 'CUSTOMERS QUE QUEDAN:' as info;
SELECT * FROM customers;

SELECT 'TABLAS QUE QUEDAN:' as info;
SELECT * FROM tables;

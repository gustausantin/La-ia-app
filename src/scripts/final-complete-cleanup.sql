-- 🧹 LIMPIEZA COMPLETA Y DEFINITIVA
-- Eliminar TODOS los datos reales de las tablas y crear esquema correcto

-- =========================================
-- ELIMINAR TODOS LOS DATOS EXISTENTES
-- =========================================

-- Primero, eliminar todos los datos (EN ORDEN para respetar foreign keys)
DELETE FROM analytics;
DELETE FROM reservations;
DELETE FROM customers;
DELETE FROM tables;

-- Mensaje de confirmación
SELECT '🧹 Todos los datos eliminados de tablas operacionales' as resultado;

-- =========================================
-- VERIFICAR ESQUEMA DE RESERVATIONS
-- =========================================

-- Ver columnas actuales de reservations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- =========================================
-- ARREGLAR ESQUEMA PARA COMPATIBILIDAD
-- =========================================

-- Si existe 'date' pero no 'reservation_date', añadir reservation_date
DO $$
BEGIN
    -- Verificar si existe la columna reservation_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_date'
    ) THEN
        -- Añadir reservation_date como alias/copia de date
        ALTER TABLE reservations ADD COLUMN reservation_date DATE;
        
        -- Si hay datos, copiar de date a reservation_date
        UPDATE reservations SET reservation_date = date WHERE date IS NOT NULL;
        
        -- Columna añadida
        NULL;
    ELSE
        -- Columna ya existe
        NULL;
    END IF;
END $$;

-- Si existe 'time' pero no 'reservation_time', añadir reservation_time
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_time'
    ) THEN
        ALTER TABLE reservations ADD COLUMN reservation_time TIME;
        UPDATE reservations SET reservation_time = time WHERE time IS NOT NULL;
        -- Columna añadida
        NULL;
    ELSE
        -- Columna ya existe
        NULL;
    END IF;
END $$;

-- =========================================
-- VERIFICACIÓN FINAL
-- =========================================

-- Contar registros (deben ser 0)
SELECT 
    'RESERVATIONS' as tabla, COUNT(*) as cantidad FROM reservations
UNION ALL
SELECT 
    'CUSTOMERS' as tabla, COUNT(*) as cantidad FROM customers
UNION ALL
SELECT 
    'TABLES' as tabla, COUNT(*) as cantidad FROM tables
UNION ALL
SELECT 
    'ANALYTICS' as tabla, COUNT(*) as cantidad FROM analytics;

-- Verificar esquema de reservations
SELECT 
    'ESQUEMA RESERVATIONS:' as info,
    string_agg(column_name || ':' || data_type, ', ') as columnas
FROM information_schema.columns 
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- Mensajes finales
SELECT '🎉 LIMPIEZA COMPLETA TERMINADA' as estado;
SELECT '✅ Base de datos a CERO con esquema compatible' as confirmacion;
SELECT '🚀 Aplicación lista para datos reales' as resultado_final;

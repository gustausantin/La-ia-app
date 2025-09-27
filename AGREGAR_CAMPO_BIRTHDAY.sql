-- =====================================================
-- SCRIPT PARA AGREGAR CAMPO DE CUMPLEAÑOS
-- =====================================================
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- 1. Agregar campo birthday a la tabla customers si no existe
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS birthday DATE DEFAULT NULL;

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN customers.birthday IS 'Fecha de cumpleaños del cliente';

-- 3. Crear índice para búsquedas eficientes por mes/día de cumpleaños
CREATE INDEX IF NOT EXISTS idx_customers_birthday_month_day 
ON customers (EXTRACT(MONTH FROM birthday), EXTRACT(DAY FROM birthday))
WHERE birthday IS NOT NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que el campo se agregó correctamente:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'customers' AND column_name = 'birthday';

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================
-- Buscar clientes que cumplen años hoy:
-- SELECT * FROM customers 
-- WHERE EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE) 
-- AND EXTRACT(DAY FROM birthday) = EXTRACT(DAY FROM CURRENT_DATE);

-- Buscar clientes que cumplen años en octubre:
-- SELECT * FROM customers 
-- WHERE EXTRACT(MONTH FROM birthday) = 10;

-- Buscar clientes que cumplen años esta semana:
-- SELECT * FROM customers 
-- WHERE birthday IS NOT NULL
-- AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
-- AND EXTRACT(DAY FROM birthday) BETWEEN EXTRACT(DAY FROM CURRENT_DATE) 
-- AND EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days');

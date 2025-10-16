-- ⚠️ EMERGENCY: Borrar TODOS los clientes duplicados
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar cuántos clientes hay
SELECT COUNT(*) as total_customers FROM customers;

-- 2. Ver cuántos duplicados hay por teléfono
SELECT 
  phone, 
  COUNT(*) as duplicates,
  restaurant_id
FROM customers
GROUP BY phone, restaurant_id
HAVING COUNT(*) > 1
ORDER BY duplicates DESC
LIMIT 20;

-- 3. BORRAR TODOS LOS CLIENTES (CUIDADO - IRREVERSIBLE)
-- DESCOMENTA LA SIGUIENTE LÍNEA SOLO SI ESTÁS SEGURO:
-- DELETE FROM customers WHERE TRUE;

-- 4. BORRAR DUPLICADOS - MÉTODO AGRESIVO (183K duplicados)
-- Opción A: Borrar TODO y empezar de cero (RECOMENDADO si los datos no son críticos)
-- DELETE FROM customers WHERE TRUE;

-- Opción B: Mantener solo el MÁS ANTIGUO por phone + restaurant_id
WITH ranked_customers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY phone, restaurant_id 
      ORDER BY created_at ASC
    ) as rn
  FROM customers
)
DELETE FROM customers
WHERE id IN (
  SELECT id 
  FROM ranked_customers 
  WHERE rn > 1
);

-- 5. Verificar que quedó solo 1 por teléfono
SELECT 
  phone, 
  COUNT(*) as count,
  restaurant_id
FROM customers
GROUP BY phone, restaurant_id
HAVING COUNT(*) > 1;

-- 6. CREAR CONSTRAINT UNIQUE para evitar duplicados
ALTER TABLE customers
ADD CONSTRAINT customers_phone_restaurant_unique 
UNIQUE (phone, restaurant_id);


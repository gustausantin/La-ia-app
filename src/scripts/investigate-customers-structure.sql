-- =========================================
-- INVESTIGAR ESTRUCTURA REAL DE CUSTOMERS
-- =========================================

-- 1. Ver columnas de la tabla customers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. Ver algunos registros existentes
SELECT * FROM customers LIMIT 3;

-- 3. Ver nombres de clientes existentes
SELECT 
    id,
    name,
    phone,
    email
FROM customers 
WHERE name IS NOT NULL
LIMIT 10;

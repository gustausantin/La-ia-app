-- ========================================
-- DIAGNÓSTICO: Campo BIRTHDAY en Customers
-- ========================================

-- 1️⃣ VERIFICAR: ¿Cuántos clientes tienen birthday guardado?
SELECT 
    COUNT(*) as total_clientes,
    COUNT(birthday) as clientes_con_birthday,
    COUNT(*) - COUNT(birthday) as clientes_sin_birthday
FROM customers;

-- 2️⃣ LISTAR: Clientes SIN birthday
SELECT 
    id,
    name,
    first_name,
    last_name1,
    phone,
    email,
    birthday,
    created_at
FROM customers
WHERE birthday IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3️⃣ LISTAR: Clientes CON birthday (para confirmar que el campo funciona)
SELECT 
    id,
    name,
    first_name,
    last_name1,
    phone,
    birthday,
    created_at
FROM customers
WHERE birthday IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 4️⃣ VERIFICAR: ¿El campo birthday existe en la tabla?
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customers' 
AND column_name = 'birthday';

-- 5️⃣ VERIFICAR: Estructura completa de la tabla customers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

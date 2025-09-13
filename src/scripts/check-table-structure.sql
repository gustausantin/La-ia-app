-- 🔍 VERIFICAR ESTRUCTURA REAL DE LA TABLA RESTAURANTS

-- 1. VER TODAS LAS COLUMNAS DE LA TABLA RESTAURANTS
SELECT 'COLUMNAS DE RESTAURANTS:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VER ESTRUCTURA COMPLETA
SELECT 'ESTRUCTURA COMPLETA:' as info;
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('restaurants', 'user_restaurant_mapping')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. VERIFICAR SI EXISTE LA TABLA
SELECT 'TABLAS EXISTENTES:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%restaurant%';

-- 4. VER CONSTRAINTS
SELECT 'CONSTRAINTS:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'restaurants';

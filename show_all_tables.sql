-- SCRIPT PARA VER TODAS LAS TABLAS Y SU ESTRUCTURA
-- Ejecutar en SQL Editor de Supabase

-- 1. LISTAR TODAS LAS TABLAS
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VER ESTRUCTURA DE CADA TABLA (COLUMNAS)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. VER TABLAS CON NÚMERO DE REGISTROS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. LISTAR TODAS LAS FUNCIONES
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 5. VER RELACIONES ENTRE TABLAS (FOREIGN KEYS)
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema='public'
ORDER BY tc.table_name;

-- Script completo para analizar toda la base de datos y encontrar dónde están los horarios

-- 1. LISTAR TODAS LAS TABLAS
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. MOSTRAR ESTRUCTURA DE CADA TABLA RELEVANTE
SELECT 'TABLA: restaurants' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TABLA: tables' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tables' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TABLA: reservations' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TABLA: customers' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TABLA: availability_slots' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'availability_slots' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. BUSCAR TABLAS QUE PUEDAN CONTENER HORARIOS O CALENDARIO
SELECT 'BUSCANDO TABLAS CON HORARIOS/CALENDARIO' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (
    column_name ILIKE '%schedule%' OR
    column_name ILIKE '%hours%' OR
    column_name ILIKE '%time%' OR
    column_name ILIKE '%calendar%' OR
    column_name ILIKE '%shift%' OR
    column_name ILIKE '%operating%' OR
    column_name ILIKE '%open%' OR
    column_name ILIKE '%close%'
)
ORDER BY table_name, column_name;

-- 4. VERIFICAR SI HAY OTRAS TABLAS RELACIONADAS CON HORARIOS
SELECT 'TODAS LAS TABLAS DE LA BASE DE DATOS' as info;
SELECT 
    t.table_name,
    string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- 5. DATOS ACTUALES DEL RESTAURANTE (SIN SETTINGS PARA VER QUE MÁS HAY)
SELECT 'DATOS DEL RESTAURANTE (SIN SETTINGS)' as info;
SELECT 
    id,
    name,
    email,
    phone,
    address,
    created_at,
    updated_at
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 6. BUSCAR EN TODAS LAS TABLAS DATOS RELACIONADOS CON ESTE RESTAURANTE
SELECT 'DATOS EN TABLES' as info;
SELECT * FROM tables WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';

SELECT 'DATOS EN RESERVATIONS (PRIMERAS 5)' as info;
SELECT * FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be' 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'DATOS EN CUSTOMERS (PRIMERAS 5)' as info;
SELECT * FROM customers 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be' 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. VERIFICAR SI HAY FUNCIONES RELACIONADAS CON HORARIOS
SELECT 'FUNCIONES DE LA BASE DE DATOS' as info;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name ILIKE '%availability%' OR routine_name ILIKE '%schedule%' OR routine_name ILIKE '%hours%';

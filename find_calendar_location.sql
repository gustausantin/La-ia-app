-- Script específico para encontrar dónde están los horarios del calendario

-- 1. BUSCAR EN TODAS LAS TABLAS CUALQUIER REFERENCIA A HORARIOS
SELECT 'BUSCANDO COLUMNAS CON HORARIOS' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
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
    column_name ILIKE '%close%' OR
    column_name ILIKE '%day%' OR
    column_name ILIKE '%week%'
)
ORDER BY table_name, column_name;

-- 2. VERIFICAR SI HAY UNA TABLA ESPECÍFICA PARA HORARIOS
SELECT 'TODAS LAS TABLAS EXISTENTES' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. BUSCAR EN EL SETTINGS DEL RESTAURANTE ALGO RELACIONADO CON OPERATING_HOURS
SELECT 'CONTENIDO COMPLETO DE SETTINGS' as section;
SELECT 
    id,
    name,
    jsonb_pretty(settings) as settings_formatted
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 4. VERIFICAR SI HAY DATOS EN JSONB QUE CONTENGAN HORARIOS
SELECT 'BUSCANDO OPERATING_HOURS EN SETTINGS' as section;
SELECT 
    id,
    name,
    settings->'operating_hours' as operating_hours,
    settings->'schedule' as schedule,
    settings->'hours' as hours,
    settings->'shifts' as shifts
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 5. BUSCAR SI HAY ALGUNA TABLA RELACIONADA CON ESTE RESTAURANTE
SELECT 'TABLAS QUE PUEDEN TENER DATOS DEL RESTAURANTE' as section;

-- Verificar si existe tabla de horarios
SELECT 'Verificando tabla restaurant_hours' as info;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'restaurant_hours' 
    AND table_schema = 'public'
) as table_exists;

-- Verificar si existe tabla de schedules
SELECT 'Verificando tabla schedules' as info;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'schedules' 
    AND table_schema = 'public'
) as table_exists;

-- Verificar si existe tabla operating_hours
SELECT 'Verificando tabla operating_hours' as info;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'operating_hours' 
    AND table_schema = 'public'
) as table_exists;

-- 6. BUSCAR CUALQUIER REFERENCIA A CALENDARIO EN EL FRONTEND
-- Esto nos ayudará a entender cómo se almacenan los datos
SELECT 'ESTRUCTURA DE TODAS LAS TABLAS CON RESTAURANT_ID' as section;

-- Ver qué tablas tienen restaurant_id
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'restaurant_id'
ORDER BY table_name;

-- 7. VERIFICAR SI LOS HORARIOS ESTÁN EN UNA ESTRUCTURA DIFERENTE EN SETTINGS
SELECT 'EXPLORANDO CLAVES EN SETTINGS JSONB' as section;
SELECT 
    id,
    name,
    jsonb_object_keys(settings) as settings_keys
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 8. ÚLTIMO RECURSO: VER TODO EL CONTENIDO DE SETTINGS SIN FORMATO
SELECT 'SETTINGS RAW DATA' as section;
SELECT 
    id,
    name,
    settings
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

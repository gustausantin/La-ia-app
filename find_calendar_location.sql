-- BÚSQUEDA COMPLETA DE INFORMACIÓN DEL CALENDARIO
-- Ejecutar en Supabase SQL Editor

-- 1. BUSCAR TODAS LAS COLUMNAS QUE CONTENGAN PALABRAS RELACIONADAS CON CALENDARIO
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE 
    column_name ILIKE '%schedule%' OR
    column_name ILIKE '%calendar%' OR
    column_name ILIKE '%hours%' OR
    column_name ILIKE '%shift%' OR
    column_name ILIKE '%operating%' OR
    column_name ILIKE '%open%' OR
    column_name ILIKE '%close%' OR
    column_name ILIKE '%time%'
ORDER BY table_name, column_name;

-- 2. BUSCAR TODAS LAS TABLAS QUE PUEDAN CONTENER INFORMACIÓN DE HORARIOS
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%schedule%' OR
    table_name ILIKE '%calendar%' OR
    table_name ILIKE '%hours%' OR
    table_name ILIKE '%shift%' OR
    table_name ILIKE '%operating%' OR
    table_name ILIKE '%time%'
)
ORDER BY table_name;

-- 3. INSPECCIONAR EL CONTENIDO COMPLETO DE restaurant.settings
SELECT 
    id,
    name,
    jsonb_pretty(settings) as settings_formatted
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 4. EXTRAER TODAS LAS CLAVES DEL JSONB settings
SELECT DISTINCT jsonb_object_keys(settings) as setting_keys
FROM restaurants 
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 5. BUSCAR ESPECÍFICAMENTE POR CLAVES QUE CONTENGAN HORARIOS
SELECT 
    id,
    name,
    key,
    value
FROM restaurants,
     jsonb_each_text(settings)
WHERE id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND (
    key ILIKE '%schedule%' OR
    key ILIKE '%calendar%' OR
    key ILIKE '%hours%' OR
    key ILIKE '%shift%' OR
    key ILIKE '%operating%' OR
    key ILIKE '%open%' OR
    key ILIKE '%close%' OR
    key ILIKE '%time%'
);

-- 6. MOSTRAR TODAS LAS TABLAS Y SUS PRIMEROS REGISTROS PARA INSPECCIÓN
DO $$
DECLARE
    table_record RECORD;
    query_text TEXT;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'TABLA: %', table_record.table_name;
        
        query_text := format('SELECT COUNT(*) as total_records FROM %I', table_record.table_name);
        EXECUTE query_text;
        
        -- Mostrar estructura de la tabla
        FOR table_record IN 
            EXECUTE format('
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = %L 
                ORDER BY ordinal_position', table_record.table_name)
        LOOP
            RAISE NOTICE '  - %: % (%)', table_record.column_name, table_record.data_type, 
                CASE WHEN table_record.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
        END LOOP;
    END LOOP;
END $$;
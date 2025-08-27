-- 📊 REPORTE COMPLETO DE TODAS LAS TABLAS Y COLUMNAS
-- 🎯 Para que el asistente sepa EXACTAMENTE qué existe en Supabase

-- 1. 📋 LISTAR TODAS LAS TABLAS CON CONTEO DE FILAS
SELECT 
    '📊 RESUMEN DE TABLAS:' as report_section,
    schemaname as schema,
    tablename as table_name,
    -- Intentar obtener el conteo (puede fallar con RLS)
    CASE 
        WHEN schemaname = 'public' THEN 'Tabla de la aplicación'
        ELSE 'Tabla del sistema'
    END as table_type
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- 2. 🏗️ ESTRUCTURA DETALLADA DE CADA TABLA PÚBLICA
SELECT 
    '🏗️ ESTRUCTURA DETALLADA:' as report_section,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN '🔑 PRIMARY KEY'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN '🔗 FOREIGN KEY'
        WHEN tc.constraint_type = 'UNIQUE' THEN '✨ UNIQUE'
        ELSE ''
    END as constraints
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
LEFT JOIN information_schema.key_column_usage kcu ON kcu.table_name = t.table_name AND kcu.column_name = c.column_name
LEFT JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. 🔒 ESTADO RLS DE CADA TABLA
SELECT 
    '🔒 ESTADO RLS:' as report_section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '⚠️ SIN RLS (Unrestricted)'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. 📋 POLÍTICAS RLS ACTIVAS
SELECT 
    '📋 POLÍTICAS RLS:' as report_section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. 🔗 FOREIGN KEYS Y RELACIONES
SELECT 
    '🔗 RELACIONES FK:' as report_section,
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_destino,
    ccu.column_name as columna_destino,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 6. 📊 ÍNDICES EXISTENTES
SELECT 
    '📊 ÍNDICES:' as report_section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. 🔧 FUNCIONES RPC DISPONIBLES
SELECT 
    '🔧 FUNCIONES RPC:' as report_section,
    routine_name as function_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 8. 📈 VISTAS EXISTENTES
SELECT 
    '📈 VISTAS:' as report_section,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 9. 🚨 TRIGGERS ACTIVOS
SELECT 
    '🚨 TRIGGERS:' as report_section,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 10. 📊 CONTEO REAL DE REGISTROS (si es posible)
DO $$
DECLARE
    table_record RECORD;
    row_count INTEGER;
    result_text TEXT := '';
BEGIN
    result_text := '📊 CONTEO DE REGISTROS:' || E'\n';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_record.tablename) INTO row_count;
            result_text := result_text || table_record.tablename || ': ' || row_count || ' registros' || E'\n';
        EXCEPTION WHEN OTHERS THEN
            result_text := result_text || table_record.tablename || ': ERROR - ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    RAISE NOTICE '%', result_text;
END $$;

-- INSTRUCCIONES DE USO:
-- 1. Copia TODO este script
-- 2. Pégalo en Supabase SQL Editor
-- 3. Ejecuta todo de una vez
-- 4. Copia TODOS los resultados
-- 5. Pásaselos al asistente para que sepa TODO lo que existe

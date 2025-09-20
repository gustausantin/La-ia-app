-- =========================================
-- EXPORTAR TODO EN UNA SOLA CONSULTA
-- =========================================

-- UNIÓN DE TODA LA INFORMACIÓN EN UNA SOLA QUERY
SELECT 'SECCION_TABLAS' as tipo, 'TABLA: ' || tablename as info
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 'SECCION_COLUMNAS' as tipo, 
       'COLUMNA: ' || table_name || '.' || column_name || 
       ' | TIPO: ' || data_type || 
       ' | NULL: ' || is_nullable || 
       ' | DEFAULT: ' || COALESCE(column_default, 'NULL') as info
FROM information_schema.columns 
WHERE table_schema = 'public'

UNION ALL

SELECT 'SECCION_PKS' as tipo, 
       'PK: ' || tc.table_name || ' -> ' || kcu.column_name as info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'

UNION ALL

SELECT 'SECCION_FKS' as tipo,
       'FK: ' || tc.table_name || '.' || kcu.column_name || 
       ' -> ' || ccu.table_name || '.' || ccu.column_name as info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'

UNION ALL

SELECT 'SECCION_CHECKS' as tipo,
       'CHECK: ' || tc.table_name || ' -> ' || tc.constraint_name || 
       ' -> ' || cc.check_clause as info
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public'

UNION ALL

SELECT 'SECCION_FUNCIONES' as tipo,
       'FUNCION: ' || routine_name || 
       ' | RETORNA: ' || data_type as info
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'

ORDER BY tipo, info;

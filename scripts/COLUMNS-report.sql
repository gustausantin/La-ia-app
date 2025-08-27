-- 📊 REPORTE DE TODAS LAS COLUMNAS

-- PASO 2: VER TODAS LAS COLUMNAS DE TODAS LAS TABLAS
SELECT 
    'COLUMNAS_DETALLADAS' as seccion,
    table_name as tabla,
    column_name as columna,
    data_type as tipo,
    is_nullable as nullable,
    column_default as valor_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 📊 REPORTE SIMPLE - PASO A PASO

-- PASO 1: LISTAR TODAS LAS TABLAS
SELECT 
    'TABLAS_EXISTENTES' as seccion,
    tablename as tabla
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

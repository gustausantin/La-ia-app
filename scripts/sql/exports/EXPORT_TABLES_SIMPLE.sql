-- ================================================
-- VERSIÓN SIMPLE: SOLO TABLAS Y COLUMNAS
-- Copia y pega en Supabase SQL Editor
-- ================================================

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;


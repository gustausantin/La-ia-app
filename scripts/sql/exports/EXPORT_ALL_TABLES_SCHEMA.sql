-- ================================================
-- SCRIPT PARA EXPORTAR TODAS LAS TABLAS Y COLUMNAS
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- TODAS LAS TABLAS CON SUS COLUMNAS
SELECT 
    t.table_name AS "Tabla",
    c.column_name AS "Columna",
    c.data_type AS "Tipo",
    c.character_maximum_length AS "Max Length",
    c.is_nullable AS "Nullable",
    c.column_default AS "Default",
    cc.check_clause AS "Check Constraint"
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
LEFT JOIN information_schema.check_constraints cc
    ON cc.constraint_name IN (
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = c.table_name 
        AND column_name = c.column_name
    )
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;


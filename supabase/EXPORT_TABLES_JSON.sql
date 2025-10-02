-- ================================================
-- VERSIÓN JSON: Para copiar y pegar fácilmente
-- ================================================

SELECT jsonb_pretty(
    jsonb_object_agg(
        table_name,
        columns
    )
) AS schema_json
FROM (
    SELECT 
        t.table_name,
        jsonb_agg(
            jsonb_build_object(
                'column', c.column_name,
                'type', c.data_type,
                'nullable', c.is_nullable,
                'default', c.column_default
            ) ORDER BY c.ordinal_position
        ) AS columns
    FROM information_schema.tables t
    JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    GROUP BY t.table_name
) tables;


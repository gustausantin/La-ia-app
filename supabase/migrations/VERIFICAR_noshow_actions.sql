-- Verificar si la tabla noshow_actions existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'noshow_actions'
ORDER BY ordinal_position;



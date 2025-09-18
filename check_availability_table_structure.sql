-- Verificar estructura de la tabla availability_slots
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'availability_slots' 
AND table_schema = 'public'
ORDER BY ordinal_position;

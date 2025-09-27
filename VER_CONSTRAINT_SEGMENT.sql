-- Ver qué valores permite el constraint de segment
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'message_templates'::regclass
AND conname LIKE '%segment%';

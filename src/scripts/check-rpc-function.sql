-- 🔍 VERIFICAR LA FUNCIÓN RPC create_restaurant_securely
-- Para ver si está creando datos de ejemplo automáticamente

-- Ver el código de la función RPC
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_restaurant_securely'
AND routine_type = 'FUNCTION';

-- Ver si hay otras funciones que puedan crear datos de ejemplo
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%reservation%'
   OR routine_definition ILIKE '%example%'
   OR routine_definition ILIKE '%sample%'
   OR routine_definition ILIKE '%demo%'
AND routine_type = 'FUNCTION';

-- Ver todas las funciones personalizadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

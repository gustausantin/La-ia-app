-- =====================================================
-- VERIFICAR QUÉ FUNCIONES EXISTEN REALMENTE
-- =====================================================

-- 1. Ver todas las funciones relacionadas con availability
SELECT 
    routine_name,
    routine_type,
    specific_name,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name LIKE '%availability%' 
   OR routine_name LIKE '%generate%'
   OR routine_name LIKE '%slot%'
ORDER BY routine_name;

-- 2. Ver funciones específicas con sus parámetros
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%availability%' 
       OR p.proname LIKE '%generate%'
       OR p.proname LIKE '%slot%')
ORDER BY p.proname;

-- 3. Verificar si existe generar_disponibilidades_real
SELECT 
    'generar_disponibilidades_real' as funcion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'generar_disponibilidades_real'
        ) THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as estado;

-- 4. Verificar si existe generate_availability_slots
SELECT 
    'generate_availability_slots' as funcion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'generate_availability_slots'
        ) THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as estado;

-- 🔍 SCRIPT DE DIAGNÓSTICO COMPLETO
-- Ejecutar en Supabase SQL Editor para verificar el problema

-- =============================================================================
-- 1. VERIFICAR FUNCIÓN create_restaurant_securely
-- =============================================================================

SELECT routine_name, routine_type, specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_restaurant_securely';

-- =============================================================================
-- 2. VERIFICAR TABLAS PRINCIPALES
-- =============================================================================

-- Contar usuarios en auth
SELECT 'auth.users' as tabla, COUNT(*) as registros
FROM auth.users;

-- Contar restaurants
SELECT 'restaurants' as tabla, COUNT(*) as registros  
FROM public.restaurants;

-- Contar mappings
SELECT 'user_restaurant_mapping' as tabla, COUNT(*) as registros
FROM public.user_restaurant_mapping;

-- =============================================================================
-- 3. VERIFICAR ÚLTIMOS REGISTROS
-- =============================================================================

-- Últimos usuarios registrados
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Últimos restaurants (si los hay)
SELECT 
    id,
    name,
    email,
    created_at
FROM public.restaurants 
ORDER BY created_at DESC 
LIMIT 5;

-- Últimos mappings (si los hay)  
SELECT 
    urm.id,
    urm.auth_user_id,
    urm.restaurant_id,
    urm.role,
    urm.created_at,
    au.email as user_email
FROM public.user_restaurant_mapping urm
LEFT JOIN auth.users au ON urm.auth_user_id = au.id
ORDER BY urm.created_at DESC 
LIMIT 5;

-- =============================================================================
-- 4. VERIFICAR PERMISOS DE LA FUNCIÓN
-- =============================================================================

SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_restaurant_securely';

-- =============================================================================
-- 5. TEST MANUAL DE LA FUNCIÓN
-- =============================================================================

-- IMPORTANTE: Solo ejecutar si la función existe
-- SELECT public.create_restaurant_securely(
--     '{"name": "Test Restaurant", "email": "test@test.com"}'::jsonb,
--     '{"full_name": "Test User"}'::jsonb
-- );

-- =============================================================================
-- RESULTADO ESPERADO:
-- =============================================================================
-- 1. Función debe existir ✅
-- 2. Tablas deben tener registros coherentes ✅  
-- 3. Cada usuario en auth debe tener restaurant + mapping ✅
-- 4. Test manual debe funcionar ✅

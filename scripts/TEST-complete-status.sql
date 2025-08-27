-- 🧪 TEST COMPLETO DEL ESTADO ACTUAL
-- 📊 Verifica todo antes de crear nuevo usuario

-- 1. 📊 CONTEO DE REGISTROS EN TODAS LAS TABLAS
SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'restaurants' as tabla,
    COUNT(*) as registros
FROM public.restaurants

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'user_restaurant_mapping' as tabla,
    COUNT(*) as registros
FROM public.user_restaurant_mapping

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'profiles' as tabla,
    COUNT(*) as registros
FROM public.profiles

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'customers' as tabla,
    COUNT(*) as registros
FROM public.customers

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'reservations' as tabla,
    COUNT(*) as registros
FROM public.reservations

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'tables' as tabla,
    COUNT(*) as registros
FROM public.tables

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'conversations' as tabla,
    COUNT(*) as registros
FROM public.conversations

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'messages' as tabla,
    COUNT(*) as registros
FROM public.messages

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'notifications' as tabla,
    COUNT(*) as registros
FROM public.notifications

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'analytics' as tabla,
    COUNT(*) as registros
FROM public.analytics

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'agent_conversations' as tabla,
    COUNT(*) as registros
FROM public.agent_conversations

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'agent_insights' as tabla,
    COUNT(*) as registros
FROM public.agent_insights

UNION ALL

SELECT 
    '📊 CONTEO DE REGISTROS:' as test_section,
    'agent_metrics' as tabla,
    COUNT(*) as registros
FROM public.agent_metrics

ORDER BY tabla;

-- 2. 🔒 ESTADO RLS
SELECT 
    '🔒 ESTADO RLS:' as test_section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '⚠️ SIN RLS (Unrestricted)'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. 👥 USUARIOS EN AUTH (sin mostrar datos sensibles)
SELECT 
    '👥 USUARIOS AUTH:' as test_section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_users
FROM auth.users;

-- 4. 🔗 INTEGRIDAD DE DATOS (verificar relaciones rotas)
SELECT 
    '🔗 INTEGRIDAD:' as test_section,
    'user_restaurant_mapping_orphans' as check_type,
    COUNT(*) as problemas
FROM public.user_restaurant_mapping urm
LEFT JOIN public.restaurants r ON urm.restaurant_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    '🔗 INTEGRIDAD:' as test_section,
    'reservations_without_restaurant' as check_type,
    COUNT(*) as problemas
FROM public.reservations res
LEFT JOIN public.restaurants r ON res.restaurant_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    '🔗 INTEGRIDAD:' as test_section,
    'profiles_without_auth_user' as check_type,
    COUNT(*) as problemas
FROM public.profiles p
LEFT JOIN auth.users u ON p.auth_user_id = u.id
WHERE u.id IS NULL;

-- 5. 🎯 ESTADO GENERAL DEL SISTEMA
SELECT 
    '🎯 ESTADO GENERAL:' as test_section,
    'system_health' as metric,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.restaurants) = 0 
         AND (SELECT COUNT(*) FROM public.user_restaurant_mapping) = 0 
         AND (SELECT COUNT(*) FROM public.profiles) = 0
        THEN '✅ LIMPIO - Listo para nuevo usuario'
        ELSE '⚠️ CONTIENE DATOS - Revisar antes de continuar'
    END as status;

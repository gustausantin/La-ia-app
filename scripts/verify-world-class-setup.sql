-- ====================================
-- VERIFICACIÓN SETUP WORLD-CLASS
-- Ejecutar DESPUÉS de aplicar la migración
-- ====================================

-- 1. VERIFICAR TABLAS CRM EXISTEN
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('customers', 'automation_rules', 'customer_interactions', 'message_templates', 'automation_rule_executions') 
        THEN '✅ CRM CORE'
        WHEN table_name IN ('message_batches_demo', 'ai_conversation_insights', 'customer_feedback')
        THEN '✅ CRM ADVANCED'
        ELSE '📊 OTHER'
    END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%customer%' 
   OR table_name LIKE '%automation%'
   OR table_name LIKE '%message%'
ORDER BY category, table_name;

-- 2. VERIFICAR CAMPOS CRM EN CUSTOMERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND column_name IN (
    'segment_manual', 'segment_auto', 'visits_count', 'last_visit_at',
    'churn_risk_score', 'predicted_ltv', 'first_name', 'last_name1', 'last_name2',
    'consent_email', 'consent_sms', 'consent_whatsapp', 'avg_ticket', 'preferred_items'
  )
ORDER BY column_name;

-- 3. VERIFICAR FUNCIONES RPC CRM
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%crm%' OR routine_name LIKE '%customer%' OR routine_name LIKE '%segment%'
        THEN '🤖 CRM IA'
        ELSE '📊 OTHER'
    END as category
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%customer%' 
    OR routine_name LIKE '%segment%' 
    OR routine_name LIKE '%crm%'
    OR routine_name LIKE '%reservation%')
ORDER BY category, routine_name;

-- 4. VERIFICAR TRIGGERS AUTOMÁTICOS
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('reservations', 'customers', 'billing_tickets')
ORDER BY event_object_table, trigger_name;

-- 5. VERIFICAR RLS POLÍTICAS
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN tablename LIKE '%customer%' OR tablename LIKE '%automation%' 
        THEN '🛡️ CRM SECURITY'
        ELSE '🛡️ OTHER'
    END as category
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY category, tablename, policyname;

-- 6. TEST RÁPIDO DE FUNCIONES CRM
-- (Ejecutar solo si tienes datos de prueba)
/*
SELECT 'TEST: recompute_customer_stats' as test_name,
       recompute_customer_stats(
           (SELECT id FROM customers LIMIT 1),
           (SELECT restaurant_id FROM customers LIMIT 1)
       ) as result;

SELECT 'TEST: recompute_customer_segment' as test_name,
       recompute_customer_segment(
           (SELECT id FROM customers LIMIT 1),
           (SELECT restaurant_id FROM customers LIMIT 1)
       ) as result;
*/

-- 7. ESTADÍSTICAS FINALES
SELECT 
    'RESUMEN FINAL' as categoria,
    COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'FUNCIONES CRM' as categoria,
    COUNT(*) as total
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%customer%' OR routine_name LIKE '%crm%')
UNION ALL
SELECT 
    'TRIGGERS ACTIVOS' as categoria,
    COUNT(*) as total
FROM information_schema.triggers 
WHERE event_object_schema = 'public';

-- ====================================
-- ✅ SI TODOS LOS RESULTADOS SON POSITIVOS,
-- LA APP WORLD-CLASS ESTÁ LISTA! 🚀
-- ====================================

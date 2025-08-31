-- ====================================
-- VERIFICACIÓN DETALLADA FUNCIONES CRM
-- ====================================

-- 1. LISTAR TODAS LAS FUNCIONES CRM ESPECÍFICAS
SELECT 
    routine_name as funcion_name,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%recompute%' THEN '🧮 CÁLCULOS AUTOMÁTICOS'
        WHEN routine_name LIKE '%process%' THEN '⚡ PROCESAMIENTO'
        WHEN routine_name LIKE '%get_crm%' OR routine_name LIKE '%crm%' THEN '📊 MÉTRICAS CRM'
        WHEN routine_name LIKE '%customer%' THEN '👥 GESTIÓN CLIENTES'
        WHEN routine_name LIKE '%dashboard%' THEN '📈 DASHBOARD'
        ELSE '🔧 OTRAS'
    END as categoria,
    CASE 
        WHEN routine_name IN (
            'recompute_customer_stats',
            'recompute_customer_segment', 
            'process_reservation_completion',
            'get_crm_dashboard_stats'
        ) THEN '🆕 WORLD-CLASS'
        ELSE '✅ EXISTENTE'
    END as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%customer%' 
    OR routine_name LIKE '%segment%' 
    OR routine_name LIKE '%crm%'
    OR routine_name LIKE '%reservation%'
    OR routine_name LIKE '%dashboard%')
ORDER BY estado DESC, categoria, routine_name;

-- 2. VERIFICAR FUNCIONES WORLD-CLASS ESPECÍFICAS
SELECT 
    'FUNCIONES WORLD-CLASS' as verificacion,
    COUNT(*) as total_encontradas
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'recompute_customer_stats',
    'recompute_customer_segment', 
    'process_reservation_completion',
    'get_crm_dashboard_stats'
  );

-- 3. VERIFICAR CAMPOS CRM EN CUSTOMERS
SELECT 
    'CAMPOS CRM WORLD-CLASS' as verificacion,
    COUNT(*) as campos_encontrados
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND column_name IN (
    'segment_auto', 'segment_manual', 'visits_count', 'last_visit_at',
    'churn_risk_score', 'predicted_ltv', 'first_name', 'last_name1', 'last_name2',
    'consent_email', 'consent_sms', 'consent_whatsapp', 'avg_ticket'
  );

-- 4. VERIFICAR TRIGGERS CRM AUTOMÁTICOS
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    CASE 
        WHEN trigger_name LIKE '%customer%' OR trigger_name LIKE '%crm%' 
        THEN '🤖 CRM AUTOMÁTICO'
        ELSE '🔧 OTROS'
    END as categoria
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND (trigger_name LIKE '%customer%' 
    OR trigger_name LIKE '%stats%'
    OR trigger_name LIKE '%crm%'
    OR event_object_table IN ('reservations', 'billing_tickets', 'customers'))
ORDER BY categoria, event_object_table, trigger_name;

-- 5. ESTADO FINAL
SELECT 
    '🎯 ESTADO WORLD-CLASS' as resumen,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.routines 
            WHERE routine_name IN ('recompute_customer_stats', 'recompute_customer_segment', 'process_reservation_completion', 'get_crm_dashboard_stats')
        ) = 4 THEN '✅ FUNCIONES CRM COMPLETAS'
        ELSE '⚠️ FALTAN FUNCIONES CRM'
    END as estado_funciones,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name IN ('segment_auto', 'churn_risk_score', 'predicted_ltv')
        ) >= 3 THEN '✅ CAMPOS CRM COMPLETOS'
        ELSE '⚠️ FALTAN CAMPOS CRM'
    END as estado_campos;

-- ====================================
-- SI TODO SALE ✅ = WORLD-CLASS READY!
-- SI HAY ⚠️ = APLICAR MIGRACIÓN 20250131_001
-- ====================================

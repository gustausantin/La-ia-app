-- 🔍 VERIFICACIÓN DE TABLAS PARA PLANTILLAS Y COMUNICACIÓN
-- Verificar si las tablas necesarias para el gestor de plantillas están aplicadas

-- 1. 📝 Verificar tabla message_templates
SELECT 
    '📝 MESSAGE_TEMPLATES' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates' AND table_schema = 'public')
        THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END as estado;

-- 2. 🔧 Verificar columnas avanzadas en message_templates
SELECT 
    '🔧 COLUMNAS AVANZADAS' as verificacion,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('template_type', 'body_markdown', 'personalization_level', 'success_rate')
        THEN '✅ COLUMNA AVANZADA'
        ELSE '📋 COLUMNA BÁSICA'
    END as tipo_columna
FROM information_schema.columns 
WHERE table_name = 'message_templates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 📊 Verificar tabla template_variables
SELECT 
    '📊 TEMPLATE_VARIABLES' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_variables' AND table_schema = 'public')
        THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END as estado;

-- 4. 🗨️ Verificar tablas de conversaciones
SELECT 
    '🗨️ CONVERSACIONES' as verificacion,
    table_name,
    CASE 
        WHEN table_name IN ('conversations', 'messages', 'ai_conversation_insights', 'message_batches_demo')
        THEN '✅ EXISTE'
        ELSE '❓ VERIFICAR'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'ai_conversation_insights', 'message_batches_demo')
ORDER BY table_name;

-- 5. 👥 Verificar campos CRM en customers para tipos de cliente
SELECT 
    '👥 CAMPOS CRM CUSTOMERS' as verificacion,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('segment_auto', 'segment_manual', 'visits_count', 'last_visit_at', 'churn_risk_score', 'predicted_ltv')
        THEN '✅ CAMPO CRM'
        ELSE '📋 CAMPO BÁSICO'
    END as tipo_campo
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
AND column_name IN ('segment_auto', 'segment_manual', 'visits_count', 'last_visit_at', 'churn_risk_score', 'predicted_ltv', 'first_name', 'last_name1', 'last_name2')
ORDER BY column_name;

-- 6. 🎯 Verificar funciones CRM para automatización
SELECT 
    '🎯 FUNCIONES CRM' as verificacion,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IN ('recompute_customer_segment', 'process_reservation_completion', 'get_crm_dashboard_stats')
        THEN '✅ FUNCIÓN CRM'
        ELSE '📋 FUNCIÓN GENERAL'
    END as tipo_funcion
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('recompute_customer_segment', 'process_reservation_completion', 'get_crm_dashboard_stats', 'recompute_customer_stats')
ORDER BY routine_name;

-- 7. 📋 RESUMEN FINAL
SELECT 
    '📋 RESUMEN FINAL' as seccion,
    'PLANTILLAS Y COMUNICACIÓN' as categoria,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_variables' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'segment_auto' AND table_schema = 'public')
        )
        THEN '🎉 TODO LISTO - NO NECESITAS SUBIR NADA'
        ELSE '⚠️ FALTAN ALGUNAS TABLAS - REVISAR MIGRACIONES'
    END as estado_final;

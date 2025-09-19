-- ========================================
-- VERIFICAR SETUP COMPLETO DE NO-SHOWS
-- ========================================

-- 1. VERIFICAR QUE EXISTEN TODAS LAS TABLAS
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('crm_templates', 'message_templates', 'noshow_actions')
ORDER BY table_name;

-- 2. VERIFICAR ESTRUCTURA DE noshow_actions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'noshow_actions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR PLANTILLAS CREADAS
SELECT 
    'crm_templates' as tabla,
    COUNT(*) as total_plantillas,
    COUNT(*) FILTER (WHERE type = 'noshow') as plantillas_noshow
FROM crm_templates

UNION ALL

SELECT 
    'message_templates' as tabla,
    COUNT(*) as total_plantillas,
    COUNT(*) FILTER (WHERE category = 'noshow_prevention') as plantillas_noshow
FROM message_templates

UNION ALL

SELECT 
    'noshow_actions' as tabla,
    0 as total_plantillas, -- No aplica
    COUNT(*) as registros_actuales
FROM noshow_actions;

-- 4. VERIFICAR ÍNDICES CREADOS
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'noshow_actions'
ORDER BY indexname;

-- 5. VERIFICAR RLS ACTIVADO (CORREGIDO)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'noshow_actions';

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
    policyname,
    tablename,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'noshow_actions';

-- 7. PROBAR INSERCIÓN DE PRUEBA (OPCIONAL)
/*
-- Descomenta para probar inserción:
INSERT INTO noshow_actions (
    restaurant_id,
    customer_name,
    reservation_date,
    reservation_time,
    party_size,
    risk_level,
    risk_score,
    risk_factors,
    action_type,
    message_sent,
    channel
) VALUES (
    (SELECT id FROM restaurants LIMIT 1), -- Tu restaurant_id
    'Cliente Prueba',
    CURRENT_DATE,
    '20:00',
    4,
    'high',
    85,
    '["historial_noshows", "hora_pico"]'::jsonb,
    'whatsapp_confirmation',
    'Mensaje de prueba',
    'whatsapp'
);

-- Verificar que se insertó:
SELECT * FROM noshow_actions WHERE customer_name = 'Cliente Prueba';
*/

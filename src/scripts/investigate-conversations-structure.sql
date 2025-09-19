-- ====================================
-- INVESTIGACIÓN COMPLETA: TABLA CONVERSATIONS
-- Fecha: 19 Septiembre 2025
-- OBJETIVO: Encontrar el constraint exacto de priority
-- ====================================

DO $$
BEGIN
    RAISE NOTICE '🔍 INICIANDO INVESTIGACIÓN PROFUNDA DE CONVERSATIONS...';
    RAISE NOTICE '📋 Objetivo: Resolver error conversations_priority_check';
    RAISE NOTICE '⚡ NO SIMPLIFICAMOS - INVESTIGAMOS Y MEJORAMOS';
END $$;

-- 1. ESTRUCTURA COMPLETA DE LA TABLA
SELECT 
    '=== ESTRUCTURA CONVERSATIONS ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'conversations' 
ORDER BY ordinal_position;

-- 2. TODOS LOS CONSTRAINTS (INCLUYE CHECK CONSTRAINTS)
SELECT 
    '=== CONSTRAINTS CONVERSATIONS ===' as info,
    tc.constraint_name,
    tc.constraint_type,
    COALESCE(cc.check_clause, 'N/A') as check_clause,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'conversations'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. BÚSQUEDA ESPECÍFICA DE CONSTRAINTS PRIORITY
SELECT 
    '=== PRIORITY CONSTRAINTS ===' as info,
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name ILIKE '%priority%' 
   OR check_clause ILIKE '%priority%';

-- 4. DATOS EXISTENTES EN CONVERSATIONS (SAMPLE)
SELECT 
    '=== DATOS EXISTENTES ===' as info,
    COUNT(*) as total_conversations,
    ARRAY_AGG(DISTINCT status) FILTER (WHERE status IS NOT NULL) as status_values,
    ARRAY_AGG(DISTINCT priority) FILTER (WHERE priority IS NOT NULL) as priority_values,
    ARRAY_AGG(DISTINCT channel) FILTER (WHERE channel IS NOT NULL) as channel_values,
    MIN(priority) as min_priority,
    MAX(priority) as max_priority
FROM conversations;

-- 5. SAMPLE DE REGISTROS REALES
SELECT 
    '=== SAMPLE REGISTROS ===' as info,
    id,
    status,
    priority,
    channel,
    customer_name
FROM conversations 
LIMIT 5;

-- 6. FOREIGN KEYS DETALLADOS
SELECT 
    '=== FOREIGN KEYS ===' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'conversations';

-- 7. VERIFICAR SI PRIORITY PERMITE NULL
SELECT 
    '=== PRIORITY NULLABILITY ===' as info,
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND column_name = 'priority';

-- 8. BUSCAR DEFINICIÓN EN COMENTARIOS DE COLUMNAS
SELECT 
    '=== COMENTARIOS COLUMNAS ===' as info,
    column_name,
    COALESCE(col_description(c.oid, a.attnum), 'Sin comentario') as column_comment
FROM information_schema.columns isc
JOIN pg_class c ON c.relname = isc.table_name
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = isc.column_name
WHERE isc.table_name = 'conversations'
AND isc.column_name = 'priority';

-- 9. INVESTIGAR TRIGGERS EN LA TABLA
SELECT 
    '=== TRIGGERS CONVERSATIONS ===' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'conversations';

-- 10. INTENTAR INSERCIÓN DE PRUEBA CONTROLADA
DO $$
DECLARE
    restaurant_uuid UUID;
    customer_uuid UUID;
    test_conversation_id UUID;
BEGIN
    RAISE NOTICE '🧪 INICIANDO PRUEBAS CONTROLADAS DE INSERCIÓN...';
    
    -- Obtener IDs válidos
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
    SELECT id INTO customer_uuid FROM customers WHERE restaurant_id = restaurant_uuid LIMIT 1;
    
    IF restaurant_uuid IS NULL OR customer_uuid IS NULL THEN
        RAISE NOTICE '❌ No hay datos base para testing';
        RETURN;
    END IF;
    
    -- PRUEBA 1: Sin priority (NULL)
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test NULL Priority', '+34000000001',
            'test1@test.com', 'Test Subject', 'active', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ PRUEBA 1 EXITOSA: priority NULL permitido';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PRUEBA 1 FALLÓ: priority NULL no permitido - %', SQLERRM;
    END;
    
    -- PRUEBA 2: priority = 1
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority 1', '+34000000002',
            'test2@test.com', 'Test Subject', 'active', 1, 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ PRUEBA 2 EXITOSA: priority = 1 permitido';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PRUEBA 2 FALLÓ: priority = 1 no permitido - %', SQLERRM;
    END;
    
    -- PRUEBA 3: priority = 5
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority 5', '+34000000003',
            'test3@test.com', 'Test Subject', 'active', 5, 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ PRUEBA 3 EXITOSA: priority = 5 permitido';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PRUEBA 3 FALLÓ: priority = 5 no permitido - %', SQLERRM;
    END;
    
    -- PRUEBA 4: priority = 0 (fuera de rango típico)
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority 0', '+34000000004',
            'test4@test.com', 'Test Subject', 'active', 0, 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ PRUEBA 4 EXITOSA: priority = 0 permitido';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PRUEBA 4 FALLÓ: priority = 0 no permitido - %', SQLERRM;
    END;
    
    -- PRUEBA 5: priority = 11 (fuera de rango típico)
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority 11', '+34000000005',
            'test5@test.com', 'Test Subject', 'active', 11, 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ PRUEBA 5 EXITOSA: priority = 11 permitido';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PRUEBA 5 FALLÓ: priority = 11 no permitido - %', SQLERRM;
    END;
    
    RAISE NOTICE '🎯 PRUEBAS COMPLETADAS - Revisar resultados arriba';
    
END $$;

-- RESULTADO FINAL
DO $$
BEGIN
    RAISE NOTICE '=== INVESTIGACIÓN COMPLETADA ===';
    RAISE NOTICE '📊 Revisar todos los resultados arriba';
    RAISE NOTICE '🎯 Identificar el constraint exacto de priority';
    RAISE NOTICE '⚡ Con esta información corregiremos el problema CORRECTAMENTE';
    RAISE NOTICE '🚀 NO SIMPLIFICAMOS - MEJORAMOS LA SOLUCIÓN';
END $$;
-- ====================================
-- SOLUCIÓN DIRECTA: PRIORITY EN CONVERSATIONS
-- Fecha: 19 Septiembre 2025
-- ENFOQUE: Descubrir y corregir el constraint real
-- ====================================

DO $$
DECLARE
    restaurant_uuid UUID;
    customer_uuid UUID;
    test_conversation_id UUID;
BEGIN
    RAISE NOTICE '🔧 ENFOQUE DIRECTO: Descubrir constraint de priority';
    
    -- Obtener IDs válidos
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
    SELECT id INTO customer_uuid FROM customers WHERE restaurant_id = restaurant_uuid LIMIT 1;
    
    IF restaurant_uuid IS NULL OR customer_uuid IS NULL THEN
        RAISE NOTICE '❌ No hay datos base para testing';
        RETURN;
    END IF;

    -- ESTRATEGIA: Probar diferentes valores hasta encontrar el patrón
    
    -- PRUEBA A: priority NULL
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority NULL', '+34900000001',
            'test1@test.com', 'Test Subject', 'active', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: priority NULL funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: priority NULL - %', SQLERRM;
    END;
    
    -- PRUEBA B: priority como VARCHAR (podría ser texto en lugar de número)
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority TEXT', '+34900000002',
            'test2@test.com', 'Test Subject', 'active', 'high', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: priority = "high" (VARCHAR) funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: priority = "high" - %', SQLERRM;
    END;
    
    -- PRUEBA C: priority = 'low'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority low', '+34900000003',
            'test3@test.com', 'Test Subject', 'active', 'low', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: priority = "low" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: priority = "low" - %', SQLERRM;
    END;
    
    -- PRUEBA D: priority = 'medium'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority medium', '+34900000004',
            'test4@test.com', 'Test Subject', 'active', 'medium', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: priority = "medium" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: priority = "medium" - %', SQLERRM;
    END;
    
    -- PRUEBA E: priority = 'urgent'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority urgent', '+34900000005',
            'test5@test.com', 'Test Subject', 'active', 'urgent', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: priority = "urgent" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: priority = "urgent" - %', SQLERRM;
    END;
    
    -- PRUEBA F: priority = 1 (INTEGER)
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Priority 1', '+34900000006',
            'test6@test.com', 'Test Subject', 'active', 1, 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: priority = 1 (INTEGER) funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: priority = 1 - %', SQLERRM;
    END;
    
    RAISE NOTICE '🎯 TESTING COMPLETADO - Revisar resultados arriba';
    RAISE NOTICE '💡 El valor que funcione nos dirá el tipo y constraint correcto';
    
END $$;

-- Mostrar estructura real de la tabla (enfoque alternativo)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND column_name = 'priority';

-- Intentar obtener constraint info de forma más directa
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'conversations'::regclass
AND conname LIKE '%priority%';

DO $$
BEGIN
    RAISE NOTICE '=== ANÁLISIS COMPLETADO ===';
    RAISE NOTICE '🎯 Con estos resultados sabremos exactamente qué valores usar';
    RAISE NOTICE '⚡ Enfoque directo: probar hasta encontrar la solución correcta';
END $$;

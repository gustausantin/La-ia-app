-- ====================================
-- DESCUBRIR CONSTRAINT DE STATUS
-- Fecha: 19 Septiembre 2025
-- OBJETIVO: Encontrar valores válidos para conversations.status
-- ====================================

-- Buscar constraint de status directamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'conversations'::regclass
AND conname LIKE '%status%';

-- Testing directo de valores de status
DO $$
DECLARE
    restaurant_uuid UUID;
    customer_uuid UUID;
    test_conversation_id UUID;
BEGIN
    RAISE NOTICE '🔧 DESCUBRIENDO CONSTRAINT DE STATUS';
    
    -- Obtener IDs válidos
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
    SELECT id INTO customer_uuid FROM customers WHERE restaurant_id = restaurant_uuid LIMIT 1;
    
    IF restaurant_uuid IS NULL OR customer_uuid IS NULL THEN
        RAISE NOTICE '❌ No hay datos base para testing';
        RETURN;
    END IF;

    -- PRUEBA A: status = 'active'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Status Active', '+34800000001',
            'test1@test.com', 'Test Subject', 'active', 'normal', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: status = "active" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: status = "active" - %', SQLERRM;
    END;
    
    -- PRUEBA B: status = 'pending'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Status Pending', '+34800000002',
            'test2@test.com', 'Test Subject', 'pending', 'normal', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: status = "pending" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: status = "pending" - %', SQLERRM;
    END;
    
    -- PRUEBA C: status = 'resolved'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Status Resolved', '+34800000003',
            'test3@test.com', 'Test Subject', 'resolved', 'normal', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: status = "resolved" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: status = "resolved" - %', SQLERRM;
    END;
    
    -- PRUEBA D: status = 'open'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Status Open', '+34800000004',
            'test4@test.com', 'Test Subject', 'open', 'normal', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: status = "open" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: status = "open" - %', SQLERRM;
    END;
    
    -- PRUEBA E: status = 'closed'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Status Closed', '+34800000005',
            'test5@test.com', 'Test Subject', 'closed', 'normal', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: status = "closed" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: status = "closed" - %', SQLERRM;
    END;
    
    -- PRUEBA F: status = 'in_progress'
    BEGIN
        INSERT INTO conversations (
            restaurant_id, customer_id, customer_name, customer_phone, 
            customer_email, subject, status, priority, channel, created_at, updated_at
        ) VALUES (
            restaurant_uuid, customer_uuid, 'Test Status InProgress', '+34800000006',
            'test6@test.com', 'Test Subject', 'in_progress', 'normal', 'whatsapp', NOW(), NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ SUCCESS: status = "in_progress" funciona';
        DELETE FROM conversations WHERE id = test_conversation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: status = "in_progress" - %', SQLERRM;
    END;
    
    RAISE NOTICE '🎯 TESTING DE STATUS COMPLETADO';
    
END $$;

DO $$
BEGIN
    RAISE NOTICE '=== INVESTIGACIÓN STATUS COMPLETADA ===';
    RAISE NOTICE '🎯 Con estos resultados corregiremos los valores de status';
    RAISE NOTICE '⚡ METODOLOGÍA EXITOSA: Priority ✅, ahora Status ✅';
END $$;

-- ====================================
-- TEST SIMPLE PARA CONVERSATIONS
-- Fecha: 19 Septiembre 2025
-- ====================================

DO $$
DECLARE
    restaurant_uuid UUID;
    customer_uuid UUID;
BEGIN
    -- Obtener el ID del restaurante
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
    
    IF restaurant_uuid IS NULL THEN
        RAISE EXCEPTION 'No hay restaurantes en la base de datos';
    END IF;

    -- Obtener un customer
    SELECT id INTO customer_uuid FROM customers WHERE restaurant_id = restaurant_uuid LIMIT 1;
    
    IF customer_uuid IS NULL THEN
        RAISE EXCEPTION 'No hay clientes en la base de datos';
    END IF;

    RAISE NOTICE '🧪 Probando inserción simple en conversations...';
    
    -- Intentar insertar una conversación muy básica primero
    BEGIN
        INSERT INTO conversations (
            restaurant_id,
            customer_id,
            customer_name,
            customer_phone,
            customer_email,
            subject,
            status,
            channel,
            created_at,
            updated_at
        ) VALUES (
            restaurant_uuid,
            customer_uuid,
            'Test Cliente',
            '+34666000000',
            'test@email.com',
            'Test Subject',
            'active',
            'whatsapp',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Inserción básica exitosa - el problema debe ser con priority';
        
        -- Ahora probar con priority = NULL
        INSERT INTO conversations (
            restaurant_id,
            customer_id,
            customer_name,
            customer_phone,
            customer_email,
            subject,
            status,
            priority,
            channel,
            created_at,
            updated_at
        ) VALUES (
            restaurant_uuid,
            customer_uuid,
            'Test Cliente 2',
            '+34666000001',
            'test2@email.com',
            'Test Subject 2',
            'active',
            NULL, -- priority NULL
            'whatsapp',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Inserción con priority NULL exitosa';
        
        -- Ahora probar diferentes valores de priority
        INSERT INTO conversations (
            restaurant_id,
            customer_id,
            customer_name,
            customer_phone,
            customer_email,
            subject,
            status,
            priority,
            channel,
            created_at,
            updated_at
        ) VALUES (
            restaurant_uuid,
            customer_uuid,
            'Test Cliente 3',
            '+34666000002',
            'test3@email.com',
            'Test Subject 3',
            'active',
            1, -- priority 1
            'whatsapp',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Inserción con priority 1 exitosa';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en inserción: %', SQLERRM;
        RAISE NOTICE '🔍 Código de error: %', SQLSTATE;
    END;
    
    -- Limpiar datos de prueba
    DELETE FROM conversations WHERE customer_phone LIKE '+34666000%';
    RAISE NOTICE '🧹 Datos de prueba limpiados';
    
END $$;

-- ====================================
-- CREAR DATOS DE DEMO PARA CONVERSATIONS
-- Fecha: 19 Septiembre 2025
-- ====================================

-- Verificar si ya existen conversaciones
DO $$
DECLARE
    conversation_count INTEGER;
    restaurant_uuid UUID;
BEGIN
    -- Obtener el ID del restaurante
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
    
    IF restaurant_uuid IS NULL THEN
        RAISE EXCEPTION 'No hay restaurantes en la base de datos';
    END IF;

    -- Contar conversaciones existentes
    SELECT COUNT(*) INTO conversation_count FROM conversations WHERE restaurant_id = restaurant_uuid;
    
    IF conversation_count = 0 THEN
        RAISE NOTICE '📝 Creando datos de demo para conversations...';
        
        -- Insertar conversaciones de ejemplo
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
            tags,
            metadata,
            created_at,
            updated_at
        ) VALUES 
        -- Conversación 1: Reserva por WhatsApp
        (
            restaurant_uuid,
            (SELECT id FROM customers WHERE restaurant_id = restaurant_uuid LIMIT 1),
            'María González',
            '+34666123456',
            'maria.gonzalez@email.com',
            'Consulta sobre reserva',
            'open',
            'normal', -- Prioridad media
            'whatsapp',
            ARRAY['reserva', 'consulta'],
            '{"last_message": "Hola, ¿tienen disponibilidad para 4 personas el viernes?", "ai_handled": true}'::jsonb,
            NOW() - INTERVAL '2 hours',
            NOW() - INTERVAL '30 minutes'
        ),
        -- Conversación 2: Queja por teléfono
        (
            restaurant_uuid,
            (SELECT id FROM customers WHERE restaurant_id = restaurant_uuid OFFSET 1 LIMIT 1),
            'Carlos Ruiz',
            '+34666234567',
            'carlos.ruiz@email.com',
            'Queja sobre servicio',
            'pending',
            'high', -- Prioridad alta
            'phone',
            ARRAY['queja', 'servicio'],
            '{"last_message": "El servicio fue muy lento anoche", "ai_handled": false, "human_takeover": true}'::jsonb,
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '6 hours'
        ),
        -- Conversación 3: Consulta menú por email
        (
            restaurant_uuid,
            (SELECT id FROM customers WHERE restaurant_id = restaurant_uuid OFFSET 2 LIMIT 1),
            'Ana Martín',
            '+34666345678',
            'ana.martin@email.com',
            'Consulta sobre menú vegetariano',
            'closed',
            'low', -- Prioridad baja
            'email',
            ARRAY['menu', 'vegetariano'],
            ('{"last_message": "¿Tienen opciones veganas?", "ai_handled": true, "resolved_at": "' || (NOW() - INTERVAL '2 hours')::text || '"}')::jsonb,
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '2 hours'
        ),
        -- Conversación 4: Reserva web activa
        (
            restaurant_uuid,
            (SELECT id FROM customers WHERE restaurant_id = restaurant_uuid OFFSET 3 LIMIT 1),
            'David López',
            '+34666456789',
            'david.lopez@email.com',
            'Reserva para evento especial',
            'open',
            'urgent', -- Prioridad máxima (evento especial)
            'web',
            ARRAY['reserva', 'evento'],
            '{"last_message": "Necesito reservar para 12 personas para un cumpleaños", "ai_handled": false}'::jsonb,
            NOW() - INTERVAL '4 hours',
            NOW() - INTERVAL '1 hour'
        ),
        -- Conversación 5: Feedback positivo
        (
            restaurant_uuid,
            (SELECT id FROM customers WHERE restaurant_id = restaurant_uuid OFFSET 4 LIMIT 1),
            'Laura Sánchez',
            '+34666567890',
            'laura.sanchez@email.com',
            'Felicitaciones por la cena',
            'closed',
            'low', -- Prioridad baja (feedback positivo)
            'whatsapp',
            ARRAY['feedback', 'positivo'],
            '{"last_message": "¡Estuvo deliciosa la paella! Gracias", "ai_handled": true, "sentiment": "positive"}'::jsonb,
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '1 day'
        );
        
        RAISE NOTICE '✅ Creadas 5 conversaciones de ejemplo';
        
        -- Crear algunos mensajes de ejemplo para las conversaciones
        INSERT INTO messages (
            restaurant_id,
            customer_phone,
            customer_name,
            message_text,
            message_type,
            direction,
            channel,
            status,
            metadata,
            created_at
        ) VALUES 
        -- Mensajes para conversación WhatsApp
        (
            restaurant_uuid,
            '+34666123456',
            'María González',
            'Hola, ¿tienen disponibilidad para 4 personas el viernes a las 21:00?',
            'text',
            'inbound',
            'whatsapp',
            'delivered',
            ('{"conversation_id": "' || (SELECT id FROM conversations WHERE customer_phone = '+34666123456' AND restaurant_id = restaurant_uuid)::text || '"}')::jsonb,
            NOW() - INTERVAL '2 hours'
        ),
        (
            restaurant_uuid,
            '+34666123456',
            'Restaurante Tavertet',
            'Hola María, sí tenemos disponibilidad. ¿A qué hora prefieren?',
            'text',
            'outbound',
            'whatsapp',
            'delivered',
            ('{"conversation_id": "' || (SELECT id FROM conversations WHERE customer_phone = '+34666123456' AND restaurant_id = restaurant_uuid)::text || '", "ai_generated": true}')::jsonb,
            NOW() - INTERVAL '1 hour 45 minutes'
        ),
        -- Mensaje para queja por teléfono
        (
            restaurant_uuid,
            '+34666234567',
            'Carlos Ruiz',
            'El servicio fue muy lento anoche, esperamos más de 45 minutos',
            'text',
            'inbound',
            'phone',
            'received',
            ('{"conversation_id": "' || (SELECT id FROM conversations WHERE customer_phone = '+34666234567' AND restaurant_id = restaurant_uuid)::text || '", "call_duration": 180}')::jsonb,
            NOW() - INTERVAL '6 hours'
        );
        
        RAISE NOTICE '✅ Creados mensajes de ejemplo para las conversaciones';
        
    ELSE
        RAISE NOTICE '📋 Ya existen % conversaciones, no se crean datos de demo', conversation_count;
    END IF;
    
END $$;

-- Verificar resultado
DO $$
DECLARE
    total_conversations INTEGER;
    total_messages INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_conversations FROM conversations;
    SELECT COUNT(*) INTO total_messages FROM messages;
    
    RAISE NOTICE '📊 Total conversaciones: %', total_conversations;
    RAISE NOTICE '💬 Total mensajes: %', total_messages;
END $$;

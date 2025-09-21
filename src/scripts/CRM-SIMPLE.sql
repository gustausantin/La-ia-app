-- ===================================================================
-- CREAR CRM OPPORTUNITIES SIMPLE - SOLO CAMPOS BÁSICOS
-- ===================================================================

DO $$
DECLARE
    r_id UUID;
    contador INTEGER := 0;
BEGIN
    -- Obtener restaurant_id
    SELECT id INTO r_id FROM restaurants WHERE name = 'Tavertet' LIMIT 1;
    
    IF r_id IS NULL THEN
        RAISE EXCEPTION 'Restaurante Tavertet no encontrado';
    END IF;

    -- Limpiar oportunidades CRM existentes
    DELETE FROM crm_suggestions WHERE restaurant_id = r_id;
    
    RAISE NOTICE 'Creando CRM opportunities simples...';

    -- 1. CLIENTES EN RIESGO (reactivación)
    INSERT INTO crm_suggestions (
        restaurant_id, customer_id, type, priority, title, description, 
        suggested_subject, suggested_content, status, created_at
    )
    SELECT 
        r_id,
        c.id,
        'reactivacion',
        'high',
        'Cliente en riesgo: ' || c.name,
        'Cliente con ' || c.visits_count || ' visitas no regresa desde hace tiempo. Enviar oferta de reactivación.',
        '¡Te echamos de menos! Oferta especial para ti',
        'Hola ' || c.name || ', hemos notado que no vienes desde hace tiempo. Como cliente valorado, queremos ofrecerte un 15% de descuento en tu próxima visita. ¡Esperamos verte pronto!',
        'pending',
        NOW()
    FROM customers c
    WHERE c.restaurant_id = r_id 
      AND c.segment_auto = 'en_riesgo'
      AND c.visits_count > 1
    LIMIT 5;
    
    GET DIAGNOSTICS contador = ROW_COUNT;
    
    -- 2. CLIENTES VIP (upgrade)
    INSERT INTO crm_suggestions (
        restaurant_id, customer_id, type, priority, title, description,
        suggested_subject, suggested_content, status, created_at
    )
    SELECT 
        r_id,
        c.id,
        'vip_upgrade',
        'medium',
        'Oportunidad VIP: ' || c.name,
        'Cliente VIP con alto gasto (' || c.total_spent || '€). Ofrecer experiencias premium.',
        'Experiencia VIP exclusiva para ti',
        'Estimado/a ' || c.name || ', como uno de nuestros clientes más valorados, te invitamos a disfrutar de nuestro menú degustación premium. Una experiencia culinaria única.',
        'pending',
        NOW()
    FROM customers c
    WHERE c.restaurant_id = r_id 
      AND c.segment_auto = 'vip'
      AND c.total_spent > 200
    LIMIT 3;
    
    -- 3. CLIENTES NUEVOS (fidelización)
    INSERT INTO crm_suggestions (
        restaurant_id, customer_id, type, priority, title, description,
        suggested_subject, suggested_content, status, created_at
    )
    SELECT 
        r_id,
        c.id,
        'bienvenida',
        'medium',
        'Fidelizar nuevo: ' || c.name,
        'Primera visita completada. Enviar bienvenida y oferta para segunda visita.',
        '¡Bienvenido/a! Tu segunda visita te espera',
        'Hola ' || c.name || ', ¡gracias por visitarnos! Nos encantó tenerte. Para tu segunda visita, te ofrecemos un 10% de descuento. ¡Esperamos repetir pronto!',
        'pending',
        NOW()
    FROM customers c
    WHERE c.restaurant_id = r_id 
      AND c.segment_auto = 'nuevo'
      AND c.visits_count = 1
    LIMIT 4;
    
    -- 4. CLIENTES REGULARES (feedback)
    INSERT INTO crm_suggestions (
        restaurant_id, customer_id, type, priority, title, description,
        suggested_subject, suggested_content, status, created_at
    )
    SELECT 
        r_id,
        c.id,
        'feedback',
        'low',
        'Solicitar feedback: ' || c.name,
        'Cliente regular (' || c.visits_count || ' visitas). Solicitar feedback para mejorar.',
        'Tu opinión nos importa',
        'Hola ' || c.name || ', como cliente habitual, tu opinión es muy valiosa para nosotros. ¿Podrías dedicar 2 minutos a contarnos cómo podemos mejorar? Como agradecimiento, 5% descuento en tu próxima visita.',
        'pending',
        NOW()
    FROM customers c
    WHERE c.restaurant_id = r_id 
      AND c.segment_auto = 'regular'
      AND c.visits_count >= 3
    LIMIT 3;

    RAISE NOTICE 'CRM Opportunities creadas: %', (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = r_id);

END $$;

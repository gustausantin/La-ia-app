-- ===================================================================
-- CREAR OPORTUNIDADES CRM REALES - TAVERTET
-- ===================================================================
-- Este script crea oportunidades CRM basadas en los datos REALES de clientes

DO $$
DECLARE
    r_id UUID;
    cliente RECORD;
    template_id UUID;
    contador INTEGER := 0;
BEGIN
    -- Obtener restaurant_id
    SELECT id INTO r_id FROM restaurants WHERE name = 'Tavertet' LIMIT 1;
    
    IF r_id IS NULL THEN
        RAISE EXCEPTION 'Restaurante Tavertet no encontrado';
    END IF;

    -- Limpiar oportunidades CRM existentes
    DELETE FROM crm_suggestions WHERE restaurant_id = r_id;
    
    RAISE NOTICE 'Creando oportunidades CRM reales...';

    -- 1. CLIENTES EN RIESGO (no han venido en 30+ días)
    FOR cliente IN 
        SELECT * FROM customers 
        WHERE restaurant_id = r_id 
          AND segment_auto = 'en_riesgo'
          AND visits_count > 1
        LIMIT 5
    LOOP
        -- Obtener template de reactivación
        SELECT id INTO template_id FROM crm_templates 
        WHERE restaurant_id = r_id AND type = 'reactivacion' LIMIT 1;
        
        INSERT INTO crm_suggestions (
            restaurant_id,
            customer_id,
            template_id,
            type,
            title,
            description,
            metadata,
            created_at
        ) VALUES (
            r_id,
            cliente.id,
            template_id,
            'reactivacion',
            'Cliente en riesgo: ' || cliente.name,
            'Cliente con ' || cliente.visits_count || ' visitas no regresa desde hace tiempo. Enviar oferta de reactivación.',
            jsonb_build_object(
                'priority', 'high',
                'estimated_impact', cliente.total_spent * 0.3,
                'confidence_score', 85,
                'suggested_channel', cliente.preferred_channel,
                'last_visit_days', EXTRACT(DAY FROM (NOW() - cliente.last_visit_at)),
                'total_spent', cliente.total_spent,
                'visits_count', cliente.visits_count,
                'suggested_discount', '15%'
            ),
            NOW()
        );
        
        contador := contador + 1;
    END LOOP;

    -- 2. CLIENTES VIP PARA UPGRADE
    FOR cliente IN 
        SELECT * FROM customers 
        WHERE restaurant_id = r_id 
          AND segment_auto = 'vip'
          AND total_spent > 500
        LIMIT 3
    LOOP
        INSERT INTO crm_suggestions (
            restaurant_id,
            customer_id,
            type,
            title,
            description,
            metadata,
            created_at
        ) VALUES (
            r_id,
            cliente.id,
            'vip_upgrade',
            'Oportunidad VIP: ' || cliente.name,
            'Cliente VIP con alto gasto. Ofrecer experiencias premium o programa de fidelización.',
            jsonb_build_object(
                'priority', 'medium',
                'estimated_impact', cliente.total_spent * 0.2,
                'confidence_score', 75,
                'suggested_channel', cliente.preferred_channel,
                'total_spent', cliente.total_spent,
                'visits_count', cliente.visits_count,
                'avg_ticket', ROUND(cliente.total_spent / GREATEST(cliente.visits_count, 1), 2),
                'suggested_offer', 'Menú degustación premium'
            ),
            NOW()
        );
        
        contador := contador + 1;
    END LOOP;

    -- 3. CLIENTES NUEVOS PARA FIDELIZACIÓN
    FOR cliente IN 
        SELECT * FROM customers 
        WHERE restaurant_id = r_id 
          AND segment_auto = 'nuevo'
          AND visits_count = 1
        LIMIT 4
    LOOP
        INSERT INTO crm_suggestions (
            restaurant_id,
            customer_id,
            type,
            title,
            description,
            metadata,
            created_at
        ) VALUES (
            r_id,
            cliente.id,
            'bienvenida',
            'Fidelizar cliente nuevo: ' || cliente.name,
            'Cliente con primera visita. Enviar bienvenida y oferta para segunda visita.',
            jsonb_build_object(
                'priority', 'medium',
                'estimated_impact', cliente.total_spent * 1.5,
                'confidence_score', 70,
                'suggested_channel', cliente.preferred_channel,
                'first_visit_amount', cliente.total_spent,
                'days_since_visit', EXTRACT(DAY FROM (NOW() - cliente.last_visit_at)),
                'suggested_discount', '10%',
                'follow_up_days', 7
            ),
            NOW()
        );
        
        contador := contador + 1;
    END LOOP;

    -- 4. CLIENTES REGULARES PARA FEEDBACK
    FOR cliente IN 
        SELECT * FROM customers 
        WHERE restaurant_id = r_id 
          AND segment_auto = 'regular'
          AND visits_count >= 3
        LIMIT 3
    LOOP
        INSERT INTO crm_suggestions (
            restaurant_id,
            customer_id,
            type,
            title,
            description,
            metadata,
            created_at
        ) VALUES (
            r_id,
            cliente.id,
            'feedback',
            'Solicitar feedback: ' || cliente.name,
            'Cliente regular. Solicitar feedback para mejorar experiencia y fidelizar.',
            jsonb_build_object(
                'priority', 'low',
                'estimated_impact', cliente.total_spent * 0.1,
                'confidence_score', 60,
                'suggested_channel', cliente.preferred_channel,
                'visits_count', cliente.visits_count,
                'loyalty_level', 'regular',
                'feedback_incentive', 'Descuento 5% próxima visita'
            ),
            NOW()
        );
        
        contador := contador + 1;
    END LOOP;

    RAISE NOTICE 'CRM Opportunities creadas: %', contador;
    RAISE NOTICE 'Total oportunidades en BD: %', (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = r_id);

END $$;

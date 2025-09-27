-- =====================================================
-- CREAR PLANTILLAS CRM FALTANTES
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- Usar valores EXACTOS que ya funcionan: alto_valor, en_riesgo
DO $$
DECLARE
    target_restaurant_id UUID;
    rec RECORD;
BEGIN
    -- Obtener el primer restaurant_id disponible
    SELECT id INTO target_restaurant_id FROM restaurants LIMIT 1;
    
    IF target_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún restaurante en la base de datos';
    END IF;
    
    RAISE NOTICE 'Usando restaurant_id: %', target_restaurant_id;

    -- CREAR PLANTILLA: Cliente Alto Valor
    INSERT INTO message_templates (
        restaurant_id,
        name,
        segment,
        category,
        subject,
        content_markdown,
        variables,
        channel,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        target_restaurant_id,
        'Cliente Alto Valor - Agradecimiento',
        'alto_valor',
        'crm',
        'Gracias por ser parte de {{restaurant_name}}',
        'Hola {{customer_name}},

Queremos agradecerte por ser un cliente de alto valor de {{restaurant_name}}. Tus visitas regulares significan mucho para nosotros.

Hemos notado que disfrutas de nuestra cocina y ambiente, y eso nos llena de alegría. Seguimos trabajando cada día para ofrecerte la mejor experiencia gastronómica.

Si hay algo específico que te gustaría que mejoráramos o algún plato especial que te gustaría probar, ¡háznoslo saber!

Gracias por confiar en nosotros.

Con aprecio,
El equipo de {{restaurant_name}}',
        ARRAY['restaurant_name', 'customer_name'],
        'email',
        true,
        NOW(),
        NOW()
    );

    -- CREAR PLANTILLA: Cliente En Riesgo
    INSERT INTO message_templates (
        restaurant_id,
        name,
        segment,
        category,
        subject,
        content_markdown,
        variables,
        channel,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        target_restaurant_id,
        'Cliente En Riesgo - Atención Especial',
        'en_riesgo',
        'crm',
        '¿Cómo podemos mejorar tu experiencia en {{restaurant_name}}?',
        'Hola {{customer_name}},

Hemos notado que ha pasado un tiempo desde tu última visita a {{restaurant_name}}, y queremos asegurarnos de que todo esté bien.

Tu opinión es muy importante para nosotros. Si hubo algo en tu última experiencia que no cumplió con tus expectativas, nos encantaría saberlo para poder mejorarlo.

Estamos comprometidos a ofrecerte el mejor servicio posible, y tu feedback nos ayuda a lograrlo.

¿Te gustaría que te contactemos para hablar sobre cómo podemos hacer que tu próxima visita sea perfecta?

Valoramos mucho tu confianza.

Atentamente,
El equipo de {{restaurant_name}}',
        ARRAY['restaurant_name', 'customer_name'],
        'email',
        true,
        NOW(),
        NOW()
    );

    RAISE NOTICE '🎉 PLANTILLAS CREADAS: alto_valor y en_riesgo - Listas para usar';
END $$;

-- Verificar que se crearon
SELECT segment, name, is_active 
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
AND segment IN ('alto_valor', 'en_riesgo')
ORDER BY segment;
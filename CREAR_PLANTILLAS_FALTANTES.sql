-- =====================================================
-- CREAR PLANTILLAS CRM FALTANTES
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Obtener restaurant_id automáticamente (primera fila de restaurants)
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
    
    -- Verificar plantillas existentes
    RAISE NOTICE 'Plantillas existentes:';
    FOR rec IN (
        SELECT name, segment, is_active FROM message_templates 
        WHERE restaurant_id = target_restaurant_id
        ORDER BY segment
    ) LOOP
        RAISE NOTICE '- %: % (activa: %)', rec.segment, rec.name, rec.is_active;
    END LOOP;

    -- 2. CREAR PLANTILLA: Cliente Activo - Agradecimiento
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
        'Cliente Activo - Agradecimiento',
        'active',
        'crm',
        'Gracias por ser parte de {{restaurant_name}}',
        'Hola {{customer_name}},

Queremos agradecerte por ser un cliente activo de {{restaurant_name}}. Tus visitas regulares significan mucho para nosotros.

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

    -- 3. CREAR PLANTILLA: Cliente en Riesgo - Atención Especial  
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
        'Cliente en Riesgo - Atención Especial',
        'at_risk',
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

    -- 4. Verificar que se crearon correctamente
    RAISE NOTICE 'Plantillas creadas:';
    FOR rec IN (
        SELECT name, segment, subject, is_active, created_at
        FROM message_templates 
        WHERE restaurant_id = target_restaurant_id
        AND segment IN ('active', 'at_risk')
        ORDER BY segment
    ) LOOP
        RAISE NOTICE '✅ %: % (activa: %)', rec.segment, rec.name, rec.is_active;
    END LOOP;

    RAISE NOTICE '🎉 PLANTILLAS CREADAS: Cliente Activo y Cliente Riesgo - Listas para usar';
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL: Mostrar todas las plantillas
-- =====================================================
SELECT 
    segment,
    name,
    subject,
    is_active,
    channel,
    created_at::date as fecha_creacion
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
ORDER BY 
    CASE segment 
        WHEN 'nuevo' THEN 1
        WHEN 'activo' THEN 2  
        WHEN 'vip' THEN 3
        WHEN 'inactivo' THEN 4
        WHEN 'noshow' THEN 5
        WHEN 'riesgo' THEN 6
        ELSE 7
    END;

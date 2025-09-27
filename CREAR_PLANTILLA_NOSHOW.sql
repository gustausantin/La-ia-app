-- =====================================================
-- CREAR PLANTILLA NO-SHOW SI NO EXISTE
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

DO $$
DECLARE
    target_restaurant_id UUID;
BEGIN
    -- Obtener el primer restaurant_id disponible
    SELECT id INTO target_restaurant_id FROM restaurants LIMIT 1;
    
    -- Verificar si ya existe plantilla no-show
    IF NOT EXISTS (
        SELECT 1 FROM message_templates 
        WHERE restaurant_id = target_restaurant_id 
        AND segment = 'noshow'
    ) THEN
        -- Crear plantilla No-Show
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
            'Seguimiento No-Show',
            'noshow',
            'crm',
            'Te echamos de menos en {{restaurant_name}}',
            'Hola {{customer_name}},

Notamos que tenías una reserva con nosotros el {{reservation_date}} y no pudiste acompañarnos.

Entendemos que a veces surgen imprevistos. No hay problema, estas cosas pasan.

¿Te gustaría hacer una nueva reserva? Estaremos encantados de recibirte cuando te venga bien.

Si hubo algún inconveniente que podamos resolver, por favor háznoslo saber. Tu experiencia es muy importante para nosotros.

¡Esperamos verte pronto!

Un saludo cordial,
El equipo de {{restaurant_name}}',
            ARRAY['restaurant_name', 'customer_name', 'reservation_date'],
            'email',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Plantilla No-Show creada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ La plantilla No-Show ya existe';
    END IF;
END $$;

-- Verificar que existe
SELECT segment, name, is_active 
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
AND segment = 'noshow';

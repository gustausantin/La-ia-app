-- =====================================================
-- CREAR PLANTILLA NO-SHOW para todos los restaurantes
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- Función para crear plantilla no-show en un restaurante específico
CREATE OR REPLACE FUNCTION create_noshow_template_for_restaurant(p_restaurant_id UUID)
RETURNS void AS $$
BEGIN
    -- Insertar plantilla de no-show
    INSERT INTO message_templates (
        restaurant_id, 
        name, 
        category, 
        segment, 
        event_trigger,
        subject, 
        content_markdown, 
        variables, 
        channel, 
        is_active, 
        priority
    ) VALUES (
        p_restaurant_id,
        'Seguimiento No-Show',
        'seguimiento',
        'inactivo',
        'reservation_noshow',
        'Te echamos de menos en {{restaurant_name}}',
        E'Hola {{customer_name}} 👋\n\nNotamos que tenías una reserva con nosotros el {{reservation_date}} y no pudiste acompañarnos.\n\nEntendemos que a veces surgen imprevistos. No hay problema, estas cosas pasan. 😊\n\n¿Te gustaría hacer una nueva reserva? Estaremos encantados de recibirte cuando te venga bien.\n\nSi hubo algún inconveniente que podamos resolver, por favor háznoslo saber. Tu experiencia es muy importante para nosotros.\n\n¡Esperamos verte pronto! ✨\n\nUn saludo cordial,\nEl equipo de {{restaurant_name}}',
        ARRAY['customer_name', 'restaurant_name', 'reservation_date'],
        'whatsapp',
        true,
        3
    ) ON CONFLICT (restaurant_id, name) DO UPDATE SET
        content_markdown = EXCLUDED.content_markdown,
        variables = EXCLUDED.variables,
        updated_at = timezone('utc', now());
        
    RAISE NOTICE 'Plantilla no-show creada/actualizada para restaurant ID: %', p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a todos los restaurantes existentes
DO $$
DECLARE
    restaurant_record RECORD;
    total_count INTEGER := 0;
BEGIN
    FOR restaurant_record IN 
        SELECT id, name FROM restaurants WHERE active = true
    LOOP
        PERFORM create_noshow_template_for_restaurant(restaurant_record.id);
        total_count := total_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ PLANTILLAS NO-SHOW CREADAS: % restaurantes procesados', total_count;
END $$;

-- Verificar que se crearon correctamente
SELECT 
    r.name as restaurant_name,
    mt.name as template_name,
    mt.segment,
    mt.is_active
FROM message_templates mt
JOIN restaurants r ON r.id = mt.restaurant_id
WHERE mt.name = 'Seguimiento No-Show'
ORDER BY r.name;

-- Mensaje de confirmación
SELECT 'PLANTILLAS NO-SHOW CREADAS CORRECTAMENTE' as resultado;

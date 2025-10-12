-- =====================================================
-- MIGRACIÓN: RESET TOTAL DE PLANTILLAS
-- Fecha: 2025-10-12
-- Descripción: BORRAR TODO Y CREAR SOLO 10 PLANTILLAS LIMPIAS
-- =====================================================

-- ========================================
-- PASO 1: ELIMINAR TODAS LAS PLANTILLAS
-- ========================================

TRUNCATE TABLE message_templates RESTART IDENTITY CASCADE;

-- ========================================
-- PASO 2: CREAR SOLO 10 PLANTILLAS (1 POR CATEGORÍA)
-- Para el restaurante actual
-- ========================================

-- Obtener el restaurant_id (asumiendo que solo hay 1 restaurante)
DO $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  -- Obtener el primer restaurant_id
  SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
  
  -- Si no hay restaurantes, salir
  IF v_restaurant_id IS NULL THEN
    RAISE NOTICE 'No hay restaurantes en la base de datos';
    RETURN;
  END IF;
  
  -- Crear las 10 plantillas
  
  -- 1. BIENVENIDA
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Bienvenida Nuevo Cliente',
    'bienvenida',
    'whatsapp',
    'Hola {{customer_name}}! 👋

Gracias por tu primera reserva en {{restaurant_name}}. 

Esperamos que disfrutes mucho de la experiencia.

¡Te esperamos! 🍽️',
    true,
    'all',
    'manual'
  );

  -- 2. CONFIRMACIÓN 24H
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Confirmación 24h Antes',
    'confirmacion_24h',
    'whatsapp',
    'Hola {{customer_name}}! 👋

Te recordamos tu reserva en {{restaurant_name}}:

📅 Mañana
🕐 {{reservation_time}}
👥 {{party_size}} personas

¿Confirmas tu asistencia?

✅ Responde SÍ para confirmar
❌ Responde NO si necesitas cancelar

Gracias!',
    true,
    'all',
    'manual'
  );

  -- 3. CONFIRMACIÓN 4H
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Confirmación 4h Antes',
    'confirmacion_4h',
    'whatsapp',
    '¡Hola {{customer_name}}! ⏰

Recordatorio: tu reserva es HOY

🕐 A las {{reservation_time}}
👥 Para {{party_size}} personas

¿Todo listo para tu visita?

✅ Responde SÍ si vienes
❌ Responde NO si necesitas cancelar

¡Te esperamos!',
    true,
    'all',
    'manual'
  );

  -- 4. VIP
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Bienvenida Cliente VIP',
    'vip_upgrade',
    'whatsapp',
    '¡Hola {{customer_name}}! 👑

**¡Felicidades!** Ahora eres cliente VIP de {{restaurant_name}}.

**Tus beneficios:**
✨ Postre de cortesía en tu próxima visita
🎯 Reservas prioritarias
🎁 Ofertas exclusivas
📱 Atención personalizada

Gracias por tu fidelidad.

{{restaurant_name}} ❤️',
    true,
    'all',
    'manual'
  );

  -- 5. ALTO VALOR
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Reconocimiento Alto Valor',
    'alto_valor',
    'whatsapp',
    '{{customer_name}}, ¡eres increíble! 💎

Queremos reconocer que eres uno de nuestros clientes más especiales en {{restaurant_name}}.

**Tus visitas nos importan:**
📊 {{visits_count}} visitas
💰 {{total_spent}}€ invertidos

**Como agradecimiento:**
🥂 Cena degustación para 2
👨‍🍳 Mesa del chef disponible
🎁 Invitación a eventos privados

¡Gracias por confiar en nosotros!',
    true,
    'all',
    'manual'
  );

  -- 6. REACTIVACIÓN
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Reactivación Cliente Inactivo',
    'reactivacion',
    'whatsapp',
    '¡Hola {{customer_name}}! 😊

Hace {{days_since_last_visit}} días que no te vemos en {{restaurant_name}} y te echamos de menos.

**Tenemos novedades en el menú** que seguro te encantarán 🍽️

¿Qué te parece reservar tu mesa favorita?

Responde a este mensaje o llama al {{restaurant_phone}}.

¡Esperamos verte pronto! ✨',
    true,
    'all',
    'manual'
  );

  -- 7. RECUPERACIÓN
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Recuperación Cliente en Riesgo',
    'recuperacion',
    'whatsapp',
    'Hola {{customer_name}} 😊

Notamos que antes venías más seguido y queremos asegurarnos de que todo esté bien.

¿Hubo algo que no te gustó en tu última visita?

**Tu opinión es muy importante para nosotros.** 💬

Si quieres darnos otra oportunidad, tienes un **20% de descuento** esta semana. 🎁

Responde o llámanos al {{restaurant_phone}}.

¡Nos encantaría verte de nuevo!',
    true,
    'all',
    'manual'
  );

  -- 8. NO-SHOW
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Seguimiento No-Show',
    'noshow',
    'whatsapp',
    'Hola {{customer_name}},

Notamos que no pudiste venir a tu reserva de ayer en {{restaurant_name}}.

¿Todo bien? ¿Hubo algún problema?

Si quieres volver a reservar, estamos aquí para ayudarte.

Responde a este mensaje o llama al {{restaurant_phone}}.

¡Esperamos verte pronto! 🍽️',
    true,
    'all',
    'manual'
  );

  -- 9. GRUPO APROBACIÓN
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Aprobación Grupo Grande',
    'grupo_aprobacion',
    'whatsapp',
    '🎉 ¡Buenas noticias {{customer_name}}!

Tu reserva de grupo grande en {{restaurant_name}} ha sido APROBADA ✅

📅 {{reservation_date}}
🕐 {{reservation_time}}
👥 {{party_size}} personas

Recibirás un recordatorio 24 horas antes.

¡Te esperamos! 🍽️',
    true,
    'all',
    'manual'
  );

  -- 10. GRUPO RECHAZO
  INSERT INTO message_templates (
    restaurant_id, name, category, channel, content_markdown, is_active, segment, event_trigger
  ) VALUES (
    v_restaurant_id,
    'Rechazo Grupo Grande',
    'grupo_rechazo',
    'whatsapp',
    'Hola {{customer_name}} 😔

Lamentablemente no pudimos confirmar tu reserva de grupo grande en {{restaurant_name}}.

📅 {{reservation_date}}
🕐 {{reservation_time}}
👥 {{party_size}} personas

**Motivo:** {{rejection_reason}}

¿Quieres intentar con otra fecha?

Llámanos al {{restaurant_phone}} y buscaremos la mejor opción.

¡Esperamos verte pronto! 🙏',
    true,
    'all',
    'manual'
  );
  
  RAISE NOTICE '✅ 10 plantillas creadas correctamente para restaurant_id: %', v_restaurant_id;
  
END $$;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Total de plantillas
SELECT COUNT(*) as total_plantillas FROM message_templates;

-- Plantillas activas
SELECT COUNT(*) as plantillas_activas FROM message_templates WHERE is_active = true;

-- Por categoría
SELECT 
  category,
  COUNT(*) as total,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as activas
FROM message_templates
GROUP BY category
ORDER BY category;

-- Todas las plantillas
SELECT 
  category,
  name,
  channel,
  is_active
FROM message_templates
ORDER BY category;


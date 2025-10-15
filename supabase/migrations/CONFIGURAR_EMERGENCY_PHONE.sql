-- ════════════════════════════════════════════════════════════════
-- CONFIGURAR NÚMEROS DE EMERGENCIA PARA ESCALADO
-- ════════════════════════════════════════════════════════════════

-- Este script configura los números necesarios para el sistema de escalado:
-- 1. phone_number: Número de Twilio (quien ENVÍA mensajes)
-- 2. emergency_phone: Número del encargado (quien RECIBE alertas)

-- ════════════════════════════════════════════════════════════════
-- OPCIÓN 1: Actualizar restaurante existente
-- ════════════════════════════════════════════════════════════════

UPDATE restaurants
SET channels = jsonb_set(
  jsonb_set(
    COALESCE(channels, '{}'::jsonb),
    '{whatsapp,phone_number}',
    '"TU_NUMERO_TWILIO"'::jsonb
  ),
  '{whatsapp,emergency_phone}',
  '"TU_NUMERO_EMERGENCIA"'::jsonb
)
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- EJEMPLO CONCRETO:
/*
UPDATE restaurants
SET channels = jsonb_set(
  jsonb_set(
    COALESCE(channels, '{}'::jsonb),
    '{whatsapp,phone_number}',
    '"+14155238886"'::jsonb  -- Número de Twilio (ENVÍA)
  ),
  '{whatsapp,emergency_phone}',
  '"+34671126148"'::jsonb    -- Número del encargado (RECIBE alertas)
)
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';
*/

-- ════════════════════════════════════════════════════════════════
-- OPCIÓN 2: Verificar configuración actual
-- ════════════════════════════════════════════════════════════════

SELECT 
  id,
  name,
  phone as telefono_principal,
  channels->'whatsapp'->>'phone_number' as twilio_number,
  channels->'whatsapp'->>'emergency_phone' as emergency_phone,
  channels as configuracion_completa
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- ════════════════════════════════════════════════════════════════
-- OPCIÓN 3: Estructura completa recomendada
-- ════════════════════════════════════════════════════════════════

/*
{
  "whatsapp": {
    "phone_number": "+14155238886",     // Número de Twilio (ENVÍA mensajes)
    "emergency_phone": "+34671126148",  // Número del encargado (RECIBE alertas)
    "enabled": true,
    "sandbox": true
  },
  "email": {
    "enabled": true,
    "from": "noreply@laiarestaurante.com",
    "emergency_email": "encargado@restaurante.com"
  }
}
*/

-- ════════════════════════════════════════════════════════════════
-- VALIDACIÓN: Comprobar que los números están bien configurados
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  twilio_num TEXT;
  emergency_num TEXT;
BEGIN
  SELECT 
    channels->'whatsapp'->>'phone_number',
    channels->'whatsapp'->>'emergency_phone'
  INTO twilio_num, emergency_num
  FROM restaurants
  WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';
  
  IF twilio_num IS NULL THEN
    RAISE WARNING '⚠️ FALTA: channels.whatsapp.phone_number (número de Twilio)';
  ELSE
    RAISE NOTICE '✅ Twilio number configurado: %', twilio_num;
  END IF;
  
  IF emergency_num IS NULL THEN
    RAISE WARNING '⚠️ FALTA: channels.whatsapp.emergency_phone (número de emergencia)';
  ELSE
    RAISE NOTICE '✅ Emergency phone configurado: %', emergency_num;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- NOTAS IMPORTANTES
-- ════════════════════════════════════════════════════════════════

/*
📋 DIFERENCIA ENTRE LOS NÚMEROS:

1. phone_number (Twilio):
   - Es el número de Twilio del restaurante
   - Se usa como FROM en los mensajes
   - Envía notificaciones, recordatorios, etc.
   - Ejemplo: +14155238886 (Twilio Sandbox)

2. emergency_phone:
   - Es el número personal del encargado/responsable
   - Se usa como TO en las alertas de escalado
   - Recibe notificaciones URGENTES cuando hay problemas
   - Debe ser un número móvil real
   - Ejemplo: +34671126148

⚠️ IMPORTANTE:
- Ambos números DEBEN estar en formato E.164: +[código país][número]
- NO pueden ser el mismo número
- El emergency_phone debe estar disponible 24/7 para emergencias
*/



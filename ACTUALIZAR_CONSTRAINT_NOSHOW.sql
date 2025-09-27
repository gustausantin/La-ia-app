-- =====================================================
-- ACTUALIZAR CONSTRAINT PARA PERMITIR 'noshow'
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Eliminar constraint antiguo
ALTER TABLE message_templates 
DROP CONSTRAINT IF EXISTS message_templates_segment_check;

-- 2. Crear constraint nuevo que incluye 'noshow'
ALTER TABLE message_templates 
ADD CONSTRAINT message_templates_segment_check 
CHECK (segment IN ('nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor', 'noshow', 'all'));

-- 3. Actualizar la plantilla existente de inactivo a noshow
UPDATE message_templates 
SET segment = 'noshow'
WHERE name = 'Seguimiento No-Show'
AND restaurant_id = (SELECT id FROM restaurants LIMIT 1);

-- 4. Verificar que se actualizó
SELECT segment, name, is_active 
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
AND segment = 'noshow';

-- Mensaje de confirmación
SELECT 'CONSTRAINT ACTUALIZADO - noshow ahora es un segment válido' as resultado;

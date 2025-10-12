-- =====================================================
-- VERIFICACIÓN: ¿Qué plantilla debe coger N8N?
-- =====================================================

-- Ver TODAS las plantillas de confirmacion_24h que existen
SELECT 
  id,
  restaurant_id,
  name,
  category,
  is_active,
  content_markdown
FROM message_templates
WHERE category = 'confirmacion_24h'
ORDER BY restaurant_id, is_active DESC;

-- Ver específicamente para Casa Paco
SELECT 
  id,
  name,
  category,
  is_active,
  LEFT(content_markdown, 100) as preview
FROM message_templates
WHERE category = 'confirmacion_24h'
  AND restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';


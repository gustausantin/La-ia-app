-- =====================================================
-- VERIFICAR QUE LA PLANTILLA NO-SHOW EXISTE
-- =====================================================

-- Ver la plantilla No-Show
SELECT 
    segment,
    name,
    subject,
    is_active,
    created_at::date as fecha_creacion
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
AND name LIKE '%No-Show%'
ORDER BY created_at DESC;

-- Ver TODAS las plantillas agrupadas por segment
SELECT 
    segment,
    COUNT(*) as cantidad,
    STRING_AGG(name, ', ') as plantillas
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
GROUP BY segment
ORDER BY segment;

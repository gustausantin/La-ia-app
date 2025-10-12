-- Esta es la query EXACTA que N8N está ejecutando
SELECT *
FROM message_templates
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND category = 'confirmacion_24h'
  AND is_active = true
LIMIT 1;


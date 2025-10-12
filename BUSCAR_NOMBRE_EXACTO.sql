-- Ver el nombre EXACTO de la plantilla activa de 24h
SELECT 
  name,
  category
FROM message_templates
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND is_active = true
ORDER BY category;


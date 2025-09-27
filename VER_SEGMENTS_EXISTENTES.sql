-- Ver qué segments están permitidos (copiando de plantillas existentes)
SELECT DISTINCT segment 
FROM message_templates 
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
ORDER BY segment;

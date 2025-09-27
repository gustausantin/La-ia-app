-- Actualizar el nombre de la plantilla para que se escriba correctamente
UPDATE message_templates 
SET name = 'Seguimiento No-Show'
WHERE segment = 'noshow'
AND restaurant_id = (SELECT id FROM restaurants LIMIT 1);

-- Verificar
SELECT segment, name, is_active 
FROM message_templates 
WHERE segment = 'noshow';

SELECT 'Nombre actualizado a No-Show (con guión)' as resultado;

-- Ver TODOS los segmentos de clientes
SELECT 
    segment_auto,
    COUNT(*) as cantidad
FROM customers 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
GROUP BY segment_auto
ORDER BY cantidad DESC;

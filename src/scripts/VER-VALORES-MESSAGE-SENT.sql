SELECT DISTINCT message_sent, COUNT(*) as cantidad
FROM noshow_actions
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
GROUP BY message_sent
ORDER BY cantidad DESC;

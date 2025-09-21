-- SOLO VERIFICAR qué no-shows YA EXISTEN
SELECT 
    'Reservas de hoy con riesgo' as tipo,
    COUNT(*) as cantidad
FROM reservations r
JOIN customers c ON r.customer_id = c.id
WHERE r.restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
AND r.reservation_date = CURRENT_DATE
AND r.status IN ('pending', 'confirmed')

UNION ALL

SELECT 
    'NoShow Actions de hoy' as tipo,
    COUNT(*) as cantidad
FROM noshow_actions
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
AND reservation_date = CURRENT_DATE

UNION ALL

SELECT 
    'NoShow Actions alto riesgo hoy' as tipo,
    COUNT(*) as cantidad
FROM noshow_actions
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
AND reservation_date = CURRENT_DATE
AND risk_level = 'high';

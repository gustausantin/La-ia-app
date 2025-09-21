-- ===================================================================
-- VERIFICAR RESERVATION_SOURCE EN RESERVAS - TAVERTET
-- ===================================================================

-- Ver qué valores tiene reservation_source
SELECT 
    'RESERVATION_SOURCE VALUES' as info,
    reservation_source,
    COUNT(*) as cantidad
FROM reservations 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
GROUP BY reservation_source
ORDER BY cantidad DESC;

-- Ver todas las reservas de hoy con su source
SELECT 
    'RESERVAS HOY' as info,
    customer_name,
    reservation_source,
    status,
    reservation_time,
    party_size
FROM reservations 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
  AND reservation_date = CURRENT_DATE
ORDER BY reservation_time;

-- DATOS REALES SIMPLES - UNA CONSULTA POR VEZ

-- 1. CLIENTES TOTALES
SELECT 'CLIENTES_TOTAL' as metrica, COUNT(*) as valor
FROM customers 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 2. CLIENTES POR SEGMENTO
SELECT 'CLIENTES_SEGMENTO' as metrica, segment_auto, COUNT(*) as cantidad
FROM customers 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
GROUP BY segment_auto
ORDER BY cantidad DESC;

-- 3. RESERVAS TOTALES
SELECT 'RESERVAS_TOTAL' as metrica, COUNT(*) as valor
FROM reservations 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 4. RESERVAS HOY
SELECT 'RESERVAS_HOY' as metrica, COUNT(*) as valor
FROM reservations 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
  AND reservation_date = CURRENT_DATE;

-- 5. NO-SHOWS TOTAL
SELECT 'NOSHOWS_TOTAL' as metrica, COUNT(*) as valor
FROM noshow_actions 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 6. NO-SHOWS HOY
SELECT 'NOSHOWS_HOY' as metrica, COUNT(*) as valor
FROM noshow_actions 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
  AND reservation_date = CURRENT_DATE;

-- 7. CONVERSACIONES
SELECT 'CONVERSACIONES' as metrica, COUNT(*) as valor
FROM conversations 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 8. MENSAJES
SELECT 'MENSAJES' as metrica, COUNT(*) as valor
FROM messages 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 9. CRM OPPORTUNITIES
SELECT 'CRM_OPPORTUNITIES' as metrica, COUNT(*) as valor
FROM crm_suggestions 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 10. TICKETS
SELECT 'TICKETS' as metrica, COUNT(*) as valor
FROM billing_tickets 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 11. FACTURACIÓN TOTAL
SELECT 'FACTURACION_TOTAL' as metrica, ROUND(SUM(total_amount), 2) as valor
FROM billing_tickets 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

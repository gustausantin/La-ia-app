-- ==========================================
-- VERIFICACIÓN COMPLETA DEL ESTADO ACTUAL
-- ==========================================

-- 1. ¿El script anterior se ejecutó correctamente?
SELECT 
    'CLIENTES CREADOS HOY' as verificacion,
    COUNT(*) as cantidad
FROM customers 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND DATE(created_at) = CURRENT_DATE;

-- 2. ¿Hay reservas para HOY?
SELECT 
    'RESERVAS PARA HOY' as verificacion,
    COUNT(*) as cantidad,
    STRING_AGG(customer_name || ' (' || reservation_time::text || ')', ', ') as detalles
FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND reservation_date = CURRENT_DATE;

-- 3. ¿Esas reservas tienen tickets?
SELECT 
    'TICKETS VINCULADOS A RESERVAS DE HOY' as verificacion,
    COUNT(DISTINCT bt.id) as cantidad,
    COALESCE(SUM(bt.total_amount), 0) as facturacion_total
FROM reservations r
LEFT JOIN billing_tickets bt ON r.id = bt.reservation_id
WHERE r.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND r.reservation_date = CURRENT_DATE;

-- 4. ¿Por qué no hay vinculación?
SELECT 
    'PROBLEMA DE VINCULACIÓN' as verificacion,
    r.id as reserva_id,
    r.customer_name,
    r.status as reserva_status,
    bt.id as ticket_id,
    CASE 
        WHEN bt.id IS NULL THEN 'SIN TICKET'
        ELSE 'CON TICKET'
    END as vinculacion
FROM reservations r
LEFT JOIN billing_tickets bt ON r.id = bt.reservation_id
WHERE r.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND r.reservation_date = CURRENT_DATE;

-- 5. ¿Hay conversaciones?
SELECT 
    'CONVERSACIONES TOTALES' as verificacion,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as abiertas,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as creadas_hoy
FROM conversations
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 6. ¿Hay mensajes?
SELECT 
    'MENSAJES TOTALES' as verificacion,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as enviados_hoy
FROM messages
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 7. ¿Hay acciones no-show?
SELECT 
    'NO-SHOWS GESTIONADOS' as verificacion,
    COUNT(*) as total,
    COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as para_hoy,
    COUNT(CASE WHEN risk_level = 'high' AND reservation_date = CURRENT_DATE THEN 1 END) as alto_riesgo_hoy
FROM noshow_actions
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 8. ¿El script se ejecutó?
SELECT 
    'ÚLTIMA ACTIVIDAD' as verificacion,
    MAX(created_at) as ultima_creacion,
    CASE 
        WHEN MAX(created_at) > NOW() - INTERVAL '10 minutes' THEN 'SCRIPT EJECUTADO RECIENTEMENTE'
        ELSE 'SCRIPT NO EJECUTADO O FALLÓ'
    END as estado
FROM customers
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';

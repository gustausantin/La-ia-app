-- ========================================
-- VERIFICACIÓN: Estado actual de reservas pasadas
-- Restaurant: Casa Paco (d6b63130-1ebf-4284-98fc-a3b31a85d9d1)
-- Fecha: 11/10/2025 09:53
-- ========================================

-- 1. LISTAR TODAS LAS RESERVAS PASADAS CON ESTADO PENDING
SELECT 
    customer_name,
    reservation_date,
    reservation_time,
    status,
    party_size,
    (reservation_date::TIMESTAMP + reservation_time) as momento_reserva,
    NOW() as ahora,
    NOW() - INTERVAL '2 hours' as cutoff_2h,
    CASE 
        WHEN (reservation_date::TIMESTAMP + reservation_time) < (NOW() - INTERVAL '2 hours') 
        THEN '❌ DEBE SER NO-SHOW'
        ELSE '✅ Todavía no caducó'
    END as deberia_ser
FROM reservations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND status = 'pending'
ORDER BY reservation_date DESC, reservation_time DESC;

-- 2. CONTAR RESERVAS QUE DEBERÍAN SER NO-SHOW
SELECT 
    COUNT(*) as total_pending_caducadas,
    STRING_AGG(customer_name, ', ') as nombres
FROM reservations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND status = 'pending'
AND (reservation_date::TIMESTAMP + reservation_time) < (NOW() - INTERVAL '2 hours');

-- 3. VERIFICAR PREDICCIONES DE RIESGO HOY
SELECT 
    customer_name,
    reservation_date,
    reservation_time,
    risk_level,
    risk_score,
    noshow_probability,
    confirmation_status
FROM predict_upcoming_noshows_v2('d6b63130-1ebf-4284-98fc-a3b31a85d9d1', 0)
ORDER BY risk_score DESC;

-- 4. VERIFICAR MÉTRICAS DE NO-SHOWS
SELECT * FROM get_restaurant_noshow_metrics('d6b63130-1ebf-4284-98fc-a3b31a85d9d1');

-- 5. CONTAR RESERVAS DE HOY POR TIPO DE CLIENTE
SELECT 
    r.customer_name,
    r.party_size,
    r.customer_id,
    c.visits_count,
    c.segment_auto,
    CASE 
        WHEN r.customer_id IS NULL THEN 'NUEVO (sin customer_id)'
        WHEN c.visits_count = 1 THEN 'NUEVO (1 visita)'
        WHEN c.visits_count >= 2 AND c.visits_count < 10 THEN 'HABITUAL'
        WHEN c.visits_count >= 10 OR c.segment_auto = 'vip' THEN 'VIP'
        ELSE 'OTRO'
    END as tipo_cliente
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND r.reservation_date = CURRENT_DATE
AND r.status IN ('pending', 'pending_approval', 'confirmed', 'seated', 'completed')
ORDER BY r.reservation_time;



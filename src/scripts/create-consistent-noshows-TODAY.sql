-- =========================================
-- CREAR NO-SHOWS CONSISTENTES PARA HOY
-- =========================================
-- Este script crea NO-SHOWS REALES para que la aplicación
-- muestre SIEMPRE la misma información desde las tablas

BEGIN;

-- ==========================================
-- 1. LIMPIAR DATOS DE HOY PRIMERO
-- ==========================================

-- Eliminar reservas y acciones de HOY para empezar limpio
DELETE FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') 
AND reservation_date = CURRENT_DATE;

DELETE FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') 
AND reservation_date = CURRENT_DATE;

-- ==========================================
-- 2. CREAR RESERVAS DE HOY CON NO-SHOWS REALES
-- ==========================================

-- RESERVA 1: COMPLETADA (sin riesgo)
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, CURRENT_DATE, '12:30'::time, 2, 'completed', 'whatsapp', 'Mesa tranquila', 45.50, 'Comida exitosa - cliente satisfecho', CURRENT_DATE - INTERVAL '2 hours'
FROM restaurants r, customers c 
WHERE r.name = 'Restaurante Demo' AND c.name = 'Luis Martínez';

-- RESERVA 2: ALTO RIESGO - CONFIRMADA (para testing)
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, CURRENT_DATE, '20:00'::time, 8, 'confirmed', 'whatsapp', 'Celebración empresa', 0.00, 'ALTO RIESGO: Grupo grande + hora pico', CURRENT_DATE - INTERVAL '4 hours'
FROM restaurants r, customers c 
WHERE r.name = 'Restaurante Demo' AND c.name = 'Elena Fernández';

-- RESERVA 3: ALTO RIESGO - CONFIRMADA (para testing)
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, CURRENT_DATE, '21:30'::time, 1, 'confirmed', 'whatsapp', 'Cena individual', 0.00, 'ALTO RIESGO: Persona sola + hora tardía', CURRENT_DATE - INTERVAL '3 hours'
FROM restaurants r, customers c 
WHERE r.name = 'Restaurante Demo' AND c.name = 'Pedro Sánchez';

-- RESERVA 4: NO-SHOW REAL (para métricas)
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, CURRENT_DATE, '19:00'::time, 4, 'no_show', 'whatsapp', 'Cena familiar', 0.00, 'NO-SHOW: No apareció ni canceló', CURRENT_DATE - INTERVAL '5 hours'
FROM restaurants r, customers c 
WHERE r.name = 'Restaurante Demo' AND c.name = 'Antonio López';

-- RESERVA 5: NORMAL - CONFIRMADA
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, CURRENT_DATE, '19:30'::time, 2, 'confirmed', 'whatsapp', 'Cena romántica', 0.00, 'Reserva normal - bajo riesgo', CURRENT_DATE - INTERVAL '1 hour'
FROM restaurants r, customers c 
WHERE r.name = 'Restaurante Demo' AND c.name = 'María García';

-- ==========================================
-- 3. CREAR ACCIONES DE NO-SHOW PARA LAS DE ALTO RIESGO
-- ==========================================

-- Acción para Elena (grupo grande)
INSERT INTO noshow_actions (restaurant_id, reservation_id, customer_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, risk_level, risk_score, risk_factors, action_type, channel, message_sent, customer_response, final_outcome, prevented_noshow, created_at, sent_at)
SELECT r.id, res.id, c.id, c.name, c.phone, res.reservation_date, res.reservation_time, res.party_size, 'high', 90, 
'["grupo_grande", "hora_pico", "empresa"]'::jsonb,
'whatsapp_confirmation', 'whatsapp',
'Hola Elena! Confirmamos tu reserva para 8 personas esta noche a las 20:00. ¿Todo correcto?',
'confirmed', 'pending', false,
CURRENT_DATE + INTERVAL '15:00:00', CURRENT_DATE + INTERVAL '15:05:00'
FROM restaurants r, customers c, reservations res
WHERE r.name = 'Restaurante Demo' 
AND c.name = 'Elena Fernández' 
AND res.customer_id = c.id 
AND res.reservation_date = CURRENT_DATE
AND res.reservation_time = '20:00'::time;

-- Acción para Pedro (persona sola)
INSERT INTO noshow_actions (restaurant_id, reservation_id, customer_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, risk_level, risk_score, risk_factors, action_type, channel, message_sent, customer_response, final_outcome, prevented_noshow, created_at, sent_at)
SELECT r.id, res.id, c.id, c.name, c.phone, res.reservation_date, res.reservation_time, res.party_size, 'high', 85, 
'["persona_sola", "hora_tardia", "ocasional"]'::jsonb,
'whatsapp_confirmation', 'whatsapp',
'Hola Pedro! Te recordamos tu reserva para esta noche a las 21:30. ¿Vienes seguro?',
'no_response', 'pending', false,
CURRENT_DATE + INTERVAL '16:00:00', CURRENT_DATE + INTERVAL '16:05:00'
FROM restaurants r, customers c, reservations res
WHERE r.name = 'Restaurante Demo' 
AND c.name = 'Pedro Sánchez' 
AND res.customer_id = c.id 
AND res.reservation_date = CURRENT_DATE
AND res.reservation_time = '21:30'::time;

-- ==========================================
-- 4. CREAR ACCIONES DE SEMANA PASADA (PARA MÉTRICAS)
-- ==========================================

-- Insertar acciones de la semana pasada con RESULTADOS REALES
INSERT INTO noshow_actions (restaurant_id, customer_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, risk_level, risk_score, risk_factors, action_type, channel, message_sent, customer_response, final_outcome, prevented_noshow, created_at, sent_at)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    CURRENT_DATE - INTERVAL '1 day' * action_data.days_ago as reservation_date,
    action_data.time as reservation_time,
    action_data.party_size,
    action_data.risk_level,
    action_data.risk_score,
    action_data.risk_factors::jsonb,
    'whatsapp_confirmation' as action_type,
    'whatsapp' as channel,
    action_data.message_sent,
    action_data.customer_response,
    action_data.final_outcome,
    action_data.final_outcome = 'attended' as prevented_noshow,
    CURRENT_DATE - INTERVAL '1 day' * action_data.days_ago - INTERVAL '2 hours' as created_at,
    CURRENT_DATE - INTERVAL '1 day' * action_data.days_ago - INTERVAL '1 hour 55 minutes' as sent_at
FROM restaurants r
CROSS JOIN customers c
CROSS JOIN (
    VALUES 
        -- Hace 1 día: 3 acciones exitosas
        (1, '20:00'::time, 6, 'high', 85, '["grupo_grande", "hora_pico"]', 'Hola! Confirmamos tu reserva para 6 personas. ¿Todo OK?', 'confirmed', 'attended'),
        (1, '19:30'::time, 4, 'medium', 65, '["cliente_nuevo"]', 'Recordatorio de tu reserva para esta noche', 'confirmed', 'attended'),
        (1, '21:00'::time, 2, 'medium', 70, '["hora_tardia"]', 'Hola! ¿Mantienes tu reserva de las 21:00?', 'confirmed', 'attended'),
        
        -- Hace 2 días: 2 acciones, 1 no-show
        (2, '20:30'::time, 8, 'high', 90, '["grupo_muy_grande", "hora_pico"]', 'Confirmación urgente para 8 personas', 'no_response', 'no_show'),
        (2, '19:00'::time, 3, 'medium', 60, '["familia"]', 'Recordatorio de reserva familiar', 'confirmed', 'attended'),
        
        -- Hace 3 días: 2 acciones exitosas
        (3, '13:00'::time, 4, 'medium', 65, '["comida_negocios"]', 'Confirmación comida de trabajo', 'confirmed', 'attended'),
        (3, '20:00'::time, 2, 'low', 45, '["pareja_habitual"]', 'Hola! Todo listo para esta noche', 'confirmed', 'attended'),
        
        -- Hace 4 días: 1 acción exitosa
        (4, '19:30'::time, 5, 'high', 80, '["grupo_mediano", "viernes"]', 'Confirmación para grupo de 5', 'confirmed', 'attended'),
        
        -- Hace 5 días: 2 acciones, 1 cancelada
        (5, '21:30'::time, 1, 'high', 85, '["persona_sola", "hora_muy_tardia"]', 'Recordatorio reserva individual', 'cancelled', 'cancelled'),
        (5, '20:00'::time, 6, 'high', 88, '["grupo_grande", "sabado"]', 'Confirmación grupo grande sábado', 'confirmed', 'attended'),
        
        -- Hace 6 días: 3 acciones exitosas
        (6, '12:30'::time, 2, 'low', 40, '["comida_temprana"]', 'Buenos días! Reserva confirmada', 'confirmed', 'attended'),
        (6, '19:00'::time, 4, 'medium', 70, '["familia_habitual"]', 'Hola familia! ¿Todo bien para hoy?', 'confirmed', 'attended'),
        (6, '20:30'::time, 3, 'medium', 65, '["amigos"]', 'Confirmación cena de amigos', 'confirmed', 'attended')
) AS action_data(days_ago, time, party_size, risk_level, risk_score, risk_factors, message_sent, customer_response, final_outcome)
WHERE r.name = 'Restaurante Demo'
AND c.restaurant_id = r.id
AND random() < 0.3; -- 30% de clientes tienen acciones

-- ==========================================
-- 5. VERIFICACIÓN DE CONSISTENCIA
-- ==========================================

DO $$
DECLARE
    today_reservations INTEGER;
    today_high_risk INTEGER;
    today_noshows INTEGER;
    weekly_prevented INTEGER;
    weekly_actions INTEGER;
BEGIN
    -- Contar reservas de HOY
    SELECT COUNT(*) INTO today_reservations
    FROM reservations 
    WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
    AND reservation_date = CURRENT_DATE;
    
    -- Contar alto riesgo HOY (usando la lógica real)
    SELECT COUNT(*) INTO today_high_risk
    FROM reservations 
    WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
    AND reservation_date = CURRENT_DATE
    AND status = 'confirmed'
    AND (
        (party_size > 6) OR  -- Grupo grande
        (reservation_time >= '20:00'::time) OR  -- Hora pico
        (reservation_time <= '13:00'::time) OR  -- Hora temprana
        (party_size = 1 AND reservation_time >= '21:00'::time)  -- Solo + tardío
    );
    
    -- Contar no-shows de HOY
    SELECT COUNT(*) INTO today_noshows
    FROM reservations 
    WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
    AND reservation_date = CURRENT_DATE
    AND status = 'no_show';
    
    -- Contar acciones exitosas de la semana
    SELECT COUNT(*) INTO weekly_prevented
    FROM noshow_actions 
    WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND final_outcome = 'attended';
    
    -- Contar total acciones de la semana
    SELECT COUNT(*) INTO weekly_actions
    FROM noshow_actions 
    WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    RAISE NOTICE '=== DATOS CONSISTENTES CREADOS ===';
    RAISE NOTICE 'Reservas HOY: %', today_reservations;
    RAISE NOTICE 'Alto riesgo HOY: %', today_high_risk;
    RAISE NOTICE 'No-shows HOY: %', today_noshows;
    RAISE NOTICE 'Acciones exitosas semana: %', weekly_prevented;
    RAISE NOTICE 'Total acciones semana: %', weekly_actions;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 AHORA LA APLICACIÓN MOSTRARÁ SIEMPRE:';
    RAISE NOTICE '- Dashboard: % reservas de alto riesgo hoy', today_high_risk;
    RAISE NOTICE '- Dashboard: % no-shows evitados esta semana', weekly_prevented;
    RAISE NOTICE '- NoShow Detail: % reservas de alto riesgo hoy', today_high_risk;
    RAISE NOTICE '- Todos los números serán CONSISTENTES';
END $$;

COMMIT;

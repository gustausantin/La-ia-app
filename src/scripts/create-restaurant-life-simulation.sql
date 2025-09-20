-- =========================================
-- SIMULACIÓN DE VIDA REAL DE RESTAURANTE
-- =========================================
-- Esta es la historia completa de "Restaurante Demo" durante 6 meses
-- Cada cliente tiene su historia: primera visita, evolución, hábitos, etc.

BEGIN;

-- ==========================================
-- 1. LIMPIAR Y PREPARAR
-- ==========================================

DELETE FROM analytics WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM analytics_historical WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND name != 'Usuario Admin';

-- ==========================================
-- 2. HISTORIA MES 1: ENERO - ARRANQUE
-- ==========================================

-- SEMANA 1: Los primeros clientes llegan
INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'María García', 'María', 'García', 'maria.garcia@email.com', '+34666111222', 'nuevo', 0, 0, 0, 70, NULL, ARRAY['nuevo'], 'Primera cliente del restaurante', '2025-01-03'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Carlos Mendez', 'Carlos', 'Mendez', 'carlos.mendez@email.com', '+34666333444', 'nuevo', 0, 0, 0, 50, NULL, ARRAY['nuevo'], 'Llegó por recomendación', '2025-01-05'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

-- PRIMERA CONVERSACIÓN: María quiere reservar
INSERT INTO conversations (restaurant_id, customer_id, customer_name, customer_phone, subject, status, priority, channel, metadata, created_at, updated_at)
SELECT r.id, c.id, c.name, c.phone, 'Primera reserva - inauguración', 'closed', 'normal', 'whatsapp',
jsonb_build_object('booking_successful', true, 'response_time_minutes', 2, 'satisfaction_score', 5, 'first_contact', true),
'2025-01-03 18:30:00', '2025-01-03 18:45:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'María García';

-- MENSAJES de la conversación
INSERT INTO messages (restaurant_id, customer_name, customer_phone, message_text, direction, channel, message_type, status, metadata, created_at)
SELECT r.id, 'María García', '+34666111222', msg_data.message_text, msg_data.direction, 'whatsapp', msg_data.message_type, 'sent',
jsonb_build_object('automated', msg_data.direction = 'outbound'),
'2025-01-03 18:30:00'::timestamp + INTERVAL '1 minute' * msg_data.order_num
FROM restaurants r
CROSS JOIN (
    VALUES 
        ('Hola! He visto que han abierto. ¿Puedo reservar para mañana noche?', 'inbound', 'text', 0),
        ('¡Hola María! ¡Bienvenida! Claro, ¿para cuántas personas y a qué hora?', 'outbound', 'text', 2),
        ('Para 2 personas a las 21:00 si es posible', 'inbound', 'text', 4),
        ('¡Perfecto! Reserva confirmada para 2 personas mañana 4 de enero a las 21:00. ¡Será un placer recibirte! 🍽️', 'outbound', 'text', 5)
) AS msg_data(message_text, direction, message_type, order_num)
WHERE r.name = 'Restaurante Demo';

-- PRIMERA RESERVA: María viene
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, '2025-01-04'::date, '21:00'::time, 2, 'completed', 'whatsapp', 'Mesa tranquila por favor', 68.50, 'Primera visita - muy satisfecha', '2025-01-03 18:35:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'María García';

-- ACTUALIZAR CLIENTE después de su primera visita
UPDATE customers SET 
    total_visits = 1, 
    total_spent = 68.50, 
    avg_ticket = 68.50, 
    segment_auto = 'activo',
    last_visit_at = '2025-01-04',
    churn_risk_score = 20,
    tags = ARRAY['activo', 'primera_visita_exitosa']
WHERE name = 'María García';

-- ==========================================
-- 3. HISTORIA MES 1-2: FEBRERO - CRECIMIENTO
-- ==========================================

-- Más clientes llegan por boca a boca
INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Ana Rodríguez', 'Ana', 'Rodríguez', 'ana.rodriguez@email.com', '+34666555666', 'nuevo', 0, 0, 0, 60, NULL, ARRAY['nuevo'], 'Vino por recomendación de María', '2025-01-15'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Luis Martínez', 'Luis', 'Martínez', 'luis.martinez@email.com', '+34666777888', 'nuevo', 0, 0, 0, 40, NULL, ARRAY['nuevo'], 'Cliente habitual desde el inicio', '2025-01-20'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

-- María REGRESA (se convierte en cliente regular)
INSERT INTO conversations (restaurant_id, customer_id, customer_name, customer_phone, subject, status, priority, channel, metadata, created_at, updated_at)
SELECT r.id, c.id, c.name, c.phone, 'Segunda visita - me encantó', 'closed', 'normal', 'whatsapp',
jsonb_build_object('booking_successful', true, 'response_time_minutes', 1, 'satisfaction_score', 5, 'returning_customer', true),
'2025-01-18 19:15:00', '2025-01-18 19:20:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'María García';

INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, '2025-01-19'::date, '20:30'::time, 2, 'completed', 'whatsapp', 'La misma mesa de la vez pasada si es posible', 72.00, 'Cliente regular - prefiere terraza', '2025-01-18 19:16:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'María García';

-- ACTUALIZAR María (ahora es REGULAR)
UPDATE customers SET 
    total_visits = 2, 
    total_spent = 140.50, 
    avg_ticket = 70.25, 
    segment_auto = 'regular',
    last_visit_at = '2025-01-19',
    churn_risk_score = 15,
    tags = ARRAY['regular', 'terraza', 'pareja']
WHERE name = 'María García';

-- ==========================================
-- 4. PRIMER NO-SHOW: Carlos no aparece
-- ==========================================

-- Carlos hace reserva pero no viene (típico de nuevos clientes)
INSERT INTO conversations (restaurant_id, customer_id, customer_name, customer_phone, subject, status, priority, channel, metadata, created_at, updated_at)
SELECT r.id, c.id, c.name, c.phone, 'Reserva para el fin de semana', 'closed', 'normal', 'whatsapp',
jsonb_build_object('booking_successful', true, 'response_time_minutes', 5, 'satisfaction_score', 4),
'2025-01-25 16:45:00', '2025-01-25 16:55:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'Carlos Mendez';

INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, '2025-01-26'::date, '21:00'::time, 4, 'no_show', 'whatsapp', 'Celebración con amigos', 0.00, 'No-show - no apareció', '2025-01-25 16:50:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'Carlos Mendez';

-- ACCIÓN DE NO-SHOW: Sistema intenta contactar
INSERT INTO noshow_actions (restaurant_id, reservation_id, customer_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, risk_level, risk_score, risk_factors, action_type, channel, message_sent, customer_response, final_outcome, prevented_noshow, created_at, sent_at)
SELECT r.id, res.id, c.id, c.name, c.phone, res.reservation_date, res.reservation_time, res.party_size, 'high', 85, 
'["cliente_nuevo", "grupo_grande", "sabado_noche"]'::jsonb, 
'whatsapp_confirmation', 'whatsapp', 
'Hola Carlos! Confirmamos tu reserva para 4 personas esta noche a las 21:00. ¿Vienes seguro?', 
'no_response', 'no_show', false, '2025-01-26 18:00:00', '2025-01-26 18:05:00'
FROM restaurants r, customers c, reservations res 
WHERE r.name = 'Restaurante Demo' AND c.name = 'Carlos Mendez' AND res.customer_id = c.id AND res.reservation_date = '2025-01-26';

-- ACTUALIZAR Carlos (riesgo alto por no-show)
UPDATE customers SET 
    churn_risk_score = 95,
    segment_auto = 'riesgo',
    tags = ARRAY['riesgo', 'no_show', 'nuevo']
WHERE name = 'Carlos Mendez';

-- ==========================================
-- 5. MES 2-3: MARZO - CLIENTES VIP EMERGEN
-- ==========================================

-- Luis se convierte en cliente FIEL
INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Elena Fernández', 'Elena', 'Fernández', 'elena.fernandez@email.com', '+34666999000', 'nuevo', 0, 0, 0, 30, NULL, ARRAY['nuevo'], 'Empresaria local', '2025-02-10'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

-- Luis tiene múltiples visitas exitosas
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, visit_data.date, visit_data.time, visit_data.party_size, 'completed', 'whatsapp', visit_data.special_requests, visit_data.amount, 'Visita #' || visit_data.visit_num || ' - Satisfacción: ' || visit_data.satisfaction || '/5', visit_data.date - INTERVAL '2 hours'
FROM restaurants r, customers c,
(VALUES 
    ('2025-02-05'::date, '19:30'::time, 2, 'Mesa tranquila', 5, 45.50, 1),
    ('2025-02-12'::date, '20:00'::time, 2, 'Como siempre', 5, 52.00, 2),
    ('2025-02-19'::date, '19:30'::time, 3, 'Traigo un amigo', 4, 78.50, 3),
    ('2025-02-26'::date, '20:00'::time, 2, 'Mesa habitual', 5, 48.00, 4),
    ('2025-03-05'::date, '19:30'::time, 2, 'Como siempre', 5, 55.00, 5)
) AS visit_data(date, time, party_size, special_requests, satisfaction, amount, visit_num)
WHERE r.name = 'Restaurante Demo' AND c.name = 'Luis Martínez';

-- ACTUALIZAR Luis (ahora es VIP)
UPDATE customers SET 
    total_visits = 5, 
    total_spent = 279.00, 
    avg_ticket = 55.80, 
    segment_auto = 'vip',
    last_visit_at = '2025-03-05',
    churn_risk_score = 10,
    tags = ARRAY['vip', 'fiel', 'habitual', 'mesa_fija']
WHERE name = 'Luis Martínez';

-- ==========================================
-- 6. HISTORIA COMPLEJA: Elena la empresaria
-- ==========================================

-- Elena hace reservas de NEGOCIOS (grupos grandes, gastos altos)
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, business_data.date, business_data.time, business_data.party_size, business_data.status, 'whatsapp', business_data.special_requests, business_data.amount, 'Comida de negocios - Satisfacción: ' || business_data.satisfaction || '/5', business_data.date - INTERVAL '1 day'
FROM restaurants r, customers c,
(VALUES 
    ('2025-02-15'::date, '13:30'::time, 8, 'Comida de negocios - mesa privada', 'completed', 5, 320.00),
    ('2025-02-28'::date, '14:00'::time, 6, 'Reunión con clientes', 'completed', 5, 245.00),
    ('2025-03-15'::date, '13:00'::time, 10, 'Presentación importante', 'completed', 4, 420.00),
    ('2025-03-22'::date, '20:30'::time, 4, 'Cena con socios', 'completed', 5, 180.00)
) AS business_data(date, time, party_size, special_requests, status, satisfaction, amount)
WHERE r.name = 'Restaurante Demo' AND c.name = 'Elena Fernández';

-- ACTUALIZAR Elena (VIP por volumen de negocio)
UPDATE customers SET 
    total_visits = 4, 
    total_spent = 1165.00, 
    avg_ticket = 291.25, 
    segment_auto = 'vip',
    last_visit_at = '2025-03-22',
    churn_risk_score = 5,
    tags = ARRAY['vip', 'business', 'alto_valor', 'grupos_grandes']
WHERE name = 'Elena Fernández';

-- ==========================================
-- 7. CLIENTES QUE SE PIERDEN Y RECUPERAN
-- ==========================================

-- Carlos REGRESA después del no-show (recuperación)
INSERT INTO conversations (restaurant_id, customer_id, customer_name, customer_phone, subject, status, priority, channel, metadata, created_at, updated_at)
SELECT r.id, c.id, c.name, c.phone, 'Disculpas por no-show anterior', 'closed', 'normal', 'whatsapp',
jsonb_build_object('booking_successful', true, 'response_time_minutes', 3, 'satisfaction_score', 4, 'recovery_attempt', true),
'2025-03-10 17:30:00', '2025-03-10 17:40:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'Carlos Mendez';

INSERT INTO messages (restaurant_id, customer_name, customer_phone, message_text, direction, channel, message_type, status, metadata, created_at)
SELECT r.id, 'Carlos Mendez', '+34666333444', msg_data.message_text, msg_data.direction, 'whatsapp', 'text', 'sent',
jsonb_build_object('automated', msg_data.direction = 'outbound', 'recovery_conversation', true),
'2025-03-10 17:30:00'::timestamp + INTERVAL '1 minute' * msg_data.order_num
FROM restaurants r
CROSS JOIN (
    VALUES 
        ('Hola, siento mucho no haber venido la vez pasada. ¿Puedo reservar para esta noche?', 'inbound', 0),
        ('¡Hola Carlos! No te preocupes, estas cosas pasan. ¿Para cuántas personas?', 'outbound', 2),
        ('Para 2 personas a las 20:00. Esta vez seguro que voy', 'inbound', 4),
        ('Perfecto! Reserva confirmada para 2 personas hoy a las 20:00. ¡Te esperamos!', 'outbound', 5)
) AS msg_data(message_text, direction, order_num)
WHERE r.name = 'Restaurante Demo';

INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, '2025-03-10'::date, '20:00'::time, 2, 'completed', 'whatsapp', 'Gracias por la segunda oportunidad', 65.00, 'Visita de recuperación - muy satisfecho', '2025-03-10 17:35:00'
FROM restaurants r, customers c WHERE r.name = 'Restaurante Demo' AND c.name = 'Carlos Mendez';

-- ACTUALIZAR Carlos (recuperado exitosamente)
UPDATE customers SET 
    total_visits = 1, 
    total_spent = 65.00, 
    avg_ticket = 65.00, 
    segment_auto = 'activo',
    last_visit_at = '2025-03-10',
    churn_risk_score = 40,
    tags = ARRAY['activo', 'recuperado', 'segunda_oportunidad']
WHERE name = 'Carlos Mendez';

-- ==========================================
-- 8. CREAR MÁS CLIENTES CON HISTORIAS VARIADAS
-- ==========================================

-- Cliente OCASIONAL que viene pocas veces
INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Pedro Sánchez', 'Pedro', 'Sánchez', 'pedro.sanchez@email.com', '+34666222333', 'ocasional', 2, 95.00, 47.50, 60, '2025-02-20'::date, ARRAY['ocasional'], 'Viene solo fines de semana', '2025-02-01'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

-- Cliente con ALERGIAS (caso especial)
INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Carmen Jiménez', 'Carmen', 'Jiménez', 'carmen.jimenez@email.com', '+34666444555', 'regular', 6, 240.00, 40.00, 25, '2025-03-18'::date, ARRAY['regular', 'alergia_gluten', 'vegetariana'], 'Alérgica al gluten - muy cuidadosa', '2025-01-28'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

-- Cliente INACTIVO (se perdió)
INSERT INTO customers (restaurant_id, name, first_name, last_name1, email, phone, segment_auto, total_visits, total_spent, avg_ticket, churn_risk_score, last_visit_at, tags, notes, created_at) 
SELECT r.id, 'Antonio López', 'Antonio', 'López', 'antonio.lopez@email.com', '+34666666777', 'inactivo', 3, 120.00, 40.00, 90, '2025-01-30'::date, ARRAY['inactivo', 'perdido'], 'No viene desde enero', '2025-01-15'::date
FROM restaurants r WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 9. CREAR RESERVAS FUTURAS (PRÓXIMOS 30 DÍAS)
-- ==========================================

-- Reservas confirmadas para los próximos días
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    -- Reservas futuras distribuidas en próximos 30 días
    CURRENT_DATE + INTERVAL '1 day' * floor(random() * 30 + 1) as reservation_date,
    -- Horas típicas de restaurante
    (ARRAY['12:00', '12:30', '13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'])[floor(random() * 11) + 1]::TIME as reservation_time,
    -- Tamaños de grupo según el perfil del cliente
    CASE 
        WHEN c.segment_auto = 'vip' THEN (floor(random() * 4) + 4)::INTEGER  -- VIP: 4-8 personas
        WHEN c.segment_auto = 'regular' THEN (floor(random() * 3) + 2)::INTEGER  -- Regular: 2-4 personas
        ELSE (floor(random() * 4) + 1)::INTEGER  -- Otros: 1-4 personas
    END as party_size,
    -- Estados futuros realistas
    CASE 
        WHEN random() < 0.85 THEN 'confirmed'  -- 85% confirmadas
        WHEN random() < 0.95 THEN 'pending'    -- 10% pendientes
        ELSE 'cancelled'                       -- 5% canceladas
    END as status,
    'whatsapp' as channel,
    -- Solicitudes según el perfil del cliente
    CASE 
        WHEN c.segment_auto = 'vip' THEN 
            (ARRAY['Mesa privada por favor', 'Nuestra mesa habitual', 'Celebración especial', 'Reunión de negocios'])[floor(random() * 4) + 1]
        WHEN c.tags && ARRAY['terraza'] THEN 'Mesa en terraza si es posible'
        WHEN c.tags && ARRAY['alergia_gluten'] THEN 'Menú sin gluten por favor'
        WHEN c.tags && ARRAY['vegetariana'] THEN 'Opciones vegetarianas'
        ELSE 
            (ARRAY['Sin restricciones especiales', 'Mesa tranquila', 'Cerca de la ventana', 'Mesa para niños'])[floor(random() * 4) + 1]
    END as special_requests,
    0.00 as spend_amount,  -- Futuras, aún no gastado
    'Reserva futura - ' || 
    CASE 
        WHEN c.segment_auto = 'vip' THEN 'Cliente VIP'
        WHEN c.segment_auto = 'regular' THEN 'Cliente habitual'
        WHEN c.segment_auto = 'activo' THEN 'Cliente activo'
        ELSE 'Cliente ocasional'
    END as notes,
    NOW() - INTERVAL '1 hour' * floor(random() * 24) as created_at  -- Creadas en las últimas 24h
FROM restaurants r
CROSS JOIN customers c
WHERE r.name = 'Restaurante Demo'
AND c.restaurant_id = r.id
-- Probabilidad de reserva futura según segmento
AND random() < CASE 
    WHEN c.segment_auto = 'vip' THEN 0.9      -- 90% VIP tienen reservas futuras
    WHEN c.segment_auto = 'regular' THEN 0.7   -- 70% regulares
    WHEN c.segment_auto = 'activo' THEN 0.5    -- 50% activos
    WHEN c.segment_auto = 'ocasional' THEN 0.3 -- 30% ocasionales
    ELSE 0.1                                   -- 10% otros
END
LIMIT 25; -- Máximo 25 reservas futuras

-- ==========================================
-- 10. RESERVAS PARA HOY Y MAÑANA (CRÍTICAS)
-- ==========================================

-- Reservas específicas para HOY (para testing de no-shows)
INSERT INTO reservations (restaurant_id, customer_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, status, channel, special_requests, spend_amount, notes, created_at)
SELECT r.id, c.id, c.name, c.email, c.phone, today_data.date, today_data.time, today_data.party_size, today_data.status, 'whatsapp', today_data.special_requests, 0.00, today_data.notes, NOW() - INTERVAL '2 hours'
FROM restaurants r, customers c,
(VALUES 
    -- HOY - Reservas de alto riesgo para testing
    (CURRENT_DATE, '20:00'::time, 6, 'confirmed', 'Celebración familiar', 'Reserva de riesgo - grupo grande + hora pico'),
    (CURRENT_DATE, '21:30'::time, 8, 'confirmed', 'Cena de empresa', 'Reserva de riesgo - grupo muy grande + hora tardía'),
    (CURRENT_DATE, '13:00'::time, 1, 'confirmed', 'Comida rápida', 'Reserva de riesgo - persona sola + hora temprana'),
    
    -- MAÑANA - Mix de reservas
    (CURRENT_DATE + 1, '19:30'::time, 4, 'confirmed', 'Cena con amigos', 'Reserva normal'),
    (CURRENT_DATE + 1, '20:30'::time, 2, 'confirmed', 'Cena romántica', 'Pareja habitual'),
    (CURRENT_DATE + 1, '21:00'::time, 3, 'pending', 'Por confirmar', 'Reserva pendiente de confirmación')
) AS today_data(date, time, party_size, status, special_requests, notes)
WHERE r.name = 'Restaurante Demo' 
AND c.name = 'Luis Martínez';  -- Cliente VIP para las reservas críticas

-- ==========================================
-- 11. GENERAR CONVERSACIONES REALISTAS
-- ==========================================

-- Conversaciones variadas: consultas, cambios, cancelaciones
INSERT INTO conversations (restaurant_id, customer_id, customer_name, customer_phone, subject, status, priority, channel, metadata, created_at, updated_at)
SELECT r.id, c.id, c.name, c.phone, conv_data.subject, conv_data.status, conv_data.priority, 'whatsapp',
jsonb_build_object('booking_successful', conv_data.booking_successful, 'response_time_minutes', conv_data.response_time, 'satisfaction_score', conv_data.satisfaction, 'conversation_type', conv_data.conv_type),
conv_data.created_at, conv_data.updated_at
FROM restaurants r, customers c,
(VALUES 
    ('María García', 'Consulta sobre menú vegetariano', 'closed', 'normal', false, 2, 5, 'info_request', '2025-02-08 12:30:00'::timestamp, '2025-02-08 12:35:00'::timestamp),
    ('Luis Martínez', 'Cambio de hora de reserva', 'closed', 'normal', true, 1, 5, 'modification', '2025-02-15 16:45:00'::timestamp, '2025-02-15 16:50:00'::timestamp),
    ('Elena Fernández', 'Reserva urgente para hoy', 'closed', 'high', true, 1, 4, 'urgent_booking', '2025-03-01 11:00:00'::timestamp, '2025-03-01 11:05:00'::timestamp),
    ('Carmen Jiménez', 'Confirmación menú sin gluten', 'closed', 'normal', true, 3, 5, 'special_dietary', '2025-03-12 14:20:00'::timestamp, '2025-03-12 14:30:00'::timestamp),
    ('Pedro Sánchez', 'Cancelación por enfermedad', 'closed', 'normal', false, 2, 3, 'cancellation', '2025-02-25 10:15:00'::timestamp, '2025-02-25 10:20:00'::timestamp)
) AS conv_data(customer_name, subject, status, priority, booking_successful, response_time, satisfaction, conv_type, created_at, updated_at)
WHERE r.name = 'Restaurante Demo' AND c.name = conv_data.customer_name;

-- ==========================================
-- 12. CREAR MÉTRICAS REALISTAS POR PERÍODOS
-- ==========================================

-- Métricas diarias basadas en la actividad real
INSERT INTO analytics (restaurant_id, type, date, value, metadata, created_at)
SELECT r.id, metric_data.type, date_series.date,
CASE metric_data.type
    -- Conversaciones basadas en reservas reales
    WHEN 'total_conversations' THEN 
        GREATEST(1, (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r.id AND reservation_date = date_series.date) + 
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = r.id AND created_at::date = date_series.date))
    
    -- Reservas exitosas
    WHEN 'successful_bookings' THEN 
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r.id AND reservation_date = date_series.date AND status = 'completed')
    
    -- Tasa de conversión realista
    WHEN 'conversion_rate' THEN 
        CASE WHEN (SELECT COUNT(*) FROM conversations WHERE restaurant_id = r.id AND created_at::date = date_series.date) > 0
        THEN LEAST(100, (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r.id AND reservation_date = date_series.date)::float / 
             GREATEST(1, (SELECT COUNT(*) FROM conversations WHERE restaurant_id = r.id AND created_at::date = date_series.date)) * 100)
        ELSE 0 END
    
    -- Tiempo de respuesta basado en conversaciones reales
    WHEN 'avg_response_time' THEN 
        COALESCE((SELECT AVG((metadata->>'response_time_minutes')::numeric) FROM conversations WHERE restaurant_id = r.id AND created_at::date = date_series.date), 2)
    
    -- Satisfacción basada en conversaciones reales (reservations no tiene metadata)
    WHEN 'customer_satisfaction' THEN 
        COALESCE((SELECT AVG((metadata->>'satisfaction_score')::numeric) FROM conversations WHERE restaurant_id = r.id AND created_at::date = date_series.date), 4.2)
    
    -- Ingresos basados en gastos reales de clientes
    WHEN 'daily_revenue' THEN 
        COALESCE((SELECT SUM(spend_amount) FROM reservations WHERE restaurant_id = r.id AND reservation_date = date_series.date AND status = 'completed'), 0)
    
    -- Clientes activos únicos
    WHEN 'active_customers' THEN 
        (SELECT COUNT(DISTINCT customer_id) FROM reservations WHERE restaurant_id = r.id AND reservation_date = date_series.date)
END as value,
jsonb_build_object('source', 'real_simulation', 'date_calculated', NOW()) as metadata,
NOW() as created_at
FROM restaurants r
CROSS JOIN generate_series('2025-01-01'::date, '2025-03-31'::date, INTERVAL '1 day') AS date_series(date)
CROSS JOIN (VALUES ('total_conversations'), ('successful_bookings'), ('conversion_rate'), ('avg_response_time'), ('customer_satisfaction'), ('daily_revenue'), ('active_customers')) AS metric_data(type)
WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 13. VERIFICACIÓN DE LA SIMULACIÓN
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '=== SIMULACIÓN DE VIDA REAL COMPLETADA ===';
    RAISE NOTICE 'Período simulado: Enero - Marzo 2025 (3 meses)';
    RAISE NOTICE '';
    RAISE NOTICE '👥 CLIENTES CREADOS:';
    RAISE NOTICE 'Total clientes: %', (SELECT COUNT(*) FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo'));
    RAISE NOTICE 'Clientes VIP: %', (SELECT COUNT(*) FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND segment_auto = 'vip');
    RAISE NOTICE 'Clientes Regulares: %', (SELECT COUNT(*) FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND segment_auto = 'regular');
    RAISE NOTICE 'Clientes en Riesgo: %', (SELECT COUNT(*) FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND segment_auto = 'riesgo');
    RAISE NOTICE '';
    RAISE NOTICE '📅 ACTIVIDAD:';
    RAISE NOTICE 'Total reservas: %', (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo'));
    RAISE NOTICE 'Reservas completadas: %', (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND status = 'completed');
    RAISE NOTICE 'Reservas futuras: %', (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND reservation_date >= CURRENT_DATE);
    RAISE NOTICE 'Reservas HOY: %', (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND reservation_date = CURRENT_DATE);
    RAISE NOTICE 'No-shows: %', (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND status = 'no_show');
    RAISE NOTICE '';
    RAISE NOTICE '💬 COMUNICACIÓN:';
    RAISE NOTICE 'Total conversaciones: %', (SELECT COUNT(*) FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo'));
    RAISE NOTICE 'Mensajes intercambiados: %', (SELECT COUNT(*) FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo'));
    RAISE NOTICE '';
    RAISE NOTICE '💰 NEGOCIO:';
    RAISE NOTICE 'Ingresos totales: %€', (SELECT SUM(spend_amount) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND status = 'completed');
    RAISE NOTICE 'Ticket promedio: %€', (SELECT AVG(spend_amount) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND status = 'completed');
    RAISE NOTICE '';
    RAISE NOTICE '📊 MÉTRICAS:';
    RAISE NOTICE 'Días con datos: %', (SELECT COUNT(DISTINCT date) FROM analytics WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo'));
    RAISE NOTICE 'Total métricas: %', (SELECT COUNT(*) FROM analytics WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo'));
    RAISE NOTICE '';
    RAISE NOTICE '🎯 LA APLICACIÓN AHORA TIENE VIDA REAL!';
    RAISE NOTICE 'Cada número, cada métrica, cada cliente tiene una historia.';
END $$;

COMMIT;

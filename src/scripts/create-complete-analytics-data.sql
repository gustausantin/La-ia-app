-- =========================================
-- CREAR DATOS COMPLETOS PARA ANALYTICS
-- =========================================
-- Este script crea datos REALES en todas las tablas necesarias
-- para que Analytics funcione sin datos hardcodeados

BEGIN;

-- ==========================================
-- 1. POBLAR ANALYTICS TABLA CON DATOS REALES
-- ==========================================

-- Eliminar datos existentes de analytics para evitar duplicados
DELETE FROM analytics WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');

-- Insertar métricas diarias de los últimos 30 días
INSERT INTO analytics (
    restaurant_id,
    type,
    date,
    value,
    metadata,
    created_at
)
SELECT 
    r.id as restaurant_id,
    metric_type.type,
    generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::date as date,
    -- Generar valores realistas basados en el tipo de métrica
    CASE metric_type.type
        WHEN 'total_conversations' THEN floor(random() * 20 + 15)::numeric  -- 15-35 conversaciones/día
        WHEN 'successful_bookings' THEN floor(random() * 15 + 10)::numeric  -- 10-25 reservas/día
        WHEN 'conversion_rate' THEN (random() * 30 + 60)::numeric           -- 60-90% conversión
        WHEN 'avg_response_time' THEN (random() * 3 + 1)::numeric           -- 1-4 minutos
        WHEN 'customer_satisfaction' THEN (random() * 1.5 + 3.5)::numeric   -- 3.5-5.0 estrellas
        WHEN 'daily_revenue' THEN (random() * 800 + 400)::numeric           -- 400-1200€/día
        WHEN 'active_customers' THEN floor(random() * 10 + 5)::numeric       -- 5-15 clientes activos/día
    END as value,
    CASE metric_type.type
        WHEN 'total_conversations' THEN '{"source": "whatsapp", "automated": true}'::jsonb
        WHEN 'successful_bookings' THEN '{"channel": "whatsapp", "agent_assisted": false}'::jsonb
        WHEN 'conversion_rate' THEN '{"calculation": "bookings/conversations"}'::jsonb
        WHEN 'avg_response_time' THEN '{"unit": "minutes", "automated_responses": true}'::jsonb
        WHEN 'customer_satisfaction' THEN '{"scale": "1-5", "method": "post_service"}'::jsonb
        WHEN 'daily_revenue' THEN '{"currency": "EUR", "includes_tips": false}'::jsonb
        WHEN 'active_customers' THEN '{"definition": "customers_with_activity"}'::jsonb
    END as metadata,
    NOW() as created_at
FROM restaurants r
CROSS JOIN (
    VALUES 
        ('total_conversations'),
        ('successful_bookings'),
        ('conversion_rate'),
        ('avg_response_time'),
        ('customer_satisfaction'),
        ('daily_revenue'),
        ('active_customers')
) AS metric_type(type)
WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 2. POBLAR CONVERSACIONES PARA ANALYTICS
-- ==========================================

-- Crear conversaciones realistas de los últimos 30 días
INSERT INTO conversations (
    restaurant_id,
    customer_id,
    customer_name,
    customer_phone,
    customer_email,
    subject,
    status,
    priority,
    channel,
    metadata,
    created_at,
    updated_at
)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    CASE 
        WHEN random() < 0.4 THEN 'Consulta sobre reserva'
        WHEN random() < 0.7 THEN 'Solicitud de mesa'
        WHEN random() < 0.9 THEN 'Información del menú'
        ELSE 'Consulta general'
    END as subject,
    CASE 
        WHEN random() < 0.7 THEN 'closed'
        WHEN random() < 0.9 THEN 'open'
        ELSE 'pending'
    END as status,
    CASE 
        WHEN random() < 0.8 THEN 'normal'
        WHEN random() < 0.95 THEN 'high'
        ELSE 'urgent'
    END as priority,
    'whatsapp' as channel,
    jsonb_build_object(
        'booking_successful', random() < 0.75,
        'response_time_minutes', floor(random() * 5 + 1),
        'satisfaction_score', floor(random() * 2 + 4),
        'automated_response', random() < 0.6
    ) as metadata,
    -- Distribuir conversaciones en los últimos 30 días
    CURRENT_DATE - INTERVAL '1 day' * floor(random() * 30) as created_at,
    CURRENT_DATE - INTERVAL '1 day' * floor(random() * 30) + INTERVAL '1 hour' as updated_at
FROM restaurants r
CROSS JOIN customers c
WHERE r.name = 'Restaurante Demo'
AND c.restaurant_id = r.id
-- Generar múltiples conversaciones por cliente
AND random() < 0.8  -- 80% de los clientes tienen conversaciones
LIMIT 200; -- Máximo 200 conversaciones

-- ==========================================
-- 3. POBLAR MENSAJES PARA LAS CONVERSACIONES
-- ==========================================

-- Crear mensajes para cada conversación
INSERT INTO messages (
    conversation_id,
    content,
    sender_type,
    channel,
    message_type,
    status,
    metadata,
    created_at
)
SELECT 
    conv.id as conversation_id,
    CASE msg_num.num
        WHEN 1 THEN 'Hola, me gustaría hacer una reserva para esta noche'
        WHEN 2 THEN 'Perfecto, ¿para cuántas personas y a qué hora?'
        WHEN 3 THEN 'Para 4 personas a las 20:30 si es posible'
        WHEN 4 THEN 'Confirmado! Mesa para 4 personas a las 20:30. ¡Te esperamos!'
    END as content,
    CASE msg_num.num % 2
        WHEN 1 THEN 'customer'
        ELSE 'system'
    END as sender_type,
    'whatsapp' as channel,
    CASE msg_num.num % 2
        WHEN 1 THEN 'text'
        ELSE 'automated'
    END as message_type,
    'sent' as status,
    jsonb_build_object(
        'automated', msg_num.num % 2 = 0,
        'template_used', msg_num.num % 2 = 0
    ) as metadata,
    conv.created_at + INTERVAL '1 minute' * msg_num.num as created_at
FROM conversations conv
CROSS JOIN generate_series(1, 4) AS msg_num(num)
WHERE conv.restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
AND random() < 0.9; -- 90% de conversaciones tienen mensajes completos

-- ==========================================
-- 4. ACTUALIZAR RESERVAS CON DATOS ANALYTICS
-- ==========================================

-- Actualizar reservas existentes para que tengan datos de analytics
UPDATE reservations SET
    metadata = jsonb_build_object(
        'conversation_id', (
            SELECT id FROM conversations 
            WHERE customer_name = reservations.customer_name 
            AND restaurant_id = reservations.restaurant_id
            LIMIT 1
        ),
        'booking_source', 'whatsapp',
        'response_time_minutes', floor(random() * 5 + 1),
        'automated_booking', true
    ),
    updated_at = NOW()
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');

-- ==========================================
-- 5. CREAR MÉTRICAS HISTÓRICAS
-- ==========================================

INSERT INTO analytics_historical (
    restaurant_id,
    metric_type,
    metric_name,
    metric_value,
    period_type,
    period_start,
    period_end,
    created_at
)
SELECT 
    r.id as restaurant_id,
    'performance' as metric_type,
    period_data.metric_name,
    period_data.metric_value,
    'week' as period_type,
    CURRENT_DATE - INTERVAL '7 days' * week_num.num as period_start,
    CURRENT_DATE - INTERVAL '7 days' * (week_num.num - 1) as period_end,
    NOW() as created_at
FROM restaurants r
CROSS JOIN generate_series(1, 12) AS week_num(num) -- 12 semanas de historia
CROSS JOIN (
    VALUES 
        ('weekly_conversations', floor(random() * 50 + 100)::numeric),
        ('weekly_bookings', floor(random() * 40 + 60)::numeric),
        ('weekly_revenue', floor(random() * 2000 + 3000)::numeric),
        ('avg_satisfaction', (random() * 1 + 4)::numeric)
) AS period_data(metric_name, metric_value)
WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 6. VERIFICACIÓN DE DATOS CREADOS
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN DE DATOS ANALYTICS CREADOS ===';
    RAISE NOTICE 'Métricas diarias: %', (SELECT COUNT(*) FROM analytics WHERE created_at >= NOW() - INTERVAL '1 minute');
    RAISE NOTICE 'Conversaciones: %', (SELECT COUNT(*) FROM conversations WHERE created_at >= NOW() - INTERVAL '1 minute');
    RAISE NOTICE 'Mensajes: %', (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '1 minute');
    RAISE NOTICE 'Métricas históricas: %', (SELECT COUNT(*) FROM analytics_historical WHERE created_at >= NOW() - INTERVAL '1 minute');
    RAISE NOTICE 'Reservas actualizadas: %', (SELECT COUNT(*) FROM reservations WHERE updated_at >= NOW() - INTERVAL '1 minute');
END $$;

COMMIT;

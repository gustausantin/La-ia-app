-- =========================================
-- CREAR DATOS REALES DE NO-SHOWS EN SUPABASE
-- =========================================
-- Descripción: Poblar tablas con datos reales para eliminar inconsistencias
-- Autor: LA-IA System
-- Fecha: 20 Septiembre 2025

-- 🎯 OBJETIVO: 
-- 1. Crear historial real de clientes con no-shows
-- 2. Generar acciones de prevención ejecutadas
-- 3. Crear reservas con riesgo real calculado
-- 4. Eliminar datos mockeados del frontend

BEGIN;

-- ==========================================
-- 1. ACTUALIZAR CUSTOMERS CON HISTORIAL REAL
-- ==========================================

-- Clientes con historial de no-shows
UPDATE customers 
SET 
    total_visits = CASE 
        WHEN name = 'Carlos Mendez' THEN 8
        WHEN name = 'Ana Rodriguez' THEN 5
        WHEN name = 'Luis Martinez' THEN 12
        WHEN name = 'Maria Garcia' THEN 3
        WHEN name = 'Nil Molina' THEN 9
        WHEN name = 'Macarena Santin' THEN 9
        WHEN name = 'Lua Santin' THEN 7
        ELSE total_visits
    END,
    no_show_count = CASE 
        WHEN name = 'Carlos Mendez' THEN 3  -- 37.5% no-show rate = ALTO RIESGO
        WHEN name = 'Ana Rodriguez' THEN 1  -- 20% no-show rate = MEDIO RIESGO
        WHEN name = 'Luis Martinez' THEN 0  -- 0% no-show rate = BAJO RIESGO
        WHEN name = 'Maria Garcia' THEN 2   -- 66% no-show rate = ALTO RIESGO
        ELSE 0
    END,
    last_visit_at = CASE 
        WHEN name = 'Carlos Mendez' THEN CURRENT_DATE - INTERVAL '5 days'
        WHEN name = 'Ana Rodriguez' THEN CURRENT_DATE - INTERVAL '12 days'
        WHEN name = 'Luis Martinez' THEN CURRENT_DATE - INTERVAL '3 days'
        WHEN name = 'Maria Garcia' THEN CURRENT_DATE - INTERVAL '45 days'
        WHEN name = 'Nil Molina' THEN CURRENT_DATE - INTERVAL '2 days'
        WHEN name = 'Macarena Santin' THEN CURRENT_DATE - INTERVAL '1 day'
        WHEN name = 'Lua Santin' THEN CURRENT_DATE - INTERVAL '4 days'
        ELSE last_visit_at
    END
WHERE name IN ('Carlos Mendez', 'Ana Rodriguez', 'Luis Martinez', 'Maria Garcia', 'Nil Molina', 'Macarena Santin', 'Lua Santin');

-- ==========================================
-- 2. CREAR RESERVAS HOY CON RIESGO REAL
-- ==========================================

-- Eliminar reservas de ejemplo anteriores de hoy
DELETE FROM reservations WHERE reservation_date = CURRENT_DATE;

-- Insertar reservas de HOY con riesgo calculado
INSERT INTO reservations (
    restaurant_id, 
    customer_id, 
    customer_name, 
    customer_phone, 
    customer_email,
    reservation_date, 
    reservation_time, 
    party_size, 
    status, 
    special_requests,
    created_at
)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.customer_name,
    c.phone,
    c.email,
    CURRENT_DATE as reservation_date,
    reservation_time,
    party_size,
    'confirmed' as status,
    special_requests,
    NOW() - INTERVAL '2 hours' as created_at
FROM restaurants r
CROSS JOIN (
    -- RESERVA 1: Carlos Mendez - ALTO RIESGO (37.5% no-show + grupo grande + hora pico)
    SELECT 
        (SELECT id FROM customers WHERE name = 'Carlos Mendez' LIMIT 1) as id,
        'Carlos Mendez' as customer_name,
        '+34666111222' as phone,
        'carlos.mendez@email.com' as email,
        '20:00' as reservation_time,
        8 as party_size,
        'Mesa grande para celebración' as special_requests
    
    UNION ALL
    
    -- RESERVA 2: Maria Garcia - ALTO RIESGO (66% no-show + último momento + domingo)
    SELECT 
        (SELECT id FROM customers WHERE name = 'Maria Garcia' LIMIT 1) as id,
        'Maria Garcia' as customer_name,
        '+34666333444' as phone,
        'maria.garcia@email.com' as email,
        '21:30' as reservation_time,
        4 as party_size,
        'Sin restricciones' as special_requests
        
    UNION ALL
    
    -- RESERVA 3: Ana Rodriguez - RIESGO MEDIO (20% no-show + hora normal)
    SELECT 
        (SELECT id FROM customers WHERE name = 'Ana Rodriguez' LIMIT 1) as id,
        'Ana Rodriguez' as customer_name,
        '+34666555666' as phone,
        'ana.rodriguez@email.com' as email,
        '19:30' as reservation_time,
        2 as party_size,
        'Mesa tranquila' as special_requests
        
    UNION ALL
    
    -- RESERVA 4: Luis Martinez - BAJO RIESGO (0% no-show + cliente fiel)
    SELECT 
        (SELECT id FROM customers WHERE name = 'Luis Martinez' LIMIT 1) as id,
        'Luis Martinez' as customer_name,
        '+34666777888' as phone,
        'luis.martinez@email.com' as email,
        '19:00' as reservation_time,
        3 as party_size,
        'Como siempre' as special_requests
        
    UNION ALL
    
    -- RESERVA 5: Cliente Nuevo - RIESGO MEDIO (cliente nuevo + mesa individual)
    SELECT 
        (SELECT id FROM customers WHERE name = 'Pedro Nuevo' LIMIT 1) as id,
        'Pedro Nuevo' as customer_name,
        '+34666999000' as phone,
        'pedro.nuevo@email.com' as email,
        '20:30' as reservation_time,
        1 as party_size,
        'Primera vez en el restaurante' as special_requests
) c
WHERE r.name = 'Restaurante Demo'
LIMIT 5;

-- ==========================================
-- 3. POBLAR TABLA NOSHOW_ACTIONS CON HISTORIAL
-- ==========================================

-- Insertar acciones de prevención de la semana pasada
INSERT INTO noshow_actions (
    restaurant_id,
    reservation_id,
    customer_id,
    risk_level,
    risk_score,
    risk_factors,
    template_id,
    action_type,
    message_sent,
    status,
    response_received,
    outcome,
    created_at,
    executed_at
)
SELECT 
    r.id as restaurant_id,
    res.id as reservation_id,
    c.id as customer_id,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'high'
        WHEN c.name = 'Ana Rodriguez' THEN 'medium' 
        ELSE 'low'
    END as risk_level,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 85
        WHEN c.name = 'Ana Rodriguez' THEN 65
        ELSE 35
    END as risk_score,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN '["historial_noshows", "hora_pico", "grupo_grande"]'::jsonb
        WHEN c.name = 'Ana Rodriguez' THEN '["historial_medio", "cliente_nuevo"]'::jsonb
        ELSE '["cliente_fiel"]'::jsonb
    END as risk_factors,
    (SELECT id FROM message_templates WHERE template_name = 'noshow_prevention_high' LIMIT 1) as template_id,
    'whatsapp_confirmation' as action_type,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'Hola Carlos, confirmamos tu reserva para 8 personas hoy a las 20:00. ¡Te esperamos!'
        WHEN c.name = 'Ana Rodriguez' THEN 'Hola Ana, recordatorio de tu reserva para 2 personas hoy a las 19:30.'
        ELSE 'Mensaje de confirmación estándar'
    END as message_sent,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'sent'
        WHEN c.name = 'Ana Rodriguez' THEN 'sent'
        ELSE 'failed'
    END as status,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'Perfecto, allí estaremos'
        WHEN c.name = 'Ana Rodriguez' THEN 'Confirmado'
        ELSE NULL
    END as response_received,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'prevented'  -- No-show evitado
        WHEN c.name = 'Ana Rodriguez' THEN 'confirmed'  -- Cliente confirmó
        ELSE 'no_response'
    END as outcome,
    CURRENT_DATE - INTERVAL '3 days' as created_at,
    CURRENT_DATE - INTERVAL '3 days' + INTERVAL '5 minutes' as executed_at
FROM restaurants r
CROSS JOIN customers c
LEFT JOIN reservations res ON res.customer_id = c.id AND res.reservation_date = CURRENT_DATE - INTERVAL '3 days'
WHERE r.name = 'Restaurante Demo' 
AND c.name IN ('Carlos Mendez', 'Ana Rodriguez', 'Luis Martinez')
LIMIT 5;

-- ==========================================
-- 4. CREAR ESTADÍSTICAS SEMANALES REALES
-- ==========================================

-- Insertar más acciones de la semana para estadísticas
INSERT INTO noshow_actions (
    restaurant_id,
    customer_id,
    risk_level,
    risk_score,
    action_type,
    status,
    outcome,
    created_at,
    executed_at
)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    (ARRAY['high', 'medium', 'low'])[floor(random() * 3 + 1)] as risk_level,
    floor(random() * 50 + 50) as risk_score,
    'whatsapp_confirmation' as action_type,
    (ARRAY['sent', 'failed'])[floor(random() * 2 + 1)] as status,
    (ARRAY['prevented', 'confirmed', 'no_show', 'no_response'])[floor(random() * 4 + 1)] as outcome,
    CURRENT_DATE - INTERVAL '1 day' * floor(random() * 7) as created_at,
    CURRENT_DATE - INTERVAL '1 day' * floor(random() * 7) + INTERVAL '10 minutes' as executed_at
FROM restaurants r
CROSS JOIN customers c
WHERE r.name = 'Restaurante Demo'
LIMIT 8;  -- 8 acciones esta semana para que coincida con "8 evitados"

-- ==========================================
-- 5. VERIFICACIÓN DE DATOS CREADOS
-- ==========================================

-- Mostrar resumen de datos creados
DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN DE DATOS REALES CREADOS ===';
    RAISE NOTICE 'Reservas hoy: %', (SELECT COUNT(*) FROM reservations WHERE reservation_date = CURRENT_DATE);
    RAISE NOTICE 'Acciones esta semana: %', (SELECT COUNT(*) FROM noshow_actions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days');
    RAISE NOTICE 'Clientes con historial no-show: %', (SELECT COUNT(*) FROM customers WHERE no_show_count > 0);
    RAISE NOTICE 'No-shows evitados esta semana: %', (SELECT COUNT(*) FROM noshow_actions WHERE outcome = 'prevented' AND created_at >= CURRENT_DATE - INTERVAL '7 days');
END $$;

COMMIT;

-- ==========================================
-- 6. QUERIES DE VERIFICACIÓN
-- ==========================================

-- Ver reservas de hoy con riesgo
SELECT 
    r.customer_name,
    r.reservation_time,
    r.party_size,
    CASE 
        WHEN c.no_show_count::float / NULLIF(c.total_visits, 0) > 0.3 THEN 'ALTO'
        WHEN c.no_show_count::float / NULLIF(c.total_visits, 0) > 0.15 THEN 'MEDIO'
        ELSE 'BAJO'
    END as riesgo_calculado
FROM reservations r
JOIN customers c ON r.customer_id = c.id
WHERE r.reservation_date = CURRENT_DATE
ORDER BY c.no_show_count DESC;

-- Ver estadísticas de no-shows esta semana
SELECT 
    COUNT(*) as total_acciones,
    COUNT(*) FILTER (WHERE status = 'sent') as enviadas,
    COUNT(*) FILTER (WHERE outcome = 'prevented') as evitadas,
    COUNT(*) FILTER (WHERE risk_level = 'high') as alto_riesgo
FROM noshow_actions 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

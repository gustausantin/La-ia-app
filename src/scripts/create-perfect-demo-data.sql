-- ====================================
-- DATOS PERFECTOS BASADOS EN ESTRUCTURA REAL
-- Fecha: 19 Septiembre 2025
-- Objetivo: Crear datos que funcionen 100% con tu BD real
-- ====================================

-- 1. LIMPIAR DATOS DEMO EXISTENTES
DELETE FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be' 
AND customer_email LIKE '%.demo@email.com';

DELETE FROM customers 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be' 
AND email LIKE '%.demo@email.com';

-- 2. CREAR CLIENTES DEMO CON SEGMENTOS CORRECTOS
INSERT INTO customers (
    restaurant_id, 
    name, 
    email, 
    phone,
    visits_count,
    total_spent,
    last_visit_at
) VALUES 
    -- Cliente VIP frecuente
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'María González VIP', 'maria.demo@email.com', '666123456',
     8, 420.50, CURRENT_DATE - INTERVAL '5 days'),
    
    -- Cliente regular activo
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carlos Ruiz Regular', 'carlos.demo@email.com', '666234567',
     4, 180.75, CURRENT_DATE - INTERVAL '12 days'),
    
    -- Cliente en riesgo (no viene hace tiempo)
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Ana López Riesgo', 'ana.demo@email.com', '666345678',
     3, 95.30, CURRENT_DATE - INTERVAL '95 days'),
    
    -- Cliente nuevo
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'David Martín Nuevo', 'david.demo@email.com', '666456789',
     1, 32.50, CURRENT_DATE - INTERVAL '2 days'),
     
    -- Cliente con historial de no-shows
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Laura Sánchez NoShow', 'laura.demo@email.com', '666567890',
     5, 125.80, CURRENT_DATE - INTERVAL '30 days'),
     
    -- Clientes adicionales para más datos
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Roberto Silva VIP2', 'roberto.demo@email.com', '666678901',
     12, 680.25, CURRENT_DATE - INTERVAL '8 days'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carmen Torres Regular2', 'carmen.demo@email.com', '666789012',
     6, 245.80, CURRENT_DATE - INTERVAL '15 days');

-- 3. CREAR RESERVAS USANDO ESTADOS REALES
INSERT INTO reservations (
    restaurant_id, 
    customer_name, 
    customer_email, 
    customer_phone,
    reservation_date, 
    reservation_time, 
    party_size, 
    status,
    spend_amount,
    source,
    channel
) VALUES 
    -- RESERVAS DE HOY (mix de confirmed y pending)
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'María González VIP', 'maria.demo@email.com', '666123456',
     CURRENT_DATE, '20:00', 4, 'confirmed', 0, 'manual', 'whatsapp'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carlos Ruiz Regular', 'carlos.demo@email.com', '666234567',
     CURRENT_DATE, '21:30', 2, 'confirmed', 0, 'ia', 'web'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'David Martín Nuevo', 'david.demo@email.com', '666456789',
     CURRENT_DATE, '19:00', 3, 'pending', 0, 'manual', 'phone'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Roberto Silva VIP2', 'roberto.demo@email.com', '666678901',
     CURRENT_DATE, '18:30', 6, 'confirmed', 0, 'ia', 'whatsapp'),
     
    -- RESERVAS DE MAÑANA (confirmed para mostrar pipeline)
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Ana López Riesgo', 'ana.demo@email.com', '666345678',
     CURRENT_DATE + INTERVAL '1 day', '20:30', 6, 'confirmed', 0, 'manual', 'web'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Laura Sánchez NoShow', 'laura.demo@email.com', '666567890',
     CURRENT_DATE + INTERVAL '1 day', '22:00', 4, 'confirmed', 0, 'ia', 'whatsapp'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carmen Torres Regular2', 'carmen.demo@email.com', '666789012',
     CURRENT_DATE + INTERVAL '1 day', '19:30', 2, 'pending', 0, 'manual', 'phone'),
     
    -- RESERVAS DE PASADO MAÑANA (para análisis predictivo)
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'María González VIP', 'maria.demo@email.com', '666123456',
     CURRENT_DATE + INTERVAL '2 days', '21:00', 4, 'confirmed', 0, 'ia', 'web'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Roberto Silva VIP2', 'roberto.demo@email.com', '666678901',
     CURRENT_DATE + INTERVAL '2 days', '20:00', 8, 'pending', 0, 'manual', 'whatsapp'),
     
    -- RESERVAS HISTÓRICAS COMPLETADAS (para mostrar datos reales)
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'María González VIP', 'maria.demo@email.com', '666123456',
     CURRENT_DATE - INTERVAL '5 days', '20:00', 4, 'completed', 85.50, 'manual', 'whatsapp'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carlos Ruiz Regular', 'carlos.demo@email.com', '666234567',
     CURRENT_DATE - INTERVAL '12 days', '19:30', 2, 'completed', 45.75, 'ia', 'web'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Roberto Silva VIP2', 'roberto.demo@email.com', '666678901',
     CURRENT_DATE - INTERVAL '8 days', '21:30', 6, 'completed', 125.80, 'manual', 'whatsapp'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carmen Torres Regular2', 'carmen.demo@email.com', '666789012',
     CURRENT_DATE - INTERVAL '15 days', '20:30', 2, 'completed', 38.90, 'ia', 'web'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Ana López Riesgo', 'ana.demo@email.com', '666345678',
     CURRENT_DATE - INTERVAL '95 days', '19:00', 3, 'completed', 52.30, 'manual', 'phone'),
     
    -- ALGUNAS CANCELACIONES Y NO-SHOWS PARA ANÁLISIS
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Laura Sánchez NoShow', 'laura.demo@email.com', '666567890',
     CURRENT_DATE - INTERVAL '7 days', '21:00', 4, 'cancelled', 0, 'manual', 'phone'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Cliente Ocasional Demo', 'ocasional.demo@email.com', '666999888',
     CURRENT_DATE - INTERVAL '3 days', '20:30', 2, 'cancelled', 0, 'manual', 'web'),
     
    -- MÁS RESERVAS COMPLETADAS PARA ESTADÍSTICAS ROBUSTAS
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'María González VIP', 'maria.demo@email.com', '666123456',
     CURRENT_DATE - INTERVAL '25 days', '19:30', 4, 'completed', 78.40, 'ia', 'whatsapp'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Roberto Silva VIP2', 'roberto.demo@email.com', '666678901',
     CURRENT_DATE - INTERVAL '18 days', '20:30', 6, 'completed', 142.60, 'manual', 'web'),
     
    ('310e1734-381d-4fda-8806-7c338a28c6be', 'Carlos Ruiz Regular', 'carlos.demo@email.com', '666234567',
     CURRENT_DATE - INTERVAL '35 days', '21:00', 2, 'completed', 41.20, 'ia', 'phone');

-- 4. ACTUALIZAR ESTADÍSTICAS DE CLIENTES BASADAS EN RESERVAS REALES
UPDATE customers SET 
    visits_count = (
        SELECT COUNT(*) 
        FROM reservations r 
        WHERE r.customer_email = customers.email 
        AND r.restaurant_id = customers.restaurant_id
        AND r.status = 'completed'
    ),
    total_spent = (
        SELECT COALESCE(SUM(spend_amount), 0) 
        FROM reservations r 
        WHERE r.customer_email = customers.email 
        AND r.restaurant_id = customers.restaurant_id
        AND r.status = 'completed'
    ),
    last_visit_at = (
        SELECT MAX(reservation_date) 
        FROM reservations r 
        WHERE r.customer_email = customers.email 
        AND r.restaurant_id = customers.restaurant_id
        AND r.status = 'completed'
    )
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND email LIKE '%.demo@email.com';

-- 5. VERIFICAR CREACIÓN EXITOSA
SELECT 'DATOS DEMO PERFECTOS CREADOS' as resultado;

SELECT 
    'Clientes creados:' as info,
    COUNT(*) as total
FROM customers 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND email LIKE '%.demo@email.com';

SELECT 
    'Reservas creadas:' as info,
    COUNT(*) as total
FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND customer_email LIKE '%.demo@email.com';

-- 6. ESTADÍSTICAS POR ESTADO (usando estados reales)
SELECT 
    'Distribución por estado:' as info,
    status,
    COUNT(*) as cantidad
FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND customer_email LIKE '%.demo@email.com'
GROUP BY status
ORDER BY cantidad DESC;

-- 7. ESTADÍSTICAS DE VALOR GENERADO
SELECT 
    'Valor generado por clientes demo:' as info,
    COUNT(DISTINCT customer_email) as clientes_unicos,
    COUNT(*) FILTER (WHERE status = 'completed') as reservas_completadas,
    COALESCE(SUM(spend_amount) FILTER (WHERE status = 'completed'), 0) as ingresos_totales,
    COALESCE(AVG(spend_amount) FILTER (WHERE status = 'completed' AND spend_amount > 0), 0) as ticket_medio
FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND customer_email LIKE '%.demo@email.com';

-- 8. ANÁLISIS DE NO-SHOWS Y CANCELACIONES
SELECT 
    'Análisis de pérdidas:' as info,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelaciones,
    COUNT(*) FILTER (WHERE status = 'pending' AND reservation_date < CURRENT_DATE) as posibles_noshows,
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'pending') AND reservation_date >= CURRENT_DATE) as reservas_futuras
FROM reservations 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND customer_email LIKE '%.demo@email.com';

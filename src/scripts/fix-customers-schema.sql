-- =========================================
-- ARREGLAR ESQUEMA DE CUSTOMERS Y CREAR DATOS REALES
-- =========================================
-- Descripción: Agregar columnas faltantes y poblar con datos reales
-- Autor: LA-IA System
-- Fecha: 20 Septiembre 2025

BEGIN;

-- ==========================================
-- 1. AGREGAR COLUMNAS FALTANTES SI NO EXISTEN
-- ==========================================

-- Agregar columna no_show_count si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'no_show_count') THEN
        ALTER TABLE customers ADD COLUMN no_show_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna no_show_count agregada';
    ELSE
        RAISE NOTICE 'Columna no_show_count ya existe';
    END IF;
END $$;

-- Agregar columna total_visits si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'total_visits') THEN
        ALTER TABLE customers ADD COLUMN total_visits INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna total_visits agregada';
    ELSE
        RAISE NOTICE 'Columna total_visits ya existe';
    END IF;
END $$;

-- Agregar columna last_visit_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'last_visit_at') THEN
        ALTER TABLE customers ADD COLUMN last_visit_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna last_visit_at agregada';
    ELSE
        RAISE NOTICE 'Columna last_visit_at ya existe';
    END IF;
END $$;

-- ==========================================
-- 2. CREAR CLIENTES DE EJEMPLO SI NO EXISTEN
-- ==========================================

-- Insertar clientes de ejemplo para testing
INSERT INTO customers (name, phone, email, segment_auto, no_show_count, total_visits, last_visit_at)
SELECT * FROM (VALUES
    ('Carlos Mendez', '+34666111222', 'carlos.mendez@email.com', 'activo', 3, 8, CURRENT_DATE - INTERVAL '5 days'),
    ('Ana Rodriguez', '+34666555666', 'ana.rodriguez@email.com', 'activo', 1, 5, CURRENT_DATE - INTERVAL '12 days'),
    ('Luis Martinez', '+34666777888', 'luis.martinez@email.com', 'vip', 0, 12, CURRENT_DATE - INTERVAL '3 days'),
    ('Maria Garcia', '+34666333444', 'maria.garcia@email.com', 'riesgo', 2, 3, CURRENT_DATE - INTERVAL '45 days'),
    ('Nil Molina', '+34666123456', 'nil.molina@email.com', 'vip', 0, 9, CURRENT_DATE - INTERVAL '2 days'),
    ('Macarena Santin', '+34666234567', 'macarena.santin@email.com', 'vip', 0, 9, CURRENT_DATE - INTERVAL '1 day'),
    ('Lua Santin', '+34666345678', 'lua.santin@email.com', 'activo', 0, 7, CURRENT_DATE - INTERVAL '4 days'),
    ('Pedro Nuevo', '+34666999000', 'pedro.nuevo@email.com', 'nuevo', 0, 1, CURRENT_DATE - INTERVAL '30 days')
) AS nuevos_clientes(name, phone, email, segment_auto, no_show_count, total_visits, last_visit_at)
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE customers.name = nuevos_clientes.name
);

-- ==========================================
-- 3. ACTUALIZAR CLIENTES EXISTENTES
-- ==========================================

-- Actualizar clientes existentes con datos de no-show
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
        ELSE COALESCE(total_visits, 1)
    END,
    no_show_count = CASE 
        WHEN name = 'Carlos Mendez' THEN 3  -- 37.5% no-show rate = ALTO RIESGO
        WHEN name = 'Ana Rodriguez' THEN 1  -- 20% no-show rate = MEDIO RIESGO
        WHEN name = 'Luis Martinez' THEN 0  -- 0% no-show rate = BAJO RIESGO
        WHEN name = 'Maria Garcia' THEN 2   -- 66% no-show rate = ALTO RIESGO
        ELSE COALESCE(no_show_count, 0)
    END,
    last_visit_at = CASE 
        WHEN name = 'Carlos Mendez' THEN CURRENT_DATE - INTERVAL '5 days'
        WHEN name = 'Ana Rodriguez' THEN CURRENT_DATE - INTERVAL '12 days'
        WHEN name = 'Luis Martinez' THEN CURRENT_DATE - INTERVAL '3 days'
        WHEN name = 'Maria Garcia' THEN CURRENT_DATE - INTERVAL '45 days'
        WHEN name = 'Nil Molina' THEN CURRENT_DATE - INTERVAL '2 days'
        WHEN name = 'Macarena Santin' THEN CURRENT_DATE - INTERVAL '1 day'
        WHEN name = 'Lua Santin' THEN CURRENT_DATE - INTERVAL '4 days'
        ELSE COALESCE(last_visit_at, CURRENT_DATE - INTERVAL '30 days')
    END;

-- ==========================================
-- 4. CREAR RESERVAS DE HOY CON RIESGO REAL
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
    c.name as customer_name,
    c.phone,
    c.email,
    CURRENT_DATE as reservation_date,
    datos.reservation_time,
    datos.party_size,
    'confirmed' as status,
    datos.special_requests,
    NOW() - INTERVAL '2 hours' as created_at
FROM restaurants r
CROSS JOIN (
    SELECT 'Carlos Mendez' as name, '20:00' as reservation_time, 8 as party_size, 'Mesa grande para celebración' as special_requests
    UNION ALL
    SELECT 'Maria Garcia', '21:30', 4, 'Sin restricciones'
    UNION ALL
    SELECT 'Ana Rodriguez', '19:30', 2, 'Mesa tranquila'
    UNION ALL
    SELECT 'Luis Martinez', '19:00', 3, 'Como siempre'
    UNION ALL
    SELECT 'Pedro Nuevo', '20:30', 1, 'Primera vez en el restaurante'
) datos
JOIN customers c ON c.name = datos.name
WHERE r.name ILIKE '%demo%' OR r.id = (SELECT MIN(id) FROM restaurants)
LIMIT 5;

-- ==========================================
-- 5. CREAR ACCIONES DE PREVENCIÓN REALES
-- ==========================================

-- Asegurar que existe la tabla noshow_actions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'noshow_actions') THEN
        RAISE EXCEPTION 'Tabla noshow_actions no existe. Ejecuta primero: src/scripts/create-noshow-templates.sql';
    END IF;
END $$;

-- Insertar acciones de prevención de esta semana
INSERT INTO noshow_actions (
    restaurant_id,
    customer_id,
    risk_level,
    risk_score,
    risk_factors,
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
    c.id as customer_id,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'high'
        WHEN c.name = 'Ana Rodriguez' THEN 'medium' 
        WHEN c.name = 'Maria Garcia' THEN 'high'
        ELSE 'low'
    END as risk_level,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 85
        WHEN c.name = 'Ana Rodriguez' THEN 65
        WHEN c.name = 'Maria Garcia' THEN 90
        ELSE 35
    END as risk_score,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN '["historial_noshows", "hora_pico", "grupo_grande"]'::jsonb
        WHEN c.name = 'Ana Rodriguez' THEN '["historial_medio", "cliente_nuevo"]'::jsonb
        WHEN c.name = 'Maria Garcia' THEN '["historial_noshows", "cliente_riesgo"]'::jsonb
        ELSE '["cliente_fiel"]'::jsonb
    END as risk_factors,
    'whatsapp_confirmation' as action_type,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'Hola Carlos, confirmamos tu reserva para 8 personas hoy a las 20:00. ¡Te esperamos!'
        WHEN c.name = 'Ana Rodriguez' THEN 'Hola Ana, recordatorio de tu reserva para 2 personas hoy a las 19:30.'
        WHEN c.name = 'Maria Garcia' THEN 'Hola Maria, confirmamos tu reserva para 4 personas hoy a las 21:30.'
        ELSE 'Mensaje de confirmación estándar'
    END as message_sent,
    'sent' as status,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'Perfecto, allí estaremos'
        WHEN c.name = 'Ana Rodriguez' THEN 'Confirmado'
        WHEN c.name = 'Maria Garcia' THEN 'Ok, gracias'
        ELSE NULL
    END as response_received,
    CASE 
        WHEN c.name = 'Carlos Mendez' THEN 'prevented'  -- No-show evitado
        WHEN c.name = 'Ana Rodriguez' THEN 'confirmed'  -- Cliente confirmó
        WHEN c.name = 'Maria Garcia' THEN 'prevented'   -- No-show evitado
        ELSE 'confirmed'
    END as outcome,
    CURRENT_DATE - INTERVAL '1 day' * (1 + random() * 6) as created_at,
    CURRENT_DATE - INTERVAL '1 day' * (1 + random() * 6) + INTERVAL '5 minutes' as executed_at
FROM restaurants r
CROSS JOIN customers c
WHERE (r.name ILIKE '%demo%' OR r.id = (SELECT MIN(id) FROM restaurants))
AND c.name IN ('Carlos Mendez', 'Ana Rodriguez', 'Luis Martinez', 'Maria Garcia')
LIMIT 8;  -- 8 acciones para estadísticas

-- ==========================================
-- 6. VERIFICACIÓN DE DATOS CREADOS
-- ==========================================

-- Mostrar resumen
DO $$
DECLARE
    reservas_count INTEGER;
    acciones_count INTEGER;
    clientes_count INTEGER;
    evitados_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO reservas_count FROM reservations WHERE reservation_date = CURRENT_DATE;
    SELECT COUNT(*) INTO acciones_count FROM noshow_actions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
    SELECT COUNT(*) INTO clientes_count FROM customers WHERE no_show_count > 0;
    SELECT COUNT(*) INTO evitados_count FROM noshow_actions WHERE outcome IN ('prevented', 'confirmed') AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    RAISE NOTICE '=== DATOS REALES CREADOS ===';
    RAISE NOTICE 'Reservas hoy: %', reservas_count;
    RAISE NOTICE 'Acciones esta semana: %', acciones_count;
    RAISE NOTICE 'Clientes con historial no-show: %', clientes_count;
    RAISE NOTICE 'No-shows evitados esta semana: %', evitados_count;
END $$;

COMMIT;

-- ==========================================
-- 7. QUERIES DE VERIFICACIÓN
-- ==========================================

-- Ver clientes con historial
SELECT 
    name,
    no_show_count,
    total_visits,
    ROUND((no_show_count::float / NULLIF(total_visits, 0) * 100), 1) as no_show_rate,
    CASE 
        WHEN no_show_count::float / NULLIF(total_visits, 0) > 0.3 THEN 'ALTO'
        WHEN no_show_count::float / NULLIF(total_visits, 0) > 0.15 THEN 'MEDIO'
        ELSE 'BAJO'
    END as riesgo_nivel
FROM customers 
WHERE total_visits > 0
ORDER BY no_show_count DESC;

-- Ver reservas de hoy
SELECT 
    customer_name,
    reservation_time,
    party_size,
    status
FROM reservations 
WHERE reservation_date = CURRENT_DATE
ORDER BY reservation_time;

-- Ver estadísticas de acciones
SELECT 
    COUNT(*) as total_acciones,
    COUNT(*) FILTER (WHERE status = 'sent') as enviadas,
    COUNT(*) FILTER (WHERE outcome IN ('prevented', 'confirmed')) as evitadas,
    COUNT(*) FILTER (WHERE risk_level = 'high') as alto_riesgo
FROM noshow_actions 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

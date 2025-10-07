-- ========================================
-- DIAGNÓSTICO: HORARIOS USADOS EN REGENERACIÓN
-- Verifica qué horarios está usando el sistema
-- ========================================

-- Reemplaza 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1' con el ID de tu restaurante

-- 1️⃣ VERIFICAR HORARIOS ACTUALES EN LA BD
SELECT
    id,
    name,
    settings->'operating_hours' AS operating_hours_actual,
    settings->>'reservation_duration' AS duracion_reserva,
    settings->>'slot_interval' AS intervalo_slots,
    settings->>'advance_booking_days' AS dias_anticipacion
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- 2️⃣ VERIFICAR HORARIOS ESPECÍFICOS POR DÍA
SELECT
    'Lunes' AS dia,
    settings->'operating_hours'->'monday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'monday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'monday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    'Martes' AS dia,
    settings->'operating_hours'->'tuesday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'tuesday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'tuesday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    'Miércoles' AS dia,
    settings->'operating_hours'->'wednesday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'wednesday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'wednesday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    'Jueves' AS dia,
    settings->'operating_hours'->'thursday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'thursday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'thursday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    'Viernes' AS dia,
    settings->'operating_hours'->'friday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'friday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'friday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    'Sábado' AS dia,
    settings->'operating_hours'->'saturday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'saturday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'saturday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    'Domingo' AS dia,
    settings->'operating_hours'->'sunday'->>'open' AS hora_apertura,
    settings->'operating_hours'->'sunday'->>'close' AS hora_cierre,
    settings->'operating_hours'->'sunday'->>'closed' AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- 3️⃣ VERIFICAR SLOTS GENERADOS PARA LUNES (13/10/2025)
SELECT
    slot_date,
    MIN(start_time) AS primera_hora,
    MAX(start_time) AS ultima_hora,
    COUNT(*) AS total_slots,
    COUNT(DISTINCT table_id) AS mesas_con_slots
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date = '2025-10-13' -- Lunes con reserva
GROUP BY slot_date;

-- 4️⃣ VERIFICAR SLOTS GENERADOS PARA LUNES (20/10/2025)
SELECT
    slot_date,
    MIN(start_time) AS primera_hora,
    MAX(start_time) AS ultima_hora,
    COUNT(*) AS total_slots,
    COUNT(DISTINCT table_id) AS mesas_con_slots
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date = '2025-10-20' -- Lunes sin reserva
GROUP BY slot_date;

-- 5️⃣ COMPARAR HORARIOS: ¿QUÉ DEBERÍA SER VS QUÉ ES?
SELECT
    '🎯 CONFIGURACIÓN ESPERADA' AS tipo,
    'Lunes cerrado (excepto 13/10 por reserva)' AS descripcion,
    CONCAT('Horario: ', (settings->'operating_hours'->'monday'->>'open'), ' - ', (settings->'operating_hours'->'monday'->>'close')) AS detalle
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    '📊 SLOTS REALES GENERADOS' AS tipo,
    'Lunes 13/10 (con reserva)' AS descripcion,
    CONCAT('Slots: ', COALESCE(COUNT(*)::TEXT, '0'), ' | Horario: ', COALESCE(MIN(start_time)::TEXT, 'N/A'), ' - ', COALESCE(MAX(start_time)::TEXT, 'N/A')) AS detalle
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date = '2025-10-13'

UNION ALL

SELECT
    '📊 SLOTS REALES GENERADOS' AS tipo,
    'Lunes 20/10 (sin reserva)' AS descripcion,
    CONCAT('Slots: ', COALESCE(COUNT(*)::TEXT, '0'), ' | Horario: ', COALESCE(MIN(start_time)::TEXT, 'N/A'), ' - ', COALESCE(MAX(start_time)::TEXT, 'N/A')) AS detalle
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date = '2025-10-20';

-- ========================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ========================================
-- 
-- ✅ CORRECTO:
-- - Lunes 13/10: Debería tener slots (hay reserva protegida)
-- - Lunes 20/10: NO debería tener slots (está cerrado y no hay reservas)
-- - Los horarios de los slots deberían coincidir con operating_hours->monday
--
-- ❌ INCORRECTO:
-- - Si Lunes 13/10 tiene horarios diferentes a los configurados (ej: 09:00-22:00 en vez de 19:00-22:00)
--   → Indica que la regeneración usó horarios antiguos o por defecto
-- - Si Lunes 20/10 tiene slots
--   → Indica que no respetó el cierre del día
-- 
-- ========================================

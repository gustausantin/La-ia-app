-- ========================================
-- VERIFICACIÓN POST-GENERACIÓN
-- Ejecuta esto DESPUÉS de generar disponibilidades
-- ========================================

-- Reemplaza 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1' con el ID de tu restaurante

-- 1️⃣ RESUMEN EJECUTIVO
SELECT
    'RESUMEN GENERAL' AS seccion,
    COUNT(*) AS total_slots,
    COUNT(DISTINCT slot_date) AS dias_con_slots,
    COUNT(DISTINCT table_id) AS mesas_activas,
    MIN(slot_date) AS primer_dia,
    MAX(slot_date) AS ultimo_dia
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- 2️⃣ EXCEPCIONES CREADAS (Días protegidos)
SELECT
    exception_date,
    is_open,
    reason,
    created_at
FROM calendar_exceptions
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
ORDER BY exception_date;

-- 3️⃣ SLOTS POR DÍA DE LA SEMANA (Próximos 7 días)
SELECT
    slot_date,
    TO_CHAR(slot_date, 'Day') AS dia_semana,
    COUNT(*) AS total_slots,
    MIN(start_time) AS primera_hora,
    MAX(start_time) AS ultima_hora,
    COUNT(DISTINCT table_id) AS mesas
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
GROUP BY slot_date
ORDER BY slot_date;

-- 4️⃣ VERIFICACIÓN ESPECÍFICA: LUNES
SELECT
    slot_date,
    COUNT(*) AS slots_generados,
    MIN(start_time) AS hora_inicio,
    MAX(start_time) AS hora_fin,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM calendar_exceptions ce
            WHERE ce.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
              AND ce.exception_date = slot_date
        ) THEN '🛡️ PROTEGIDO'
        ELSE '📅 Normal'
    END AS estado
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND EXTRACT(DOW FROM slot_date) = 1 -- Lunes
  AND slot_date >= CURRENT_DATE
GROUP BY slot_date
ORDER BY slot_date;

-- 5️⃣ VERIFICAR RESERVA DEL 13/10
SELECT
    r.id,
    r.customer_name,
    r.reservation_date,
    r.reservation_time,
    r.party_size,
    r.status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM calendar_exceptions ce
            WHERE ce.restaurant_id = r.restaurant_id
              AND ce.exception_date = r.reservation_date
        ) THEN '✅ Protegida con excepción'
        ELSE '⚠️ NO protegida'
    END AS estado_proteccion
FROM reservations r
WHERE r.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND r.reservation_date = '2025-10-13'
  AND r.status IN ('pending', 'confirmed', 'pending_approval');

-- 6️⃣ COMPARACIÓN: ¿SE RESPETARON LOS HORARIOS?
SELECT
    '🎯 Horario configurado para Lunes' AS descripcion,
    (settings->'operating_hours'->'monday'->>'open') AS hora_apertura,
    (settings->'operating_hours'->'monday'->>'close') AS hora_cierre,
    (settings->'operating_hours'->'monday'->>'closed')::BOOLEAN AS esta_cerrado
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'

UNION ALL

SELECT
    '📊 Horarios reales generados (13/10)' AS descripcion,
    MIN(start_time)::TEXT AS hora_apertura,
    MAX(start_time)::TEXT AS hora_cierre,
    (COUNT(*) = 0)::TEXT AS esta_cerrado
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date = '2025-10-13'

UNION ALL

SELECT
    '📊 Horarios reales generados (20/10)' AS descripcion,
    COALESCE(MIN(start_time)::TEXT, 'N/A') AS hora_apertura,
    COALESCE(MAX(start_time)::TEXT, 'N/A') AS hora_cierre,
    (COUNT(*) = 0)::TEXT AS esta_cerrado
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date = '2025-10-20';

-- ========================================
-- INTERPRETACIÓN:
-- ========================================
-- 
-- ✅ CORRECTO:
-- - Debe haber una excepción para 2025-10-13
-- - El 13/10 debe tener slots de 19:00 a 22:00
-- - El 20/10 NO debe tener slots (cerrado, sin reservas)
-- - La reserva del 13/10 debe estar marcada como "Protegida"
--
-- ❌ INCORRECTO:
-- - Si el 13/10 tiene horarios diferentes (ej: 09:00-22:00)
-- - Si el 20/10 tiene slots
-- - Si no hay excepción para el 13/10
-- 
-- ========================================

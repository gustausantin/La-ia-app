-- ========================================
-- MARCAR SLOTS OCUPADOS - MULTI-TENANT
-- ========================================
-- ✅ RESPETA NORMA 2: Usa datos REALES de la BD
-- ✅ RESPETA NORMA 3: Multi-tenant (funciona para TODOS los restaurantes)
-- ✅ NO hardcodea ningún valor

-- La duración de las reservas viene de restaurants.settings->>'reservation_duration'
-- Por defecto es 90 minutos si no está configurado

UPDATE availability_slots AS als
SET
    status = 'reserved',
    is_available = FALSE,
    updated_at = NOW()
FROM reservations AS r
JOIN reservation_tables AS rt ON r.id = rt.reservation_id
JOIN restaurants AS rest ON rest.id = r.restaurant_id
WHERE
    als.restaurant_id = r.restaurant_id  -- ✅ Multi-tenant
    AND als.table_id = rt.table_id
    AND als.slot_date = r.reservation_date
    AND r.status IN ('pending', 'confirmed', 'pending_approval')
    -- ✅ Usar duración REAL del restaurante (de settings JSONB)
    AND (als.start_time, als.end_time) OVERLAPS (
        r.reservation_time, 
        r.reservation_time + (COALESCE((rest.settings->>'reservation_duration')::INTEGER, 90) || ' minutes')::INTERVAL
    );

-- ========================================
-- VERIFICAR RESULTADO (EJEMPLO)
-- ========================================
-- Este query es solo para verificar, NO hardcodea datos
-- Puedes cambiar el restaurant_id y la fecha según necesites

-- SELECT 
--     als.slot_date,
--     t.name AS mesa,
--     als.start_time,
--     als.end_time,
--     als.status,
--     als.is_available,
--     r.customer_name,
--     r.reservation_time AS hora_reserva,
--     COALESCE((rest.settings->>'reservation_duration')::INTEGER, 90) AS duracion_minutos
-- FROM availability_slots als
-- JOIN tables t ON als.table_id = t.id
-- JOIN restaurants rest ON rest.id = als.restaurant_id
-- LEFT JOIN reservation_tables rt ON rt.table_id = als.table_id
-- LEFT JOIN reservations r ON r.id = rt.reservation_id 
--     AND r.reservation_date = als.slot_date
--     AND r.status IN ('pending', 'confirmed', 'pending_approval')
-- WHERE als.restaurant_id = 'TU_RESTAURANT_ID_AQUI'  -- ⚠️ Cambiar por tu ID
--   AND als.slot_date = '2025-10-13'  -- ⚠️ Cambiar por tu fecha
-- ORDER BY t.name, als.start_time;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Los slots que coinciden con reservas activas deben tener:
-- - status = 'reserved'
-- - is_available = false
-- ========================================

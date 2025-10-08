-- ========================================
-- PROBAR EJECUCIÓN MANUAL
-- ========================================
-- Ejecuta esto para ver el mantenimiento en acción
-- ========================================

-- 📊 ANTES: Ver estado actual
SELECT 
    'ANTES' as momento,
    r.name as restaurante,
    (r.settings->>'advance_booking_days')::INTEGER as dias_config,
    MIN(a.slot_date) as primer_dia,
    MAX(a.slot_date) as ultimo_dia,
    MAX(a.slot_date) - CURRENT_DATE as dias_adelante,
    COUNT(DISTINCT a.slot_date) as dias_totales,
    COUNT(*) as slots_totales
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
GROUP BY r.id, r.name, r.settings;

-- 🔍 Slots antiguos LIBRES (antes de limpiar)
SELECT 
    'SLOTS ANTIGUOS LIBRES (antes)' as info,
    restaurant_id,
    COUNT(*) as slots_antiguos
FROM availability_slots
WHERE slot_date < CURRENT_DATE
  AND status = 'free'
  AND is_available = TRUE
GROUP BY restaurant_id;

-- 🚀 EJECUTAR MANTENIMIENTO
SELECT daily_availability_maintenance();

-- ⏸️ ESPERA 2 SEGUNDOS (ejecuta las siguientes queries después)

-- 📊 DESPUÉS: Ver estado actual
SELECT 
    'DESPUÉS' as momento,
    r.name as restaurante,
    (r.settings->>'advance_booking_days')::INTEGER as dias_config,
    MIN(a.slot_date) as primer_dia,
    MAX(a.slot_date) as ultimo_dia,
    MAX(a.slot_date) - CURRENT_DATE as dias_adelante,
    COUNT(DISTINCT a.slot_date) as dias_totales,
    COUNT(*) as slots_totales
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
GROUP BY r.id, r.name, r.settings;

-- 🔍 Slots antiguos LIBRES (después de limpiar)
-- Debe devolver 0 filas
SELECT 
    'SLOTS ANTIGUOS LIBRES (después)' as info,
    restaurant_id,
    COUNT(*) as slots_antiguos
FROM availability_slots
WHERE slot_date < CURRENT_DATE
  AND status = 'free'
  AND is_available = TRUE
GROUP BY restaurant_id;

-- ✅ VERIFICACIÓN FINAL
SELECT 
    CASE 
        WHEN MAX(a.slot_date) - CURRENT_DATE = (r.settings->>'advance_booking_days')::INTEGER 
        THEN '✅ CORRECTO: Ventana de ' || (r.settings->>'advance_booking_days') || ' días mantenida'
        ELSE '⚠️ REVISAR: Esperado ' || (r.settings->>'advance_booking_days') || ' días, tiene ' || (MAX(a.slot_date) - CURRENT_DATE)
    END as resultado,
    r.name as restaurante
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
GROUP BY r.id, r.name, r.settings;


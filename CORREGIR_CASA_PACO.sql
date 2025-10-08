-- ========================================
-- CORREGIR VENTANA DE CASA PACO
-- ========================================

-- 1️⃣ VERIFICAR CONFIGURACIÓN ACTUAL
SELECT 
    name,
    (settings->>'advance_booking_days')::INTEGER as dias_configurados,
    settings
FROM restaurants
WHERE name = 'Casa Paco';

-- 2️⃣ VER ESTADO ACTUAL DE SLOTS
SELECT 
    'Casa Paco - Estado Actual' as info,
    MIN(slot_date) as primer_dia,
    MAX(slot_date) as ultimo_dia,
    MAX(slot_date) - CURRENT_DATE as dias_adelante,
    COUNT(DISTINCT slot_date) as dias_totales,
    COUNT(*) as slots_totales
FROM availability_slots
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Casa Paco');

-- 3️⃣ VER RESERVAS ACTIVAS DE CASA PACO
SELECT 
    'Reservas Activas' as tipo,
    reservation_date,
    COUNT(*) as cantidad
FROM reservations
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Casa Paco')
  AND reservation_date >= CURRENT_DATE
  AND status NOT IN ('cancelled', 'completed')
GROUP BY reservation_date
ORDER BY reservation_date;

-- 4️⃣ EJECUTAR MANTENIMIENTO SOLO PARA CASA PACO
-- (Esto borrará slots libres antiguos y ajustará la ventana)
DO $$
DECLARE
    v_restaurant_id UUID;
    v_result jsonb;
BEGIN
    -- Obtener ID de Casa Paco
    SELECT id INTO v_restaurant_id FROM restaurants WHERE name = 'Casa Paco';
    
    -- Ejecutar mantenimiento
    SELECT daily_availability_maintenance() INTO v_result;
    
    RAISE NOTICE 'Resultado: %', v_result;
END $$;

-- 5️⃣ VERIFICAR DESPUÉS
SELECT 
    'Casa Paco - Después del mantenimiento' as info,
    MIN(slot_date) as primer_dia,
    MAX(slot_date) as ultimo_dia,
    MAX(slot_date) - CURRENT_DATE as dias_adelante,
    COUNT(DISTINCT slot_date) as dias_totales,
    COUNT(*) as slots_totales
FROM availability_slots
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Casa Paco');

-- 6️⃣ VERIFICACIÓN FINAL
SELECT 
    r.name as restaurante,
    (r.settings->>'advance_booking_days')::INTEGER as dias_configurados,
    MAX(a.slot_date) - CURRENT_DATE as dias_reales,
    CASE 
        WHEN MAX(a.slot_date) - CURRENT_DATE = (r.settings->>'advance_booking_days')::INTEGER 
        THEN '✅ CORRECTO'
        ELSE '⚠️ AÚN DESAJUSTADO: ' || (MAX(a.slot_date) - CURRENT_DATE) || ' días reales vs ' || (r.settings->>'advance_booking_days') || ' configurados'
    END as resultado
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
WHERE r.name = 'Casa Paco'
GROUP BY r.id, r.name, r.settings;


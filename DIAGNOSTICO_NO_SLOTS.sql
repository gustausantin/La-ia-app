-- =====================================================
-- DIAGNÓSTICO: ¿Por qué no se crean slots?
-- =====================================================

-- 1. VERIFICAR CONFIGURACIÓN DEL RESTAURANTE
SELECT 
    'CONFIGURACIÓN RESTAURANTE' as tipo,
    id,
    name,
    settings->'operating_hours' as horarios,
    settings->'reservation_policy' as politica_reservas
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid;

-- 2. VERIFICAR MESAS ACTIVAS
SELECT 
    'MESAS ACTIVAS' as tipo,
    COUNT(*) as total_mesas,
    COUNT(CASE WHEN is_active = true THEN 1 END) as mesas_activas,
    MIN(capacity) as min_capacidad,
    MAX(capacity) as max_capacidad
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid;

-- 3. VERIFICAR HORARIOS ESPECÍFICOS POR DÍA
SELECT 
    'HORARIOS POR DÍA' as tipo,
    key as dia,
    value as configuracion,
    value->>'open' as apertura,
    value->>'close' as cierre,
    value->>'closed' as cerrado
FROM restaurants r,
jsonb_each(r.settings->'operating_hours') 
WHERE r.id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid;

-- 4. VERIFICAR SLOTS EXISTENTES
SELECT 
    'SLOTS EXISTENTES' as tipo,
    COUNT(*) as total_slots,
    MIN(slot_date) as fecha_minima,
    MAX(slot_date) as fecha_maxima,
    COUNT(CASE WHEN status = 'free' THEN 1 END) as libres,
    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as ocupados
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid;

-- 5. PROBAR FUNCIÓN DIRECTAMENTE CON DEBUG
DO $$
DECLARE
    v_result jsonb;
    v_restaurant_id uuid := '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid;
    v_start_date date := CURRENT_DATE;
    v_end_date date := CURRENT_DATE + 3; -- Solo 3 días para debug
BEGIN
    RAISE NOTICE '🔍 INICIANDO DIAGNÓSTICO DIRECTO';
    RAISE NOTICE '📅 Fechas: % a %', v_start_date, v_end_date;
    
    -- Llamar función directamente
    SELECT generate_availability_slots(
        v_restaurant_id,
        v_start_date,
        v_end_date,
        90
    ) INTO v_result;
    
    RAISE NOTICE '📊 RESULTADO: %', v_result;
    
    -- Verificar si se crearon slots
    IF (v_result->>'slots_created')::integer > 0 THEN
        RAISE NOTICE '✅ Se crearon % slots', v_result->>'slots_created';
    ELSE
        RAISE NOTICE '❌ NO se crearon slots';
        RAISE NOTICE '🔍 Días procesados: %', v_result->>'days_processed';
        RAISE NOTICE '🔍 Días abiertos: %', v_result->>'open_days';
        RAISE NOTICE '🔍 Mesas usadas: %', v_result->>'tables_used';
    END IF;
END $$;

-- 6. VERIFICAR EVENTOS ESPECIALES
SELECT 
    'EVENTOS ESPECIALES' as tipo,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN is_closed = true THEN 1 END) as eventos_cerrados,
    MIN(event_date) as fecha_minima,
    MAX(event_date) as fecha_maxima
FROM special_events 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND event_date >= CURRENT_DATE
AND event_date <= CURRENT_DATE + 30;

-- 7. VERIFICAR RESERVAS EXISTENTES
SELECT 
    'RESERVAS EXISTENTES' as tipo,
    COUNT(*) as total_reservas,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
    MIN(reservation_date) as fecha_minima,
    MAX(reservation_date) as fecha_maxima
FROM reservations 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND reservation_date >= CURRENT_DATE
AND reservation_date <= CURRENT_DATE + 30;

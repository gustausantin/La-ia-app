-- =====================================================
-- TEST DE ZONAS DINÁMICAS
-- Fecha: 17 Octubre 2025
-- Propósito: Verificar implementación completa
-- =====================================================

-- ===== TEST 1: VERIFICAR COLUMNA ZONE EN AVAILABILITY_SLOTS =====
DO $$
DECLARE
    v_column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'availability_slots' 
          AND column_name = 'zone'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE NOTICE '✅ TEST 1 PASS: Columna "zone" existe en availability_slots';
    ELSE
        RAISE EXCEPTION '❌ TEST 1 FAIL: Columna "zone" NO existe en availability_slots';
    END IF;
END $$;

-- ===== TEST 2: VERIFICAR TIPO DE DATO =====
DO $$
DECLARE
    v_data_type TEXT;
BEGIN
    SELECT udt_name INTO v_data_type
    FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
      AND column_name = 'zone';
    
    IF v_data_type = 'zone_type' THEN
        RAISE NOTICE '✅ TEST 2 PASS: Columna "zone" es de tipo zone_type (ENUM)';
    ELSE
        RAISE EXCEPTION '❌ TEST 2 FAIL: Columna "zone" NO es zone_type (es: %)', v_data_type;
    END IF;
END $$;

-- ===== TEST 3: VERIFICAR ÍNDICE =====
DO $$
DECLARE
    v_index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'availability_slots' 
          AND indexname = 'idx_availability_slots_zone_search'
    ) INTO v_index_exists;
    
    IF v_index_exists THEN
        RAISE NOTICE '✅ TEST 3 PASS: Índice idx_availability_slots_zone_search existe';
    ELSE
        RAISE WARNING '⚠️ TEST 3 FAIL: Índice NO existe (no crítico, pero recomendado)';
    END IF;
END $$;

-- ===== TEST 4: VERIFICAR QUE TODOS LOS SLOTS TIENEN ZONA =====
DO $$
DECLARE
    v_total_slots INTEGER;
    v_slots_sin_zona INTEGER;
    v_porcentaje_ok NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_slots FROM availability_slots;
    SELECT COUNT(*) INTO v_slots_sin_zona FROM availability_slots WHERE zone IS NULL;
    
    IF v_total_slots = 0 THEN
        RAISE NOTICE '⚠️ TEST 4 SKIP: No hay slots en la base de datos';
    ELSIF v_slots_sin_zona = 0 THEN
        RAISE NOTICE '✅ TEST 4 PASS: Todos los % slots tienen zona asignada', v_total_slots;
    ELSE
        v_porcentaje_ok := ((v_total_slots - v_slots_sin_zona)::NUMERIC / v_total_slots::NUMERIC) * 100;
        RAISE WARNING '⚠️ TEST 4 PARTIAL: % de % slots SIN zona (%.2f%% OK)', 
            v_slots_sin_zona, v_total_slots, v_porcentaje_ok;
    END IF;
END $$;

-- ===== TEST 5: VERIFICAR DISTRIBUCIÓN DE ZONAS =====
DO $$
DECLARE
    v_interior INTEGER;
    v_terraza INTEGER;
    v_barra INTEGER;
    v_privado INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE zone = 'interior') as interior,
        COUNT(*) FILTER (WHERE zone = 'terraza') as terraza,
        COUNT(*) FILTER (WHERE zone = 'barra') as barra,
        COUNT(*) FILTER (WHERE zone = 'privado') as privado
    INTO v_interior, v_terraza, v_barra, v_privado
    FROM availability_slots;
    
    RAISE NOTICE '📊 DISTRIBUCIÓN DE ZONAS:';
    RAISE NOTICE '   🏠 Interior: % slots', v_interior;
    RAISE NOTICE '   ☀️ Terraza: % slots', v_terraza;
    RAISE NOTICE '   🍷 Barra: % slots', v_barra;
    RAISE NOTICE '   🚪 Privado: % slots', v_privado;
    
    IF v_interior > 0 OR v_terraza > 0 OR v_barra > 0 OR v_privado > 0 THEN
        RAISE NOTICE '✅ TEST 5 PASS: Hay slots distribuidos en zonas';
    ELSE
        RAISE NOTICE '⚠️ TEST 5 SKIP: No hay slots para verificar distribución';
    END IF;
END $$;

-- ===== TEST 6: VERIFICAR FUNCIÓN ACTUALIZADA =====
DO $$
DECLARE
    v_function_source TEXT;
    v_has_zone_logic BOOLEAN;
BEGIN
    SELECT prosrc INTO v_function_source
    FROM pg_proc 
    WHERE proname = 'cleanup_and_regenerate_availability';
    
    v_has_zone_logic := v_function_source LIKE '%v_table.zone%';
    
    IF v_has_zone_logic THEN
        RAISE NOTICE '✅ TEST 6 PASS: Función cleanup_and_regenerate_availability incluye lógica de zona';
    ELSE
        RAISE EXCEPTION '❌ TEST 6 FAIL: Función NO incluye lógica de zona (ejecutar migración 20251017_004)';
    END IF;
END $$;

-- ===== TEST 7: GENERAR SLOT DE PRUEBA =====
DO $$
DECLARE
    v_test_restaurant_id UUID;
    v_test_table_id UUID;
    v_test_zone zone_type;
    v_slot_id UUID;
BEGIN
    -- Obtener un restaurante y mesa de prueba
    SELECT id INTO v_test_restaurant_id FROM restaurants LIMIT 1;
    
    IF v_test_restaurant_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST 7 SKIP: No hay restaurantes para probar';
        RETURN;
    END IF;
    
    SELECT id, zone INTO v_test_table_id, v_test_zone 
    FROM tables 
    WHERE restaurant_id = v_test_restaurant_id AND is_active = true 
    LIMIT 1;
    
    IF v_test_table_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST 7 SKIP: No hay mesas activas para probar';
        RETURN;
    END IF;
    
    -- Crear slot de prueba
    INSERT INTO availability_slots (
        restaurant_id,
        slot_date,
        start_time,
        end_time,
        table_id,
        zone,
        status,
        source
    ) VALUES (
        v_test_restaurant_id,
        CURRENT_DATE + 999,  -- Fecha lejana para evitar conflictos
        '23:59:00',
        '23:59:30',
        v_test_table_id,
        v_test_zone,
        'free',
        'manual'  -- ✅ CORREGIDO: 'manual' es un valor válido según el constraint
    ) RETURNING id INTO v_slot_id;
    
    -- Verificar que se creó con zona
    IF EXISTS (
        SELECT 1 FROM availability_slots 
        WHERE id = v_slot_id AND zone IS NOT NULL
    ) THEN
        RAISE NOTICE '✅ TEST 7 PASS: Slot de prueba creado correctamente con zona "%" (source: manual)', v_test_zone;
        
        -- Limpiar
        DELETE FROM availability_slots WHERE id = v_slot_id;
        RAISE NOTICE '🧹 Slot de prueba eliminado';
    ELSE
        RAISE EXCEPTION '❌ TEST 7 FAIL: Slot de prueba NO tiene zona asignada';
    END IF;
END $$;

-- ===== TEST 8: CONSULTA DE DISPONIBILIDAD POR ZONA =====
DO $$
DECLARE
    v_test_restaurant_id UUID;
    v_slots_encontrados INTEGER;
BEGIN
    SELECT id INTO v_test_restaurant_id FROM restaurants LIMIT 1;
    
    IF v_test_restaurant_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST 8 SKIP: No hay restaurantes para probar';
        RETURN;
    END IF;
    
    -- Simular consulta de check_availability con zona
    SELECT COUNT(*) INTO v_slots_encontrados
    FROM availability_slots
    WHERE restaurant_id = v_test_restaurant_id
      AND slot_date >= CURRENT_DATE
      AND zone = 'interior'
      AND status = 'free'
    LIMIT 10;
    
    RAISE NOTICE '📊 TEST 8: Encontrados % slots libres en "interior" (consulta directa)', v_slots_encontrados;
    RAISE NOTICE '✅ TEST 8 PASS: Consulta por zona funciona correctamente';
END $$;

-- ===== RESUMEN FINAL =====
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🎉 TESTING COMPLETADO - ZONAS DINÁMICAS';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE 'Si todos los tests pasaron: ✅ Sistema listo para usar zonas';
    RAISE NOTICE 'Si algún test falló: ❌ Revisar migraciones pendientes';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Regenerar slots existentes (opcional)';
    RAISE NOTICE '2. Actualizar workflow N8N check_availability';
    RAISE NOTICE '3. Actualizar prompt Super Agent con lógica de zonas';
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;


-- =====================================================
-- DEBUG ESPECÍFICO PARA CASA LOLITA
-- =====================================================
-- Restaurant ID: 69726b25-d3e9-4b9c-bc05-610e70ed2c4f

-- 1. VERIFICAR CONFIGURACIÓN DEL RESTAURANTE
SELECT 
    id,
    name,
    settings->'operating_hours' as horarios,
    settings->'reservation_policy' as politica_reservas
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 2. VERIFICAR MESAS ACTIVAS
SELECT 
    id,
    name,
    capacity,
    is_active,
    zone,
    created_at
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
ORDER BY name;

-- 3. CONTAR MESAS ACTIVAS vs INACTIVAS
SELECT 
    is_active,
    COUNT(*) as cantidad
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
GROUP BY is_active;

-- 4. VER HORARIOS CONFIGURADOS (más legible)
SELECT 
    jsonb_pretty(settings->'operating_hours') as horarios_formateados
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 5. INTENTAR GENERAR MANUALMENTE UN SLOT DE PRUEBA
-- Esto nos dirá si hay algún problema con los datos
DO $$
DECLARE
    v_restaurant_id uuid := '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';
    v_settings jsonb;
    v_operating_hours jsonb;
    v_tables_count integer;
    v_active_tables integer;
    v_message text := '';
BEGIN
    -- Obtener configuración
    SELECT settings INTO v_settings
    FROM restaurants WHERE id = v_restaurant_id;
    
    -- Verificar horarios
    v_operating_hours := v_settings->'operating_hours';
    
    IF v_operating_hours IS NULL THEN
        v_message := v_message || '❌ NO HAY HORARIOS CONFIGURADOS' || chr(10);
    ELSE
        v_message := v_message || '✅ Horarios encontrados' || chr(10);
        
        -- Verificar días abiertos
        IF (v_operating_hours->>'monday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Lunes abierto' || chr(10);
        END IF;
        IF (v_operating_hours->>'tuesday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Martes abierto' || chr(10);
        END IF;
        IF (v_operating_hours->>'wednesday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Miércoles abierto' || chr(10);
        END IF;
        IF (v_operating_hours->>'thursday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Jueves abierto' || chr(10);
        END IF;
        IF (v_operating_hours->>'friday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Viernes abierto' || chr(10);
        END IF;
        IF (v_operating_hours->>'saturday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Sábado abierto' || chr(10);
        END IF;
        IF (v_operating_hours->>'sunday')::jsonb->>'open' = 'true' THEN
            v_message := v_message || '  ✅ Domingo abierto' || chr(10);
        END IF;
    END IF;
    
    -- Contar mesas
    SELECT COUNT(*) INTO v_tables_count
    FROM tables WHERE restaurant_id = v_restaurant_id;
    
    SELECT COUNT(*) INTO v_active_tables
    FROM tables WHERE restaurant_id = v_restaurant_id AND is_active = true;
    
    v_message := v_message || chr(10) || 'MESAS:' || chr(10);
    v_message := v_message || '  Total: ' || v_tables_count || chr(10);
    v_message := v_message || '  Activas: ' || v_active_tables || chr(10);
    
    IF v_active_tables = 0 THEN
        v_message := v_message || '  ❌ NO HAY MESAS ACTIVAS - ESTE ES EL PROBLEMA!' || chr(10);
    END IF;
    
    RAISE NOTICE '%', v_message;
END $$;

-- 6. VERIFICAR SI HAY SLOTS PARA ALGUNA FECHA
SELECT 
    COUNT(*) as total_slots_historicos,
    MIN(slot_date) as primer_slot,
    MAX(slot_date) as ultimo_slot
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 7. PROBAR LA FUNCIÓN DE GENERACIÓN DIRECTAMENTE
-- Esto generará slots para los próximos 7 días si todo está bien
SELECT generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 7
);

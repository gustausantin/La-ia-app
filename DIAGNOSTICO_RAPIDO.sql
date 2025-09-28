-- =====================================================
-- DIAGNÓSTICO RÁPIDO - QUÉ ESTÁ FALLANDO
-- =====================================================

-- 1. EJECUTAR LA FUNCIÓN Y VER QUÉ DICE
SELECT generar_disponibilidades_real(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 7  -- Solo 7 días para debug
) as RESULTADO_FUNCION;

-- 2. VER SI HAY HORARIOS
SELECT 
    'HORARIOS' as que,
    CASE 
        WHEN settings->'operating_hours' IS NULL THEN 'NO HAY HORARIOS'
        ELSE 'SÍ HAY HORARIOS'
    END as estado,
    settings->'operating_hours' as datos
FROM restaurants 
WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 3. VER SI HAY MESAS ACTIVAS
SELECT 
    'MESAS ACTIVAS' as que,
    COUNT(*) as cuantas
FROM tables 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND is_active = true;

-- 4. VER DÍAS ABIERTOS
SELECT 
    'Jueves' as dia,
    CASE 
        WHEN settings->'operating_hours'->'thursday'->>'open' = 'true' THEN 'ABIERTO'
        ELSE 'CERRADO'
    END as estado
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Viernes',
    CASE 
        WHEN settings->'operating_hours'->'friday'->>'open' = 'true' THEN 'ABIERTO'
        ELSE 'CERRADO'
    END
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
UNION ALL
SELECT 'Sábado',
    CASE 
        WHEN settings->'operating_hours'->'saturday'->>'open' = 'true' THEN 'ABIERTO'
        ELSE 'CERRADO'
    END
FROM restaurants WHERE id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

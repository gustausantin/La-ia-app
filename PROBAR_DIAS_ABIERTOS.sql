-- =====================================================
-- PROBAR SISTEMA CON DÍAS QUE SÍ ESTÁN ABIERTOS
-- =====================================================

-- 1. ENCONTRAR EL PRÓXIMO VIERNES Y SÁBADO
SELECT 
    'PROXIMOS_DIAS_ABIERTOS' as info,
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7 as proximo_viernes,
    CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7 as proximo_sabado;

-- 2. PROBAR GENERACIÓN PARA EL PRÓXIMO VIERNES (que está abierto)
SELECT generate_availability_slots_definitivo(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7, -- Próximo viernes
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7, -- Solo ese día
    90
) as resultado_viernes;

-- 3. VERIFICAR SLOTS CREADOS PARA ESE VIERNES
SELECT 
    'SLOTS_CREADOS_VIERNES' as verificacion,
    slot_date,
    COUNT(*) as total_slots,
    array_agg(DISTINCT start_time ORDER BY start_time) as horarios_disponibles
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND slot_date = CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7
GROUP BY slot_date;

-- 4. ALTERNATIVA: ABRIR TEMPORALMENTE EL LUNES PARA PROBAR
UPDATE restaurant_operating_hours 
SET is_open = true 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid 
AND day_of_week = 1; -- Lunes

-- 5. PROBAR CON EL LUNES AHORA ABIERTO
SELECT generate_availability_slots_definitivo(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7, -- Próximo lunes
    CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7, -- Solo ese día
    90
) as resultado_lunes_abierto;

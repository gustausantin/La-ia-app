-- =====================================================
-- DEBUG: DÍA ESPECÍFICO 30 SEPTIEMBRE 2025
-- =====================================================

-- 1. ¿Qué día de la semana es el 30 de septiembre?
SELECT 
    'DIA_30_SEPTIEMBRE' as info,
    '2025-09-30'::date as fecha,
    EXTRACT(DOW FROM '2025-09-30'::date) as dia_semana,
    CASE EXTRACT(DOW FROM '2025-09-30'::date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes' 
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as nombre_dia;

-- 2. ¿Está abierto ese día de la semana?
SELECT 
    'HORARIO_LUNES' as info,
    day_of_week,
    is_open,
    open_time,
    close_time
FROM restaurant_operating_hours 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND day_of_week = EXTRACT(DOW FROM '2025-09-30'::date);

-- 3. ¿Hay eventos especiales ese día?
SELECT 
    'EVENTOS_30_SEPT' as info,
    event_date,
    title,
    is_closed
FROM special_events 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid
AND event_date = '2025-09-30'::date;

-- 4. Probar con un día que SÍ sabemos que está abierto (viernes)
SELECT 
    'PROBAR_VIERNES' as info,
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7 as proximo_viernes;

-- 5. Generar slots para el próximo viernes
SELECT generate_availability_slots_definitivo(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7, -- Próximo viernes
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE) + 7)::integer % 7, -- Solo ese día
    90
) as resultado_viernes;

-- 🧪 PRUEBA DE LA FUNCIÓN DEFINITIVA
-- Vamos a probar que la lógica funciona correctamente

-- 1. EJECUTAR LA FUNCIÓN CON TU RESTAURANTE
SELECT generate_availability_slots_smart_check(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,  -- Casa Lolita
    CURRENT_DATE,                                    -- Desde hoy
    (CURRENT_DATE + interval '10 days')::date,      -- 10 días como antes
    90                                               -- 90 minutos duración
);

-- 2. VERIFICAR QUE NO SE CREARON SLOTS EN DÍAS CERRADOS
-- Según tu configuración: Lunes, Martes, Miércoles, Jueves, Domingo = CERRADOS
SELECT 
    slot_date,
    CASE EXTRACT(DOW FROM slot_date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes' 
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as dia_semana,
    COUNT(*) as total_slots,
    MIN(start_time) as primer_slot,
    MAX(start_time) as ultimo_slot,
    array_agg(DISTINCT shift_name) as turnos_usados
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
GROUP BY slot_date
ORDER BY slot_date;

-- 3. VERIFICAR SLOTS SOLO EN VIERNES Y SÁBADO
-- Debería mostrar SOLO Viernes y Sábado con slots
SELECT 
    CASE EXTRACT(DOW FROM slot_date)
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
        ELSE 'ERROR: Día cerrado'
    END as dia_esperado,
    COUNT(*) as slots_creados,
    array_agg(DISTINCT shift_name ORDER BY shift_name) as turnos
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
GROUP BY EXTRACT(DOW FROM slot_date)
ORDER BY EXTRACT(DOW FROM slot_date);

-- 4. DETALLE DE SLOTS POR TURNO (VIERNES)
-- Viernes tiene 3 turnos: Horario Completo (09:00-22:00), Turno Mañana (12:00-14:00), Turno Noche (19:00-21:00)
SELECT 
    shift_name,
    COUNT(*) as slots_en_turno,
    MIN(start_time) as inicio_turno,
    MAX(start_time) as ultimo_slot_turno,
    MAX(end_time) as fin_ultimo_slot
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
AND EXTRACT(DOW FROM slot_date) = 5  -- Viernes
GROUP BY shift_name
ORDER BY MIN(start_time);

-- 5. DETALLE DE SLOTS POR TURNO (SÁBADO)  
-- Sábado tiene 2 turnos: Horario Principal (09:00-22:00), Turno Mañana (12:00-14:00)
SELECT 
    shift_name,
    COUNT(*) as slots_en_turno,
    MIN(start_time) as inicio_turno,
    MAX(start_time) as ultimo_slot_turno,
    MAX(end_time) as fin_ultimo_slot
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
AND EXTRACT(DOW FROM slot_date) = 6  -- Sábado
GROUP BY shift_name
ORDER BY MIN(start_time);

-- 6. RESUMEN FINAL: ¿SE SOLUCIONÓ EL PROBLEMA?
SELECT 
    'ANTES: 32 slots en días cerrados' as problema_anterior,
    'AHORA: ' || COUNT(*) || ' slots SOLO en días abiertos' as solucion_actual,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ ERROR: No se crearon slots'
        WHEN EXISTS (
            SELECT 1 FROM availability_slots a
            WHERE a.restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
            AND a.slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
            AND EXTRACT(DOW FROM a.slot_date) IN (0,1,2,3,4)  -- Dom,Lun,Mar,Mie,Jue
        ) THEN '❌ ERROR: Hay slots en días cerrados'
        ELSE '✅ PERFECTO: Solo slots en Viernes y Sábado'
    END as resultado
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date;

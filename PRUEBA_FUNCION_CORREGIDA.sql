-- 🧪 PRUEBA DE LA FUNCIÓN CORREGIDA
-- Ahora que el fix crítico está aplicado, vamos a probar que funciona correctamente

-- 1. EJECUTAR LA FUNCIÓN CORREGIDA CON TU RESTAURANTE
SELECT generate_availability_slots_smart_check(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,  -- Casa Lolita
    CURRENT_DATE,                                    -- Desde hoy
    (CURRENT_DATE + interval '10 days')::date,      -- 10 días como antes
    90                                               -- 90 minutos duración
);

-- 2. VERIFICAR QUE AHORA SÍ RESPETA LOS DÍAS CERRADOS
-- Según tu configuración: Lunes, Martes, Miércoles, Jueves, Domingo = CERRADOS
-- Solo debería crear slots en Viernes y Sábado
SELECT 
    slot_date,
    CASE EXTRACT(DOW FROM slot_date)
        WHEN 0 THEN 'Domingo (DEBE ESTAR CERRADO)'
        WHEN 1 THEN 'Lunes (DEBE ESTAR CERRADO)' 
        WHEN 2 THEN 'Martes (DEBE ESTAR CERRADO)'
        WHEN 3 THEN 'Miércoles (DEBE ESTAR CERRADO)'
        WHEN 4 THEN 'Jueves (DEBE ESTAR CERRADO)'
        WHEN 5 THEN 'Viernes (ABIERTO)'
        WHEN 6 THEN 'Sábado (ABIERTO)'
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

-- 3. VERIFICACIÓN CRÍTICA: ¿SE SOLUCIONÓ EL PROBLEMA?
-- Esta consulta debe mostrar SOLO Viernes y Sábado
SELECT 
    'ANTES: 32 slots en días cerrados (PROBLEMA)' as problema_anterior,
    'AHORA: ' || COUNT(*) || ' slots SOLO en días abiertos' as solucion_actual,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ ERROR: No se crearon slots (revisar configuración)'
        WHEN EXISTS (
            SELECT 1 FROM availability_slots a
            WHERE a.restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
            AND a.slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
            AND EXTRACT(DOW FROM a.slot_date) IN (0,1,2,3,4)  -- Dom,Lun,Mar,Mie,Jue
        ) THEN '❌ ERROR: AÚN HAY SLOTS EN DÍAS CERRADOS'
        ELSE '✅ PERFECTO: Solo slots en Viernes y Sábado'
    END as resultado
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date;

-- 4. DETALLE POR DÍA DE LA SEMANA
-- Debe mostrar 0 slots para días cerrados
SELECT 
    EXTRACT(DOW FROM slot_date) as dow,
    CASE EXTRACT(DOW FROM slot_date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes' 
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as dia_semana,
    CASE EXTRACT(DOW FROM slot_date)
        WHEN 0 THEN 'CERRADO'
        WHEN 1 THEN 'CERRADO' 
        WHEN 2 THEN 'CERRADO'
        WHEN 3 THEN 'CERRADO'
        WHEN 4 THEN 'CERRADO'
        WHEN 5 THEN 'ABIERTO'
        WHEN 6 THEN 'ABIERTO'
    END as estado_esperado,
    COUNT(*) as slots_generados,
    CASE 
        WHEN EXTRACT(DOW FROM slot_date) IN (0,1,2,3,4) AND COUNT(*) > 0 THEN '❌ ERROR'
        WHEN EXTRACT(DOW FROM slot_date) IN (5,6) AND COUNT(*) > 0 THEN '✅ CORRECTO'
        WHEN EXTRACT(DOW FROM slot_date) IN (0,1,2,3,4) AND COUNT(*) = 0 THEN '✅ CORRECTO'
        ELSE '⚠️ REVISAR'
    END as validacion
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
GROUP BY EXTRACT(DOW FROM slot_date)
ORDER BY EXTRACT(DOW FROM slot_date);

-- 5. DETALLE DE TURNOS EN DÍAS ABIERTOS
-- Viernes: 3 turnos (Horario Completo, Turno Mañana, Turno Noche)
-- Sábado: 2 turnos (Horario Principal, Turno Mañana)
SELECT 
    slot_date,
    CASE EXTRACT(DOW FROM slot_date)
        WHEN 5 THEN 'Viernes (3 turnos esperados)'
        WHEN 6 THEN 'Sábado (2 turnos esperados)'
        ELSE 'Día no esperado'
    END as dia_info,
    shift_name,
    COUNT(*) as slots_en_turno,
    MIN(start_time) as inicio_turno,
    MAX(start_time) as ultimo_slot
FROM availability_slots 
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '10 days')::date
AND EXTRACT(DOW FROM slot_date) IN (5,6)  -- Solo Viernes y Sábado
GROUP BY slot_date, shift_name
ORDER BY slot_date, MIN(start_time);

-- 6. RESUMEN FINAL DEL FIX
SELECT 
    '🎯 PROBLEMA ORIGINAL' as categoria,
    'Generaba 32 slots en días cerrados (Lun-Jue, Dom)' as descripcion
UNION ALL
SELECT 
    '🔧 FIX APLICADO' as categoria,
    'Lógica corregida: CALENDARIO → HORARIO → TURNOS → SLOTS' as descripcion
UNION ALL
SELECT 
    '✅ RESULTADO ESPERADO' as categoria,
    'Solo slots en Viernes y Sábado según turnos configurados' as descripcion;

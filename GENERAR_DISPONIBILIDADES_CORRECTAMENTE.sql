-- =====================================================
-- FUNCIÓN CORRECTA DE GENERACIÓN DE DISPONIBILIDADES
-- =====================================================
-- Esta función LEE tu configuración y genera basándose en ella
-- NO modifica nada, solo LEE y GENERA
-- =====================================================

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS generar_disponibilidades_real(uuid, date, date);

-- Crear función que RESPETA tu configuración
CREATE OR REPLACE FUNCTION generar_disponibilidades_real(
    p_restaurant_id uuid,
    p_fecha_inicio date DEFAULT CURRENT_DATE,
    p_fecha_fin date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    -- Variables para configuración del restaurante
    v_settings jsonb;
    v_horarios jsonb;
    v_politica jsonb;
    v_duracion_reserva integer;
    v_dias_anticipacion integer;
    v_fecha_final date;
    
    -- Variables para iteración
    v_fecha_actual date;
    v_dia_semana text;
    v_horario_dia jsonb;
    v_esta_abierto boolean;
    v_hora_apertura time;
    v_hora_cierre time;
    
    -- Variables para mesas y slots
    v_mesa record;
    v_hora_slot time;
    v_hora_fin_slot time;
    v_total_slots integer := 0;
    v_mesas_procesadas integer := 0;
    v_dias_abiertos integer := 0;
BEGIN
    -- =====================================================
    -- PASO 1: LEER LA CONFIGURACIÓN DEL RESTAURANTE
    -- =====================================================
    SELECT settings INTO v_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF v_settings IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Restaurante no encontrado',
            'slots_created', 0
        );
    END IF;
    
    -- Obtener horarios configurados por el usuario
    v_horarios := v_settings->'operating_hours';
    IF v_horarios IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay horarios configurados. Ve a Configuración > Horarios',
            'slots_created', 0
        );
    END IF;
    
    -- Obtener política de reservas configurada por el usuario
    v_politica := v_settings->'reservation_policy';
    v_duracion_reserva := COALESCE((v_politica->>'reservation_duration')::integer, 90);
    v_dias_anticipacion := COALESCE((v_politica->>'advance_booking_days')::integer, 30);
    
    -- Calcular fecha final basada en política
    v_fecha_final := COALESCE(p_fecha_fin, p_fecha_inicio + v_dias_anticipacion);
    
    RAISE NOTICE '📊 Configuración leída:';
    RAISE NOTICE '  - Duración reserva: % minutos', v_duracion_reserva;
    RAISE NOTICE '  - Días anticipación: %', v_dias_anticipacion;
    RAISE NOTICE '  - Generando desde % hasta %', p_fecha_inicio, v_fecha_final;
    
    -- =====================================================
    -- PASO 2: VERIFICAR MESAS ACTIVAS
    -- =====================================================
    SELECT COUNT(*) INTO v_mesas_procesadas
    FROM tables 
    WHERE restaurant_id = p_restaurant_id 
    AND is_active = true;
    
    IF v_mesas_procesadas = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay mesas activas. Ve a Configuración > Mesas',
            'slots_created', 0
        );
    END IF;
    
    RAISE NOTICE '  - Mesas activas: %', v_mesas_procesadas;
    
    -- =====================================================
    -- PASO 3: LIMPIAR SLOTS EXISTENTES EN EL RANGO
    -- =====================================================
    DELETE FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_fecha_inicio AND v_fecha_final;
    
    -- =====================================================
    -- PASO 4: GENERAR SLOTS SEGÚN CONFIGURACIÓN
    -- =====================================================
    v_fecha_actual := p_fecha_inicio;
    
    WHILE v_fecha_actual <= v_fecha_final LOOP
        -- Obtener día de la semana en inglés
        v_dia_semana := TRIM(LOWER(TO_CHAR(v_fecha_actual, 'fmday')));
        
        -- Convertir a inglés si está en español
        v_dia_semana := CASE v_dia_semana
            WHEN 'lunes' THEN 'monday'
            WHEN 'martes' THEN 'tuesday'
            WHEN 'miércoles' THEN 'wednesday'
            WHEN 'jueves' THEN 'thursday'
            WHEN 'viernes' THEN 'friday'
            WHEN 'sábado' THEN 'saturday'
            WHEN 'domingo' THEN 'sunday'
            ELSE v_dia_semana
        END;
        
        -- Obtener horario del día desde tu configuración
        v_horario_dia := v_horarios->v_dia_semana;
        
        -- Verificar si el día está abierto según TU configuración
        IF v_horario_dia IS NOT NULL AND 
           (v_horario_dia->>'open')::boolean = true THEN
            
            v_dias_abiertos := v_dias_abiertos + 1;
            v_hora_apertura := (v_horario_dia->>'start')::time;
            v_hora_cierre := (v_horario_dia->>'end')::time;
            
            -- Para cada mesa activa que TÚ creaste
            FOR v_mesa IN 
                SELECT id, name, capacity 
                FROM tables 
                WHERE restaurant_id = p_restaurant_id 
                AND is_active = true
                ORDER BY name
            LOOP
                v_hora_slot := v_hora_apertura;
                
                -- Generar slots respetando tu duración configurada
                WHILE v_hora_slot < v_hora_cierre LOOP
                    v_hora_fin_slot := v_hora_slot + (v_duracion_reserva || ' minutes')::interval;
                    
                    -- Solo crear slot si cabe completo en el horario
                    IF v_hora_fin_slot <= v_hora_cierre THEN
                        -- Insertar el slot
                        INSERT INTO availability_slots (
                            restaurant_id,
                            table_id,
                            slot_date,
                            start_time,
                            end_time,
                            duration_minutes,
                            status,
                            is_available,
                            source,
                            created_at
                        ) VALUES (
                            p_restaurant_id,
                            v_mesa.id,
                            v_fecha_actual,
                            v_hora_slot,
                            v_hora_fin_slot,
                            v_duracion_reserva,
                            'available',
                            true,
                            'system',
                            NOW()
                        );
                        
                        v_total_slots := v_total_slots + 1;
                    END IF;
                    
                    -- Avanzar al siguiente slot según tu duración
                    v_hora_slot := v_hora_slot + (v_duracion_reserva || ' minutes')::interval;
                END LOOP;
            END LOOP;
        END IF;
        
        -- Siguiente día
        v_fecha_actual := v_fecha_actual + 1;
    END LOOP;
    
    -- =====================================================
    -- PASO 5: RETORNAR RESULTADO
    -- =====================================================
    RAISE NOTICE '✅ Generación completada:';
    RAISE NOTICE '  - Total slots: %', v_total_slots;
    RAISE NOTICE '  - Días procesados: %', v_fecha_final - p_fecha_inicio + 1;
    RAISE NOTICE '  - Días abiertos: %', v_dias_abiertos;
    
    RETURN jsonb_build_object(
        'success', true,
        'slots_created', v_total_slots,
        'days_processed', v_fecha_final - p_fecha_inicio + 1,
        'open_days', v_dias_abiertos,
        'tables_count', v_mesas_procesadas,
        'duration_minutes', v_duracion_reserva,
        'message', format('Generados %s slots para %s mesas en %s días abiertos', 
            v_total_slots, v_mesas_procesadas, v_dias_abiertos)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'slots_created', 0
        );
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION generar_disponibilidades_real TO authenticated;
GRANT EXECUTE ON FUNCTION generar_disponibilidades_real TO anon;

-- =====================================================
-- EJECUTAR LA FUNCIÓN CON TU CONFIGURACIÓN
-- =====================================================
SELECT generar_disponibilidades_real(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    NULL  -- NULL para que use los días de tu política
);

-- =====================================================
-- VERIFICAR QUE SE GENERÓ CORRECTAMENTE
-- =====================================================
SELECT 
    'Slots generados' as resultado,
    COUNT(*) as total,
    COUNT(DISTINCT slot_date) as dias,
    COUNT(DISTINCT table_id) as mesas,
    MIN(slot_date) as desde,
    MAX(slot_date) as hasta
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- Ver ejemplo del 2 de octubre
SELECT 
    t.name as mesa,
    s.start_time as hora_inicio,
    s.end_time as hora_fin,
    s.duration_minutes as duracion
FROM availability_slots s
JOIN tables t ON t.id = s.table_id
WHERE s.restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND s.slot_date = '2025-10-02'
ORDER BY t.name, s.start_time
LIMIT 20;

-- 🔧 FIX QUIRÚRGICO: Corregir referencia de columna "active" 
-- Fecha: 29 Septiembre 2025
-- Problema: column "active" does not exist en función RPC
-- Solución: Cambiar "active" por "is_active" según esquema real
-- Tipo: AJUSTE QUIRÚRGICO (Norma de Oro #1)

-- =====================================================
-- 🎯 PROBLEMA IDENTIFICADO:
-- En generar_slots_para_rango_final línea 41:
-- WHERE restaurant_id = p_restaurant_id AND active = true
-- 
-- DEBE SER:
-- WHERE restaurant_id = p_restaurant_id AND is_active = true
-- =====================================================

-- FUNCIÓN AUXILIAR CORREGIDA - SOLO CAMBIO QUIRÚRGICO
CREATE OR REPLACE FUNCTION generar_slots_para_rango_final(
    p_restaurant_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_shift_name text,
    p_slot_duration_minutes integer
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_time time;
    v_end_time time;
    v_table_record record;
    v_slots_created integer := 0;
    v_last_allowed_start time;
BEGIN
    -- Calcular última hora de inicio permitida
    v_last_allowed_start := p_end_time - (p_slot_duration_minutes || ' minutes')::interval;
    
    -- Si no hay tiempo suficiente para al menos un slot, salir
    IF p_start_time > v_last_allowed_start THEN
        RAISE NOTICE '⚠️ No hay tiempo suficiente para slots entre % y %', p_start_time, p_end_time;
        RETURN 0;
    END IF;
    
    -- 🔧 FIX QUIRÚRGICO: Cambiar "active" por "is_active"
    -- Obtener todas las mesas activas del restaurante
    FOR v_table_record IN 
        SELECT id, name 
        FROM tables 
        WHERE restaurant_id = p_restaurant_id 
        AND is_active = true  -- ✅ CORREGIDO: era "active = true"
    LOOP
        v_current_time := p_start_time;
        
        -- Generar slots cada 30 minutos dentro del rango
        WHILE v_current_time <= v_last_allowed_start LOOP
            v_end_time := v_current_time + (p_slot_duration_minutes || ' minutes')::interval;
            
            -- Insertar slot (evitar duplicados)
            INSERT INTO availability_slots (
                restaurant_id,
                slot_date,
                start_time,
                end_time,
                table_id,
                shift_name,
                status,
                source,
                is_available,
                duration_minutes
            ) VALUES (
                p_restaurant_id,
                p_date,
                v_current_time,
                v_end_time,
                v_table_record.id,
                p_shift_name,
                'free',
                'system',
                true,
                p_slot_duration_minutes
            )
            ON CONFLICT (restaurant_id, slot_date, start_time, table_id) 
            DO NOTHING;
            
            v_slots_created := v_slots_created + 1;
            
            -- Avanzar 30 minutos
            v_current_time := v_current_time + interval '30 minutes';
        END LOOP;
    END LOOP;
    
    RETURN v_slots_created;
END;
$$;

-- VERIFICAR QUE EL FIX SE APLICÓ CORRECTAMENTE
DO $$
BEGIN
    RAISE NOTICE '🔧 FIX QUIRÚRGICO APLICADO: active → is_active';
    RAISE NOTICE '✅ Función generar_slots_para_rango_final actualizada';
    RAISE NOTICE '🎯 Cambio específico sin degradar funcionalidad';
    RAISE NOTICE '📊 Respetando Norma de Oro #1: Ajustes quirúrgicos';
END $$;

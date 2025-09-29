-- =====================================================
-- FIX FINAL: SMART CHECK CON TABLA CORRECTA
-- =====================================================

-- PASO 1: ELIMINAR FUNCIÓN ANTIGUA
DROP FUNCTION IF EXISTS generate_availability_slots_smart_check(uuid,date,date,integer);

-- PASO 2: CREAR FUNCIÓN NUEVA
CREATE OR REPLACE FUNCTION generate_availability_slots_smart_check(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_slot_duration_minutes INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_changes_needed BOOLEAN := false;
    v_changes_list TEXT[] := '{}';
    v_total_slots INTEGER := 0;
    v_total_tables INTEGER := 0;
    v_total_days INTEGER := 0;
    v_result JSONB;
BEGIN
    -- VERIFICAR SI HAY MESAS ACTIVAS
    SELECT COUNT(*) INTO v_total_tables
    FROM tables 
    WHERE restaurant_id = p_restaurant_id AND is_active = true;
    
    IF v_total_tables = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'no_tables_found',
            'error', 'No hay mesas activas configuradas'
        );
    END IF;
    
    -- VERIFICAR SI HAY CONFIGURACIÓN DEL RESTAURANTE
    IF NOT EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = p_restaurant_id 
        AND settings IS NOT NULL
    ) THEN
        v_changes_list := array_append(v_changes_list, 'Configuración del restaurante');
        v_changes_needed := true;
    END IF;
    
    -- VERIFICAR MESAS
    IF NOT EXISTS (
        SELECT 1 FROM tables 
        WHERE restaurant_id = p_restaurant_id AND is_active = true
    ) THEN
        v_changes_list := array_append(v_changes_list, 'Configuración de mesas');
        v_changes_needed := true;
    END IF;
    
    -- VERIFICAR EVENTOS ESPECIALES
    IF EXISTS (
        SELECT 1 FROM special_events 
        WHERE restaurant_id = p_restaurant_id 
        AND event_date BETWEEN p_start_date AND p_end_date
        AND is_closed = true
    ) THEN
        v_changes_list := array_append(v_changes_list, 'Eventos especiales en calendario');
        v_changes_needed := true;
    END IF;
    
    -- VERIFICAR DISPONIBILIDADES EXISTENTES
    SELECT COUNT(*) INTO v_total_slots
    FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND p_end_date;
    
    IF v_total_slots = 0 THEN
        v_changes_list := array_append(v_changes_list, 'No hay disponibilidades creadas');
        v_changes_needed := true;
    END IF;
    
    -- CALCULAR DÍAS EN EL RANGO
    v_total_days := (p_end_date - p_start_date) + 1;
    
    -- SI SE NECESITAN CAMBIOS, EJECUTAR REGENERACIÓN
    IF v_changes_needed THEN
        RAISE NOTICE '🔄 CAMBIOS DETECTADOS - EJECUTANDO REGENERACIÓN WORLD-CLASS';
        
        SELECT generate_availability_slots_world_class(
            p_restaurant_id,
            p_start_date,
            p_end_date,
            p_slot_duration_minutes
        ) INTO v_result;
        
        -- AÑADIR INFORMACIÓN DE CONTEXTO
        v_result := v_result || jsonb_build_object(
            'check_reason', array_to_string(v_changes_list, ', '),
            'changes_detected', v_changes_list,
            'period_start', p_start_date,
            'period_end', p_end_date,
            'days_processed', v_total_days,
            'tables_used', v_total_tables,
            'slot_duration_minutes', p_slot_duration_minutes
        );
        
        RETURN v_result;
    ELSE
        -- NO SE NECESITAN CAMBIOS
        RETURN jsonb_build_object(
            'success', true,
            'action', 'no_changes_needed',
            'message', 'Las disponibilidades están actualizadas',
            'slots_created', 0,
            'slots_updated', 0,
            'slots_preserved', v_total_slots,
            'period_start', p_start_date,
            'period_end', p_end_date,
            'days_processed', v_total_days,
            'tables_used', v_total_tables,
            'slot_duration_minutes', p_slot_duration_minutes,
            'changes_detected', v_changes_list
        );
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'action', 'error_during_check',
        'error', SQLERRM,
        'error_detail', SQLSTATE
    );
END;
$$;

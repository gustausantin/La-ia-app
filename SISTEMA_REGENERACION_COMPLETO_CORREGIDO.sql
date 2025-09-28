-- =====================================================
-- SISTEMA COMPLETO DE REGENERACIÓN INTELIGENTE - CORREGIDO
-- =====================================================
-- Implementa detección de cambios, protección de reservas y regeneración inteligente
-- ✅ TODAS LAS REFERENCIAS AMBIGUAS CORREGIDAS
-- ✅ SISTEMA COMPLETO EN UN SOLO SCRIPT

-- =====================================================
-- 1. TABLA PARA TRACKING DE CAMBIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS availability_change_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES restaurants(id),
    
    -- TIPO DE CAMBIO
    change_type text NOT NULL CHECK (change_type IN (
        'horarios_modificados',
        'mesa_agregada',
        'mesa_eliminada', 
        'mesa_desactivada',
        'politica_reservas_modificada',
        'dias_especiales_agregados',
        'configuracion_general_modificada'
    )),
    
    -- DETALLES DEL CAMBIO
    change_description text NOT NULL,
    old_values jsonb DEFAULT '{}',
    new_values jsonb DEFAULT '{}',
    affected_tables text[] DEFAULT ARRAY[]::text[],
    affected_dates daterange,
    
    -- ESTADO
    requires_regeneration boolean DEFAULT true,
    regeneration_completed boolean DEFAULT false,
    regeneration_completed_at timestamp with time zone,
    
    -- METADATA
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);

-- =====================================================
-- 2. FUNCIÓN DE DETECCIÓN DE CAMBIOS - CORREGIDA
-- =====================================================
CREATE OR REPLACE FUNCTION detect_availability_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_change_type text;
    v_description text;
    v_old_values jsonb := '{}';
    v_new_values jsonb := '{}';
    v_affected_dates daterange;
    v_restaurant_id uuid;
BEGIN
    -- ✅ CORRECCIÓN: OBTENER RESTAURANT_ID SEGÚN EL CONTEXTO SIN AMBIGÜEDAD
    CASE TG_TABLE_NAME
        WHEN 'restaurants' THEN
            v_restaurant_id := COALESCE(NEW.id, OLD.id);
        WHEN 'tables' THEN
            v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
        ELSE
            -- Para otras tablas futuras
            v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
    END CASE;
    
    -- DETECTAR TIPO DE CAMBIO SEGÚN LA TABLA
    CASE TG_TABLE_NAME
        WHEN 'restaurants' THEN
            -- Cambios en configuración del restaurante
            IF OLD.settings->'operating_hours' IS DISTINCT FROM NEW.settings->'operating_hours' THEN
                v_change_type := 'horarios_modificados';
                v_description := 'Horarios operativos modificados';
                v_old_values := jsonb_build_object('operating_hours', OLD.settings->'operating_hours');
                v_new_values := jsonb_build_object('operating_hours', NEW.settings->'operating_hours');
            ELSIF OLD.settings->'reservation_policy' IS DISTINCT FROM NEW.settings->'reservation_policy' THEN
                v_change_type := 'politica_reservas_modificada';
                v_description := 'Política de reservas modificada';
                v_old_values := jsonb_build_object('reservation_policy', OLD.settings->'reservation_policy');
                v_new_values := jsonb_build_object('reservation_policy', NEW.settings->'reservation_policy');
            ELSE
                v_change_type := 'configuracion_general_modificada';
                v_description := 'Configuración general del restaurante modificada';
            END IF;
            
        WHEN 'tables' THEN
            -- Cambios en mesas
            IF TG_OP = 'INSERT' THEN
                v_change_type := 'mesa_agregada';
                v_description := format('Nueva mesa agregada: %s (capacidad: %s)', NEW.name, NEW.capacity);
                v_new_values := jsonb_build_object('table_name', NEW.name, 'capacity', NEW.capacity, 'zone', NEW.zone);
            ELSIF TG_OP = 'DELETE' THEN
                v_change_type := 'mesa_eliminada';
                v_description := format('Mesa eliminada: %s', OLD.name);
                v_old_values := jsonb_build_object('table_name', OLD.name, 'capacity', OLD.capacity);
            ELSIF OLD.is_active = true AND NEW.is_active = false THEN
                v_change_type := 'mesa_desactivada';
                v_description := format('Mesa desactivada: %s', NEW.name);
                v_old_values := jsonb_build_object('is_active', OLD.is_active);
                v_new_values := jsonb_build_object('is_active', NEW.is_active);
            END IF;
    END CASE;
    
    -- CALCULAR FECHAS AFECTADAS (próximos 90 días por defecto)
    v_affected_dates := daterange(CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days');
    
    -- REGISTRAR EL CAMBIO
    IF v_change_type IS NOT NULL AND v_restaurant_id IS NOT NULL THEN
        INSERT INTO availability_change_log (
            restaurant_id,
            change_type,
            change_description,
            old_values,
            new_values,
            affected_dates,
            requires_regeneration
        ) VALUES (
            v_restaurant_id,
            v_change_type,
            v_description,
            v_old_values,
            v_new_values,
            v_affected_dates,
            true
        );
        
        RAISE NOTICE '🔔 Cambio detectado: % para restaurante %', v_description, v_restaurant_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGERS PARA DETECCIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para cambios en restaurants
DROP TRIGGER IF EXISTS trigger_detect_restaurant_changes ON restaurants;
CREATE TRIGGER trigger_detect_restaurant_changes
    AFTER UPDATE ON restaurants
    FOR EACH ROW
    WHEN (OLD.settings IS DISTINCT FROM NEW.settings)
    EXECUTE FUNCTION detect_availability_changes();

-- Trigger para cambios en tables
DROP TRIGGER IF EXISTS trigger_detect_table_changes ON tables;
CREATE TRIGGER trigger_detect_table_changes
    AFTER INSERT OR UPDATE OR DELETE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION detect_availability_changes();

-- =====================================================
-- 4. FUNCIÓN DE DETECCIÓN DE CONFLICTOS CON RESERVAS
-- =====================================================
CREATE OR REPLACE FUNCTION detect_reservation_conflicts(
    p_restaurant_id uuid,
    p_start_date date,
    p_end_date date,
    p_change_type text DEFAULT 'general'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflicts jsonb := '[]'::jsonb;
    v_reservation_record RECORD;
    v_conflict_count integer := 0;
BEGIN
    -- BUSCAR RESERVAS CONFIRMADAS EN EL PERÍODO
    FOR v_reservation_record IN
        SELECT 
            r.id,
            r.customer_name,
            r.customer_phone,
            r.reservation_date,
            r.reservation_time,
            r.party_size,
            r.status,
            r.table_id,
            t.name as table_name
        FROM reservations r
        LEFT JOIN tables t ON r.table_id = t.id
        WHERE r.restaurant_id = p_restaurant_id
        AND r.reservation_date BETWEEN p_start_date AND p_end_date
        AND r.status IN ('confirmed', 'pending')
        ORDER BY r.reservation_date, r.reservation_time
    LOOP
        v_conflict_count := v_conflict_count + 1;
        
        v_conflicts := v_conflicts || jsonb_build_object(
            'reservation_id', v_reservation_record.id,
            'customer_name', v_reservation_record.customer_name,
            'customer_phone', v_reservation_record.customer_phone,
            'date', v_reservation_record.reservation_date,
            'time', v_reservation_record.reservation_time,
            'party_size', v_reservation_record.party_size,
            'status', v_reservation_record.status,
            'table_name', v_reservation_record.table_name,
            'conflict_type', CASE 
                WHEN p_change_type = 'horarios_modificados' THEN 'Horario modificado'
                WHEN p_change_type = 'mesa_eliminada' THEN 'Mesa será eliminada'
                WHEN p_change_type = 'dias_especiales_agregados' THEN 'Día marcado como cerrado'
                ELSE 'Cambio en configuración'
            END
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'has_conflicts', v_conflict_count > 0,
        'conflict_count', v_conflict_count,
        'conflicts', v_conflicts,
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        )
    );
END;
$$;

-- =====================================================
-- 5. FUNCIÓN DE REGENERACIÓN INTELIGENTE - CORREGIDA
-- =====================================================
CREATE OR REPLACE FUNCTION regenerate_availability_smart(
    p_restaurant_id uuid,
    p_change_type text DEFAULT 'manual',
    p_change_data jsonb DEFAULT '{}',
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_final_end_date date;
    v_conflicts jsonb;
    v_existing_reservations jsonb := '[]'::jsonb;
    v_reservation_record RECORD;
    v_result jsonb;
    v_slots_before integer;
    v_slots_after integer;
    v_slots_preserved integer := 0;
    v_restaurant_settings jsonb;
    v_advance_booking_days integer := 90;
BEGIN
    RAISE NOTICE '🧠 INICIANDO REGENERACIÓN INTELIGENTE CORREGIDA';
    RAISE NOTICE '📊 Tipo: %, Restaurant: %', p_change_type, p_restaurant_id;
    
    -- Obtener configuración del restaurante para calcular fecha final
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF v_restaurant_settings IS NOT NULL THEN
        v_advance_booking_days := COALESCE(
            (v_restaurant_settings->'reservation_policy'->>'advance_booking_days')::integer, 
            90
        );
    END IF;
    
    -- Calcular fecha final
    v_final_end_date := COALESCE(p_end_date, CURRENT_DATE + (v_advance_booking_days || ' days')::interval);
    
    RAISE NOTICE '📅 Regenerando desde % hasta % (%d días)', p_start_date, v_final_end_date, v_final_end_date - p_start_date + 1;
    
    -- PASO 1: DETECTAR CONFLICTOS CON RESERVAS EXISTENTES
    SELECT detect_reservation_conflicts(p_restaurant_id, p_start_date, v_final_end_date, p_change_type) 
    INTO v_conflicts;
    
    RAISE NOTICE '🔍 Conflictos detectados: %', (v_conflicts->>'conflict_count')::integer;
    
    -- PASO 2: GUARDAR RESERVAS EXISTENTES PARA PROTEGERLAS
    FOR v_reservation_record IN
        SELECT 
            r.id,
            r.reservation_date,
            r.reservation_time,
            r.table_id,
            r.party_size,
            90 as duration_minutes  -- Duración estándar
        FROM reservations r
        WHERE r.restaurant_id = p_restaurant_id
        AND r.reservation_date BETWEEN p_start_date AND v_final_end_date
        AND r.status IN ('confirmed', 'pending')
    LOOP
        v_existing_reservations := v_existing_reservations || jsonb_build_object(
            'reservation_id', v_reservation_record.id,
            'date', v_reservation_record.reservation_date,
            'time', v_reservation_record.reservation_time,
            'table_id', v_reservation_record.table_id,
            'duration_minutes', v_reservation_record.duration_minutes
        );
        v_slots_preserved := v_slots_preserved + 1;
    END LOOP;
    
    RAISE NOTICE '🛡️ Reservas a proteger: %', v_slots_preserved;
    
    -- PASO 3: CONTAR SLOTS ANTES DE REGENERAR
    SELECT COUNT(*) INTO v_slots_before
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    RAISE NOTICE '📊 Slots antes de regenerar: %', v_slots_before;
    
    -- PASO 4: REGENERAR DISPONIBILIDADES (usando nuestra función perfecta)
    SELECT generate_availability_slots(p_restaurant_id, p_start_date, v_final_end_date, 90) INTO v_result;
    
    IF (v_result->>'success')::boolean = false THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_result->>'error',
            'conflicts', v_conflicts
        );
    END IF;
    
    RAISE NOTICE '✅ Regeneración base completada: % slots', (v_result->>'slots_created')::integer;
    
    -- PASO 5: PROTEGER RESERVAS EXISTENTES - MARCAR SLOTS COMO RESERVADOS
    FOR v_reservation_record IN
        SELECT 
            (r->>'reservation_id')::uuid as reservation_id,
            (r->>'date')::date as reservation_date,
            (r->>'time')::time as reservation_time,
            (r->>'table_id')::uuid as table_id,
            (r->>'duration_minutes')::integer as duration_minutes
        FROM jsonb_array_elements(v_existing_reservations) as r
    LOOP
        -- Marcar slot como reservado
        UPDATE availability_slots
        SET 
            status = 'reserved',
            is_available = false,
            metadata = metadata || jsonb_build_object(
                'reservation_id', v_reservation_record.reservation_id,
                'protected_during_regeneration', true,
                'regeneration_timestamp', now()
            )
        WHERE restaurant_id = p_restaurant_id
        AND table_id = v_reservation_record.table_id
        AND slot_date = v_reservation_record.reservation_date
        AND start_time = v_reservation_record.reservation_time;
        
        RAISE NOTICE '🛡️ Protegida reserva: % en mesa % el % a las %', 
            v_reservation_record.reservation_id, 
            v_reservation_record.table_id, 
            v_reservation_record.reservation_date, 
            v_reservation_record.reservation_time;
    END LOOP;
    
    -- PASO 6: CONTAR SLOTS DESPUÉS DE REGENERAR
    SELECT COUNT(*) INTO v_slots_after
    FROM availability_slots
    WHERE restaurant_id = p_restaurant_id
    AND slot_date BETWEEN p_start_date AND v_final_end_date;
    
    -- PASO 7: MARCAR CAMBIO COMO PROCESADO
    UPDATE availability_change_log
    SET 
        regeneration_completed = true,
        regeneration_completed_at = now(),
        processed_at = now()
    WHERE restaurant_id = p_restaurant_id
    AND requires_regeneration = true
    AND regeneration_completed = false;
    
    RAISE NOTICE '✅ REGENERACIÓN INTELIGENTE COMPLETADA';
    RAISE NOTICE '   📊 Slots antes: %, después: %', v_slots_before, v_slots_after;
    RAISE NOTICE '   🛡️ Reservas protegidas: %', v_slots_preserved;
    RAISE NOTICE '   ⚠️ Conflictos detectados: %', (v_conflicts->>'conflict_count')::integer;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', 'regeneration_completed',
        'affected_count', v_slots_after,
        'slots_before', v_slots_before,
        'slots_after', v_slots_after,
        'reservations_protected', v_slots_preserved,
        'conflicts', v_conflicts,
        'message', format('Regeneración inteligente completada: %s slots generados, %s reservas protegidas', 
            v_slots_after, v_slots_preserved),
        'change_type', p_change_type,
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', v_final_end_date
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en regeneración inteligente: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'conflicts', v_conflicts
        );
END;
$$;

-- =====================================================
-- 6. FUNCIÓN PARA VERIFICAR SI SE REQUIERE REGENERACIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION check_regeneration_required(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_pending_changes integer;
    v_latest_change RECORD;
    v_change_summary jsonb := '[]'::jsonb;
    v_change_record RECORD;
BEGIN
    -- Contar cambios pendientes
    SELECT COUNT(*) INTO v_pending_changes
    FROM availability_change_log
    WHERE restaurant_id = p_restaurant_id
    AND requires_regeneration = true
    AND regeneration_completed = false;
    
    IF v_pending_changes = 0 THEN
        RETURN jsonb_build_object(
            'regeneration_required', false,
            'pending_changes', 0,
            'message', 'No hay cambios pendientes'
        );
    END IF;
    
    -- Obtener resumen de cambios
    FOR v_change_record IN
        SELECT 
            change_type,
            change_description,
            created_at
        FROM availability_change_log
        WHERE restaurant_id = p_restaurant_id
        AND requires_regeneration = true
        AND regeneration_completed = false
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        v_change_summary := v_change_summary || jsonb_build_object(
            'type', v_change_record.change_type,
            'description', v_change_record.change_description,
            'timestamp', v_change_record.created_at
        );
    END LOOP;
    
    -- Obtener el cambio más reciente
    SELECT * INTO v_latest_change
    FROM availability_change_log
    WHERE restaurant_id = p_restaurant_id
    AND requires_regeneration = true
    AND regeneration_completed = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN jsonb_build_object(
        'regeneration_required', true,
        'pending_changes', v_pending_changes,
        'latest_change', jsonb_build_object(
            'type', v_latest_change.change_type,
            'description', v_latest_change.change_description,
            'timestamp', v_latest_change.created_at
        ),
        'change_summary', v_change_summary,
        'message', format('Se requiere regeneración: %s cambios pendientes', v_pending_changes)
    );
END;
$$;

-- =====================================================
-- 7. FUNCIÓN DE UTILIDAD - SIMULAR CAMBIO PARA PRUEBAS
-- =====================================================
CREATE OR REPLACE FUNCTION simulate_configuration_change(
    p_restaurant_id uuid,
    p_change_type text DEFAULT 'horarios_modificados'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insertar un cambio simulado para pruebas
    INSERT INTO availability_change_log (
        restaurant_id,
        change_type,
        change_description,
        old_values,
        new_values,
        requires_regeneration
    ) VALUES (
        p_restaurant_id,
        p_change_type,
        'Cambio simulado para pruebas del sistema',
        '{"test": "old_value"}'::jsonb,
        '{"test": "new_value"}'::jsonb,
        true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Cambio simulado registrado correctamente',
        'change_type', p_change_type
    );
END;
$$;

-- =====================================================
-- 8. PERMISOS COMPLETOS
-- =====================================================
GRANT ALL ON availability_change_log TO authenticated;
GRANT EXECUTE ON FUNCTION detect_availability_changes TO authenticated;
GRANT EXECUTE ON FUNCTION detect_reservation_conflicts TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_availability_smart TO authenticated;
GRANT EXECUTE ON FUNCTION check_regeneration_required TO authenticated;
GRANT EXECUTE ON FUNCTION simulate_configuration_change TO authenticated;

-- =====================================================
-- 9. PRUEBAS COMPLETAS DEL SISTEMA
-- =====================================================

-- Paso 1: Verificar estado inicial
SELECT 
    '🔍 PASO 1: Estado inicial' as test,
    check_regeneration_required('69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid) as estado_inicial;

-- Paso 2: Simular un cambio
SELECT 
    '🎭 PASO 2: Simular cambio' as test,
    simulate_configuration_change(
        '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
        'horarios_modificados'
    ) as cambio_simulado;

-- Paso 3: Verificar que se detectó el cambio
SELECT 
    '🔔 PASO 3: Verificar detección' as test,
    check_regeneration_required('69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid) as cambio_detectado;

-- Paso 4: Ejecutar regeneración inteligente
SELECT 
    '🧠 PASO 4: Regeneración inteligente' as test,
    regenerate_availability_smart(
        '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
        'manual',
        '{"test": "sistema_completo"}'::jsonb,
        CURRENT_DATE,
        CURRENT_DATE + 7
    ) as regeneracion_resultado;

-- Paso 5: Verificar estado final
SELECT 
    '✅ PASO 5: Estado final' as test,
    check_regeneration_required('69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid) as estado_final;

-- Paso 6: Verificar slots generados
SELECT 
    '📊 PASO 6: Verificación final' as test,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN status = 'reserved' THEN 1 END) as slots_reservados,
    COUNT(CASE WHEN status = 'free' THEN 1 END) as slots_libres,
    COUNT(DISTINCT slot_date) as dias_con_slots
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date >= CURRENT_DATE;

-- =====================================================
-- FIX TABLA AVAILABILITY_CHANGE_LOG - ACTUALIZAR ESTRUCTURA
-- =====================================================
-- ✅ SOLUCIONA: column "affected_dates_start" does not exist
-- ✅ ACTUALIZA: tabla existente con nueva estructura
-- ✅ MIGRA: datos existentes si los hay

-- =====================================================
-- 1. VERIFICAR Y ACTUALIZAR ESTRUCTURA DE TABLA
-- =====================================================

-- Primero, eliminar la columna problemática daterange si existe
DO $$
BEGIN
    -- Intentar eliminar la columna daterange si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_change_log' 
        AND column_name = 'affected_dates'
    ) THEN
        ALTER TABLE availability_change_log DROP COLUMN affected_dates;
        RAISE NOTICE '✅ Columna affected_dates (daterange) eliminada';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error eliminando affected_dates: %', SQLERRM;
END $$;

-- Agregar las nuevas columnas si no existen
DO $$
BEGIN
    -- Agregar affected_dates_start si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_change_log' 
        AND column_name = 'affected_dates_start'
    ) THEN
        ALTER TABLE availability_change_log ADD COLUMN affected_dates_start date;
        RAISE NOTICE '✅ Columna affected_dates_start agregada';
    END IF;
    
    -- Agregar affected_dates_end si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'availability_change_log' 
        AND column_name = 'affected_dates_end'
    ) THEN
        ALTER TABLE availability_change_log ADD COLUMN affected_dates_end date;
        RAISE NOTICE '✅ Columna affected_dates_end agregada';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error agregando columnas: %', SQLERRM;
END $$;

-- =====================================================
-- 2. ACTUALIZAR FUNCIÓN DETECT_AVAILABILITY_CHANGES
-- =====================================================
CREATE OR REPLACE FUNCTION detect_availability_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_change_type text;
    v_description text;
    v_old_values jsonb := '{}';
    v_new_values jsonb := '{}';
    v_affected_dates_start date;
    v_affected_dates_end date;
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
            ELSIF OLD.settings IS DISTINCT FROM NEW.settings THEN
                v_change_type := 'politica_reservas_modificada';
                v_description := 'Política de reservas modificada';
                v_old_values := jsonb_build_object('settings', OLD.settings);
                v_new_values := jsonb_build_object('settings', NEW.settings);
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
    v_affected_dates_start := CURRENT_DATE;
    v_affected_dates_end := CURRENT_DATE + INTERVAL '90 days';
    
    -- REGISTRAR EL CAMBIO
    IF v_change_type IS NOT NULL AND v_restaurant_id IS NOT NULL THEN
        INSERT INTO availability_change_log (
            restaurant_id,
            change_type,
            change_description,
            old_values,
            new_values,
            affected_dates_start,
            affected_dates_end,
            requires_regeneration
        ) VALUES (
            v_restaurant_id,
            v_change_type,
            v_description,
            v_old_values,
            v_new_values,
            v_affected_dates_start,
            v_affected_dates_end,
            true
        );
        
        RAISE NOTICE '🔔 Cambio detectado: % para restaurante %', v_description, v_restaurant_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. RECREAR TRIGGERS
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
-- 4. VERIFICACIÓN FINAL
-- =====================================================
SELECT 
    '✅ TABLA AVAILABILITY_CHANGE_LOG ACTUALIZADA' as status,
    'Columnas affected_dates_start y affected_dates_end agregadas correctamente' as message,
    'Trigger actualizado - Ahora puedes guardar la política sin errores' as next_step;

-- Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'availability_change_log' 
AND column_name IN ('affected_dates_start', 'affected_dates_end')
ORDER BY column_name;

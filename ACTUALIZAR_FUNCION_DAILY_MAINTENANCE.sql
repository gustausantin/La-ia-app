-- ========================================
-- ACTUALIZAR FUNCIÓN DAILY MAINTENANCE
-- ========================================
-- Esta actualización corrige la lógica para:
-- 1. Borrar slots PASADOS (< hoy)
-- 2. Borrar slots FUERA DE RANGO (> advance_booking_days)
-- 3. Proteger días con reservas activas
-- 4. Generar nuevo día al final
-- ========================================

DROP FUNCTION IF EXISTS daily_availability_maintenance();

CREATE OR REPLACE FUNCTION daily_availability_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant RECORD;
    v_advance_days INTEGER;
    v_today DATE;
    v_new_day DATE;
    v_slots_deleted INTEGER := 0;
    v_slots_created INTEGER := 0;
    v_restaurants_processed INTEGER := 0;
    v_total_deleted INTEGER := 0;
    v_total_created INTEGER := 0;
    v_errors TEXT[] := '{}';
    v_result jsonb;
BEGIN
    v_today := CURRENT_DATE;
    
    RAISE NOTICE '🕐 [DAILY MAINTENANCE] Iniciando a las %', NOW();
    RAISE NOTICE '📅 Fecha de referencia: %', v_today;
    
    -- Iterar sobre todos los restaurantes activos
    FOR v_restaurant IN 
        SELECT id, name, settings
        FROM restaurants
    LOOP
        BEGIN
            v_restaurants_processed := v_restaurants_processed + 1;
            RAISE NOTICE '';
            RAISE NOTICE '🏪 [%] Procesando restaurante: %', v_restaurants_processed, v_restaurant.name;
            
            -- Obtener configuración de días de anticipación
            v_advance_days := COALESCE(
                (v_restaurant.settings->>'advance_booking_days')::INTEGER,
                30  -- Default: 30 días
            );
            
            RAISE NOTICE '📊 Configuración: % días de anticipación', v_advance_days;
            
            -- ==========================================
            -- PASO 1: LIMPIAR SLOTS LIBRES FUERA DE RANGO
            -- ==========================================
            DECLARE
                v_end_date DATE;
            BEGIN
                v_end_date := v_today + v_advance_days * INTERVAL '1 day';
                
                RAISE NOTICE '🧹 Limpiando slots fuera de rango (hoy: %, límite: %)...', v_today, v_end_date;
                
                -- Borrar slots LIBRES que están:
                -- 1. Antes de hoy (pasados)
                -- 2. Después del límite configurado (fuera de rango)
                DELETE FROM availability_slots
                WHERE restaurant_id = v_restaurant.id
                  AND status = 'free'
                  AND is_available = TRUE
                  AND (
                      slot_date < v_today  -- Pasados
                      OR slot_date > v_end_date  -- Fuera de rango
                  )
                  -- PROTECCIÓN: Solo borrar si el día NO tiene reservas activas
                  AND slot_date NOT IN (
                      SELECT DISTINCT reservation_date
                      FROM reservations
                      WHERE restaurant_id = v_restaurant.id
                        AND reservation_date >= v_today
                        AND status NOT IN ('cancelled', 'completed')
                  );
                
                GET DIAGNOSTICS v_slots_deleted = ROW_COUNT;
                v_total_deleted := v_total_deleted + v_slots_deleted;
                
                RAISE NOTICE '✅ Eliminados % slots libres (pasados + fuera de rango)', v_slots_deleted;
            END;
            
            -- ==========================================
            -- PASO 2: GENERAR NUEVO DÍA AL FINAL
            -- ==========================================
            v_new_day := v_today + v_advance_days * INTERVAL '1 day';
            
            RAISE NOTICE '🆕 Generando nuevo día: %', v_new_day;
            
            -- Verificar si ya existen slots para ese día
            IF EXISTS (
                SELECT 1 FROM availability_slots
                WHERE restaurant_id = v_restaurant.id
                  AND slot_date = v_new_day
            ) THEN
                RAISE NOTICE '⚠️  Ya existen slots para %, saltando generación', v_new_day;
                CONTINUE;
            END IF;
            
            -- Verificar si es un día cerrado manualmente
            IF EXISTS (
                SELECT 1 FROM special_events
                WHERE restaurant_id = v_restaurant.id
                  AND event_date = v_new_day
                  AND is_closed = TRUE
            ) THEN
                RAISE NOTICE '🚫 Día % está cerrado manualmente, saltando', v_new_day;
                CONTINUE;
            END IF;
            
            -- Llamar a la función de generación existente para 1 solo día
            DECLARE
                v_generation_result jsonb;
            BEGIN
                SELECT cleanup_and_regenerate_availability(
                    v_restaurant.id,
                    v_new_day,
                    v_new_day  -- Solo generar este día específico
                ) INTO v_generation_result;
                
                v_slots_created := COALESCE(
                    (v_generation_result->>'slots_created')::INTEGER,
                    0
                );
                
                v_total_created := v_total_created + v_slots_created;
                
                RAISE NOTICE '✅ Creados % slots para el día %', v_slots_created, v_new_day;
                
            EXCEPTION WHEN OTHERS THEN
                v_errors := array_append(v_errors, 
                    format('Restaurant %s: %s', v_restaurant.name, SQLERRM)
                );
                RAISE WARNING '❌ Error generando slots para %: %', v_restaurant.name, SQLERRM;
            END;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := array_append(v_errors, 
                format('Restaurant %s (general): %s', v_restaurant.name, SQLERRM)
            );
            RAISE WARNING '❌ Error procesando restaurante %: %', v_restaurant.name, SQLERRM;
        END;
    END LOOP;
    
    -- ==========================================
    -- RESULTADO FINAL
    -- ==========================================
    v_result := jsonb_build_object(
        'success', TRUE,
        'executed_at', NOW(),
        'date_reference', v_today,
        'restaurants_processed', v_restaurants_processed,
        'total_slots_deleted', v_total_deleted,
        'total_slots_created', v_total_created,
        'errors', v_errors,
        'summary', format(
            'Procesados %s restaurantes. Eliminados %s slots (pasados + fuera de rango). Creados %s slots nuevos.',
            v_restaurants_processed,
            v_total_deleted,
            v_total_created
        )
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 [DAILY MAINTENANCE] Completado';
    RAISE NOTICE '📊 Resumen: % restaurantes, % eliminados, % creados',
        v_restaurants_processed, v_total_deleted, v_total_created;
    
    IF array_length(v_errors, 1) > 0 THEN
        RAISE NOTICE '⚠️  Errores encontrados: %', array_length(v_errors, 1);
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'executed_at', NOW()
    );
END;
$$;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
SELECT 'Función actualizada correctamente' as status;

-- ==========================================
-- PROBAR EJECUCIÓN
-- ==========================================
-- Descomenta para probar:
-- SELECT daily_availability_maintenance();


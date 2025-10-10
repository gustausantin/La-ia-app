-- ========================================
-- ACTUALIZAR FUNCIÓN DAILY MAINTENANCE (CORREGIDO)
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
    v_end_date DATE;
    v_new_day DATE;
    v_slots_deleted INTEGER := 0;
    v_slots_created INTEGER := 0;
    v_restaurants_processed INTEGER := 0;
    v_total_deleted INTEGER := 0;
    v_total_created INTEGER := 0;
    v_errors TEXT[] := '{}';
    v_result jsonb;
    v_generation_result jsonb;
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
                30
            );
            
            -- Calcular fecha límite
            v_end_date := v_today + v_advance_days;
            
            RAISE NOTICE '📊 Configuración: % días (hasta %))', v_advance_days, v_end_date;
            
            -- ==========================================
            -- PASO 1: LIMPIAR SLOTS LIBRES FUERA DE RANGO
            -- ==========================================
            RAISE NOTICE '🧹 Limpiando slots fuera de rango...';
            
            DELETE FROM availability_slots
            WHERE restaurant_id = v_restaurant.id
              AND status = 'free'
              AND is_available = TRUE
              AND (
                  slot_date < v_today  -- Pasados
                  OR slot_date > v_end_date  -- Fuera de rango
              )
              -- PROTECCIÓN: No borrar días con reservas activas
              AND slot_date NOT IN (
                  SELECT DISTINCT reservation_date
                  FROM reservations
                  WHERE restaurant_id = v_restaurant.id
                    AND reservation_date >= v_today
                    AND status NOT IN ('cancelled', 'completed')
              );
            
            GET DIAGNOSTICS v_slots_deleted = ROW_COUNT;
            v_total_deleted := v_total_deleted + v_slots_deleted;
            
            RAISE NOTICE '✅ Eliminados % slots libres', v_slots_deleted;
            
            -- ==========================================
            -- PASO 2: GENERAR NUEVO DÍA AL FINAL
            -- ==========================================
            v_new_day := v_end_date;
            
            RAISE NOTICE '🆕 Verificando día: %', v_new_day;
            
            -- Verificar si ya existen slots para ese día
            IF EXISTS (
                SELECT 1 FROM availability_slots
                WHERE restaurant_id = v_restaurant.id
                  AND slot_date = v_new_day
            ) THEN
                RAISE NOTICE '⚠️  Ya existen slots para %, saltando', v_new_day;
                CONTINUE;
            END IF;
            
            -- Verificar si es un día cerrado manualmente
            IF EXISTS (
                SELECT 1 FROM special_events
                WHERE restaurant_id = v_restaurant.id
                  AND event_date = v_new_day
                  AND is_closed = TRUE
            ) THEN
                RAISE NOTICE '🚫 Día % cerrado manualmente, saltando', v_new_day;
                CONTINUE;
            END IF;
            
            -- Generar slots para el nuevo día
            BEGIN
                SELECT cleanup_and_regenerate_availability(
                    v_restaurant.id,
                    v_new_day,
                    v_new_day
                ) INTO v_generation_result;
                
                v_slots_created := COALESCE(
                    (v_generation_result->>'slots_created')::INTEGER,
                    0
                );
                
                v_total_created := v_total_created + v_slots_created;
                
                RAISE NOTICE '✅ Creados % slots para %', v_slots_created, v_new_day;
                
            EXCEPTION WHEN OTHERS THEN
                v_errors := array_append(v_errors, 
                    format('Restaurant %s: %s', v_restaurant.name, SQLERRM)
                );
                RAISE WARNING '❌ Error generando slots: %', SQLERRM;
            END;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := array_append(v_errors, 
                format('Restaurant %s: %s', v_restaurant.name, SQLERRM)
            );
            RAISE WARNING '❌ Error procesando restaurante: %', SQLERRM;
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
            'Procesados %s restaurantes. Eliminados %s slots. Creados %s slots.',
            v_restaurants_processed,
            v_total_deleted,
            v_total_created
        )
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMPLETADO: % restaurantes, % eliminados, % creados',
        v_restaurants_processed, v_total_deleted, v_total_created;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'executed_at', NOW()
    );
END;
$$;

-- PROBAR
SELECT daily_availability_maintenance();


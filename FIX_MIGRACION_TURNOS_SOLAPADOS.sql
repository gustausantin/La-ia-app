-- =====================================================
-- FIX: MIGRACIÓN CON MANEJO DE TURNOS SOLAPADOS
-- =====================================================

-- PASO 1: Deshabilitar temporalmente la validación de solapamientos
DROP TRIGGER IF EXISTS trigger_validate_shift_overlap ON restaurant_shifts;

-- PASO 2: Función de migración mejorada que maneja solapamientos
CREATE OR REPLACE FUNCTION migrate_operating_hours_to_tables_fixed()
RETURNS JSONB AS $$
DECLARE
    restaurant_record RECORD;
    day_config JSONB;
    shifts_array JSONB;
    shift_record RECORD;
    migrated_restaurants INTEGER := 0;
    migrated_hours INTEGER := 0;
    migrated_shifts INTEGER := 0;
    day_mapping TEXT[] := ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    day_index INTEGER;
    shift_start_time TIME;
    shift_end_time TIME;
    existing_shifts_count INTEGER;
BEGIN
    RAISE NOTICE '🚀 INICIANDO MIGRACIÓN MEJORADA - MANEJO DE SOLAPAMIENTOS';
    
    FOR restaurant_record IN 
        SELECT id, settings 
        FROM restaurants 
        WHERE settings IS NOT NULL 
        AND settings->'operating_hours' IS NOT NULL
    LOOP
        RAISE NOTICE '📍 Migrando restaurante: %', restaurant_record.id;
        migrated_restaurants := migrated_restaurants + 1;
        
        FOR day_index IN 0..6 LOOP
            day_config := restaurant_record.settings->'operating_hours'->day_mapping[day_index + 1];
            
            IF day_config IS NOT NULL THEN
                -- MIGRAR HORARIO GENERAL
                INSERT INTO restaurant_operating_hours (
                    restaurant_id, day_of_week, is_open, open_time, close_time
                ) VALUES (
                    restaurant_record.id, day_index,
                    COALESCE((day_config->>'open')::boolean, true),
                    COALESCE((day_config->>'start')::time, '09:00'::time),
                    COALESCE((day_config->>'end')::time, '22:00'::time)
                ) ON CONFLICT (restaurant_id, day_of_week) DO UPDATE SET
                    is_open = EXCLUDED.is_open,
                    open_time = EXCLUDED.open_time,
                    close_time = EXCLUDED.close_time,
                    updated_at = NOW();
                
                migrated_hours := migrated_hours + 1;
                
                -- MIGRAR TURNOS CON LÓGICA DE DEDUPLICACIÓN
                shifts_array := day_config->'shifts';
                IF shifts_array IS NOT NULL AND jsonb_array_length(shifts_array) > 0 THEN
                    
                    -- Limpiar turnos existentes para este día
                    DELETE FROM restaurant_shifts 
                    WHERE restaurant_id = restaurant_record.id AND day_of_week = day_index;
                    
                    RAISE NOTICE '   📋 Procesando % turnos para día %', 
                        jsonb_array_length(shifts_array), day_mapping[day_index + 1];
                    
                    -- ESTRATEGIA: Solo migrar turnos NO solapados
                    FOR shift_record IN 
                        SELECT * FROM jsonb_array_elements(shifts_array)
                    LOOP
                        BEGIN
                            shift_start_time := (shift_record.value->>'start_time')::time;
                            shift_end_time := (shift_record.value->>'end_time')::time;
                            
                            -- Verificar si este turno se solapa con alguno ya insertado
                            SELECT COUNT(*) INTO existing_shifts_count
                            FROM restaurant_shifts 
                            WHERE restaurant_id = restaurant_record.id 
                            AND day_of_week = day_index
                            AND (shift_start_time, shift_end_time) OVERLAPS (start_time, end_time);
                            
                            IF existing_shifts_count = 0 THEN
                                -- No hay solapamiento, insertar turno
                                INSERT INTO restaurant_shifts (
                                    restaurant_id, day_of_week, name, start_time, end_time, is_active
                                ) VALUES (
                                    restaurant_record.id, day_index,
                                    COALESCE(shift_record.value->>'name', 'Turno'),
                                    shift_start_time, shift_end_time, true
                                );
                                
                                migrated_shifts := migrated_shifts + 1;
                                RAISE NOTICE '     ✅ Turno migrado: % (% - %)', 
                                    COALESCE(shift_record.value->>'name', 'Turno'),
                                    shift_start_time, shift_end_time;
                            ELSE
                                RAISE NOTICE '     ⚠️ Turno solapado omitido: % (% - %)', 
                                    COALESCE(shift_record.value->>'name', 'Turno'),
                                    shift_start_time, shift_end_time;
                            END IF;
                            
                        EXCEPTION WHEN OTHERS THEN
                            RAISE NOTICE '     ❌ Error procesando turno: % - %', 
                                SQLERRM, shift_record.value;
                        END;
                    END LOOP;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA:';
    RAISE NOTICE '   📊 Restaurantes: %', migrated_restaurants;
    RAISE NOTICE '   📅 Horarios: %', migrated_hours;
    RAISE NOTICE '   🕐 Turnos (sin solapamientos): %', migrated_shifts;
    
    RETURN jsonb_build_object(
        'success', true,
        'migrated_restaurants', migrated_restaurants,
        'migrated_hours', migrated_hours,
        'migrated_shifts', migrated_shifts,
        'strategy', 'overlapping_shifts_filtered_out'
    );
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Ejecutar migración mejorada
SELECT migrate_operating_hours_to_tables_fixed();

-- PASO 4: Reactivar validación de solapamientos para futuros turnos
CREATE TRIGGER trigger_validate_shift_overlap
    BEFORE INSERT OR UPDATE ON restaurant_shifts
    FOR EACH ROW EXECUTE FUNCTION validate_shift_overlap();

-- PASO 5: Verificar resultado de la migración
SELECT 
    'VERIFICACION_POST_MIGRACION' as status,
    (SELECT COUNT(*) FROM restaurant_operating_hours) as horarios_migrados,
    (SELECT COUNT(*) FROM restaurant_shifts) as turnos_migrados_sin_solapamientos;

-- PASO 6: Ver los turnos que se migraron exitosamente
SELECT 
    r.name as restaurante,
    CASE roh.day_of_week 
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes' 
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as dia,
    roh.is_open as abierto,
    roh.open_time as apertura,
    roh.close_time as cierre,
    COUNT(rs.id) as turnos_migrados
FROM restaurants r
LEFT JOIN restaurant_operating_hours roh ON r.id = roh.restaurant_id
LEFT JOIN restaurant_shifts rs ON r.id = rs.restaurant_id AND roh.day_of_week = rs.day_of_week
GROUP BY r.id, r.name, roh.day_of_week, roh.is_open, roh.open_time, roh.close_time
ORDER BY r.name, roh.day_of_week;

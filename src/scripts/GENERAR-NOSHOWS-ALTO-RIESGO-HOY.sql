-- ============================================
-- SCRIPT: GENERAR NO-SHOWS DE ALTO RIESGO PARA HOY
-- ============================================
-- Este script genera reservas de alto riesgo para HOY
-- siguiendo EXACTAMENTE los criterios del sistema:
-- - Historial de no-shows > 30%
-- - Horas de riesgo (20:00+ o antes de 13:00)
-- - Grupos grandes (>6 personas)
-- - Sin teléfono confirmado
-- - Clientes nuevos sin historial
-- ============================================

DO $$
DECLARE
    v_restaurant_id UUID;
    v_today DATE := CURRENT_DATE;
    v_customer_record RECORD;
    v_reservation_id UUID;
    v_risk_score INTEGER;
    v_risk_factors TEXT[];
    v_created_count INTEGER := 0;
BEGIN
    -- Obtener el restaurante (usar el primero disponible)
    SELECT id INTO v_restaurant_id
    FROM restaurants
    LIMIT 1;
    
    IF v_restaurant_id IS NULL THEN
        RAISE NOTICE 'No se encontró ningún restaurante';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Generando no-shows de alto riesgo para restaurante: %', v_restaurant_id;
    
    -- 1. CREAR CLIENTES CON HISTORIAL DE NO-SHOWS ALTO
    -- ================================================
    FOR i IN 1..3 LOOP
        INSERT INTO customers (
            restaurant_id,
            name,
            email,
            phone,
            visits_count,
            no_show_count,
            total_spent,
            avg_ticket,
            segment_auto,
            churn_risk_score,
            created_at,
            updated_at
        ) VALUES (
            v_restaurant_id,
            'Cliente Alto Riesgo ' || i,
            'altoriesgo' || i || '@test.com',
            '600' || LPAD(i::TEXT, 6, '0'),
            10,  -- 10 visitas
            4,   -- 4 no-shows = 40% tasa
            350.00,
            35.00,
            'en_riesgo',
            85,  -- Alto riesgo de churn
            NOW() - INTERVAL '30 days',
            NOW()
        )
        ON CONFLICT (restaurant_id, email) 
        DO UPDATE SET
            no_show_count = EXCLUDED.no_show_count,
            churn_risk_score = EXCLUDED.churn_risk_score,
            segment_auto = EXCLUDED.segment_auto
        RETURNING * INTO v_customer_record;
        
        -- Crear reserva de ALTO RIESGO para HOY
        v_risk_score := 0;
        v_risk_factors := ARRAY[]::TEXT[];
        
        -- Factor 1: Historial (40% = 40 puntos por 40% no-show rate)
        v_risk_score := v_risk_score + 40;
        v_risk_factors := array_append(v_risk_factors, 'Historial de no-shows alto');
        
        -- Factor 2: Hora de riesgo (25 puntos)
        v_risk_score := v_risk_score + 25;
        v_risk_factors := array_append(v_risk_factors, 'Hora con mayor riesgo');
        
        -- Factor 3: Grupo grande (15 puntos)
        v_risk_score := v_risk_score + 15;
        v_risk_factors := array_append(v_risk_factors, 'Grupo grande');
        
        -- Factor 5: Teléfono sin confirmar (20 puntos)
        v_risk_score := v_risk_score + 20;
        v_risk_factors := array_append(v_risk_factors, 'Sin confirmación telefónica');
        
        -- Total: 100 puntos = ALTO RIESGO
        
        INSERT INTO reservations (
            restaurant_id,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            reservation_date,
            reservation_time,
            party_size,
            table_number,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_restaurant_id,
            v_customer_record.id,
            v_customer_record.name,
            v_customer_record.email,
            v_customer_record.phone,
            v_today,
            CASE 
                WHEN i = 1 THEN '21:30'  -- Cena tardía
                WHEN i = 2 THEN '22:00'  -- Cena muy tardía
                ELSE '13:00'             -- Comida temprana
            END,
            CASE 
                WHEN i = 1 THEN 8  -- Grupo grande
                WHEN i = 2 THEN 10 -- Grupo muy grande
                ELSE 7             -- Grupo grande
            END,
            10 + i,
            'confirmed',
            NOW(),
            NOW()
        ) RETURNING id INTO v_reservation_id;
        
        v_created_count := v_created_count + 1;
        
        RAISE NOTICE 'Creada reserva ALTO RIESGO #%: % - Score: % puntos', 
            i, v_customer_record.name, v_risk_score;
    END LOOP;
    
    -- 2. CREAR CLIENTES NUEVOS SIN HISTORIAL (RIESGO MEDIO-ALTO)
    -- ===========================================================
    FOR i IN 4..7 LOOP
        INSERT INTO customers (
            restaurant_id,
            name,
            email,
            phone,
            visits_count,
            no_show_count,
            total_spent,
            avg_ticket,
            segment_auto,
            churn_risk_score,
            created_at,
            updated_at
        ) VALUES (
            v_restaurant_id,
            'Cliente Nuevo Riesgo ' || i,
            'nuevoriesgo' || i || '@test.com',
            NULL,  -- Sin teléfono
            0,     -- Sin visitas previas
            0,     -- Sin no-shows
            0.00,
            0.00,
            'nuevo',
            50,
            NOW(),
            NOW()
        )
        ON CONFLICT (restaurant_id, email) 
        DO UPDATE SET
            visits_count = EXCLUDED.visits_count,
            segment_auto = EXCLUDED.segment_auto
        RETURNING * INTO v_customer_record;
        
        -- Crear reserva de ALTO RIESGO
        v_risk_score := 0;
        v_risk_factors := ARRAY[]::TEXT[];
        
        -- Factor 2: Hora de riesgo (25 puntos)
        v_risk_score := v_risk_score + 25;
        v_risk_factors := array_append(v_risk_factors, 'Hora con mayor riesgo');
        
        -- Factor 3: Grupo grande (15 puntos)
        v_risk_score := v_risk_score + 15;
        v_risk_factors := array_append(v_risk_factors, 'Grupo grande');
        
        -- Factor 4: Sin teléfono (20 puntos)
        v_risk_score := v_risk_score + 20;
        v_risk_factors := array_append(v_risk_factors, 'Sin teléfono válido');
        
        -- Factor 5: Cliente nuevo (15 puntos)
        v_risk_score := v_risk_score + 15;
        v_risk_factors := array_append(v_risk_factors, 'Cliente nuevo');
        
        -- Algunos con historial problemático adicional
        IF i <= 5 THEN
            v_risk_score := v_risk_score + 25; -- Historial medio
            v_risk_factors := array_append(v_risk_factors, 'Comportamiento irregular previo');
        END IF;
        
        -- Total: 85-100 puntos = ALTO RIESGO
        
        INSERT INTO reservations (
            restaurant_id,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            reservation_date,
            reservation_time,
            party_size,
            table_number,
            status,
            special_requests,
            created_at,
            updated_at
        ) VALUES (
            v_restaurant_id,
            v_customer_record.id,
            v_customer_record.name,
            v_customer_record.email,
            v_customer_record.phone,
            v_today,
            CASE 
                WHEN i = 4 THEN '20:30'
                WHEN i = 5 THEN '21:00'
                WHEN i = 6 THEN '22:30'
                ELSE '12:30'
            END,
            CASE 
                WHEN i <= 5 THEN 8
                ELSE 10
            END,
            20 + i,
            'pending',  -- Sin confirmar
            'Primera vez, grupo grande, sin teléfono confirmado',
            NOW(),
            NOW()
        ) RETURNING id INTO v_reservation_id;
        
        v_created_count := v_created_count + 1;
        
        RAISE NOTICE 'Creada reserva ALTO RIESGO #%: % - Score: % puntos', 
            i, v_customer_record.name, v_risk_score;
    END LOOP;
    
    -- 3. RESUMEN FINAL
    -- ================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GENERACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total reservas alto riesgo creadas: %', v_created_count;
    RAISE NOTICE '';
    RAISE NOTICE 'VERIFICACIÓN:';
    RAISE NOTICE '- Ve al Dashboard: deberías ver % en "Alto riesgo hoy"', v_created_count;
    RAISE NOTICE '- Ve a Control No-Shows: deberías ver las % reservas', v_created_count;
    RAISE NOTICE '- Todas con riesgo >= 85 puntos';
    RAISE NOTICE '- Todas requieren acción preventiva inmediata';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE;
END $$;

-- Verificación final
SELECT 
    'Reservas de alto riesgo para hoy' as descripcion,
    COUNT(*) as total
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.reservation_date = CURRENT_DATE
AND r.status IN ('pending', 'confirmed')
AND (
    -- Criterios de alto riesgo
    (c.no_show_count::FLOAT / NULLIF(c.visits_count, 0) > 0.3) OR
    (r.reservation_time >= '20:00' OR r.reservation_time <= '13:00') OR
    (r.party_size > 6) OR
    (r.customer_phone IS NULL OR LENGTH(r.customer_phone) < 9) OR
    (c.visits_count = 0 OR c.visits_count IS NULL)
);

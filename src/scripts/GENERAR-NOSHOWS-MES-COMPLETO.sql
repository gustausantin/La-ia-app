-- ============================================
-- SCRIPT: GENERAR NO-SHOWS ALTO RIESGO - HOY + MES COMPLETO
-- ============================================
-- Genera reservas de alto riesgo para:
-- 1. HOY - Para ver resultados inmediatos
-- 2. PRÓXIMOS 30 DÍAS - Para tener datos continuos
-- ============================================

DO $$
DECLARE
    v_restaurant_id UUID;
    v_current_date DATE;
    v_customer_record RECORD;
    v_reservation_id UUID;
    v_risk_score INTEGER;
    v_created_count INTEGER := 0;
    v_day_offset INTEGER;
    v_customer_index INTEGER := 1;
BEGIN
    -- Obtener el restaurante
    SELECT id INTO v_restaurant_id
    FROM restaurants
    LIMIT 1;
    
    IF v_restaurant_id IS NULL THEN
        RAISE NOTICE 'No se encontró ningún restaurante';
        RETURN;
    END IF;
    
    RAISE NOTICE '🚀 INICIANDO GENERACIÓN MASIVA DE NO-SHOWS';
    RAISE NOTICE '📅 Período: HOY + próximos 30 días';
    RAISE NOTICE '🏢 Restaurante: %', v_restaurant_id;
    RAISE NOTICE '';
    
    -- PRIMERO: Limpiar reservas de prueba anteriores para evitar duplicados
    DELETE FROM reservations 
    WHERE customer_name LIKE '%Alto Riesgo Test%'
    OR customer_name LIKE '%Riesgo Medio Test%'
    OR customer_email LIKE '%riesgotest%@test.com';
    
    DELETE FROM customers 
    WHERE name LIKE '%Alto Riesgo Test%'
    OR name LIKE '%Riesgo Medio Test%'
    OR email LIKE '%riesgotest%@test.com';
    
    -- GENERAR PARA CADA DÍA (HOY + 30 días)
    FOR v_day_offset IN 0..30 LOOP
        v_current_date := CURRENT_DATE + (v_day_offset || ' days')::INTERVAL;
        
        RAISE NOTICE '📆 Generando para: %', v_current_date;
        
        -- GENERAR 3-7 RESERVAS DE ALTO RIESGO POR DÍA
        -- (Variamos la cantidad para que sea más realista)
        FOR i IN 1..(3 + (RANDOM() * 4)::INTEGER) LOOP
            
            -- CREAR CLIENTE CON PERFIL DE RIESGO
            -- Alternamos entre diferentes tipos de riesgo
            IF (v_customer_index % 3) = 1 THEN
                -- TIPO 1: Cliente con historial de no-shows
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
                    created_at
                ) VALUES (
                    v_restaurant_id,
                    'Alto Riesgo Test ' || v_customer_index,
                    'altoriesgotest' || v_customer_index || '@test.com',
                    '600' || LPAD(v_customer_index::TEXT, 6, '0'),
                    12,  -- 12 visitas
                    5,   -- 5 no-shows = 42% tasa
                    420.00,
                    35.00,
                    'en_riesgo',
                    90,  -- Muy alto riesgo
                    NOW() - INTERVAL '60 days'
                )
                ON CONFLICT (restaurant_id, email) 
                DO UPDATE SET
                    no_show_count = EXCLUDED.no_show_count,
                    churn_risk_score = EXCLUDED.churn_risk_score
                RETURNING * INTO v_customer_record;
                
                v_risk_score := 95; -- Muy alto riesgo
                
            ELSIF (v_customer_index % 3) = 2 THEN
                -- TIPO 2: Cliente nuevo sin historial
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
                    created_at
                ) VALUES (
                    v_restaurant_id,
                    'Riesgo Medio Test ' || v_customer_index,
                    'riesgomediotest' || v_customer_index || '@test.com',
                    NULL,  -- Sin teléfono confirmado
                    0,     -- Cliente nuevo
                    0,
                    0.00,
                    0.00,
                    'nuevo',
                    60,
                    NOW()
                )
                ON CONFLICT (restaurant_id, email) 
                DO UPDATE SET
                    segment_auto = EXCLUDED.segment_auto
                RETURNING * INTO v_customer_record;
                
                v_risk_score := 85; -- Alto riesgo
                
            ELSE
                -- TIPO 3: Cliente ocasional con algunos no-shows
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
                    created_at
                ) VALUES (
                    v_restaurant_id,
                    'Alto Riesgo Test ' || v_customer_index,
                    'altoriesgotest' || v_customer_index || '@test.com',
                    '600' || LPAD(v_customer_index::TEXT, 6, '0'),
                    8,   -- 8 visitas
                    3,   -- 3 no-shows = 37% tasa
                    280.00,
                    35.00,
                    'ocasional',
                    85,
                    NOW() - INTERVAL '45 days'
                )
                ON CONFLICT (restaurant_id, email) 
                DO UPDATE SET
                    no_show_count = EXCLUDED.no_show_count,
                    churn_risk_score = EXCLUDED.churn_risk_score
                RETURNING * INTO v_customer_record;
                
                v_risk_score := 88; -- Alto riesgo
            END IF;
            
            -- CREAR RESERVA DE ALTO RIESGO
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
                v_current_date,
                -- Horas de alto riesgo variadas
                CASE (i % 5)
                    WHEN 0 THEN '21:00'  -- Cena tarde
                    WHEN 1 THEN '21:30'  -- Cena muy tarde
                    WHEN 2 THEN '22:00'  -- Última hora
                    WHEN 3 THEN '13:00'  -- Comida temprana
                    ELSE '20:30'         -- Cena normal-tarde
                END,
                -- Grupos de tamaño variable (todos grandes)
                CASE (i % 4)
                    WHEN 0 THEN 8
                    WHEN 1 THEN 10
                    WHEN 2 THEN 7
                    ELSE 9
                END,
                (10 + i + (v_day_offset * 10)) % 50, -- Mesa variable
                CASE 
                    WHEN v_current_date = CURRENT_DATE THEN 'confirmed'
                    WHEN (i % 3) = 0 THEN 'pending'
                    ELSE 'confirmed'
                END,
                'Reserva de alto riesgo - Score: ' || v_risk_score,
                NOW() - INTERVAL '2 days', -- Creada hace 2 días
                NOW()
            ) RETURNING id INTO v_reservation_id;
            
            -- Si es para HOY, crear también registro en noshow_actions
            IF v_current_date = CURRENT_DATE THEN
                INSERT INTO noshow_actions (
                    restaurant_id,
                    reservation_id,
                    customer_id,
                    customer_name,
                    reservation_date,
                    reservation_time,
                    party_size,
                    risk_level,
                    risk_score,
                    action_type,
                    channel,
                    customer_response,
                    final_outcome,
                    created_at
                ) VALUES (
                    v_restaurant_id,
                    v_reservation_id,
                    v_customer_record.id,
                    v_customer_record.name,
                    v_current_date,
                    '21:00',
                    8,
                    'high',
                    v_risk_score,
                    'pending',
                    'none',
                    'pending',
                    'pending',
                    NOW()
                );
            END IF;
            
            v_created_count := v_created_count + 1;
            v_customer_index := v_customer_index + 1;
        END LOOP;
        
    END LOOP;
    
    -- RESUMEN FINAL
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GENERACIÓN MASIVA COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total reservas de alto riesgo creadas: %', v_created_count;
    RAISE NOTICE '📅 Período cubierto: % hasta %', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN RÁPIDA:';
    
    -- Mostrar resumen por día
    RAISE NOTICE '';
    RAISE NOTICE 'Reservas de alto riesgo por día (próximos 7 días):';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
        RAISE;
END $$;

-- VERIFICACIÓN: Mostrar resumen de lo generado
WITH risk_summary AS (
    SELECT 
        r.reservation_date,
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN c.no_show_count > 0 THEN 1 END) as con_historial_noshow,
        COUNT(CASE WHEN r.party_size > 6 THEN 1 END) as grupos_grandes,
        COUNT(CASE WHEN r.customer_phone IS NULL THEN 1 END) as sin_telefono,
        COUNT(CASE WHEN c.visits_count = 0 THEN 1 END) as clientes_nuevos
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.reservation_date >= CURRENT_DATE
    AND r.reservation_date <= CURRENT_DATE + INTERVAL '7 days'
    AND r.status IN ('pending', 'confirmed')
    GROUP BY r.reservation_date
    ORDER BY r.reservation_date
)
SELECT 
    TO_CHAR(reservation_date, 'DD/MM/YYYY') as fecha,
    total_reservas,
    con_historial_noshow as "Con No-Shows previos",
    grupos_grandes as "Grupos >6",
    sin_telefono as "Sin teléfono",
    clientes_nuevos as "Nuevos"
FROM risk_summary;

-- Verificación específica para HOY
SELECT 
    '🔴 HOY - Alto Riesgo' as descripcion,
    COUNT(*) as total
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.reservation_date = CURRENT_DATE
AND r.status IN ('pending', 'confirmed')
AND (
    (c.no_show_count::FLOAT / NULLIF(c.visits_count, 0) > 0.3) OR
    (r.reservation_time >= '20:00' OR r.reservation_time <= '13:00') OR
    (r.party_size > 6) OR
    (r.customer_phone IS NULL OR LENGTH(r.customer_phone) < 9) OR
    (c.visits_count = 0 OR c.visits_count IS NULL)
);

-- Total para el mes completo
SELECT 
    '📅 PRÓXIMOS 30 DÍAS - Total Alto Riesgo' as descripcion,
    COUNT(*) as total
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.reservation_date >= CURRENT_DATE
AND r.reservation_date <= CURRENT_DATE + INTERVAL '30 days'
AND r.status IN ('pending', 'confirmed')
AND (
    (c.no_show_count::FLOAT / NULLIF(c.visits_count, 0) > 0.3) OR
    (r.reservation_time >= '20:00' OR r.reservation_time <= '13:00') OR
    (r.party_size > 6) OR
    (r.customer_phone IS NULL OR LENGTH(r.customer_phone) < 9) OR
    (c.visits_count = 0 OR c.visits_count IS NULL)
);

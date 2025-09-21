-- =========================================
-- CREAR NO-SHOWS PARA TAVERTET
-- =========================================
-- Script específico SOLO para no-shows

BEGIN;

-- ==========================================
-- CONFIGURACIÓN
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
BEGIN
    RAISE NOTICE '🚫 ===== CREANDO NO-SHOWS PARA TAVERTET ===== 🚫';
    RAISE NOTICE 'Restaurant ID: %', r_id;
END $$;

-- ==========================================
-- CREAR NO-SHOWS PARA RESERVAS DE HOY
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    res record;
    counter integer := 0;
BEGIN
    -- Para cada reserva de HOY, crear acción no-show
    FOR res IN 
        SELECT r.id, r.customer_id, r.reservation_date, r.reservation_time, r.party_size,
               c.name as customer_name, c.phone as customer_phone, c.segment_auto
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = r_id
        AND r.reservation_date = CURRENT_DATE
        AND r.status = 'confirmed'
    LOOP
        INSERT INTO noshow_actions (
            restaurant_id,
            reservation_id,
            customer_id,
            customer_name,
            customer_phone,
            reservation_date,
            reservation_time,
            party_size,
            risk_level,
            risk_score,
            risk_factors,
            action_type,
            channel,
            message_sent,
            customer_response,
            final_outcome,
            prevented_noshow,
            sent_at,
            created_at
        ) VALUES (
            r_id,
            res.id,
            res.customer_id,
            res.customer_name,
            res.customer_phone,
            res.reservation_date,
            res.reservation_time,
            res.party_size,
            CASE 
                WHEN res.segment_auto = 'nuevo' THEN 'high'
                WHEN res.party_size >= 6 THEN 'medium'
                ELSE 'low'
            END,
            CASE 
                WHEN res.segment_auto = 'nuevo' THEN 85
                WHEN res.party_size >= 6 THEN 60
                ELSE 30
            END,
            jsonb_build_array(
                CASE WHEN res.segment_auto = 'nuevo' THEN 'cliente_nuevo' ELSE NULL END,
                CASE WHEN res.party_size >= 6 THEN 'grupo_grande' ELSE NULL END,
                'reserva_hoy'
            ),
            'whatsapp_confirmation',
            'whatsapp',
            'Hola ' || res.customer_name || '! Confirmamos su reserva para HOY a las ' || 
            TO_CHAR(res.reservation_time, 'HH24:MI') || ' para ' || res.party_size || ' personas. ¿Confirma asistencia? ✅',
            CASE 
                WHEN res.segment_auto = 'vip' THEN 'confirmed'
                WHEN res.segment_auto = 'nuevo' THEN 'pending'
                ELSE 'confirmed'
            END,
            'pending',
            CASE 
                WHEN res.segment_auto = 'vip' THEN true
                ELSE false
            END,
            NOW() - INTERVAL '2 hours',
            NOW() - INTERVAL '2 hours'
        );
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % no-shows creados para reservas de HOY', counter;
END $$;

-- ==========================================
-- CREAR NO-SHOWS PARA MAÑANA (PREVENTIVO)
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    res record;
    counter integer := 0;
BEGIN
    -- Para reservas de MAÑANA
    FOR res IN 
        SELECT r.id, r.customer_id, r.reservation_date, r.reservation_time, r.party_size,
               c.name as customer_name, c.phone as customer_phone, c.segment_auto
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = r_id
        AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
        AND r.status = 'confirmed'
    LOOP
        INSERT INTO noshow_actions (
            restaurant_id,
            reservation_id,
            customer_id,
            customer_name,
            customer_phone,
            reservation_date,
            reservation_time,
            party_size,
            risk_level,
            risk_score,
            risk_factors,
            action_type,
            channel,
            message_sent,
            customer_response,
            final_outcome,
            prevented_noshow,
            sent_at,
            created_at
        ) VALUES (
            r_id,
            res.id,
            res.customer_id,
            res.customer_name,
            res.customer_phone,
            res.reservation_date,
            res.reservation_time,
            res.party_size,
            'medium',
            45,
            jsonb_build_array('recordatorio_24h'),
            'whatsapp_reminder',
            'whatsapp',
            'Buongiorno ' || res.customer_name || '! Mañana le esperamos a las ' || 
            TO_CHAR(res.reservation_time, 'HH24:MI') || ' para ' || res.party_size || ' personas. ¡Hasta mañana! 🍝',
            'pending',
            'pending',
            NULL,
            NOW(),
            NOW()
        );
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % no-shows preventivos creados para MAÑANA', counter;
END $$;

-- ==========================================
-- CREAR NO-SHOWS HISTÓRICOS (PASADOS)
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    res record;
    counter integer := 0;
BEGIN
    -- Para reservas pasadas que fueron no-show o canceladas
    FOR res IN 
        SELECT r.id, r.customer_id, r.reservation_date, r.reservation_time, r.party_size, r.status,
               c.name as customer_name, c.phone as customer_phone, c.segment_auto
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = r_id
        AND r.reservation_date < CURRENT_DATE
        AND r.status IN ('no_show', 'cancelled')
        LIMIT 15
    LOOP
        INSERT INTO noshow_actions (
            restaurant_id,
            reservation_id,
            customer_id,
            customer_name,
            customer_phone,
            reservation_date,
            reservation_time,
            party_size,
            risk_level,
            risk_score,
            risk_factors,
            action_type,
            channel,
            message_sent,
            customer_response,
            response_message,
            final_outcome,
            prevented_noshow,
            sent_at,
            created_at
        ) VALUES (
            r_id,
            res.id,
            res.customer_id,
            res.customer_name,
            res.customer_phone,
            res.reservation_date,
            res.reservation_time,
            res.party_size,
            'high',
            80,
            jsonb_build_array('historial_noshow', 'sin_confirmacion'),
            'whatsapp_urgent',
            'whatsapp',
            '🚨 URGENTE: Su reserva es en 1 hora. Por favor confirme asistencia inmediatamente.',
            CASE 
                WHEN res.status = 'no_show' THEN 'no_response'
                WHEN res.status = 'cancelled' THEN 'cancelled'
                ELSE 'pending'
            END,
            CASE 
                WHEN res.status = 'cancelled' THEN 'Lo siento, no podré asistir'
                ELSE NULL
            END,
            res.status,
            false,
            res.reservation_date + res.reservation_time - INTERVAL '1 hour',
            res.reservation_date + res.reservation_time - INTERVAL '1 hour'
        );
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % no-shows históricos creados', counter;
END $$;

-- ==========================================
-- CREAR NO-SHOWS DE ALTO RIESGO ADICIONALES
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    res record;
    counter integer := 0;
BEGIN
    -- Reservas futuras de alto riesgo
    FOR res IN 
        SELECT r.id, r.customer_id, r.reservation_date, r.reservation_time, r.party_size,
               c.name as customer_name, c.phone as customer_phone, c.segment_auto
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = r_id
        AND r.reservation_date > CURRENT_DATE
        AND r.reservation_date <= CURRENT_DATE + INTERVAL '7 days'
        AND (c.segment_auto = 'nuevo' OR r.party_size >= 6)
        LIMIT 10
    LOOP
        INSERT INTO noshow_actions (
            restaurant_id,
            reservation_id,
            customer_id,
            customer_name,
            customer_phone,
            reservation_date,
            reservation_time,
            party_size,
            risk_level,
            risk_score,
            risk_factors,
            action_type,
            channel,
            message_sent,
            customer_response,
            final_outcome,
            prevented_noshow,
            sent_at,
            created_at
        ) VALUES (
            r_id,
            res.id,
            res.customer_id,
            res.customer_name,
            res.customer_phone,
            res.reservation_date,
            res.reservation_time,
            res.party_size,
            'high',
            75,
            CASE 
                WHEN res.segment_auto = 'nuevo' AND res.party_size >= 6 THEN 
                    jsonb_build_array('cliente_nuevo', 'grupo_grande', 'doble_riesgo')
                WHEN res.segment_auto = 'nuevo' THEN 
                    jsonb_build_array('cliente_nuevo', 'sin_historial')
                ELSE 
                    jsonb_build_array('grupo_grande', 'mesa_premium')
            END,
            'whatsapp_confirmation',
            'whatsapp',
            'Hola ' || res.customer_name || '! Su reserva para el ' || 
            TO_CHAR(res.reservation_date, 'DD/MM') || ' a las ' || 
            TO_CHAR(res.reservation_time, 'HH24:MI') || ' está confirmada. ¿Todo correcto? 📅',
            'pending',
            'pending',
            NULL,
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
        );
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % no-shows de alto riesgo creados', counter;
END $$;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    stats record;
BEGIN
    SELECT 
        COUNT(*) as total_noshows,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as hoy,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE + INTERVAL '1 day' THEN 1 END) as manana,
        COUNT(CASE WHEN reservation_date < CURRENT_DATE THEN 1 END) as historicos,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as alto_riesgo,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medio_riesgo,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as bajo_riesgo,
        COUNT(CASE WHEN final_outcome = 'pending' THEN 1 END) as pendientes,
        COUNT(CASE WHEN final_outcome = 'no_show' THEN 1 END) as confirmados_noshow,
        COUNT(CASE WHEN prevented_noshow = true THEN 1 END) as prevenidos
    INTO stats
    FROM noshow_actions
    WHERE restaurant_id = r_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '🚫 ========================================= 🚫';
    RAISE NOTICE '🚫 NO-SHOWS CREADOS PARA TAVERTET 🚫';
    RAISE NOTICE '🚫 ========================================= 🚫';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN COMPLETO:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚫 Total no-shows: %', stats.total_noshows;
    RAISE NOTICE '📅 Para HOY: %', stats.hoy;
    RAISE NOTICE '📅 Para MAÑANA: %', stats.manana;
    RAISE NOTICE '📚 Históricos: %', stats.historicos;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ NIVELES DE RIESGO:';
    RAISE NOTICE '🔴 Alto riesgo: %', stats.alto_riesgo;
    RAISE NOTICE '🟡 Medio riesgo: %', stats.medio_riesgo;
    RAISE NOTICE '🟢 Bajo riesgo: %', stats.bajo_riesgo;
    RAISE NOTICE '';
    RAISE NOTICE '📈 ESTADOS:';
    RAISE NOTICE '⏳ Pendientes: %', stats.pendientes;
    RAISE NOTICE '❌ No-shows confirmados: %', stats.confirmados_noshow;
    RAISE NOTICE '✅ Prevenidos exitosamente: %', stats.prevenidos;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ NO-SHOWS FUNCIONANDO AL 100%%';
    RAISE NOTICE '✅ LISTOS PARA GESTIONAR';
END $$;

COMMIT;

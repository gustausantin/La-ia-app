-- ====================================
-- FUNCIÓN RPC: Análisis de No-Shows por Cliente
-- Fecha: 19 Septiembre 2025
-- Objetivo: Obtener estadísticas de no-shows para algoritmo predictivo
-- ====================================

-- Función para obtener estadísticas de no-shows por cliente
CREATE OR REPLACE FUNCTION get_customer_noshow_stats(
    p_restaurant_id uuid
)
RETURNS TABLE (
    customer_id uuid,
    customer_name varchar,
    total_reservations bigint,
    total_noshows bigint,
    no_show_rate numeric,
    last_visit_date date,
    days_since_last_visit integer,
    avg_party_size numeric,
    preferred_times text[],
    total_spent numeric,
    risk_indicators jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        SELECT 
            r.customer_id,
            c.name as customer_name,
            COUNT(*) as total_reservations,
            COUNT(*) FILTER (WHERE r.status = 'noshow') as total_noshows,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(COUNT(*) FILTER (WHERE r.status = 'noshow')::numeric / COUNT(*)::numeric, 3)
                ELSE 0
            END as no_show_rate,
            MAX(r.reservation_date) as last_visit_date,
            CASE 
                WHEN MAX(r.reservation_date) IS NOT NULL THEN
                    CURRENT_DATE - MAX(r.reservation_date)
                ELSE 0
            END as days_since_last_visit,
            ROUND(AVG(r.party_size), 1) as avg_party_size,
            ARRAY_AGG(DISTINCT r.reservation_time ORDER BY r.reservation_time) as preferred_times,
            COALESCE(SUM(r.spend_amount), 0) as total_spent
        FROM reservations r
        LEFT JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = p_restaurant_id
        AND r.customer_id IS NOT NULL
        AND r.created_at >= CURRENT_DATE - INTERVAL '12 months' -- Último año
        GROUP BY r.customer_id, c.name
        HAVING COUNT(*) >= 2 -- Solo clientes con al menos 2 reservas
    )
    SELECT 
        cs.customer_id,
        cs.customer_name,
        cs.total_reservations,
        cs.total_noshows,
        cs.no_show_rate,
        cs.last_visit_date,
        cs.days_since_last_visit,
        cs.avg_party_size,
        cs.preferred_times,
        cs.total_spent,
        -- Indicadores de riesgo calculados
        jsonb_build_object(
            'high_noshow_rate', cs.no_show_rate > 0.3,
            'inactive_customer', cs.days_since_last_visit > 90,
            'irregular_visitor', cs.total_reservations < 5 AND cs.days_since_last_visit > 30,
            'large_party_preference', cs.avg_party_size > 6,
            'low_spender', cs.total_spent < 100,
            'risk_score', LEAST(100, 
                (cs.no_show_rate * 40) + 
                (CASE WHEN cs.days_since_last_visit > 180 THEN 25 
                      WHEN cs.days_since_last_visit > 90 THEN 15 ELSE 0 END) +
                (CASE WHEN cs.avg_party_size > 6 THEN 10 ELSE 0 END) +
                (CASE WHEN cs.total_spent < 50 THEN 15 ELSE 0 END)
            )
        ) as risk_indicators
    FROM customer_stats cs
    ORDER BY cs.no_show_rate DESC, cs.days_since_last_visit DESC;
END;
$$;

-- Función para obtener métricas generales de no-shows del restaurante
CREATE OR REPLACE FUNCTION get_restaurant_noshow_metrics(
    p_restaurant_id uuid,
    p_days_back integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    total_reservations integer;
    total_noshows integer;
    noshow_rate numeric;
    trend_data jsonb;
BEGIN
    -- Métricas principales
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'noshow'),
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(COUNT(*) FILTER (WHERE status = 'noshow')::numeric / COUNT(*)::numeric * 100, 2)
            ELSE 0
        END
    INTO total_reservations, total_noshows, noshow_rate
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= CURRENT_DATE - INTERVAL '1 day' * p_days_back;

    -- Tendencia por día de la semana
    WITH weekly_stats AS (
        SELECT 
            EXTRACT(DOW FROM reservation_date) as day_of_week,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'noshow') as noshows,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(COUNT(*) FILTER (WHERE status = 'noshow')::numeric / COUNT(*)::numeric * 100, 1)
                ELSE 0
            END as rate
        FROM reservations
        WHERE restaurant_id = p_restaurant_id
        AND reservation_date >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
        GROUP BY EXTRACT(DOW FROM reservation_date)
    )
    SELECT jsonb_object_agg(
        CASE day_of_week
            WHEN 0 THEN 'domingo'
            WHEN 1 THEN 'lunes'
            WHEN 2 THEN 'martes'
            WHEN 3 THEN 'miercoles'
            WHEN 4 THEN 'jueves'
            WHEN 5 THEN 'viernes'
            WHEN 6 THEN 'sabado'
        END,
        jsonb_build_object('total', total, 'noshows', noshows, 'rate', rate)
    )
    INTO trend_data
    FROM weekly_stats;

    -- Construir resultado final
    result := jsonb_build_object(
        'period_days', p_days_back,
        'total_reservations', total_reservations,
        'total_noshows', total_noshows,
        'noshow_rate', noshow_rate,
        'weekly_trend', COALESCE(trend_data, '{}'::jsonb),
        'risk_level', 
            CASE 
                WHEN noshow_rate > 20 THEN 'high'
                WHEN noshow_rate > 10 THEN 'medium'
                ELSE 'low'
            END,
        'generated_at', NOW()
    );

    RETURN result;
END;
$$;

-- Función para marcar automáticamente no-shows basado en tiempo
CREATE OR REPLACE FUNCTION auto_mark_noshows()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    marked_count integer := 0;
BEGIN
    -- Marcar como no-show las reservas que tienen más de 15 minutos de retraso
    -- y no han sido marcadas como 'sentada' o 'completada'
    UPDATE reservations 
    SET 
        status = 'noshow',
        updated_at = NOW()
    WHERE status IN ('confirmada', 'pendiente')
    AND reservation_date = CURRENT_DATE
    AND reservation_time < (CURRENT_TIME - INTERVAL '15 minutes');

    GET DIAGNOSTICS marked_count = ROW_COUNT;
    
    RETURN marked_count;
END;
$$;

-- Función para obtener predicciones de no-shows para próximas reservas
CREATE OR REPLACE FUNCTION predict_upcoming_noshows(
    p_restaurant_id uuid,
    p_days_ahead integer DEFAULT 2
)
RETURNS TABLE (
    reservation_id uuid,
    customer_name varchar,
    reservation_date date,
    reservation_time time,
    party_size integer,
    risk_score integer,
    risk_level varchar,
    risk_factors text[],
    recommended_action varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH customer_history AS (
        SELECT 
            customer_id,
            COUNT(*) as total_visits,
            COUNT(*) FILTER (WHERE status = 'noshow') as total_noshows,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    COUNT(*) FILTER (WHERE status = 'noshow')::numeric / COUNT(*)::numeric
                ELSE 0
            END as noshow_rate,
            MAX(reservation_date) as last_visit,
            CURRENT_DATE - MAX(reservation_date) as days_since_last
        FROM reservations
        WHERE restaurant_id = p_restaurant_id
        AND customer_id IS NOT NULL
        GROUP BY customer_id
    ),
    upcoming_with_risk AS (
        SELECT 
            r.id as reservation_id,
            r.customer_name,
            r.reservation_date,
            r.reservation_time,
            r.party_size,
            COALESCE(ch.noshow_rate, 0) as historical_noshow_rate,
            COALESCE(ch.days_since_last, 0) as days_since_last_visit,
            -- Cálculo de score de riesgo
            LEAST(100, 
                (COALESCE(ch.noshow_rate, 0) * 40) + -- Factor histórico (0-40 puntos)
                (CASE 
                    WHEN COALESCE(ch.days_since_last, 0) > 180 THEN 25
                    WHEN COALESCE(ch.days_since_last, 0) > 90 THEN 15
                    ELSE 0
                END) + -- Factor inactividad (0-25 puntos)
                (CASE 
                    WHEN EXTRACT(HOUR FROM r.reservation_time) >= 21 THEN 15
                    ELSE 0
                END) + -- Factor horario (0-15 puntos)
                (CASE 
                    WHEN r.party_size >= 6 THEN 10
                    ELSE 0
                END) + -- Factor tamaño grupo (0-10 puntos)
                (CASE 
                    WHEN r.channel IN ('phone', 'walk-in') THEN 10
                    ELSE 0
                END) -- Factor canal (0-10 puntos)
            )::integer as calculated_risk_score
        FROM reservations r
        LEFT JOIN customer_history ch ON r.customer_id = ch.customer_id
        WHERE r.restaurant_id = p_restaurant_id
        AND r.status IN ('confirmada', 'pendiente')
        AND r.reservation_date >= CURRENT_DATE
        AND r.reservation_date <= CURRENT_DATE + INTERVAL '1 day' * p_days_ahead
    )
    SELECT 
        uwr.reservation_id,
        uwr.customer_name,
        uwr.reservation_date,
        uwr.reservation_time,
        uwr.party_size,
        uwr.calculated_risk_score as risk_score,
        CASE 
            WHEN uwr.calculated_risk_score > 60 THEN 'high'
            WHEN uwr.calculated_risk_score > 30 THEN 'medium'
            ELSE 'low'
        END as risk_level,
        -- Factores de riesgo identificados
        ARRAY_REMOVE(ARRAY[
            CASE WHEN uwr.historical_noshow_rate > 0.3 THEN 'Alto historial no-shows' END,
            CASE WHEN uwr.days_since_last_visit > 180 THEN 'Cliente inactivo >6 meses' END,
            CASE WHEN uwr.days_since_last_visit > 90 THEN 'Cliente poco frecuente' END,
            CASE WHEN EXTRACT(HOUR FROM uwr.reservation_time) >= 21 THEN 'Horario alto riesgo' END,
            CASE WHEN uwr.party_size >= 6 THEN 'Grupo grande' END
        ], NULL) as risk_factors,
        -- Acción recomendada
        CASE 
            WHEN uwr.calculated_risk_score > 60 THEN 'Llamada de confirmación'
            WHEN uwr.calculated_risk_score > 30 THEN 'WhatsApp recordatorio'
            ELSE 'Recordatorio estándar'
        END as recommended_action
    FROM upcoming_with_risk uwr
    WHERE uwr.calculated_risk_score > 20 -- Solo mostrar reservas con riesgo significativo
    ORDER BY uwr.calculated_risk_score DESC, uwr.reservation_date ASC, uwr.reservation_time ASC;
END;
$$;

-- Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_reservations_noshow_analysis 
ON reservations (restaurant_id, customer_id, status, reservation_date, created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_upcoming_risk 
ON reservations (restaurant_id, status, reservation_date, reservation_time) 
WHERE status IN ('confirmada', 'pendiente');

-- Comentarios para documentación
COMMENT ON FUNCTION get_customer_noshow_stats IS 'Obtiene estadísticas históricas de no-shows por cliente para análisis predictivo';
COMMENT ON FUNCTION get_restaurant_noshow_metrics IS 'Métricas generales de no-shows del restaurante con tendencias';
COMMENT ON FUNCTION auto_mark_noshows IS 'Marca automáticamente como no-show las reservas con más de 15 min de retraso';
COMMENT ON FUNCTION predict_upcoming_noshows IS 'Predice qué reservas próximas tienen mayor riesgo de no-show';

-- Verificar que las funciones se crearon correctamente
SELECT 
    routine_name,
    routine_type,
    'Función creada exitosamente' as status
FROM information_schema.routines 
WHERE routine_name IN (
    'get_customer_noshow_stats',
    'get_restaurant_noshow_metrics', 
    'auto_mark_noshows',
    'predict_upcoming_noshows'
)
AND routine_schema = 'public';

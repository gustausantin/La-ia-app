-- ========================================
-- FIX: Eliminar versiones conflictivas y crear solo UNA función
-- ========================================

-- 1. Eliminar TODAS las versiones existentes
DROP FUNCTION IF EXISTS get_restaurant_noshow_metrics(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_noshow_metrics(UUID, INT) CASCADE;

-- 2. Crear UNA ÚNICA versión con parámetro opcional
CREATE OR REPLACE FUNCTION get_restaurant_noshow_metrics(
    p_restaurant_id UUID,
    p_days_back INT DEFAULT 90
)
RETURNS TABLE(
    prevented_this_month INT,
    noshow_rate NUMERIC,
    monthly_roi NUMERIC,
    high_risk_today INT
) AS $$
DECLARE
    v_start_of_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_total_reservations INT;
    v_noshows INT;
    v_prevented INT;
    v_high_risk_today INT;
    v_avg_ticket NUMERIC := 35.00; -- Ticket promedio por persona
    v_avg_party_size NUMERIC;
BEGIN
    -- 1. Contar No-Shows evitados este mes (de noshow_actions)
    SELECT COUNT(*)
    INTO v_prevented
    FROM noshow_actions
    WHERE restaurant_id = p_restaurant_id
    AND created_at >= v_start_of_month
    AND (final_outcome = 'prevented' OR prevented_noshow = true);
    
    -- 2. Calcular tasa de no-show (últimos p_days_back días)
    SELECT 
        COUNT(*) FILTER (WHERE status = 'no_show'),
        COUNT(*)
    INTO v_noshows, v_total_reservations
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    AND reservation_date < CURRENT_DATE
    AND status IN ('confirmed', 'completed', 'no_show', 'seated', 'cancelled');
    
    -- 3. Calcular tamaño promedio de grupo
    SELECT COALESCE(AVG(party_size), 2)
    INTO v_avg_party_size
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= v_start_of_month;
    
    -- 4. Contar reservas de riesgo HOY (medium + high)
    SELECT COUNT(*)
    INTO v_high_risk_today
    FROM predict_upcoming_noshows_v2(p_restaurant_id, 0) -- 0 = solo hoy
    WHERE risk_level IN ('medium', 'high');
    
    -- Retornar resultados
    RETURN QUERY
    SELECT 
        v_prevented as prevented_this_month,
        CASE 
            WHEN v_total_reservations > 0 
            THEN ROUND((v_noshows::NUMERIC / v_total_reservations::NUMERIC) * 100, 1)
            ELSE 0::NUMERIC
        END as noshow_rate,
        ROUND((v_prevented * v_avg_party_size * v_avg_ticket)::NUMERIC, 2) as monthly_roi,
        v_high_risk_today as high_risk_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



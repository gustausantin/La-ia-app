-- =========================================
-- VERIFICAR DATOS DE NO-SHOWS INSERTADOS
-- =========================================

-- 1. Contar todas las acciones de no-shows
SELECT 'Total noshow_actions' as tipo, COUNT(*) as cantidad
FROM noshow_actions;

-- 2. Contar reservas de hoy
SELECT 'Reservas hoy' as tipo, COUNT(*) as cantidad  
FROM reservations 
WHERE reservation_date = CURRENT_DATE;

-- 3. Contar acciones por fecha
SELECT 
    'Acciones por fecha' as tipo,
    created_at::date as fecha,
    COUNT(*) as cantidad
FROM noshow_actions 
GROUP BY created_at::date 
ORDER BY fecha DESC;

-- 4. Ver valores de final_outcome
SELECT 
    'Final outcomes' as tipo,
    final_outcome,
    COUNT(*) as cantidad
FROM noshow_actions 
GROUP BY final_outcome;

-- 5. Ver valores de customer_response  
SELECT 
    'Customer responses' as tipo,
    customer_response,
    COUNT(*) as cantidad
FROM noshow_actions 
GROUP BY customer_response;

-- 6. Verificar clientes con churn_risk_score
SELECT 
    'Clientes por riesgo' as tipo,
    CASE 
        WHEN churn_risk_score >= 70 THEN 'Alto'
        WHEN churn_risk_score >= 40 THEN 'Medio' 
        ELSE 'Bajo'
    END as nivel_riesgo,
    COUNT(*) as cantidad
FROM customers 
WHERE churn_risk_score > 0
GROUP BY 
    CASE 
        WHEN churn_risk_score >= 70 THEN 'Alto'
        WHEN churn_risk_score >= 40 THEN 'Medio' 
        ELSE 'Bajo'
    END;

-- ========================================
-- QUERIES PARA MÉTRICAS DE NO-SHOWS
-- Fecha: 19 Septiembre 2025  
-- Descripción: Queries específicas para análisis y métricas del sistema de no-shows
-- ========================================

-- REEMPLAZAR 'YOUR_RESTAURANT_ID' con el ID real del restaurante

-- 📊 QUERY 1: DASHBOARD PRINCIPAL - MÉTRICAS HOY
-- ========================================
SELECT 
    -- Métricas de hoy
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) as acciones_hoy,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE AND risk_level = 'high') as alto_riesgo_hoy,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE AND customer_response = 'confirmed') as confirmadas_hoy,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE AND prevented_noshow = true) as evitados_hoy,
    
    -- Métricas de esta semana
    COUNT(*) FILTER (WHERE reservation_date >= CURRENT_DATE - INTERVAL '7 days') as acciones_semana,
    COUNT(*) FILTER (WHERE reservation_date >= CURRENT_DATE - INTERVAL '7 days' AND prevented_noshow = true) as evitados_semana,
    
    -- Promedios
    ROUND(AVG(risk_score) FILTER (WHERE reservation_date = CURRENT_DATE), 1) as riesgo_promedio_hoy,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / NULLIF(COUNT(*), 0), 
        1
    ) as efectividad_general_pct
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
AND reservation_date >= CURRENT_DATE - INTERVAL '30 days';

-- 📈 QUERY 2: TENDENCIA SEMANAL
-- ========================================
SELECT 
    DATE_TRUNC('week', reservation_date) as semana,
    COUNT(*) as total_acciones,
    COUNT(*) FILTER (WHERE risk_level = 'high') as alto_riesgo,
    COUNT(*) FILTER (WHERE customer_response = 'confirmed') as confirmadas,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as noshows_evitados,
    ROUND(AVG(risk_score), 1) as riesgo_promedio,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE customer_response != 'no_response') / COUNT(*), 
        1
    ) as tasa_respuesta_pct,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / COUNT(*), 
        1
    ) as efectividad_pct
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
AND reservation_date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', reservation_date)
ORDER BY semana DESC;

-- 🎯 QUERY 3: EFECTIVIDAD POR PLANTILLA
-- ========================================
SELECT 
    template_name,
    action_type,
    COUNT(*) as total_enviados,
    COUNT(*) FILTER (WHERE customer_response = 'confirmed') as confirmadas,
    COUNT(*) FILTER (WHERE customer_response = 'cancelled') as canceladas,
    COUNT(*) FILTER (WHERE customer_response = 'no_response') as sin_respuesta,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as evitados,
    
    -- Porcentajes
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE customer_response != 'no_response') / COUNT(*), 
        1
    ) as tasa_respuesta_pct,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / COUNT(*), 
        1
    ) as efectividad_pct,
    
    -- Tiempo promedio de respuesta
    AVG(EXTRACT(EPOCH FROM response_time) / 60)::INTEGER as tiempo_respuesta_promedio_min
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
AND template_name IS NOT NULL
GROUP BY template_name, action_type
ORDER BY efectividad_pct DESC;

-- 🔍 QUERY 4: ANÁLISIS DE FACTORES DE RIESGO
-- ========================================
WITH risk_factors_expanded AS (
    SELECT 
        jsonb_array_elements_text(risk_factors) as factor,
        prevented_noshow,
        customer_response,
        risk_score,
        final_outcome
    FROM noshow_actions 
    WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
    AND risk_factors IS NOT NULL
    AND jsonb_array_length(risk_factors) > 0
)
SELECT 
    factor,
    COUNT(*) as total_casos,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as casos_evitados,
    COUNT(*) FILTER (WHERE customer_response = 'confirmed') as confirmaron,
    COUNT(*) FILTER (WHERE final_outcome = 'no_show') as no_shows_finales,
    ROUND(AVG(risk_score), 1) as riesgo_promedio,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / COUNT(*), 
        1
    ) as efectividad_pct,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE customer_response != 'no_response') / COUNT(*), 
        1
    ) as tasa_respuesta_pct
FROM risk_factors_expanded
GROUP BY factor
HAVING COUNT(*) >= 5 -- Solo factores con suficientes casos
ORDER BY efectividad_pct DESC;

-- ⏰ QUERY 5: ANÁLISIS POR HORA DEL DÍA
-- ========================================
SELECT 
    EXTRACT(HOUR FROM reservation_time) as hora,
    COUNT(*) as total_reservas,
    COUNT(*) FILTER (WHERE risk_level = 'high') as alto_riesgo,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as evitados,
    ROUND(AVG(risk_score), 1) as riesgo_promedio,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE risk_level = 'high') / COUNT(*), 
        1
    ) as porcentaje_alto_riesgo
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
GROUP BY EXTRACT(HOUR FROM reservation_time)
ORDER BY hora;

-- 📅 QUERY 6: ANÁLISIS POR DÍA DE LA SEMANA
-- ========================================
SELECT 
    CASE EXTRACT(DOW FROM reservation_date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as dia_semana,
    EXTRACT(DOW FROM reservation_date) as dow_num,
    COUNT(*) as total_acciones,
    COUNT(*) FILTER (WHERE risk_level = 'high') as alto_riesgo,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as evitados,
    ROUND(AVG(risk_score), 1) as riesgo_promedio,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / COUNT(*), 
        1
    ) as efectividad_pct
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
GROUP BY EXTRACT(DOW FROM reservation_date)
ORDER BY dow_num;

-- 💰 QUERY 7: IMPACTO ECONÓMICO (ROI)
-- ========================================
WITH economic_impact AS (
    SELECT 
        COUNT(*) FILTER (WHERE prevented_noshow = true) as noshows_evitados,
        COUNT(*) FILTER (WHERE final_outcome = 'no_show') as noshows_ocurridos,
        COUNT(*) as total_acciones,
        
        -- Estimaciones económicas (ajustar según tu restaurante)
        COUNT(*) FILTER (WHERE prevented_noshow = true) * 35.00 as ingresos_salvados_euros, -- 35€ ticket promedio
        COUNT(*) * 0.10 as costo_sistema_euros -- 10 céntimos por mensaje
    FROM noshow_actions 
    WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
    AND reservation_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    noshows_evitados,
    noshows_ocurridos,
    total_acciones,
    ingresos_salvados_euros,
    costo_sistema_euros,
    ROUND(ingresos_salvados_euros - costo_sistema_euros, 2) as beneficio_neto_euros,
    ROUND(
        (ingresos_salvados_euros - costo_sistema_euros) / NULLIF(costo_sistema_euros, 0), 
        1
    ) as roi_ratio,
    ROUND(
        100.0 * noshows_evitados / NULLIF(noshows_evitados + noshows_ocurridos, 0), 
        1
    ) as tasa_prevencion_pct
FROM economic_impact;

-- 🚀 QUERY 8: TOP CLIENTES DE RIESGO
-- ========================================
SELECT 
    customer_name,
    customer_phone,
    COUNT(*) as total_acciones,
    COUNT(*) FILTER (WHERE risk_level = 'high') as acciones_alto_riesgo,
    COUNT(*) FILTER (WHERE customer_response = 'confirmed') as veces_confirmo,
    COUNT(*) FILTER (WHERE final_outcome = 'no_show') as noshows_finales,
    ROUND(AVG(risk_score), 1) as riesgo_promedio,
    MAX(sent_at) as ultima_accion,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE customer_response = 'confirmed') / COUNT(*), 
        1
    ) as tasa_confirmacion_pct
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
AND reservation_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY customer_name, customer_phone
HAVING COUNT(*) >= 2 -- Solo clientes con múltiples acciones
ORDER BY riesgo_promedio DESC, noshows_finales DESC
LIMIT 20;

-- 📊 QUERY 9: RESUMEN EJECUTIVO
-- ========================================
WITH stats AS (
    SELECT 
        COUNT(*) as total_acciones,
        COUNT(*) FILTER (WHERE prevented_noshow = true) as noshows_evitados,
        COUNT(*) FILTER (WHERE final_outcome = 'no_show') as noshows_ocurridos,
        COUNT(*) FILTER (WHERE customer_response != 'no_response') as respondieron,
        AVG(EXTRACT(EPOCH FROM response_time) / 60) as tiempo_respuesta_promedio_min,
        COUNT(*) FILTER (WHERE prevented_noshow = true) * 35.00 as valor_salvado_euros
    FROM noshow_actions 
    WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
    AND reservation_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    total_acciones as "Total Acciones (30 días)",
    noshows_evitados as "No-Shows Evitados",
    noshows_ocurridos as "No-Shows Ocurridos",
    ROUND(
        100.0 * noshows_evitados / NULLIF(noshows_evitados + noshows_ocurridos, 0), 
        1
    ) as "Tasa Prevención %",
    ROUND(
        100.0 * respondieron / total_acciones, 
        1
    ) as "Tasa Respuesta %",
    ROUND(tiempo_respuesta_promedio_min::NUMERIC, 1) as "Tiempo Respuesta Promedio (min)",
    ROUND(valor_salvado_euros, 2) as "Valor Salvado (€)"
FROM stats;

-- 🔄 QUERY 10: PARA ACTUALIZAR DASHBOARD EN TIEMPO REAL
-- ========================================
SELECT 
    -- Para el widget de No-Shows
    COUNT(*) FILTER (
        WHERE reservation_date = CURRENT_DATE 
        AND risk_level = 'high'
    ) as alto_riesgo_hoy,
    
    COUNT(*) FILTER (
        WHERE reservation_date >= CURRENT_DATE - INTERVAL '7 days'
        AND prevented_noshow = true
    ) as evitados_esta_semana,
    
    -- Para el widget de valor generado
    COUNT(*) FILTER (
        WHERE reservation_date >= CURRENT_DATE - INTERVAL '7 days'
        AND prevented_noshow = true
    ) * 35.00 as valor_generado_euros_semana,
    
    -- Métricas adicionales
    COUNT(*) FILTER (
        WHERE reservation_date >= CURRENT_DATE - INTERVAL '30 days'
    ) as total_acciones_mes,
    
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / 
        NULLIF(COUNT(*), 0), 1
    ) as efectividad_general_pct
    
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID';

-- =====================================================
-- VERIFICACIÓN DE COHERENCIA - VERSIÓN CON RESULTADOS
-- =====================================================
-- Esta versión DEVUELVE los resultados como una tabla

WITH restaurant_data AS (
    SELECT id 
    FROM restaurants 
    WHERE name = 'Tavertet' 
    LIMIT 1
),
dashboard_metrics AS (
    SELECT 
        -- No-shows gestionados hoy
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND reservation_date = CURRENT_DATE) as noshows_today,
        
        -- Reservas de hoy
        (SELECT COUNT(*) FROM reservations 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND reservation_date = CURRENT_DATE) as reservations_today,
        
        -- Clientes activos (no inactivos)
        (SELECT COUNT(*) FROM customers 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND COALESCE(segment_auto, 'nuevo') != 'inactivo') as active_customers,
        
        -- Oportunidades CRM pendientes
        (SELECT COUNT(*) FROM crm_suggestions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND status = 'pending') as crm_opportunities,
        
        -- No-shows prevenidos esta semana
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'
         AND (customer_response = 'confirmed' OR prevented_noshow = true)) as weekly_prevented,
        
        -- Alto riesgo hoy
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND reservation_date = CURRENT_DATE
         AND risk_level = 'high') as today_high_risk
),
noshows_page_metrics AS (
    SELECT 
        -- Alto riesgo hoy (debe coincidir con Dashboard)
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND reservation_date = CURRENT_DATE
         AND risk_level = 'high') as today_high_risk,
        
        -- Prevenidos semana (debe coincidir con Dashboard)
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'
         AND (customer_response = 'confirmed' OR prevented_noshow = true)) as weekly_prevented,
        
        -- No-shows recientes (últimos 5)
        (SELECT COUNT(*) FROM (
            SELECT 1 FROM noshow_actions
            WHERE restaurant_id = (SELECT id FROM restaurant_data)
            ORDER BY created_at DESC
            LIMIT 5
        ) recent) as recent_count
),
crm_metrics AS (
    SELECT 
        -- Mensajes enviados esta semana
        (SELECT COUNT(*) FROM customer_interactions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND created_at >= CURRENT_DATE - INTERVAL '7 days') as messages_sent,
        
        -- Segmentos
        (SELECT COUNT(*) FROM customers 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND COALESCE(segment_auto, segment_manual, 'nuevo') = 'activo') as active_count,
        
        (SELECT COUNT(*) FROM customers 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND COALESCE(segment_auto, segment_manual, 'nuevo') = 'riesgo') as risk_count,
        
        (SELECT COUNT(*) FROM customers 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND COALESCE(segment_auto, segment_manual, 'nuevo') = 'inactivo') as inactive_count
),
reservas_metrics AS (
    SELECT 
        -- Reservas del agente IA
        (SELECT COUNT(*) FROM reservations 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND reservation_source = 'ia') as ia_count,
        
        -- Reservas manuales
        (SELECT COUNT(*) FROM reservations 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND (reservation_source = 'manual' OR reservation_source IS NULL)) as manual_count,
        
        -- Reservas canceladas
        (SELECT COUNT(*) FROM reservations 
         WHERE restaurant_id = (SELECT id FROM restaurant_data)
         AND status = 'cancelled') as cancelled_count
),
clientes_metrics AS (
    SELECT 
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data)) as total,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual, 'nuevo') = 'nuevo') as nuevo,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual) = 'regular') as regular,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual) = 'vip') as vip,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual) = 'ocasional') as ocasional,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual) = 'inactivo') as inactivo,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual) = 'en_riesgo') as en_riesgo,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND COALESCE(segment_auto, segment_manual) = 'alto_valor') as alto_valor
)
-- RESULTADOS FINALES
SELECT 
    '📊 DASHBOARD' as pagina,
    'No-shows hoy' as metrica,
    d.noshows_today::text as valor,
    '✅ OK' as estado
FROM dashboard_metrics d
UNION ALL
SELECT 
    '📊 DASHBOARD',
    'Reservas hoy',
    d.reservations_today::text,
    '✅ OK'
FROM dashboard_metrics d
UNION ALL
SELECT 
    '📊 DASHBOARD',
    'Clientes activos',
    d.active_customers::text,
    '✅ OK'
FROM dashboard_metrics d
UNION ALL
SELECT 
    '📊 DASHBOARD',
    'CRM pendientes',
    d.crm_opportunities::text,
    '✅ OK'
FROM dashboard_metrics d
UNION ALL
SELECT 
    '📊 DASHBOARD',
    'Prevenidos semana',
    d.weekly_prevented::text,
    '✅ OK'
FROM dashboard_metrics d
UNION ALL
SELECT 
    '📊 DASHBOARD',
    'Alto riesgo hoy',
    d.today_high_risk::text,
    '✅ OK'
FROM dashboard_metrics d

UNION ALL

SELECT 
    '🛡️ NO-SHOWS',
    'Alto riesgo hoy',
    n.today_high_risk::text,
    CASE 
        WHEN n.today_high_risk = (SELECT today_high_risk FROM dashboard_metrics) 
        THEN '✅ COHERENTE' 
        ELSE '❌ INCOHERENTE' 
    END
FROM noshows_page_metrics n
UNION ALL
SELECT 
    '🛡️ NO-SHOWS',
    'Prevenidos semana',
    n.weekly_prevented::text,
    CASE 
        WHEN n.weekly_prevented = (SELECT weekly_prevented FROM dashboard_metrics) 
        THEN '✅ COHERENTE' 
        ELSE '❌ INCOHERENTE' 
    END
FROM noshows_page_metrics n
UNION ALL
SELECT 
    '🛡️ NO-SHOWS',
    'Recientes mostrados',
    n.recent_count::text,
    '✅ OK'
FROM noshows_page_metrics n

UNION ALL

SELECT 
    '💬 CRM',
    'Mensajes enviados',
    c.messages_sent::text,
    '✅ OK'
FROM crm_metrics c
UNION ALL
SELECT 
    '💬 CRM',
    'Clientes activos',
    c.active_count::text,
    '✅ OK'
FROM crm_metrics c
UNION ALL
SELECT 
    '💬 CRM',
    'Clientes riesgo',
    c.risk_count::text,
    '✅ OK'
FROM crm_metrics c
UNION ALL
SELECT 
    '💬 CRM',
    'Clientes inactivos',
    c.inactive_count::text,
    '✅ OK'
FROM crm_metrics c

UNION ALL

SELECT 
    '📅 RESERVAS',
    'Reservas IA',
    r.ia_count::text,
    '✅ OK'
FROM reservas_metrics r
UNION ALL
SELECT 
    '📅 RESERVAS',
    'Reservas manuales',
    r.manual_count::text,
    '✅ OK'
FROM reservas_metrics r
UNION ALL
SELECT 
    '📅 RESERVAS',
    'Reservas canceladas',
    r.cancelled_count::text,
    '✅ OK'
FROM reservas_metrics r
UNION ALL
SELECT 
    '📅 RESERVAS',
    'Tasa cancelación',
    CASE 
        WHEN (r.ia_count + r.manual_count) > 0 
        THEN ROUND((r.cancelled_count::NUMERIC / (r.ia_count + r.manual_count)) * 100, 1)::text || '%'
        ELSE '0%' 
    END,
    '✅ OK'
FROM reservas_metrics r

UNION ALL

SELECT 
    '👥 CLIENTES',
    'Total clientes',
    cl.total::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'Nuevo',
    cl.nuevo::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'Regular',
    cl.regular::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'VIP',
    cl.vip::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'Ocasional',
    cl.ocasional::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'Inactivo',
    cl.inactivo::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'En riesgo',
    cl.en_riesgo::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'Alto valor',
    cl.alto_valor::text,
    '✅ OK'
FROM clientes_metrics cl
UNION ALL
SELECT 
    '👥 CLIENTES',
    'SUMA SEGMENTOS',
    (cl.nuevo + cl.regular + cl.vip + cl.ocasional + cl.inactivo + cl.en_riesgo + cl.alto_valor)::text,
    CASE 
        WHEN cl.total = (cl.nuevo + cl.regular + cl.vip + cl.ocasional + cl.inactivo + cl.en_riesgo + cl.alto_valor)
        THEN '✅ COHERENTE'
        ELSE '❌ INCOHERENTE: Total=' || cl.total || ' != Suma=' || 
             (cl.nuevo + cl.regular + cl.vip + cl.ocasional + cl.inactivo + cl.en_riesgo + cl.alto_valor)
    END
FROM clientes_metrics cl

UNION ALL

-- RESUMEN DE PROBLEMAS
SELECT 
    '⚠️ RESUMEN',
    'Problemas detectados',
    (
        CASE 
            WHEN (SELECT today_high_risk FROM dashboard_metrics) != (SELECT today_high_risk FROM noshows_page_metrics) THEN 1 
            ELSE 0 
        END +
        CASE 
            WHEN (SELECT weekly_prevented FROM dashboard_metrics) != (SELECT weekly_prevented FROM noshows_page_metrics) THEN 1 
            ELSE 0 
        END +
        CASE 
            WHEN (SELECT total FROM clientes_metrics) != 
                 (SELECT nuevo + regular + vip + ocasional + inactivo + en_riesgo + alto_valor FROM clientes_metrics) THEN 1 
            ELSE 0 
        END
    )::text,
    CASE 
        WHEN (
            CASE WHEN (SELECT today_high_risk FROM dashboard_metrics) != (SELECT today_high_risk FROM noshows_page_metrics) THEN 1 ELSE 0 END +
            CASE WHEN (SELECT weekly_prevented FROM dashboard_metrics) != (SELECT weekly_prevented FROM noshows_page_metrics) THEN 1 ELSE 0 END +
            CASE WHEN (SELECT total FROM clientes_metrics) != (SELECT nuevo + regular + vip + ocasional + inactivo + en_riesgo + alto_valor FROM clientes_metrics) THEN 1 ELSE 0 END
        ) = 0
        THEN '✅ TODO COHERENTE'
        ELSE '❌ HAY INCOHERENCIAS'
    END

ORDER BY pagina, metrica;

-- =========================================
-- VERIFICAR POR QUÉ NO APARECEN NO-SHOWS
-- =========================================

-- 1. Contar no-shows totales
SELECT 
    'TOTAL NO-SHOWS' as tipo,
    COUNT(*) as cantidad
FROM noshow_actions 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';

-- 2. No-shows para HOY
SELECT 
    'NO-SHOWS HOY' as tipo,
    COUNT(*) as cantidad
FROM noshow_actions 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND reservation_date = CURRENT_DATE;

-- 3. Detalles de HOY
SELECT 
    customer_name,
    reservation_time,
    risk_level,
    customer_response,
    final_outcome,
    created_at
FROM noshow_actions 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND reservation_date = CURRENT_DATE
ORDER BY reservation_time;

-- 4. Por niveles de riesgo HOY
SELECT 
    risk_level,
    COUNT(*) as cantidad
FROM noshow_actions 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND reservation_date = CURRENT_DATE
GROUP BY risk_level;

-- 5. Estados de respuesta HOY
SELECT 
    customer_response,
    COUNT(*) as cantidad
FROM noshow_actions 
WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
AND reservation_date = CURRENT_DATE
GROUP BY customer_response;
